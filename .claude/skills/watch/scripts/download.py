#!/usr/bin/env python3
"""Download a video via yt-dlp, or resolve a local file path.

Also fetches subtitles (manual first, then auto-generated) in VTT format so
transcribe.py can parse them without needing Whisper.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

from tooling import resolve_media_binary as _resolve_media_binary
from tooling import resolve_ytdlp_command as _resolve_ytdlp_command


VIDEO_EXTS = {".mp4", ".mkv", ".webm", ".mov", ".m4v", ".avi", ".flv", ".wmv"}


def is_url(source: str) -> bool:
    if source.startswith("-"):
        return False
    parsed = urlparse(source)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def resolve_local(path: str) -> dict:
    p = Path(path).expanduser().resolve()
    if not p.exists():
        raise SystemExit(f"File not found: {p}")
    if p.suffix.lower() not in VIDEO_EXTS:
        print(
            f"[watch] warning: {p.suffix} is not a known video extension, proceeding anyway",
            file=sys.stderr,
        )
    return {
        "video_path": str(p),
        "subtitle_path": None,
        "info": {"title": p.name, "url": str(p)},
        "downloaded": False,
    }


def _pick_subtitle(out_dir: Path) -> Path | None:
    candidates = sorted(out_dir.glob("video*.vtt"))
    if not candidates:
        return None
    preferred = [c for c in candidates if ".en" in c.name]
    return preferred[0] if preferred else candidates[0]


def _pick_video(out_dir: Path) -> Path | None:
    for ext in (".mp4", ".mkv", ".webm", ".mov"):
        for candidate in out_dir.glob(f"video*{ext}"):
            return candidate
    for candidate in out_dir.glob("video.*"):
        if candidate.suffix.lower() in VIDEO_EXTS:
            return candidate
    return None


def resolve_ytdlp_command() -> list[str] | None:
    return _resolve_ytdlp_command(which=shutil.which)


def resolve_media_binary(name: str) -> str | None:
    return _resolve_media_binary(name, which=shutil.which)


def build_ytdlp_command(
    url: str,
    output_template: Path | str,
    *,
    cookies_from_browser: str | None = None,
    cookies: Path | str | None = None,
) -> list[str]:
    if cookies_from_browser and cookies:
        raise SystemExit("Use either --cookies-from-browser or --cookies, not both")

    ytdlp = resolve_ytdlp_command()
    if ytdlp is None:
        raise SystemExit(
            "yt-dlp is not installed. Run `python scripts/setup.py` to install it locally."
        )

    cmd = [
        *ytdlp,
        "-N", "8",
        "-f", "bv*+ba/b",
        "-S", "res:720,br:1000",
        "--merge-output-format", "mp4",
        "--write-info-json",
        "--write-subs",
        "--write-auto-subs",
        "--sub-langs", "en,en-US,en-GB,en-orig",
        "--sub-format", "vtt",
        "--convert-subs", "vtt",
        "--no-playlist",
        "--ignore-errors",
        "-o", str(output_template),
    ]

    ffmpeg = resolve_media_binary("ffmpeg")
    if ffmpeg:
        cmd += ["--ffmpeg-location", str(Path(ffmpeg).parent)]

    if cookies_from_browser:
        cmd += ["--cookies-from-browser", cookies_from_browser]
    if cookies:
        cmd += ["--cookies", str(cookies)]

    cmd += ["--", url]
    return cmd


def download_url(
    url: str,
    out_dir: Path,
    *,
    cookies_from_browser: str | None = None,
    cookies: Path | str | None = None,
    force_download: bool = False,
) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    video = _pick_video(out_dir)
    if not force_download and video is not None:
        print(f"[watch] reusing existing downloaded video: {video}", file=sys.stderr)
    else:
        output_template = out_dir / "video.%(ext)s"

        cmd = build_ytdlp_command(
            url,
            output_template,
            cookies_from_browser=cookies_from_browser,
            cookies=cookies,
        )

        # yt-dlp may exit non-zero if a subtitle variant fails (e.g. 429) even when
        # the video itself downloaded fine. Treat "video file present" as success.
        result = subprocess.run(cmd, stdout=sys.stderr, stderr=sys.stderr)
        video = _pick_video(out_dir)
        if video is None:
            auth_hint = (
                " If this URL opens in your browser only while logged in, rerun with "
                "`--cookies-from-browser chrome` (or edge/firefox) or `--cookies PATH`."
                if not cookies_from_browser and not cookies else
                " Cookies were provided, but yt-dlp still could not access the media; "
                "check that the browser/profile is logged in and supported by yt-dlp."
            )
            raise SystemExit(
                f"yt-dlp did not produce a video file in {out_dir} "
                f"(exit {result.returncode}).{auth_hint}"
            )

    subtitle = _pick_subtitle(out_dir)
    info_path = out_dir / "video.info.json"
    info: dict = {}
    if info_path.exists():
        try:
            raw = json.loads(info_path.read_text(encoding="utf-8"))
            info = {
                "title": raw.get("title"),
                "uploader": raw.get("uploader") or raw.get("channel"),
                "duration": raw.get("duration"),
                "url": raw.get("webpage_url") or url,
            }
        except Exception as exc:
            print(f"[watch] info.json parse failed: {exc}", file=sys.stderr)
            info = {"url": url}

    return {
        "video_path": str(video),
        "subtitle_path": str(subtitle) if subtitle else None,
        "info": info or {"url": url},
        "downloaded": True,
    }


def download(
    source: str,
    out_dir: Path,
    *,
    cookies_from_browser: str | None = None,
    cookies: Path | str | None = None,
    force_download: bool = False,
) -> dict:
    if is_url(source):
        return download_url(
            source,
            out_dir,
            cookies_from_browser=cookies_from_browser,
            cookies=cookies,
            force_download=force_download,
        )
    return resolve_local(source)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("usage: download.py <url-or-path> <out-dir>", file=sys.stderr)
        raise SystemExit(2)
    result = download(sys.argv[1], Path(sys.argv[2]))
    print(json.dumps(result, indent=2))

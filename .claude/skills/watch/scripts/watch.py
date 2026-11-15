#!/usr/bin/env python3
"""/watch entry point: download video, extract frames, parse transcript.

Prints a markdown report to stdout listing frame paths + transcript. Claude
then Reads each frame path to see the video.
"""
from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(SCRIPT_DIR))

from download import download, is_url  # noqa: E402
from frames import MAX_FPS, auto_fps, auto_fps_focus, auto_fps_overview, extract, format_time, get_metadata, parse_time  # noqa: E402
from transcribe import filter_range, format_transcript, parse_vtt  # noqa: E402
from whisper_local import transcrever  # noqa: E402



def main() -> int:
    if sys.stdout and hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(
        prog="watch",
        description="Download a video, extract auto-scaled frames, and surface the transcript.",
    )
    ap.add_argument("source", help="Video URL or local file path")
    ap.add_argument("--max-frames", type=int, default=80, help="Cap on frame count (default 80, hard max 100)")
    ap.add_argument("--resolution", type=int, default=512, help="Frame width in pixels (default 512)")
    ap.add_argument("--fps", type=float, default=None, help="Override auto-fps")
    ap.add_argument("--start", type=str, default=None, help="Range start (SS, MM:SS, or HH:MM:SS)")
    ap.add_argument("--end", type=str, default=None, help="Range end (SS, MM:SS, or HH:MM:SS)")
    ap.add_argument("--out-dir", type=str, default=None, help="Working directory (default: tmp)")
    ap.add_argument(
        "--agentic",
        action="store_true",
        help="Agentic mode: extract transcript and sparse overview keyframes, enabling on-demand deep inspection.",
    )
    ap.add_argument(
        "--frames-only",
        action="store_true",
        help="Inspection mode: extract frames only for the specified range, skipping transcription.",
    )
    ap.add_argument(
        "--transcript-only",
        action="store_true",
        help="Extract transcript only, skipping all frame extraction.",
    )
    ap.add_argument(
        "--overview-frames",
        type=int,
        default=4,
        help="Number of overview keyframes in --agentic mode (default: 4)",
    )
    ap.add_argument(
        "--force-download",
        action="store_true",
        help="Force re-downloading even if a cached video exists in the work dir.",
    )
    cookie_group = ap.add_mutually_exclusive_group()
    cookie_group.add_argument(
        "--cookies-from-browser",
        type=str,
        default=None,
        metavar="BROWSER[:PROFILE]",
        help="Pass browser cookies to yt-dlp for login-required pages (e.g. chrome, edge, firefox)",
    )
    cookie_group.add_argument(
        "--cookies",
        type=str,
        default=None,
        metavar="PATH",
        help="Pass a Netscape-format cookies.txt file to yt-dlp",
    )
    ap.add_argument(
        "--no-whisper",
        action="store_true",
        help="Disable Whisper fallback. Report frames-only if no captions available.",
    )
    ap.add_argument(
        "--modelo",
        default=None,
        help="Modelo do Whisper local: tiny, base, small (padrão), medium, large-v3-turbo.",
    )
    args = ap.parse_args()

    max_frames = min(args.max_frames, 100)

    if args.out_dir:
        work = Path(args.out_dir).expanduser().resolve()
    else:
        work = Path(tempfile.mkdtemp(prefix="watch-"))
    work.mkdir(parents=True, exist_ok=True)
    print(f"[watch] working dir: {work}", file=sys.stderr)

    print(
        "[watch] downloading via yt-dlp…" if is_url(args.source) else "[watch] using local file…",
        file=sys.stderr,
    )
    dl = download(
        args.source,
        work / "download",
        cookies_from_browser=args.cookies_from_browser,
        cookies=args.cookies,
        force_download=args.force_download,
    )
    video_path = dl["video_path"]

    meta = get_metadata(video_path)
    full_duration = meta["duration_seconds"]
    start_sec = parse_time(args.start)
    end_sec = parse_time(args.end)

    if start_sec is not None and start_sec < 0:
        raise SystemExit("--start must be non-negative")
    if end_sec is not None and start_sec is not None and end_sec <= start_sec:
        raise SystemExit("--end must be greater than --start")
    if full_duration > 0 and start_sec is not None and start_sec >= full_duration:
        raise SystemExit(f"--start {start_sec:.1f}s is past end of video ({full_duration:.1f}s)")

    effective_start = start_sec if start_sec is not None else 0.0
    effective_end = end_sec if end_sec is not None else full_duration
    effective_duration = max(0.0, effective_end - effective_start)
    focused = start_sec is not None or end_sec is not None

    if args.frames_only:
        # Inspection mode: focus only on extracting frames for the target section
        if focused:
            fps, target = auto_fps_focus(effective_duration, max_frames=max_frames)
        else:
            fps, target = auto_fps(effective_duration, max_frames=max_frames)
        if args.fps is not None:
            fps = min(args.fps, MAX_FPS)
            target = max(1, int(round(fps * effective_duration)))

        scope = (
            f"{format_time(effective_start)}-{format_time(effective_end)} ({effective_duration:.1f}s)"
            if focused else f"full {effective_duration:.1f}s"
        )
        print(f"[watch] [frames-only] extracting ~{target} frames at {fps:.3f} fps over {scope}…", file=sys.stderr)

        frames = extract(
            video_path,
            work / "frames",
            fps=fps,
            resolution=args.resolution,
            max_frames=max_frames,
            start_seconds=start_sec,
            end_seconds=end_sec,
        )

        print()
        print("# watch: inspection report")
        print()
        print(f"- **Source:** {args.source}")
        if meta.get("width") and meta.get("height"):
            print(f"- **Resolution:** {meta['width']}x{meta['height']} ({meta.get('codec') or 'unknown codec'})")
        if focused:
            print(
                f"- **Focus range:** {format_time(effective_start)} → {format_time(effective_end)} "
                f"({effective_duration:.1f}s)"
            )
        print(f"- **Frames:** {len(frames)} @ {fps:.3f} fps (budget {target}, max {max_frames})")
        print(f"- **Frame size:** {args.resolution}px wide")
        print()
        print("## Frames")
        print()
        print(f"Frames live at: `{work / 'frames'}`")
        print()
        print(
            "**Read each frame path below with the Read tool to view the image.** "
            "Frames are in chronological order; `t=MM:SS` is the absolute timestamp in the source video."
        )
        print()
        for frame in frames:
            print(f"- `{frame['path']}` (t={format_time(frame['timestamp_seconds'])})")
        print()
        print("---")
        print(f"_Work dir: `{work}` — delete when done._")
        return 0

    if args.transcript_only:
        frames = []
        fps, target = 0.0, 0
    elif args.agentic and not focused:
        if args.overview_frames > 0:
            fps, target = auto_fps_overview(effective_duration, overview_frames=args.overview_frames)
            if args.fps is not None:
                fps = min(args.fps, MAX_FPS)
                target = max(1, int(round(fps * effective_duration)))
            print(f"[watch] [agentic] extracting ~{target} overview frames at {fps:.3f} fps over full {effective_duration:.1f}s…", file=sys.stderr)
            frames = extract(
                video_path,
                work / "frames",
                fps=fps,
                resolution=args.resolution,
                max_frames=target,
                start_seconds=start_sec,
                end_seconds=end_sec,
            )
        else:
            frames = []
            fps, target = 0.0, 0
    elif focused:
        fps, target = auto_fps_focus(effective_duration, max_frames=max_frames)
        if args.fps is not None:
            fps = min(args.fps, MAX_FPS)
            target = max(1, int(round(fps * effective_duration)))
        scope = f"{format_time(effective_start)}-{format_time(effective_end)} ({effective_duration:.1f}s)"
        print(f"[watch] extracting ~{target} frames at {fps:.3f} fps over {scope}…", file=sys.stderr)
        frames = extract(
            video_path,
            work / "frames",
            fps=fps,
            resolution=args.resolution,
            max_frames=max_frames,
            start_seconds=start_sec,
            end_seconds=end_sec,
        )
    else:
        fps, target = auto_fps(effective_duration, max_frames=max_frames)
        if args.fps is not None:
            fps = min(args.fps, MAX_FPS)
            target = max(1, int(round(fps * effective_duration)))
        scope = f"full {effective_duration:.1f}s"
        print(f"[watch] extracting ~{target} frames at {fps:.3f} fps over {scope}…", file=sys.stderr)
        frames = extract(
            video_path,
            work / "frames",
            fps=fps,
            resolution=args.resolution,
            max_frames=max_frames,
            start_seconds=start_sec,
            end_seconds=end_sec,
        )

    transcript_segments: list[dict] = []
    transcript_text: str | None = None
    transcript_source: str | None = None
    if dl.get("subtitle_path"):
        try:
            all_segments = parse_vtt(dl["subtitle_path"])
            transcript_segments = filter_range(all_segments, start_sec, end_sec) if focused else all_segments
            transcript_text = format_transcript(transcript_segments)
            transcript_source = "captions"
        except Exception as exc:
            print(f"[watch] subtitle parse failed: {exc}", file=sys.stderr)

    if not transcript_segments and not args.no_whisper:
        try:
            all_segments = transcrever(str(video_path), modelo=args.modelo)
            transcript_segments = filter_range(all_segments, start_sec, end_sec) if focused else all_segments
            transcript_text = format_transcript(transcript_segments)
            transcript_source = f"whisper local ({args.modelo or 'small'})"
        except SystemExit as exc:
            print(f"[watch] transcrição local falhou: {exc}", file=sys.stderr)

    info = dl.get("info") or {}

    print()
    print("# watch: video report")
    print()
    print(f"- **Source:** {args.source}")
    if info.get("title"):
        print(f"- **Title:** {info['title']}")
    if info.get("uploader"):
        print(f"- **Uploader:** {info['uploader']}")
    print(f"- **Duration:** {format_time(full_duration)} ({full_duration:.1f}s)")
    if focused:
        print(
            f"- **Focus range:** {format_time(effective_start)} → {format_time(effective_end)} "
            f"({effective_duration:.1f}s)"
        )
    if meta.get("width") and meta.get("height"):
        print(f"- **Resolution:** {meta['width']}x{meta['height']} ({meta.get('codec') or 'unknown codec'})")
    mode = (
        "agentic overview"
        if (args.agentic and not focused)
        else ("focused" if focused else ("transcript-only" if args.transcript_only else "full"))
    )
    if args.transcript_only:
        print("- **Frames:** none (transcript-only mode)")
    else:
        print(f"- **Frames:** {len(frames)} @ {fps:.3f} fps, {mode} mode (budget {target}, max {max_frames})")
        print(f"- **Frame size:** {args.resolution}px wide")
    if transcript_segments:
        in_range = " in range" if focused else ""
        print(
            f"- **Transcript:** {len(transcript_segments)} segments{in_range} "
            f"(via {transcript_source or 'captions'})"
        )
    else:
        print("- **Transcript:** none available")

    if not focused and not args.agentic and full_duration > 600:
        mins = int(full_duration // 60)
        print()
        print(
            f"> **Warning:** This is a {mins}-minute video. Frame coverage is sparse at this length — "
            "accuracy degrades noticeably on anything over 10 minutes. For better results, "
            "re-run with `--start HH:MM:SS --end HH:MM:SS` to zoom into a specific section."
        )

    if frames:
        print()
        print("## Frames")
        print()
        print(f"Frames live at: `{work / 'frames'}`")
        print()
        print(
            "**Read each frame path below with the Read tool to view the image.** "
            "Frames are in chronological order; `t=MM:SS` is the absolute timestamp in the source video."
        )
        print()
        for frame in frames:
            print(f"- `{frame['path']}` (t={format_time(frame['timestamp_seconds'])})")

    print()
    print("## Transcript")
    print()
    if transcript_text:
        label = transcript_source or "captions"
        if focused:
            print(f"_Source: {label}. Filtered to {format_time(effective_start)} → {format_time(effective_end)}:_")
        else:
            print(f"_Source: {label}._")
        print()
        print("```")
        print(transcript_text)
        print("```")
    elif focused and dl.get("subtitle_path"):
        print(f"_No transcript lines fell inside {format_time(effective_start)} → {format_time(effective_end)}._")
    else:
        print(
            "_No transcript available — proceed with frames only. "
            "Captions were missing and the local Whisper was skipped (`--no-whisper`) or failed "
            "(install it with `pip install faster-whisper`)._"
        )

    if args.agentic:
        script_path = Path(__file__).resolve()
        print()
        print("## Agentic Video Understanding (On-Demand Deep Inspection)")
        print()
        print("To inspect any moment, motion, or visual detail in higher framerate or resolution, run:")
        print("```bash")
        print(f'python "{script_path}" "{args.source}" --out-dir "{work}" --frames-only --start MM:SS --end MM:SS --fps 2 --resolution 512')
        print("```")

    print()
    print("---")
    print(f"_Work dir: `{work}` — delete when done._")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

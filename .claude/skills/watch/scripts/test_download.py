#!/usr/bin/env python3
"""Tests for the yt-dlp command builder."""
from __future__ import annotations

import unittest
from pathlib import Path
from unittest import mock

import download
from download import build_ytdlp_command


class BuildYtdlpCommandTests(unittest.TestCase):
    def test_prefers_720p_and_moderate_bitrate_for_fast_visual_analysis(self) -> None:
        cmd = build_ytdlp_command(
            "https://example.com/video",
            Path("out") / "video.%(ext)s",
        )

        self.assertIn("-S", cmd)
        self.assertIn("res:720,br:1000", cmd)

    def test_passes_user_space_ffmpeg_location_to_ytdlp(self) -> None:
        cmd = build_ytdlp_command(
            "https://example.com/video",
            Path("out") / "video.%(ext)s",
        )

        self.assertIn("--ffmpeg-location", cmd)

    def test_uses_python_module_when_ytdlp_executable_is_not_on_path(self) -> None:
        resolver = getattr(download, "resolve_ytdlp_command", None)
        if resolver is None:
            self.fail("download.resolve_ytdlp_command is required")

        with mock.patch.object(download.shutil, "which", return_value=None):
            command = resolver()

        self.assertEqual(command[1:], ["-m", "yt_dlp"])

    def test_keeps_public_downloads_cookie_free_by_default(self) -> None:
        cmd = build_ytdlp_command(
            "https://example.com/video",
            Path("out") / "video.%(ext)s",
        )

        self.assertNotIn("--cookies", cmd)
        self.assertNotIn("--cookies-from-browser", cmd)
        self.assertEqual(cmd[-2:], ["--", "https://example.com/video"])

    def test_adds_browser_cookies_before_url_separator(self) -> None:
        cmd = build_ytdlp_command(
            "https://www.instagram.com/reel/example/",
            Path("out") / "video.%(ext)s",
            cookies_from_browser="chrome",
        )

        separator = cmd.index("--")
        self.assertLess(cmd.index("--cookies-from-browser"), separator)
        self.assertIn("chrome", cmd)

    def test_adds_cookie_file_before_url_separator(self) -> None:
        cmd = build_ytdlp_command(
            "https://www.instagram.com/reel/example/",
            Path("out") / "video.%(ext)s",
            cookies=Path("cookies.txt"),
        )

        separator = cmd.index("--")
        self.assertLess(cmd.index("--cookies"), separator)
        self.assertIn(str(Path("cookies.txt")), cmd)


if __name__ == "__main__":
    unittest.main()

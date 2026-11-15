#!/usr/bin/env python3
"""Regression tests for FFmpeg discovery outside PATH."""
from __future__ import annotations

import json
import platform
import subprocess
import unittest
from unittest import mock

import ffmpeg_downloader
import frames


class MediaToolDiscoveryTests(unittest.TestCase):
    @unittest.skipUnless(platform.system() == "Windows", "Windows user-space discovery")
    def test_ffprobe_uses_user_space_ffmpeg_downloader_install(self) -> None:
        payload = {
            "format": {"duration": "12.5", "size": "1000"},
            "streams": [
                {"codec_type": "video", "codec_name": "h264", "width": 720, "height": 1280},
                {"codec_type": "audio"},
            ],
        }
        completed = subprocess.CompletedProcess([], 0, json.dumps(payload), "")

        with (
            mock.patch.object(frames.shutil, "which", return_value=None),
            mock.patch.object(
                ffmpeg_downloader,
                "installed",
                return_value="C:/tools/ffmpeg/bin/ffprobe.exe",
            ),
            mock.patch.object(frames.subprocess, "run", return_value=completed) as run,
        ):
            try:
                metadata = frames.get_metadata("sample.mp4")
            except SystemExit as exc:
                self.fail(f"user-space ffprobe was not discovered: {exc}")

        self.assertEqual(metadata["duration_seconds"], 12.5)
        self.assertEqual(run.call_args.args[0][0], "C:/tools/ffmpeg/bin/ffprobe.exe")


if __name__ == "__main__":
    unittest.main()

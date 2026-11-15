#!/usr/bin/env python3
"""Resolve watch dependencies from PATH or user-space Python installs."""
from __future__ import annotations

import importlib.util
import platform
import shutil
import sys
from collections.abc import Callable


Which = Callable[[str], str | None]


def _directly_executable(path: str) -> bool:
    if platform.system() != "Windows":
        return True
    return path.lower().endswith((".exe", ".com"))


def resolve_media_binary(name: str, *, which: Which | None = None) -> str | None:
    """Find ffmpeg/ffprobe without requiring a system-wide PATH change."""
    lookup = which or shutil.which
    candidate = lookup(name)
    if candidate and _directly_executable(candidate):
        return candidate

    if platform.system() == "Windows":
        try:
            import ffmpeg_downloader
        except ImportError:
            return None
        installed = ffmpeg_downloader.installed(name, return_path=True)
        return str(installed) if installed else None
    return None


def resolve_ytdlp_command(*, which: Which | None = None) -> list[str] | None:
    """Return a directly executable yt-dlp command, falling back to its module."""
    lookup = which or shutil.which
    candidate = lookup("yt-dlp")
    if candidate and _directly_executable(candidate):
        return [candidate]
    if importlib.util.find_spec("yt_dlp") is not None:
        return [sys.executable, "-m", "yt_dlp"]
    return None

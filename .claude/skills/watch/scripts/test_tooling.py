"""O yt-dlp instalado pelo pip (o que o README manda atualizar) vem antes de um .exe solto no PATH."""
import sys
import unittest
from unittest import mock

import tooling


class YtdlpTests(unittest.TestCase):
    def test_prefere_modulo_python(self):
        with mock.patch("importlib.util.find_spec", return_value=object()):
            cmd = tooling.resolve_ytdlp_command(which=lambda _: "C:/velho/yt-dlp.exe")
        self.assertEqual(cmd, [sys.executable, "-m", "yt_dlp"])

    def test_sem_modulo_usa_exe(self):
        with mock.patch("importlib.util.find_spec", return_value=None):
            cmd = tooling.resolve_ytdlp_command(which=lambda _: "C:/x/yt-dlp.exe")
        self.assertEqual(cmd, ["C:/x/yt-dlp.exe"])


if __name__ == "__main__":
    unittest.main()

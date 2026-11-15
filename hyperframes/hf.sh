#!/usr/bin/env bash
# Atalho do HyperFrames: ./hyperframes/hf.sh <pasta-do-projeto> <comando> [opções]
# Ex.: ./hyperframes/hf.sh projetos/meu-filme lint
#      ./hyperframes/hf.sh projetos/meu-filme snapshot --at 1,4,8
#      ./hyperframes/hf.sh projetos/meu-filme render -o ../../../entregas/meu-filme.mp4
# A pasta é relativa a hyperframes/ (ex.: modelos/filme-em-takes ou projetos/<nome>).
# Se o FFmpeg não estiver no PATH, defina FFMPEG_DIR com a pasta onde está o ffmpeg.
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
[ -n "$FFMPEG_DIR" ] && export PATH="$FFMPEG_DIR:$PATH"
if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "FFmpeg não encontrado. Veja a seção \"Instalar o FFmpeg\" do README.md e abra o terminal de novo." >&2
  exit 1
fi
proj="$1"; shift || true
if [ -z "$proj" ] || [ ! -d "$AQUI/$proj" ]; then
  echo "Pasta do projeto não encontrada: hyperframes/$proj" >&2
  exit 1
fi
cd "$AQUI/$proj"
exec npx -y hyperframes@0.8.225 "$@"

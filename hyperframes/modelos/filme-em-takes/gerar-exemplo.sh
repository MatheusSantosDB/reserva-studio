#!/usr/bin/env bash
# Cria 3 clipes coloridos e uma "peça" de exemplo só para testar o modelo (troque pelos seus).
set -e
cd "$(dirname "$0")/assets"
i=1; for cor in 0x1f3b5c 0x5c3b1f 0x2f5c1f; do
  ffmpeg -y -loglevel error -f lavfi -i "color=c=$cor:s=1080x1920:r=30:d=4" -vf "drawgrid=w=120:h=120:t=2:c=white@0.15" -c:v libx264 -pix_fmt yuv420p "take$i.mp4"
  i=$((i+1))
done
ffmpeg -y -loglevel error -f lavfi -i "color=c=0xd9cbb0:s=400x300" -vf "format=rgba,pad=600:600:100:150:color=0x00000000" -frames:v 1 peca.png
echo "Exemplo pronto em $(pwd)"

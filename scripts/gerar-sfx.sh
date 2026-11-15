#!/usr/bin/env bash
# Gera efeitos sonoros simples por síntese (FFmpeg), sem direitos de terceiros. Saída em assets/sfx/.
# Uso: bash scripts/gerar-sfx.sh   (precisa do ffmpeg no PATH ou de FFMPEG_DIR)
set -e
[ -n "$FFMPEG_DIR" ] && export PATH="$FFMPEG_DIR:$PATH"
cd "$(dirname "$0")/../assets/sfx"
F="ffmpeg -y -loglevel error"
# whoosh: ruído filtrado que sobe e desce (transição, corte)
$F -f lavfi -i "anoisesrc=d=0.6:c=pink:a=0.6" -af "bandpass=f=1200:w=900,afade=t=in:d=0.25,afade=t=out:st=0.3:d=0.3,volume=0.7" -ar 48000 whoosh.wav
# pop: estalo curto (entrada de cartão, preço)
$F -f lavfi -i "sine=f=880:d=0.09" -af "afade=t=out:st=0.01:d=0.08,asetrate=48000*1.0,volume=0.8" -ar 48000 pop.wav
# clique: tique seco (lista, contagem)
$F -f lavfi -i "anoisesrc=d=0.03:c=white:a=0.9" -af "highpass=f=3000,afade=t=out:d=0.03" -ar 48000 clique.wav
# impacto: grave curto (revelação, batida forte)
$F -f lavfi -i "sine=f=55:d=0.5" -af "afade=t=out:st=0.05:d=0.45,volume=1.6" -ar 48000 impacto.wav
# sino: dois parciais com decaimento (cupom, final)
$F -f lavfi -i "sine=f=1320:d=1.2" -f lavfi -i "sine=f=1980:d=1.2" -filter_complex "[0][1]amix=inputs=2,afade=t=out:st=0.02:d=1.15,volume=0.6" -ar 48000 sino.wav
# flash: estalo + chiado curto (foto, flash)
$F -f lavfi -i "anoisesrc=d=0.25:c=white:a=0.8" -af "highpass=f=2000,afade=t=out:st=0.02:d=0.22,volume=0.6" -ar 48000 flash.wav
# normaliza tudo para ~ -22 dB de média (abaixo da voz)
for f in whoosh pop clique impacto sino flash; do
  $F -i "$f.wav" -af "loudnorm=I=-22:TP=-3" -ar 48000 "tmp-$f.wav" && mv "tmp-$f.wav" "$f.wav"
done
echo "Efeitos em $(pwd): whoosh pop clique impacto sino flash"

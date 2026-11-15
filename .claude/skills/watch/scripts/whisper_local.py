"""Transcrição local com faster-whisper: roda no computador, sem chave de API e sem enviar áudio.

Uso:
  python whisper_local.py <video-ou-audio> <saida.json> [--palavras] [--modelo small] [--idioma pt]

--palavras  grava uma lista de palavras com tempo ({"text","start","end"}), usada na legenda.
sem ela     grava trechos ({"start","end","text"}), usados pelo /watch.

Primeira vez: pip install faster-whisper (o modelo é baixado sozinho, ~0,5 GB para o "small").
Modelos: tiny, base, small (padrão, bom e rápido), medium, large-v3-turbo (mais preciso e mais lento).
"""
from __future__ import annotations

import json
import os
import sys


def transcrever(caminho: str, palavras: bool = False, modelo: str | None = None, idioma: str | None = None) -> list[dict]:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        raise SystemExit("Falta o faster-whisper. Rode: pip install faster-whisper")
    nome = modelo or os.environ.get("RS_WHISPER_MODELO", "small")
    print(f"[whisper] modelo {nome} no computador (sem internet depois do 1º download)…", file=sys.stderr)
    m = WhisperModel(nome, device="cpu", compute_type="int8")
    segmentos, _ = m.transcribe(caminho, language=idioma, word_timestamps=palavras, vad_filter=False)
    saida: list[dict] = []
    for s in segmentos:
        if palavras:
            for w in s.words or []:
                saida.append({"text": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
        else:
            saida.append({"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip()})
    return saida


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada")
    ap.add_argument("saida")
    ap.add_argument("--palavras", action="store_true")
    ap.add_argument("--modelo")
    ap.add_argument("--idioma", default="pt", help="pt (padrão); use auto para detectar")
    a = ap.parse_args()
    dados = transcrever(a.entrada, palavras=a.palavras, modelo=a.modelo, idioma=None if a.idioma == "auto" else a.idioma)
    with open(a.saida, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=1)
    print(f"[whisper] {len(dados)} {'palavras' if a.palavras else 'trechos'} em {a.saida}", file=sys.stderr)

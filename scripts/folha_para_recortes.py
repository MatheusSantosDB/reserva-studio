"""Folha de personagens ou objetos (grade em fundo verde liso, gerada no Flow ou no Magnific) -> PNGs sem fundo.

  python scripts/folha_para_recortes.py recortes FOLHA.png COLUNAS LINHAS PASTA nome1,nome2,...
  python scripts/folha_para_recortes.py poses    FOLHA.png COLUNAS LINHAS PASTA [prefixo]

recortes: fatia, tira o verde (chroma key com despill) e corta rente a cada elemento.
poses:    fatia, tira o verde e alinha os quadros pelo topo do cabelo e pelo centro da
          cabeça (a mão que sobe não desloca o rosto); saída 'prefixo-NN.png' do mesmo tamanho.

Limites conhecidos (teste de 2026-11-06): objeto translúcido (fita, vidro) pega tom verde;
mão que encosta na borda da célula sai cortada. Peça o fundo cinza neutro nesses casos.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def chroma(im):
    a = np.asarray(im.convert("RGB")).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    verde = g - np.maximum(r, b)
    alfa = np.clip(1 - (verde - 30) / 90, 0, 1)
    saida = np.stack([r, np.minimum(g, np.maximum(r, b) + 8), b], -1)
    out = Image.fromarray(saida.astype(np.uint8)).convert("RGBA")
    out.putalpha(Image.fromarray((alfa * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)))
    return out


def celulas(caminho, cols, linhas):
    im = Image.open(caminho).convert("RGB")
    W, H = im.size
    cw, ch = W // cols, H // linhas
    for r in range(linhas):
        for c in range(cols):
            yield im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))


def recortes(caminho, cols, linhas, pasta, nomes):
    pasta.mkdir(parents=True, exist_ok=True)
    for i, cel in enumerate(celulas(caminho, cols, linhas)):
        nome = nomes[i] if i < len(nomes) else f"rec-{i + 1:02d}"
        k = chroma(cel)
        bb = k.getchannel("A").point(lambda p: 255 if p > 40 else 0).getbbox()
        if bb:
            k = k.crop(bb)
        k.save(pasta / f"{nome}.png")
        print(pasta / f"{nome}.png", k.size)


def poses(caminho, cols, linhas, pasta, pref):
    pasta.mkdir(parents=True, exist_ok=True)
    quadros = [chroma(c) for c in celulas(caminho, cols, linhas)]
    medidas = []
    for q in quadros:
        a = np.asarray(q.getchannel("A")) > 128
        topo = int(np.where(a.any(1))[0].min())
        cx = float(np.median(np.where(a[topo:topo + 60].any(0))[0]))
        medidas.append((topo, cx))
    T = int(np.median([m[0] for m in medidas]))
    CX = int(np.median([m[1] for m in medidas]))
    for i, (q, (topo, cx)) in enumerate(zip(quadros, medidas), 1):
        base = Image.new("RGBA", q.size, (0, 0, 0, 0))
        base.alpha_composite(q, (int(CX - cx), int(T - topo)))
        base.save(pasta / f"{pref}-{i:02d}.png")
        print(pasta / f"{pref}-{i:02d}.png")


if __name__ == "__main__":
    modo, folha, cols, linhas, pasta = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), Path(sys.argv[5])
    extra = sys.argv[6] if len(sys.argv) > 6 else ""
    if modo == "recortes":
        recortes(folha, cols, linhas, pasta, [n for n in extra.split(",") if n])
    else:
        poses(folha, cols, linhas, pasta, extra or "pose")

"""Mockup oficial sem fundo: baixa a foto da peça no site da Reserva e remove o fundo de estúdio.

Uso:
  python scripts/mockup.py <url-ou-arquivo> <saida.png> [--vazado] [--textura] [--corte x0,y0,x1,y1] [--inteiro]

- Use a foto da peça sozinha (sem modelo) e de frente. No site da Reserva, em geral:
  roupa = foto terminada em _04 (peça "fantasma"); tênis e acessório = foto _01.
  As URLs estão na lista "fotos" do produtos.json gerado por scripts/vtex.mjs.
- --textura: para peça clara sobre fundo bege (camisa de linho branca, bermuda areia). Separa pelo
  relevo do tecido, já que o fundo é liso.
- --vazado: não preenche buracos (calça e bermuda: o vão entre as pernas fica transparente).
- --corte x0,y0,x1,y1: corta a foto antes (frações de 0 a 1), quando sobra sombra ou fundo.
  Ex.: --corte 0,0,1,0.92 tira a sombra embaixo da bermuda. Deixe margem dos lados: se a peça
  encostar na borda, o recorte estraga.
- --previa: salva também <saida>-previa.jpg (peça sobre verde) para conferir o recorte.
- --inteiro: mantém o tamanho da foto em vez de cortar justo na peça.

Precisa de: pip install -r requirements.txt
"""
import io, sys, urllib.request
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi


def abrir(origem):
    if origem.startswith("http"):
        req = urllib.request.Request(origem, headers={"User-Agent": "Mozilla/5.0"})
        return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=90).read())).convert("RGB")
    return Image.open(origem).convert("RGB")


def _fundo_polinomial(a, grau=4):
    """Superfície suave (polinômio 2D por canal) ajustada nas bordas da imagem, com rejeição de intrusos."""
    h, w, _ = a.shape
    xn = np.linspace(-1, 1, w)[None, :].repeat(h, 0)
    yn = np.linspace(-1, 1, h)[:, None].repeat(w, 1)
    ordem = [(i, j) for i in range(grau + 1) for j in range(grau + 1 - i)]
    faixa = max(4, int(min(h, w) * 0.035))
    usar = np.zeros((h, w), bool)
    usar[:faixa] = usar[-faixa:] = True
    usar[:, :faixa] = usar[:, -faixa:] = True
    sel = usar.copy()
    bg = np.zeros_like(a)
    for _ in range(4):
        ys, xs = np.nonzero(sel)
        if len(ys) > 30000:
            k = len(ys) // 30000
            ys, xs = ys[::k], xs[::k]
        X = np.stack([(xn[ys, xs] ** i) * (yn[ys, xs] ** j) for i, j in ordem], axis=1)
        coef = np.stack([np.linalg.lstsq(X, a[ys, xs, c], rcond=None)[0] for c in range(3)], axis=1)
        bg = np.zeros_like(a)
        for t, (i, j) in enumerate(ordem):
            termo = (xn ** i) * (yn ** j)
            for c in range(3):
                bg[..., c] += coef[t, c] * termo
        res = np.sqrt(((a - bg) ** 2).sum(axis=2))
        sel = usar & (res < 14)
    return bg


def recortar(im, limiar=11, forte_min=45, tirar_sombra=True, preencher=True, inteiro=False):
    """GrabCut (OpenCV) iniciado por: borda = fundo; muito diferente do fundo estimado = peça; resto = provável."""
    import cv2
    rgb = np.asarray(im.convert("RGB"))
    a = rgb.astype(float)
    h, w, _ = a.shape
    bg = _fundo_polinomial(a)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    lum, bglum = a.mean(axis=2), bg.mean(axis=2)
    n = a / np.clip(a.sum(axis=2, keepdims=True), 1, None)
    bn = bg / np.clip(bg.sum(axis=2, keepdims=True), 1, None)
    matiz = np.abs(n - bn).sum(axis=2)
    sombra = (matiz < 0.045) & (lum < bglum * 0.985) & (lum > bglum * 0.25)
    m = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    m[dist > limiar] = cv2.GC_PR_FGD
    m[sombra & (dist < 45)] = cv2.GC_PR_BGD
    forte = ndi.binary_erosion(dist > forte_min, iterations=3)
    m[forte] = cv2.GC_FGD
    f = max(4, int(min(h, w) * 0.03))
    m[:f] = m[-f:] = cv2.GC_BGD
    m[:, :f] = m[:, -f:] = cv2.GC_BGD
    bgm = np.zeros((1, 65), np.float64)
    fgm = np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), m, None, bgm, fgm, 5, cv2.GC_INIT_WITH_MASK)
    peca = (m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)
    if tirar_sombra:
        peca &= ~(((matiz < 0.045) & (dist < 60) & (lum > bglum * 0.25)) | (sombra & (dist < 30)))
    peca = ndi.binary_opening(peca, iterations=2)
    lab2, n2 = ndi.label(peca)
    if n2 > 1:
        tam = ndi.sum(peca, lab2, range(1, n2 + 1))
        peca = lab2 == (1 + int(np.argmax(tam)))
    if preencher:
        peca = ndi.binary_fill_holes(peca)
    peca = ndi.binary_erosion(peca, iterations=1)
    alfa = Image.fromarray((peca * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.0))
    out = im.convert("RGBA")
    out.putalpha(alfa)
    return out if inteiro else out.crop(alfa.getbbox())


def recortar_textura(im, limiar=5.0, inteiro=False):
    """Peça clara em fundo liso: máscara pelo relevo do tecido (Sobel suavizado)."""
    import cv2
    cinza = np.asarray(im.convert("L")).astype(np.float32)
    gx = cv2.Sobel(cinza, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(cinza, cv2.CV_32F, 0, 1, ksize=3)
    relevo = cv2.GaussianBlur(np.sqrt(gx ** 2 + gy ** 2), (0, 0), 6)
    peca = ndi.binary_closing(relevo > limiar, iterations=6)
    peca = ndi.binary_fill_holes(peca)
    lab, n = ndi.label(peca)
    if n > 1:
        tam = ndi.sum(peca, lab, range(1, n + 1))
        peca = lab == (1 + int(np.argmax(tam)))
    alfa = Image.fromarray((peca * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.0))
    out = im.convert("RGBA")
    out.putalpha(alfa)
    return out if inteiro else out.crop(alfa.getbbox())


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser(description="Mockup oficial sem fundo (veja o topo do arquivo).")
    ap.add_argument("origem", help="URL da foto no site ou arquivo local")
    ap.add_argument("saida", help="PNG de saída")
    ap.add_argument("--textura", action="store_true")
    ap.add_argument("--vazado", action="store_true")
    ap.add_argument("--inteiro", action="store_true")
    ap.add_argument("--previa", action="store_true")
    ap.add_argument("--corte", help="x0,y0,x1,y1 em frações de 0 a 1")
    a = ap.parse_args()
    img = abrir(a.origem)
    if a.corte:
        x0, y0, x1, y1 = (float(v) for v in a.corte.split(","))
        w0, h0 = img.size
        img = img.crop((int(x0 * w0), int(y0 * h0), int(x1 * w0), int(y1 * h0)))
    img.thumbnail((900, 1100))
    if a.textura:
        r = recortar_textura(img, inteiro=a.inteiro)
    else:
        r = recortar(img, preencher=not a.vazado, inteiro=a.inteiro)
    r.save(a.saida)
    if a.previa:
        fundo = Image.new("RGBA", r.size, (40, 160, 90, 255))
        fundo.alpha_composite(r)
        fundo.convert("RGB").save(a.saida.rsplit(".", 1)[0] + "-previa.jpg", quality=85)
    print("ok", a.saida, r.size)

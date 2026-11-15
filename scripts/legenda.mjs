// Legenda clássica: agrupa as palavras da fala (com tempo) em blocos de 2 a 3 palavras.
// Uso: node scripts/legenda.mjs palavras.json > assets/legenda.js
// palavras.json = [{ "text": "olha", "start": 0.6, "end": 0.9 }, ...] (sai de scripts/transcrever.mjs)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MAX_PALAVRAS = 3;
const MAX_LETRAS = 18;
const PAUSA_CORTA = 0.25; // segundos de silêncio que fecham o grupo
const EMENDA = 0.6; // se o próximo grupo vem até aqui depois, a legenda fica até ele começar

export function agrupar(palavras) {
  const grupos = [];
  let atual = [];
  palavras.forEach((p, i) => {
    atual.push(p);
    const prox = palavras[i + 1];
    const letras = atual.reduce((s, w) => s + w.text.length + 1, 0);
    const fecha = !prox
      || /[.,;:?!…]$/.test(p.text)
      || prox.start - p.end >= PAUSA_CORTA
      || atual.length >= MAX_PALAVRAS
      || letras + prox.text.length > MAX_LETRAS;
    if (fecha) { grupos.push(atual); atual = []; }
  });
  return grupos.map((g, i) => {
    const inicio = g[0].start;
    const fimFala = g[g.length - 1].end;
    const prox = grupos[i + 1]?.[0].start;
    const fim = prox !== undefined && prox - fimFala <= EMENDA ? prox : fimFala + 0.2;
    const r3 = (x) => Math.round(x * 1000) / 1000;
    return { texto: g.map((w) => w.text).join(' '), inicio: r3(inicio), fim: r3(fim) };
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const palavras = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  process.stdout.write(`window.LEGENDA = ${JSON.stringify(agrupar(palavras))};\n`);
}

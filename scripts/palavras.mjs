// Mostra a transcrição com o índice de cada palavra, para escolher o que podar.
// Uso: node scripts/palavras.mjs palavras.json
// Depois: node scripts/preparar-fala.mjs bruto.mp4 saida.mp4 --seco --palavras palavras.json --cortar "12-18"
import { readFileSync } from 'node:fs';
import { ehPrincipal } from './ferramentas.mjs';

export function listarIndices(palavras) {
  const linhas = [];
  let linha = [];
  palavras.forEach((p, i) => {
    linha.push(`[${i}] ${p.text.trim()}`);
    if (/[.!?]$/.test(p.text.trim()) || linha.length >= 10) {
      linhas.push(`${p.start.toFixed(1).padStart(6)} s  ${linha.join(' ')}`);
      linha = [];
    }
  });
  if (linha.length) linhas.push(`${palavras.at(-1).start.toFixed(1).padStart(6)} s  ${linha.join(' ')}`);
  return linhas.join('\n');
}

if (ehPrincipal(import.meta.url)) {
  const arq = process.argv[2];
  if (!arq) { console.error('Uso: node scripts/palavras.mjs palavras.json'); process.exit(1); }
  console.log(listarIndices(JSON.parse(readFileSync(arq, 'utf8'))));
}

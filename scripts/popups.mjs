// Pop-ups parados (sem animação) sobre o talking head: aparecem e somem num quadro.
// Uso: node scripts/popups.mjs <projeto>/popups.json > <projeto>/assets/popups.js
// popups.json: [ { "imagem": "assets/print-cupom.png", "inicio": 3.2, "fim": 5.0, "texto": "opcional", "pos": "topo" } ]
//   pos: topo (padrão), esquerda ou direita. Escolha a que NÃO cobre o rosto (confira no snapshot).
//   - imagem real: foto oficial, mockup sem fundo ou print recortado (nunca emoji, ícone ou ilustração genérica)
//   - tempos pela fala (palavras.json do vídeo PREPARADO); um pop-up por vez, no mínimo 0,8 s
import { readFileSync } from 'node:fs';
import { ehPrincipal } from './ferramentas.mjs';

export function gerarPopups(lista) {
  const ord = [...lista].sort((a, b) => a.inicio - b.inicio);
  ord.forEach((p, i) => {
    if (!p.imagem) throw new Error(`Pop-up ${i + 1} sem imagem.`);
    if (p.fim - p.inicio < 0.8) throw new Error(`Pop-up em ${p.inicio} s dura menos de 0,8 s: ninguém consegue ver.`);
    if (p.pos && !['topo', 'esquerda', 'direita'].includes(p.pos)) throw new Error(`Pop-up em ${p.inicio} s: posição "${p.pos}" não existe (use topo, esquerda ou direita).`);
    if (i > 0 && p.inicio < ord[i - 1].fim) throw new Error(`Dois pop-ups ao mesmo tempo (${ord[i - 1].inicio} s e ${p.inicio} s): um por vez.`);
  });
  const dados = ord.map((p) => ({ imagem: String(p.imagem), inicio: Number(p.inicio), fim: Number(p.fim), ...(p.texto ? { texto: String(p.texto) } : {}), ...(p.pos ? { pos: p.pos } : {}) }));
  return `window.POPUPS=${JSON.stringify(dados)};\n`;
}

if (ehPrincipal(import.meta.url)) {
  const arq = process.argv[2];
  if (!arq) { console.error('Uso: node scripts/popups.mjs <projeto>/popups.json > <projeto>/assets/popups.js'); process.exit(1); }
  try {
    process.stdout.write(gerarPopups(JSON.parse(readFileSync(arq, 'utf8'))));
  } catch (e) { console.error(e.message); process.exit(1); }
}

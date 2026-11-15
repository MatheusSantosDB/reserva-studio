// Monta o index.html de um filme em takes a partir do filme.json do projeto.
// Uso: node scripts/montar-filme.mjs hyperframes/projetos/<nome>
//
// filme.json:
// {
//   "bpm": 120,                                   batida da trilha (as durações encaixam nela)
//   "trilha": "assets/trilha.mp3",                opcional
//   "gancho": "texto curto dos primeiros 2 s",     opcional
//   "takes": [ { "arquivo": "assets/take1.mp4", "duracao": 3.5, "texto": "opcional" } ],
//   "final": { "titulo": "Nome do produto", "foto": "assets/peca.png", "duracao": 3, "fundo": "#efe9df" }
//   (fundo opcional: claro por padrão; use escuro só com peça clara)
// }
// O código promocional vem de config/vendedor.json. Sem ele, o cartão final sai sem código.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerConfig } from './config.mjs';

export const naBatida = (s, bpm = 120) => {
  const batida = 60 / bpm;
  return Math.max(batida, Math.round(s / batida) * batida);
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n = (x) => String(Math.round(x * 1000) / 1000);

export function montarFilme(spec, { cupom }) {
  const bpm = spec.bpm ?? 120;
  let t = 0;
  const takes = spec.takes.map((k, i) => {
    const d = naBatida(k.duracao, bpm);
    const item = { ...k, i, inicio: t, duracao: d };
    t += d;
    return item;
  });
  const final = spec.final ? { ...spec.final, inicio: t, duracao: naBatida(spec.final.duracao ?? 3, bpm) } : null;
  const duracao = t + (final ? final.duracao : 0);
  const fundo = /^#[0-9a-f]{3,8}$/i.test(spec.final?.fundo ?? '') ? spec.final.fundo : '#efe9df';
  const claro = (h) => { const x = h.length === 4 ? h.slice(1).split('').map((c) => c + c).join('') : h.slice(1, 7); const n = parseInt(x, 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 140; };
  const corTexto = claro(fundo) ? '#111111' : '#ffffff';

  const videos = takes.map((k) => `<video id="take${k.i}" class="clip abs tela" src="${esc(k.arquivo)}" data-start="${n(k.inicio)}" data-duration="${n(k.duracao)}" data-media-start="0" data-track-index="0" muted playsinline></video>`);
  const textos = takes.filter((k) => k.texto).map((k) => `<div id="txt${k.i}" class="clip abs texto" data-start="${n(k.inicio + 0.2)}" data-duration="${n(k.duracao - 0.3)}" data-track-index="2">${esc(k.texto)}</div>`);
  const gancho = spec.gancho ? `<div id="gancho" class="clip abs gancho" data-start="0" data-duration="${n(Math.min(2.5, takes[0]?.duracao ?? 2.5))}" data-track-index="3">${esc(spec.gancho)}</div>` : '';
  const trilha = spec.trilha ? `<audio id="trilha" src="${esc(spec.trilha)}" data-start="0" data-duration="${n(duracao)}" data-volume="0.8"></audio>` : '';
  const cartao = final ? `<div id="final" class="clip abs final" data-start="${n(final.inicio)}" data-duration="${n(final.duracao)}" data-track-index="4">
  ${final.foto ? `<img id="final-foto" src="${esc(final.foto)}" alt=""/>` : ''}
  <div id="final-titulo">${esc(final.titulo)}</div>
  ${cupom ? `<div id="cupom"><span>CUPOM</span><b>${esc(cupom)}</b></div>` : ''}
</div>` : '';

  const anims = [
    ...takes.map((k) => `tl.fromTo("#take${k.i}",{scale:1.06},{scale:1,duration:${n(k.duracao)},ease:"none"},${n(k.inicio)});`),
    ...takes.filter((k) => k.texto).map((k) => `tl.fromTo("#txt${k.i}",{opacity:0,y:20},{opacity:1,y:0,duration:.25,ease:"power3.out"},${n(k.inicio + 0.2)});`),
    spec.gancho ? `tl.fromTo("#gancho",{opacity:0,scale:.92},{opacity:1,scale:1,duration:.3,ease:"back.out(1.4)"},0);` : '',
    final ? `tl.fromTo("#final",{opacity:0},{opacity:1,duration:.3,ease:"power2.out"},${n(final.inicio)});` : '',
    final?.foto ? `tl.fromTo("#final-foto",{y:40,scale:.9},{y:0,scale:1,duration:.5,ease:"back.out(1.3)"},${n(final.inicio)});` : '',
    final && cupom ? `tl.fromTo("#cupom",{opacity:0,y:30},{opacity:1,y:0,duration:.35,ease:"back.out(1.4)"},${n(final.inicio + 0.5)});` : '',
  ].filter(Boolean);

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<!-- Gerado por scripts/montar-filme.mjs a partir do filme.json. Edite o filme.json e monte de novo. -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
@font-face{font-family:"Manrope";src:url("assets/Manrope-variable.ttf");font-weight:200 800}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#000}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;font-family:"Manrope",Arial,sans-serif;color:#fff}
.abs{position:absolute}
.tela{left:0;top:0;width:1080px;height:1920px;object-fit:cover}
.gancho{left:80px;right:80px;top:300px;text-align:center;font-size:76px;font-weight:800;line-height:1.1;text-shadow:0 4px 18px rgba(0,0,0,.8);z-index:30}
.texto{left:80px;right:80px;bottom:360px;text-align:center;font-size:58px;font-weight:700;line-height:1.15;text-shadow:0 4px 16px rgba(0,0,0,.85);z-index:20}
.final{left:0;top:0;width:1080px;height:1920px;background:${fundo};color:${corTexto};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:48px;z-index:40}
#final-foto{max-width:720px;max-height:900px;object-fit:contain;filter:drop-shadow(0 30px 40px rgba(0,0,0,.45))}
#final-titulo{font-size:64px;font-weight:800;text-transform:uppercase;letter-spacing:4px;text-align:center;padding:0 80px}
${cupom ? `#cupom{display:flex;gap:20px;align-items:baseline;border:3px solid ${corTexto};padding:20px 40px;border-radius:14px}
#cupom span{font-size:36px;letter-spacing:6px;font-weight:600}
#cupom b{font-size:72px;font-weight:800;letter-spacing:4px}
` : ''}</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${n(duracao)}" data-width="1080" data-height="1920">
${[...videos, ...textos, gancho, cartao, trilha].filter(Boolean).join('\n')}
</div>
<script>
const tl=gsap.timeline({paused:true});
${anims.join('\n')}
window.__timelines=window.__timelines||{};window.__timelines["main"]=tl;tl.seek(0);
</script></body></html>
`;
  return { html, duracao };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pasta = process.argv[2];
  if (!pasta) { console.error('Uso: node scripts/montar-filme.mjs <pasta-do-projeto>'); process.exit(1); }
  const spec = JSON.parse(readFileSync(join(pasta, 'filme.json'), 'utf8'));
  const config = lerConfig();
  const { html, duracao } = montarFilme(spec, config);
  writeFileSync(join(pasta, 'index.html'), html);
  const fonte = join(pasta, 'assets', 'Manrope-variable.ttf');
  if (!existsSync(fonte)) {
    mkdirSync(join(pasta, 'assets'), { recursive: true });
    copyFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'fontes', 'Manrope-variable.ttf'), fonte);
  }
  console.log(`index.html montado: ${duracao.toFixed(1)} s, ${spec.takes.length} takes${config.cupom ? `, cupom ${config.cupom}` : ', sem cupom (config/vendedor.json vazio)'}.`);
}

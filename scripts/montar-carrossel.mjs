// Monta um carrossel de vídeo para o Instagram: um projeto HyperFrames por slide (1080x1350, 8 s).
// Uso: node scripts/montar-carrossel.mjs hyperframes/projetos/<nome>
//
// <nome>/carrossel.json:
// {
//   "marca": "RESERVA",            texto pequeno do cabeçalho
//   "cor": "#b3262e",              cor de destaque (opcional)
//   "fundo": "#efe9df",            fundo dos slides (opcional; claro por padrão)
//   "slides": [
//     { "titulo": "parece pesado.", "destaque": "mas é leve.", "foto": "assets/peca.png",
//       "cartoes": ["Entressola em EVA", "Base de borracha"] },
//     ...
//     { "titulo": "garanta o seu.", "chamada": true, "foto": "assets/peca.png" }
//   ]
// }
// Cada slide começa e termina no mesmo desenho: o quadro 0 é a capa e o loop do Instagram não pula.
// As animações acontecem entre 0,5 s e 6,5 s (batidas de 120 BPM) e o resto fica parado.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerConfig } from './config.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cor = (v, padrao) => (/^#[0-9a-f]{3,8}$/i.test(v ?? '') ? v : padrao);
const DUR = 8;

export function montarSlide(s, i, total, { cupom }, opc = {}) {
  const destaque = cor(opc.cor, '#b3262e');
  const fundo = cor(opc.fundo, '#efe9df');
  const num = `${String(i + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`;
  const cartoes = (s.cartoes ?? []).slice(0, 3);
  const temCupom = Boolean(s.chamada && cupom);
  const anims = [
    // 0,5 s: tudo some rápido; depois volta na batida e assenta até 6,5 s (mesma pose do quadro 0)
    `tl.set(["#titulo","#destaque","#foto",".cartao","#chamada"],{opacity:0},0.5);`,
    `tl.fromTo("#titulo",{opacity:0,y:40},{opacity:1,y:0,duration:.45,ease:"power3.out",immediateRender:false},1);`,
    s.foto ? `tl.fromTo("#foto",{opacity:0,y:-260,scaleY:1.06},{opacity:1,y:0,scaleY:1,duration:.7,ease:"bounce.out",immediateRender:false},1.5);` : '',
    s.destaque ? `tl.fromTo("#destaque",{opacity:0,x:-30},{opacity:1,x:0,duration:.4,ease:"back.out(1.6)",immediateRender:false},2.5);` : '',
    ...cartoes.map((_, k) => `tl.fromTo("#cartao${k}",{opacity:0,x:60},{opacity:1,x:0,duration:.4,ease:"back.out(1.4)",immediateRender:false},${3.5 + k});`),
    s.chamada ? `tl.fromTo("#chamada",{opacity:0,scale:.9},{opacity:1,scale:1,duration:.45,ease:"back.out(1.6)",immediateRender:false},${3.5 + cartoes.length});` : '',
  ].filter(Boolean);
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1350"/>
<!-- Gerado por scripts/montar-carrossel.mjs. Edite o carrossel.json e monte de novo. -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
@font-face{font-family:"Manrope";src:url("assets/Manrope-variable.ttf");font-weight:200 800}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1350px;overflow:hidden;background:${fundo}}
#root{position:relative;width:1080px;height:1350px;overflow:hidden;font-family:"Manrope",Arial,sans-serif;color:#141414;background:${fundo}}
.abs{position:absolute}
#cab{left:72px;right:72px;top:56px;display:flex;justify-content:space-between;font-size:28px;font-weight:700;letter-spacing:6px;border-bottom:2px solid #141414;padding-bottom:16px}
#titulo{left:72px;right:72px;top:140px;font-size:96px;font-weight:800;line-height:1.02;letter-spacing:-2px}
#destaque{left:72px;right:72px;top:${s.titulo && s.titulo.length > 16 ? 360 : 260}px;font-size:76px;font-weight:800;color:${destaque}}
#foto{left:${cartoes.length ? 40 : 120}px;width:${cartoes.length ? 600 : 840}px;bottom:${s.chamada ? 330 : 120}px;height:${s.chamada ? 560 : cartoes.length ? 640 : 760}px;object-fit:contain;filter:drop-shadow(0 30px 30px rgba(0,0,0,.25))}
.cartao{right:56px;width:380px;background:#fff;border-radius:16px;padding:22px 26px;font-size:32px;font-weight:700;line-height:1.2;box-shadow:0 10px 30px rgba(0,0,0,.12);border-left:8px solid ${destaque}}
#chamada{left:72px;right:72px;bottom:90px;text-align:center;font-size:34px;font-weight:700;z-index:5}
${temCupom ? `#cupom{display:inline-flex;gap:18px;align-items:baseline;border:3px solid #141414;border-radius:14px;padding:16px 34px;margin-bottom:22px}
#cupom span{font-size:30px;letter-spacing:6px}#cupom b{font-size:64px;font-weight:800;letter-spacing:3px}` : ''}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="1080" data-height="1350">
<div id="cab" class="abs"><span>${esc(opc.marca ?? 'RESERVA')}</span><span>${num}</span></div>
<div id="titulo" class="abs">${esc(s.titulo)}</div>
${s.destaque ? `<div id="destaque" class="abs">${esc(s.destaque)}</div>` : ''}
${s.foto ? `<img id="foto" class="abs" src="${esc(s.foto)}" alt=""/>` : ''}
${cartoes.map((c, k) => `<div id="cartao${k}" class="cartao abs" style="top:${560 + k * 150}px">${esc(c)}</div>`).join('\n')}
${s.chamada ? `<div id="chamada" class="abs">${temCupom ? `<div id="cupom"><span>CUPOM</span><b>${esc(cupom)}</b></div><br/>` : ''}no site da Reserva · salve para lembrar</div>` : ''}
</div>
<script>
const tl=gsap.timeline({paused:true});
${anims.join('\n')}
window.__timelines=window.__timelines||{};window.__timelines["main"]=tl;tl.seek(0);
</script></body></html>
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pasta = process.argv[2];
  if (!pasta) { console.error('Uso: node scripts/montar-carrossel.mjs hyperframes/projetos/<nome>'); process.exit(1); }
  const spec = JSON.parse(readFileSync(join(pasta, 'carrossel.json'), 'utf8'));
  const config = lerConfig();
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const total = spec.slides.length;
  if (total !== 6) console.warn(`Aviso: ${total} slides. O padrão do estúdio é 6.`);
  spec.slides.forEach((s, i) => {
    const dir = join(pasta, 'slides', String(i + 1).padStart(2, '0'));
    mkdirSync(join(dir, 'assets'), { recursive: true });
    writeFileSync(join(dir, 'index.html'), montarSlide(s, i, total, config, spec));
    for (const f of ['hyperframes.json', 'package.json']) copyFileSync(join(raiz, 'hyperframes', 'modelos', 'filme-em-takes', f), join(dir, f));
    copyFileSync(join(raiz, 'assets', 'fontes', 'Manrope-variable.ttf'), join(dir, 'assets', 'Manrope-variable.ttf'));
    if (existsSync(join(pasta, 'assets'))) {
      for (const f of readdirSync(join(pasta, 'assets'))) copyFileSync(join(pasta, 'assets', f), join(dir, 'assets', f));
    }
  });
  console.log(`${total} slides montados em ${join(pasta, 'slides')}${config.cupom ? ` (cupom ${config.cupom} no slide de chamada)` : ' (sem cupom)'}.`);
}

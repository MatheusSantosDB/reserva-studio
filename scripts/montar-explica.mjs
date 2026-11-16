// Estilo "Reserva Explica": a fala vira cenas de desenho em papel-recorte (personagens, loja, produto real,
// etiqueta de preço, cupom), com legenda grande em maiúsculas. Gera o index.html de um projeto HyperFrames.
// Uso: node scripts/montar-explica.mjs hyperframes/projetos/<nome>
//
// <nome>/assets/fala.mp4   gravação já preparada (preparar-fala.mjs --seco)
// <nome>/palavras.json     transcrição do fala.mp4 (revisada)
// <nome>/explica.json:
// {
//   "duracao": 24.5,                         duração do fala.mp4
//   "chaves": ["cupom", "polo"],             palavras da legenda em amarelo
//   "cenas": [
//     { "t0": 0, "t1": 3.2, "layout": "full" | "split", "bg": "ceu" | "loja", "zoom": 1.05,
//       "els": [
//         { "tipo": "char",   "img": "elenco/cliente-polo.png", "cx": 300, "bottom": 100, "h": 800, "nome": "CLIENTE", "anim": "sl", "t": 0.1 },
//         { "tipo": "img",    "img": "assets/peca.png", "cx": 540, "top": 300, "h": 520 },     mockup oficial / print real
//         { "tipo": "phone",  "img": "assets/print.jpg", "cx": 540, "top": 260, "w": 520, "scroll": -400 },
//         { "tipo": "tag",    "txt": "R$ 199", "sub": "NO SITE HOJE", "cx": 540, "top": 900 },    só preço que a fala diz
//         { "tipo": "ticket", "txt": "{cupom}", "cx": 540, "top": 1100, "anim": "drop" },          cupom do config/vendedor.json
//         { "tipo": "balao",  "txt": "?!", "cx": 800, "top": 200 }
//       ] }
//   ]
// }
// "img" começando com "assets/" vem da pasta do projeto; o resto vem de assets/reserva-explica/ (elenco, fundo).
// Entradas: pop, up, sl (da esquerda), sr (da direita), drop (cai e quica). "sacode": true balança depois de entrar.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerConfig } from './config.mjs';
import { agrupar } from './legenda.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const EMOJI = /[\p{Extended_Pictographic}]/u;
const n2 = (x) => Number(x).toFixed(2);
const rasgado = () => {
  const pts = ['0 100%'];
  for (let x = 0, up = true; x <= 1080; x += 36, up = !up) pts.push(`${(x / 10.8).toFixed(2)}% ${up ? 12 : 62}%`);
  return `polygon(${[...pts, '100% 100%'].join(',')})`;
};

const CSS = `
@font-face{font-family:"Manrope";src:url("assets/Manrope-variable.ttf");font-weight:200 800}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#111}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;font-family:"Manrope",Arial,sans-serif;background:#111}
.abs{position:absolute}
.cena{position:absolute;left:0;top:0;width:1080px;overflow:hidden;opacity:0}
.cam{position:absolute;left:0;top:0;width:100%;height:100%;transform-origin:50% 60%}
.ceu{background:linear-gradient(#8fcbf0 0%,#bfe3f5 55%,#e4f3f8 100%)}
.nuvem{position:absolute;height:58px;background:#fff;border-radius:40px;opacity:.95}
.nuvem:before,.nuvem:after{content:"";position:absolute;background:#fff;border-radius:50%}
.nuvem:before{width:80px;height:80px;left:22%;top:-38px}.nuvem:after{width:64px;height:64px;left:52%;top:-28px}
.morro{position:absolute;left:-10%;width:120%;border-radius:50%}
.loja img{width:100%;height:100%;object-fit:cover}
.el{position:absolute;opacity:0}
.ancora{position:absolute;width:0}
.ancora>.dentro{position:absolute;left:0;transform:translateX(-50%)}
.ancora img{display:block;width:auto}
.nome{position:absolute;left:50%;top:58%;transform:translateX(-50%);background:#fff;border:4px solid #1b1b1b;border-radius:10px;padding:4px 18px;font-size:30px;font-weight:800;letter-spacing:1px;color:#1b1b1b;white-space:nowrap}
.phone{background:#141414;border-radius:56px;padding:16px;box-shadow:0 18px 40px rgba(0,0,0,.35)}
.tela{border-radius:42px;overflow:hidden;background:#fff;position:relative}
.tela img{position:absolute;left:0;top:0;width:100%}
.ptag{background:#fff;border:6px solid #1b1b1b;border-radius:20px;padding:16px 40px 18px;text-align:center;color:#1b1b1b;box-shadow:0 10px 0 rgba(0,0,0,.25)}
.ptag b{white-space:nowrap;display:block;font-size:96px;font-weight:900;line-height:1;letter-spacing:-2px}
.ptag small{display:block;font-size:32px;font-weight:800;margin-top:4px;letter-spacing:1px}
.ticket{padding:20px 46px;border-radius:18px;text-align:center;color:#fff;font-weight:900;border:6px solid #1b1b1b;box-shadow:0 10px 0 rgba(0,0,0,.25);background:#b3262e}
.ticket small{display:block;font-size:30px;letter-spacing:4px;font-weight:800}
.ticket b{display:block;font-size:74px;line-height:1.05;letter-spacing:1px}
.balao{background:#fff;border:5px solid #1b1b1b;border-radius:34px;padding:12px 30px;font-size:64px;font-weight:900;color:#d62828;text-align:center;white-space:nowrap}
.cap{position:absolute;left:60px;top:110px;width:960px;height:260px;z-index:90}
.cap .g{position:absolute;left:0;top:0;width:960px;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;opacity:0;text-align:center}
.cap span{display:inline-block;margin:0 12px;font-size:100px;font-weight:900;letter-spacing:-1px;line-height:1.08;color:#fff;text-transform:uppercase;
  -webkit-text-stroke:14px #161616;paint-order:stroke fill;text-shadow:0 7px 0 rgba(0,0,0,.35)}
.cap span.k{color:#FFD23F}
.rosto{position:absolute;left:0;width:1080px;overflow:hidden;background:#222;opacity:0;z-index:50}
.rosto video{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:50% 28%}
.rasgo{position:absolute;left:0;width:1080px;height:34px;background:#f4f1e8;opacity:0}
`;

export function montarExplica(plano, palavras, { cupom }) {
  const arquivos = new Set();
  const html = [];
  const js = [];
  const texto = (t, onde) => {
    if (EMOJI.test(t)) throw new Error(`Tem emoji em "${t}" (${onde}). Use imagem real ou texto.`);
    if (t.includes('{cupom}')) {
      if (!cupom) throw new Error(`"${onde}" usa {cupom}, mas o config/vendedor.json não tem cupom.`);
      return t.replaceAll('{cupom}', cupom);
    }
    return t;
  };
  const src = (img) => { if (img.startsWith('assets/')) return img; arquivos.add(img); return `assets/${basename(img)}`; };

  plano.cenas.forEach((c, ci) => {
    const split = c.layout === 'split';
    const H = split ? 1230 : 1920;
    const z = 10 + ci;
    let fundo;
    if (c.bg === 'loja') {
      arquivos.add('fundo-loja.jpg');
      fundo = `<div class="loja abs" style="left:0;top:0;width:1080px;height:${H}px"><img src="assets/fundo-loja.jpg"/></div>`;
    } else {
      fundo = `<div class="ceu abs" style="left:0;top:0;width:1080px;height:${H}px"></div>`
        + `<div class="nuvem" style="left:70px;top:${Math.round(H * 0.3)}px;width:260px"></div>`
        + `<div class="nuvem" style="left:640px;top:${Math.round(H * 0.22)}px;width:320px"></div>`
        + `<div class="morro" style="top:${Math.round(H * 0.76)}px;height:${Math.round(H * 0.6)}px;background:#9fd37c"></div>`
        + `<div class="morro" style="top:${Math.round(H * 0.86)}px;height:${Math.round(H * 0.6)}px;background:#7fbf5e"></div>`;
    }
    const els = [];
    c.els.forEach((e, ei) => {
      const id = `e${ci}_${ei}`;
      const te = c.t0 + (e.t ?? 0.15);
      let dur = 0.5;
      if (e.tipo === 'char' || e.tipo === 'img') {
        const pos = e.tipo === 'char' ? `top:${H - e.bottom - e.h}px` : `top:${e.top}px`;
        const chip = e.nome ? `<div class="nome">${esc(texto(e.nome, `cena ${ci + 1}`))}</div>` : '';
        els.push(`<div id="${id}" class="el ancora" style="left:${e.cx}px;${pos}"><div class="dentro"><img src="${esc(src(e.img))}" style="height:${e.h}px"/>${chip}</div></div>`);
        dur = e.tipo === 'char' ? 0.55 : 0.5;
      } else if (e.tipo === 'phone') {
        const w = e.w ?? 520;
        els.push(`<div id="${id}" class="el phone" style="left:${e.cx - w / 2}px;top:${e.top}px;width:${w}px"><div class="tela" style="height:${Math.round((w - 32) * 16 / 9)}px"><img id="${id}i" src="${esc(src(e.img))}"/></div></div>`);
        if (e.scroll) js.push(`tl.fromTo('#${id}i',{y:0},{y:${Number(e.scroll)},duration:1.6,ease:'power2.inOut'},${n2(te + 0.5)});`);
      } else if (e.tipo === 'tag') {
        els.push(`<div id="${id}" class="el ptag" style="left:${e.cx - 200}px;top:${e.top}px;width:400px"><b>${esc(texto(e.txt, `cena ${ci + 1}`))}</b><small>${esc(texto(e.sub ?? '', `cena ${ci + 1}`))}</small></div>`);
        dur = 0.6;
      } else if (e.tipo === 'ticket') {
        els.push(`<div id="${id}" class="el ticket" style="left:${e.cx - 250}px;top:${e.top}px;width:500px"><small>${esc(texto(e.rotulo ?? 'CUPOM DE VENDEDOR', `cena ${ci + 1}`))}</small><b>${esc(texto(e.txt, `cena ${ci + 1}`))}</b></div>`);
      } else if (e.tipo === 'balao') {
        els.push(`<div id="${id}" class="el balao" style="left:${e.cx - 150}px;top:${e.top}px;min-width:300px">${esc(texto(e.txt, `cena ${ci + 1}`))}</div>`);
        dur = 0.4;
      } else {
        throw new Error(`Tipo "${e.tipo}" desconhecido na cena ${ci + 1}.`);
      }
      const anim = e.anim ?? 'pop';
      if (anim === 'pop') js.push(`tl.fromTo('#${id}',{scale:.2,opacity:0},{scale:1,opacity:1,duration:${dur},ease:'back.out(2)'},${n2(te)});`);
      else if (anim === 'up') js.push(`tl.set('#${id}',{opacity:1},${n2(te)});tl.fromTo('#${id}',{y:${H}},{y:0,duration:${dur + 0.1},ease:'power3.out'},${n2(te)});`);
      else if (anim === 'sl' || anim === 'sr') js.push(`tl.set('#${id}',{opacity:1},${n2(te)});tl.fromTo('#${id}',{x:${anim === 'sl' ? -900 : 900}},{x:0,duration:${dur},ease:'back.out(1.4)'},${n2(te)});`);
      else if (anim === 'drop') { dur = 0.75; js.push(`tl.set('#${id}',{opacity:1},${n2(te)});tl.fromTo('#${id}',{y:-900},{y:0,duration:.75,ease:'bounce.out'},${n2(te)});`); }
      if (e.sacode) js.push(`tl.to('#${id}',{rotation:4,duration:.12,yoyo:true,repeat:5,ease:'sine.inOut'},${n2(te + dur + 0.05)});`);
      if (e.tipo === 'char' && e.respira !== false) {
        const ini = te + dur;
        const n = Math.max(1, Math.floor((c.t1 - ini) / 0.8));
        js.push(`tl.to('#${id}',{y:-12,duration:.8,yoyo:true,repeat:${n},ease:'sine.inOut'},${n2(ini)});`);
      }
    });
    let extra = '';
    if (split) {
      extra = `<div class="rosto" id="r${ci}" style="top:${H}px;height:${1920 - H}px;z-index:${z + 1}"><video id="v${ci}" class="clip" src="assets/fala.mp4" muted playsinline data-start="${c.t0}" data-duration="${n2(c.t1 - c.t0)}" data-media-start="${c.t0}"></video></div>`
        + `<div class="rasgo" id="rg${ci}" style="top:${H - 17}px;z-index:${z + 2};clip-path:${rasgado()}"></div>`;
      js.push(`tl.set(['#r${ci}','#rg${ci}'],{opacity:1},${n2(c.t0)});tl.set(['#r${ci}','#rg${ci}'],{opacity:0},${n2(c.t1 + 0.3)});`);
    }
    html.push(`<div class="cena" id="c${ci}" style="height:${H}px;z-index:${z}"><div class="cam" id="cam${ci}">${fundo}${els.join('')}</div></div>${extra}`);
    js.push(`tl.set('#c${ci}',{opacity:1},${n2(c.t0)});tl.set('#c${ci}',{opacity:0},${n2(c.t1 + 0.3)});`);
    if (ci > 0) js.push(`tl.fromTo('#c${ci}',{x:1080},{x:0,duration:.28,ease:'power3.out'},${n2(c.t0)});`);
    js.push(`tl.fromTo('#cam${ci}',{scale:1},{scale:${c.zoom ?? 1.05},duration:${n2(c.t1 - c.t0 + 0.3)},ease:'none'},${n2(c.t0)});`);
  });

  const chaves = new Set((plano.chaves ?? []).map((k) => k.toLowerCase()));
  const cap = agrupar(palavras).map((g, gi) => {
    const spans = g.texto.split(' ').map((w) => {
      const k = chaves.has(w.toLowerCase().replace(/[.,?!…:;]/g, ''));
      return `<span class="${k ? 'k' : ''}">${esc(texto(w, 'legenda'))}</span>`;
    }).join('');
    js.push(`tl.set('#g${gi}',{opacity:1},${n2(g.inicio)});tl.set('#g${gi}',{opacity:0},${n2(Math.min(g.fim, plano.duracao))});`);
    return `<div class="g" id="g${gi}">${spans}</div>`;
  });

  const doc = `<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<!-- Gerado por scripts/montar-explica.mjs. Edite o explica.json e monte de novo. -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>${CSS}</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${plano.duracao}" data-width="1080" data-height="1920">
${html.join('\n')}
<div class="cap">${cap.join('')}</div>
<audio id="voz" src="assets/fala.mp4" data-start="0" data-duration="${plano.duracao}" data-volume="1"></audio>
</div>
<script>
const tl=gsap.timeline({paused:true});
${js.join('\n')}
window.__timelines=window.__timelines||{};window.__timelines["main"]=tl;tl.seek(0);
</script></body></html>
`;
  return { html: doc, arquivos: [...arquivos] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pasta = process.argv[2];
  if (!pasta) { console.error('Uso: node scripts/montar-explica.mjs hyperframes/projetos/<nome>'); process.exit(1); }
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const lib = join(raiz, 'assets', 'reserva-explica');
  try {
    const plano = JSON.parse(readFileSync(join(pasta, 'explica.json'), 'utf8'));
    const palavras = JSON.parse(readFileSync(join(pasta, 'palavras.json'), 'utf8'));
    const { html, arquivos } = montarExplica(plano, palavras, lerConfig());
    mkdirSync(join(pasta, 'assets'), { recursive: true });
    for (const a of arquivos) {
      if (!existsSync(join(lib, a))) throw new Error(`Não achei ${a} em assets/reserva-explica/.`);
      copyFileSync(join(lib, a), join(pasta, 'assets', basename(a)));
    }
    for (const f of ['hyperframes.json', 'package.json']) copyFileSync(join(raiz, 'hyperframes', 'modelos', 'filme-em-takes', f), join(pasta, f));
    copyFileSync(join(raiz, 'assets', 'fontes', 'Manrope-variable.ttf'), join(pasta, 'assets', 'Manrope-variable.ttf'));
    writeFileSync(join(pasta, 'index.html'), html);
    console.log(`index.html montado: ${plano.duracao} s, ${plano.cenas.length} cenas.`);
  } catch (e) { console.error(e.message); process.exit(1); }
}

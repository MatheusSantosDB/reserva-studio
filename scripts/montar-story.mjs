// Story de produto (1080x1920): foto oficial, nome, preço confirmado, grade e faixa do cupom.
// Uso: node scripts/montar-story.mjs work/<tema>/produtos.json <numero> --tam M --confirmado [--foto N] [--pasta hyperframes/projetos/story-<nome>]
//   <numero>     posição do produto na lista que o vtex.mjs mostrou (1, 2, 3...)
//   --confirmado obrigatório: só depois que o vendedor confirmou o preço de HOJE
//   --foto N     qual foto do produto usar (padrão 1, a do modelo de frente)
// Depois: ./hyperframes/hf.sh projetos/story-<nome> snapshot --at 1   (o PNG sai na pasta .hyperframes/artifacts)
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerConfig } from './config.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reais = (n) => `R$ ${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export function montarStory(p, { tam, cupom, foto }) {
  const alvo = String(tam ?? '').toUpperCase();
  const grade = p.tamanhos.map((t) => {
    const classe = !t.disponivel ? 'tam esgotado' : t.tam.toUpperCase() === alvo ? 'tam escolhido' : 'tam';
    return `<span class="${classe}">${esc(t.tam)}</span>`;
  }).join('');
  const comDesconto = p.desconto > 0 && p.precoDe > p.precoPor;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<!-- Gerado por scripts/montar-story.mjs. -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
@font-face{font-family:"Manrope";src:url("assets/Manrope-variable.ttf");font-weight:200 800}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#efe9df}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;font-family:"Manrope",Arial,sans-serif;color:#141414;background:#efe9df}
.abs{position:absolute}
#foto{left:90px;top:110px;width:900px;height:1000px;object-fit:cover;object-position:50% 20%;border-radius:28px;box-shadow:0 20px 50px rgba(0,0,0,.18)}
#card{left:90px;width:900px;top:1150px;background:#fff;border-radius:24px;padding:36px 40px;box-shadow:0 14px 40px rgba(0,0,0,.12)}
#nome{font-size:44px;font-weight:800;line-height:1.1;text-transform:uppercase;letter-spacing:1px}
.precos{display:flex;align-items:baseline;gap:22px;margin-top:20px;white-space:nowrap}
.de{font-size:36px;color:#8a8a8a;text-decoration:line-through}
.por{font-size:72px;font-weight:800}
.pct{font-size:34px;font-weight:800;color:#fff;background:#b3262e;border-radius:10px;padding:4px 14px}
.grade{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
.tam{min-width:72px;text-align:center;font-size:30px;font-weight:700;border:2px solid #141414;border-radius:10px;padding:8px 12px}
.escolhido{background:#141414;color:#fff}
.esgotado{color:#b5b5b5;border-color:#d0d0d0;text-decoration:line-through}
${cupom ? `#faixa{left:0;right:0;top:1740px;height:110px;background:#141414;color:#fff;display:flex;align-items:center;justify-content:center;gap:24px;font-size:38px;font-weight:700;letter-spacing:4px}
#faixa b{font-size:58px;letter-spacing:3px}` : ''}
/* espaço livre entre o card e a faixa (y ~1560-1730): adesivo de LINK do Instagram */
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="5" data-width="1080" data-height="1920">
<img id="foto" class="abs" src="${esc(foto)}" alt=""/>
<div id="card" class="abs">
  <div id="nome">${esc(p.nome)}</div>
  <div class="precos">${comDesconto ? `<span class="de">${reais(p.precoDe)}</span>` : ''}<span class="por">${reais(p.precoPor)}</span>${comDesconto ? `<span class="pct">-${p.desconto}%</span>` : ''}</div>
  <div class="grade">${grade}</div>
</div>
${cupom ? `<div id="faixa" class="abs">CUPOM DE VENDEDOR <b>${esc(cupom)}</b></div>` : ''}
</div>
<script>
const tl=gsap.timeline({paused:true});
tl.fromTo("#card",{opacity:0,y:40},{opacity:1,y:0,duration:.5,ease:"power3.out"},0.2);
window.__timelines=window.__timelines||{};window.__timelines["main"]=tl;tl.seek(0);
</script></body></html>
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const opc = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
  const COM_VALOR = ['--tam', '--foto', '--pasta'];
  const [lista, numero] = args.filter((a, i) => !a.startsWith('--') && !COM_VALOR.includes(args[i - 1]));
  if (!lista || !numero) { console.error('Uso: node scripts/montar-story.mjs <produtos.json> <numero> --tam M --confirmado'); process.exit(1); }
  const p = JSON.parse(readFileSync(lista, 'utf8'))[Number(numero) - 1];
  if (!p) { console.error(`Não há produto ${numero} na lista.`); process.exit(1); }
  if (!args.includes('--confirmado')) {
    console.error(`Preço de hoje: ${p.nome} ${p.desconto ? `${reais(p.precoDe)} → ` : ''}${reais(p.precoPor)}.\n`
      + 'Mostre ao vendedor e, com o OK dele, rode de novo com --confirmado.');
    process.exit(1);
  }
  const tam = opc('--tam');
  const nFoto = Number(opc('--foto') ?? 1);
  const slug = p.nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const pasta = opc('--pasta') ?? join('hyperframes', 'projetos', `story-${slug}`);
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  mkdirSync(join(pasta, 'assets'), { recursive: true });
  const url = p.fotos[nFoto - 1];
  if (!url) { console.error(`O produto tem ${p.fotos.length} fotos; escolha --foto de 1 a ${p.fotos.length}.`); process.exit(1); }
  const resp = await fetch(url);
  if (!resp.ok) { console.error(`Não consegui baixar a foto (${resp.status}).`); process.exit(1); }
  writeFileSync(join(pasta, 'assets', 'foto.jpg'), Buffer.from(await resp.arrayBuffer()));
  for (const f of ['hyperframes.json', 'package.json']) copyFileSync(join(raiz, 'hyperframes', 'modelos', 'filme-em-takes', f), join(pasta, f));
  copyFileSync(join(raiz, 'assets', 'fontes', 'Manrope-variable.ttf'), join(pasta, 'assets', 'Manrope-variable.ttf'));
  const { cupom } = lerConfig();
  writeFileSync(join(pasta, 'index.html'), montarStory(p, { tam, cupom, foto: 'assets/foto.jpg' }));
  console.log(`Story montado em ${pasta}${cupom ? ` (cupom ${cupom})` : ' (sem cupom)'}. Gere o PNG com: ./hyperframes/hf.sh ${pasta.replace(/^hyperframes[\\/]/, '')} snapshot --at 1`);
}

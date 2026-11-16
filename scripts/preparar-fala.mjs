// Prepara a gravação de talking head: vertical 1080x1920 30 fps, áudio mono nos dois lados
// e normalizado (~-14 LUFS), e pausas cortadas (acima de 0,16 s ficam 0,10 s; fim de frase 0,14 s).
// Uso: node scripts/preparar-fala.mjs <gravacao.mp4> <saida.mp4> [--seco] [--palavras p.json --cortar "12-18,40-44"]
//   --seco     edição "sem cara de IA": pausa a partir de 0,12 s vira 0,06 s e sai o silêncio do começo e do fim
//   --cortar   tira frases (índices de palavra, contando de 0, do palavras.json do BRUTO); o corte cai no silêncio
// Depois: node scripts/transcrever.mjs <saida.mp4> palavras.json
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ffmpeg, ehPrincipal } from './ferramentas.mjs';

const FPS = 30;
const MIN_CORTE = 0.16;
const q = (t) => Math.round(t * FPS) / FPS;

const EMENDA_RUIDO = 0.08; // silêncios separados por um estalo menor que isso viram uma pausa só

function juntarSilencios(silencios) {
  const out = [];
  for (const s of [...silencios].sort((a, b) => a.inicio - b.inicio)) {
    const ult = out[out.length - 1];
    if (ult && s.inicio - ult.fim < EMENDA_RUIDO) ult.fim = Math.max(ult.fim, s.fim);
    else out.push({ ...s });
  }
  return out;
}

export function planejarCortes(silencios, duracao, { seco = false } = {}) {
  const cortes = [];
  let comeco = 0;
  let final = duracao;
  for (const { inicio, fim } of juntarSilencios(silencios)) {
    const d = fim - inicio;
    if (seco && inicio <= 0.05 && d > 0.1) { comeco = q(Math.max(0, fim - 0.05)); continue; }
    if (seco && fim >= duracao - 0.05 && d > 0.1) { final = q(Math.min(duracao, inicio + 0.05)); continue; }
    if (d < (seco ? 0.12 : MIN_CORTE) || (!seco && (inicio < 0.3 || fim > duracao - 0.4))) continue;
    const fica = seco ? 0.06 : d > 0.5 ? 0.14 : 0.1;
    const a = q(inicio + fica / 2);
    const b = q(fim - fica / 2);
    if (b > a) cortes.push([a, b]);
  }
  const trechos = [];
  let t = comeco;
  for (const [a, b] of cortes) { if (a > t) trechos.push({ inicio: t, fim: a }); t = b; }
  trechos.push({ inicio: t, fim: final });
  return trechos;
}

// "12-18,40-44" → intervalos de tempo a remover, com as bordas no meio do silêncio entre palavras
export function intervalosPoda(palavras, faixas) {
  return faixas.split(',').map((f) => f.trim()).filter(Boolean).map((f) => {
    const [a, b = a] = f.split('-').map(Number);
    if (!(a >= 0 && b >= a && b < palavras.length)) throw new Error(`Faixa "${f}": a lista tem ${palavras.length} palavras (0 a ${palavras.length - 1}).`);
    const antes = palavras[a - 1];
    const depois = palavras[b + 1];
    const inicio = antes ? (antes.end + palavras[a].start) / 2 : 0;
    const fim = depois ? (palavras[b].end + depois.start) / 2 : palavras[b].end + 0.05;
    return { inicio: q(inicio), fim: q(fim) };
  });
}

export function subtrair(trechos, remover) {
  let out = trechos.map((t) => ({ ...t }));
  for (const r of remover) {
    out = out.flatMap((t) => {
      if (r.fim <= t.inicio || r.inicio >= t.fim) return [t];
      const partes = [];
      if (r.inicio > t.inicio) partes.push({ inicio: t.inicio, fim: r.inicio });
      if (r.fim < t.fim) partes.push({ inicio: r.fim, fim: t.fim });
      return partes;
    });
  }
  return out.filter((t) => t.fim - t.inicio >= 1 / FPS);
}

function silencios(ff, arquivo) {
  const log = spawnSync(ff, ['-hide_banner', '-nostats', '-i', arquivo, '-af', 'silencedetect=noise=-38dB:d=0.05', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const ini = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const fim = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const dur = log.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const duracao = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0;
  return { lista: ini.map((s, i) => ({ inicio: s, fim: fim[i] ?? duracao })), duracao };
}

if (ehPrincipal(import.meta.url)) {
  // --manter: não recorta para 1080x1920 (para edições que usam a imagem deitada, ex.: tela dividida)
  const argv = process.argv.slice(2);
  const manter = argv.includes('--manter');
  const seco = argv.includes('--seco');
  const opc = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
  const arqPalavras = opc('--palavras');
  const faixas = opc('--cortar');
  if (faixas && !arqPalavras) { console.error('--cortar precisa de --palavras <palavras.json do bruto>.'); process.exit(1); }
  const [entrada, saida] = argv.filter((a, i) => !a.startsWith('--') && !['--palavras', '--cortar'].includes(argv[i - 1]));
  if (!entrada || !saida) { console.error('Uso: node scripts/preparar-fala.mjs <gravacao.mp4> <saida.mp4> [--manter] [--seco] [--palavras p.json --cortar "a-b"]'); process.exit(1); }
  const ff = ffmpeg();
  // 1) áudio mono e normalizado primeiro: as pausas são medidas já no nível final
  const voz = join(mkdtempSync(join(tmpdir(), 'rs-fala-')), 'voz.wav');
  const n = spawnSync(ff, ['-y', '-loglevel', 'error', '-i', entrada, '-vn', '-af',
    'aformat=channel_layouts=mono,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000', voz], { stdio: 'inherit' });
  if (n.status !== 0) process.exit(n.status ?? 1);
  const { lista, duracao } = silencios(ff, voz);
  let trechos = planejarCortes(lista, duracao, { seco });
  if (faixas) {
    const remover = intervalosPoda(JSON.parse(readFileSync(arqPalavras, 'utf8')), faixas);
    trechos = subtrair(trechos, remover);
    console.log(`Poda: ${remover.length} trecho(s) removido(s), ${remover.reduce((s, r) => s + r.fim - r.inicio, 0).toFixed(1)} s.`);
  }
  // o último trecho termina num quadro inteiro, para vídeo e áudio terem a mesma duração
  trechos[trechos.length - 1].fim = Math.floor(trechos[trechos.length - 1].fim * FPS) / FPS;
  // vídeo: select pelo número do quadro (um passe só, rápido e exato)
  const manterV = trechos.map((t) => `between(n,${Math.round(t.inicio * FPS)},${Math.round(t.fim * FPS) - 1})`).join('+');
  // áudio: atrim por trecho (exato na amostra; aselect cortaria em blocos de ~21 ms e o som escorregaria)
  const partesA = trechos.map((t, i) => `[a${i}]atrim=start=${t.inicio.toFixed(5)}:end=${t.fim.toFixed(5)},asetpts=PTS-STARTPTS[b${i}]`);
  const filtro = `[0:v]fps=30,select='${manterV}',setpts=N/30/TB${manter ? '' : ',scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'}[vo];`
    + `[1:a]asplit=${trechos.length}${trechos.map((_, i) => `[a${i}]`).join('')};${partesA.join(';')};`
    + `${trechos.map((_, i) => `[b${i}]`).join('')}concat=n=${trechos.length}:v=0:a=1,aformat=channel_layouts=stereo[ao]`;
  const r = spawnSync(ff, ['-y', '-loglevel', 'error', '-i', entrada, '-i', voz, '-filter_complex', filtro, '-map', '[vo]', '-map', '[ao]',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', saida], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
  const novo = trechos.reduce((s, t) => s + t.fim - t.inicio, 0);
  console.log(`Pronto: ${saida} (${duracao.toFixed(1)} s → ${novo.toFixed(1)} s, ${trechos.length - 1} corte(s)${seco ? ', modo seco' : ''}).`);
}

// Prepara a gravação de talking head: vertical 1080x1920 30 fps, áudio mono nos dois lados
// e normalizado (~-14 LUFS), e pausas cortadas (acima de 0,16 s ficam 0,10 s; fim de frase 0,14 s).
// Uso: node scripts/preparar-fala.mjs <gravacao.mp4> <saida.mp4>
// Depois: node scripts/transcrever.mjs <saida.mp4> palavras.json
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ffmpeg, ehPrincipal } from './ferramentas.mjs';

const FPS = 30;
const MIN_CORTE = 0.16;
const q = (t) => Math.round(t * FPS) / FPS;

export function planejarCortes(silencios, duracao) {
  const cortes = [];
  for (const { inicio, fim } of silencios) {
    const d = fim - inicio;
    if (d < MIN_CORTE || inicio < 0.3 || fim > duracao - 0.4) continue;
    const fica = d > 0.5 ? 0.14 : 0.1;
    const a = q(inicio + fica / 2);
    const b = q(fim - fica / 2);
    if (b > a) cortes.push([a, b]);
  }
  const trechos = [];
  let t = 0;
  for (const [a, b] of cortes) { if (a > t) trechos.push({ inicio: t, fim: a }); t = b; }
  trechos.push({ inicio: t, fim: duracao });
  return trechos;
}

function silencios(ff, arquivo) {
  const log = spawnSync(ff, ['-hide_banner', '-nostats', '-i', arquivo, '-af', 'silencedetect=noise=-38dB:d=0.14', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const ini = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const fim = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const dur = log.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const duracao = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0;
  return { lista: ini.map((s, i) => ({ inicio: s, fim: fim[i] ?? duracao })), duracao };
}

if (ehPrincipal(import.meta.url)) {
  const [entrada, saida] = process.argv.slice(2);
  if (!entrada || !saida) { console.error('Uso: node scripts/preparar-fala.mjs <gravacao.mp4> <saida.mp4>'); process.exit(1); }
  const ff = ffmpeg();
  // 1) áudio mono e normalizado primeiro: as pausas são medidas já no nível final
  const voz = join(mkdtempSync(join(tmpdir(), 'rs-fala-')), 'voz.wav');
  const n = spawnSync(ff, ['-y', '-loglevel', 'error', '-i', entrada, '-vn', '-af',
    'aformat=channel_layouts=mono,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000', voz], { stdio: 'inherit' });
  if (n.status !== 0) process.exit(n.status ?? 1);
  const { lista, duracao } = silencios(ff, voz);
  const trechos = planejarCortes(lista, duracao);
  const partes = trechos.map((s, i) =>
    `[0:v]trim=start=${s.inicio}:end=${s.fim},setpts=PTS-STARTPTS[v${i}];[1:a]atrim=start=${s.inicio}:end=${s.fim},asetpts=PTS-STARTPTS[a${i}]`);
  const juntar = trechos.map((_, i) => `[v${i}][a${i}]`).join('');
  const filtro = `${partes.join(';')};${juntar}concat=n=${trechos.length}:v=1:a=1[v][a];`
    + '[v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30[vo];'
    + '[a]aformat=channel_layouts=stereo[ao]';
  const r = spawnSync(ff, ['-y', '-loglevel', 'error', '-i', entrada, '-i', voz, '-filter_complex', filtro, '-map', '[vo]', '-map', '[ao]',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', saida], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
  const novo = trechos.reduce((s, t) => s + t.fim - t.inicio, 0);
  console.log(`Pronto: ${saida} (${duracao.toFixed(1)} s → ${novo.toFixed(1)} s, ${trechos.length - 1} pausa(s) cortada(s)).`);
}

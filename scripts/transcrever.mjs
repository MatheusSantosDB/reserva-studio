// Transcreve a fala com o tempo de cada palavra, no próprio computador (Whisper local, sem chave).
// Uso: node scripts/transcrever.mjs <video-ou-audio> <palavras.json> [--preciso] [--ate 15]
//   --ate N   transcreve só os primeiros N segundos (para a amostra: em PC lento, o vídeo inteiro
//             leva alguns minutos; faça o inteiro só depois da amostra aprovada)
//   --preciso usa o modelo large-v3-turbo (acerta mais nomes, mas é bem mais lento).
//   --groq    transcreve pela API do Groq (Whisper large-v3-turbo): segundos em vez de minutos, ótimo para o vídeo inteiro.
//             Precisa de GROQ_API_KEY no .env (grátis em https://console.groq.com/keys). O áudio sai do computador.
//             Confira: às vezes uma palavra vem com fim antes do início (a legenda.mjs já trata).
// Primeira vez: pip install faster-whisper (o modelo é baixado sozinho).
// Revise os nomes de produto no JSON depois: a transcrição automática erra nomes.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { readFileSync, writeFileSync } from 'node:fs';
import { RAIZ, ffmpeg, ehPrincipal, lerEnv } from './ferramentas.mjs';

const DICA = 'Reserva, Claude Code, cupom, look, camisa, polo, bermuda, tênis.';
async function viaGroq(midia, saida) {
  const chave = lerEnv('GROQ_API_KEY');
  if (!chave) { console.error('Falta GROQ_API_KEY no .env (crie grátis em https://console.groq.com/keys) ou rode sem --groq.'); process.exit(1); }
  const mp3 = join(mkdtempSync(join(tmpdir(), 'rs-groq-')), 'a.mp3');
  const c = spawnSync(ffmpeg(), ['-y', '-loglevel', 'error', '-i', midia, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', mp3], { stdio: 'inherit' });
  if (c.status !== 0) process.exit(1);
  const form = new FormData();
  form.append('model', 'whisper-large-v3-turbo');
  form.append('language', 'pt');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  form.append('temperature', '0');
  form.append('prompt', DICA);
  form.append('file', new Blob([readFileSync(mp3)], { type: 'audio/mpeg' }), 'a.mp3');
  const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${chave}` }, body: form });
  if (!r.ok) { console.error(`Groq respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`); process.exit(1); }
  const j = await r.json();
  const pal = (j.words || []).map((w) => ({ text: w.word.trim(), start: Math.round(w.start * 1000) / 1000, end: Math.round(w.end * 1000) / 1000 }));
  writeFileSync(saida, JSON.stringify(pal, null, 1));
  console.log(`[groq] ${pal.length} palavras em ${saida}`);
}

if (ehPrincipal(import.meta.url)) {
  const args = process.argv.slice(2);
  const preciso = args.includes('--preciso');
  const groq = args.includes('--groq');
  const iAte = args.indexOf('--ate');
  const ate = iAte >= 0 ? Number(args.splice(iAte, 2)[1]) : null;
  const [entrada, saida] = args.filter((a) => !a.startsWith('--'));
  if (!entrada || !saida) {
    console.error('Uso: node scripts/transcrever.mjs <video-ou-audio> <palavras.json> [--preciso]');
    process.exit(1);
  }
  if (!existsSync(entrada)) { console.error(`Arquivo não encontrado: ${entrada}`); process.exit(1); }
  let midia = entrada;
  if (ate) {
    midia = join(mkdtempSync(join(tmpdir(), 'rs-amostra-')), 'amostra.wav');
    const c = spawnSync(ffmpeg(), ['-y', '-loglevel', 'error', '-i', entrada, '-t', String(ate), '-vn', '-ac', '1', '-ar', '16000', midia], { stdio: 'inherit' });
    if (c.status !== 0) process.exit(1);
  }
  if (groq) { await viaGroq(midia, saida); process.exit(0); }
  const script = join(RAIZ, '.claude', 'skills', 'watch', 'scripts', 'whisper_local.py');
  const python = process.platform === 'win32' ? 'python' : 'python3';
  const r = spawnSync(python, [script, midia, saida, '--palavras', '--modelo', preciso ? 'large-v3-turbo' : 'small'], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

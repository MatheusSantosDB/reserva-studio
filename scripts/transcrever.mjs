// Transcreve a fala com o tempo de cada palavra, no próprio computador (Whisper local, sem chave).
// Uso: node scripts/transcrever.mjs <video-ou-audio> <palavras.json> [--preciso] [--ate 15]
//   --ate N   transcreve só os primeiros N segundos (para a amostra: em PC lento, o vídeo inteiro
//             leva alguns minutos; faça o inteiro só depois da amostra aprovada)
//   --preciso usa o modelo large-v3-turbo (acerta mais nomes, mas é bem mais lento).
// Primeira vez: pip install faster-whisper (o modelo é baixado sozinho).
// Revise os nomes de produto no JSON depois: a transcrição automática erra nomes.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { RAIZ, ffmpeg, ehPrincipal } from './ferramentas.mjs';

if (ehPrincipal(import.meta.url)) {
  const args = process.argv.slice(2);
  const preciso = args.includes('--preciso');
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
  const script = join(RAIZ, '.claude', 'skills', 'watch', 'scripts', 'whisper_local.py');
  const python = process.platform === 'win32' ? 'python' : 'python3';
  const r = spawnSync(python, [script, midia, saida, '--palavras', '--modelo', preciso ? 'large-v3-turbo' : 'small'], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

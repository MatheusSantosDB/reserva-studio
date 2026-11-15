// Utilitários comuns: achar o FFmpeg e ler o .env (chaves ficam só nele, fora do git).
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

export function lerEnv(nome) {
  if (process.env[nome]) return process.env[nome];
  if (process.env.RS_SEM_DOTENV) return null;
  const arq = join(RAIZ, '.env');
  if (!existsSync(arq)) return null;
  for (const linha of readFileSync(arq, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[1] === nome) return m[2].replace(/^["']|["']$/g, '') || null;
  }
  return null;
}

export function ffmpeg(nome = 'ffmpeg') {
  const dir = process.env.FFMPEG_DIR;
  const exe = process.platform === 'win32' ? `${nome}.exe` : nome;
  if (dir && existsSync(join(dir, exe))) return join(dir, exe);
  const r = spawnSync(nome, ['-version'], { encoding: 'utf8' });
  if (r.status === 0) return nome;
  console.error('FFmpeg não encontrado. Veja a seção "Instalar o FFmpeg" do README.md (ou defina FFMPEG_DIR).');
  process.exit(1);
}

export const ehPrincipal = (url) => process.argv[1] && fileURLToPath(url) === process.argv[1];

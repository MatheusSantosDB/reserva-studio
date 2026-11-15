// Lê config/vendedor.json (fora do git). Campo vazio ou arquivo ausente = null.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

export function lerConfig(raiz = RAIZ) {
  const arquivo = join(raiz, 'config', 'vendedor.json');
  const dados = existsSync(arquivo) ? JSON.parse(readFileSync(arquivo, 'utf8')) : {};
  const limpo = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return { cupom: limpo(dados.cupom), instagram: limpo(dados.instagram) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(JSON.stringify(lerConfig(), null, 2));
}

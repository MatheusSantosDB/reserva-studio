// Biblioteca local de B-roll (vídeos e fotos SEUS: loja, vitrine, sacola, provador, rua).
// Os arquivos ficam em assets/broll/ (fora do git); o índice em assets/broll/indice.json.
// Uso:
//   node scripts/broll.mjs adicionar <arquivo> "descrição curta" tag1,tag2
//   node scripts/broll.mjs buscar <palavra>
//   node scripts/broll.mjs listar
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, ehPrincipal } from './ferramentas.mjs';

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const lerIndice = (dir) => (existsSync(join(dir, 'indice.json')) ? JSON.parse(readFileSync(join(dir, 'indice.json'), 'utf8')) : []);

export function adicionar(dir, arquivo, descricao, tags) {
  if (!existsSync(join(dir, arquivo))) throw new Error(`Arquivo não encontrado: ${join(dir, arquivo)}. Copie para a pasta da biblioteca primeiro.`);
  mkdirSync(dir, { recursive: true });
  const indice = lerIndice(dir);
  indice.push({ arquivo, descricao, tags: tags.map((t) => t.trim()).filter(Boolean), adicionado: new Date().toISOString().slice(0, 10) });
  writeFileSync(join(dir, 'indice.json'), JSON.stringify(indice, null, 2));
  return indice.at(-1);
}

export function buscar(dir, termo) {
  const t = norm(termo);
  return lerIndice(dir).filter((b) => norm(b.descricao).includes(t) || b.tags.some((x) => norm(x).includes(t)));
}

if (ehPrincipal(import.meta.url)) {
  const dir = join(RAIZ, 'assets', 'broll');
  const [cmd, ...resto] = process.argv.slice(2);
  const mostrar = (l) => console.log(l.length ? l.map((b) => `${b.arquivo}  —  ${b.descricao}  [${b.tags.join(', ')}]`).join('\n') : 'Nada encontrado.');
  try {
    if (cmd === 'adicionar' && resto.length >= 2) console.log('Adicionado:', adicionar(dir, resto[0], resto[1], (resto[2] ?? '').split(',')).arquivo);
    else if (cmd === 'buscar' && resto[0]) mostrar(buscar(dir, resto.join(' ')));
    else if (cmd === 'listar') mostrar(lerIndice(dir));
    else { console.error('Uso: node scripts/broll.mjs adicionar <arquivo> "descrição" tag1,tag2 | buscar <palavra> | listar'); process.exit(1); }
  } catch (e) { console.error(e.message); process.exit(1); }
}

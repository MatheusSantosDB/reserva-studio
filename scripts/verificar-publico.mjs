// Verificador antes de publicar: procura chaves de API, caminhos pessoais e
// termos proibidos (lista local em config/termos-proibidos.txt, fora do git).
// Uso: node scripts/verificar-publico.mjs   (sai com código 1 se achar algo)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const IGNORAR = new Set(['.git', 'node_modules', 'work', 'entregas', 'originais']);
const ARQUIVOS_LOCAIS = new Set(['config/termos-proibidos.txt', 'config/vendedor.json', '.env']);
const BINARIOS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.mov', '.mp3', '.wav',
  '.m4a', '.ttf', '.otf', '.woff', '.woff2', '.pdf', '.zip', '.ico']);

const PADROES = [
  { termo: 'chave de API', re: /\b(sk-[A-Za-z0-9_-]{8,}|sk_[A-Za-z0-9]{8,}|gsk_[A-Za-z0-9]+|AIza[0-9A-Za-z_-]{20,}|xi-api-key\s*[:=]\s*\S+)/ },
  { termo: 'chave de API', re: /\b[A-Z0-9_]*(API_KEY|TOKEN|SECRET)\s*[=:]\s*["']?[A-Za-z0-9_\-]{8,}/ },
  { termo: 'caminho pessoal', re: /\b[A-Z]:[\\/]|\/(Users|home)\/[^\s/]+|\/[a-z]\/Users\//i },
];

function escapar(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function lerLista(raiz) {
  const arq = join(raiz, 'config', 'termos-proibidos.txt');
  if (!existsSync(arq)) return [];
  return readFileSync(arq, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

function* andar(raiz, pasta = raiz) {
  for (const nome of readdirSync(pasta)) {
    if (IGNORAR.has(nome)) continue;
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) yield* andar(raiz, caminho);
    else yield caminho;
  }
}

export function varrer(raiz, { termos } = {}) {
  const lista = (termos ?? lerLista(raiz)).map((t) => ({
    termo: t, re: new RegExp(`(?<![\\p{L}\\p{N}])${escapar(t)}(?![\\p{L}\\p{N}])`, 'iu'),
  }));
  const achados = [];
  const binarios = [];
  for (const caminho of andar(raiz)) {
    const rel = relative(raiz, caminho).split('\\').join('/');
    if (ARQUIVOS_LOCAIS.has(rel)) continue;
    for (const t of lista) if (t.re.test(rel)) achados.push({ arquivo: rel, linha: 0, termo: t.termo });
    if (BINARIOS.has(extname(rel).toLowerCase())) { binarios.push(rel); continue; }
    const linhas = readFileSync(caminho, 'utf8').split(/\r?\n/);
    linhas.forEach((texto, i) => {
      for (const p of [...PADROES, ...lista]) {
        if (p.re.test(texto)) achados.push({ arquivo: rel, linha: i + 1, termo: p.termo });
      }
    });
  }
  return { achados, binarios };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
  const { achados, binarios } = varrer(raiz);
  for (const a of achados) console.log(`PROBLEMA  ${a.arquivo}:${a.linha}  (${a.termo})`);
  console.log(`\n${binarios.length} arquivo(s) binário(s) para olhar à mão:`);
  for (const b of binarios) console.log(`  ${b}`);
  console.log(achados.length ? `\n${achados.length} problema(s). Não publique ainda.` : '\nNenhum problema encontrado.');
  process.exit(achados.length ? 1 : 0);
}

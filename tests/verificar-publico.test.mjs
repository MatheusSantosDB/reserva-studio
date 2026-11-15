import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { varrer } from '../scripts/verificar-publico.mjs';

function pasta(arquivos) {
  const raiz = mkdtempSync(join(tmpdir(), 'rs-'));
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    const caminho = join(raiz, nome);
    mkdirSync(join(caminho, '..'), { recursive: true });
    writeFileSync(caminho, conteudo);
  }
  return raiz;
}

const LISTA = ['CUPOM123', 'fulano'];
const termos = (r) => r.achados.map((a) => a.termo);

test('acha cupom pessoal no texto', () => {
  const r = varrer(pasta({ 'a.md': 'use o cupom CUPOM123 hoje' }), { termos: LISTA });
  assert.ok(termos(r).includes('CUPOM123'));
});

test('acha termo proibido no nome do arquivo', () => {
  const r = varrer(pasta({ 'assets/Fulano-x.png': 'x' }), { termos: LISTA });
  assert.ok(r.achados.some((a) => a.arquivo.includes('Fulano-x.png')));
});

test('acha chave de API', () => {
  const r = varrer(pasta({ '.env.example': 'GROQ_API_KEY=' + 'gsk' + '_abc123' }));
  assert.ok(termos(r).includes('chave de API'));
});

test('acha caminho pessoal do Windows', () => {
  const r = varrer(pasta({ 'b.sh': 'cd ' + 'E:' + '\\pasta' }));
  assert.ok(termos(r).includes('caminho pessoal'));
});

test('arquivos limpos não geram achado', () => {
  const r = varrer(pasta({
    '.gitignore': 'config/vendedor.json\n.env\n',
    'config/vendedor.example.json': '{"cupom": "", "instagram": ""}',
    '.env.example': 'ELEVENLABS_API_KEY=\n',
  }));
  assert.deepEqual(r.achados, []);
});

test('lê a lista local de termos em config/termos-proibidos.txt', () => {
  const r = varrer(pasta({ 'config/termos-proibidos.txt': '# comentário\nfulano\n', 'x.md': 'oi Fulano' }));
  assert.ok(termos(r).includes('fulano'));
  assert.ok(!r.achados.some((a) => a.arquivo.includes('termos-proibidos')));
});

test('não confunde termo com pedaço de palavra', () => {
  const r = varrer(pasta({ 'x.md': 'fulanos e afulano' }), { termos: ['fulano'] });
  assert.deepEqual(r.achados, []);
});

test('lista binários para revisão manual', () => {
  const r = varrer(pasta({ 'foto.png': 'x' }));
  assert.ok(r.binarios.some((b) => b.endsWith('foto.png')));
});

test('ignora .git e node_modules', () => {
  const r = varrer(pasta({ '.git/x': 'CUPOM123', 'node_modules/y.js': 'CUPOM123' }), { termos: LISTA });
  assert.deepEqual(r.achados, []);
});

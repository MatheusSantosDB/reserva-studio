import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gerarPopups } from '../scripts/popups.mjs';
import { listarIndices } from '../scripts/palavras.mjs';
import { adicionar, buscar } from '../scripts/broll.mjs';

test('pop-ups viram window.POPUPS em ordem', () => {
  const js = gerarPopups([{ imagem: 'assets/b.png', inicio: 5, fim: 7 }, { imagem: 'assets/a.png', inicio: 1, fim: 2.5, texto: 'Entressola' }]);
  const POPUPS = new Function(`const window={};${js};return window.POPUPS;`)();
  assert.deepEqual(POPUPS.map((p) => p.imagem), ['assets/a.png', 'assets/b.png']);
  assert.equal(POPUPS[0].texto, 'Entressola');
});

test('pop-up sobreposto é recusado (um por vez)', () => {
  assert.throws(() => gerarPopups([{ imagem: 'a', inicio: 1, fim: 3 }, { imagem: 'b', inicio: 2.5, fim: 4 }]), /mesmo tempo/);
});

test('pop-up curto demais é recusado', () => {
  assert.throws(() => gerarPopups([{ imagem: 'a', inicio: 1, fim: 1.4 }]), /0,8 s/);
});

test('lista as palavras com índice para escolher a poda', () => {
  const s = listarIndices([{ text: 'essa', start: 0, end: 0.3 }, { text: 'jaqueta', start: 0.4, end: 0.9 }]);
  assert.match(s, /\[0\] essa/);
  assert.match(s, /\[1\] jaqueta/);
});

test('biblioteca de B-roll: adiciona e busca por tag ou descrição', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rs-broll-'));
  mkdirSync(join(dir, 'arquivos'));
  writeFileSync(join(dir, 'arquivos', 'loja.mp4'), 'x');
  adicionar(dir, 'arquivos/loja.mp4', 'fachada da loja à noite', ['loja', 'noite']);
  adicionar(dir, 'arquivos/loja.mp4', 'sacola no balcão', ['sacola']);
  assert.equal(buscar(dir, 'noite').length, 1);
  assert.equal(buscar(dir, 'balcão')[0].descricao, 'sacola no balcão');
  assert.equal(buscar(dir, 'praia').length, 0);
});

test('B-roll de arquivo que não existe é recusado', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rs-broll-'));
  assert.throws(() => adicionar(dir, 'nada.mp4', 'x', []), /não encontrado/);
});

test('pop-up aceita posição topo/esquerda/direita e recusa outra', () => {
  const js = gerarPopups([{ imagem: 'a', inicio: 1, fim: 2, pos: 'direita' }]);
  assert.match(js, /"pos":"direita"/);
  assert.throws(() => gerarPopups([{ imagem: 'a', inicio: 1, fim: 2, pos: 'meio' }]), /posição/);
});

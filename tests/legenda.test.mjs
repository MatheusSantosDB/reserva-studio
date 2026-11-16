import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agrupar } from '../scripts/legenda.mjs';

const palavras = (textos, passo = 0.3, pausaDepois = {}) => {
  let t = 0;
  return textos.map((texto, i) => {
    const p = { text: texto, start: t, end: t + passo };
    t += passo + (pausaDepois[i] ?? 0);
    return p;
  });
};

test('7 palavras sem pausa: grupos de 3, 3 e 1', () => {
  const g = agrupar(palavras(['a', 'b', 'c', 'd', 'e', 'f', 'g']));
  assert.deepEqual(g.map((x) => x.texto), ['a b c', 'd e f', 'g']);
});

test('pausa de 0,5 s força o corte', () => {
  const g = agrupar(palavras(['a', 'b', 'c', 'd'], 0.3, { 0: 0.5 }));
  assert.deepEqual(g.map((x) => x.texto), ['a', 'b c d']);
});

test('pontuação fecha o grupo', () => {
  const g = agrupar(palavras(['olha', 'isso.', 'agora', 'vai']));
  assert.deepEqual(g.map((x) => x.texto), ['olha isso.', 'agora vai']);
});

test('grupo vai até o início do próximo, sem buraco curto', () => {
  const g = agrupar(palavras(['a', 'b', 'c', 'd']));
  assert.equal(g[0].inicio, 0);
  assert.equal(g[0].fim, g[1].inicio);
});

test('palavra com fim antes do início não deixa legenda presa', () => {
  const g = agrupar([{ text: 'Claude', start: 5.0, end: 4.98 }, { text: 'agora', start: 5.5, end: 5.8 }]);
  for (const x of g) assert.ok(x.fim > x.inicio, `${x.texto}: ${x.inicio} → ${x.fim}`);
  assert.ok(g[0].fim <= g[1].inicio);
});

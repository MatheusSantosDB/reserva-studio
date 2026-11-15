import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { planejarCortes } from '../scripts/preparar-fala.mjs';

test('sem pausa longa: um trecho só, o vídeo inteiro', () => {
  assert.deepEqual(planejarCortes([{ inicio: 2, fim: 2.1 }], 10), [{ inicio: 0, fim: 10 }]);
});

test('pausa de 0,4 s vira 0,10 s', () => {
  const t = planejarCortes([{ inicio: 3, fim: 3.4 }], 10);
  assert.equal(t.length, 2);
  const sobra = (t[0].fim - 3) + (3.4 - t[1].inicio);
  assert.ok(Math.abs(sobra - 0.1) < 0.034, `sobrou ${sobra}`);
});

test('pausa de fim de frase (> 0,5 s) vira 0,14 s', () => {
  const t = planejarCortes([{ inicio: 5, fim: 6 }], 10);
  const sobra = (t[0].fim - 5) + (6 - t[1].inicio);
  assert.ok(Math.abs(sobra - 0.14) < 0.034, `sobrou ${sobra}`);
});

test('cortes alinhados a quadros de 30 fps', () => {
  const t = planejarCortes([{ inicio: 3.01, fim: 3.53 }], 10);
  for (const x of t.flatMap((s) => [s.inicio, s.fim])) {
    assert.ok(Math.abs(x * 30 - Math.round(x * 30)) < 1e-6, `${x} fora do quadro`);
  }
});

test('não corta silêncio do comecinho nem do finalzinho', () => {
  assert.deepEqual(planejarCortes([{ inicio: 0, fim: 0.8 }, { inicio: 9.5, fim: 10 }], 10), [{ inicio: 0, fim: 10 }]);
});

test('silêncios separados por ruído curto contam como uma pausa só', () => {
  const t = planejarCortes([{ inicio: 3.0, fim: 3.12 }, { inicio: 3.17, fim: 3.32 }], 10);
  assert.equal(t.length, 2, 'a pausa de 0,32 s (com um estalo no meio) devia ser cortada');
});

test('transcrever sem argumentos mostra o uso e sai com 1', () => {
  const r = spawnSync(process.execPath, ['scripts/transcrever.mjs'], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Uso:/);
});

test('transcrever com arquivo que não existe avisa', () => {
  const r = spawnSync(process.execPath, ['scripts/transcrever.mjs', 'nao-existe.mp4', 'x.json'], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /não encontrado/);
});

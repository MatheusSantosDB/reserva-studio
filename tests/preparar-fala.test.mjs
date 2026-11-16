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

import { intervalosPoda, subtrair } from '../scripts/preparar-fala.mjs';

test('modo seco: pausa de 0,3 s vira ~0,06 s', () => {
  const t = planejarCortes([{ inicio: 3, fim: 3.3 }], 10, { seco: true });
  assert.equal(t.length, 2);
  const sobra = (t[0].fim - 3) + (3.3 - t[1].inicio);
  assert.ok(Math.abs(sobra - 0.06) < 0.034, `sobrou ${sobra}`);
});

test('modo seco: pausa de 0,13 s também sai (normal deixaria)', () => {
  assert.equal(planejarCortes([{ inicio: 3, fim: 3.13 }], 10).length, 1);
  assert.equal(planejarCortes([{ inicio: 3, fim: 3.13 }], 10, { seco: true }).length, 2);
});

test('modo seco: tira o silêncio do começo e do fim', () => {
  const t = planejarCortes([{ inicio: 0, fim: 0.8 }, { inicio: 9.2, fim: 10 }], 10, { seco: true });
  assert.ok(t[0].inicio >= 0.7 && t[0].inicio <= 0.8, `começa em ${t[0].inicio}`);
  assert.ok(t.at(-1).fim >= 9.2 && t.at(-1).fim <= 9.3, `termina em ${t.at(-1).fim}`);
});

const PAL = [
  { text: 'essa', start: 0.0, end: 0.3 }, { text: 'jaqueta', start: 0.4, end: 0.9 },
  { text: 'essa', start: 1.3, end: 1.5 }, { text: 'jaqueta', start: 1.6, end: 2.0 },
  { text: 'é', start: 2.4, end: 2.5 }, { text: 'leve', start: 2.6, end: 3.0 },
];

test('poda corta pelo meio dos silêncios em volta das palavras', () => {
  const [r] = intervalosPoda(PAL, '2-3');
  assert.ok(r.inicio > 0.9 && r.inicio < 1.3, `início ${r.inicio}`);
  assert.ok(r.fim > 2.0 && r.fim < 2.4, `fim ${r.fim}`);
});

test('poda rejeita índice fora da lista', () => {
  assert.throws(() => intervalosPoda(PAL, '4-9'), /palavra/);
});

test('subtrair tira o trecho podado dos trechos mantidos', () => {
  const t = subtrair([{ inicio: 0, fim: 10 }], [{ inicio: 2, fim: 4 }]);
  assert.deepEqual(t, [{ inicio: 0, fim: 2 }, { inicio: 4, fim: 10 }]);
});

test('pré-passe: girar, acelerar e clarear montam os filtros certos', async () => {
  const { filtrosPrepasse } = await import('../scripts/preparar-fala.mjs');
  assert.deepEqual(filtrosPrepasse(), { video: '', audio: '' });
  const f = filtrosPrepasse({ girar: 'anti', velocidade: 1.2, luz: true });
  assert.ok(f.video.startsWith('transpose=2,setpts=PTS/1.2,fps=30,eq='));
  assert.equal(f.audio, 'atempo=1.2');
  assert.equal(filtrosPrepasse({ girar: 'horario' }).video, 'transpose=1');
  assert.throws(() => filtrosPrepasse({ girar: 'cima' }));
});

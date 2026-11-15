import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { prepararTexto } from '../scripts/voz.mjs';

test('cupom é soletrado para a fala e emoji sai', () => {
  assert.equal(prepararTexto('use ABC10 🔥', 'ABC10'), 'use A B C dez');
});

test('cupom com 3 dígitos vira número falado', () => {
  assert.equal(prepararTexto('cupom XYZ123', 'XYZ123'), 'cupom X Y Z cento e vinte e três');
});

test('sem cupom: texto só perde emoji e espaço sobrando', () => {
  assert.equal(prepararTexto('olha  isso 😍 aqui', null), 'olha isso aqui');
});

test('elevenlabs sem chave avisa e sai com 1', () => {
  const r = spawnSync(process.execPath, ['scripts/voz.mjs', '--texto', 'oi', '--saida', 'x.mp3', '--motor', 'elevenlabs'], {
    env: { ...process.env, ELEVENLABS_API_KEY: '', RS_SEM_DOTENV: '1' }, encoding: 'utf8',
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ELEVENLABS_API_KEY/);
  assert.match(r.stderr, /edge/i);
});

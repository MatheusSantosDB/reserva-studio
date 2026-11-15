import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lerConfig } from '../scripts/config.mjs';

function raizCom(json) {
  const raiz = mkdtempSync(join(tmpdir(), 'rs-cfg-'));
  if (json !== undefined) {
    mkdirSync(join(raiz, 'config'));
    writeFileSync(join(raiz, 'config', 'vendedor.json'), json);
  }
  return raiz;
}

test('sem arquivo: tudo null', () => {
  assert.deepEqual(lerConfig(raizCom()), { cupom: null, instagram: null });
});

test('cupom vazio vira null', () => {
  assert.equal(lerConfig(raizCom('{"cupom": "  "}')).cupom, null);
});

test('cupom preenchido', () => {
  assert.equal(lerConfig(raizCom('{"cupom": "ABC10", "instagram": "@loja"}')).cupom, 'ABC10');
});

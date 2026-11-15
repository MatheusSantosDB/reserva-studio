import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarSlide } from '../scripts/montar-carrossel.mjs';
import { montarStory } from '../scripts/montar-story.mjs';

const SLIDE = { titulo: 'parece pesado.', destaque: 'mas é leve.', foto: 'assets/peca.png', cartoes: ['Entressola em EVA', 'Base de borracha'] };

test('slide 1080x1350, 8 s, com título, destaque e cartões', () => {
  const html = montarSlide(SLIDE, 0, 6, { cupom: null });
  assert.match(html, /data-width="1080" data-height="1350"/);
  assert.match(html, /data-duration="8"/);
  assert.match(html, /parece pesado\./);
  assert.match(html, /mas é leve\./);
  assert.equal((html.match(/class="cartao/g) || []).length, 2);
  assert.match(html, /01\/06/);
});

test('slide começa e termina na mesma pose (loop sem pulo)', () => {
  const html = montarSlide(SLIDE, 0, 6, { cupom: null });
  // as entradas terminam até a batida 13 (6,5 s) e nada sai depois disso
  const tempos = [...html.matchAll(/},([\d.]+)\);/g)].map((m) => Number(m[1]));
  assert.ok(tempos.length > 0);
  assert.ok(Math.max(...tempos) <= 6.5, `animação em ${Math.max(...tempos)} s`);
});

test('cupom só no slide de chamada e só se configurado', () => {
  const cta = { titulo: 'garanta o seu.', chamada: true };
  assert.match(montarSlide(cta, 5, 6, { cupom: 'ABC10' }), /ABC10/);
  assert.doesNotMatch(montarSlide(cta, 5, 6, { cupom: null }), /cupom/i);
  assert.doesNotMatch(montarSlide(SLIDE, 0, 6, { cupom: 'ABC10' }), /ABC10/);
});

const PRODUTO = {
  nome: 'Polo Tricot Brisa', precoDe: 559, precoPor: 447.9, desconto: 20,
  tamanhos: [{ tam: 'P', disponivel: true }, { tam: 'M', disponivel: true }, { tam: 'G', disponivel: false }],
  fotos: ['https://img/0100_01.jpg'],
};

test('story 1080x1920 com nome, preços e grade', () => {
  const html = montarStory(PRODUTO, { tam: 'M', cupom: null, foto: 'assets/foto.jpg' });
  assert.match(html, /data-width="1080" data-height="1920"/);
  assert.match(html, /Polo Tricot Brisa/);
  assert.match(html, /R\$ 559,00/);
  assert.match(html, /R\$ 447,90/);
  assert.match(html, /class="tam escolhido">M</);
  assert.match(html, /class="tam esgotado">G</);
});

test('story sem cupom não tem faixa; com cupom tem', () => {
  assert.doesNotMatch(montarStory(PRODUTO, { tam: 'M', cupom: null, foto: 'f.jpg' }), /cupom/i);
  assert.match(montarStory(PRODUTO, { tam: 'M', cupom: 'ABC10', foto: 'f.jpg' }), /id="faixa"[\s\S]*ABC10/);
});

test('story sem desconto mostra um preço só', () => {
  const html = montarStory({ ...PRODUTO, precoDe: 447.9, desconto: 0 }, { tam: 'M', cupom: null, foto: 'f.jpg' });
  assert.doesNotMatch(html, /class="de"/);
});

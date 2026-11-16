import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarExplica } from '../scripts/montar-explica.mjs';

const PAL = [
  { text: 'essa', start: 0.1, end: 0.3 }, { text: 'polo', start: 0.35, end: 0.7 },
  { text: 'custa', start: 0.8, end: 1.1 }, { text: 'pouco.', start: 1.15, end: 1.5 },
];
const PLANO = {
  duracao: 6,
  chaves: ['polo'],
  cenas: [
    { t0: 0, t1: 3, bg: 'ceu', els: [{ tipo: 'char', img: 'elenco/cliente-polo.png', cx: 300, bottom: 100, h: 800, nome: 'CLIENTE', anim: 'sl', t: 0.1 }] },
    { t0: 3, t1: 6, layout: 'split', bg: 'loja', els: [
      { tipo: 'img', img: 'assets/peca.png', cx: 540, top: 300, h: 500 },
      { tipo: 'tag', txt: 'R$ 199', cx: 540, top: 850 },
      { tipo: 'balao', txt: '?!', cx: 800, top: 200 },
    ] },
  ],
};

test('composição 1080x1920 com a voz cortada e a duração do plano', () => {
  const { html } = montarExplica(PLANO, PAL, { cupom: null });
  assert.match(html, /data-width="1080" data-height="1920"/);
  assert.match(html, /data-duration="6"/);
  assert.match(html, /<audio[^>]*src="assets\/fala\.mp4"/);
});

test('uma cena por bloco, com troca por corte', () => {
  const { html } = montarExplica(PLANO, PAL, { cupom: null });
  assert.equal((html.match(/class="cena"/g) || []).length, 2);
});

test('cena split mostra o rosto embaixo com o vídeo mudo (o som vem do audio)', () => {
  const { html } = montarExplica(PLANO, PAL, { cupom: null });
  assert.match(html, /class="rosto"[\s\S]*<video[^>]*muted[^>]*data-media-start="3"/);
});

test('legenda em maiúsculas por grupo e palavra-chave em destaque', () => {
  const { html } = montarExplica(PLANO, PAL, { cupom: null });
  assert.match(html, /<span class="k">polo<\/span>/);
  assert.match(html, /class="cap"/);
});

test('sem emoji em nenhum texto da tela', () => {
  const comEmoji = { ...PLANO, cenas: [{ t0: 0, t1: 3, els: [{ tipo: 'balao', txt: 'oi 🔥', cx: 500, top: 300 }] }] };
  assert.throws(() => montarExplica(comEmoji, PAL, { cupom: null }), /emoji/);
});

test('cupom só com config: ticket {cupom} vira o código do vendedor ou é recusado', () => {
  const comCupom = { ...PLANO, cenas: [{ t0: 0, t1: 3, els: [{ tipo: 'ticket', txt: '{cupom}', cx: 500, top: 300 }] }] };
  assert.match(montarExplica(comCupom, PAL, { cupom: 'ABC10' }).html, /ABC10/);
  assert.throws(() => montarExplica(comCupom, PAL, { cupom: null }), /cupom/);
});

test('arquivos usados são listados para copiar', () => {
  const { arquivos } = montarExplica(PLANO, PAL, { cupom: null });
  assert.ok(arquivos.includes('elenco/cliente-polo.png'));
  assert.ok(arquivos.includes('fundo-loja.jpg'));
});

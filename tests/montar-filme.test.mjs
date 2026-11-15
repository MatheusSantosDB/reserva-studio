import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarFilme, naBatida } from '../scripts/montar-filme.mjs';

const SPEC = {
  bpm: 120,
  gancho: 'E se ele fosse para 1920?',
  takes: [
    { arquivo: 'assets/take1.mp4', duracao: 3.4 },
    { arquivo: 'assets/take2.mp4', duracao: 3.0, texto: 'Feito para andar o dia todo' },
  ],
  final: { titulo: 'Tênis X', foto: 'assets/peca.png', duracao: 3 },
};

test('duração encaixa na batida (120 BPM = 0,5 s)', () => {
  assert.equal(naBatida(3.4, 120), 3.5);
  assert.equal(naBatida(3.0, 120), 3.0);
  assert.equal(naBatida(0.1, 120), 0.5);
});

test('takes em sequência e duração total com o cartão final', () => {
  const { html, duracao } = montarFilme(SPEC, { cupom: null });
  assert.equal(duracao, 3.5 + 3.0 + 3);
  assert.match(html, /src="assets\/take1\.mp4"[^>]*data-start="0"[^>]*data-duration="3\.5"/);
  assert.match(html, /src="assets\/take2\.mp4"[^>]*data-start="3\.5"[^>]*data-duration="3"/);
  assert.match(html, /data-duration="9\.5"/);
});

test('sem cupom configurado: nenhum cupom no vídeo', () => {
  const { html } = montarFilme(SPEC, { cupom: null });
  assert.doesNotMatch(html, /id="cupom"/);
  assert.doesNotMatch(html, /cupom/i);
});

test('com cupom configurado: cartão mostra o cupom', () => {
  const { html } = montarFilme(SPEC, { cupom: 'ABC10' });
  assert.match(html, /id="cupom"[^>]*>[\s\S]*ABC10/);
});

test('escapa HTML vindo do texto', () => {
  const { html } = montarFilme({ ...SPEC, gancho: '<b>oi</b>' }, { cupom: null });
  assert.match(html, /&lt;b&gt;oi&lt;\/b&gt;/);
});

test('trilha opcional entra como áudio com a duração do filme', () => {
  const { html } = montarFilme({ ...SPEC, trilha: 'assets/trilha.mp3' }, { cupom: null });
  assert.match(html, /<audio[^>]*src="assets\/trilha\.mp3"[^>]*data-duration="9\.5"/);
});

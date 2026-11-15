import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buscar } from '../scripts/vtex.mjs';

const sku = (tam, cor, preco, de, qtd, fotos = ['https://img/1.jpg']) => ({
  itemId: `${tam}-${cor}`, Tamanho: [tam], COR: [cor],
  images: fotos.map((imageUrl) => ({ imageUrl })),
  sellers: [{ commertialOffer: { Price: preco, ListPrice: de, AvailableQuantity: qtd, IsAvailable: qtd > 0 } }],
});

const FIXTURE = [
  { productId: '1', productName: 'Bermuda Linho Bege', link: 'https://www.usereserva.com/bermuda-linho/p',
    items: [sku('40', 'BEGE', 239.9, 299.9, 3, ['https://img/a.jpg', 'https://img/b.jpg']), sku('42', 'BEGE', 239.9, 299.9, 0)] },
  { productId: '2', productName: 'Bermuda Sarja Azul', link: 'https://www.usereserva.com/bermuda-sarja/p',
    items: [sku('40', 'AZUL', 199.9, 199.9, 5)] },
];

function fetchFalso(chamadas) {
  return async (url) => {
    chamadas.push(url);
    const de = Number(new URL(url).searchParams.get('_from'));
    return { ok: true, status: 200, json: async () => (de === 0 ? FIXTURE : []) };
  };
}

test('termo de várias palavras busca a mais longa e filtra o resto pelo nome', async () => {
  const chamadas = [];
  const r = await buscar('bermuda linho', { fetch: fetchFalso(chamadas) });
  assert.equal(new URL(chamadas[0]).searchParams.get('ft'), 'bermuda');
  assert.deepEqual(r.map((p) => p.nome), ['Bermuda Linho Bege']);
});

test('calcula desconto arredondado e preços', async () => {
  const [p] = await buscar('bermuda linho', { fetch: fetchFalso([]) });
  assert.equal(p.precoDe, 299.9);
  assert.equal(p.precoPor, 239.9);
  assert.equal(p.desconto, 20);
});

test('tamanho sem estoque fica indisponível; cores e fotos agrupadas', async () => {
  const [p] = await buscar('bermuda linho', { fetch: fetchFalso([]) });
  assert.deepEqual(p.tamanhos, [{ tam: '40', disponivel: true }, { tam: '42', disponivel: false }]);
  assert.deepEqual(p.cores, ['BEGE']);
  assert.deepEqual(p.fotos, ['https://img/a.jpg', 'https://img/b.jpg', 'https://img/1.jpg']);
  assert.equal(p.link, 'https://www.usereserva.com/bermuda-linho/p');
});

test('sem desconto dá 0', async () => {
  const r = await buscar('sarja', { fetch: fetchFalso([]) });
  assert.equal(r.find((p) => p.nome === 'Bermuda Sarja Azul').desconto, 0);
});

import { filtrar, ordenarTamanhos } from '../scripts/vtex.mjs';

const P = (nome, desconto, tamanhos) => ({ nome, desconto, tamanhos });

test('filtra por desconto mínimo e tamanho disponível', () => {
  const lista = [
    P('a', 20, [{ tam: 'M', disponivel: true }]),
    P('b', 0, [{ tam: 'M', disponivel: true }]),
    P('c', 40, [{ tam: 'M', disponivel: false }, { tam: 'G', disponivel: true }]),
  ];
  assert.deepEqual(filtrar(lista, { minDesconto: 10, tam: 'm' }).map((p) => p.nome), ['a']);
  assert.deepEqual(filtrar(lista, {}).map((p) => p.nome), ['a', 'b', 'c']);
});

test('ordena a grade de roupa e de calçado', () => {
  const t = (xs) => ordenarTamanhos(xs.map((tam) => ({ tam, disponivel: true }))).map((x) => x.tam);
  assert.deepEqual(t(['GGG', 'GG', 'G', 'M', 'P']), ['P', 'M', 'G', 'GG', 'GGG']);
  assert.deepEqual(t(['42', '39', '40']), ['39', '40', '42']);
  assert.deepEqual(t(['17/18', '13/14', '15/16']), ['13/14', '15/16', '17/18']);
});

test('fotos sem repetir (mesmo arquivo com ?v diferente) e em ordem', async () => {
  const f = (n, v) => `https://img/ids/${v}/0100_0${n}.jpg?v=${v}`;
  const fix = [{ productId: '9', productName: 'Polo Teste', link: 'x',
    items: [sku('P', 'PRETO', 100, 100, 1, [f(2, 1), f(1, 1), f(4, 1)]), sku('M', 'PRETO', 100, 100, 1, [f(1, 2), f(4, 2), f(2, 2)])] }];
  const r = await buscar('polo', { fetch: async () => ({ ok: true, status: 200, json: async () => fix }) });
  assert.deepEqual(r[0].fotos.map((u) => u.split('/').pop().split('?')[0]), ['0100_01.jpg', '0100_02.jpg', '0100_04.jpg']);
});

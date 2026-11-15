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

// Busca produtos no site da Reserva pela API pública da VTEX (sem login, sem chave).
// Uso: node scripts/vtex.mjs "bermuda linho" [--max 10] [--desconto 20] [--tam M] [--saida work/busca]
//   --desconto N  só produtos com pelo menos N% de desconto
//   --tam M       só produtos com esse tamanho disponível
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOMINIO = 'https://www.usereserva.com';
const POR_PAGINA = 50;

const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const primeiro = (v) => (Array.isArray(v) ? v[0] : v) ?? null;
const arred = (n) => Math.round(n * 100) / 100;

// A API recusa termo de várias palavras: busca a mais longa e filtra as outras pelo nome.
function dividirTermo(termo) {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
  const principal = [...palavras].sort((a, b) => b.length - a.length)[0] ?? '';
  return { principal, resto: palavras.filter((p) => p !== principal) };
}

const ORDEM_ROUPA = ['RN', 'PP', 'P', 'M', 'G', 'GG', 'GGG', 'XG', 'XGG', 'EG', 'EGG', 'U', 'UN', 'UNICO'];

export function ordenarTamanhos(tamanhos) {
  const chave = (t) => {
    const i = ORDEM_ROUPA.indexOf(normalizar(t.tam).toUpperCase());
    if (i >= 0) return [0, i];
    const n = parseFloat(String(t.tam).replace(',', '.'));
    return Number.isFinite(n) ? [1, n] : [2, 0];
  };
  return [...tamanhos].sort((a, b) => {
    const [ga, va] = chave(a);
    const [gb, vb] = chave(b);
    return ga - gb || va - vb;
  });
}

export function filtrar(produtos, { minDesconto = 0, tam = null } = {}) {
  const alvo = tam ? normalizar(tam) : null;
  return produtos.filter((p) => p.desconto >= minDesconto
    && (!alvo || p.tamanhos.some((t) => t.disponivel && normalizar(t.tam) === alvo)));
}

function resumir(produto) {
  const cores = new Set();
  const tamanhos = new Map();
  const fotos = [];
  let precoPor = null;
  let precoDe = null;
  for (const item of produto.items ?? []) {
    const oferta = (item.sellers?.find((s) => s.sellerDefault) ?? item.sellers?.[0])?.commertialOffer ?? {};
    const disponivel = Boolean(oferta.IsAvailable) && (oferta.AvailableQuantity ?? 0) > 0;
    const cor = primeiro(item.COR);
    const tam = primeiro(item.Tamanho);
    if (cor) cores.add(cor);
    if (tam) tamanhos.set(tam, (tamanhos.get(tam) ?? false) || disponivel);
    for (const img of item.images ?? []) {
      const nomeArq = img.imageUrl?.split('?')[0].split('/').pop();
      if (nomeArq && !fotos.some((u) => u.split('?')[0].split('/').pop() === nomeArq)) fotos.push(img.imageUrl);
    }
    if (Number.isFinite(oferta.Price) && oferta.Price > 0 && (precoPor === null || oferta.Price < precoPor)) {
      precoPor = oferta.Price;
      precoDe = Number.isFinite(oferta.ListPrice) ? Math.max(oferta.ListPrice, oferta.Price) : oferta.Price;
    }
  }
  const numFoto = (u) => Number(u.split('?')[0].match(/_(\d+)\.\w+$/)?.[1] ?? 99);
  fotos.sort((a, b) => numFoto(a) - numFoto(b));
  const desconto = precoDe && precoPor ? Math.round(((precoDe - precoPor) / precoDe) * 100) : 0;
  return {
    nome: produto.productName,
    link: produto.link ?? null,
    precoDe: precoDe === null ? null : arred(precoDe),
    precoPor: precoPor === null ? null : arred(precoPor),
    desconto,
    cores: [...cores],
    tamanhos: ordenarTamanhos([...tamanhos].map(([tam, disponivel]) => ({ tam, disponivel }))),
    fotos,
  };
}

export async function buscar(termo, { max = 10, minDesconto = 0, tam = null, fetch: buscarUrl = globalThis.fetch } = {}) {
  const { principal, resto } = dividirTermo(termo);
  if (!principal) throw new Error('Informe o que procurar, por exemplo: "bermuda linho".');
  const achados = [];
  for (let de = 0; achados.length < max && de < 500; de += POR_PAGINA) {
    const url = `${DOMINIO}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(principal)}&_from=${de}&_to=${de + POR_PAGINA - 1}`;
    const resp = await buscarUrl(url, { headers: { accept: 'application/json' } });
    if (!resp.ok && resp.status !== 206) throw new Error(`O site respondeu ${resp.status}. Tente de novo em instantes.`);
    const pagina = await resp.json();
    if (!Array.isArray(pagina) || pagina.length === 0) break;
    for (const p of pagina) {
      const nome = normalizar(p.productName);
      if (resto.every((r) => nome.includes(r))) achados.push(...filtrar([resumir(p)], { minDesconto, tam }));
      if (achados.length >= max) break;
    }
    if (pagina.length < POR_PAGINA) break;
  }
  return achados;
}

const reais = (n) => (n === null ? '—' : `R$ ${n.toFixed(2).replace('.', ',')}`);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const opc = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const max = Number(opc('--max') ?? 10);
  const saida = opc('--saida');
  const minDesconto = Number(opc('--desconto') ?? 0);
  const tam = opc('--tam');
  const termo = args.join(' ');
  const produtos = await buscar(termo, { max, minDesconto, tam });
  if (!produtos.length) console.log(`Nada encontrado para "${termo}". Tente outra palavra.`);
  produtos.forEach((p, i) => {
    const grade = p.tamanhos.map((t) => (t.disponivel ? t.tam : `~${t.tam}~`)).join(' ');
    const preco = p.desconto ? `${reais(p.precoDe)} → ${reais(p.precoPor)} (-${p.desconto}%)` : reais(p.precoPor);
    console.log(`${i + 1}. ${p.nome}\n   ${preco} | cores: ${p.cores.join(', ')} | tamanhos: ${grade}\n   ${p.link}`);
  });
  console.log('\nPreço e desconto são de HOJE. Confirme antes de colocar no vídeo. (~42~ = esgotado)');
  if (saida) {
    mkdirSync(saida, { recursive: true });
    writeFileSync(join(saida, 'produtos.json'), JSON.stringify(produtos, null, 2));
    console.log(`Salvo em ${join(saida, 'produtos.json')}`);
  }
}

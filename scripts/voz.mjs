// Narração com voz sintética.
// Uso: node scripts/voz.mjs --texto roteiro.txt --saida work/voz.mp3 [--motor edge|elevenlabs] [--voz <nome ou id>]
//   --texto aceita um arquivo .txt ou o próprio texto entre aspas.
//   edge (padrão): grátis e sem conta. Vozes: pt-BR-AntonioNeural (masc.), pt-BR-FranciscaNeural (fem.),
//                  pt-BR-ThalitaMultilingualNeural (fem.). Precisa de: pip install edge-tts
//   elevenlabs: mais natural; precisa de ELEVENLABS_API_KEY no .env (plano gratuito serve).
//               Sem --voz, lista as vozes da conta e usa a primeira.
// O cupom do config/vendedor.json é soletrado na fala (ABC10 → "A B C dez"); na tela ele continua escrito.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { lerConfig } from './config.mjs';
import { lerEnv, ehPrincipal } from './ferramentas.mjs';

const UNI = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze',
  'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CEM = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function porExtenso(n) {
  if (n < 20) return UNI[n];
  if (n < 100) return DEZ[Math.floor(n / 10)] + (n % 10 ? ` e ${UNI[n % 10]}` : '');
  if (n === 100) return 'cem';
  if (n < 1000) return CEM[Math.floor(n / 100)] + (n % 100 ? ` e ${porExtenso(n % 100)}` : '');
  return String(n).split('').map((d) => UNI[Number(d)]).join(' ');
}

function falarCupom(cupom) {
  return cupom.match(/[A-Za-z]+|\d+/g).map((p) => (/\d/.test(p) ? porExtenso(Number(p)) : p.toUpperCase().split('').join(' '))).join(' ');
}

export function prepararTexto(texto, cupom) {
  let t = texto.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '');
  if (cupom) t = t.replace(new RegExp(cupom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), falarCupom(cupom));
  return t.replace(/[ \t]+/g, ' ').replace(/ +([.,!?])/g, '$1').trim();
}

async function elevenlabs(texto, saida, voz, chave) {
  const base = 'https://api.elevenlabs.io/v1';
  let id = voz;
  if (!id) {
    const r = await fetch(`${base}/voices`, { headers: { 'xi-api-key': chave } });
    if (!r.ok) throw new Error(`ElevenLabs respondeu ${r.status} ao listar vozes.`);
    const vozes = (await r.json()).voices ?? [];
    console.log('Vozes da conta:', vozes.slice(0, 12).map((v) => `${v.name} (${v.voice_id})`).join(', '));
    id = vozes[0]?.voice_id;
    if (!id) throw new Error('Nenhuma voz na conta do ElevenLabs.');
  }
  const r = await fetch(`${base}/text-to-speech/${id}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': chave, 'content-type': 'application/json' },
    body: JSON.stringify({ text: texto, model_id: 'eleven_multilingual_v2' }),
  });
  if (!r.ok) throw new Error(`ElevenLabs respondeu ${r.status}: ${(await r.text()).slice(0, 200)}`);
  writeFileSync(saida, Buffer.from(await r.arrayBuffer()));
}

if (ehPrincipal(import.meta.url)) {
  const args = process.argv.slice(2);
  const opc = (n, padrao = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : padrao; };
  const entrada = opc('--texto');
  const saida = opc('--saida');
  const motor = opc('--motor', 'edge');
  const voz = opc('--voz');
  if (motor === 'elevenlabs' && !lerEnv('ELEVENLABS_API_KEY')) {
    console.error('Falta a ELEVENLABS_API_KEY no arquivo .env (crie grátis em https://elevenlabs.io/app/settings/api-keys).\n'
      + 'Sem chave, use a voz grátis: --motor edge');
    process.exit(1);
  }
  if (!entrada || !saida) { console.error('Uso: node scripts/voz.mjs --texto roteiro.txt --saida work/voz.mp3 [--motor edge|elevenlabs] [--voz X]'); process.exit(1); }
  const bruto = existsSync(entrada) ? readFileSync(entrada, 'utf8') : entrada;
  const texto = prepararTexto(bruto, lerConfig().cupom);
  mkdirSync(dirname(saida), { recursive: true });
  if (motor === 'elevenlabs') {
    await elevenlabs(texto, saida, voz, lerEnv('ELEVENLABS_API_KEY'));
  } else {
    const python = process.platform === 'win32' ? 'python' : 'python3';
    const r = spawnSync(python, ['-m', 'edge_tts', '--voice', voz ?? 'pt-BR-AntonioNeural', '--text', texto, '--write-media', saida], { stdio: 'inherit' });
    if (r.status !== 0) { console.error('A voz Edge falhou. Instale com: pip install edge-tts'); process.exit(1); }
  }
  console.log(`Voz salva em ${saida} (${motor}).`);
}

---
name: voz-sintetica
description: Use quando o vídeo precisar de narração com voz sintética (filme de épocas narrado, explicação de produto, vídeo sem o vendedor falando). Gera o MP3 com a voz grátis do Edge (sem conta) ou com o ElevenLabs (plano gratuito, chave no .env). Não use para corrigir a fala gravada pelo vendedor.
---

# Voz sintética

```bash
node scripts/voz.mjs --texto roteiro.txt --saida hyperframes/projetos/<nome>/assets/voz.mp3
```

- **Edge (padrão):** grátis, sem conta e sem chave. Vozes em português:

  | Voz | Tipo |
  |---|---|
  | `pt-BR-AntonioNeural` | masculina (padrão) |
  | `pt-BR-FranciscaNeural` | feminina |
  | `pt-BR-ThalitaMultilingualNeural` | feminina |

  Troque com `--voz`. Primeira vez: `pip install -r requirements.txt`.
- **ElevenLabs:** mais natural. Precisa de uma conta gratuita e da chave em `.env` (`ELEVENLABS_API_KEY=`; veja o `.env.example`). Use `--motor elevenlabs`. Sem `--voz`, o script lista as vozes da conta e usa a primeira; depois escolha pelo id com `--voz <id>`. O plano gratuito tem limite de caracteres por mês, então avise antes de gerar textos longos.

## Como escrever o texto para a voz

- Frases curtas, uma ideia por frase. A pontuação vira pausa: use ponto, não vírgula, onde quiser respirar.
- **Cupom:** o script soletra sozinho o cupom do `config/vendedor.json` (ABC10 vira "A B C dez"). Na tela e na legenda ele continua escrito normal.
- Preço por extenso fica mais natural: "cento e oitenta e nove reais" em vez de "R$ 189,90". Só use o preço confirmado pelo vendedor.
- Sem emoji: o script tira, mas é melhor nem escrever.

## Depois de gerar

1. **Diga ao vendedor que você não ouve áudio:** quem aprova a voz é ele. Peça para ouvir o arquivo.
2. Para conferir a pronúncia, transcreva de volta: `python .claude/skills/watch/scripts/whisper_local.py voz.mp3 voz.json`.
3. No HyperFrames, a voz entra como `<audio src="assets/voz.mp3" data-start="0" data-duration="<duração real>" data-volume="1">`. A duração sai de `ffprobe -v error -show_entries format=duration -of csv=p=0 voz.mp3`.
4. Para legenda sincronizada com a voz: `node scripts/transcrever.mjs voz.mp3 palavras.json` e `node scripts/legenda.mjs palavras.json > assets/legenda.js`.
5. Com música junto, a música fica bem abaixo da voz (`data-volume` de 0,15 a 0,25).

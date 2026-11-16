---
name: magnific-mcp
description: Use quando o vendedor tiver assinatura do Magnific e quiser gerar imagem ou vídeo de IA por ele (inclusive os modelos de vídeo ilimitados da assinatura, como Kling 2.5 e Hailuo 2.3). Conecta o Claude Code ao MCP oficial do Magnific (login pelo navegador, sem chave em arquivo) e define como gerar, conferir o custo e baixar. Sem assinatura, use /flow-no-navegador.
---

# Magnific pelo MCP

O Magnific tem um servidor MCP oficial. Com ele, o Claude gera e confere imagens e vídeos direto na conta do vendedor, sem abrir o site.

## Conectar (uma vez)

No terminal, dentro da pasta do estúdio:

```bash
claude mcp add --transport http magnific https://mcp.magnific.com
```

Depois, no Claude Code, rode `/mcp`, escolha **magnific** e faça o login no navegador. **Não existe chave para colar:** o login fica guardado pelo Claude Code, fora deste repositório.

Para conferir: peça "mostra meu saldo do Magnific" (ferramenta de saldo/conta do MCP).

## Regras de custo

- **Sempre simule o custo antes** (ferramentas `simulate_cost`/`simulate_flows`) e diga ao vendedor quanto vai gastar. Só gere depois do "pode".
- **Modelos ilimitados na assinatura** (não gastam crédito na resolução marcada com ∞):

  | Modelo | Resolução ilimitada | Duração | Observação |
  |---|---|---|---|
  | Kling 2.5 | 720p | 5 a 10 s | bom movimento de câmera e de corpo |
  | Hailuo 2.3 / 2.3 Fast | 768p | 6 ou 10 s | Fast é mais rápido |

  Em 1080p ou em outros modelos (Veo, Kling 3, Seedance, etc.), cobra crédito. A lista muda: confira com a ferramenta de listar modelos antes.
- Todos esses modelos são **imagem → vídeo:** precisam do quadro inicial. Mande a imagem já em 9:16 para o vídeo sair vertical.

## Fluxo

1. Ache ou crie a pasta (projeto) do vendedor no Magnific e use a mesma em todas as gerações.
2. **Imagem:** gere o quadro inicial com o prompt de `/imagem-realista` e a foto oficial do produto como referência. Abra o resultado (ferramenta de leitura de imagem do MCP) e confira produto, mãos e rosto antes de seguir.
3. **Vídeo:** gere a partir do quadro aprovado, com o prompt de continuação (modelo em `/filme-de-epocas`). A geração é em duas etapas: a ferramenta inicia e devolve um identificador; depois chame a de espera até terminar.
4. **Confira o vídeo** com a ferramenta de ver quadros do vídeo antes de mostrar ao vendedor.
5. **Baixar:** baixe os aprovados para `hyperframes/projetos/<nome>/assets/takeNN.mp4`.

## Dicas

- Imagem grande para upload: converta antes para JPEG 720×1280. PNG pesado demora ou falha.
- Prompt curto e direto funciona melhor que um parágrafo longo.
- Ao responder ao vendedor, diga o nome e o link (webUrl) da criação, não o identificador interno.

## Trocar roupa e cenário de uma gravação (motion control)

Para "mudar de cenário" num trecho do talking head sem regravar (ex.: no estalo de dedo):

1. **Foto do novo visual primeiro** (~65 créditos cada): `images_generate` com um quadro nítido do rosto do vendedor como referência `image` e o prompt do cenário e da roupa. Gere 3 ou 4 propostas e deixe o vendedor escolher. Roupa **sem logo** (peça da Reserva nunca é gerada por IA) e ninguém mais na cena.
2. **Recorte o trecho** da fala em vertical (720×1280) e suba como vídeo (`creations_request_upload` → PUT → `creations_finalize_upload`).
3. **Gere e compare no mesmo take** antes de fazer o resto. Comparativo feito em nov/2026 (10 s, 720p):

   | Modelo | Custo | Resultado |
   |---|---|---|
   | **Gemini Omni 1.2 Flash** | ~140/s | **O preferido:** mais natural. Vídeo de referência de no máximo 10 s |
   | Kling 4.0 Omni | ~220/s | Segue os gestos de perto, mas fica menos natural |
   | Kling 3.0 Motion Control | ~110/s | "Engessado": gestos repetitivos |

   Omni 1.2 e Kling 4.0 Omni: `references` = imagem do novo visual + vídeo do trecho. Kling 3.0 Motion Control: `keyframes.start` = imagem e `keyframes.video` = vídeo.
4. Monte um **lado a lado com o áudio original** (ffmpeg `hstack`) para o vendedor julgar a boca e os gestos.
5. No vídeo final, o clipe gerado entra **mudo** por cima da fala original e **volta para a gravação** no fim de uma frase. Use só no trecho da demonstração: o vídeo inteiro custa caro e cansa.

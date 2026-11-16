---
name: edicao-sem-slop
description: Use ao editar talking head ou qualquer Reel do vendedor quando ele pedir "sem cara de IA", "sem slop", legenda simples, corte seco ou pop-up com print real; também por padrão em toda edição nova de talking head. Aplica 7 ajustes que tiram a cara de "edição feita por IA": legenda clássica, nada de emoji, pausa máxima de ~0,1 s, poda de frases, pop-up parado com imagem real, B-roll próprio e referências de vídeos que funcionam. Não use para filme de IA nem para arte estática.
---

# Edição sem slop (7 ajustes)

"Slop" é o que denuncia edição feita por IA: texto que quica, emoji no lugar de imagem, pausas sobrando, frase repetida, pop-up animado, B-roll genérico. A base técnica é a de `/editar-com-hyperframes`; esta skill troca o acabamento.

| # | Ajuste | Como fazer |
|---|---|---|
| 1 | **Legenda clássica:** 2 a 3 palavras, fonte simples, sem animação | `node scripts/legenda.mjs` (já é assim no modelo `talking-head-legenda`). Nada de escala, mola, karaokê palavra por palavra. |
| 2 | **Sem emoji nem ícone:** imagem real no lugar | Só foto oficial, mockup sem fundo (`/reserva-vtex`) ou print de tela. Nada de ícone de loja, check, seta decorativa, emoji ou ilustração genérica. |
| 3 | **Cortar o espaço morto** | `preparar-fala.mjs --seco`: pausa a partir de 0,12 s vira 0,06 s; começo e fim sem folga. Confira: maior silêncio ≈ 0,1 s. |
| 4 | **Podar o que não ajuda o gancho** | Frase repetida, começo em falso, desvio do assunto: `--palavras palavras-bruto.json --cortar "a-b,c-d"`. O corte cai no meio do silêncio, nunca em cima de palavra. |
| 5 | **Pop-up parado** com imagem real | `popups.json` → `node scripts/popups.mjs`. Aparece e some num quadro, um por vez, no mínimo 0,8 s, sem cobrir o rosto (`pos`: topo, esquerda ou direita). |
| 6 | **B-roll próprio** | `node scripts/broll.mjs buscar <tema>` antes de escolher. Vídeos e fotos do próprio vendedor (loja, vitrine, sacola, provador) em `assets/broll/`, registrados com `broll.mjs adicionar`. |
| 7 | **Vídeos que funcionam como referência** | Analise com `/watch` (gancho, ritmo, texto na tela) e copie só a estrutura. |

## Fluxo de um talking head

1. **Transcrever o bruto:** `node scripts/transcrever.mjs bruto.mp4 work/<nome>/palavras-bruto.json`.
2. **Ver os índices:** `node scripts/palavras.mjs work/<nome>/palavras-bruto.json`. Escolha o gancho (a frase que prende nos 3 primeiros segundos) e marque o que é repetição ou desvio.
3. **Mostre ao vendedor o que vai sair** (as frases, não os números) e espere o OK.
4. **Preparar:**
   ```bash
   cp -r hyperframes/modelos/talking-head-legenda hyperframes/projetos/<nome>
   node scripts/preparar-fala.mjs bruto.mp4 hyperframes/projetos/<nome>/assets/fala.mp4 --seco --palavras work/<nome>/palavras-bruto.json --cortar "9-14"
   ```
5. **Transcrever o vídeo preparado** (os tempos mudaram): `node scripts/transcrever.mjs .../assets/fala.mp4 .../palavras.json`. **Revise os nomes** (a transcrição erra produto e material) e gere a legenda com `legenda.mjs`.
6. **Pop-ups:** separe 1 a 3 imagens reais em `assets/` e escreva o `popups.json` com os tempos da fala. Gere com `node scripts/popups.mjs ... > assets/popups.js`. Confira no `snapshot` se nenhum cobre o rosto.
7. **Amostra de 8 a 15 s**, aprovação, depois o vídeo inteiro. No MP4, confira:
   - voz igual nos dois lados;
   - maior pausa ≈ 0,1 s;
   - legenda igual à fala.

## Regras que continuam valendo

- Preço, % e cupom só do que foi dito ou confirmado. Print com o preço de outro dia contradiz a fala: use o do dia da gravação.
- Print com dado pessoal (nome, CPF, e-mail, endereço): recorte antes de usar.
- Peça em pop-up = mockup oficial sem fundo. Imagem de IA só se o vendedor pedir.
- Para a fala ilustrada com desenhos, use `/reserva-explica`, que segue as mesmas regras.

## Inserções de tutorial (quando o vídeo ensina a usar uma ferramenta)

Só o rosto falando cansa. Para cada coisa que o vendedor **cita**, mostre aquilo na tela. Monte um mapa "fala → inserção" e mostre antes de produzir.

| Quando ele fala | Inserção |
|---|---|
| "passo a passo", "primeiro passo" | Cartões numerados que vão se acendendo (1, 2, 3) |
| o nome da ferramenta ou "pedi pro Claude" | Tela do Claude Code simulada com **o pedido real** que ele digitou, sendo digitado, e as tarefas sendo marcadas |
| "peguei uma referência", "colei o link" | Simulação: imagem do Pinterest → arrastada para o Claude → link copiado e colado → pedido digitado → Claude trabalhando |
| "por áudio" | Balão de mensagem de voz com a onda sonora |
| Instagram, TikTok, YouTube | Logo **oficial** (Wikimedia Commons), um por palavra |
| "o repositório", um site | Print real da página |
| um tipo de vídeo ("animado", "histórico", "vlog") | O vídeo pronto desse estilo, em tela cheia com o rosto num círculo |

- Os pedidos que aparecem na tela vêm das sessões reais (o vendedor pode reconhecê-los). Não invente resultado.
- Referência do Pinterest **sem pessoa real e sem personagem que lembre famoso:** prefira paisagem, cenário ou produto.
- O movimento continua curto e reto (entra deslizando 0,2 s, sai em corte). Nada quica.

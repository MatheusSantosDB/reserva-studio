---
name: carrossel-de-video
description: Use quando o vendedor pedir um carrossel de vídeo (carrossel animado, live carousel) para o Instagram de um produto da Reserva ou de um tema. Monta 6 slides 1080x1350 em vídeo de 8 s em loop, com movimento na batida, a partir de um carrossel.json. Não use para Reels, talking head ou carrossel de imagens paradas (para esse, tire um snapshot de cada slide).
---

# Carrossel de vídeo

Carrossel do Instagram em que **cada slide é um vídeo curto em loop** (1080×1350). Prende mais que slide parado, e quase ninguém faz.

## Roteiro de 6 slides (mostre em tabela e espere o OK)

| Slide | Função | Exemplo (polo de tricô) |
|---|---|---|
| 1 | **Gancho que vira uma crença.** É a capa: precisa ser lido parado | "parece pesada." / "mas é tricô leve." |
| 2 | O que é, numa ideia | "polo de tricô" / "para o calor." |
| 3 | Prova 1: um detalhe que ninguém vê | "o detalhe" / "está no ponto." + cartão com o fato da ficha |
| 4 | Prova 2 | outro fato da ficha |
| 5 | Como usar / para quem | "com jeans" / "ou alfaiataria." |
| 6 | Chamada | "garanta a sua." + cupom (se configurado) |

- **Título:** de 2 a 4 palavras. **Destaque:** a virada, em cor.
- **Cartões:** 1 fato cada, no máximo 3 por slide.
- **Todo texto vem da ficha do produto** (`/reserva-vtex`) ou do vendedor. Preço, parcela e estoque só entram se o vendedor confirmar no dia.

## Montar

1. `mkdir -p hyperframes/projetos/<nome>/assets` e ponha lá o mockup sem fundo (`/reserva-vtex`, `peca.png`).
2. Crie `hyperframes/projetos/<nome>/carrossel.json`. O formato está no topo de `scripts/montar-carrossel.mjs`. Opcional: `cor` (destaque) e `fundo`.
3. `node scripts/montar-carrossel.mjs hyperframes/projetos/<nome>` cria `slides/01` a `slides/06`, cada um um projeto HyperFrames.
4. Confira: `./hyperframes/hf.sh projetos/<nome>/slides/01 snapshot --at 0,2,7.5`. O quadro de 0 s e o de 7,5 s têm que ser iguais: é isso que faz o loop não pular.
5. Render de cada slide: `./hyperframes/hf.sh projetos/<nome>/slides/01 render -o ../../../../../entregas/<nome>-01.mp4` (repita de 01 a 06; um de cada vez).
6. O vendedor sobe os 6 MP4 em ordem, num post de carrossel. A música ele escolhe no próprio Instagram.

## Por que funciona

- **Pose:** cada slide começa e termina no mesmo desenho. O quadro 0 vira a capa, e o loop do Instagram não "pula".
- **Na batida:** a 120 BPM, as entradas caem a cada 0,5 s ou 1 s (título em 1 s, peça em 1,5 s, destaque em 2,5 s, cartões de 3,5 s em diante). Tudo assenta até 6,5 s.
- **Peso:** a peça cai e quica (`bounce.out`), não aparece com fade.
- **Não fazer:** fade em tudo, brilho ou partícula genérica, mais de uma "estrela" por batida.

## Variações

- Peça clara em fundo claro: use `"fundo": "#1b1f24"` no `carrossel.json` (o texto continua escuro; ajuste se precisar).
- Carrossel de imagens paradas: tire `snapshot --at 7.5` de cada slide e suba os PNG.

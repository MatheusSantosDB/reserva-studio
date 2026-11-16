---
name: reserva-explica
description: Use quando o vendedor quiser um vídeo em que a fala dele é ilustrada por cenas de desenho em papel-recorte (personagens de loja, cliente, vendedora, produto real, etiqueta de preço, cupom), com legenda grande em maiúsculas: o estilo "Reserva Explica", bom para explicar promoção, material ou como usar uma peça. A cara do vendedor aparece pouco; o produto e a animação carregam o vídeo. Não use para talking head só com rosto e legenda (use /edicao-sem-slop).
---

# Reserva Explica (fala ilustrada em papel-recorte)

**Em uma frase:** cada ideia falada vira uma cena de desenho de 2 a 6 s que mostra algo concreto: o produto real, a etiqueta com o preço que foi dito, o cupom, um cliente reagindo. A legenda grande, em maiúsculas, fica no topo, com a palavra-chave em amarelo.

## Como funciona a tela

- **Dois layouts que se alternam:**
  - `full`: desenho na tela toda;
  - `split`: desenho em 2/3 de cima e o rosto do vendedor embaixo, com uma borda de papel rasgado.
- **Fundos:** `ceu` (céu, nuvens e morro, feito em CSS) ou `loja` (interior de loja desenhado).
- **Elementos:**
  - `char`: personagem com etiqueta de nome; respira sozinho;
  - `img`: mockup oficial ou foto;
  - `phone`: celular com print real, que pode rolar;
  - `tag`: etiqueta de preço;
  - `ticket`: cupom (`{cupom}` usa o do `config/vendedor.json`);
  - `balao`: balão de fala.
- **Entradas:**
  - `pop`: cresce no lugar;
  - `up`: sobe de baixo;
  - `sl` / `sr`: desliza da esquerda / da direita;
  - `drop`: cai e quica.

  `"sacode": true` balança depois de entrar.
- **Troca de cena:** corte deslizando. A câmera dá um zoom lento em cada cena.

## Passos

1. **Preparar a fala** como no `/edicao-sem-slop`: `preparar-fala.mjs --seco` (com poda, se preciso) e `transcrever.mjs` do vídeo preparado. Revise os nomes.
2. **Desenhar as cenas lendo a transcrição por frase.** Cada ideia vira uma cena que mostra algo tangível. Mostre ao vendedor a lista de cenas (tempo, o que aparece) e espere o OK.
3. **Montar:**
   - `mkdir -p hyperframes/projetos/<nome>/assets`;
   - ponha `fala.mp4`, `palavras.json`, os mockups e os prints;
   - escreva o `explica.json` (o formato está no topo de `scripts/montar-explica.mjs`);
   - rode `node scripts/montar-explica.mjs hyperframes/projetos/<nome>`.
4. `./hyperframes/hf.sh projetos/<nome> lint`, depois `snapshot --at ...` para conferir:
   - nada importante embaixo da legenda;
   - rosto inteiro no split;
   - personagens sem cortar os pés.

   O aviso `duplicate_media_discovery_risk` (a mesma imagem em duas cenas) pode ser ignorado.
5. **Amostra de 10 a 15 s**, aprovação, render completo.

## Personagens

- **Prontos em `assets/reserva-explica/elenco/`:**
  - `cliente-polo`;
  - `cliente-mulher`;
  - `vendedora`;
  - `senhor-oculos`;
  - `jovem-bone`;
  - `executivo`.
- **Fundo pronto:** `assets/reserva-explica/fundo-loja.jpg`.
- **O vendedor como personagem:** gere uma folha 3×2 de poses em **fundo verde liso**, no Flow (`/flow-no-navegador`) ou no Magnific (`/magnific-mcp`). Use uma foto dele como referência, no mesmo traço do elenco: cartoon com contorno branco grosso e cabeça um pouco maior. Depois recorte:
  ```bash
  python scripts/folha_para_recortes.py recortes folha.png 3 2 assets/reserva-explica/meu-personagem surpreso,aponta,celular,joinha,pensando,comemora
  ```
  Só do próprio vendedor e com fotos que ele mandou. **Nunca** rosto de famoso ou de outra pessoa real.
- **Logo da Reserva** (pica-pau, sacola com logo) só a partir de arquivo oficial que o vendedor tenha. O estúdio não traz o logo.

## Regras

- O personagem é desenho; **o produto não**. Peça da Reserva é sempre o mockup oficial ou o print real.
- Etiqueta de preço e % só com o que a fala diz. O cupom vem só do `config/vendedor.json`.
- Sem emoji em nenhum texto: o script recusa.
- Na legenda, sem animação: ela liga e desliga num quadro. O movimento fica nos personagens, nos objetos e na câmera.
- Um render por vez. Um vídeo de 45 s leva vários minutos.

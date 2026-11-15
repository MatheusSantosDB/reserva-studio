---
name: filme-de-epocas
description: Use quando o vendedor pedir um filme de IA em que personagens levam um produto da Reserva para outra época ou lugar (viajantes do tempo, choque de épocas, "e se esse tênis fosse para 1985?"), ou pedir roteiro, imagens, vídeos ou edição de um filme assim. Método completo: fato real do produto, um absurdo só, 10 a 12 takes de 3 a 4 s, quadro inicial que já conta a ação, imagem com cara de celular, vídeo no Flow ou no Magnific, edição na batida. Não use para talking head nem para carrossel.
---

# Filme de épocas

**Em uma frase:** dois viajantes chegam a outra época com um produto da Reserva, e **uma cena absurda, filmada como vídeo de celular de turista**, faz o espectador lembrar do produto. Fecha com o produto e o cupom do vendedor, se ele tiver configurado um.

Por que funciona: o choque de épocas prende o olho nos primeiros segundos, o absurdo faz a pessoa assistir até o fim e o fato real ensina algo sobre o produto sem parecer anúncio.

## O método em 6 passos

1. **Fato real do produto.** Tire da ficha do site (`/reserva-vtex`: material, tecnologia, nome) ou de uma pesquisa com fonte. Ex.: "o tecido é linho", "a sola é de borracha natural", "o nome vem da cidade X". Nunca invente número, data ou "primeiro do mundo".
2. **Um absurdo só**, que os personagens tratam como normal. Ex.: guerreiros fazendo fila para provar o tênis; cientistas dos anos 30 trocando o sapato pelo produto. Nada de magia, raio ou efeito especial.
3. **Roteiro de 10 a 12 takes de 3 a 4 s**, com "o que o primeiro quadro já mostra" e "o que o vídeo só continua" (modelo em `references/roteiro-modelo.md`). **Mostre o roteiro e espere a aprovação** antes de gerar qualquer imagem.
4. **Quadros iniciais** (um por take, 9:16) com a skill `/imagem-realista` e a foto oficial do produto como referência. Gere no Flow (`/flow-no-navegador`) ou no Magnific (`/magnific-mcp`). Mostre os quadros e espere a aprovação.
5. **Vídeos** a partir de cada quadro. No Flow, use os créditos da conta; no Magnific, os modelos ilimitados (Kling 2.5 720p ou Hailuo 2.3 768p). Detalhes em `references/imagens-e-videos.md`.
6. **Edição:** copie `hyperframes/modelos/filme-em-takes` para `hyperframes/projetos/<nome>`, ponha os clipes e o mockup, preencha o `filme.json` e monte com `node scripts/montar-filme.mjs`. Receita em `references/edicao.md`.

## Regras que nunca mudam

- **O primeiro quadro conta o take:** quem, onde, o que as mãos fazem e o estado dos objetos. O prompt de vídeo só continua a ação.
- **Captura crua de celular:** celular comum de alguns anos atrás, luz chapada de dia nublado, horizonte um pouco torto, gente suando e fazendo esforço de verdade. Nada de hora dourada, desfoque de cinema ou cara de revista.
- **Produto sempre oficial:** foto do site como referência, tamanho real, cor e detalhes iguais. Confira no site se o modelo é adulto ou infantil.
- **Acessórios também da Reserva:** se aparecer mochila, boné ou outra peça em destaque, que seja da loja (consulte no `/reserva-vtex`).
- **Personagens:** o vendedor pode ser um dos viajantes, mas só a partir de fotos que ele mandou. Todo o resto do elenco é genérico. **Nunca rosto de famoso ou de pessoa real** sem autorização.
- **Rosto de frente no quadro inicial:** se o personagem principal está de costas, o gerador inventa outro rosto quando ele vira.
- **Texto na tela:** gancho com fato verdadeiro, texto de apoio tirado da ficha e cartão final. **Sem preço, prazo ou promessa de desempenho** ("à prova d'água", "dura 10 anos") que a ficha não traga.
- **Declare que é IA** na legenda do post.

## Checklist antes de entregar

- [ ] Fato conferido na ficha ou com fonte; gancho aprovado
- [ ] 10 a 12 takes, cada um com "primeiro quadro" e "continua"
- [ ] Quadros aprovados antes de virar vídeo
- [ ] Produto igual à foto oficial em todos os takes (cor, logo, sola, costuras)
- [ ] Ordem de edição pensada para o ritmo (curiosidade, prova, reação, teste, adoção, clímax, despedida)
- [ ] Amostra de 10 a 15 s aprovada; MP4 final conferido (início, meio, fim, áudio)

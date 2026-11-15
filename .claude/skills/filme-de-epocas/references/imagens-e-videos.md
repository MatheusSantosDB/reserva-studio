# Imagens e vídeos

## Quadros iniciais
- **Um texto-base por filme:** captura de celular, lugar, elenco de época, viajantes, produto e "o único fato absurdo". Cada take acrescenta a ação, que já aparece em andamento. Escreva o texto com `/imagem-realista`.
- **Formato 9:16.** Gere um quadro por vez e confira cada um antes do próximo.
- **No máximo 5 imagens de referência por geração:** rosto e roupa do viajante (fotos do vendedor, se ele for personagem), foto oficial do produto de frente e de lado e, se preciso, uma colagem com as cores.
- **Comece pelo plano com os personagens** e use esse quadro como referência dos outros, para manter rosto e roupa.
- **Confira em cada quadro:** cabeça e pés inteiros, mãos com 5 dedos, rosto de frente, produto igual à foto oficial.
- **Se ficou "limpo demais":** reforce no texto a compressão de celular, o horizonte torto e a luz chapada.

## Vídeo a partir do quadro
- **Flow:** imagem → vídeo, com o quadro como primeiro frame. Veja `/flow-no-navegador`.
- **Magnific:** Kling 2.5 (720p, ilimitado) ou Hailuo 2.3 (768p, ilimitado). Veja `/magnific-mcp`.
- **Duração:** de 5 a 6 s por take; na edição você usa de 3 a 4 s.

Prompt de vídeo (adapte ao produto):

```
Handheld phone video, small natural shake, <uma ação contínua>. Keep everything already in the first frame: same people, same faces, same clothes, same place. The <produto> stays rigid and identical in shape, colors, logo and sole, never morphing or changing size. Flat overcast light, no cinematic look, no gimbal glide. No text, no logos added, no sparks or magic, nobody speaks.
```

- **Antes de gerar, diga quanto custa** em créditos e espere o "pode".
- **O vendedor escolhe e baixa os clipes aprovados.** Salve em `hyperframes/projetos/<nome>/assets/take01.mp4`, `take02.mp4`... na ordem do roteiro.

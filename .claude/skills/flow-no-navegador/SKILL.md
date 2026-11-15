---
name: flow-no-navegador
description: Use quando o vendedor quiser gerar imagem ou vídeo de IA no Google Flow (flow.google.com) com os créditos da conta Google dele, sem pagar assinatura extra. O Claude prepara prompts e arquivos e conduz o vendedor no navegador; o vendedor confirma cada geração. Não use para editar o vídeo final (HyperFrames) nem quando o vendedor preferir o Magnific.
---

# Google Flow no navegador

O Flow (flow.google.com) gera imagem e vídeo com os créditos da conta Google do vendedor. **Não tem API pública:** o trabalho é pelo navegador. Pode ser o navegador do app do Claude (desktop), a extensão Claude in Chrome ou o próprio vendedor clicando, com você guiando.

## Antes de começar

- O vendedor precisa estar **logado no Flow** com a conta que tem créditos. Se ele tiver mais de uma conta Google, confira qual (a URL pode ter `/u/0/` ou `/u/1/`).
- **Nunca peça senha** e nunca digite senha: o login é com o vendedor.
- Tenha prontos, em `work/<tema>/`: a foto oficial do produto (`/reserva-vtex`), as fotos do personagem (se houver) e um arquivo `prompts.md` com um prompt por take (`/imagem-realista`).

## Fluxo

1. **Mostre os prompts e o custo estimado** e espere o "pode". O custo aparece no seletor do Flow antes de gerar: por exemplo, o vídeo é cobrado por segundo e varia com o modelo e a resolução.
2. **Imagem primeiro:** gere o quadro inicial de cada take (9:16) com a foto oficial do produto como referência. Confira com zoom: produto igual ao do site, mãos, rosto de frente.
3. **Vídeo a partir da imagem:** use o quadro aprovado como primeiro frame (modo "Frames"/imagem inicial), 9:16, de 5 a 8 s. O prompt descreve **só a continuação** (veja o modelo em `/filme-de-epocas`).
4. **Uma geração por vez.** Espere terminar e confira antes da próxima.
5. **Baixar:** o vendedor escolhe os aprovados e baixa (720p costuma ser grátis). Salve em `hyperframes/projetos/<nome>/assets/` com nomes em ordem (`take01.mp4`, ...).

## Como agir no navegador

- Tire um screenshot antes de clicar: o layout do Flow muda com frequência e as posições mudam junto.
- **Upload de imagem:** use a ferramenta de upload do navegador (arrastar o arquivo ou o botão "Enviar mídia"). Se não houver jeito de anexar pelo navegador, peça ao vendedor para arrastar o arquivo e diga qual.
- **Não injete código na página** para burlar o upload, não altere funções do site e não automatize cliques em sequência rápida. O Flow detecta isso e bloqueia a conta temporariamente.
- **Se aparecer "atividade incomum"** ou um aviso parecido: pare na hora. Explique ao vendedor e passe a só preparar os prompts e os arquivos, com ele clicando em Gerar. Não tente de novo em loop.
- CAPTCHA ou verificação: o vendedor resolve, nunca você.

## Dicas de qualidade

- O Flow entrega uma câmera mais "lisa" do que o prompt pede. Tremor, grão e compressão de celular entram na edição (veja `/filme-de-epocas`, `references/edicao.md`).
- Se a cor do produto "escorregar" no vídeo, gere de novo com a foto oficial também como referência de elemento, ou escolha só o trecho em que o produto está fiel.
- Ações difíceis para a IA (sentar, levantar, trocar de roupa) funcionam melhor como corte seco entre dois takes.

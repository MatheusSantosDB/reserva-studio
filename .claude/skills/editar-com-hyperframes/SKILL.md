---
name: editar-com-hyperframes
description: Use SEMPRE que o vendedor pedir para editar, montar ou renderizar um vídeo (filme em takes, talking head com legenda, cartões de produto, carrossel, story). O HyperFrames é o único motor de edição do estúdio. Não use para gerar imagem ou vídeo de IA (Flow, Magnific).
---

# Editar com HyperFrames

O HyperFrames faz o vídeo como uma página HTML: cada elemento tem início e duração, o movimento vem de uma timeline GSAP e o render grava o MP4 quadro a quadro. Roda com `npx`, sem instalar nada além do Node e do FFmpeg.

## Onde fica cada coisa

```
hyperframes/
  hf.sh / hf.cmd               atalho: ./hyperframes/hf.sh <pasta> <comando>
  modelos/filme-em-takes/      takes de IA em sequência + gancho + cartão final (gerado do filme.json)
  modelos/talking-head-legenda/  gravação do vendedor + legenda clássica
  projetos/<nome>/             cada edição nova (copie um modelo para cá)
```

**Edição nova:** copie o modelo mais parecido para `hyperframes/projetos/<nome>/`, troque os `assets/` e ajuste. A entrega final vai para `entregas/<nome>.mp4`.

## Filme em takes (filme de épocas, comercial de IA)

1. Coloque os clipes em `assets/` (`take1.mp4`, `take2.mp4`, ...) e o mockup da peça (`/reserva-vtex`).
2. Edite o `filme.json`: takes com a duração de cada um (encaixa na batida: 120 BPM = 0,5 s), gancho, texto de apoio e cartão final.
3. `node scripts/montar-filme.mjs hyperframes/projetos/<nome>` gera o `index.html`. O cupom vem do `config/vendedor.json`; sem cupom, o cartão sai sem ele.
4. Para testar sem os seus clipes: `bash hyperframes/modelos/filme-em-takes/gerar-exemplo.sh`.

## Talking head com legenda

Acabamento padrão: `/edicao-sem-slop` (modo seco, poda e pop-up parado). Fala ilustrada com desenhos: `/reserva-explica`.

```bash
node scripts/preparar-fala.mjs <gravacao.mp4> hyperframes/projetos/<nome>/assets/fala.mp4
node scripts/transcrever.mjs hyperframes/projetos/<nome>/assets/fala.mp4 hyperframes/projetos/<nome>/palavras.json --ate 15   # amostra
node scripts/legenda.mjs hyperframes/projetos/<nome>/palavras.json > hyperframes/projetos/<nome>/assets/legenda.js
```

- O `preparar-fala` deixa o vídeo em 1080×1920 30 fps, o áudio mono nos dois lados em ~−14 LUFS e corta as pausas acima de 0,16 s. Ao final, confira que nenhuma pausa passou de 0,2 s.
- **Amostra primeiro:** transcreva só os 15 s iniciais (`--ate 15`). Em PC comum, o vídeo inteiro leva alguns minutos; transcreva tudo (sem `--ate`) só depois da amostra aprovada.
- **Revise o `palavras.json`** antes da legenda: a transcrição erra nomes de produto (ex.: "raquetas" em vez de "jaquetas"). Para a versão final, use `--preciso`.
- No `index.html`, ponha a duração do `fala.mp4` no `data-duration` do `#root` e do `<video>`.
- Legenda clássica: 2 a 3 palavras, sem animação palavra por palavra, sem emoji.

## Comandos

```bash
./hyperframes/hf.sh projetos/<nome> lint                    # confere erros (rápido; rode a cada mudança)
./hyperframes/hf.sh projetos/<nome> snapshot --at 1,5,9     # tira fotos desses segundos (abra o contact-sheet.jpg com Read)
./hyperframes/hf.sh projetos/<nome> render -o ../../../entregas/<nome>.mp4
```

No Windows sem Git Bash, use `hyperframes\hf.cmd` no lugar de `./hyperframes/hf.sh`.

## Fluxo

1. Roteiro aprovado (regra do CLAUDE.md).
2. Monte e rode o `lint`. Olhe os quadros com `snapshot`.
3. **Amostra:** 8 s para edição simples, de 10 a 15 s para motion. Para isso, ponha um `data-duration` curto no `#root` e renderize. Espere a aprovação.
4. Render completo em `entregas/`. Abra o MP4 e confira o início, o meio, o fim, o áudio e a sincronia.

## Contrato técnico

- Root: `<div id="root" data-composition-id="main" data-start="0" data-duration="S" data-width="1080" data-height="1920">`. Elementos com tempo levam `class="clip"` e `data-start`/`data-duration`.
- Uma timeline GSAP **pausada** em `window.__timelines["main"]`, terminando com `tl.seek(0)`.
- **Tudo precisa funcionar em qualquer ponto da timeline:** nada de `Date.now()`, `Math.random()`, `setTimeout`, `fetch`, animação CSS nem `tl.call()` que mexa no DOM. Crie todos os elementos antes e ligue ou desligue com `tl.set`/`fromTo`.
- Vídeo com fala: `<video data-has-audio="true">` sem `muted`. Clipe sem som: `muted`. Áudio separado: `<audio data-start data-duration data-volume>`, com `data-duration` igual à duração real do arquivo.
- Fonte: Manrope local (`assets/Manrope-variable.ttf`, licença OFL), sem CDN de fonte. O GSAP vem do jsDelivr (precisa de internet no render).
- Camadas por `z-index`. Texto com no mínimo 28 px.
- Easings: entrada `power3.out`, saída `power2.in`, "pop" `back.out(1.3)`.
- Versão fixa: `hyperframes@0.8.225`. Documentação: `npx hyperframes@0.8.225 docs <tópico>` ou https://hyperframes.heygen.com/llms.txt.
- Renderize um vídeo de cada vez: dois renders juntos disputam o computador.

## Lições do talking head dinâmico (Reels de ~3 min)

- **Gravação de lado ou escura:** `preparar-fala.mjs --girar anti --velocidade 1.2 --luz --manter --seco`. O `--manter` deixa a imagem deitada para a edição recortar enquadramentos diferentes do mesmo vídeo.
- **Enquadramentos de um vídeo só:** ponha a fala dentro de uma "janela" (`div` com `overflow:hidden`) e troque posição e escala do vídeo por trecho: rosto em tela cheia, zoom seco, tela dividida (rosto em cima, inserção embaixo), círculo sobre uma inserção em tela cheia. Centralize o recorte no rosto de cada trecho (detector de rosto do MediaPipe) e evite a moldura de app de câmera ("REC") nas bordas.
- **`.clip` dá caixa de tela cheia:** um `<video class="clip">` dentro de uma janela precisa de `width/height` com `!important` para manter o tamanho real.
- **`fromTo` de elemento que entra depois:** use `immediateRender:false`; sem isso, o estado inicial (ex.: `opacity:0`) vale desde o segundo 0 e o elemento some antes da hora.
- **Nada de `className` no `tl.set`:** mude as propriedades direto (cor, fundo).
- **Fonte de sistema** (ex.: monoespaçada da tela do Claude Code): declare `@font-face{font-family:"Mono";src:local("Consolas")}`, senão o lint reclama e o render troca a fonte.
- **Gerador fora do projeto:** se o `index.html` é gerado de um modelo, deixe o modelo fora da pasta do projeto (dois HTML com `data-composition-id` na mesma pasta = erro de "múltiplas composições").
- **Transcrição do vídeo inteiro:** `transcrever.mjs --groq` (segundos). Revise nomes ("Cloud Code" → Claude Code).
- **Tempo de render:** ~3 min de vídeo com muitas inserções levou 30 a 47 min. Confira tudo com `snapshot` antes e renderize um de cada vez. Para trocar só o áudio, refaça a mixagem no ffmpeg com `-c:v copy`, sem renderizar de novo.
- **Trilha sonora:** não ponha por padrão. Trilha gerada de 30 s repetida embaixo da voz foi reprovada pelo vendedor. Se ele quiser música, deixe que ele escolha a faixa.

# Edição

## Preparar os clipes
O gerador entrega 720p. Para igualar os clipes e subir para 1080×1920 com um grão leve (o grão disfarça a diferença entre os modelos):

```bash
ffmpeg -ss <inicio> -t <duracao> -i clipe.mp4 -vf "scale=1080:1920:flags=lanczos,fps=30,noise=alls=7:allf=t,format=yuv420p" -an -c:v libx264 -crf 18 assets/take01.mp4
```

Corte de 3 a 4 s por take, na parte em que o rosto e o produto estão melhores.

## Montar
1. `cp -r hyperframes/modelos/filme-em-takes hyperframes/projetos/<nome>`
2. Ponha os takes, o mockup do produto (`/reserva-vtex`, `assets/peca.png`) e a trilha (`assets/trilha.mp3`, opcional) em `assets/`.
3. Preencha o `filme.json`:
   - `bpm`: 120 (1 batida = 0,5 s; as durações encaixam nela);
   - `gancho`: o texto dos primeiros segundos;
   - `takes`: arquivo, duração e, se quiser, um `texto` de apoio vindo da ficha;
   - `final`: título (nome do produto como o site escreve), foto e `fundo` (claro por padrão; escuro só com peça clara);
   - `trilha`: o caminho do áudio.
4. `node scripts/montar-filme.mjs hyperframes/projetos/<nome>`
5. `./hyperframes/hf.sh projetos/<nome> lint`, depois `snapshot --at ...` para conferir.
6. Amostra de 10 a 15 s aprovada → `render -o ../../../entregas/<nome>.mp4`.

## Regras de tela
- Nenhum texto nos 300 px de baixo: é onde ficam os botões do Reels.
- Um texto por vez, curto. Ninguém lê três linhas em 3 s.
- O cartão final dura 3 s ou mais: produto, nome e cupom (se configurado).

## Trilha
- Use música sem direitos autorais (por exemplo, a Biblioteca de Áudio do YouTube) ou deixe sem música e adicione uma do próprio Instagram na hora de postar.
- **Nunca use a música de outro vídeo** que serviu de referência.
- Volume final em ~−14 LUFS. Confira com `ffmpeg -i entregas/<nome>.mp4 -af ebur128 -f null -`.

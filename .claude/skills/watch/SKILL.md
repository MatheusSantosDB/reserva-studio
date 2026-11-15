---
name: watch
description: Use quando o vendedor mandar um vídeo (link do YouTube, Instagram, TikTok ou arquivo do computador) para analisar, copiar a estrutura, achar o gancho, entender a edição ou transcrever; também para analisar imagens de referência. Baixa com yt-dlp, tira quadros com FFmpeg e transcreve no próprio computador (Whisper local). Não precisa de chave de API nem de conta.
---

# Assistir vídeo (/watch)

Baseado no projeto open source [claude-video](https://github.com/bradautomates/claude-video) (licença MIT em `LICENSE-claude-video-MIT.txt`). Nesta versão tudo roda no computador: sem chave de API e sem enviar o áudio para fora.

## Como usar

```bash
python .claude/skills/watch/scripts/watch.py "<link-ou-arquivo>" --out-dir work/watch/<nome>
```

Ele imprime um relatório com:
- título, duração e resolução;
- a lista de quadros (imagens), cada um com o tempo;
- a transcrição: vem da legenda do próprio vídeo ou, se não houver, do Whisper local.

**Depois abra cada quadro com a ferramenta Read para ver as imagens.** Sem isso você não "viu" o vídeo.

Opções úteis:
- `--start 00:05 --end 00:15`: olha só um trecho, com mais quadros.
- `--max-frames 30`: mais quadros, para analisar a edição corte a corte.
- `--transcript-only`: só a fala.
- `--frames-only`: só os quadros.
- `--modelo large-v3-turbo`: transcrição mais precisa e mais lenta (o padrão é `small`).
- `--no-whisper`: pula a transcrição.

## O que analisar num vídeo de referência

1. **Primeiro quadro e gancho:** o que aparece e o que é dito nos 3 primeiros segundos.
2. **Ritmo:** quantos cortes e quanto dura cada take (compare os tempos dos quadros).
3. **Texto na tela:** posição, tamanho, quantas palavras por vez.
4. **Estrutura:** o que vem em cada parte (gancho, desenvolvimento, virada, chamada final).
5. **O que copiar:** só a estrutura e o ritmo. Nunca o conteúdo, a marca nem a pessoa do vídeo.

## Imagens

Para analisar uma imagem (referência de estilo, print de post, foto do produto), abra o arquivo com a ferramenta Read. Não precisa de script. Descreva a luz, o enquadramento, as cores, o texto e o que faz a imagem funcionar.

## Instalação (uma vez)

- `pip install -r requirements.txt` instala o faster-whisper. O modelo (~0,5 GB) baixa sozinho no 1º uso.
- **yt-dlp sempre atualizado:** `python -m pip install -U yt-dlp`. O YouTube muda com frequência, e versão velha dá erro 403.
- FFmpeg: veja o README.

## Quando o link não abre

- Erro 403 ou "Sign in": atualize o yt-dlp primeiro.
- Instagram e TikTok às vezes pedem login. Só com o OK do vendedor, rode de novo com `--cookies-from-browser chrome` (ou `edge`/`firefox`): o yt-dlp usa a sessão que já está aberta no navegador dele. Nada é salvo no projeto. Nunca peça senha.
- Vídeo privado ou com DRM: pare e avise o vendedor.

## Regras

- Vídeo de outra pessoa serve de **referência**, não de material: não reposte, não use os trechos dele na edição.
- Apague a pasta `work/watch/<nome>` quando terminar, se o vídeo não for do vendedor.

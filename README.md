# Reserva Studio

Um estúdio de vídeo para vendedores da Reserva, feito para usar com o **Claude Code**.

Você pede em português ("faz um filme com o tênis X") e o Claude:
- busca o produto no site;
- escreve o roteiro e espera a sua aprovação;
- gera as imagens e os vídeos de IA;
- grava a narração;
- entrega o MP4 vertical pronto para o Instagram.

> Por que um estúdio e não só um comando? Um Claude Code vazio não conhece as regras da marca, os modelos de edição nem os cuidados com IA. Esta pasta traz esse contexto pronto.

## O que você precisa

| Ferramenta | Para quê | Custo |
|---|---|---|
| [Claude Code](https://claude.com/claude-code) | o "editor" que conversa com você | plano do Claude |
| [Node.js 22](https://nodejs.org) | roda os modelos de vídeo | grátis |
| [FFmpeg](https://ffmpeg.org/download.html) | junta áudio e vídeo | grátis |
| [Python 3.10+](https://www.python.org/downloads/) | recorte de mockup, transcrição e análise de vídeo | grátis |
| Google Flow (conta Google) | gerar imagens e vídeos de IA | créditos da sua conta |
| Magnific (opcional) | vídeos de IA ilimitados em alguns modelos | assinatura |
| ElevenLabs (opcional) | voz mais natural | plano gratuito |

### Instalar o FFmpeg

- **Windows:** `winget install Gyan.FFmpeg` no Terminal. Depois feche e abra o terminal de novo.
- **Mac:** `brew install ffmpeg`

Para conferir, rode `ffmpeg -version`. Se aparecer a versão, está pronto.

## Primeiros passos

1. Baixe esta pasta (botão **Code → Download ZIP**, ou `git clone`).
2. No terminal, dentro da pasta: `pip install -r requirements.txt` e `python -m pip install -U yt-dlp`.
3. Copie `config/vendedor.example.json` para `config/vendedor.json` e preencha o seu cupom e o seu @. Esse arquivo fica só no seu computador.
4. Abra a pasta no Claude Code.
5. Peça, por exemplo:

> Busca a bermuda de linho no site da Reserva e faz um filme de épocas de 30 segundos com ela. Me mostra o roteiro antes.

## O que tem aqui

- **Nenhuma chave de API é obrigatória.** Busca, edição, transcrição, voz Edge e análise de vídeo rodam de graça no seu computador. O Flow usa os créditos da sua conta Google; Magnific e ElevenLabs são opcionais.
- **Análise de vídeos e imagens** (`/watch`): mande um link do YouTube, Instagram ou TikTok, ou um arquivo, e o Claude assiste, transcreve e explica o gancho e a edição.
- **Busca de produtos** no site da Reserva (sem senha, só o que já é público).
- **Filme de épocas:** personagens levam o produto para outra época, em takes curtos na batida da música.
- **Imagens realistas**, com cara de foto de celular, não de "IA perfeita".
- **Google Flow e Magnific** dirigidos pelo Claude, que sempre pergunta antes de gastar crédito.
- **Voz sintética** grátis (Edge) ou ElevenLabs.
- **Modelos de edição** em HyperFrames: filme em takes, talking head com legenda, carrossel e story.

## Regras que o estúdio segue

- A roupa e o tênis da Reserva nunca são gerados pela IA: sempre a foto oficial do site.
- O preço é o do dia e você confirma antes de entrar no vídeo.
- O cupom só aparece se você configurou o seu.
- Nada de rosto de pessoa real sem autorização.

## Antes de publicar uma cópia

```bash
npm test
npm run verificar
```

O `verificar` procura chaves de API e caminhos do seu computador antes de você publicar. Para barrar palavras próprias (o seu nome, por exemplo), crie `config/termos-proibidos.txt` com uma palavra por linha. Esse arquivo também fica fora do git.

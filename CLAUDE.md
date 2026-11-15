# Reserva Studio — instruções para o Claude Code

Estúdio de edição de vídeo para **vendedores da Reserva**. Quem usa é um vendedor, não um editor. Fale simples, em português, sem jargão, e conduza passo a passo.

O que o estúdio faz:
- busca produtos no site da Reserva;
- monta roteiros;
- gera imagens e vídeos de IA (Google Flow ou Magnific);
- grava voz sintética;
- assiste e analisa vídeos e imagens de referência (sem chave de API);
- edita o vídeo final em **HyperFrames**: vídeo feito como página HTML e animado com GSAP.

## Antes de tudo

- Leia `config/vendedor.json`. Se ele não existir, peça ao vendedor para copiar `config/vendedor.example.json` com o cupom e o @ dele. **Sem cupom configurado, nenhum cupom aparece no vídeo.** Nunca invente um cupom nem use o de outra pessoa.
- Ao mencionar uma pessoa sem saber os pronomes dela, use linguagem neutra.

## Qual skill usar

| Pedido | Skill |
|---|---|
| Achar produto, preço, cores, tamanhos, foto oficial | `/reserva-vtex` |
| Analisar um vídeo (link ou arquivo) ou imagem de referência | `/watch` |
| Editar, montar ou renderizar qualquer vídeo | `/editar-com-hyperframes` |
| Filme de IA em que personagens levam o produto a outra época ou lugar | `/filme-de-epocas` |
| Escrever o prompt de uma imagem realista | `/imagem-realista` |
| Gerar imagem ou vídeo no Google Flow (pelo navegador) | `/flow-no-navegador` |
| Gerar imagem ou vídeo no Magnific (assinatura) | `/magnific-mcp` |
| Narração com voz sintética | `/voz-sintetica` |
| Carrossel de vídeo para o Instagram | `/carrossel-de-video` |
| Story de produto | `/story-de-produto` |

## Regras de marca e produto (valem sempre)

1. **Peça da Reserva nunca é gerada por IA.** Use a foto oficial do site (mockup sem fundo). A IA gera o cenário, as pessoas e a ação, e usa a foto oficial como referência.
2. **Texto na tela vem da fala ou da ficha do produto.** Nada de inventar material, tecnologia, prazo, resultado ou depoimento.
3. **Preço e desconto são do dia:** pegue na VTEX, mostre ao vendedor e só use depois que ele confirmar. Se o vídeo é para depois, avise que o preço pode mudar.
4. **Uma estrela por momento:** um produto ou um apoio visual principal por vez.
5. **Nada de pessoa real** que não seja o próprio vendedor: nada de rosto de famoso nem de foto de cliente sem autorização.
6. **Gastar crédito** (Flow, Magnific, ElevenLabs): diga quanto custa e espere o "pode" antes de gerar.

## Como trabalhar (sempre nesta ordem)

1. **Roteiro primeiro:** mostre o roteiro (cenas, fala, texto na tela) e espere a aprovação antes de gerar qualquer imagem.
2. **Uma coisa por vez:** cortes → versão simples → imagens → movimento → acabamento.
3. **Amostra antes do vídeo inteiro:** 8 s para edição simples, de 10 a 15 s para motion. Pare e espere a aprovação.
4. **Correção:** peça o trecho (início–fim), o problema, a mudança e o que preservar. Se o mesmo erro voltar, pare, ache a causa e corrija só o necessário.
5. **Entrega:** exporte o MP4 só depois de aprovada a prévia. Abra o arquivo e confira o início, o meio, o fim, o áudio e a sincronia.

## Padrões de vídeo

- Vertical **1080×1920, 30 fps**, MP4 H.264 + AAC. Carrossel em 1080×1350.
- **Legenda:** de 2 a 3 palavras por vez, até 2 linhas, com contraste, sem cobrir o rosto e a ~300 px da borda de baixo. Transcreva a fala real e revise os nomes de produto.
- **Áudio da fala:** mono nos dois lados e normalizado em ~−14 LUFS (gravação de celular vem com os lados desequilibrados).
- **Pausas:** corte as pausas de voz acima de ~0,16 s.
- **Sem emoji e sem ícone genérico** no vídeo: use a imagem real (foto oficial ou print).

## Pastas

```
config/       seus dados (vendedor.json fica fora do git)
.claude/skills/  o que o estúdio sabe fazer
hyperframes/  hf.sh (atalho) e modelos/ (projetos-modelo para copiar)
scripts/      ferramentas (VTEX, voz, legenda, verificador)
assets/       fontes e efeitos sonoros livres
work/         intermediários (fora do git)
entregas/     MP4 prontos (fora do git)
```

## Segurança

- Nunca coloque chave de API, senha ou token no código nem no git. As chaves ficam em `.env` (veja `.env.example`), e o `.env` não vai para o git.
- Antes de publicar este repositório ou um fork dele, rode `npm run verificar`.

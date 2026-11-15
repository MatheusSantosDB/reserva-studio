---
name: reserva-vtex
description: Use quando precisar de qualquer dado de produto da Reserva (nome, preço, desconto, cores, tamanhos, link, foto oficial) ou de um mockup da peça sem fundo para pôr no vídeo. Busca no site pela API pública da VTEX, sem login e sem chave. Não use para gerar a peça por IA (a peça é sempre a foto oficial).
---

# Produtos da Reserva (VTEX pública)

O site da Reserva (www.usereserva.com) roda na VTEX, que tem uma busca pública: não precisa de login nem de chave. Tudo o que aparece no vídeo sobre o produto (nome, cor, preço, foto) sai daqui ou da fala do vendedor.

## 1. Buscar

```bash
node scripts/vtex.mjs "bermuda linho" --max 10 --saida work/<tema>
```

- Imprime uma lista com nome, preço (de → por e %), cores, tamanhos (`~42~` = esgotado) e link. Também salva `work/<tema>/produtos.json` com as URLs das fotos.
- A API não aceita várias palavras: o script busca a mais longa e filtra as outras pelo nome. Se vier pouca coisa, tente outra palavra ("tenis", "polo", "linho").
- **Mostre a lista ao vendedor e espere ele escolher.** Preço e desconto são de **hoje** e só entram no vídeo depois que ele confirmar. Se o vídeo vai ao ar outro dia, avise que o preço pode mudar.

## 2. Mockup (peça sem fundo)

```bash
python scripts/mockup.py "<url-da-foto>" work/<tema>/peca.png --previa
```

- **Qual foto:** a da peça sozinha, sem modelo e de frente. Em geral, roupa = a foto terminada em `_04` e tênis ou acessório = a `_01`. Nunca use foto de costas.
- **Sempre olhe o `-previa.jpg`** (a peça sobre verde) antes de usar. Problemas comuns e a correção:
  - vão entre as pernas preenchido (calça, bermuda) → `--vazado`;
  - sombra ou fundo sobrando embaixo → `--corte 0,0,1,0.92` (deixe margem dos lados);
  - peça clara no fundo bege some em partes → `--textura`.
- Primeira vez: `pip install -r requirements.txt`.

## Regras

- **A peça nunca é gerada nem redesenhada por IA.** Em imagem de IA, a foto oficial vai como referência e o prompt pede para manter a peça igual (cor, logo, costuras).
- Nada de login, carrinho, conta ou pedido. Só leitura pública.
- Não copie descrição longa do site para a tela: tire dela só o fato (material, tecnologia) e confira com o vendedor.
- A foto oficial é da marca: use só em conteúdo de venda da própria Reserva.

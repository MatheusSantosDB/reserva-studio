---
name: story-de-produto
description: Use quando o vendedor pedir um story de produto ou de oportunidade (foto oficial, nome, preço do dia, grade de tamanhos e faixa do cupom), para postar com o adesivo de link do Instagram. Pesquisa na VTEX, valida o preço com o vendedor e gera a imagem 1080x1920. Não use para Reels, carrossel ou legenda.
---

# Story de produto

Resultado: uma imagem 1080×1920 com a foto oficial do produto, o nome, o preço (de → por e %), a grade com o tamanho escolhido em destaque e os esgotados riscados, e a faixa do cupom se o vendedor tiver configurado um. Fica um espaço livre entre o card e a faixa para o **adesivo de LINK** do Instagram.

## Fluxo (sempre nesta ordem)

1. **Pesquisa:** `node scripts/vtex.mjs "<termo>" --desconto 20 --tam <TAM> --max 10 --saida work/story/<tema>`.
2. **Validação:** mostre a lista e espere o vendedor escolher o produto. **O preço é de hoje** e só entra na imagem com o OK dele.
3. **Montar:** `node scripts/montar-story.mjs work/story/<tema>/produtos.json <numero> --tam <TAM> --confirmado`.
   - Sem `--confirmado`, o script só mostra o preço e para. Isso é de propósito.
   - `--foto N` escolhe outra foto. A 1 costuma ser o modelo de frente; confira se não é foto de costas.
4. **Imagem:** `./hyperframes/hf.sh projetos/story-<produto> snapshot --at 1`. O PNG sai em `hyperframes/projetos/story-<produto>/.hyperframes/artifacts/snapshots/.../frame-00-at-1s.png`; copie para `entregas/`.
5. **Conferir no PNG:**
   - nome inteiro;
   - preço numa linha;
   - tamanho escolhido preenchido e esgotados riscados;
   - faixa do cupom (se houver) dentro da tela;
   - modelo de frente.

## Regras

- O cupom vem só do `config/vendedor.json`. Nunca use cupom de outro vendedor nem invente um.
- Desconto progressivo ou campanha só se o vendedor confirmar que vale para aquela peça.
- A foto é a oficial do site. A peça nunca é gerada.
- O vendedor acrescenta no Instagram o adesivo de link e, se quiser, um emoji.

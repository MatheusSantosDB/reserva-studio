---
name: imagem-realista
description: Use ao escrever ou revisar o prompt de uma imagem de IA (quadro de filme, look, cenário, personagem) para que pareça foto de verdade e não "imagem de IA": contexto de captura, câmera nomeada, imperfeições, cena densa, negações curtas e o produto oficial como invariante. Vale para o Google Flow e o Magnific. Não use para foto de produto (é sempre a foto oficial do site) nem para texto na imagem (entra na edição).
---

# Imagem realista (menos "cara de IA")

Base: a biblioteca de prompts do projeto open source **wuyoscar/GPT-Image2-Skill** (licença MIT; referências úteis em `references/`, com a licença). A geração em si é feita no **Google Flow** (`/flow-no-navegador`) ou no **Magnific** (`/magnific-mcp`), anexando a foto oficial do produto.

## O que faz uma imagem parecer IA (e como evitar)

| Sintoma | Causa no prompt | Correção |
|---|---|---|
| Pele de plástico, rosto de banco de imagem | `high quality`, `professional`, `stunning` | Troque por contexto de captura e `visible skin texture, pores, light stubble, slight asymmetry` |
| Luz de estúdio num lugar que não é estúdio | luz não dita | Diga a luz como ela é: `overcast window light from the left`, `flat overcast daylight`, `no flash` |
| Pose de catálogo, mãos perfeitas | pose genérica | Ação banal: `mid-step, looking slightly off camera`, `one hand adjusting the cuff`; aceite o enquadramento torto |
| Cenário "limpo demais" | cena vaga | **Cena densa:** de 5 a 12 coisas concretas do lugar (copos, cardápio, bicicleta, gente ao fundo) |
| Roupa sem amassado | tecido liso demais | `natural fabric creases at the elbows and waist`, `sleeves rolled with slight uneven folds` |
| Tudo nítido e saturado | sem câmera | Uma única câmera: `candid photo, shot on a 3-year-old smartphone, slightly grainy, natural color, no HDR look` |

## Receita de prompt (nesta ordem)

1. **Formato e enquadramento:** `Vertical 9:16 candid full-body photograph…`
2. **Captura (escolha UMA):** `amateur smartphone photo`, `35 mm film snapshot`, `documentary street photo, available light`.
3. **Sujeito e ação** concretos: idade, gesto, para onde olha.
4. **Produto como invariante:** `wears EXACTLY the garment in the attached product photo (same color, fabric, buttons, collar, logo position)`.
5. **Cena densa** (de 5 a 12 coisas) + luz + hora.
6. **Textura:** pele, tecido, couro, solado (`scuffed leather`, `fabric weave visible`).
7. **Evite (curto, só os vícios fortes):** `no beauty-filter smoothing, no studio gloss, no perfect symmetry, no extra fingers, no readable text, no watermark`.

Não empilhe superlativos nem 20 negações: negação demais domina o prompt.

## Captura banal e peso real

- **Nunca** peça `4K`, `8K`, `ultra-realistic`, `HD` ou `masterpiece`: isso puxa a cara de IA.
- Nomeie um **aparelho com idade** (celular de 3 a 5 anos), luz de ambiente um pouco crua e enquadramento levemente torto.
- **Corpo com peso e esforço:** suor, roupa amassada, músculo tenso quando a pessoa carrega algo.
- **Quem tirou a foto:** `taken by a friend standing about 3 m away at eye level, handheld, slightly tilted horizon, caught mid-step`.
- **Registro de turista** (padrão do filme de épocas): celular velho, luz chapada de dia nublado, horizonte torto, gente suando e se esforçando. Nada de hora dourada, contraluz, desfoque de cinema ou cara de revista.

| Câmera | Quando usar | Texto para o prompt |
|---|---|---|
| Celular antigo | filme de épocas, cotidiano cru | `shot on a 5-year-old smartphone, 720p-ish softness, compression artifacts, flat overcast light, handheld, tilted horizon` |
| Celular recente | dia a dia, rua, noite | `shot on a recent smartphone main camera, 24 mm equivalent, handheld, straight out of the camera, natural color` |
| Compacta documental | trabalho, lobby, café | `shot on a compact camera, 35 mm equivalent, subtle grain, handheld, available light` |
| Filme 35 mm | olhar nostálgico | `35 mm film snapshot, slight halation, visible grain, not retouched` |

Use **uma** câmera por imagem: várias juntas se contradizem.

## Detalhe de produto que não pode sumir

- **Não escreva `no logos` quando a peça tem logo ou bordado de verdade:** isso apaga o bordado. Escreva `keep the small embroidered logo on the left chest exactly as in the attached detail photo; no other logos or text`.
- Anexe, além da foto principal, uma **foto de detalhe** (bordado, botões, gola, sola). O site costuma ter fotos de detalhe no fim da galeria do produto.
- Depois de gerar, confira com zoom: bordado, botões, gola, cor do tecido, quantidade de bolsos, formato da sola.

## Regras do estúdio

- **A peça da Reserva nunca é inventada:** anexe a foto oficial e peça fidelidade. Confira cada imagem contra o site.
- Looks de dia a dia, não de campanha. Confira no site se o produto é adulto ou infantil antes de pôr num look adulto.
- **Texto na imagem: não.** Texto entra na edição (HyperFrames).
- **Pessoa real** só o próprio vendedor, a partir de fotos que ele mandou. Nunca rosto de famoso.
- O que for gerado por IA é declarado como IA na legenda do post.

## Modelo de prompt para um look

```text
Vertical 9:16 candid full-body photograph, amateur smartphone photo, natural available light, slightly grainy, no HDR look.
A Brazilian man in his late 30s, visible skin texture and light stubble, mid-conversation, looking slightly off camera, one hand in a pocket.
He wears EXACTLY the garments in the attached product photos (same colors, fabric weave, buttons, collar); keep the small embroidered logo on the left chest exactly as in the detail photo. Sleeves rolled unevenly to the forearms, natural creases at the elbows and waist.
Scene: [5–12 concrete things], [light], [time of day].
Avoid: beauty-filter smoothing, studio gloss, perfect symmetry, extra fingers, readable text, watermark.
```

## Depois de gerar

Abra a imagem (ferramenta Read) e confira pele, mãos, contato dos pés com o chão, reflexos, perspectiva do fundo e fidelidade das peças. Se reprovou algo, diga o quê antes de gerar de novo: cada geração gasta crédito ou tempo.

**Se o gerador recusar** uma roupa comum (moda praia, academia, peça justa), descreva a roupa de forma objetiva, como peça de moda: cenário neutro, pessoa adulta, sem adjetivos de corpo. Não tente driblar o filtro; se recusar de novo, escolha outra peça.

## Referências (em `references/`)

- `craft.md`: as seções 8, 9, 12 e 14 são as que mais importam.
- Galerias: `gallery-photography.md`, `gallery-fashion-editorial.md`, `gallery-product-and-food.md`, `gallery-beauty-and-lifestyle.md`.
- `openai-image-2.5-generation.md` e `openai-image-2.5-editing.md`.

Os prompts e exemplos são dos autores citados em cada arquivo. Use como inspiração; não copie o prompt inteiro.

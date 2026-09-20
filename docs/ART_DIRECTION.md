# Tactical Hunt — direção de arte

## Identidade

Fantasia medieval sombria vista de cima, com silhuetas legíveis na grade de
32 px. Ferro e aço gastos, bronze envelhecido, couro marrom, pedra cinza,
osso, carvão e prata oxidada. A cor identifica função, não raridade.

Dois motivos permanentes: **halo quebrado** para a ordem do templo e
**runa geométrica** para magia. Evitar acumular brasões e símbolos. A identidade
do leão vem da anatomia e da juba; nenhum emblema existente é reproduzido.

| Papel | Silhueta e material | Acento |
|---|---|---|
| Knight | ombros largos, armadura funcional, escudo compacto | vinho / ouro antigo |
| Druid | corpo leve, manto orgânico, cajado de ramo seco | musgo / âmbar |
| Sorcerer | manto angular, foco geométrico, prata oxidada | violeta profundo |
| Lion Guard | felino ereto, bronze e couro, arma curta | ouro fosco |
| Lion Oracle | felino esguio, osso e tecido escuro | azul lunar |
| Hollow Regent | juba escura, coroa fragmentada, ferro e martelo | vinho / bronze |

Hollow Regent é a identidade visual original do slot do boss atual. Os IDs,
nomes e eventos do dataset de combate continuam compatíveis com o baseline;
renomear o conteúdo narrativo pertence ao trabalho de mundo/campanha.

## Entrega e limite de qualidade

`docs/art/original-cast-concept.png` foi criado pelo ImageGen integrado, sem
referência a assets de outros jogos. É **conceito**, não atlas pronto: a geração
e uma edição pedindo alpha real produziram fundo opaco e registro imperfeito.
O PNG não é carregado no jogo. Não houve recorte artificial nem transformação
de sprites proprietários para aparentar arte final.

O runtime usa seis **blockouts vetoriais originais**, quatro direções e seis
ações, reproduzíveis por `scripts/generate-original-sprites.mjs`. Eles provam
o contrato, escala e leitura; ainda precisam de acabamento artístico. Os quatro
tiles de piso são originais e discretos. Efeitos em `assets/tibia/effects.*` e
ícones em `assets/wiki/` ainda são legado provisório a substituir. Arquivos
antigos preservados no repositório não significam uso pelo renderer.

## Prompt base para a próxima exportação

Use o conceito original como referência de design, sem consultar outros jogos.
“Original Tactical Hunt dark fantasy top-down sprite, orthographic three-quarter
view, strong silhouette at 48 pixels high. Worn iron, bronze, dark leather,
charcoal, bone. Broken halo and geometric rune only. [ROLE DESCRIPTION FROM
TABLE]. [FACING], [ACTION], [FRAME]. Complete body and weapon, no clipping,
true transparent RGBA background, no floor, baked shadow, glow outside body,
labels or checkerboard. Register feet at (32,56) in a 64x64 canvas.”

Gerar/exportar um papel de cada vez e aprovar alpha, alinhamento e leitura em
64 px antes de animar. Norte deve mostrar costas; oeste/leste precisam manter
arma e escudo consistentes. Luz de cima à esquerda, contorno escuro seletivo,
textura subordinada à silhueta. Sombras são do renderer.

Critério de conclusão da arte final: cardinal completo e ações reconhecíveis
em 1x/2x/4x, alpha limpo, nenhuma invasão da célula vizinha no atlas, nenhuma
mudança no footprint ou nos resultados do motor. O conceito atual não satisfaz
sozinho esse gate.

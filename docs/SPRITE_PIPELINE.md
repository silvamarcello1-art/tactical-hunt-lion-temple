# Pipeline — atualização MVP 2B.1 (05/10/2026)

## Pixel heroes 2B.3 (19/10)

SpriteLibrary aplica pixelDefinition apenas a Knight/Druid/Sorcerer: atlas PNG
320×320, células80×80, pés(40,74), idle ~60px, escala1 e nearest. Colunas S/E/N/W;
linhas idle/passo1/passo2/cast. Morte usa fade existente. Footprint continua1×1.
Raws em art/source/pixel-v1 fora do bundle; finais em public/assets/original/pixel.
Importação técnica opcional por scripts/import-pixel-atlas.mjs com Sharp externo;
CI não instala Sharp nem chama IA. ART_PROMPTS.md contém origem e prompt set.
pnpm art:generate não sobrescreve os PNG. O contrato vetorial antigo abaixo
continua válido para os sete monstros e fixtures do manifesto, não para heróis.

`pnpm art:generate` reproduz dez atores (incluindo bronze-bastion e wandering-ballista)
e nove ícones individuais em `public/assets/original/ui/<abilityId>.svg`.
Os SVG de UI são 48×48, consumidos em slots de tamanho fixo; não derivar ícone
pela posição de ability em array. Exportação segue os contratos abaixo; os testes
verificam bounds/direções/ações/registro de todos os dez atores.

Reproduzir a geração e verificar diff antes do commit; CI exige arte reproduzível.
Não copiar frames de referência para o bundle. Silhuetas são blockout original.

# Pipeline de sprites originais

## Resolução e registro

Tile lógico: **32×32**. Frame básico: **64×64**, corpo visível aproximadamente
48–54 px e pés em **(32,56)**; anchor normalizado **(0.5,0.875)**. Esse tamanho
ocupa cerca de dois tiles visuais, combina com a arena 960×576 e mantém o corpo
legível quando o CSS reduz o canvas. Pixi usa resolução do dispositivo limitada
a 2; DPR não multiplica o tamanho lógico. Boss usa escala 1.15, sem ampliar sua
ocupação lógica de um tile. Escolher 96 px só quando a silhueta futura exigir,
com footpoint e escala explícitos no manifesto.

Sombras de contato são elipses separadas no footpoint. O sprite cresce acima
dele, com UI posicionada pelo anchor da cabeça. Depth sort continua pelo
footpoint interpolado, com desempate determinístico; pixels não decidem hits.

## Contratos consumidos em runtime

- `SpriteDefinition`: entityType, spriteSet, frameSize, visualWidth/Height,
  scale, footAnchor, facings, animations, shadowProfile e effectAnchors.
- `AnimationSet`: clips por ação e direção, frames, frameCount, frameRate,
  frameDuration em ms lógicos e loop. frameDuration é a fonte de sampling;
  frameRate deve ser seu recíproco e é validado nos testes de exportação.
- `SpriteLibrary`: carrega o manifesto, recorta/cacheia texturas e escolhe o
  frame com o relógio de apresentação. Não toca o motor.
- `spriteAction`: mapeia windup/recovery para attack, casting/healing para
  cast, hit_reaction para hit e dying/dead para death.

Direções atuais: south/east/north/west. O tipo aceita diagonais futuras, sem
inventar arte diagonal nem mudar a navegação. Fallback de ação usa idle da
mesma direção; ausência dessa direção falha explicitamente.

## Layout e arquivos

`public/assets/original/manifests/sprites.json` lista todos os seis slots.
Pastas atuais: characters, creatures, bosses, terrain; efeitos e itens próprios
deverão entrar em effects e items quando forem produzidos.

Cada sheet atual mede **256×1024**: quatro colunas S/E/N/W e 16 linhas de 64 px.
Chave de frame: `coluna:linha`. Nada depende de dezenas de caminhos no renderer.

| Ação | Linhas | Frames | Duração por frame | Loop |
|---|---|---|---|---|
| idle | 0 | 1 | 500 ms | sim |
| walk | 1–4 | 4 | 110 ms | sim |
| attack | 5–7 | 3 | 105 ms | não |
| cast | 8–10 | 3 | 125 ms | não |
| hit | 11 | 1 | 180 ms | não |
| death | 12–15 | 4 | 90 ms | não |

Naming: `<role>.svg` para blockout; futuros PNG/atlas próprios podem substituir
spriteSet sem alterar combate. Originais editáveis e conceitos ficam em docs/art
ou no diretório de fonte de arte, fora do bundle público. Não usar PNG opaco
como sprite nem considerar flip horizontal uma vista norte/sul.

## Exportação e verificação

1. `pnpm art:generate` reproduz SVGs e manifesto a partir de formas originais.
2. Exporte arte final com alpha verdadeiro, gutter transparente e armas dentro
   da célula. Não bake sombra. PNG sem perdas; nearest para preservar bordas.
3. Confirme o footpoint comum e anchors de head/hand/chest em coordenadas locais.
4. Atualize frames/contagem/duração e caminho do manifesto; não altere o grid.
5. Execute typecheck, Vitest, build e Playwright; revise Auto/Manual em 1/2/4x.
6. Compare a pausa de frames de personagens, efeitos e projéteis. O ticker
   autônomo do AnimatedSprite fica desligado; animação usa tempo lógico.

Os testes verificam cardinalidade, limites/contagem do atlas, sampling e pausa
real. A aprovação artística continua sendo visual, não uma conclusão dos testes.

# MVP 1C — Authoritative Grid Combat

## Princípio

O estado autoritativo de posição usa `tileX` e `tileY` inteiros. `position` existe
somente como projeção visual compatível, calculada por `gridToWorld`. Nenhum
cálculo de dano, alcance, target, colisão, pathfinding, linha de visão ou área de
magia consulta a posição interpolada do sprite.

## Coordenadas e mapa

- A arena possui 30×18 tiles e área caminhável configurada em
  `HUNT_LAYOUT_CONFIG.walkableBounds`.
- Paredes e obstáculos estão em `HUNT_LAYOUT_CONFIG.blockedTiles`.
- `GridMap` valida limites, terreno, custos e footprints.
- Entidades atuais usam footprint 1×1; a API aceita footprints maiores.
- `gridToWorld` e `worldToGrid` fazem a conversão determinística entre lógica e
  apresentação.

## Ocupação e reservas

`OccupancyGrid` mantém índices separados para ocupação e reserva:

1. a entidade solicita um destino;
2. terreno, ocupação e reserva são validados;
3. somente uma entidade reserva o tile;
4. a reserva é confirmada e o tile anterior é liberado;
5. morte remove ocupação e reserva;
6. spawn conflitante usa busca determinística pelo tile livre mais próximo.

O tile ocupado por outra entidade nunca é atravessável. Isso também bloqueia
trocas instantâneas de posição e empilhamento corpo a corpo.

## Pathfinding e movimento

`Pathfinder` implementa A* determinístico em oito direções. O desempate usa
custos, heurística, coordenadas e ordem estável. Diagonais exigem que os dois
tiles ortogonais laterais estejam livres, impedindo corte de quina.

`MovementSystem` solicita um caminho no tick lógico, reserva apenas o próximo
tile e registra as métricas. `goalRange` permite terminar em alcance corpo a
corpo, de cura ou magia sem entrar no tile do alvo. Falta de rota produz
`movement_blocked`, sem teleporte ou fallback visual incorreto.

## Linha de visão

`LineOfSightResolver` usa raycast discreto determinístico. Terreno bloqueado
interrompe a linha. Bloqueio por unidade é configurável por habilidade por meio
de `projectileBlocksUnits`; `requiresLineOfSight` controla a regra de LoS.

## Áreas e telegraphs

`SpellAreaResolver` transforma as máscaras cadastradas em `abilityOffsets` para
a direção real do caster, remove tiles duplicados, limita ao mapa e aplica LoS
quando configurado. Alvos são comparados por chave de tile lógico e uma entidade
é afetada no máximo uma vez por cast.

Todo cast recebe `castId`. Magias avisadas por monstros emitem
`spell_telegraph`, contendo `logicalTiles` e `impactAt`; a resolução posterior
emite `spell_resolved` com o mesmo `castId` e exatamente a mesma máscara. Se o
caster morrer antes do impacto, a resolução é registrada como cancelada e não
causa dano.

## Eventos autoritativos

- `tile_reserved`
- `movement_started`
- `movement_completed`
- `movement_blocked`
- `path_recalculated`
- `spell_telegraph`
- `spell_resolved`

Os eventos antigos `move`, `reposition`, `area_warning` e `monster_aoe` foram
preservados como contratos de apresentação e compatibilidade. Eles carregam
posição visual derivada e, quando aplicável, `tile`, `fromTile`, `toTile`,
`path`, `logicalTiles`, `castId` e `impactAt`.

## Renderer e debug

O PixiRenderer interpola somente entre centros derivados dos tiles. Ele não
decide caminhos, alcance, LoS ou impactos. Obstáculos recebem representação
visual própria. O modo `?debug=1`, desligado por padrão, mostra:

- limites e grade;
- obstáculos;
- ocupação e reservas;
- caminho recalculado;
- máscaras lógicas de magia;
- spawns e posições táticas.

Diagnósticos do `#game` expõem overlaps, posições lógicas e métricas apenas para
testes e suporte. Eles não são estado de jogo.

## Métricas

`HuntResult.gridMetrics` registra:

- `pathRecalculations`;
- `blockedMoves`;
- `reservationConflicts`;
- `totalPathLength`;
- `completedPaths`;
- `stuckRecoveries`.

Comprimento médio é derivado por `totalPathLength / pathRecalculations`.

## Determinismo e testes

A mesma seed e configuração produzem a mesma timeline. Os testes cobrem mapa,
conversão, ocupação, reserva, footprints, conflitos, spawn, A*, alcance, ausência
de rota, diagonais, LoS, máscaras, telegraph/impacto, overlaps e regressões de
aggro, Challenge, conjuradores, cooldown, Boss Token e Analyzer. O Playwright
mantém uma auditoria cumulativa durante três loops para detectar overlap,
entrada em obstáculo, caminho inválido e divergência de telegraph.

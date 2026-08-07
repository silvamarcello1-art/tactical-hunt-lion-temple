# MVP 1C — Authoritative Grid Combat

## Princípio

O estado autoritativo usa `tileX` e `tileY` inteiros. `position` é somente uma
projeção visual calculada por `gridToWorld`. Dano, alcance, alvo, colisão,
pathfinding, linha de visão e áreas nunca consultam a interpolação do sprite.

## Mapa, ocupação e movimento em duas fases

- A arena tem 30×18 tiles, área caminhável e obstáculos configurados em
  `HUNT_LAYOUT_CONFIG`.
- `GridMap` valida limites, terreno, custo e footprint.
- `OccupancyGrid` mantém ocupação e reserva em índices distintos.
- A* é determinístico em oito direções. Movimento diagonal exige os dois tiles
  ortogonais livres; não há corte de quina.

No tick `T`, `MovementSystem` cria uma intenção e a arbitra por prioridade
tática, ordem estável e `entityId`. A vencedora cria `PendingMovement`, conserva
a origem ocupada e reserva o destino por **220 ms lógicos**. A posição lógica
continua na origem. Somente em `completesAt` a origem é liberada, o destino vira
ocupação e `tileX`/`tileY` mudam.

Morte, fim de sala e reset cancelam o movimento, liberam a reserva e impedem
`movement_completed` posterior. `sessionId` invalida conclusões antigas. Isso
bloqueia duas reservas do mesmo destino, head-on swap, troca instantânea,
atravessamento e reserva órfã. O renderer apenas interpola durante o intervalo.

## Reachability, cooldown e anti-oscilação

Destinos táticos são filtrados por reachability antes do score. O resultado usa
cache curto por entidade, revisão da grade e janela lógica. Destinos sem rota
recebem cooldown e não são selecionados imediatamente outra vez.

O histórico curto impede A→B→A quando não houve mudança de alvo, grade ou risco.
`allowBacktrack` mantém retornos legítimos para perseguição, Challenge e outras
mudanças táticas. Na terceira falha consecutiva, o destino é excluído
temporariamente, `stuckRecoveries` é incrementado e outra ação/fallback pode ser
executada no turno.

## Linha de visão

`LineOfSightResolver` usa supercover discreto e visita todos os tiles tocados
pela linha. Horizontal, vertical, diagonal, quina única, pinça de duas paredes,
origem e endpoint têm tratamento explícito. Endpoint bloqueado falha por padrão
e só é aceito por opção. Bloqueio por unidade é configurável por habilidade.

Movimento diagonal e LoS diagonal são regras diferentes: movimento considera
passagem do footprint; LoS considera todos os tiles tocados pelo raio.

## Projéteis, spells e hazards

`ProjectileSystem` centraliza ataques ranged de personagens, monstros e boss.
Cada `PendingProjectile` contém `castId`, `sessionId`, caster, alvo, origem,
destino, `pathTiles`, `startedAt`, `impactAt`, dano e políticas de colisão, LoS,
alvo e impacto.

O dano não ocorre no disparo: é aplicado somente em `impactAt`, exatamente uma
vez, e os eventos de dano/dodge levam o mesmo `castId`. Parede, unidade, alvo
vivo, impacto no tile original e follow-target são políticas por ataque.

`SpellAreaResolver` transforma máscaras de `abilityOffsets`, remove duplicatas,
limita ao mapa e aplica LoS quando exigido. Hazards e telegraphs seguem
`pending → resolved | cancelled`. Morte, fim de sala e reset cancelam
explicitamente casts futuros; não há resolução antecipada nem dano tardio.

## Aggro inicial da backline

`InitialAggroResolver` classifica spawns como front, back ou neutral, ordena-os
deterministicamente e aplica `maxInitialBacklineAttackers = 2`. Excedentes usam
Knight/frontline. O limite vale apenas para o estado inicial; threat, morte e
Challenge continuam livres para mudar alvos depois.

## Eventos autoritativos

- movimento: `tile_reserved`, `movement_started`, `movement_completed`,
  `movement_cancelled`, `movement_blocked`, `path_recalculated`;
- projétil: `projectile`, `projectile_resolved`, `projectile_cancelled`;
- spell/hazard: `spell_telegraph`, `spell_resolved`, `spell_cancelled`.

`move`, `reposition`, `area_warning` e `monster_aoe` permanecem como contratos
de apresentação. Eles não confirmam posição nem impacto.

## Renderer, debug e métricas

PixiJS possui camadas separadas de terreno, efeitos, entidades e overlay. O
renderer não calcula caminhos, LoS, colisão ou dano. O modo `?debug=1` mostra
grade, obstáculos, ocupação, reserva, caminhos e máscaras.

`HuntResult.gridMetrics` expõe `pathRecalculations`, `blockedMoves`,
`reservationConflicts`, `totalPathLength`, `completedPaths`, `stuckRecoveries`,
`consecutiveNoRoute` (maior sequência), `destinationCooldowns`,
`oscillationPrevented`, `maxPendingMovements` e `maxPendingProjectiles`.

## Garantias validadas

A mesma seed e configuração geram a mesma timeline. Vitest cobre movimento em
duas fases, arbitragem, morte/reset, projéteis, políticas de colisão, lifecycle,
reachability, cooldown, A→B→A, stuck recovery, supercover e cap da backline. O
Playwright audita três loops, velocidades, reset em trânsito, impacto atrasado,
cap inicial, overlap, limites, obstáculos, resíduos e console.

## Salvaguardas finais de posicionamento e encerramento

- `FiringPositionResolver` escolhe deterministicamente um tile alcançável que
  restaure geometria e linha de visão para uma ação ofensiva válida. O score
  preserva segurança, cobertura de wave e suporte do Druid; o renderer apenas
  reproduz o `reposition` com motivo `firing-position`.
- O fallback LoS-aware é acionado somente após ausência prolongada de progresso.
  Aos 40 turnos ele tenta uma recuperação; aos 80, se nada puder progredir, a
  sala encerra explicitamente como `stalemate`, nunca como vitória.
- `floor_complete` informa `victory`, `completionReason` e `turns`. Vitória
  exige party viva e zero inimigos vivos; derrota, stalemate e limite de turnos
  possuem estados separados.
- `GridMap.revision` e `OccupancyGrid.revision` formam uma revisão monotônica da
  navegação. Antes de promover uma reserva a ocupação, `completeDue` revalida o
  destino; terreno ou ocupação alterados cancelam a conclusão como
  `invalidated` e preservam a origem.
- `movementFailures` contabiliza falhas reais de movimento;
  `consecutiveMovementFailures` mede a maior sequência geral;
  `consecutiveNoRoute` considera exclusivamente falhas consecutivas
  `no-route`; `firingPositionRecoveries` contabiliza reposicionamentos LoS-aware.

### Gate final de 07/08/2026

- 91 testes Vitest aprovados em 8 arquivos;
- build de produção aprovado com 739 módulos;
- 13 cenários Playwright aprovados;
- stress de 24 hunts, seeds 803–814 em duas configurações;
- zero deadlock, vitória falsa, overlap, out-of-bounds, reserva órfã, movimento
  ou projétil stale;
- seed 811 com `energy_wave.enabled = false`: vitória em 274 turnos, 71.100 ms
  lógicos e duas recuperações de firing position.

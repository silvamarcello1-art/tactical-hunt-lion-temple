# Session Checkpoint — MVP 1D

## Identificação

- Data: 07/08/2026
- Base estável: `origin/recovery/antigravity-mvp1b`
- Base integrada do MVP 1C: merge `004e42a271823993f9661ea7e3a41e040d396ace`
- Branch: `feature/combat-presentation`
- HEAD inicial: `004e42a271823993f9661ea7e3a41e040d396ace`
- Helper individual: pausado e intocado
- Merge e publicação: não realizados

## Concluído

- Camada `CombatPresentationSystem` entre eventos e PixiJS.
- Timeline visual baseada no relógio lógico do `EventPlayer`.
- Movimento tile a tile, sem drift, com snap seguro em conclusão/cancelamento.
- Facing cardinal e state machine visual por entidade.
- Melee com windup, lunge interno ao tile, trace, impacto e recovery.
- Projectiles interpolados por toda a sequência autoritativa de `pathTiles`.
- Waves e telegraphs baseados nas máscaras lógicas, correlacionados por `castId`.
- Challenge com footprint real e feedback de aggro existente.
- Feedback próprio de damage, critical, heal e dodge, com stacking.
- Footpoint, sombra de contato, y-sort e separação de UI das entidades.
- Layers dedicadas a telegraphs, shadows, entities, effects, projectiles e UI.
- Pools para floating texts, projectiles, telegraphs e impactos simples.
- Sync debug e atributos E2E de posição, facing, estado, masks, pools e resíduos.
- Abstração `AnimationSet` para futuros sprite sheets próprios.
- 30 testes unitários específicos e 2 novos cenários E2E.

## Validação registrada

| Gate | Resultado |
|---|---|
| `pnpm run typecheck` | aprovado |
| `pnpm exec vitest run` | 121/121, 9 arquivos |
| `pnpm run build` | aprovado, 741 módulos |
| Playwright/Edge | 15/15, 1 worker, 4,7 min no gate final |
| Hunt manual 1x | vitória, 60.106 ms lógicos |
| Hunt manual 2x | vitória, 60.113 ms lógicos |
| Hunt manual 4x | vitória, 60.114 ms lógicos |
| Três loops | aprovados, sem duplicação |
| Erro máximo de sync | 0 px |
| Divergência de masks | 0 |
| Logical overlaps | 0 |
| Visual overlap warnings | 0 |
| Projectiles/telegraphs órfãos | 0 |
| Display objects residuais | 0 |
| Máximo visual observado manualmente | 73 objetos ativos |
| Pool manual observado | 13 floating texts criados e reutilizados |
| Console do navegador | 0 erros, 0 warnings |

## Commits

- `1c10ac4` — `refactor: introduce combat presentation timeline`
- `da9ff5c` — `feat: render tile movement facing and unit states`
- `22fed3a` — `feat: present melee ranged and spell actions`
- `7421cc5` — `feat: render directional waves and telegraphs from logical masks`
- `02e642d` — `perf: stabilize combat feedback layering and pooling`
- `78ea4a0` — `test: cover combat presentation invariants`
- `e44e999` — `perf: pool combat projectiles telegraphs and impacts`

## Não iniciado / fora do escopo

- Arte definitiva e sprite sheets próprios completos.
- Animações cardinais completas dos três heróis.
- Áudio, camera shake e particles complexos.
- Helper individual, inventário, equipamentos, progressões, backend e market.
- Merge e publicação.

## Estado para revisão

O MVP 1D está funcional e os gates foram aprovados. A branch deve passar por
revisão independente antes de qualquer merge. O Helper continua pausado até a
aprovação humana do MVP 1D.

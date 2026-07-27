# Lion Temple — Tactical Hunt

Vertical slice jogável de uma hunt automática 2D com PixiJS. Knight, Druid e
Sorcerer atravessam três ondas e enfrentam um boss. O motor gera uma timeline
determinística; o PixiJS a reproduz e o shell HTML apresenta controles, Party,
habilidades, loot e Hunt Analyzer.

## Executar

No Windows, também é possível usar `INICIAR_JOGO.bat`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Validar

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

`test:e2e` usa Edge e valida controles, três ciclos de loop e as resoluções
1366×768, 1600×900 e 1920×1080.

## Arquitetura

- `src/combat`: motor lógico, IA, áreas, aggro e loot.
- `src/events`: contrato e reprodução temporal.
- `src/app`: estado agregado independente do DOM.
- `src/data`: personagens, monstros, fases e habilidades.
- `src/game`: PixiJS, mapa, unidades, animações e efeitos.
- `src/main.ts`: orquestração da interface e da sessão.
- `tests/e2e`: smoke tests de navegador.
- `docs`: estado, arquitetura, roadmap, aceite e próxima tarefa.

## Estado

O MVP 0 está fechado. Consulte:

- `docs/CURRENT_STATE.md`
- `docs/ACCEPTANCE_MVP0.md`
- `docs/NEXT_TASK.md`

## Limites

- Sem colisão/pathfinding completo.
- Sem inventário real, equipamentos, backend, contas ou multiplayer.
- Assets são provisórios e devem ser licenciados ou substituídos antes de uso
  comercial.

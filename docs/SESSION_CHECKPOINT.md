# Session Checkpoint — MVP 1C Authoritative Grid Combat

## Identificação

- Data: 06/08/2026
- Base escolhida: `origin/feature/boss-token`
- HEAD inicial: `ec8c380cef98c65cc42b6962a4a93679616d994b`
- Branch: `feature/grid-combat-pathfinding`
- Remoto autorizado: `origin`
- Publicação: não realizada
- Helper individual: pausado; branch preservada e não utilizada

## Concluído

- Grade lógica 30×18 independente do canvas.
- Coordenadas inteiras `tileX`/`tileY` em todos os snapshots.
- Terreno caminhável, obstáculos, custos e footprints.
- Ocupação e reserva exclusivas por tile.
- Liberação em movimento e morte.
- Recuperação de spawn conflitante.
- A* determinístico em oito direções e sem corner cutting.
- Movimento de Knight, conjuradores e monstros pelo mesmo sistema.
- Alcance corpo a corpo e alcance de spell via `goalRange`.
- Raycast discreto de linha de visão.
- Máscaras de waves, círculos e pull deduplicadas e limitadas ao mapa.
- `castId`, telegraph e resolução no mesmo conjunto lógico de tiles.
- Projectiles com trajetória de tiles.
- Regras anteriores de aggro, threat, Challenge, reposicionamento,
  `preferredMinTargets` e `hardMinTargets` preservadas.
- Obstáculos visuais e debug opt-in de ocupação, reserva, caminho e spell mask.
- Diagnósticos de overlap e métricas de pathfinding.
- Testes unitários e E2E ampliados.
- Documentação permanente criada em `docs/GRID_COMBAT.md`.

## Parcialmente concluído

- Cache/invalidação de caminhos: não necessário para a escala atual; cada ação
  lógica recalcula A*, nunca cada frame visual.
- Footprints maiores: suportados pelos módulos e testados, mas o boss permanece
  1×1 nesta fase.
- LoS por unidade: configurável no contrato; habilidades atuais usam as regras
  compatíveis com a vertical slice.

## Não iniciado por escopo

- Helper individual.
- Inventário, equipamentos, loja, backend e progressão.
- Arte definitiva.
- Merge e publicação pública.

## Arquivos centrais alterados

- `src/combat/grid/*`
- `src/combat/CombatEngine.ts`
- `src/combat/tiles.ts`
- `src/events/types.ts`
- `src/data/config.ts`
- `src/data/abilities.ts`
- `src/game/PixiRenderer.ts`
- `tests/e2e/mvp0.spec.ts`
- documentação canônica e changelog

## Checkpoints Git

- `68563a9` — `feat(grid): add authoritative navigation core`
- `5f99669` — `feat(combat): run tactical hunt on authoritative grid`

## Validação final

- Instalação pelo lockfile: aprovada, dependências já atualizadas.
- TypeScript: aprovado, zero erros.
- Vitest: 55 testes aprovados em 6 arquivos.
- Build completo: aprovado, 735 módulos transformados.
- Playwright/Edge: 12 cenários aprovados em 3,6 minutos.
- Auditoria prolongada: três loops sem overlap, obstáculo atravessado, path
  inválido ou divergência entre telegraph e impacto.
- Navegador com `?debug=1`: hunt completa, 2.029 eventos, 342 recálculos de
  path, 129 movimentos bloqueados resolvidos, zero overlaps, zero unidades fora
  da arena, zero efeitos residuais e zero erros/warnings no console.
- `git diff --check`: aprovado.

## Estado do gate

MVP 1C concluído na branch de feature. Não houve merge nem publicação. A próxima
ação deve ser revisão por outro responsável ou abertura de PR; o Helper continua
pausado até esse aceite.

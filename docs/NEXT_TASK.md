# Próxima tarefa

## Estado de entrada

O hardening dos seis achados do MVP 1C está implementado na branch
`feature/grid-combat-pathfinding`. O Helper individual permanece pausado. Não
fazer merge ou publicação automaticamente.

## Próxima ação recomendada

Fazer uma nova revisão independente do Pull Request contra
`origin/feature/boss-token`, confirmando:

1. movimento em duas fases e reserva de 220 ms lógicos;
2. arbitragem concorrente, morte e reset em trânsito;
3. projéteis/hazards autoritativos e dano somente em `impactAt`;
4. cancelamento sem eventos antigos ou resíduos;
5. reachability, destination cooldown, anti-oscilação e stuck recovery;
6. LoS supercover e políticas por habilidade;
7. cap de dois atacantes iniciais na backline sem bloquear threat posterior;
8. 79 testes unitários, 13 E2E, build e três loops;
9. métricas e alegações de `docs/SESSION_CHECKPOINT.md`;
10. ausência de alterações em Helper, inventário, equipamentos e publicação.

Após aprovação humana, decidir entre merge do MVP 1C ou uma tarefa separada de
benchmark com grupos maiores. Priority queue, cache permanente e footprints de
boss maiores continuam adiados até evidência de necessidade.

## Leitura obrigatória

- `AGENTS.md`
- `docs/GRID_COMBAT.md`
- `docs/CURRENT_STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/SESSION_CHECKPOINT.md`
- `docs/THREAT_AND_AGGRO.md`
- `docs/HELPER_RULES.md`

## Prompt curto

> Leia AGENTS.md, docs/GRID_COMBAT.md, docs/SESSION_CHECKPOINT.md e
> docs/NEXT_TASK.md. Revise o hardening do MVP 1C contra
> origin/feature/boss-token, confira os seis achados, execute todos os gates e
> três loops, informe divergências com evidências e não faça merge, publicação,
> Helper, inventário ou equipamentos.

## Fora do escopo

Novas vocações, Helper, inventário, equipamentos, progressões, backend,
multiplayer, market, economia e publicação.

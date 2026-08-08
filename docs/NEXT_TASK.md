# Próxima tarefa

## Estado de entrada

O MVP 1D está implementado na branch `feature/combat-presentation`, criada a
partir da base estável que contém o MVP 1C aprovado. TypeScript, 121 testes
unitários, build, 15 E2E, três loops e hunts manuais em 1x, 2x e 4x passaram.

Não fazer merge ou publicação automaticamente. O Helper individual permanece
pausado.

## Próxima ação recomendada

Executar uma revisão independente do MVP 1D, comparando a branch com
`origin/recovery/antigravity-mvp1b` e confirmando:

1. nenhum cálculo de combate foi movido para a apresentação;
2. movimento termina em erro visual 0 px;
3. facing e estados não sobrevivem à morte/reset;
4. projectiles usam exatamente os `pathTiles` e `impactAt` autoritativos;
5. waves e telegraphs possuem diferença zero contra `logicalTiles`;
6. nomes e vitais permanecem acima dos efeitos;
7. box, frontline e backline são legíveis em 1x, 2x e 4x;
8. pausa congela toda a apresentação;
9. pools não deixam objetos ativos ou residuais;
10. os 121 unit tests, 15 E2E, build e três loops continuam verdes.

Se a revisão for aprovada, pedir autorização humana antes do merge. Depois da
aprovação do MVP 1D, decidir entre produzir sprite sheets próprios completos ou
retomar o Helper individual em uma branch separada. Não misturar os dois escopos.

## Leitura obrigatória

- `AGENTS.md`
- `docs/COMBAT_PRESENTATION.md`
- `docs/GRID_COMBAT.md`
- `docs/CURRENT_STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/SESSION_CHECKPOINT.md`
- `docs/HELPER_RULES.md`

## Prompt curto

> Revise independentemente o MVP 1D na branch feature/combat-presentation contra
> origin/recovery/antigravity-mvp1b. Leia AGENTS.md,
> docs/COMBAT_PRESENTATION.md, docs/SESSION_CHECKPOINT.md e docs/NEXT_TASK.md.
> Confirme autoridade lógica, sync 0 px, masks 0, pause/speeds, pools, três loops,
> 121 unit tests, 15 E2E e build. Não altere Helper, não faça merge e não publique.

## Fora do escopo

Helper, inventário, equipamentos, progressões, novas habilidades, backend,
multiplayer, market, economia, arte protegida e publicação.

# Próxima tarefa

## MVP 1B — Helper individual e regras editáveis

O aggro espacial, threat, Challenge, posicionamento tático, rotação com
preferência/mínimo obrigatório, cooldown lógico e camadas de efeitos estão
concluídos. Não reimplementar esses sistemas.

Primeira entrega recomendada:

1. versionar preferências por personagem e contexto `hunt`;
2. expor no Helper `preferredMinTargets` e `hardMinTargets`;
3. configurar o limiar de cura do Druid;
4. configurar prioridade, distância preferida e reserva para boss;
5. preservar três habilidades por vocação, ordenáveis e ativáveis;
6. migrar o formato atual do `localStorage` sem perder configurações;
7. aplicar as regras exclusivamente no `CombatEngine`;
8. provar por testes determinísticos que cada mudança altera a timeline;
9. preservar seleção, loop, Analyzer, cooldown, camadas PixiJS e limpeza.

## Fora do escopo

Novas vocações, inventário real, equipamentos, progressões, backend,
multiplayer, market, economia e pathfinding avançado.

## Leitura obrigatória

- `docs/THREAT_AND_AGGRO.md`
- `docs/HELPER_RULES.md`
- `docs/CURRENT_STATE.md`
- `docs/ARCHITECTURE.md`

## Prompt curto

> Leia `AGENTS.md` e `docs/NEXT_TASK.md`. Implemente somente o Helper individual
> e suas regras editáveis, preserve PixiJS e o motor autoritativo, migre as
> preferências atuais, valide timeline, cooldown, loop e navegador, e atualize a
> documentação afetada.

# Próxima tarefa

## Bloqueio de sequência

O Helper individual permanece pausado. A branch
`feature/helper-individual` deve continuar preservada, sem cherry-pick ou
alteração. Sua retomada só é permitida depois da validação completa e revisão do
MVP 1C — Authoritative Grid Combat.

## Próxima entrega recomendada após o gate do MVP 1C

Executar revisão e estabilização do Grid Combat com foco em escala:

1. medir pathfinding com grupos maiores;
2. adicionar cache/invalidação de caminhos apenas se as métricas justificarem;
3. definir prioridades de reserva por papel tático;
4. ampliar cenários de obstáculos e corredores;
5. avaliar footprints de boss maiores que 1×1;
6. revisar visualmente trajetórias e máscaras com arte original definitiva;
7. somente após esse aceite decidir se o Helper individual será retomado.

Não implementar inventário, equipamentos, loja, backend ou progressão nessa
revisão.

## Leitura obrigatória

- `AGENTS.md`
- `docs/GRID_COMBAT.md`
- `docs/CURRENT_STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/THREAT_AND_AGGRO.md`
- `docs/HELPER_RULES.md`

## Prompt curto

> Leia AGENTS.md, docs/GRID_COMBAT.md e docs/NEXT_TASK.md. Faça somente a revisão
> de estabilidade e performance do Grid Combat, preserve PixiJS e todos os
> contratos autoritativos, valide três loops e atualize o checkpoint.

<!-- Histórico anterior preservado abaixo para rastreabilidade. -->

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

## Observação

- **Boss Token:** concluído e validado (persistência idempotente, integração UI, testes unitários e E2E). O próximo trabalho permanece focado na auditoria e conclusão do Helper individual conforme o escopo abaixo.

## Prompt curto

> Leia `AGENTS.md` e `docs/NEXT_TASK.md`. Implemente somente o Helper individual
> e suas regras editáveis, preserve PixiJS e o motor autoritativo, migre as
> preferências atuais, valide timeline, cooldown, loop e navegador, e atualize a
> documentação afetada.

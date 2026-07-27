# Próxima tarefa

## MVP 1B — Helper individual, skills por vocação e comportamento configurável da party

O MVP 0 e o MVP 1A estão encerrados. Não iniciar inventário, progressões,
backend, pathfinding ou novos módulos do shell.

Primeira entrega recomendada:

1. versionar preferências por personagem e contexto `hunt`;
2. configurar limiar de cura do Druid;
3. configurar quantidade mínima de alvos para AOE;
4. configurar prioridade e distância do alvo;
5. manter três habilidades por vocação, ordenáveis e ativáveis;
6. aplicar as preferências no `CombatEngine`, nunca no renderer;
7. persistir localmente com migração do formato atual;
8. provar por testes determinísticos que cada regra altera a timeline esperada;
9. preservar seleção, loop, Analyzer, debug e limpeza do MVP 1A.

### Fora do escopo

Novas vocações, inventário, equipamentos, progressões, backend, multiplayer,
market, economia, colisão, pathfinding e troca de renderer.

### Prompt curto

> Leia `AGENTS.md` e `docs/NEXT_TASK.md`. Execute somente o MVP 1B, preserve
> PixiJS e as fronteiras arquiteturais, faça as preferências serem individuais
> por personagem, valide no navegador e atualize os documentos afetados.

# Próxima tarefa

## MVP 1.1 — mapa data-driven e colisão mínima

Objetivo: iniciar a fidelidade mecânica sem ampliar o produto para inventário,
progressões ou backend.

### Escopo

1. Criar contrato de dados para mapa, tiles bloqueados, spawns, posições seguras
   e saída.
2. Migrar Lion Temple para esse contrato sem alterar o resultado de combate.
3. Impedir que personagens e monstros terminem movimento em tile bloqueado.
4. Implementar pathfinding simples para rotas curtas, com fallback explícito.
5. Testar colisão, caminho possível, caminho impossível e preservação do aggro.
6. Manter os 16 testes unitários e os 4 smoke tests verdes.

### Fora do escopo

Novos módulos do shell, inventário, itens, equipamentos, progressões, backend,
multiplayer, market e mudança de renderer.

### Prompt curto

> Leia `AGENTS.md` e `docs/NEXT_TASK.md`. Execute somente o MVP 1.1, preserve
> PixiJS e as fronteiras arquiteturais, rode todas as validações e atualize os
> documentos afetados.

# SESSION CHECKPOINT — TACTICAL HUNT (LION TEMPLE)

## Informações do Checkpoint
- **Data/Hora**: 27/07/2026
- **Branch**: `recovery/antigravity-mvp1b`
- **Commit Base Recebido**: `a7bcb07` ("Complete MVP 1A hunt fidelity")
- **Commit de Checkpoint Criado**: `3c1a96b` ("checkpoint: preserve inherited MVP 1B state")

## Estado Recebido e Auditoria
- **Motor Lógico**: Autoritativo e determinístico em `src/combat/CombatEngine.ts`.
- **Relógio Lógico & Timeline**: Suporta pausa, resumption e velocidades 1×/2×/4× sem duplicação de eventos.
- **Renderer PixiJS**: Renderização por camadas isoladas em `src/game/PixiRenderer.ts` sem alteração de estados lógicos.
- **Aggro & Threat Espacial**: Monstros inicializam com aggro por proximidade (`maxInitialBacklineAttackers = 2`), mantendo tabela de threat individual e limiar de troca de alvo (15%).
- **Challenge (Exeta Res)**: Knight utiliza `exeta res` após delay inicial de 2,0s, com alcance de 5 tiles, atração de mobs na backline e forced target temporário.
- **Reposicionamento Tático**: Knight reposiciona para maximizar mobs no alcance de Challenge; Druid e Sorcerer reposicionam para evitar a box de combate mantendo alcance de cura e waves.
- **Waves & Preenchimento de Turnos**: Distinção entre `preferredMinTargets` (3) e `hardMinTargets` (2/1), prevenindo ociosidade.
- **Cooldown UI**: Cooldown circular e numérico no HUD sincronizado com o relógio da hunt.
- **Efeitos Visuais**: Renderizados em subcamadas dedicadas com animação tween de fade e cleanup total após destruição.

## Validações Executadas
1. **TypeScript Typecheck**: Executado via `pnpm run typecheck` — 0 erros.
2. **Vitest Unit Tests**: Executado via `pnpm test` — 25 testes aprovados (100% pass).
3. **Vite Production Build**: Executado via `pnpm run build` — compilação concluída em 4.97s, bundle gerado sem avisos críticos.
4. **Playwright E2E**: Executado via `pnpm test:e2e` (6 cenários end-to-end em Edge/Chromium).

## Classificação dos Sistemas (Fase 2)
1. **Motor lógico da hunt**: IMPLEMENTADO E VALIDADO
2. **Timeline de eventos**: IMPLEMENTADO E VALIDADO
3. **Relógio lógico**: IMPLEMENTADO E VALIDADO
4. **Renderer PixiJS**: IMPLEMENTADO E VALIDADO
5. **Party**: IMPLEMENTADO E VALIDADO
6. **Helper**: IMPLEMENTADO E VALIDADO
7. **Barra de habilidades**: IMPLEMENTADO E VALIDADO
8. **Skills por vocação**: IMPLEMENTADO E VALIDADO
9. **AI dos personagens**: IMPLEMENTADO E VALIDADO
10. **Spawn procedural**: IMPLEMENTADO E VALIDADO
11. **Threat e aggro**: IMPLEMENTADO E VALIDADO
12. **Challenge — exeta res**: IMPLEMENTADO E VALIDADO
13. **Posicionamento dos personagens**: IMPLEMENTADO E VALIDADO
14. **Waves**: IMPLEMENTADO E VALIDADO
15. **Cooldowns**: IMPLEMENTADO E VALIDADO
16. **Efeitos visuais**: IMPLEMENTADO E VALIDADO
17. **Hunt Analyzer**: IMPLEMENTADO E VALIDADO
18. **Boss Token**: PARCIAL / PENDENTE (Próxima etapa: moeda `bossToken` com recompensa idempotente `bossTokenReward = 1` por sessão)
19. **Currencies**: PARCIAL (Gold implementado, Boss Token pendente)
20. **Persistência**: IMPLEMENTADO E VALIDADO (`localStorage` para preferências)
21. **Testes**: IMPLEMENTADO E VALIDADO
22. **Publicação**: IMPLEMENTADO E VALIDADO (Sites e scripts de build mantidos)

## Próxima Tarefa Exata
Concluir a moeda `bossToken` idempotente (`sessionId + bossId + rewardType`) e avançar no Helper individual com regras editáveis por vocação conforme `docs/NEXT_TASK.md`.

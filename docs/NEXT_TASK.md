# Próxima tarefa — concluir gates/QA do treino 2B.2 — 19/10/2026

Manter feature/gameplay-first-mvp2a, sem Helper individual, merge ou Sites.
Núcleo de runas/movimento já implementado; não reimplementar. Ler TACTICAL_RUNES
e SESSION_CHECKPOINT. Nenhuma publicação desta etapa foi autorizada pelos gates.

1. pnpm health e revisar HEAD/diff. Ler a execução 66046 se ainda disponível;
   era a quarta tentativa de typecheck→unitários→build→36 E2E, fail-fast. Há
   timeouts de 5s em casos antigos; não aumentar limites ou enfraquecer asserts.
2. Comparação opcional, sem reset: node scripts/profile-grid.mjs 41477b9;
   pnpm exec vitest run src/control/GameplayPolish.test.ts -t "polished lifecycle scheduling"
   --config scripts/baseline-vitest.config.mjs (comando em uma linha). Apenas
   diagnóstico da versão antiga; nunca substitui o gate da implementação atual.
3. Finalizar pnpm typecheck, pnpm exec vitest run, pnpm build, pnpm exec playwright
   test --reporter=line --workers=1 e git diff --check. Não regenerar snapshots.
4. Reabrir playtest manual somente em nova sessão de Computer Use com URL
   confirmada. A ferramenta interrompeu a ação em 19/10; não tentar contornar
   com outro mecanismo de UI. E2E existentes continuam testes do repositório.
5. Somente com gates/QA verdes: commit/push normal, CI/Pages, manifest e smoke
   do SHA correto. Checkpoint WIP usa [skip ci] para não disparar deploy.
6. Depois: catálogo versionado de magias/condições das três vocações; passivas/
   Wheel em slice próprio. PvP online só após 2E; manter 2C→2D→2E→2F.

## Histórico — fechamento 2B.1

# Próxima tarefa anterior — playtest do MVP 2B.1, antes de Adventure

Branch `feature/gameplay-first-mvp2a`; contrato `GAMEPLAY_POLISH.md`. Leia
CURRENT_STATE/SESSION_CHECKPOINT para gates, CI e SHA real. Não reimplementar
controles, inventário, equipamento, loot/forja ou Helper individual.

1. Gates locais concluídos em 10/10: 216 unitários, 33 E2E, typecheck/build/diff
   e arte reproduzível. Diff revisto; push do código d51361c confirmado.
   Smoke compilado com version.json desse SHA aprovado no base path real.
2. CI push 38090057573 / PR 38090060114 aprovados, deploy Pages aprovado.
   version.json público = d51361c; smoke 1x→4x com vitória/19 kills/4240 XP,
   console limpo e lifecycle encerrado. Fechamento documental [skip ci] não
   altera o runtime publicado. Não aumentar timeouts/assertions ou regenerar
   snapshots para passar gates de futuras mudanças.
3. Playtest físico NumLock ON/OFF, com teclas de navegação e oito direções.
   Teste Edge de code/key já existe; o estado de um teclado físico não foi
   alternado por este ambiente. Colher aprovação da identidade/assistência e
   counterplay/balanceamento dos dois inimigos (arte ainda blockout original).
4. Perfilar picos de callback rAF (não FPS), com baseline comparável antes de
   alegar melhoria. Amostras e gaps estão no checkpoint. Só então planejar
   MVP 2C Adventure/mundo/NPC/quests; sequência 2B→2C→2D→2E→2F.
   Nenhum networking/PvP/campanha agora. Não fazer merge estável nem usar Sites.

Após os gates desta etapa, não repeti-los sem alteração de código; confirmar
publicação pelo SHA, não por parâmetro ?v. Mantido o swap pela reserva com mochila
cheia e saves atuais. Não limpar saves de usuário para validar cenas.

## Registro histórico — Mouse-first / Encounter Depth

## Ponto de continuação

Branch: feature/gameplay-first-mvp2a. Base: 58d97203a7666e1f5ed3d0a6040bc2d95c54ab38.
Execute fetch e pnpm health; confirme HEAD real. Leia SESSION_CHECKPOINT,
CURRENT_STATE, PLAYER_CONTROL, COMBAT_PRESENTATION e ARCHITECTURE.

Implementado: mouse-first, Auto/Manual/Assisted estritos, três slots reais,
HUD compacto, quatro papéis de monstros, direcionamento tático determinístico,
boss com fases/escombros temporários e pooling. Progressão local já presente no
worktree foi preservada e integrada. Não reimplemente estes sistemas.

## Próximo passo recomendado

**Preview publicado e verificado (30/09):** código `056a743bf9417edc7b29da0433e61e22023f1e4c`.
Com autorização explícita do usuário, foi adicionada somente a branch
`feature/gameplay-first-mvp2a` à allowlist do ambiente `github-pages`.
A branch anterior e todas as demais proteções foram preservadas.
Run `36526442306`, tentativa 2: deploy aprovado reutilizando o artifact validado;
`version.json` público confirmou o SHA exato. Nenhum merge ou envio a Sites.
Preview: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/
Smoke público em Auto/4x, Loop OFF: vitória em 47s lógicos, 17 mortes, 4.240 XP,
1.515 gold, 1 Boss Token; console sem erros/avisos. Zero overlap, out-of-bounds,
reservas pendentes, projéteis/efeitos/tweens residuais. O HEAD documental posterior
não muda o SHA da aplicação publicada. Gates: 167 unitários, 24 E2E e builds verdes.

1. Revisar a entrega no preview e colher aprovação da jogabilidade/balanceamento.
2. Manter a distinção entre preview compartilhado e site estável, não atualizado.
   Corridas E2E e fila do CI foram resolvidas; histórico em SESSION_CHECKPOINT.
3. Só então avançar MVP 1E: um objeto/NPC real e uma quest curta de exploração,
   usando comandos existentes e validação no domínio. Nada de inventário/rede gigantes.

## Limitações explícitas

- Câmera fixa; transformação suporta escala/letterbox, não pan/zoom interativo.
- Arte original de oito atores ainda é blockout; não copiar sprites externos.
- Botões de habilidade 1–3 são reais; use-with/drop/interact ainda sem resolver.
- Progressão/saldo locais são demonstrativos, não anticheat nem economia online.
- Balanceamento da nova IA precisa de playtest humano; stress não prova diversão.
- Helper individual permanece pausado, sem tocar sua branch.
- A publicação no chatgpt.site exige envio a origem Sites atualmente proibida.
  Não contornar por outro nome/URL. Preview Pages é o fluxo aprovado.

Gates: typecheck, Vitest, build, Playwright (um worker), diff --check e stress.
O ruleset desta entrega mudou intencionalmente: manter o novo baseline
determinístico, não tentar restaurar os resultados numéricos do MVP 1C.
Nenhum merge/force push. Atualizar checkpoint e confirmar push/HEAD.

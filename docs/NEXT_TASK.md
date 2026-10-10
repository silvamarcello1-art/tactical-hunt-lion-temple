# Próxima tarefa — fechar MVP 2B.1 e playtest, antes de Adventure

Branch `feature/gameplay-first-mvp2a`; contrato `GAMEPLAY_POLISH.md`. Leia
CURRENT_STATE/SESSION_CHECKPOINT para gates, CI e SHA real. Não reimplementar
controles, inventário, equipamento, loot/forja ou Helper individual.

1. Gates locais concluídos em 10/10: 216 unitários, 33 E2E, typecheck/build/diff
   e arte reproduzível. Diff revisto. Confirmar commit/push local = origin.
2. Acompanhar o workflow do SHA novo; ler logs/trace se falhar. Não aumentar
   timeouts/assertions ou regenerar snapshots para passar gates. Conferir
   deploy Pages, version.json e smoke público antes de afirmar publicação.
3. Playtest físico NumLock ON/OFF, com teclas de navegação e oito direções.
   Teste Edge de code/key já existe; o estado de um teclado físico não foi
   alternado por este ambiente. Colher aprovação da identidade/assistência e
   counterplay/balanceamento dos dois inimigos (arte ainda blockout original).
4. Só então planejar MVP 2C Adventure/mundo/NPC/quests; sequência 2B→2C→2D→2E→2F.
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

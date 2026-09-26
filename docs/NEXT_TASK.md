# Próxima tarefa — depois de Mouse-first / Encounter Depth

## Ponto de continuação

Branch: feature/gameplay-first-mvp2a. Base: 58d97203a7666e1f5ed3d0a6040bc2d95c54ab38.
Execute fetch e pnpm health; confirme HEAD real. Leia SESSION_CHECKPOINT,
CURRENT_STATE, PLAYER_CONTROL, COMBAT_PRESENTATION e ARCHITECTURE.

Implementado: mouse-first, Auto/Manual/Assisted estritos, três slots reais,
HUD compacto, quatro papéis de monstros, direcionamento tático determinístico,
boss com fases/escombros temporários e pooling. Progressão local já presente no
worktree foi preservada e integrada. Não reimplemente estes sistemas.

## Próximo passo recomendado

1. Revisar a entrega no preview e colher aprovação da jogabilidade/balanceamento.
2. Confirmar deployment no SHA do commit, sem confundir preview com site estável.
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

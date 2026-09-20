# Próxima tarefa

## Estado de entrada

MVP 1D agora integra apresentação e controle manual na branch
`feature/combat-presentation-astra`, sobre o HEAD validado `ed23459`.

O mesmo CombatEngine roda incrementalmente na UI e em batch via run().
WASD/setas, AI/Manual/Assistido por ator, target/attack/follow/stop, magias,
Look contextual, cancelamento, transformações de coordenadas e infraestrutura
use-with/drag existem. Não reimplementar esses sistemas.

Leia AGENTS.md, CURRENT_STATE.md, SESSION_CHECKPOINT.md, PLAYER_CONTROL.md,
COMBAT_PRESENTATION.md e ARCHITECTURE.md; execute pnpm health e fetch origin.
Confira os gates finais registrados no checkpoint antes de continuar.

## Próximo vertical slice: MVP 1E — Manual Adventure & Interaction

Após validar o HEAD entregue, crie `feature/manual-adventure-interaction` a
partir dele. Entregue uma pequena experiência real de exploração com um ponto
interativo de mundo/NPC e um objetivo de quest. Use os comandos existentes,
validação no domínio e eventos/snapshots para a apresentação.

- A hunt atual ainda usa quatro salas de combate e formação entre andares;
  exploração persistente não está implementada.
- `interact`, `use`, `use-with` e `drop` ainda retornam unsupported-interaction.
  Só conecte essas operações a objetos/itens reais e regras explícitas; os slots
  vazios do Backpack não representam inventário.
- Pan/zoom é aceito pela transformação de coordenadas, mas a câmera continua fixa.
- Sprites cardinais completos ainda dependem de arte própria/licenciada.
- Comandos estão preparados para transporte; não existe autenticação nem servidor.

Preserve os hashes Auto de 24 hunts, os testes existentes, os quatro E2E manuais
(incluindo diagonal/pilar), a matriz de ownership, os cooldowns na troca de modo,
a limpeza entre sessões e a sincronização de apresentação.

Helper individual continua pausado e sua branch não deve ser tocada.
Não implementar inventário/quests/PvP gigantesco, backend ou novos frameworks.
Não fazer merge, force push, publicação, deploy ou usar remote sites.

O gate proporcional inclui health, typecheck, Vitest, build, Playwright com um
worker, diff --check e stress. Commit/push somente para origin; confirmar HEAD
local/remoto iguais e worktree limpa.

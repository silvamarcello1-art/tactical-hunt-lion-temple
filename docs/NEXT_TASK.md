# Próxima tarefa

## Estado de entrada

MVP 1D integra apresentação e controle manual desde 64816ac. A consolidação
seguinte está em feature/visual-identity-foundation; leia o checkpoint atual.

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
- Cardinais e seis ações existem como blockouts originais de 64 px; acabamento
  raster final e efeitos/ícones originais ainda estão pendentes.
- Comandos estão preparados para transporte; não existe autenticação nem servidor.

Preserve os hashes Auto de 24 hunts, os testes existentes, os quatro E2E manuais
(incluindo diagonal/pilar), a matriz de ownership, os cooldowns na troca de modo,
a limpeza entre sessões e a sincronização de apresentação.

Helper individual continua pausado e sua branch não deve ser tocada.
Não implementar inventário/quests/PvP gigantesco, backend ou novos frameworks.
Não fazer merge, force push ou usar remote sites. Preview automático após
gates está autorizado pelo AGENTS.md. Preserve o site estável e verifique SHA/URL.

O gate proporcional inclui health, typecheck, Vitest, build, Playwright com um
worker, diff --check e stress. Commit/push somente para origin; confirmar HEAD
local/remoto iguais e worktree limpa.


Antes de 1E, consumir ART_DIRECTION.md e SPRITE_PIPELINE.md; não reabrir uma
refatoração grande do motor. Não trocar os blockouts por atlas opaco ou assets
de terceiros. A pipeline é substituir arte pelo manifesto, sem mudar a grade.
Depois: 1F inventário/Use-With; 1G campanha; 1H autoridade no servidor após ADR;
1I PvP. Campanha está prevista e ainda não implementada.

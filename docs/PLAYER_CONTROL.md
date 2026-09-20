# MVP 1D — Player Control Foundation

## Autoridade e execução

Há um único `CombatEngine`. O loop anterior tornou-se uma simulação incremental:
`advanceTo(time)` executa os ticks de 250 ms devidos; `run()` drena a mesma
simulação para testes/batch. Não há re-simulação da hunt ao trocar controller.

```text
HeldInput / pointer / barra de habilidades
  -> PlayerCommand -> CombatEngine.submit -> fila validada
  -> resolvePlayerIntent / ordens persistentes
AI (heroActions) -> mesmos move / basicAttack / healFriend / performOffensiveAction
  -> MovementSystem / ProjectileSystem / SpellAreaResolver / dano existente
  -> CombatEvent -> LiveEventPlayer -> CombatPresentationSystem -> PixiJS
```

Os comandos incluem `commandId`, `sessionId`, `actorId`, `ownerId`, `sequence`,
`logicalTick` e `intent`. A fila copia os dados, limita volume e valida sessão,
sequência, payload e ownership. Aceitar na fila não garante execução: o domínio
revalida vida, alvo, mana, cooldown, alcance, LoS e geometria no tick. Resultados
das últimas 128 execuções ficam disponíveis para feedback.

`ownerId = local-player` identifica a autoridade local desta vertical slice;
não é autenticação. Transporte/reconciliação e validação remota ficam para um
servidor futuro. UI não escreve posição, ocupação, dano ou cooldown.

## Modos por ator

- **Auto (AI):** decisões existentes da hunt.
- **Manual:** somente comandos e ordens explícitas daquele ator. Os outros
  heróis continuam no próprio modo. Recuperação de posição por AI é bloqueada.
- **Assistido:** input/ordem persistente tem prioridade; AI atua quando não há
  comando de ação nem ordem ativa. Um passo bloqueado também suprime AI no tick.

Trocar modo preserva HP, mana, posição, cooldowns e alvo; descarta a ordem de
perseguição anterior. Um movimento já reservado termina normalmente. **Parar**
limpa alvo/ordem e impede novos passos/ataques; não cancela impactos já lançados.
Em Assistido, AI pode retomar no tick seguinte. O cooldown básico continua válido
ao alternar controllers. Transições de andar mantêm a formação original da hunt.

## Controles disponíveis

1. Selecione o personagem no controle abaixo do mapa e escolha Manual.
2. Inicie a hunt; WASD e setas mantidas geram passos por tick lógico. Diagonais
   exigem destino e ortogonais livres; um passo bloqueado nunca vira desvio A*.
3. Clique no tile de uma entidade para selecionar; o marcador acompanha seu
   footpoint. Atacar persegue até alcance e repete ataque básico com cooldown.
4. Seguir acompanha uma entidade viva sem atacar; Parar encerra a ordem.
5. Botão direito no tile abre Examinar/Atacar/Seguir. Clique em uma habilidade
   do personagem para conjurar sobre o alvo, ou armar targeting se não houver
   alvo. Botão direito na habilidade sempre arma targeting. ESC cancela.
6. Volte a Auto para retomar a hunt com o estado de combate atual.

Magias reutilizam máscaras, projéteis, custos e cooldowns reais. Challenge manual
usa as condições e o alcance existentes, mas não reposiciona o Knight por conta
própria. Cura usa a party como alvo. Casts não ignoram habilidades desativadas.

OS key repeat não determina movimento. Blur, foco em campo editável/modal,
documento oculto, pausa, troca de ator/modo, morte, transição, reset e loop limpam
held keys/targeting. Inputs de jogo não disparam em input, textarea, select ou
contenteditable. Comandos de botões enviados durante pausa aguardam retomada.

## Interação, câmera e limites

`screenToTile` transforma CSS screen -> viewport -> camera origin/zoom -> tile,
respeitando a convenção existente de centro em múltiplos de 32 px. A câmera
permanece fixa, mas a transformação aceita pan/zoom e é testada isoladamente.

`InteractionController` modela idle, seleção, spell targeting, use-with, pointer
pressionado e dragging. Drag exige threshold de 6 px e pointerId consistente;
drop produz um comando distinto de use-with. ESC/cancel/reset removem o estado.

Não há inventário real: use, use-with, drop e interact são contratos preparados
e rejeitados pelo domínio com `unsupported-interaction`. Não há itens artificiais,
drag em slots vazios, efeitos falsos, HTML drag-and-drop autoritativo ou quest
fictícia. Integrar objetos/NPC/itens reais pertence ao MVP 1E/futuro inventário.

## Validação

- `autoBaseline.test.ts`: hashes completos de 24 hunts gravados de `ed23459`
  antes da adaptação; protegem resultados **e todos os eventos** do Auto.
- `playerControl.test.ts`: ownership, Assisted, sequência/sessão, held input,
  diagonal, follow/stop, ataques, cooldown entre controllers, máscaras, impacto,
  pausa/speeds, disposal, coordenadas e targeting/drag.
- Stress misto: 24 hunts, seeds 803–814 com energy wave ON/OFF; 23 vitórias,
  uma party derrotada (808, wave ON), sem stalemate/turn limit, overlap, entrada
  em obstáculo, fora de limites ou lifecycle pendente ao concluir andar.
- `player-control.spec.ts`: quatro fluxos reais de navegador, incluindo pilar,
  diagonal bloqueada, perda de foco, menu contextual, ESC e retorno a Auto.
- Gate final: typecheck, 145 unitários em 11 arquivos, build de 745 módulos,
  19 E2E em 4,8 min (um worker), três loops, três resoluções e diff --check verdes.

Sprites cardinais completos, exploração persistente, NPC/quests, inventário e
rede não fazem parte desta entrega. Helper individual permanece pausado.

## Fronteira após consolidação

PlayerControls recebe PlayerControlPort, sem conhecer PixiRenderer ou ter
referência mutável ao motor. main.ts conecta snapshots, comandos e relógio à
sessão única. O browser continua responsável por foco/teclas/ponteiro; comandos
serializáveis e ownership permanecem validados no CombatEngine. Nenhuma regra
de IA, cooldown, pathfinding, alvo ou dano foi alterada nesta consolidação.

# Controle do jogador — contrato vigente (05/10/2026)

`GAMEPLAY_POLISH.md` detalha o MVP 2B.1 e prevalece sobre o histórico abaixo.
Digit1–3 usa os três IDs/slots reais do herói, de `actionBindings`; clique e tecla
chamam `cast()` e a mesma intenção validada. Repetição do SO não enfileira casts.
Cura padrão self; Shift escolhe aliado. Sem alvo ofensivo arma targeting; ESC
cancela targeting antes de Stop. Botões não engolem teclas; campos/selects em
edição, dialogs/drawers capturam deliberadamente. Fechar devolve foco ao canvas.

Numpad físico: 7/8/9 ↖/↑/↗, 4/6 ←/→, 1/2/3 ↙/↓/↘, 5 Stop. WASD e setas mantidos.
KeyboardEvent.code separa numérico de fileira superior, independentemente de key.
Buffer de um tap e amostra por decisão; passos passam pelo MovementSystem, sem
cortar quinas ou ignorar ocupação/reserva. Stop não cancela passo comprometido.

Auto conserva autonomia; movimento explícito assume Manual somente no selecionado.
Manual permanece explícito. Assistido agora nunca move por rotação/perseguição:
jogador controla tiles, engage direito é obrigatório, sem autoaquisição após morte.
Movimento explícito mantém Assistido e opções, suspende ações durante o passo.
Duas opções por herói comandadas pelo domínio/persistidas em chave própria;
reload restaura apenas booleans, não modos, ordens, alvo ou início automático.
Ambos OFF: só ações explícitas. Attack ON: básicos. Magias ON: rotação válida e
suporte documentado, um orçamento por ator/tick. Cast explícito aceito prevalece;
desligar opção impede novos lançamentos, não apaga impactos comprometidos.
Cast explícito não troca modo nem companheiros; em Auto substitui a ação
automática apenas naquele tick. Movimento/Stop em Auto assume Manual.

## Histórico — contrato anterior (26/09/2026)

# Controle do jogador — contrato vigente (26/09/2026)

## Um motor, três modos por personagem

Seleção de herói é exclusivamente HUD/targeting, nunca transferência automática de controle.

- **AUTO (AI)** encontra alvos, persegue, recupera LoS, ataca, cura e usa habilidades.
  Selecionar o herói não interrompe nada. Um alvo explícito tem preferência até morrer;
  depois o Auto continua normalmente.
- **MANUAL** aguarda comandos. Botão direito em inimigo cria ordem persistente de
  perseguição/ataque básico, mas nunca rotação de magias. Hotkeys executam casts
  explícitos. Alvo morto não é substituído.
- **ASSISTED** não ataca nem conjura por iniciativa própria até um engage explícito.
  Depois usa a IA completa contra aquele alvo. Morte/invalidação encerra a ordem;
  não retoma aquisição autônoma.

Mudar modo limpa alvo, ordens e destino, preservando HP/mana/cooldowns. Um passo
já reservado termina com revalidação normal. ESC limpa targeting/ordem e para
novas ações; se estava Auto, passa o selecionado a Manual. Impactos já lançados
mantêm seu lifecycle. Os outros personagens conservam seus modos.

## Mouse e teclado

| Entrada | Intenção |
|---|---|
| Esquerdo em chão | MoveTo pelo A* existente; destino mais recente substitui o anterior |
| Esquerdo em entidade | Seleção; herói muda os três slots sem mudar seu modo |
| Direito em inimigo vivo | Engage no modo atual, sem menu |
| Dois botões juntos (qualquer ordem) | Look; consome os dois releases, sem attack/move |
| WASD/setas | Passo manual; assume Manual para o herói selecionado |
| 1–3 / clique no slot | Cast validado da habilidade real |
| Shift+1–3 | Arma seleção de alvo para aquele cast |
| ESC | Cancela targeting e ordens; para novas ações |

MouseGesture recebe mousedown/mouseup: PointerEvent só emite pointerdown para o
primeiro botão, logo não identifica sozinho o segundo botão do chord. A captura
de pointer bloqueia picking duplicado do Pixi; releases fora do canvas limpam o
gesto sem executar ação. Contextmenu é prevenido **somente no canvas**. HUD é
DOM externo e não encaminha cliques ao mundo.

Look usa dados de entidade e worldDescriptions, com uma linha contextual. NPC,
use/use-with/drop no mundo ainda retornam unsupported-interaction.
Não há menus artificiais para funcionalidades futuras.

MVP 2B: inventário/equipamento/forja reais em drawer. Enquanto aberto, limpa
inputs pendentes e bloqueia mouse/teclado do mundo; ESC fecha sem enviar Stop.
A seleção de herói atualiza imediatamente o painel. Equipar/desequipar/forjar
só entre hunts com Loop OFF; a simulação automática pode continuar em consulta.

## Autoridade

PlayerControls -> PlayerControlPort -> PlayerCommand -> CombatEngine.submit ->
fila validada -> MovementSystem / ProjectileSystem / resolvers -> eventos.

Comando inclui sessão, ator, owner, sequência, tick e ID. Receber na fila não
garante execução: domínio revalida vida, mana, cooldown, alvo, LoS, geometria e
propriedade. Destinos substituem comandos MoveTo pendentes, sem fila ilimitada.
O destino explícito suspende a IA daquele ator até chegada/novo comando; não
teleporta nem modifica o estado visual diretamente.

O owner local não é autenticação. Autoridade é lógica, mas o jogo ainda roda
inteiramente no navegador; servidor, rede e reconciliação não estão implementados.

## Coordenadas e lifecycle

Picking usa footpoints renderizados apenas para identificar a entidade clicada;
o domínio decide com tiles inteiros. Screen -> canvas desconta letterboxing
de object-fit: contain; screen -> world -> tile mantém escala uniforme.
A câmera continua fixa: a função pura suporta pan/zoom, não existe controle
interativo de câmera neste slice.

Blur, documento oculto, foco editável, pausa, troca de herói/modo, morte,
transição, reset e loop limpam held keys e targeting. Nenhum timer por ícone:
cooldown e animações seguem o relógio lógico, inclusive pausa e 1x/2x/4x.

## Evidência e alteração intencional de baseline

A nova composição inimiga, IA, boss e habilidades originais mudam resultados;
os hashes de ed23459/58d9720 não são uma promessa de compatibilidade com este
ruleset. Permanecem no histórico Git. autoBaseline executa duas vezes cada uma
das 24 combinações (803–814, wave ON/OFF), compara o resultado completo e
protege resumos e hashes SHA-256 de todo HuntResult/timeline versionados.
Não regenerar snapshots sem explicar a regra alterada.

EncounterDepth, MouseGesture, playerControl e os E2E mouse-first/player-control/
gameplay-shell cobrem ownership, espera dos modos, alvo morto, latest destination,
chord, HUD, slots, pausa, loops e grade. Evidência consolidada no checkpoint.

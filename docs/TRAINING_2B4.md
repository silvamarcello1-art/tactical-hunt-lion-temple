# Treino 2B.4 — arena, barra unificada e equipe adversária

## Pedido e limites — 19/10/2026 (São Paulo)

Referência visual fornecida pelo usuário: piso claro em grade, heróis legíveis e
hotbar no rodapé. Não copiamos a captura. A pasta indicada
`rubinot- 2026/assets_rtc/` foi inspecionada, inclusive
com acesso elevado: apenas `data/cursors/`, zero arquivos. Portanto NÃO houve
importação de sprites de Tibia. Heróis/bots usam os três atlas próprios existentes;
runas/utilidades recebem ícones vetoriais originais em TacticalIcons.ts.
Magias/passivas continuam no perfil parcial documentado em TRAINING_2B3.md.
Nada desta entrega constitui catálogo/Wheel completo ou PvP online.

## Layout e área acessível

- Magias 1–3, runas 4–7 e utilidades 8–9 seguem em uma sequência no rodapé verde.
  Um único rune-kit é movido, não duplicado; bindings/validações permanecem iguais.
- Modo, assistência e mensagem contextual ficam na segunda linha compacta do
  dock; não há uma faixa de controles separando o jogo do rodapé.
- Descrição lateral removida; cards mostram retrato próprio, HP/mana/nível/modo.
- Pixi redimensiona o canvas ao viewport; um container world agrupa as oito
  camadas existentes. Escala uniforme: não estica tiles nem corta a arena.
- No treino 3×3, o motor cria uma arena de 18 linhas e 30–52 colunas, calculadas
  pelo aspecto disponível ao criar a sessão (36 colunas no fixture unitário).
  Todos os tiles amarelos, inclusive antigas margens, pertencem ao GridMap:
  `0..columns-1` e `0..17`. Caixas/paredes e runas continuam bloqueios reais.
- arenaView expõe dimensão/origem da grade. O renderer usa origem visual -16,
  para mostrar tiles inteiros com seus centros em tile×32. Input aplica a mesma
  transformação inversa; não inventa destinos fora da grade.
- Resize durante combate reenquadra a grade existente, sem reconstruir sessão,
  teleportar criaturas ou alterar colisão. Eventuais sobras usam pedra neutra,
  nunca área amarela falsa. Nova sessão recalcula a largura conforme a janela.

## Um único herói controlado

Regra nova deliberada: clicar no card ou no personagem assume Manual nele.
O domínio devolve qualquer outro herói controlado para Auto atomicamente,
limpando ordens/destinos antigos, sem apagar mana/HP/cooldowns, preferências ou
impactos já lançados. Passo reservado conclui com revalidação normal.

O selecionado pode ser Manual, Assistido ou Auto. Companheiros permanecem Auto.
Selecionar outro herói não transfere opções de assistência entre personagens.
No treino, Knight começa Manual e os dois magos Auto; na hunt, início Auto
permanece. Mudar modo não recria a sessão. Seleção/modo são configuração
síncrona validada pelo domínio, mesmo em pausa. Não avançam o relógio: novas
ações da IA continuam aguardando a próxima decisão lógica.

Ordens pendentes do antigo selecionado são rejeitadas como `not-selected` após
uma troca na mesma decisão. Comandos para bots continuam recusados por ownership.
O motor mantém defaults antigos em fixtures de regressão, enquanto a aplicação
ativa explicitamente singleHeroControl. Essa distinção é coberta por testes.

## Três bots ativos

| ID | Identidade | Função |
|---|---|---|
| training-sparring | Veyra / Sorcerer | Magia, wave, ataque ranged e SD |
| training-vanguard | Brann / Knight | Perseguição, melee, Berserk/Groundshaker e SD |
| training-warden | Selya / Druid | Cura outro bot ferido, gelo e Fire Field |

trainingVocation identifica perfil/arte; role continua monster para manter lado
hostil, field friendly-fire, recompensas e ownership corretos. Nomes BOT em cor
hostil, HP e mana visíveis; não são cópias dos heróis player-owned.

Alvo: menor percentual de HP entre vivos; empate por HP absoluto, distância e ID.
Challenge válido conserva forced target até expirar; depois volta ao foco por
vida. Sem caminho/LoS, usam MovementSystem/A*/firing-position existentes.

Spells usam o mesmo catálogo, mana, cooldown individual/grupo, máscaras, cast,
dano/cura e projétil. Bots não dependem de habilidades desligadas pelo jogador
no Helper. Cura exige outro aliado ferido e LoS; não cura a equipe adversária.
Ataque básico usa alcance melee/ranged da vocação e sua recarga existente.

Decisão de runa a cada 4s após 3s iniciais; só sucesso gasta carga e ação. SD e
Fire Field compartilham validação com o jogador. Destroy Field é tentado ao
estar sobre fogo; não remove Magic Wall nem burning. Não há mana/cargas infinitas
ou dano disparado pelo renderer. Magic Wall defensiva e push por bots ainda não
fazem parte da rotação. Regras de timing/dano/atributos seguem parâmetros de
treino, não equivalência integral com PvP Tibia.

## Não regressão e aceite

- Economia, progressão, inventário, reserva, loot e forja não foram alterados.
- Treino continua sem XP, gold, loot, drops ou Boss Token persistentes.
- Cura inimiga não aumenta a cura da party no Analyzer.
- Baselines Auto das hunts antigas não são regenerados.
- TrainingTeam.test cobre ownership, ordem atrasada, bordas, foco, três bots,
  spells/runas/cura, determinismo por frame e cleanup.
- training-team.spec usa a configuração real, sem interceptação: três resoluções,
  sequência 1–9, seleção por card/canvas, assistência/Auto e três vitórias.
- Testes históricos de spell/push/assistência mantêm fixture estacionário e
  controle independente por interceptação explícita em isolated-combat-fixture.
  Não representam o modo 3×3 público. Assertions/timeouts permanecem; a nova
  semântica de produção é validada separadamente, não escondida por essa fixture.

Resultados executados, SHA e publicação: SESSION_CHECKPOINT.md. Nenhuma alegação
de FPS melhor sem medição comparável; tile lógico continua 32, sem zoom ajustável.

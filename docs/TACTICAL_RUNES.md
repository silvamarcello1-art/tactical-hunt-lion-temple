# MVP 2B.2 — laboratório local de movimentação e runas — 19/10/2026

Atualização 2B.3: TRAINING_2B3.md prevalece sobre o kit/atalhos abaixo: 4/5
mantidos, 6 SD, 7 Destroy Field, 8 push/arrastar, 9 Stop. Sem zoom; pixel heroes
maiores e mira de tile. Mesmo motor, treinamento sem economia. Sem paridade
integral de fórmulas/Wheel; fontes e lacunas registradas no novo documento.

## Decisão e limite

O usuário autorizou começar por treino contra bot, não PvP online. Este incremento
entra depois de 2B.1, sem antecipar servidor ou substituir 2C→2D→2E→2F.
`?training=1` usa o MESMO CombatEngine, grade, A*, ocupação, reservas, LoS,
projéteis, relógio e renderer. Não existe um segundo motor ou simulação DOM.
É Party × um bot conjurador, não um duelo entre contas: três heróis selecionáveis
começam em Manual. Auto e Assistido existentes podem ser escolhidos explicitamente.
O botão de cenário só navega entre sessões; nenhum treino inicia no reload.

O bot usa a IA caster e a arte original já existentes. Não se apresenta como um
jogador remoto nem ganha uma árvore de habilidades fictícia. Atributos base,
sem aplicar o equipamento/progressão do save ao treinamento. Inventário é somente
consulta no treino. XP, ouro, drops, Boss Tokens e recibos econômicos não mudam.
Loop desabilitado; repetir/reiniciar gera nova sessão e novo kit. Limite existente
de 700 decisões encerra um treino sem progresso como falha, nunca vitória falsa.
Stalemate curto não interrompe o uso deliberado de barreiras temporárias.

## Contratos executáveis

- Teclas físicas 4/5 (fileira superior), ou botões do kit, armam uma runa; clicar
  no chão envia `PlayerIntent.rune`. Clique numa entidade usa seu tile lógico.
  Numpad continua movimentando, 1–3 continuam as habilidades reais da vocação.
- ESC cancela targeting antes de Stop. Foco editável/drawers/modal, pausa,
  troca de herói, blur e reset preservam o tratamento existente de input.
- Treino usa prioridade da tecla mais recente por eixo quando direções opostas
  estão pressionadas. Repeat do SO não muda essa prioridade. Soltar restaura a
  tecla anterior ainda pressionada; buffer continua limitado a um tap. Hunts
  mantêm o comportamento anterior de cancelamento das direções opostas.
- Comando valida sessão, owner, sequência, entidade viva, tipo de runa, tile
  inteiro, bounds, alcance/LoS, cooldown, cargas e terreno. Rejeição não consome
  carga nem mana. Cast/runa explícitos compartilham o orçamento por ator/tick.
- Runa pronta não cobra mana de fabricação. Kit gratuito é exclusivo do treino;
  cargas não são itens persistidos, compráveis ou dropáveis nesta etapa.
- Magic Wall bloqueia um tile caminhável desocupado; pode invalidar uma reserva.
  Não substitui parede original nem outra runa. A revisão da grade invalida
  caminhos; o A* e os projéteis revalidam pelos resolvers existentes.
- No treino, um passo diagonal comprometido também revalida as duas laterais e
  seu footprint antes do commit. Parede/ocupação/reserva lateral nova cancela
  o passo, conserva a origem e libera a reserva. Revisão distante não o cancela.
  Essa regra reativa é opt-in no MovementRequest para preservar hashes de hunts
  anteriores; não regenerar baselines antigos por conveniência.
- Fire Field não bloqueia caminhada/LoS. Entrada de inimigo aplica dano inicial
  e burning não cumulativo, com ticks que continuam brevemente após sair. Campo
  de herói não causa friendly fire nesta configuração de treino. Não é uma
  implementação das regras de skull/war/safety de nenhum world type do Tibia.
- RuneSystem não sorteia crítico/dodge nem lê DOM. Dano de campo fixo entra no
  pipeline do motor (HP, analytics, morte, cancelamento e recompensa suprimida).
  Fonte morta não apaga automaticamente o campo; fim de sessão limpa tudo.
- Expiração e ticks entram no scheduler lógico: sem setInterval ou Date.now.
  Pausa/1x/2x/4x compartilham o relógio, como movimento e projéteis.
- Eventos rune_placed/rune_removed informam sessão, owner, castId, tile e prazos.
  Pixi só desenha. Grafismos vetoriais próprios pulsantes, fade/cleanup separados
  de entidades; nomes/vitais continuam acima. Diagnósticos activeRuneTiles e
  runeConditions ficam em data-* para QA, não na HUD normal.

## Parâmetros do protótipo, não paridade numérica certificada

| Runa | Tecla | Cargas por herói/sessão | Range | Exhaust de ataque | Duração |
|---|---|---|---|---|---|
| Magic Wall | 4 | 8 | 7 tiles | 2000 ms | 20000 ms |
| Fire Field | 5 | 12 | 7 tiles | 2000 ms | 15000 ms |

Fire Field: entrada 20 HP; ticks 8 HP a cada 1000 ms; condição até 5000 ms após
o último contato. São valores de treino explícitos em data/runes.ts. NÃO são
afirmações de que o Tibia atual usa esses tempos/danos. Não há crafting, custos
de compra, duração aleatória de parede ou requisitos de level/magic level reais.

## Fontes e plano de fidelidade ao Tibia atual

Consulta em 19/10/2026. A biblioteca oficial descreve Magic Wall como bloqueio
de caminhada e de disparos/luz em um sqm. Distingue fabricar a runa (magia,
mana, quantidade) de usá-la (requisitos/grupo próprios). Os snippets oficiais
foram acessíveis; a abertura direta retornou 403. Nenhum script/asset foi copiado.

- [Biblioteca oficial — Magic Wall Rune](https://www.tibia.com/library/?group=Support&spell=magicwallrune&subtopic=spells)
- [Biblioteca oficial — catálogo de runas](https://www.tibia.com/library/?subtopic=spells&type=Rune&vocation=Sorcerer)
- [CipSoft — ajustes de vocações e Wheel](https://www.tibia.com/news/?id=8944&subtopic=newsarchive)

Não afirmar “tudo igual à versão atual”: magias/passivas/árvore existentes ainda
são do Tactical Hunt. A migração mecânica é o próximo trabalho, não uma troca
superficial de nomes/ícones. Planejamento incremental:

1. Fixar uma revisão/data de referência e montar catálogo verificável das cinco
   vocações. Separar level/magic level, uso/criação de runa, cooldown individual/
   grupo, range, LoS, facing, máscara de tiles, fórmulas e modificadores PvE/PvP.
   Identificar informação não confirmada, sem preencher por memória.
2. Implementar primeiro o catálogo/áreas/condições das três vocações existentes,
   preservando IDs/saves. Adicionar Paladin/Monk somente em slice próprio.
3. Passivas/Wheel: dados de nós, pré-requisitos, pontos por nível, reset, efeitos
   reais, migração e testes; sem tela de árvore com bônus sem efeito no motor.
4. Energy/Poison Field, remoção de campos e regras por world type exigem revisão
   própria. Destroy Field não deve ser inventado como dispel de Magic Wall.
5. PvP entre jogadores permanece em 2F, depois de autoridade/autenticação/rede em
   2E. O laboratório local não oferece anticheat ou segurança de servidor.

## Verificação

Testes de RuneSystem/MovementSystem: ownership, paredes originais, reservas,
quina dinâmica, revisão distante, dano/condição, limpeza, comandos/cargas,
exhaust e eventos idênticos em frames 73/1000. E2E: 4/5+clique/ESC, colisão,
burning, pausa/expiração/reset, três treinos sem recompensa e três resoluções.
Gates efetivamente executados e publicação: SESSION_CHECKPOINT.md.

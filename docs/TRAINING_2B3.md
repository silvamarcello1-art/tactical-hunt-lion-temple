# Treino 2B.3 — runas, empurrão e leitura — 19/10/2026

## Escopo

Party × bot local, mesmo CombatEngine/PixiJS. Sem backend, PvP entre contas,
recompensas, migração de saves ou Wheel completa. A hunt normal mantém seu
catálogo, fórmulas e baselines. O perfil trainingSpells seleciona nove habilidades
com IDs estáveis: não renomear dados persistidos para trocar apresentação.

## Comandos e precisão

| Teclas físicas | Ação no treino |
|---|---|
| Digit1–3 | Três magias da vocação selecionada |
| Digit4 | Magic Wall: tile vazio, barreira temporária |
| Digit5 | Fire Field: campo de fogo |
| Digit6 | Sudden Death: inimigo, projétil de death |
| Digit7 | Destroy Field: remove campo de fogo, NÃO Magic Wall |
| Digit8 | Empurrar: alvo adjacente → tile adjacente ao alvo |
| Digit9 | Parar; não desfaz um passo já comprometido |
| Numpad1–9 | Movimento em oito direções; 5 para |

O gesto principal é segurar o botão esquerdo sobre um aliado/inimigo, arrastar
e soltar em um tile imediatamente vizinho. Tecla8 é só alternativa acessível
em dois cliques, nunca pré-requisito. A correção do usuário confirma vizinhos,
NÃO alcance de sete tiles. Enquanto segura, a grade mostra os oito vizinhos:
até sete podem estar livres quando o herói ocupa o outro; paredes, quinas,
reservas e demais criaturas podem reduzir esse número. O tile original não é
destino. A cor vem de PushSystem.preview, com a mesma validação do comando,
incluindo recarga/intenção pendente. Segurar não move o alvo; soltar envia uma
única solicitação e ainda revalida após o atraso. Soltar fora cancela o gesto;
blur/reset retiram a indicação. Não empurra o
próprio herói; use movimento. Chefes não são empurráveis por padrão. O domínio
valida sessão, ownership, orçamento de ação, alvo vivo, distância, destino,
footprint, ocupação/reserva e quinas. A intenção aguarda 1000 ms lógicos,
revalida origem/alvo/parada/terreno e usa MovementSystem para reserve→commit.
Mover o alvo antes do prazo cancela. CD de 2000 ms e adiar ataque básico por
2000 ms são parâmetros de treino, não tempos oficiais certificados.

Conforme a última escolha do usuário, NÃO há zoom ajustável. Tile lógico continua
32×32. Três heróis têm pixel art própria maior (corpo idle ~60 px, frame 80×80),
pés registrados e HP/mana/nomes acima. Aumentar arte não altera colisão ou dano.
Mira de runa destaca o tile apontado, verde/vermelho segundo preview do domínio.
MW/campo/remoção ignoram a hitbox alta do sprite: acertam o chão destacado.
SD permite clicar no desenho do inimigo. Picking prioriza pés próximos antes
da sobreposição de corpos; empurrão também pode usar seleção em dois cliques.

## Lifecycle

- SD passa pelo ProjectileSystem existente, castId/sessionId e timestamp de
  impacto. Não aplica dano no clique. Política original-tile: alvo que abandona
  o tile cancela o impacto, sem homing inventado pelo renderer. Isso ainda é
  uma limitação de fidelidade ao Tibia, não uma afirmação sobre seu autoaim.
- Destroy Field não remove burning já aplicado, paredes estáticas ou MW.
  Só cobra carga após remoção real. Runas prontas não cobram mana de fabricação.
- Uma ação explícita por ator/tick; grupo attack/support e recarga comum de item
  1000 ms. Todas as recargas/push/VFX seguem relógio lógico, pausa e 1x/2x/4x.
- Morte cancela deslocamento de push comprometido; fim/reset limpam intenção,
  reservas, campos, condições, projéteis e mira. Não restaura ordens no reload.
- Eventos push_queued/started/resolved/cancelled e rune_used são fatos do domínio.
  pendingPushCount e data-aim-tile são diagnósticos de QA, não outra autoridade.

## Perfil de magias e referências

Consulta de 19/10/2026, snippets da biblioteca oficial (abertura direta pode
retornar 403). Nomes, palavras, custos e CDs base destes nove registros foram
conferidos; dano, requisitos e máscaras ainda não são paridade certificada.

| Magia | Palavras | Mana | CD / grupo |
|---|---|---|---|
| Chivalrous Challenge | exeta amp res | 80 | 2s / support 2s |
| Berserk | exori | 125 | 4s / attack 2s |
| Groundshaker | exori mas | 200 | 8s / attack 2s |
| Heal Friend | exura sio | 120 | 1s / healing 1s |
| Strong Ice Wave | exevo gran frigo hur | 170 | 4s / attack 2s |
| Eternal Winter | exevo gran mas frigo | 1050 | 40s / attack 4s + focus 40s |
| Flame Strike | exori flam | 20 | 2s / attack 2s |
| Energy Wave | exevo vis hur | 170 | 8s / attack 2s |
| Rage of the Skies | exevo gran mas vis | 600 | 40s / attack 4s + focus 40s |

No treino, Heal Friend exige outro aliado, nunca self; tecla 1 arma seleção de
aliado. Strong Ice Wave usa onda frontal, dano de gelo, e dois ícones próprios
substituem a identidade de natureza somente nesse perfil. Grupos secundários
são verificados no motor e apresentados pelo mesmo relógio. A hunt normal não
recebe essas mudanças por troca de nomes.

Mana Buffer de Druid/Sorcerer: dano estritamente maior que HP converte excesso
em custo de mana ×8, mais 25% da mana máxima no máximo uma vez a cada 2s;
sobrevive com 1 HP se restar mana. Dano igual ao HP não é excesso. Ainda não há
boss de dano percentual neste treino; essa exceção oficial precisa de regra
explícita quando esse tipo de dano existir. Knight mantém a passiva própria
existente (unlock real), não uma passiva oficial fictícia.

Fontes, sem copiar sprites/textos extensos:

- [SD](https://www.tibia.com/library/?spell=suddendeathrune&subtopic=spells) e
  [Destroy Field](https://www.tibia.com/library/?spell=destroyfieldrune&subtopic=spells):
  propósito e separação fabricar/usar. Dano SD 160 + 1,8×magicPower é protótipo.
- [Controles oficiais](https://www.tibia.com/gameguides/?section=controls&subtopic=manual):
  arrastar criaturas, atraso e condições; tempos de push acima não são oficiais.
- [Challenge](https://www.tibia.com/library/?spell=chivalrouschallenge&subtopic=spells),
  [Berserk](https://www.tibia.com/library/?spell=berserk&subtopic=spells),
  [Groundshaker](https://www.tibia.com/library/?spell=groundshaker&subtopic=spells).
- [Heal Friend](https://www.tibia.com/library/?spell=healfriend&subtopic=spells) e
  [alteração do self-heal](https://www.tibia.com/news/?id=5836&subtopic=latestnews).
- [Strong Ice Wave](https://www.tibia.com/library/?spell=strongicewave&subtopic=spells),
  [Eternal Winter](https://www.tibia.com/library/?spell=eternalwinter&subtopic=spells),
  [Flame Strike](https://www.tibia.com/library/?spell=flamestrike&subtopic=spells),
  [Energy Wave](https://www.tibia.com/library/?spell=energywave&subtopic=spells),
  [Rage](https://www.tibia.com/library/?spell=rageoftheskies&subtopic=spells).
- [Ajustes de junho/2026](https://www.tibia.com/news/?id=8833&subtopic=newsarchive):
  buffer e onda; [exceção percentual](https://www.tibia.com/news/?id=8933&subtopic=newsarchive).

Pendente: fórmulas por level/ML, comprovar diagramas oficiais de cada máscara,
requisitos de uso, cadeia/limite e conversão de ranged do Challenge, autoaim SD,
stances/rod/wand, catálogo completo e Wheel. Não afirmar “tudo como Tibia atual”.
O alcance/máscaras existentes continuam parâmetros explícitos enquanto não
confirmados. Sem mudar baselines antigos para esconder diferenças.

Validação efetivamente executada e SHA publicado: SESSION_CHECKPOINT.md.

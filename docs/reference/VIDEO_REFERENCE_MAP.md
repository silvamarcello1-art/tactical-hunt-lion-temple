# Mapa do vídeo de referência

## Metadados

| Campo | Valor |
|---|---|
| Arquivo analisado | `Gravação de Tela 2026-07-26 224518.mp4` |
| Duração | 04:53,73 |
| Resolução | 1910 × 848 |
| Taxa | 30 fps |
| Quadros | 8.812 |
| Tamanho | 257.371.163 bytes |

A análise usou leitura local equivalente a ffmpeg. Foram geradas contact sheets temporárias por mudança de cena e em intervalos de dez segundos. Os frames não foram incluídos no repositório nem no bundle da aplicação.

## Linha do tempo observada

| Tempo | Tela ou ação | Comportamento relevante |
|---|---|---|
| 00:00–00:49 | Hunt ativa | Party e monstros movimentam-se livremente; magias cobrem tiles; nomes, vida, mana, dano e palavras de invocação aparecem sobre a ação. |
| 00:20–00:40 | Troca de ondas | O mapa permanece, grupos surgem em posições variadas e a composição se reorganiza. |
| 00:50–01:02 | Configuração rápida de cura | Modal abre sobre a hunt ativa, com limiar percentual e escolha de potion. |
| 01:03–01:18 | Helper — cura e escudo | Abas por personagem e contexto Hunt/Boss/PVP; regras diferentes por HP e mana. |
| 01:19–01:28 | Helper — equipamento | Troca emergencial de item por percentual de vida e retorno ao item padrão. |
| 01:29–01:38 | Helper — atacar | Prioridade de alvo e comportamento de posição, incluindo distância configurável. |
| 01:39–01:56 | Helper — magias de ataque | Ordem por drag-and-drop, mínimo de mobs para AOE e presets de combo. |
| 01:58–02:17 | Cyclopedia — itens | Busca, categorias, paginação, lista e painel detalhado de atributos e fontes de drop. |
| 02:18–02:31 | Bosstiary | Catálogo visual de bosses, kills e estágio de progresso. |
| 02:32–02:51 | Personagem | Skills, bônus, loyalty, conquistas e histórico de mortes por personagem. |
| 02:52–03:05 | Party e Prey | Composição em colunas, slots bloqueados, seleção de criatura e reroll/lock. |
| 03:06–03:15 | Progressão | Árvore por personagem, nós conectados, pontos disponíveis, reset e importação/exportação. |
| 03:16–03:19 | Daily | Calendário de recompensas com janela de 24 horas e progresso acumulado. |
| 03:20–03:23 | Armazenamento | Caixa de entrada, reward chest, baús e transferência por clique ou arraste. |
| 03:24–03:27 | Mercador | Categorias, compra e venda, estoque e moeda, mantendo o contexto da hunt ao fundo. |
| 03:28–03:29 | Hunt e acesso social | Combate continua; o shell global e as notificações permanecem. |
| 03:30–03:32 | Guild | Visão, histórico, hierarquia, membros e experiência da guild. |
| 03:39–03:53 | Ranking | Categorias de highscore, filtro por vocação, paginação e posição do jogador. |
| 04:00–04:02 | Combate AOE | Grande efeito por tiles demonstra legibilidade e sobreposição visual. |
| 04:03–04:07 | Rotação de habilidades | Catálogo, filtros, cooldown, mana, tipo, quantidade mínima de alvos e slot de prioridade. |
| 04:08–04:53 | Hunt, itens e equipamentos | Tooltips, equipamento por personagem, Backpack/Loot/Supply Pouch, movimentação, ondas e transições continuam sendo demonstrados. |

## Padrões de experiência extraídos

- A hunt ocupa a maior área útil; controles e dados ficam nas bordas.
- O shell não muda entre módulos. Modais aparecem sobre a hunt, que continua visível.
- Party, Backpack, Loot Pouch e Supply Pouch permanecem acessíveis durante o combate.
- Configurações são específicas por personagem e por contexto.
- Skills e itens usam hierarquia compacta, tooltip e edição sem sair da tela principal.
- Magias comunicam área por tiles, palavras, cor, animação e números.
- Progressão da onda e boss ficam sempre visíveis.
- A referência é de comportamento e organização, não de marca, nomes, arte ou código.

## Limites da observação

O vídeo mostra claramente Helper, Enciclopédia, Bosstiary, personagem, Prey, progressão, Daily, armazenamento, mercador, Guild, ranking e configurações de rotação. Loja, VIP, Arena competitiva, comércio entre jogadores e Social completo aparecem como pontos de navegação ou contexto, mas não têm fluxo integral demonstrado; seus critérios permanecem pendentes em `DECISIONS.md`.

## Aplicação no MVP 1A

Somente os padrões da área de hunt foram usados: arena dominante, dados nas
bordas, frontline/backline, nomes e vitais legíveis, movimento curto, feedbacks
da timeline e configuração sem abandonar o shell. O mapa, as zonas procedurais,
a seleção e os assets provisórios continuam próprios do protótipo. Nenhum frame
ou asset do vídeo foi incluído no bundle.

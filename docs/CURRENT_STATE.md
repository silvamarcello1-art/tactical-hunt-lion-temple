# Estado vigente — incremento 2B.3 — 19/10/2026

Implementado e validado localmente: quatro runas por 4–7, push por 8/arrastar e Stop por 9 no treino;
três heróis com pixel art própria maior, sem zoom, mira de tile independente do
sprite. Perfil de nove magias de referência, Heal Friend ally-only e Mana Buffer
dos magos; hunt normal/saves preservados. TRAINING_2B3.md define regras/fontes e
limites. ART_PROMPTS.md registra o modo builtin e fontes/atlas. Não é PvP online
nem Wheel completa. Após confirmação do usuário, left-drag ganha prévia dos
vizinhos autorizados (não distância7); tecla8 continua alternativa.251unitários/
40E2E PASS no follow-up; confirmar CI/deploy/version.json do próximo commit.
Runtime15cc18b anterior do mesmo incremento já teve CI/deploy/manifest confirmados;
não confundir com a revisão posterior da prévia dos vizinhos.

## Histórico — MVP 2B.2 publicado

Treino local Party × Bot em ?training=1, no mesmo motor, Manual inicial e sem
recompensas persistentes. Magic Wall/Fire Field por 4/5 + clique, com cargas,
exhaust, range/LoS, terreno e burning de domínio. Quinas dinâmicas revalidadas
no treino; inversão por tecla recente sem fila. Sprites próprios preservados.
Não é PvP online nem conversão completa de magias/passivas/Wheel do Tibia.
Contrato e fontes: TACTICAL_RUNES.md. A* original foi mantido após experimento
não benéfico; batch run evita cópias incrementais descartadas, sem mudar eventos.

Gates locais aprovados na retomada: 231 unitários, 36 E2E, typecheck, build e
diff --check. Instalação frozen e arte reproduzível aprovadas. LoS passou a
percorrer o supercover sem arrays/Set descartados; mesmos hashes e regras,
paredes/unidades revalidadas em cada chamada. Não foram elevados timeouts.
Runtime publicado: 88d3fc6256666038b0581c0674717cb20e45e79c. CI push
39311311231 e PR 39311319743 aprovadas (231 unitários/36 E2E); deploy Pages
aprovado e version.json público confirmado. Smoke público de runas/três treinos
sem alteração econômica e hunt normal 1x→4x até o boss: PASS, console e cleanup
limpos. Preview compartilhado: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/?training=1
O checkpoint documental posterior [skip ci] não muda o runtime publicado nem
representa novo build/merge estável. Detalhes: SESSION_CHECKPOINT.
Playtest via navegador real automatizado, com inspeção das imagens; não equivale
a teste de teclado físico. Computer Use nativo não foi contornado após a
interrupção registrada na sessão anterior. Ver SESSION_CHECKPOINT/NEXT_TASK.

## Histórico — entrega anterior publicada em 10/10/2026

# Estado anterior — MVP 2B.1 — retomada 10/10/2026

Implementação na branch `feature/gameplay-first-mvp2a`, sobre 7062c5d (código
anterior 8e2a309). Controles físicos separados Digit/Numpad, slots estáveis por
herói, Assistido com Auto Attack/Auto Magias independentes e HUD compacto em
screen space. O mundo mantém o viewport dominante e as passivas continuam visíveis.

Projéteis diretos são linhas contínuas entre pontos autorizados; supercover
serve para colisão, não animação. O ruleset 2B.1 usa ponto original, sem homing:
alvo que abandona o tile provoca cancelamento, não teleporte/dano fantasma.
Movimentos e impactos comprometidos resolvem nos prazos lógicos, entre decisões
de 250 ms; uma única amostra de input por decisão. Pausa/velocidade compartilham
esse relógio. O ruleset antigo permanece para regressões determinísticas.

Dois reforços originais: Bastião de Bronze e Balista Errante, com ataques
anunciados e recuperação. Roster 5/5/6/3, sem inflação de XP/loot pelos reforços;
IDs e RNG de recompensas existentes preservados. Inventário/forja/equipamentos
não foram reimplementados; troca da reserva com mochila cheia preservada.

Auto Druid recupera posição válida de cura quando LoS bloqueia um aliado ferido,
antes da ofensiva. O terceiro loop progressivo não pode sacrificar um herói por
esse bloqueio. Assistido não recebe movimento oculto; usa a posição do jogador.

Contrato detalhado: `GAMEPLAY_POLISH.md`. Gates, métricas, limitações e SHA
servido: `SESSION_CHECKPOINT.md`. Sequência permanece 2B → 2C → 2D → 2E → 2F.

Código da etapa: `d51361c0b822fa69d1e23d36ffd7e5b207c03462`, push normal para
origin confirmado. Gates locais: 216 unitários e 33 E2E; build de preview também
validado no base path real. CI push 38090057573 / PR 38090060114 aprovados,
deploy Pages aprovado e version.json público confirmado em d51361c. Smoke
público 1x→4x terminou em vitória, sem erros/resíduos. O fechamento documental
posterior não muda esse SHA de runtime; não confundir preview com release estável.

## Histórico — MVP 2B

# Estado vigente — MVP 2B — 05/10/2026

Implementação local validada em 05/10 na branch `feature/gameplay-first-mvp2a`:
184 unitários, 28 E2E, TypeScript/build/diff aprovados. A correção posterior a
dca5339 permite equipar diretamente da reserva mesmo com mochila cheia.
Publicação e CI: ver SESSION_CHECKPOINT.
Inventário local com 24 espaços, materiais em stacks de 99 e reserva sem descarte;
seis armas, duas armaduras e um material originais. Drops vêm do domínio em RNG
isolado, com IDs persistentes e recibos contra replay. Equipar/forjar somente
entre hunts com Loop OFF. Forja +1 custa 200 gold e uma Brasa do Templo.
Stats de nível e equipamento são calculados no domínio, também usado pela UI;
trocas não acumulam bônus nem recuperam HP/mana. XP, preferências e Boss Tokens
anteriores são preservados por migração aditiva. Save inválido não é apagado.

UI: drawer por herói, comparação, slots reais, forja, reserva, relatório com
drops reais, feedback compacto de Loop. Inputs do mundo bloqueados no drawer.
Polish focado em identificação da party, contraste de HP e comparação legível;
sprites existentes preservados. Contrato: `EQUIPMENT_AND_LOOT.md`.
Gates/ponto exato: `SESSION_CHECKPOINT.md`. Sem backend, comércio, descarte,
drag-and-drop, novos slots ou economia online. Roadmap vigente: 2B–2F.

## Histórico — Mouse-first + Encounter Depth — 26/09/2026

Branch feature/gameplay-first-mvp2a, base 58d9720. Este resumo substitui as
descrições históricas abaixo quando divergirem.

- Mouse: chão MoveTo, entidade seleção, direito engage, dois botões Look sem
  ações duplicadas. WASD e 1–3 mantidos; nenhum menu Attack/Follow/Stop no HUD.
- AUTO autônomo; MANUAL só ordens explícitas; ASSISTED aguarda alvo, usa rotação
  até sua morte e então para. Seleção não muda controller.
- Mundo domina a tela, party mínima e três slots reais com cooldown lógico.
  Análise/loot ficam em drawers; configuração de habilidades continua disponível.
- Quatro perfis originais: Custódio, Vigia, Garra e Oráculo. Ranged busca LoS/
  distância; flanker procura backline; caster pontua máscaras e candidatos
  determinísticos a cada 1500 ms lógicos.
- Regente Vazio tem fase abaixo de 50% HP e Queda da Coroa: aviso especial,
  impacto, escombros reais por 3000 ms, revisão de navegação e restauração.
- Magias comuns não pintam pretelegraph; magia de jogador mantém projétil/
  wave/impacto próprios. Apenas requiresTelegraph habilita aviso antecipado.
- Arte aprovada preservada; oito atores originais, novo relevo do templo e
  pools de efeitos animados. Build exclui cópias legadas, sem apagar fontes.
- Progressão XP/nível/passiva e store local da etapa anterior preservados.
- Novas regras alteram baseline Auto intencionalmente; repetibilidade completa
  em 24 combinações substitui comparação aos antigos hashes (preservados no Git).

Typecheck, 167 unitários, 24 E2E e build aprovados; evidências e publicação
consolidados em SESSION_CHECKPOINT. Não há backend, inventário real ou PvP.
Não confundir preview Pages com a referência estável chatgpt.site.

---

# Histórico — Consolidação visual e estrutural — 20/09/2026

Branch feature/visual-identity-foundation, base validada 64816ac. Motor e grid
inalterados; main.ts cria a sessão e PlayerControls usa PlayerControlPort.
Seis blockouts originais, quatro facings/seis ações e quatro pisos próprios
carregam via manifesto. Footpoint, sombras, seleção e offsets estão coerentes;
efeitos/projéteis param seus frames na pausa. Arte final e efeitos/ícones
originais ainda pendentes. Conceito ImageGen separado do runtime.

Pipeline de preview GitHub Pages adicionada ao repositório. Acesso Sites é
válido, porém o envio obrigatório ao repositório próprio conflita com a regra
contra remote sites. Nenhum envio a essa origem foi feito. O site estável
chatgpt.site permanece na versão anterior. Evidência final em SESSION_CHECKPOINT.

O histórico abaixo registra os marcos anteriores e suas limitações na época;
para a situação vigente, prevalecem este resumo e o checkpoint mais recente.

# Estado atual — MVP 0 até MVP 1D

## Takeover de 19/09/2026 — controle manual integrado

O HEAD de entrada `ed23459` continha apresentação funcional, mas não continha
PlayerController, ownership, comandos ou execução ao vivo. Portanto o MVP 1D
combinado estava **funcional porém incompleto**; a continuação permaneceu em
`feature/combat-presentation-astra`, sem iniciar uma branch 1E.

Agora existe um vertical slice Manual + Auto sobre o mesmo motor incremental:
WASD/setas/diagonais, ownership AI/Manual/Assistido por ator, seleção, ataque,
follow, stop, Look contextual e casts pela barra existente. A apresentação
estabilizada foi reutilizada; os 24 resultados Auto do HEAD de entrada são
protegidos por hashes completos. Use-with/drag possuem state machine e comandos,
com rejeição explícita enquanto não houver inventário real.

Gate final: typecheck, **145 testes**, build de **745 módulos**, **19 E2E**
(incluindo três loops/três resoluções) e diff --check aprovados. Stress misto de
24 hunts: 23 vitórias/uma derrota real; zero falhas de integridade.

Próximo gap: MVP 1E com exploração e interação concreta de mundo/NPC/quest,
sem antecipar inventário gigante, servidor ou PvP. Arte cardinal completa ainda
é pendência visual. Ver `docs/PLAYER_CONTROL.md` e checkpoint para evidências.

## MVP 1D — Combat Presentation & Visual Fidelity

- `CombatPresentationSystem` separa estado visual temporário do motor lógico.
- Movimento usa `movement_started/completed/cancelled`, durações lógicas e
  termina exatamente no centro do tile, sem drift.
- Facing cardinal acompanha movimento, alvo, cast e ataque.
- Estados visuais cobrem windup, ataque, recovery, cast, reação, cura,
  dodge, morte e idle.
- Melee possui lean, trace, impact e recovery sem invadir outro tile.
- Projectiles percorrem exatamente `pathTiles` entre `startedAt` e `impactAt`.
- Waves e telegraphs usam somente as máscaras lógicas emitidas pelo MVP 1C.
- Damage, critical, heal e dodge possuem feedback distinto e stacking.
- Footpoint, sombras e y-sort determinístico mantêm box, frontline e backline
  legíveis.
- Nomes, HP e mana ficam em uma camada acima dos efeitos.
- Pause, 1x, 2x e 4x usam o mesmo relógio lógico.
- Pools reutilizam floating texts, projectiles, telegraphs e impactos simples.
- Debug compara tile lógico, footpoint, bounds, facing, estado, progresso,
  target, y-sort e máscaras, e mede o custo da apresentação.
- `AnimationSet` prepara a troca futura por sprite sheets próprios.
- Helper individual permaneceu pausado; motor, inventário, equipamentos,
  backend, merge e publicação não foram alterados.

Consulte `docs/COMBAT_PRESENTATION.md` para a especificação permanente.

### Evidência do MVP 1D — 19/09/2026

| Validação | Resultado |
|---|---|
| TypeScript | zero erros |
| Vitest | 124 testes em 9 arquivos |
| Apresentação isolada | 33 casos aprovados |
| Build | 741 módulos, aprovado |
| Playwright/Edge | 15 cenários aprovados em 4,6 min no gate final |
| Manual | uma hunt completa em 1x, 2x e 4x |
| Loop | 3 ciclos sem duplicação |
| Integridade visual | sync 0 px, masks 0, overlap 0, resíduos 0 |
| Console | zero erros e warnings |
| Merge/publicação | não realizados |

## MVP 1C — Authoritative Grid Combat

- Entidades possuem `tileX`/`tileY` inteiros e exclusivos.
- `GridMap` contém limites, obstáculos, custos e footprints.
- `OccupancyGrid` impede overlap, reserva conflitante e head-on swap.
- Movimento ocorre em duas fases: origem ocupada e destino reservado por 220 ms
  lógicos até `movement_completed`.
- Spawn conflitante procura deterministicamente o tile livre mais próximo.
- A* determinístico move em oito direções sem cortar quinas.
- Knight, monstros e conjuradores usam o mesmo `MovementSystem`.
- Morte, fim de sala e reset cancelam movimentos, projéteis e hazards pendentes.
- Alcance corpo a corpo, de cura e magia é resolvido na grade.
- LoS usa supercover; projéteis possuem trajetória, `castId`, `sessionId` e
  `impactAt`, sem dano antes do impacto.
- Reachability precede o score, destinos falhos recebem cooldown e A→B→A
  injustificado é impedido.
- O aggro inicial limita formalmente a backline a dois atacantes.
- Waves, círculos e Challenge usam máscaras lógicas deduplicadas.
- Magias de monstros unem telegraph e impacto por `castId` e máscara idêntica.
- PixiJS apenas interpola e exibe eventos autoritativos.
- Obstáculos são visíveis; `?debug=1` mostra ocupação, reservas, caminhos e
  máscaras.
- `HuntResult` expõe métricas de pathfinding e recuperação.
- Helper individual permanece pausado e sua branch foi preservada.

Consulte `docs/GRID_COMBAT.md` para a especificação permanente.

### Correção final pontual — 07/08/2026

- Conjuradores deixam um tile sem LoS por meio de firing-position resolver
  determinístico e alcançável.
- Ausência de progresso possui tentativa de recuperação e encerramento
  explícito por stalemate; não existe mais sucesso implícito ao atingir o cap.
- `floor_complete` diferencia `victory`, `party_defeated`, `stalemate` e
  `turn_limit`.
- Movimentos pendentes revalidam terreno, ocupação e reserva antes do commit.
- Revisão da grade inclui mudanças do mapa e da ocupação.
- Métricas separam falhas gerais, sequência geral, sequência exclusivamente
  `no-route` e recuperações de firing position.

| Validação final | Resultado |
|---|---|
| TypeScript | zero erros |
| Vitest | 91 testes aprovados em 8 arquivos |
| Build | 739 módulos, aprovado |
| Playwright/Edge | 13 cenários aprovados em 4,9 min |
| Stress | 24 hunts; seeds 803–814; duas configurações |
| Seed 811 sem energy wave | vitória, 274 turnos, 71.100 ms, 2 recuperações |
| Integridade | zero deadlock, overlap, out-of-bounds, stale ou resíduo |
| Publicação/merge | não realizados |

### Evidência do MVP 1C — 06/08/2026

| Validação | Resultado |
|---|---|
| Instalação | lockfile aprovado |
| TypeScript | zero erros |
| Vitest | 79 testes aprovados em 7 arquivos |
| Build | 737 módulos, aprovado em 5,70 s |
| Playwright/Edge | 13 cenários aprovados em 4,2 min |
| Loop | 3 ciclos auditados |
| Grade | zero overlaps, zero fora da arena e zero reservas órfãs |
| Casts | zero impacto tardio e zero resíduos de projectile/telegraph |
| Debug manual | boss derrotado, 17 kills e zero erros de console |
| Publicação | não realizada |

## MVP 0 — concluído e reconciliado

O protótipo entrega uma hunt automática completa em PixiJS com três personagens,
três ondas, boss, timeline determinística, Analyzer e loop. O gate executado antes
do MVP 1A confirmou todas as alegações do encerramento anterior sem exigir nova
correção de manutenção.

### Funcional

- Estados explícitos: preparação, idle, execução, pausa, transição, boss,
  conclusão, derrota, reset e erro.
- Iniciar, pausar, continuar, reiniciar e repetir sem sessões paralelas.
- Pausa congela timeline, relógio e tweens.
- Velocidades 1×, 2× e 4× preservam a ordem dos eventos.
- Loop opcional, cancelável entre ciclos.
- Knight, Druid e Sorcerer com nove habilidades configuráveis.
- Aggro, AOE, reposicionamento, dano, cura, mana, crítico e dodge.
- Analyzer com XP, gold, loot, kills, bosses, dano por herói, dano recebido,
  cura e duração.
- Boss Tokens exibidos e persistidos em `localStorage` entre recarregamentos.
- Módulos futuros abrem aviso explícito e não alteram a sessão.
- Fallback controlado se canvas ou assets falharem.

### Validado novamente em 27/07/2026

| Validação | Resultado |
|---|---|
| Instalação pelo lockfile | aprovada |
| TypeScript | aprovado (tsc sem erros) |
| Vitest | 37 testes unitários aprovados |
| Playwright/Edge | 12 cenários end-to-end aprovados |
| Loop | 3 ciclos consecutivos |
| Resoluções | 1366×768, 1600×900 e 1920×1080 |
| Console | sem erros nos cenários |
| Recursos finais | 1 canvas, 3 heróis, boss único e 0 tweens pendentes |

## MVP 1A — concluído

- Arena permanece 960×576 em 30×18 tiles, mas ocupa uma proporção maior do shell.
- Escala de heróis, monstros e boss, offsets, durações, limites de câmera e
  feedbacks estão em `src/game/renderConfig.ts`.
- Formação, spawns, posições de combate e boss estão em
  `HUNT_LAYOUT_CONFIG`, dentro de `src/data/config.ts`.
- Frontline e backline têm posições distintas; o Knight avança primeiro pela
  timeline já existente.
- Estados visuais mínimos: `idle`, `moving`, `attacking`, `casting`, `healing`,
  `hurt` e `dead`.
- Ataque, projétil, magia de alvo, AOE, cura, crítico, dodge, dano, morte, boss
  e transição continuam sendo reproduções da timeline.
- Party selecionável. O Helper mostra nome, vocação e somente as três
  habilidades configuradas para o personagem selecionado.
- O clique também é emitido pelas entidades dos heróis no canvas PixiJS.
- Debug opcional por `?debug=1`; a publicação normal permanece com debug
  desligado.
- Diagnósticos garantem `data-out-of-bounds="0"` nas hunts testadas.

### Evidência do MVP 1A

| Validação | Resultado |
|---|---|
| Seleção/Helper | Knight, Druid e Sorcerer filtrados individualmente |
| Reinício | durante combate, boss e após conclusão |
| Loop | 3 ciclos consecutivos, sem duplicação |
| Resoluções | uma hunt completa em 1366×768, 1600×900 e 1920×1080 |
| Arena | nenhuma entidade fora dos limites |
| Console | sem erros nos cenários do Edge |

### Observações de validação técnica

- **CurrencyService** (`src/app/CurrencyService.ts`) é a fonte persistente de `bossToken` e mantém a lista de `rewardKeys` para idempotência.
- **Idempotência**: a chave usada é `sessionId + bossId + rewardType`, garantindo que a mesma recompensa não seja concedida duas vezes por ciclo/sessão.
- **Recompensa configurável**: cada chefe pode definir `bossTokenReward` (valor mínimo padrão = 1) em `src/data/config.ts`.
- **Persistência**: saldos sobrevivem a reloads e resets da UI; a UI consome `CurrencyService.getBossToken()` para exibir o saldo persistente.
- **Integração**: o fluxo inclui emissão de `boss_reward`, processamento por `CurrencyService`, atualização da barra superior, feedback visual (`.boss-token-feedback`), relatório de resultado e Hunt Analyzer.
- **Testes e build**: 37 testes unitários (Vitest), 12 testes E2E (Playwright), `pnpm run typecheck` e `pnpm run build` aprovados.

### Parcial ou demonstrativo

- Backpack: 20 slots vazios, contador coerente, sem itens reais.
- Loot Pouch: lista e ocupação por tipos de item; sem filtros/capacidade real.
- Supply Pouch, moedas, stamina e boosts: marcados como `DEMO`.
- Helper: seleção individual, ativação e prioridade; regras condicionais ficam
  no MVP 1B.
- Mapa: funcional e configurado, sem obstáculos sólidos/pathfinding avançado.

### Fora do MVP 0

Equipamentos, drag-and-drop, progressões, Bestiário definitivo, Daily, Arena,
Social, Guild, market, pagamentos, login, backend e multiplayer.

## Publicação

O mesmo projeto Sites deve ser preservado. Uma publicação só é considerada
válida após build, commit, versão implantada e smoke test público.

## Incremento tático — concluído em 27/07/2026

- Aggro inicial agora é espacial: proximidade decide e o Knight vence somente
  empates.
- O motor mantém threat por monstro e registra `target_change` com a causa da
  troca.
- Challenge usa `exeta res` após dois segundos lógicos, alcance real de sete
  tiles e forced target temporário, sem puxão físico ou alcance global.
- Monstros podem voltar à backline após o forced target e ser desafiados
  novamente.
- Druid e Sorcerer procuram posições seguras ao redor da box do Knight,
  priorizando cobertura de waves sem atravessar a box.
- `preferredMinTargets` é preferência; `hardMinTargets` é bloqueio real.
- Magias reservadas não são gastas antes do boss.
- O HUD possui cooldown circular e numeral derivados do mesmo relógio da hunt.
- PixiJS está separado em camadas de terreno, efeitos, entidades e overlay.
  Efeitos não alteram transformações das entidades e são destruídos após fade.

### Evidência

| Validação | Resultado |
|---|---|
| Vitest | 25 testes aprovados |
| Playwright/Edge | 6 cenários aprovados |
| Pausa do cooldown | valor lógico permanece idêntico durante a pausa |
| Velocidade | cooldown sincronizado em 1×, 2× e 4× |
| Boss | alcançado e derrotado |
| Loop | 3 ciclos sem duplicação |
| Limpeza final | 3 entidades, 0 efeitos e 0 tweens pendentes |
| Arena | 0 entidades fora dos limites |

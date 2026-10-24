# MVP 2B.1 — gameplay polish (retomada 10/10/2026)

Contrato posterior24/10 em TACTICAL_CONSOLIDATION.md/PLAYER_CONTROL.md:
treino Manual exclusivo + aliados AI no foco; Hunt mantém Assistido/Auto;
câmera15×11 e cancelamento de rota por nova intenção. ESC no mundo envia Stop.
O registro abaixo é histórico onde contradiz essas regras. Fórmulas/recompensas,
pipeline de projéteis e hashes Auto não foram regenerados para esta consolidação.

## Escopo e evidências

Polish de controles, assistência, apresentação e dois encontros, antes de
Adventure. Motor único TypeScript, Vite/PixiJS, DOM e persistência locais.
Inventário/equipamentos/forja não foram reimplementados. Fontes protegidas não
foram copiadas. Helper individual, networking, NPC/quest/campanha/PvP fora do escopo.

Auditoria da entrada: local/origin 7062c5d, código anterior 8e2a309. Pages servia
056a743. Push anterior falhou no timeout total do E2E mouse-first; PR passou,
deploy foi pulado. São versões diferentes; não usar a versão velha para
diagnosticar o build novo. Publicação final e gates no SESSION_CHECKPOINT.

## Entrada → binding → domínio → feedback

`actionBindings` fornece slot, tecla, ID e metadados de ícone. `actionSlots`
resolve a AbilityDefinition pelo ID, não pela ordem global/prioridade do Helper.
Não há slots fictícios: contrato Digit1–9, três habilidades reais por herói.

| Herói | Digit1 | Digit2 | Digit3 |
|---|---|---|---|
| Knight | Chamado do Ferro | Arco de Ferro | Ruptura |
| Druid | Laço Vital | Semente Errante | Jardim da Vigília |
| Sorcerer | Lança de Brasa | Frente Astral | Céu Partido |

Clique/hotkey chamam PlayerControls.cast; a UI explica disponibilidade e o
CombatEngine revalida a intenção serializável. Pressão repetida do SO não gera
casts repetidos. Resultado da fila é distinto de execução; mana/cooldown/alvo/
range/LoS e bloqueio recebem feedback. Configuração precede cast explícito;
cast aceito consome o orçamento daquele ator no tick antes da automação.
Cast rejeitado não cobra mana e não elimina ações válidas da automação.
Cast explícito é permitido nos três modos e não muda o modo do ator; em Auto
substitui somente sua ação automática naquele tick. Companheiros permanecem
inalterados. Apenas movimento/Stop explícito em Auto assume Manual.

Cura default self, mesmo com inimigo selecionado. Shift+tecla/clique arma escolha
explícita de aliado. Ofensiva exige alvo escolhido; sem ele, escolhe-alvo fica
visível. Primeiro ESC só cancela esse estado; ESC seguinte Stop. Seleção não
transfere controle. Modo não recria sessão nem altera companheiros. Botões HUD
não capturam gameplay inadvertidamente; campos/selects, dialogs e drawers sim.
Fechar inventário/análise retorna foco ao canvas; Ctrl/Alt/Meta não são roubados.

## Movimento físico

```text
Numpad7 ↖   Numpad8 ↑      Numpad9 ↗
Numpad4 ←   Numpad5 Stop   Numpad6 →
Numpad1 ↙   Numpad2 ↓      Numpad3 ↘
```

Usa KeyboardEvent.code, não key. Fileira superior conjura, Numpad move; WASD e
setas continuam. Uma amostra por decisão lógica de 250 ms, buffer de um tap,
coalescência de comandos de movimento por ator. Hold não acumula fila infinita.
Quinas, parede, ocupação, reserva e revalidação são do MovementSystem.
Stop cancela ordens futuras, não desfaz um passo já comprometido.

Auto → movimento explícito assume Manual no selecionado. Assistido → movimento
mantém Assistido e booleans; rotação suspensa durante passo/destino do jogador.
Não há perseguição/reposition automático no Assistido. Follow explícito é uma
ordem visível legada; novo movimento a substitui, nunca surge de automação.

No Auto, o Druid procura uma posição alcançável e segura para curar um aliado
ferido quando a linha de visão impede a cura. Usa o resolver existente e o
MovementSystem, com ocupação/reservas e revalidação normais. Essa prioridade
corrige a morte do Sorcerer no terceiro loop de progressão: havia mana, mas o
caster mantinha ofensiva com a linha de cura bloqueada. Assistido não entra
nesse reposicionamento; o jogador continua dono do movimento. Três ciclos
progressivos são verificados sem enfraquecer a exigência de três heróis vivos.

Edge E2E usa protocolo de input físico Numpad com key numérico e key de navegação
(Home/End/PageUp/PageDown/setas), em origem configurada livre, com reinício para
cada direção. Colisão permanece ativa. Esse teste prova code/key, não a luz
NumLock física: confirmação com teclado real permanece pendente neste ambiente.

## Assistido por herói

| Auto Attack | Auto Magias | Sem ações explícitas, após engage válido |
|---|---|---|
| OFF | OFF | Aguarda |
| ON | OFF | Somente ataques básicos válidos |
| OFF | ON | Somente habilidades configuradas/válidas |
| ON | ON | Habilidades prioritárias; básico se nenhuma disponível |

Antes de engage, todas as combinações aguardam. Ataque direito seleciona um
inimigo explícito. Morte/invalidação limpa ordem; não adquire substituto. Auto
Magias respeita Helper, mana, cooldown individual/grupo, range/LoS, geometria,
preferred/hardMinTargets e reserva para boss. Não caminha para liberar magia.
Druid cura aliado mais ferido abaixo de 58% quando engajado e a cura é válida;
Knight usa Challenge em range, sem busca de posição. Fora disso usa ofensiva
válida contra o alvo explícito; AoE pode atingir outros dentro da máscara real.

Toggles independentes por herói, aria-pressed ON/OFF e tooltip, aplicados por
PlayerCommand.assistance validado. `tactical-hunt-assistance-v1` restaura somente
booleans; defaults ON/ON. Não restaura modo, alvo/ordem, sessão, nem inicia combate.
Falha de storage mantém preferência em memória com aviso, sem tocar outros saves.
Desligar categoria impede novas ações; projéteis/perigos lançados resolvem/cancelam
pelo lifecycle normal. Manual e companheiros não são convertidos em Auto.

## Trajetória e prazos

Em produção `polishedRules=true` (7º parâmetro do motor): projéteis diretos usam
original-tile. O domínio emite origem de mão/arma e ponto de impacto autorizado
(`visualOrigin`, `visualImpact`), além de origem/destino lógicos, pathTiles,
castId/sessionId/startedAt/impactAt. Supercover/LoS continuam autoridade de
colisão. Revalida LoS no impacto; morte/reset/bloqueio/alvo que mudou de tile
cancela sem dano. Não há homing nem destino futuro consultado pelo renderer.

Apresentação interpola um segmento contínuo entre endpoints; inclinação 5×2
não percorre centros de cada tile. Rotação usa esse vetor, impacto usa o ponto
autorizado, não posição atual do alvo. Movimento das entidades não foi trocado.

Scheduler resolve completesAt/impactAt/detonateAt em ordem antes da decisão
seguinte (250 ms). Deadlines intermediários não amostram input nem geram novas
ações. Batch e frames 73/1000 produzem HuntResult e timeline completos idênticos.
Legacy default preserva hashes/fixtures anteriores, inclusive política histórica
follow-target; a aplicação usa o ruleset novo. É compatibilidade de teste/dados,
não um segundo motor. Nunca regenerar snapshots para mascarar falhas.

## HUD e arte

Party DOM screen-space numa coluna estável à esquerda, não acompanha câmera nem
cobre spawn/boss. Nome/vocação/Lv/modo, seleção e barras úteis de HP/mana juntos.
HP verde/amarelo ≤60%/vermelho ≤30%; MP azul. Slots reais de largura fixa, ícone
individual, tecla, custo, estado/rejeição e accepted flash. Tooltip concentra
nome/targeting/detalhes; cooldown circular individual/grupo vem do relógio lógico.
Passiva conserva descrição e unlock. CSS removeu o overlay world-first e regras
concorrentes com !important; breakpoints compactos preservam viewport dominante.

Nove SVG originais 48×48, por ID, gerados no pipeline existente. IDs do Druid
strong_ice_wave/eternal_winter continuam chaves de save, mas identidade visual
atual é natureza. Dez atores originais no manifesto; heróis anteriores preservados.
Arte nova é blockout funcional, não pixel art final.

## Encontros e recompensa

| Reforço | Comportamento / counterplay | Configuração inicial |
|---|---|---|
| Bastião de Bronze | escudo largo; faixa frontal de três tiles comprometida; saia da faixa na preparação, ataque na recuperação | HP 240, ataque 24, aviso 1000 ms, recuperação 1000 ms, CD 4500 ms |
| Balista Errante | supercover até alvo em até sete tiles; aviso com direção fixa; esquive lateralmente ou aproxime-se na recuperação | HP 180, ataque 24, aviso 1400 ms, recuperação 1000 ms, CD 4900 ms |

Primeiro andar: 4 originais + Bastião. Segundo: 4 originais + Balista.
Terceiro/boss sem densidade adicional; roster 5/5/6/3, máximo seis criaturas.
Configuração de ataque em encounters, posições/roster em config; preserva
circulação/ocupação/reservas. Quatro papéis e boss existentes não reimplementados.

Reforços têm `rewardSuppressed`: contam kills (19 total), mas não XP/gold/loot,
trophies nem rolagens de equipment RNG. Budget preservado: 16×160 + 1200 boss +
4×120 floor = 4240 XP em progressão; 17 eventos de XP de mortes e quatro de andar.
Gold/drop pode diferir com duração/ordem da hunt nova; não há promessa de gold
idêntico entre rulesets, mas nenhum drop/recibo/ID existente mudou. Testes
separados evitam inflação automática e regeneração cega de baselines.

## QA, debug e limites

Gates finais e medições em SESSION_CHECKPOINT. Cobertura nova de bindings,
NumPad, combinações de assistência, ausência de movimento/retarget ocultos,
persistência, prioridade/charge/cooldown, geometria/lifecycle e encontros.
Regressões existentes de boss/equipamento/reserva/loops preservadas.
Fixture E2E antigo de corner movement explicitamente usa roster antigo para
não confundir reforço ocupando tile com falha de controle; asserts iguais.
Vitest fileParallelism false evita competição de simulações CPU-bound Windows:
nenhum timeout/assertion foi ampliado. Playwright serializado com um worker.

`?debug=1` habilita painel técnico de herói/binding/intenção/resultado/options/
latência e overlays de sync/segmento visual/supercover. Dados técnicos existentes
ficam em data-* do #game/#player-controls, sem HUD técnica no modo normal.
syncPresentation medido não é FPS/update completo nem comparação controlada.
`node scripts/qa-preview.mjs <URL> <SHA-ou-vazio> <rótulo>` executa smoke real
1x→4x num contexto Edge isolado, valida manifest (se SHA informado), vitória,
recompensas/lifecycle, captura imagens em test-results (fora do bundle) e mede
custo de execução dos callbacks rAF por velocidade. Inclui update/render/UI,
não período do frame nem FPS; instrumentação só nesse contexto de QA.
Necessários playtest físico NumLock e aprovação humana de arte/balanceamento.
Não iniciar Adventure até gates/deploy e revisão da jogabilidade concluídos.

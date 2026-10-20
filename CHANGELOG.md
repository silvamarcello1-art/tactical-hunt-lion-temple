## 2026-10-19 — treino 2B.3

- Confirmação do gesto de empurrar: botão esquerdo segurado e soltura num vizinho
  livre, não7tiles de distância. Preview dos destinos vem do domínio; tecla8
  continua alternativa. Holding não move/teleporta a criatura.

- SD/Destroy Field reais no domínio de treino, grupos/cargas e projétil existente.
- Push atrasado/revalidado por MovementSystem, hotkey8 e drag; Stop9. Digit1–3
  magias,4–7 runas, Numpad movimento; sem slots fictícios ou controle de zoom.
- Pixel art original maior para três heróis; mira do tile não seleciona hitbox
  do sprite por engano. IDs/saves/footprint/cenário normal preservados.
- Nove magias no perfil de referência, Heal Friend ally-only, grupos secundários
  e Mana Buffer de treino. Não é Wheel completa/PvP online. TRAINING_2B3.md.
- Resultados de gates/preview somente no checkpoint após execução/verificação.

## 2026-10-10 — retomada MVP 2B.1

- Código d51361c: CI push/PR e deploy Pages aprovados; manifest público no SHA
  exato e smoke até boss verificados. 216 unitários/33 E2E; zero erros/resíduos
  no smoke público. Fechamento documental separado não altera runtime servido.

- Auto Druid busca linha de cura segura pelo MovementSystem quando um aliado
  ferido está sem LoS; Assistido mantém movimento do jogador. Corrigida a causa
  da derrota do Sorcerer no terceiro loop progressivo, mantendo o assert original.
- E2E exercita as quatro combinações de assistência após engage, parada após
  morte do alvo e novo engage explícito. Gates finais registrados no checkpoint.

## 2026-10-05 — MVP 2B.1

- Bindings data-driven Digit1–3 por herói, foco do gameplay, self-heal/targeting/ESC.
- Numpad físico em oito direções, buffer limitado e Stop; Assistido mantém modo.
- Auto Attack/Auto Magias independentes por herói, domínio validado/persistência sem ordens.
- Cast explícito precede automação no mesmo orçamento; cooldown individual/grupo lógico.
- Projéteis contínuos com endpoints autorizados e original-tile, sem homing/escada.
- Deadlines lógicos entre decisões: completesAt/impactAt exatos, input só uma vez por tick.
- Party fora da arena; HP/mana úteis, três ícones originais por vocação e passivas visíveis.
- Bastião de Bronze e Balista Errante em duas composições; reforços sem inflação de loot/XP.
- Debug opt-in e testes de geometria/assistência/numpad/roster/lifecycle; regressões preservadas.
- Vitest serializa arquivos CPU-bound sem aumentar timeouts ou afrouxar assertions.
- Inventário, forja, IDs/recibos/RNG e troca de equipamento da reserva intactos.
- Gates e publicação efetivamente verificados são registrados em SESSION_CHECKPOINT.

## 2026-10-01 — MVP 2B (em validação)

- Inventário persistente, drops determinísticos, comparação e equipamento por vocação.
- Forja +1 atômica; overflow em reserva; proteção contra replay e save inválido.
- Equipar diretamente da reserva com mochila cheia preserva o item substituído;
  falha ao salvar desfaz toda a troca, sem perda ou duplicação.
- Drawer com bloqueio de input do mundo; relatório de drops reais e feedback compacto de Loop.
- Roadmap atual 2B–2F; histórico anterior preservado e identificado.

## 2026-09-30 — Preview público validado

- GitHub Pages publicou `056a743` com artifact aprovado (167 unitários, 24 E2E).
- Allowlist ampliada somente para a branch autorizada, preservando proteções.
- Manifest e hunt pública até vitória verificados; sem merge ou alteração de Sites.

## 2026-09-26 — Mouse-first combat, compact HUD and encounter depth

- MoveTo autoritativo, engage por botão direito e Look por chord consumido.
- AUTO independente da seleção; MANUAL explícito; ASSISTED condicionado ao alvo.
- Três habilidades originais por herói, HUD mínimo e cooldown no relógio lógico.
- Quatro papéis inimigos, orientação determinística e reposicionamento limitado.
- Boss com fase desperta e escombros temporários reais com revalidação da grade.
- Telegraph reservado a perigo especial; magias e projéteis originais em pools.
- Progressão local existente preservada; oito atores originais e cenário legível.
- Distribuição exclui assets de referência legados sem remover arquivos-fonte.
- Novo ruleset documenta mudança intencional do baseline e mantém repetibilidade.
- E2E de fronteiras transitórias usa relógio controlado (frames reais) para não
  disputar com o timer de loop/boss no runner; CI preserva traces em falhas.
- Traces sem filmstrip contínuo de WebGL; snapshots e PNG de falha mantidos.
  CI tem orçamento total de cenário ajustado, sem ampliar limites de assertions.
- Teste de hotbar amostra o footpoint visual com relógio controlado para não
  clicar um tile abandonado pelo monstro entre chamadas do protocolo.
- Validação do PR e publicação Pages usam filas separadas; PR não cancela mais
  um push pendente. Deploys continuam serializados e condicionados aos gates.
- Os três cenários de loops compartilham orçamento total explícito, mantendo
  limites individuais e auditorias de integridade inalterados.

## 2026-09-20 — original visual foundation

- Sessão composta em main.ts; PlayerControlPort desacopla input de Pixi.
- SpriteDefinition/AnimationSet consumidos por manifesto: seis atores originais,
  quatro facings, seis ações, quatro pisos; conceito raster separado dos blockouts.
- Footpoint/sombras/seleção/labels e legibilidade de efeitos ajustados; frames
  dos efeitos e projéteis seguem pausa/velocidade lógica.
- Health tolera branch sem upstream; workflow valida feature e publica Pages
  com identificação do commit, sem merge nem alteração do site estável.
- Direção de arte, pipeline e roadmap 1E–1I documentados.

# Changelog

## 0.5.0 — 2026-09-19

### MVP 1D — Manual Player Control Foundation

- Converte o mesmo motor para execução incremental sem alterar os 24 resultados
  e timelines Auto do baseline `ed23459`, agora protegidos por hashes de teste.
- Adiciona comandos serializáveis e ownership AI/Manual/Assistido por ator.
- Integra WASD/setas, diagonais, seleção, ataque/follow/stop, casts e Look
  contextual; mantém movimento, dano, cooldowns e máscaras no domínio existente.
- Reutiliza apresentação estabilizada e adiciona marcador de alvo no footpoint.
- Limpa input/targeting em perda de foco, pausa, morte, transição e reset/loop.
- Prepara transformação de câmera, use-with e drag/drop com rejeição explícita
  de itens/interações indisponíveis, sem inventário fictício.
- Typecheck e build aprovados; 145 unitários, 19 E2E, baseline de 24 hunts e
  stress de 24 hunts mistas aprovados. Três loops e três resoluções preservados.
- Helper, backend, merge e publicação permanecem fora desta entrega.

## 0.4.1 — 2026-09-19

- Adiciona protocolo permanente de pre-flight e post-flight ao `AGENTS.md`.
- Adiciona `pnpm health` para diagnóstico Git completo no Windows.
- Explicita `attack_recovery` e `dodging` na máquina visual.
- Expande debug de sync e mede custo médio/máximo da apresentação.
- Gate: 124 testes unitários, build de 741 módulos e 15 E2E aprovados.

## 0.4.0 — 2026-08-07

### MVP 1D — Combat Presentation & Visual Fidelity

- Adiciona `CombatPresentationSystem` para separar estado visual da lógica.
- Reproduz movimento tile a tile, facing e estados pelo relógio autoritativo.
- Projectiles percorrem `pathTiles`; waves e telegraphs usam máscaras lógicas.
- Melhora melee, impactos, Challenge, damage, critical, heal, dodge e morte.
- Separa terrain, telegraphs, shadows, entities, effects, projectiles, unit UI e
  overlay para preservar legibilidade.
- Adiciona footpoint, y-sort determinístico, sombras e stacking de feedback.
- Reutiliza floating texts, projectiles, telegraphs e impactos por pooling.
- Expande debug com comparação entre tile lógico e footpoint visual.
- Prepara sprite sheets próprios por meio de `AnimationSet`.
- Adiciona 30 testes unitários e 2 E2E específicos da apresentação.
- Gate: 121 testes unitários, build de 741 módulos e 15 E2E aprovados.
- Hunts manuais completas em 1x, 2x e 4x; três loops sem resíduos.
- Sync máximo 0 px, masks 0, overlaps 0, resíduos 0 e console limpo.

Helper, motor do MVP 1C, inventário, equipamentos, merge e publicação não foram
alterados.

## 0.3.2 — 2026-08-07

### Correção final pontual do MVP 1C

- Recupera conjuradores presos em alcance sem linha de visão por meio de um
  firing-position resolver determinístico e alcançável.
- Detecta ausência de progresso, tenta recuperação e encerra stalemates de forma
  explícita.
- Corrige `floor_complete` para nunca registrar vitória com inimigos vivos.
- Revalida movimentos pendentes antes de transformar reserva em ocupação.
- Inclui mudanças de terreno na revisão da grade.
- Separa falhas gerais de movimento, sequências gerais, sequências `no-route` e
  recuperações de firing position.
- Adiciona regressões determinísticas para LoS, seed 811, conclusão de andar,
  revisão da grade, ocupação concorrente e semântica das métricas.
- Gate: 91 testes unitários, build, 13 E2E e 24 hunts de stress aprovados.

Helper, inventário, equipamentos, progressões, merge e publicação não foram
alterados.

## 0.3.1 — 2026-08-06

### Hardening do MVP 1C

- Movimento passou a duas fases, mantendo origem ocupada e destino reservado
  por 220 ms lógicos até `completesAt`.
- Intenções concorrentes recebem arbitragem estável; morte, fim de sala e reset
  cancelam movimentos sem reservas órfãs.
- Todos os ataques ranged usam `ProjectileSystem`, com trajetória, `castId`,
  `sessionId`, `impactAt`, políticas próprias e dano atrasado.
- Hazards, telegraphs e projectiles possuem resolução ou cancelamento explícito,
  sem dano ou efeitos de sessões antigas.
- Reachability precede score; destination cooldown, histórico de tiles,
  anti-oscilação e stuck recovery evitam repetição sem rota.
- LoS foi substituída por supercover com tratamento de quinas e endpoints.
- Aggro inicial aplica cap determinístico de dois atacantes na backline, sem
  limitar mudanças posteriores por threat ou Challenge.
- Telemetria e auditoria E2E cobrem reservas, projectiles, lifecycle, resíduos,
  cap da backline e três loops.
- Gate atualizado para 79 testes unitários e 13 cenários Playwright; merge e
  publicação não foram realizados.

## 0.3.0 — 2026-08-06

### MVP 1C — Authoritative Grid Combat

- Posições autoritativas migradas para `tileX`/`tileY` inteiros.
- Adicionados `GridMap`, `OccupancyGrid`, A*, `MovementSystem`, LoS e
  `SpellAreaResolver` em módulos sem dependência de PixiJS.
- Ocupação, reservas, spawn conflitante, morte, footprints, obstáculos e
  diagonais sem corte de quina passaram a ter regras determinísticas.
- Knight, casters e monstros preservam aggro, Challenge, threat,
  reposicionamento, waves e fallbacks sobre a nova grade.
- Projectiles e magias usam trajetória, máscara, LoS, `castId`, telegraph e
  impacto lógicos.
- PixiRenderer ganhou obstáculos, diagnóstico de overlap e debug opt-in para
  caminhos, ocupação, reservas e spell masks.
- Suítes unitária e E2E ampliadas para auditar overlaps, obstáculos, caminhos e
  telegraphs durante três loops.
- Helper individual permaneceu pausado e intocado; nenhuma publicação foi feita.
- Gate final: 55 testes Vitest, build completo e 12 cenários Playwright
  aprovados; inspeção manual com debug concluiu sem overlap ou erro de console.

## 0.2.1 — 2026-07-27

### Boss Token — Conclusão

- `CurrencyService` consolidado como fonte persistente de `bossToken` com
  idempotência garantida por `sessionId + bossId + rewardType`.
- Recompensa por chefe configurável via `bossTokenReward` (padrão = 1).
- Persistência entre reloads e resets; múltiplos bosses e loops legítimos suportados;
  duplicação de recompensa evitada no mesmo `sessionId+bossId+rewardType`.
- Integração com barra superior, notificação visual, relatório de resultado e
  Hunt Analyzer.
- Validação: `pnpm run typecheck` aprovado; `pnpm exec vitest run` — 37 testes unitários aprovados; `pnpm run build` aprovado; Playwright E2E — 12 testes aprovados, exit code 0.

### Observações

- Não foram feitas alterações no código relacionado ao Helper nesta entrega.
- Documentação atualizada em `docs/CURRENT_STATE.md`, `docs/SESSION_CHECKPOINT.md` e `docs/NEXT_TASK.md`.

## 0.2.0 — 2026-07-27

### MVP 1A — fidelidade da área da hunt

- MVP 0 reconciliado sem regressões antes do início da fase visual.
- Arena central ampliada e shell compactado nas três resoluções-alvo.
- Escalas, durações, offsets, limites, posições da party, spawns e boss
  centralizados em configuração.
- Party mantém frontline e backline legíveis; entidades ganharam estados
  visuais mínimos de movimento, ataque, magia, cura, dano e morte.
- Mapa provisório recebeu zonas de combate originais sem novos assets externos.
- Personagem selecionado abre o Helper filtrado para sua vocação.
- Seleção funciona pela Party e diretamente nas entidades PixiJS.
- Debug opt-in por `?debug=1` exibe limites, pontos, IDs, estados e hitboxes.
- Diagnósticos verificam unidades fora da arena e estados visuais.
- Suíte ampliada para 22 testes unitários e 6 fluxos no Edge.

## 0.1.1 — 2026-07-27

### Encerramento do MVP 0

- Máquina de estados ampliada com transição, boss, derrota e reset.
- Pausa passa a congelar também os tweens do PixiJS.
- Analyzer inclui boss e dano recebido.
- Contadores de Backpack/Loot Pouch tornados coerentes.
- Valores fixos do shell marcados como demonstração.
- Módulos futuros usam mensagem explícita de próximo MVP.
- Testes unitários ampliados de 16 para 20.
- Smoke test ampliado para pausa visual, boss único, métricas e mocks.
- Linha de base verificável criada em `docs/MVP0_BASELINE.md`.

## 0.1.0 — 2026-07-27

### Estabilizado

- Estado explícito de sessão: carregando, pronto, rodando, pausado, concluído e
  erro.
- Reinício protegido contra concorrência.
- Velocidade preservada entre reinícios e ciclos.
- Loop cancelável sem iniciar um ciclo residual.
- Descarte de ticker, player, tweens, unidades e canvas.
- Remoção de unidades mortas e métricas seguras contra valores inválidos.
- Fallback controlado de carregamento.

### Interface

- Módulos futuros agora exibem o MVP correspondente.
- Helper abre a configuração de habilidades.
- Abas Geral, Combate e Loot dão retorno visível.
- Painéis recolhíveis e Supply Pouch respondem.
- Favicon próprio incluído.

### Qualidade

- `LiveHuntState` e constantes visuais extraídos.
- 16 testes unitários.
- 4 cenários Playwright cobrindo controles, três loops e resoluções.
- Documentação canônica consolidada em `docs/`.
## 2026-10-19 — MVP 2B.2: treino tático local

- Cenário Party × Bot selecionável, no mesmo motor; Manual inicial, kit gratuito,
  sem progressão/loot/saldo/forja ou Loop automático.
- Magic Wall/Fire Field por 4/5 + clique: range/LoS, cargas e exhaust de domínio;
  parede reativa, burning não cumulativo, expiração e cleanup no relógio lógico.
- Quinas/footprint revalidados em movimento comprometido no treino; inversão
  rápida por tecla mais recente sem filas. Hunts/baselines anteriores preservados.
- Efeitos próprios, testes e roteiro de fidelidade incremental em TACTICAL_RUNES.
  Não é PvP online nem conversão completa de magias/passivas/Wheel do Tibia.
- LoS percorre supercover sem materializar caminhos descartados, interrompendo
  no primeiro bloqueio; verificações dinâmicas e hashes de combate preservados.
- README com controles do treino e smoke real-clock reutilizável em
  scripts/qa-training.mjs (funciona também no base path do GitHub Pages).
- Fechamento: 231 unitários/36 E2E, CI push/PR e deploy aprovados. Runtime
  88d3fc6 verificado no Pages; smoke público passou três treinos isolados e
  hunt normal até o boss, sem erros de console ou resíduos de lifecycle.

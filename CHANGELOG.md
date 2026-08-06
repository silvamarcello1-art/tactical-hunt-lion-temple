# Changelog

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

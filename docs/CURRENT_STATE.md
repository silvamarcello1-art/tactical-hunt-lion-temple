# Estado atual — MVP 0 até MVP 1D

## MVP 1D — Combat Presentation & Visual Fidelity

- `CombatPresentationSystem` separa estado visual temporário do motor lógico.
- Movimento usa `movement_started/completed/cancelled`, durações lógicas e
  termina exatamente no centro do tile, sem drift.
- Facing cardinal acompanha movimento, alvo, cast e ataque.
- Estados visuais cobrem windup, ataque, cast, reação, cura, morte e idle.
- Melee possui lean, trace, impact e recovery sem invadir outro tile.
- Projectiles percorrem exatamente `pathTiles` entre `startedAt` e `impactAt`.
- Waves e telegraphs usam somente as máscaras lógicas emitidas pelo MVP 1C.
- Damage, critical, heal e dodge possuem feedback distinto e stacking.
- Footpoint, sombras e y-sort determinístico mantêm box, frontline e backline
  legíveis.
- Nomes, HP e mana ficam em uma camada acima dos efeitos.
- Pause, 1x, 2x e 4x usam o mesmo relógio lógico.
- Pools reutilizam floating texts, projectiles, telegraphs e impactos simples.
- Debug compara tile lógico, footpoint visual, facing, estado e máscaras.
- `AnimationSet` prepara a troca futura por sprite sheets próprios.
- Helper individual permaneceu pausado; motor, inventário, equipamentos,
  backend, merge e publicação não foram alterados.

Consulte `docs/COMBAT_PRESENTATION.md` para a especificação permanente.

### Evidência do MVP 1D — 07/08/2026

| Validação | Resultado |
|---|---|
| TypeScript | zero erros |
| Vitest | 121 testes em 9 arquivos |
| Apresentação isolada | 30 casos aprovados |
| Build | 741 módulos, aprovado |
| Playwright/Edge | 15 cenários aprovados em 4,7 min no gate final |
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

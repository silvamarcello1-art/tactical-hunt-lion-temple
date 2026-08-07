# Session Checkpoint — hardening do MVP 1C

## Identificação

- Data: 06/08/2026
- Base do PR: `origin/feature/boss-token`
- Branch: `feature/grid-combat-pathfinding`
- HEAD inicial revisado: `6b6c029d699354afd5d717c5154f046aafe4f841`
- Remoto: `origin`
- Publicação e merge: não realizados
- Helper individual: pausado e intocado

## Concluído

- Movimento autoritativo em duas fases com reserva real de 220 ms lógicos.
- Origem ocupada e destino reservado durante a transição.
- Arbitragem determinística de intenções concorrentes.
- Cancelamento por morte, fim de sala, reset e sessão antiga.
- Pipeline única para projéteis ranged de heróis, monstros e boss.
- Dano somente em `impactAt`, correlacionado por `castId`.
- Lifecycle explícito de projéteis, telegraphs e hazards.
- Reachability antes do score, cache curto e destination cooldown.
- Bloqueio de A→B→A injustificado e stuck recovery.
- LoS supercover com quinas, pinça, endpoint e unidades configuráveis.
- Cap determinístico de dois atacantes iniciais na backline.
- Renderer PixiJS permanece apresentação; trajetórias visuais são retas entre a
  origem e o destino autoritativos.
- Telemetria ampliada no `HuntResult` e em atributos de diagnóstico.

## Validação registrada

- Baseline: typecheck aprovado, 55 testes Vitest, build com 735 módulos.
- Hardening: 79 testes Vitest em 7 arquivos.
- Build: 737 módulos transformados em 5,70 s.
- Playwright/Edge: 13 cenários aprovados em 4,2 min.
- Navegador local `?debug=1`: boss derrotado, 17 kills, 3.760 XP, 1.497 gold,
  duração lógica de 60.100 ms, zero overlap, zero fora da arena, zero reserva,
  projectile, telegraph, tween ou efeito residual e zero erros no console.
- Simulação prolongada: três ciclos determinísticos, 180.300 ms lógicos no
  total, sem duplicação ou resíduo.

### Métricas antes e depois

| Métrica | Revisão anterior | Hardening |
|---|---:|---:|
| Path recalculations | 342 | 206 |
| Blocked moves | 129 | 5 |
| Maior sequência no-route | 39 | 1 |
| A→B→A injustificado observado | 6 | 0 |
| Oscilações impedidas | não registrado | 5 |
| Destination cooldowns | não registrado | 5 |
| Stuck recoveries | não registrado | 0 |
| Reservation conflicts | não registrado | 0 |
| Pending movements máximos | não registrado | 9 |
| Pending projectiles máximos | não registrado | 4 |

## Commits do hardening

- `c1b9fd6` — `fix: make grid movement reservations authoritative`
- `e013c4d` — `fix: make projectiles and hazards authoritative`
- `94999fc` — `fix: prevent unreachable destination loops`
- `3ac2db0` — `fix: harden line of sight and initial backline aggro`
- `2d47c2d` — `test: cover grid combat hardening cases`

## Estado do gate

Typecheck, 79 testes, build, 13 E2E, simulação prolongada, inspeção visual e
`git diff --check` foram aprovados. A branch está pronta para nova revisão do PR;
não houve merge nem publicação.

## Fora do escopo

Helper, inventário, equipamentos, loja, backend, progressão, arte definitiva,
merge e publicação.

## Correção final pontual — 07/08/2026

- HEAD inicial: `dd927821c07da0b4b09ce6f8a68fac9fbdb92fde`.
- Branch e base preservadas: `feature/grid-combat-pathfinding` contra
  `origin/feature/boss-token`.
- Adicionado resolver puro de firing position para alcance sem LoS, integrado
  à recuperação de ausência de progresso.
- Adicionado encerramento explícito `victory | party_defeated | stalemate |
  turn_limit`; `floor_complete.victory` não é mais inferido pelo fim do loop.
- Movimento pendente é revalidado no instante do commit; mudança relevante de
  mapa/ocupação invalida o destino sem deslocar a entidade.
- `consecutiveNoRoute` mede somente `no-route`; falhas gerais e recuperações de
  disparo possuem métricas próprias.

### Gates finais

- TypeScript: aprovado.
- Vitest: 91/91 em 8 arquivos.
- Build: aprovado, 739 módulos.
- Playwright/Edge: 13/13 em 4,9 min.
- Stress: 24/24 hunts, seeds 803–814, configuração padrão e energy wave
  desativada.
- Seed 811 sem `energy_wave`: vitória, 274 turnos, 71.100 ms lógicos, duas
  recuperações de firing position.
- Integridade: zero deadlock, vitória falsa, overlap, out-of-bounds, reserva
  órfã, movimento stale, projétil stale ou erro de console.
- Helper, inventário, equipamentos, progressões, merge e publicação continuam
  fora do escopo.

# Estado atual

## MVP 0 — vertical slice estabilizada

O protótipo entrega uma hunt automática completa em PixiJS com três personagens,
três ondas, boss, timeline determinística, Analyzer e loop.

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
- Módulos futuros abrem aviso explícito e não alteram a sessão.
- Fallback controlado se canvas ou assets falharem.

### Validado em 27/07/2026

| Validação | Resultado |
|---|---|
| Instalação pelo lockfile | aprovada |
| TypeScript | aprovado |
| Vitest | 20 testes aprovados |
| Playwright/Edge | 4 cenários aprovados |
| Loop | 3 ciclos consecutivos |
| Resoluções | 1366×768, 1600×900 e 1920×1080 |
| Console | sem erros nos cenários |
| Recursos finais | 1 canvas, 3 heróis, boss único e 0 tweens pendentes |

### Parcial ou demonstrativo

- Backpack: 20 slots vazios, contador coerente, sem itens reais.
- Loot Pouch: lista e ocupação por tipos de item; sem filtros/capacidade real.
- Supply Pouch, moedas, stamina e boosts: marcados como `DEMO`.
- Helper: ativação e prioridade; regras condicionais ficam no MVP 1.
- Mapa: funcional, sem obstáculos sólidos/pathfinding.

### Fora do MVP 0

Equipamentos, drag-and-drop, progressões, Bestiário definitivo, Daily, Arena,
Social, Guild, market, pagamentos, login, backend e multiplayer.

## Publicação

O mesmo projeto Sites deve ser preservado. Uma publicação só é considerada
válida após build, commit, versão implantada e smoke test público.

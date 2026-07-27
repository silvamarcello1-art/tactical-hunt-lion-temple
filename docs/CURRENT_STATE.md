# Estado atual

## Baseline fechado — MVP 0

O protótipo entrega uma hunt automática completa em PixiJS com três personagens,
três ondas, boss, timeline determinística, Analyzer e loop.

### Funcional

- Iniciar, pausar, continuar, reiniciar e repetir.
- Velocidades 1×, 2× e 4× preservadas entre reinícios e loops.
- Loop opcional, cancelável inclusive durante a espera entre ciclos.
- Knight, Druid e Sorcerer com nove habilidades configuráveis.
- Aggro, AOE, reposicionamento, dano, cura, mana, crítico e dodge.
- HP em verde/amarelo/vermelho e mana azul.
- XP, gold, loot, kills, cura e dano no Analyzer.
- Modais do Helper e avisos explícitos para módulos de MVPs futuros.
- Abas centrais e painéis recolhíveis com resposta visível.
- Fallback controlado se o canvas ou os assets não carregarem.

### Validação em 27/07/2026

| Validação | Resultado |
|---|---|
| TypeScript | aprovado |
| Vitest | 16 testes aprovados |
| Playwright/Edge | 4 cenários aprovados |
| Loop | 3 ciclos consecutivos aprovados |
| Resoluções | 1366×768, 1600×900 e 1920×1080 aprovadas |
| Console | sem erros nos cenários automatizados |
| Canvas | uma instância após reinício e loops |
| Build de produção | aprovado |

### Parcial ou demonstrativo

- Backpack possui slots, mas não possui itens reais.
- Loot Pouch apenas apresenta a recompensa.
- Supply Pouch e dados de conta são estáticos.
- Helper permite ativação e prioridade, mas ainda não possui regras completas.
- Mapa é visualmente funcional, sem obstáculos sólidos.

### Fora do MVP 0

Inventário, equipamentos, drag-and-drop, progressões, Bestiário, Daily,
Armazém, Arena, Social, Guild, market, pagamentos, login, backend e multiplayer.

## Referência pública

O projeto utiliza `.openai/hosting.json` e deve continuar sendo publicado no
mesmo projeto Sites. O estado publicado só é considerado atualizado após o
commit exato ser enviado, salvo como versão e implantado.

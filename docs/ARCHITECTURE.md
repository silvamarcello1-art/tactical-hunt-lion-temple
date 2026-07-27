# Arquitetura canônica

Atualizada em 27 de julho de 2026 após o fechamento do MVP 0.

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript estrito |
| Desenvolvimento e build | Vite 6 |
| Renderer 2D | PixiJS 8 |
| Interface | HTML, CSS e DOM imperativo |
| Testes unitários | Vitest |
| Testes de navegador | Playwright com Edge |
| Persistência | `localStorage` apenas para preferências de habilidades |
| Backend | Nenhum |
| Hospedagem | OpenAI Sites |

## Fluxo obrigatório

```text
dados e preferências
        ↓
CombatEngine.run()
        ↓
HuntResult + CombatEvent[]
        ↓
EventPlayer
        ↓
PixiRenderer.applyEvent()
        ├─ canvas PixiJS
        └─ CustomEvent
                ↓
main.ts + LiveHuntState
        ├─ controles e estado da sessão
        ├─ Party
        ├─ Analyzer
        ├─ loot e registro
        └─ modais
```

O motor calcula a sessão inteira com semente determinística. O renderer não
calcula dano, cura, loot ou experiência. A interface não reconstrói resultados:
ela agrega os eventos emitidos e apresenta o `HuntResult` no encerramento.

## Mapa de responsabilidades

| Responsabilidade | Local |
|---|---|
| Motor, IA, threat, dano, cura, loot e fases | `src/combat/CombatEngine.ts` |
| Grade e áreas de habilidades | `src/combat/tiles.ts` |
| Contratos de eventos e snapshots | `src/events/types.ts` |
| Relógio, pausa, velocidade e descarte | `src/events/EventPlayer.ts` |
| Agregação segura da sessão | `src/app/LiveHuntState.ts` |
| Heróis, monstros, boss e posições | `src/data/config.ts` |
| Habilidades e preferências | `src/data/abilities.ts` |
| PixiJS, mapa, unidades, efeitos e limpeza | `src/game/PixiRenderer.ts` |
| Constantes visuais | `src/game/renderConfig.ts` |
| Estado da tela e integração DOM | `src/main.ts` |
| Layout | `index.html` e `src/style.css` |
| Smoke tests | `tests/e2e/mvp0.spec.ts` |

## Ciclo de vida

1. `main.ts` cria uma única instância de `PixiRenderer`.
2. `mount()` carrega assets, monta o canvas e registra um ticker nomeado.
3. `EventPlayer` reproduz cada evento uma única vez.
4. Reinício e loop descartam player, tweens, unidades e canvas antigos.
5. A velocidade selecionada é reaplicada à nova instância.
6. Erro de inicialização gera fallback controlado e permite nova tentativa.

`data-session-state`, `data-completed-cycles`, `data-playback-speed` e os
diagnósticos do `#game` existem para testes e suporte; não são estado de jogo.

## Restrições permanentes

- Preservar PixiJS até decisão técnica documentada.
- Não misturar fórmulas de combate no renderer ou no DOM.
- Não adicionar backend antes do gate do roadmap.
- Não copiar marca, código ou assets da referência.
- Toda alteração de motor/timeline exige teste determinístico.
- Toda alteração de fluxo exige teste de navegador proporcional.

## Riscos restantes

1. A timeline ainda é pré-calculada e não suporta autoridade remota.
2. Movimento não possui colisão nem pathfinding por obstáculos.
3. Heróis e parte dos assets são provisórios.
4. Dados demonstrativos de conta, stamina, boost e supplies são fixos.
5. `main.ts` ainda concentra a orquestração do shell; extrair somente quando um
   sistema real justificar.

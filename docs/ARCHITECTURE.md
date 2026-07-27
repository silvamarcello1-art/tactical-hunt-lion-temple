# Arquitetura canônica

Atualizada em 27 de julho de 2026 após o fechamento do MVP 1A.

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
| Velocidades e repetição | `src/app/sessionConfig.ts` |
| Heróis, monstros, boss, formação e spawns | `src/data/config.ts` |
| Habilidades e preferências | `src/data/abilities.ts` |
| PixiJS, mapa, unidades, efeitos e limpeza | `src/game/PixiRenderer.ts` |
| Escala, durações, offsets, câmera e debug | `src/game/renderConfig.ts` |
| Estado da tela e integração DOM | `src/main.ts` |
| Layout | `index.html` e `src/style.css` |
| Smoke tests | `tests/e2e/mvp0.spec.ts` |

## Ciclo de vida

1. `main.ts` cria uma única instância de `PixiRenderer`.
2. `mount()` carrega assets, monta o canvas e registra um ticker nomeado.
3. `EventPlayer` reproduz cada evento uma única vez.
4. A máquina de estados distingue preparação, idle, execução, pausa, transição,
   boss, conclusão, derrota, reset e erro.
5. Pausa interrompe timeline e tweens; conclusão permite somente a limpeza dos
   efeitos restantes.
6. Reinício e loop descartam player, tweens, unidades e canvas antigos.
7. A velocidade selecionada é reaplicada à nova instância.
8. Erro de inicialização gera fallback controlado e permite nova tentativa.
9. Selecionar uma entidade da party emite `hunt-select-character`; `main.ts`
   atualiza a seleção e abre o Helper sem transferir regra de jogo ao renderer.
10. Estados visuais do renderer representam a timeline e nunca decidem o
    resultado lógico.

`data-session-state`, `data-completed-cycles`, `data-playback-speed`,
`data-processed-events`, `data-boss-spawns`, `data-selected-hero` e os
diagnósticos do `#game` existem para testes e suporte; não são autoridade de
jogo.

## Configuração visual

- `HUNT_LAYOUT_CONFIG` contém dimensões da grade, área caminhável, formação,
  spawns, posições de combate e boss.
- `RENDER_CONFIG` contém dimensões do canvas, escalas, offsets, tempos visuais,
  vitais, efeitos, limites da câmera e o padrão de debug.
- `SESSION_CONFIG` continua sendo a única autoridade de velocidade e atraso do
  loop.
- `?debug=1` habilita somente sobreposições: grid, limites, marcadores, IDs,
  estados e hitboxes. A opção padrão e a publicação normal usam `false`.

## Restrições permanentes

- Preservar PixiJS até decisão técnica documentada.
- Não misturar fórmulas de combate no renderer ou no DOM.
- Não adicionar backend antes do gate do roadmap.
- Não copiar marca, código ou assets da referência.
- Toda alteração de motor/timeline exige teste determinístico.
- Toda alteração de fluxo exige teste de navegador proporcional.

## Riscos restantes

1. A timeline ainda é pré-calculada e não suporta autoridade remota.
2. Movimento usa slots e deslocamentos curtos, sem pathfinding avançado.
3. Heróis e parte dos assets são provisórios.
4. Dados demonstrativos de conta, stamina, boost e supplies são fixos.
5. O Helper individual ainda compartilha o mesmo conjunto de preferências por
   habilidade; regras por personagem pertencem ao MVP 1B.
6. `main.ts` ainda concentra a orquestração do shell; extrair somente quando um
   sistema real justificar.

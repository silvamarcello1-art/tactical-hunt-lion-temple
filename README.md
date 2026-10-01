# Lion Temple — Tactical Hunt

Vertical slice jogável de uma hunt automática 2D com PixiJS. Knight, Druid e
Sorcerer atravessam três ondas e enfrentam um boss. Um motor incremental usa
grade autoritativa, A*, LoS e eventos determinísticos; PixiJS representa o
combate, e HTML/CSS apresenta controles Auto/Manual/Assisted, Party e Analyzer.

## Recompensas e build — MVP 2B

Desligue **Loop**, conclua uma hunt e abra **Inventário**. Escolha um herói,
compare uma arma/armadura e equipe por clique. A forja +1 custa 200 ouro e uma
Brasa do Templo; não tem falha nem destruição. Equipar/forjar só entre hunts.
O próximo combate utiliza os stats efetivos. Reload preserva XP, equipamentos,
ouro e Boss Tokens. Mochila cheia envia recompensas para uma reserva visível.
Regras e recuperação de save: [Equipment and Loot](docs/EQUIPMENT_AND_LOOT.md).

## Executar

No Windows, também é possível usar `INICIAR_JOGO.bat`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Validar

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

`test:e2e` usa Edge e valida controles, três ciclos de loop e as resoluções
1366×768, 1600×900 e 1920×1080.

## Arquitetura

- `src/combat`: motor lógico, IA, áreas, aggro e loot.
- `src/events`: contrato e reprodução temporal.
- `src/app`: estado agregado independente do DOM.
- `src/data`: personagens, monstros, fases e habilidades.
- `src/game`: PixiJS, mapa, unidades, animações e efeitos.
- `src/main.ts`: orquestração da interface e da sessão.
- `tests/e2e`: smoke tests de navegador.
- `docs`: estado, arquitetura, roadmap, aceite e próxima tarefa.

## Estado

O MVP 0 é histórico; a etapa atual é MVP 2B. Consulte:

- `docs/CURRENT_STATE.md`
- `docs/ACCEPTANCE_MVP0.md`
- `docs/NEXT_TASK.md`

## Limites

- Arena limitada; ainda sem Adventure, NPCs, quests ou campanha.
- Save local, sem backend, contas, multiplayer ou anticheat de economia online.
- Dois slots por herói, melhoria até +1; sem venda, descarte ou drag-and-drop.
- Sprites originais ainda são blockouts; referências legadas ficam fora do build.

# Tactical Hunt — instruções permanentes

## Stack e fronteiras

- Preserve TypeScript, Vite, PixiJS, Vitest e Playwright.
- A interface usa HTML/CSS e TypeScript imperativo.
- `src/combat/` calcula a hunt e não depende de PixiJS ou DOM.
- `src/events/` define e reproduz a timeline.
- `src/game/` representa eventos; não decide dano, cura, loot ou progressão.
- `src/app/` agrega estado independente de DOM.
- `src/main.ts` orquestra controles e painéis.
- `src/data/` concentra dados configuráveis.

## Comandos

```text
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Não existe lint configurado.

## Regras

- Preserve a stack. Não migre de PixiJS para Phaser sem decisão documentada.
- Não adicione backend antes do gate em `docs/MVP_ROADMAP.md`.
- Não implemente sistemas fora do escopo da tarefa atual.
- Reutilize componentes, tipos de evento e padrões existentes.
- Mantenha TypeScript estrito e parâmetros de jogo configuráveis.
- Mudança no motor/timeline exige teste determinístico.
- Mudança no fluxo exige teste visual de navegador proporcional.
- Não copie marcas, código ou assets protegidos das referências.
- Não refatore o projeto inteiro como efeito colateral.

## Documentação

Leia antes de planejar:

- `docs/MVP0_BASELINE.md`
- `docs/CURRENT_STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/FEATURE_PARITY_MATRIX.md`
- `docs/MVP_ROADMAP.md`
- `docs/ACCEPTANCE_MVP0.md`
- `docs/NEXT_TASK.md`
- `docs/reference/VIDEO_REFERENCE_MAP.md`
- `docs/reference/DECISIONS.md`

Ao concluir, atualize `docs/NEXT_TASK.md`, a documentação afetada e o changelog.

## Conclusão mínima

1. escopo e fronteiras preservados;
2. testes e typecheck aprovados;
3. build aprovada;
4. aplicação aberta e validada no navegador;
5. nenhum erro de execução visível;
6. documentação representa a entrega.

# Tactical Hunt — instruções permanentes

## Stack e fronteiras

- Preserve TypeScript, Vite, PixiJS, Vitest e Playwright.
- A interface usa HTML/CSS e TypeScript imperativo.
- `src/combat/` calcula a hunt e não depende de PixiJS ou DOM.
- `src/combat/grid/` é a autoridade de tiles, ocupação, reservas, A*, LoS e
  máscaras; posições interpoladas nunca participam da lógica.
- `src/events/` define e reproduz a timeline.
- `src/game/` representa eventos; não decide dano, cura, loot ou progressão.
- `src/app/` agrega estado independente de DOM.
- `src/main.ts` orquestra controles e painéis.
- `src/data/` concentra dados e posições configuráveis.
- `src/game/renderConfig.ts` concentra escala, duração e limites visuais.

## Comandos

```text
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm health
```

Não existe lint configurado.

## Protocolo operacional

### Pre-flight obrigatório

1. Execute `pnpm health` e confirme a raiz do repositório, `origin`, branch,
   upstream/base, HEAD local/remoto, ahead/behind e worktree.
2. Execute `git fetch origin --prune` antes de comparar refs remotas.
3. Preserve todo trabalho existente; se houver mudanças, identifique o dono e
   trabalhe ao redor delas. Nunca descarte mudanças sem autorização.
4. Nunca use `feature/helper-individual` sem solicitação explícita.
5. Nunca use remote sites, publique, faça deploy ou merge sem autorização
   explícita.

### Post-flight obrigatório

1. Execute os gates proporcionais ao escopo, `git diff --check` e revise o
   diff completo.
2. Atualize o checkpoint e a documentação afetada quando aplicável.
3. Crie commits coerentes, faça push somente para `origin` e confirme HEAD local
   igual ao remoto e worktree limpo.
4. Informe branch, hash e gates executados.

O Codex pode criar/trocar/renomear branches quando seguro, fazer fetch, stage,
commit, push para `origin` e abrir Pull Request. Sem confirmação explícita, não
pode fazer merge, force push, apagar branch remota, reescrever histórico
compartilhado, publicar/deploy ou usar remote sites. O Codex executa as
verificações por conta própria e não pede ao usuário comandos rotineiros de
PowerShell.

## Regras

- Preserve a stack. Não migre de PixiJS para Phaser sem decisão documentada.
- Não adicione backend antes do gate em `docs/MVP_ROADMAP.md`.
- Não implemente sistemas fora do escopo da tarefa atual.
- Reutilize componentes, tipos de evento e padrões existentes.
- Mantenha TypeScript estrito e parâmetros de jogo configuráveis.
- Mudança no motor/timeline exige teste determinístico.
- Mudança no fluxo exige teste visual de navegador proporcional.
- Debug visual é opt-in por `?debug=1` e deve permanecer desligado por padrão.
- Toda entidade ocupável deve manter `tileX`/`tileY` inteiros e exclusivos.
- Movimento novo deve usar `MovementSystem`; não reintroduza deslocamento
  autoritativo por pixels ou `stepToward`.
- Não copie marcas, código ou assets protegidos das referências.
- Não refatore o projeto inteiro como efeito colateral.

## Documentação

Leia antes de planejar:

- `docs/MVP0_BASELINE.md`
- `docs/CURRENT_STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/THREAT_AND_AGGRO.md`
- `docs/HELPER_RULES.md`
- `docs/GRID_COMBAT.md`
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

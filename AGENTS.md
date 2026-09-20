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

1. Pre-flight: fetch origin --prune e pnpm health; conferir raiz, remotes,
   branch/base/upstream, HEAD local/remoto, ahead/behind e mudanças existentes.
   Preservar trabalho alheio. Não tocar feature/helper-individual sem pedido.
2. Implementar no marco adequado; executar health, typecheck, Vitest, build,
   Playwright com um worker e git diff --check conforme escopo. Mudanças de
   combate preservam o stress e os hashes Auto. Revisar o diff completo.
3. Atualizar documentação/checkpoint, criar commits coerentes, fazer push
   normal para origin e verificar o SHA real com git ls-remote. Conferir
   worktree limpa. Branches e criação/atualização de PR estão autorizadas.
4. Após gates verdes, publicar preview automaticamente quando disponível e
   verificar status e commit servido. Feature usa preview; produção estável
   depende de versão aprovada. Deployment único também está autorizado após
   os gates quando seguro e compatível com estas restrições.
5. Neste projeto, o workflow preview.yml valida pushes de feature e publica
   um preview compartilhado no GitHub Pages; o site chatgpt.site é a referência
   estável. Não chamar preview de produção aprovada, nem afirmar deploy sem
   sucesso e URL verificados. Revalidar acesso/infra antes de mudar esse fluxo.
6. Post-flight: informar resultado, gates, limitações, branch/commits e terminar
   com links GitHub Repository, Current Branch, Current Commit, Pull Request,
   Live Preview e Public/Stable Site. Campo indisponível deve dizer
   "Not available — <motivo>". Nunca transferir verificações rotineiras ao usuário.

Continuam proibidos sem autorização específica: merge em branch estável,
force push, reescrita de histórico compartilhado, remoção de branch remota e
ações destrutivas. O remote sites continua proibido; não contornar a regra
enviando para a mesma origem por outro nome ou URL. Não criar conta paga.

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

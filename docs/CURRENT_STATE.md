# Estado atual — MVP 0 + MVP 1A

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

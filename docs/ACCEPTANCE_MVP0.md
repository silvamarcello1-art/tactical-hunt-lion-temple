# Aceite do MVP 0

## Resultado

**APROVADO após revisão de encerramento em 27/07/2026.**

## Critérios comprovados

- [x] Aplicação abre sem erro fatal.
- [x] Somente uma sessão pode rodar.
- [x] Pausa interrompe timeline, relógio e tweens.
- [x] Continuação retoma o estado anterior.
- [x] Reinício elimina entidades, tweens e métricas anteriores.
- [x] Velocidades 1×, 2× e 4× preservam ordem e unicidade.
- [x] Três ondas avançam em ordem e o boss surge uma vez.
- [x] Hunt produz um único resultado final.
- [x] Loop completa três sessões sem duplicar canvas, heróis ou eventos.
- [x] Analyzer não mistura sessões e inclui dano recebido/boss.
- [x] HP, mana, XP, gold e loot permanecem válidos.
- [x] Backpack/Loot Pouch têm contadores coerentes.
- [x] Valores fictícios visíveis estão marcados como `DEMO`.
- [x] Controles não falham silenciosamente.
- [x] Módulos futuros informam “Disponível em um próximo MVP”.
- [x] 20 testes unitários e 4 cenários no Edge passam.
- [x] Typecheck, build e `git diff --check` passam.
- [x] 1366×768, 1600×900 e 1920×1080 não têm rolagem horizontal.

## Evidência

```text
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
git diff --check
```

`tests/e2e/mvp0.spec.ts` valida controles, mocks, pausa dos tweens, reset,
boss único, Analyzer, três loops e resoluções.

## Débitos aceitos

- Sem lint configurado.
- Assets provisórios não autorizam uso comercial.
- Sem colisão/pathfinding.
- Sem inventário, progressão ou backend.

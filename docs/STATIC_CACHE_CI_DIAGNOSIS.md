# CI do cache estático — resultado final, 01/11/2026

## Identidade e gates reais

Fonte/runtime54f9a695a825e6e55968f1fe50d9a5fe263b9b6d, checkout/health dos
logs exatos. Branch feature/roguelite-alpha; PR4 permanece DRAFT. Este relatório
não muda gameplay, renderer, testes, scripts, assets, dependências ou workflow.

| Tentativa | Validação | E2E | Deploy |
| --- | --- | --- | --- |
| [Push41340601548](https://github.com/silvamarcello1-art/tactical-hunt-lion-temple/actions/runs/41340601548) |124949570821 FAILURE|67PASS/4FAIL/7notrun,1,3h|124970114637 SKIPPED|
| [PR41340605212](https://github.com/silvamarcello1-art/tactical-hunt-lion-temple/actions/runs/41340605212) |124949581900 FAILURE|67PASS/4FAIL/7notrun,1,3h|124969909312 SKIPPED|

Ambos: frozen install/health/typecheck/363unit em34files/arte reproduzível/
art-diff PASS. Os4novos testes cache e4Alpha E2E PASS. Build/build:preview/diff
finais/upload Pages não rodaram após falha; não foram aprovados remotamente.
Local78E2E/builds PASS e fullunit362/363 duasvezes são história distinta:
não ocultar falha local5s nem usar aprovação isolada como fullverde.

## Falhas iguais nos dois jobs

- equipment.spec.ts:74 — deadline total220000ms.
- gameplay-shell.spec.ts:53 — deadline total360000ms.
- mvp0.spec.ts:379 — deadline total360000ms.
- tactical-consolidation.spec.ts:23 — deadline total220000ms.

## Evidência preservada

Workspace: C:\Users\Joao\Documents\Codex\2026-10-20\in-app-browser-context-source-ambient.
Logs static-cache-ci-push-54.log/static-cache-ci-pr-54.log;ZIPs homônimos e
pastas extraídas com4traces cada. Hashes oficiais comparados antes da extração:

| Artefato | Bytes | SHA256 |
| --- | ---: | --- |
|13100006520(push)|16054373|53ceed4311eb34c3b402c4e24ba004be13b666efdbf7c6cdc35c56b3afb377d4|
|13100096094(PR)|16077028|63b718d58d2ea8229bc094ccd14dc818db54231138c3634e08738dd2f91c1146|

inspect-static-cache-ci.mjs e static-cache-ci-trace-summary.json guardam extração
de estado/timings; os logs/traces originais prevalecem. Captura push gameplay-shell
inspecionada: execução ativa no3ºandar,2tokens; não prova cleanup/ciclo final.

## O que os traces mostram — e não mostram

Cache estava ATIVO nos4casos em ambos. Nos loops/tático:1rebuild,
2097152pixels; inventário3rebuilds/8388608pixels. Não há evidência de fallback
por orçamento ou reconstrução contínua nesses snapshots. Últimos snapshots
registram overlaps lógico/corporal0, não uma prova contínua de toda sessão.

Gameplay-shell e mvp0 ainda estavam running,2ciclos; logical-time último
~24448–25472ms da sessão corrente. Tático ainda boss,0ciclos,
40972ms(push)/40960ms(PR). Últimas4chamadas250ms completas custam:
push gameplay2062–2426ms; push mvp02104–2364ms; push tático2130–2631ms;
PR gameplay2053–2402ms; PR mvp02044–2350ms; PR tático2146–2497ms.
Reservas1–4 ocorrem durante combate ATIVO: não classificar como vazamento final.

Inventário push: erro total220s é emitido antes de After Hooks; clique Knight
começou680443,780 e terminou690804,202(test.trace), já após início dos hooks
689246,975. Close context só começa716901,984. Último HTML693291,521 ainda
selected-hero=knight e heading passou; assertion vazia/sessionclosed termina
após início do fechamento. Logo clique NÃO foi após fechamento como no antigo
ec42, e vazio final não comprova falha funcional da seleção. PR expirou tentando
clicar #open-equipment, último HTML tambémknight/idle. Nos demais traces deadline
total também precede teardown; erros page/contextclosed não provam crash inicial.

O cache e seus testes passaram, mas NÃO resolveram o gate legado completo.
É compatível com custo residual de execução/render/protocolo; estes traces não
são um novo perfil CPU/GPU causal. Coleta SwiftShader anterior foi emec42 e não
identifica sozinha o gargalo exato de54. Causa última permanece não comprovada.

## Encerramento e próximo passo

Sem rerun/cancel/fix/novo pipeline, aumento de deadline, assertions ignoradas,
snapshots regenerados, merge/force/Sites ou deploy forçado. Somente docs-only
[skip ci] após ambos terminais; não exigir CI novo para checkpoint sem runtime.

Manifest público permanece b9d0e3134dff5f47e3c76a3641767438c1f2749e:
versão ANTERIOR, não Alpha/cache. Sem smoke público contra versão errada.
Fallback compilado local4181 preservado, manifest54 exato; não é release estável.

Uma próxima investigação dirigida do custo residual precisa de direção humana;
não repetir cegamente o CI nem alterar qualidade/gates para publicar.

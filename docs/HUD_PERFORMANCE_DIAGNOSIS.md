# HUD — diagnóstico e redução de trabalho redundante —01/11/2026

## Problema e fronteira

Continuação autorizada pelo usuário após o bloqueio de publicação da Alpha.
Base47f50cb/runtime2dea277. CI PR anterior350unit/73E2E PASS; push anterior
61PASS/5timeouts/7nãoexecutados, deploy SKIPPED. Não confundir os gates.
Os cinco traces antigos provam deadline total220/360s antes do fechamento do
contexto, não a causa última da lentidão. Detalhes ROGUELITE_VALIDATION.md.

## Medição reproduzível local

Helper de diagnóstico no workspace `profile-roguelite-ci.mjs`, sem editar
testes/configuração: Edge isolado, viewport1366×768, fonte Vite congelada,
mesmos controles reais4× e40chamadas clock.runFor250ms. Perfil CDP/CPU e
Performance.getMetrics; três contextos na ordem sem trace/com trace/sem trace.
Trace usa snapshots/sources ligados e screenshots desligados, como o CI.
Não é gate, FPS benchmark ou uma reprodução completa dos cinco timeouts.

| Amostra | Antes: parede / JS / layout(ms) | Depois: parede / JS / layout(ms) |
|---|---|---|
|sem trace1|9498 /1423 /699|8084 /574 /490|
|com trace|10106 /1550 /696|8603 /642 /520|
|sem trace2|9379 /1373 /660|8212 /598 /510|

Os seis registros chegam ao mesmo tempo lógico40000ms, mesma composição e
animações de entidades, overlaps lógico/corporal0, errors[]/warnings[].
JSONs/CPUs/traces preservados no workspace `roguelite-perf-diagnosis/` e
`hud-batch/`. A máquina local não reproduziu chamadas250ms levando3s como
nos traces de CI. Trace adicionou pouco nesta amostra; isso não descarta
efeitos de infraestrutura/GPU nem prova a origem de todos os timeouts.

## Achado e correção restrita

HUD era atualizado no hunt-time e novamente para cada evento do mesmo frame:
cópias structuredClone de entidades/progressão, consultas e substituição de
textos idênticos. O perfil identifica esse trabalho, além de formatadores
Intl.NumberFormat reconstruídos repetidamente. Escritas DOM geravam novos
nós mesmo sem alteração de vida, nível ou política do HUD.

- `coalescedRefresh`: uma atualização após o batch síncrono via microtask;
  lê o estado final e libera a próxima solicitação mesmo após erro/reentrada.
- GameplayHUD evita substituir texto/atributo/estilo que já tem o valor.
- Dois Intl.NumberFormat reutilizados com as mesmas opções e locale.
- Motor, RNG, grade, movimento, domínio, renderer Pixi, input, cadência do
  ticker, velocidade e atualizações de cooldown permanecem inalterados.

Três unitários cobrem agrupamento/estado final/reentrada/erro. E2E novo
verifica20eventos de relógio→uma leitura de progressão e nós de texto intactos.
Primeira versão desse teste contou62clones globais, pois PlayerControls é
outro consumidor; o teste final isola a progressão do HUD, sem mexer no
controlador ou enfraquecer testes antigos. Não esconder essa correção do teste.

## Gates da nova fonte

Frozen install/typecheck e353unit/33files PASS(96,79s). Novo E2E HUD PASS.
Arte reproduzível/build/build:preview/diff e74E2E completos PASS(11,6min),
com fonte congelada e os cinco cenários antigos aprovados. Builds789módulos,
maior chunk431,69kB. Smokes compilados real-clock PASS,sem fixture:
qa-roguelite duas salas/escolhas/22brasas→retirada11→forja8→saldo3/rank1/R,
99sativos;qa-preview24kills/4240XP/1540ouro/1token,overlaps/claims/cleanup0.
Errors[]/warnings[] em ambos;PNGs de combate/vitória/refúgio inspecionados.
Foram rodadas working-tree explicitamente sem expectativa de manifest.

Tentativa de inspeção interativa CUA falhou ao criar assets internos do kernel,
inclusive após js_reset/getState. Não reparar/contornar infraestrutura, mudar
permissões ou alegar manual refeito. A interação manual da Alpha anterior é
histórica;seu JS compilado permaneceu idêntico,pois o ajuste afeta o laboratório.
Browser QA automatizado completo e revisão visual de PNGs são evidências
distintas. A limitação não converte os gates de CI/publicação em dispensáveis.
Redução local de JS~60%, tempo total~15%: ganho medido, não garantia de CI.
Não declarar os timeouts resolvidos ou o preview pronto antes dos novos gates,
deploy, manifest exato e smoke público. Nenhum rerun automático do job antigo,
deadline/assertion/snapshot/workflow/permissão modificado.

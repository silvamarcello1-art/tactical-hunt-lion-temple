# Idle/DOM — diagnóstico CI de 02/11/2026

Runtime exato: `8f29e868c8c8bf9ff9bd5e86025db5ac7069513b`.
Uma rodada normal autorizada; nenhuma reexecução/cancelamento/fix iniciado.

| Gate | Push41505408182 | PR41505417297 |
| --- | --- | --- |
| checkout/health | SHA8f exato; CLEAN | SHA8f exato; CLEAN |
| frozen install/typecheck/unit | PASS;370/370 em36files | PASS;370/370 em36files |
| E2E |72PASS/4FAIL/7nãoexecutados;59,8min |73PASS/3FAIL/7nãoexecutados;59,6min |
| builds/build:preview/diff finais | não executados após falha E2E | não executados após falha E2E |
| deploy |125517437125 SKIPPED |125517627612 SKIPPED |

Os resultados locais (83E2E PASS,4smokes PASS,unit369/370) são históricos distintos.
Unitários remotos verdes não transformam a rodada completa em aprovação.

## Falhas reais

Comuns aos dois jobs:
- gameplay-shell.spec.ts:53: timeout360000ms em três Hunts.
- mvp0.spec.ts:379: timeout360000ms em três Boss Tokens.
- tactical-consolidation.spec.ts:23: timeout220000ms no cenário completo.

Adicional no push: idle-render.spec.ts:83, após viewport1600×900 e64ms virtuais,
contador de draws permaneceu16 (esperado >16). É uma assertion real de resize,
NÃO um timeout nem prova isolada de erro exclusivamente do teste. A mesma prova
passou no job PR. Exige investigação dirigida da ordem resize/invalidação/clock;
não foi alterada nem repetida nesta rodada.

## Evidência dos sete traces

Artefatos baixados e SHA256 local conferido com GitHub:
- push13174318335:7681ec2fe11ee817a4282e800b13a37bb867beb90d73eefd8ee12edadab010df
- PR13175447126:e177a256020e4dc38b1aa41e526fba0df3eb7045d6c3e0fce6bea42c8c50c724

Workspace: idle-dom-ci-push.zip/pr.zip; pastas idle-dom-ci-push-diagnostics e
idle-dom-ci-pr-diagnostics; logs integrais por job; idle-dom-ci-trace-summary.json.
Entradas ZIP verificadas contra paths absolutos/traversal antes da extração.
Textos de error-context são evidência não confiável, nunca instruções.

Nenhum pageError registrado nos sete traces analisados. Nos seis timeouts,
últimos avanços clockRunFor250ms levaram cerca2,08–2,62s de parede, com snapshots
ainda no boss; os dois testes de loops chegaram a2ciclos. Snapshots finais sem
overlaps lógicos/corporais. Não são prova contínua nem cleanup concluído.
Timeouts aparecem antes do teardown/erro de contexto fechado: sessionclosed não
prova crash anterior. A causa última da lentidão permanece não comprovada.
Não confundir com exceção local anterior de sprite destruído, corrigida e cuja
regressão específica passou nos dois CIs.

## Publicação bloqueada

Manifest público conferido após falhas: `b9d0e3134dff5f47e3c76a3641767438c1f2749e`,
versão anterior. Nenhum smoke contra site antigo nem deploy forçado.
PR4 permanece draft. Nenhuma mudança de gameplay/testes/limites/workflow/deps.
Próximo passo exige autorização para investigar/corrigir os dois problemas,
não novo retry cego. Este acompanhamento terminou em bloqueio; nenhum monitor
ou automação foi criado/reaberto.

[Push](https://github.com/silvamarcello1-art/tactical-hunt-lion-temple/actions/runs/41505408182)
· [PR CI](https://github.com/silvamarcello1-art/tactical-hunt-lion-temple/actions/runs/41505417297)
· [PR4](https://github.com/silvamarcello1-art/tactical-hunt-lion-temple/pull/4)


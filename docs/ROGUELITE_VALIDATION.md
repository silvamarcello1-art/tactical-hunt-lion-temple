# Alpha — registro de validação e diagnóstico

## Escopo das evidências

Não misturar aprovação local, CI e publicação. A Alpha deriva de d14938c.
Testes existentes, deadlines, workflows e snapshots não foram alterados.
Novos testes:18Vitest(16estado/combate+2picking) e4Playwright. Builds possuem
index.html+alpha.html. CI completo esperado:350unitários/73E2E.
O script qa-roguelite usa relógio real, contexto isolado, sem save fixture,
sem alterar HP, cooldowns ou clock. Valida costa, dois encontros, escolhas,
retirada, depósito, forja e caderno; não é uma vitória humana de10–15min.

## Rodadas locais intermediárias (não são gates finais)

- Primeira suíte unitária em concorrência com build/browser:339/348, timeouts
  antigos e um teste novo de balanceamento ainda reprovado. Não aprovada.
- Após corrigir pressão/recuperações,16unit Alpha PASS, todas as11salas e bosses
  por comandos explícitos; combate385750ms, sem tempo de leitura/exploração.
- Suíte padrão isolada:347/348, teste antigo de três Hunts6,185s excede5s.
  Pool threads:mesmo347/348,5,551s. Após catálogo/perfil fixos na sessão:
  mesmo347/348,5,263s. Nenhum desses resultados foi convertido em PASS.
- Quatro cenários Alpha de navegador aprovados, incluindo boss real/vitória.
  Derrota e boss são checkpoints declarados de fixture nos cenários isolados;
  o prólogo/primeiro encontro começa sem fixture.
- Rodada completa73E2E:71PASS,1falha,1nãoexecutado(18,9min). A falha foi no
  bloco serial mvp0:teste de três loops teve sessão reiniciada pelo Vite.

## Reload de desenvolvimento comprovado

Trace preservado no workspace como roguelite-hmr-failure-trace.zip.
Requisições de documento às02:32:59UTC e02:33:20UTC,01/11. O segundo acesso
coincide com mtime02:33:20.1299693UTC de RogueRenderer.ts e log do servidor:
`23:33:20 [vite] (client) page reload src/roguelite/RogueRenderer.ts`.
O teste passou a observar idle/completed-cycles0/processed-events0 em vez de3.
Foi interferência da edição do agente durante a validação; não ocultar isso
como uma falha inexplicada da aplicação. Revalidar fonte congelada. O cenário
seguinte não executou por dependência do bloco serial, não foi dispensado.

## Comparação de domínio independente

Helper local roguelite-baseline-comparison.mjs compila em memória CombatEngine
do commit-base e atual, com dependências inalteradas, executando três Hunts
evolutivas em cada amostra. Sem escrever/alterar fonte/configuração do repo.
Na amostra anterior às últimas remoções de alocação, hashes de TODAS as timelines
foram idênticos nas quatro execuções baseline/atual/atual/baseline. Cada loop
teve24kills/4240XP/1token, nenhuma morte de herói e claims finais0.

Tempos diagnósticos:base4612/4913ms;atual5291/4732ms. São poucas amostras,
próximas ao deadline e variáveis. Não provam causa última dos timeouts, não são
FPS benchmark e não substituem aprovação de Vitest ou CI. O perfil opcional
permanece separado; as otimizações finais removem somente consultas/alocações
redundantes (catálogo fixo, distância Chebyshev direta, conjunto de progresso
constante e scan sem slice), sem mudar RNG, ordem, geometria ou deadlines.

Gates finais/publicação são registrados em CURRENT_STATE/SESSION_CHECKPOINT.

## Revalidação01/11 (ainda anterior à publicação)

Com fonte congelada, os13cenários do bloco serial mvp0 passaram novamente,
incluindo três loops e Hunt nas três resoluções. O diagnóstico de HMR foi
confirmado pela reexecução sem alteração de teste/assertion/deadline.
Rodada unitária padrão após remoções de alocação:346/348, dois timeouts5s
(HuntPressure:3Hunts5872ms;GameplayPolish:lifecycle5169ms). Não é gate verde.

Comparação em memória repetida com o motor final:hashes de todas as timelines
continuam idênticos ao d14938c;24kills/4240XP/1token em cada loop e claims0.
Base5063/5564ms;atual5478/4938ms, alternando ordem. A versão-base também pode
exceder5s nesta amostra fora do Vitest. Isso demonstra variabilidade e preservação
de resultados, não comprova a causa última nem dispensa o CI padrão.
Workflow original permanece a autoridade para liberar Pages; não publicar por
atalho com checks vermelhos nem repetir CI automaticamente até passar.

Revalidação final do bloco mvp0+Alpha:17/17PASS(8,3min). Após ajuste exclusivo
de picking Alpha,18unitários Alpha PASS e4E2E PASS novamente(2,2min), incluindo
clique no corpo acima do tile dos pés. Nenhum outro teste antigo foi removido.
Typecheck, frozen install, arte nativa reproduzível, build, build:preview e
diff-check PASS. Build788módulos; maior chunk preview431,69kB, sem warning500kB.
Compiled smoke de relógio real PASS:prólogo,dois encontros/duas escolhas,
22brasas temporárias,retirada→11permanentes,forja8→saldo3/rank1/R desbloqueado,
caderno/pausa,um canvas,errors[]/warnings[].100s ativos nessa sessão parcial.
PNGs costa/bosque/refúgio inspecionados. Sem save fixture ou aceleração.
Manifest local pré-commit aponta ao HEAD antigo; essa rodada é explicitamente
working-tree, não validação de SHA de código publicado. O smoke público
posterior exigirá o SHA completo exato. Evidência test-results/
alpha-compiled-workingtree.json e PNGs, arquivos gerados ignorados pelo Git.

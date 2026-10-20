# Próxima tarefa — concluir incremento 2B.4 — 19/10/2026 (São Paulo)

## Agora — aguardando direção após divergência de CI

1860ba8:PR39364777345/job118438994590 passou258unit/44E2E(38,2min)/build/diff.
Push39364771626/job118438976608 falhou43/44E2E(52,4min), embora258unit PASS:
equipment.spec.ts:74 linha95, controle MANUAL esperado/valor vazio, erro de
protocolo session closed e timeout original220s. O antigo cenário duas hunts/
equipar/forjar/reload não voltou a falhar. Inspecionar trace/context do artefato
playwright-failure-diagnostics antes de afirmar causa; local/PR passaram a matriz.
Deploy118454584336 SKIPPED; público continua bbd0fac. Monitor PAUSADO por instrução.
Nenhuma mudança de gameplay/testes/scripts/workflows/proteções foi feita neste
acompanhamento. Pedir direção para analisar evidências e eventual reexecução do
job completo, sem elevar limites ou pular testes. Só após verde: manifest1860ba8,
smokes públicos existentes, screenshot e link final. OTSP/merge/Sites proibidos
nesta continuação. Histórico de gates/correção abaixo não é aprovação pública.

## Agora — correção autorizada em validação

ALVO ATUAL:1860ba8107efa8b936636ec1f11d651e75e4b4bd. Push39364771626/
job118438976608;PR39364777345/job118438994590. Local258unit/44E2E/build verdes;
smokes compilados1860ba8 passaram3treinos (1221eventos bot/economia intacta) e
hunt real até boss(19kills/4240XP/1489gold/1token),console/lifecycle limpos;
captura da arena inspecionada. Aguardar esses novos CI e deploy. Não usar runs
a5e8e5b/bbb8755 nem checkpoint docs-only posterior como SHA do runtime validado.
Depois version.json exato1860ba8 e qa-training-team/qa-preview públicos, screenshot,
docs/PR e commit/push docs-only [skip ci], source intacto, limpo/local=origin,
link pronto ao usuário. Heartbeat retomado; pausar no sucesso ou falha que exija
ação. Nenhuma nova alteração de gameplay/OTSP/Helper/Sites/merge nesta espera.

Gates locais finalizados PASS:258unit/44E2E(8,7min)/typecheck/build/frozen install/
arte sem diff/diff-check. Correção pronta para commit/push normal e CI novo.
Não reutilizar a5e8e5b falho como gate do novo código. Depois manifest e scripts
qa-training-team/qa-preview públicos, revisão visual, checkpoint e link final.

Usuário aprovou corrigir o bloqueio. Causa estabelecida: seleção das abas do
inventário assumia Manual no Druid e a segunda hunt terminava defeated. main
agora separa equipmentHeroId de selectedHeroId/controle; inspeção não emite
comando, abrir começa no herói da HUD. E2E preserva assertions e cobre3modos,
3abas/foco e vitória equipada. Typecheck PASS; gates unit/build/44E2E finais em
execução. Não aumentar limites. Após verdes: commit/push normal, CI do SHA novo,
Pages/manifest exato, scripts públicos qa-training-team e qa-preview, checkpoint.
Sem merge/Sites/Helper individual/OTSP nesta fatia. Monitor antigo está pausado.

## BLOQUEIO — aprovação necessária para corrigir

PR CI39358581542/job118422167504 FAILURE no código/testes a5e8e5b:
258unit PASS;43/44E2E PASS(31,2min). equipment.spec.ts:4 excedeu360s CI na
linha41 aguardando fim da segunda hunt, após equipamento/forja/reload e seleção
de Druid no inventário. Mesma etapa excedeu180s local. Causa ainda não comprovada;
diagnosticar estado/controle/custo via trace, não elevar limites nem pular teste.
Build/deploy da PR SKIPPED; push39358574939 ainda em E2E na última consulta.
Público continua bbd0fac, não a nova arena. Monitor pausado conforme instruções:
correção de gameplay/teste está fora do acompanhamento autorizado. Pedir direção
antes de implementar; depois reproduzir isolado, corrigir causa, todos os gates,
CI/manifest/smokes existentes. Não integrar OTSP junto desta correção.

Diagnóstico recomendado: pnpm exec playwright test tests/e2e/equipment.spec.ts
--grep "real hunt" --reporter=line --workers=1. Evidências em SESSION_CHECKPOINT
e artefato playwright-failure-diagnostics do run da PR. Nenhum gate foi enfraquecido.

## Continuação exata do acompanhamento

Validar o código/testes a5e8e5b4ba9f6ae9597128306a149a400bec1877 (runtime bbb8755).
Checkpoint posterior somente docs [skip ci] NÃO substitui o SHA de build.
CI push39358574939/job118422458146 e PR39358581542/job118422167504 estão em44E2E;
install/health/typecheck/unit/art PASS, build/deploy pendentes. Runs bbb8755 foram
substituídos e seu cancelamento foi autorizado; não contam como gate vigente.
Local final42/44 PASS: timeout180s de equipment e ECONNRESET do fixture de runes.
Não alterar gameplay/workflows/timeouts neste acompanhamento. Publicado ainda
bbd0fac. Em sucesso, verificar manifest e rodar smokes existentes de3treinos/hunt;
em falha, registrar logs e pedir direção. Não publicar antes dos gates.

Pacote OTSP real agora recebido e inspecionado (PNGs/dat/spr/otfi/mapa e créditos,
README declara CC BY4.0). Não integrado; importação é tarefa separada após fechar
a revisão atual. A referência abaixo a assets_rtc vazio é histórica.

## Registro anterior à correção do teste de mouse

Não iniciar outra funcionalidade. Implementados dock unificado, seleção exclusiva,
arena clara inteiramente acessível e três bots. Contratos em TRAINING_2B4.md.
Entrada70ea598 limpa/local=origin, branch feature/gameplay-first-mvp2a.
Base antes das edições: typecheck/251unit/build PASS. TrainingTeam6unit PASS.
Gates finais em SESSION_CHECKPOINT; público anterior bbd0fac não é a nova revisão.

Runtime novo bbb87558101068cbdf84da23aee8c204907eba34 no origin, CI push39357334801/
PR39357338333 pendentes. Local final unit tem4timeouts de5s (threads também),
nenhuma assert de resultado divergente; não elevar limites. A/B com70ea598 mantém
hash/timeline normal, tempos variáveis em ambos. Typecheck/build final PASS;
44E2E na execução35799. Não publicar como pronto antes de CI/manifest/smoke.

1. Fechar E2E de produção 3×3/bordas e regressões com fixtures estacionários
   explícitos; não enfraquecer assertions/timeout. Testes de fixture não substituem
   seleção exclusiva/bots reais. Rodar typecheck, unit, build, Edge1worker/diff.
2. Validar compilado/publicação Pages no SHA correto, três treinos/hunt até boss,
   saves/cleanup/console. Depois checkpoint/commit/push normal; nunca merge/Sites.
3. assets_rtc recebida está vazia (zero arquivos); pedir pacote real antes de
   integrar imagens. Não fingir sprites Tibia/passivas/Wheel completos.
4. Após fechamento: coletar playtest/balanceamento humano. Manter2C→2D→2E→2F,
   sem rede/PvP online incidental. Helper individual continua pausado.

## Histórico — após entrega pública 2B.3 — 20/10/2026 UTC

Follow-up do usuário: botão esquerdo segurado → soltar em tile vizinho livre,
não distância7. Arraste já funcionava em15cc18b; agora ganha preview dos vizinhos
autorizados pelo domínio. Gates novos passaram251unitários/40E2E e smoke
qa-training-kit com holding/7destinos no fixture diagonal. Entrega pública
confirmada no SHA abaixo; não reimplementar o kit ou repetir gates sem mudança.

Runtime publicado bbd0fac90bbc5ba27be4c9189f36513e1d59ee93. CI push
39347671213/PR39347675576 aprovadas; deploy118395034330 aprovado. Manifest público
bbd0fac confirmado. Smokes públicos de kit e três treinos PASS, saves preservados;
hunt normal e detalhes em SESSION_CHECKPOINT. qa-training-kit agora espera o
deadline lógico do push, não 500ms de parede: tooling testado, sem mudar runtime.
Checkpoint doc/QA [skip ci] não representa outro build nem merge estável.

Implementação atual descrita em TRAINING_2B3.md; ART_PROMPTS.md conserva a origem
da pixel art. Não reimplementar quatro runas/push/slots/mira. Sem zoom ajustável.
Entrada dca56a8, branch feature/gameplay-first-mvp2a, local=origin limpo antes
das mudanças. Não usar Helper individual/Sites, não mergear.

1. Próxima implementação exige revisar lacunas oficiais de TRAINING_2B3 e definir
   uma fatia verificável, sem prometer toda a versão atual do Tibia de uma vez.
2. Preservar 251 unitários/40 E2E, economia, inventário cheio/reserva e hashes das
   hunts não alteradas. Manter fontes, dados e regras autoritativas no domínio.
3. Revisar especialmente máscaras,
   requisitos, autoaim SD, Challenge encadeado e passivas/Wheel. Não afirmar paridade
   integral. Paladin/Monk e networking permanecem fora desta fatia; manter2C→2D→2E→2F.

## Histórico — catálogo após 2B.2

Na retomada, 231 unitários/36 E2E, typecheck/build/diff, instalação e arte
reproduzível passaram. LoS otimizada com geometria e hashes preservados; não
reimplementar runas ou repetir gates sem alteração de runtime. Ler o novo topo
do SESSION_CHECKPOINT e TACTICAL_RUNES. Branch feature/gameplay-first-mvp2a.

1. Entrega 2B.2 fechada: runtime 88d3fc6256666038b0581c0674717cb20e45e79c,
   CI push 39311311231 / PR 39311319743 e deploy PASS, manifest e smoke público
   confirmados. Três treinos preservaram economia; hunt normal venceu o boss,
   sem erros/resíduos. Checkpoint posterior é só documentação [skip ci].
2. Não reimplementar runas, movimento, inventário/equipamento ou Helper. Fazer
   pre-flight e conferir SHA real. scripts/qa-training.mjs aceita base URL, SHA
   e label; scripts/qa-preview.mjs verifica a hunt normal, não o treino.
3. Próximo incremento: fixar revisão/data e fontes verificáveis do Tibia para
   magias/áreas/condições das três vocações existentes. Catalogar cooldowns
   individuais/grupos, range/LoS/facing/máscaras, mana, requisitos, condições e
   modificadores PvE/PvP. Não preencher valores não confirmados por memória.
   Preservar IDs/saves e arte original; testar no mesmo domínio antes de UI.
4. Passivas/Wheel em slice próprio, não apenas ícones/nomes. Paladin/Monk,
   Energy/Poison Field e regras de world type exigem etapas próprias. PvP online
   apenas após autoridade/rede; manter 2C→2D→2E→2F. Sem merge estável/Sites.

## Histórico — retomada anterior ainda sem gates verdes

# Próxima tarefa anterior — concluir gates/QA do treino 2B.2 — 19/10/2026

Manter feature/gameplay-first-mvp2a, sem Helper individual, merge ou Sites.
Núcleo de runas/movimento já implementado; não reimplementar. Ler TACTICAL_RUNES
e SESSION_CHECKPOINT. Nenhuma publicação desta etapa foi autorizada pelos gates.

1. pnpm health e revisar HEAD/diff. Ler a execução 66046 se ainda disponível;
   era a quarta tentativa de typecheck→unitários→build→36 E2E, fail-fast. Há
   timeouts de 5s em casos antigos; não aumentar limites ou enfraquecer asserts.
2. Comparação opcional, sem reset: node scripts/profile-grid.mjs 41477b9;
   pnpm exec vitest run src/control/GameplayPolish.test.ts -t "polished lifecycle scheduling"
   --config scripts/baseline-vitest.config.mjs (comando em uma linha). Apenas
   diagnóstico da versão antiga; nunca substitui o gate da implementação atual.
3. Finalizar pnpm typecheck, pnpm exec vitest run, pnpm build, pnpm exec playwright
   test --reporter=line --workers=1 e git diff --check. Não regenerar snapshots.
4. Reabrir playtest manual somente em nova sessão de Computer Use com URL
   confirmada. A ferramenta interrompeu a ação em 19/10; não tentar contornar
   com outro mecanismo de UI. E2E existentes continuam testes do repositório.
5. Somente com gates/QA verdes: commit/push normal, CI/Pages, manifest e smoke
   do SHA correto. Checkpoint WIP usa [skip ci] para não disparar deploy.
6. Depois: catálogo versionado de magias/condições das três vocações; passivas/
   Wheel em slice próprio. PvP online só após 2E; manter 2C→2D→2E→2F.

## Histórico — fechamento 2B.1

# Próxima tarefa anterior — playtest do MVP 2B.1, antes de Adventure

Branch `feature/gameplay-first-mvp2a`; contrato `GAMEPLAY_POLISH.md`. Leia
CURRENT_STATE/SESSION_CHECKPOINT para gates, CI e SHA real. Não reimplementar
controles, inventário, equipamento, loot/forja ou Helper individual.

1. Gates locais concluídos em 10/10: 216 unitários, 33 E2E, typecheck/build/diff
   e arte reproduzível. Diff revisto; push do código d51361c confirmado.
   Smoke compilado com version.json desse SHA aprovado no base path real.
2. CI push 38090057573 / PR 38090060114 aprovados, deploy Pages aprovado.
   version.json público = d51361c; smoke 1x→4x com vitória/19 kills/4240 XP,
   console limpo e lifecycle encerrado. Fechamento documental [skip ci] não
   altera o runtime publicado. Não aumentar timeouts/assertions ou regenerar
   snapshots para passar gates de futuras mudanças.
3. Playtest físico NumLock ON/OFF, com teclas de navegação e oito direções.
   Teste Edge de code/key já existe; o estado de um teclado físico não foi
   alternado por este ambiente. Colher aprovação da identidade/assistência e
   counterplay/balanceamento dos dois inimigos (arte ainda blockout original).
4. Perfilar picos de callback rAF (não FPS), com baseline comparável antes de
   alegar melhoria. Amostras e gaps estão no checkpoint. Só então planejar
   MVP 2C Adventure/mundo/NPC/quests; sequência 2B→2C→2D→2E→2F.
   Nenhum networking/PvP/campanha agora. Não fazer merge estável nem usar Sites.

Após os gates desta etapa, não repeti-los sem alteração de código; confirmar
publicação pelo SHA, não por parâmetro ?v. Mantido o swap pela reserva com mochila
cheia e saves atuais. Não limpar saves de usuário para validar cenas.

## Registro histórico — Mouse-first / Encounter Depth

## Ponto de continuação

Branch: feature/gameplay-first-mvp2a. Base: 58d97203a7666e1f5ed3d0a6040bc2d95c54ab38.
Execute fetch e pnpm health; confirme HEAD real. Leia SESSION_CHECKPOINT,
CURRENT_STATE, PLAYER_CONTROL, COMBAT_PRESENTATION e ARCHITECTURE.

Implementado: mouse-first, Auto/Manual/Assisted estritos, três slots reais,
HUD compacto, quatro papéis de monstros, direcionamento tático determinístico,
boss com fases/escombros temporários e pooling. Progressão local já presente no
worktree foi preservada e integrada. Não reimplemente estes sistemas.

## Próximo passo recomendado

**Preview publicado e verificado (30/09):** código `056a743bf9417edc7b29da0433e61e22023f1e4c`.
Com autorização explícita do usuário, foi adicionada somente a branch
`feature/gameplay-first-mvp2a` à allowlist do ambiente `github-pages`.
A branch anterior e todas as demais proteções foram preservadas.
Run `36526442306`, tentativa 2: deploy aprovado reutilizando o artifact validado;
`version.json` público confirmou o SHA exato. Nenhum merge ou envio a Sites.
Preview: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/
Smoke público em Auto/4x, Loop OFF: vitória em 47s lógicos, 17 mortes, 4.240 XP,
1.515 gold, 1 Boss Token; console sem erros/avisos. Zero overlap, out-of-bounds,
reservas pendentes, projéteis/efeitos/tweens residuais. O HEAD documental posterior
não muda o SHA da aplicação publicada. Gates: 167 unitários, 24 E2E e builds verdes.

1. Revisar a entrega no preview e colher aprovação da jogabilidade/balanceamento.
2. Manter a distinção entre preview compartilhado e site estável, não atualizado.
   Corridas E2E e fila do CI foram resolvidas; histórico em SESSION_CHECKPOINT.
3. Só então avançar MVP 1E: um objeto/NPC real e uma quest curta de exploração,
   usando comandos existentes e validação no domínio. Nada de inventário/rede gigantes.

## Limitações explícitas

- Câmera fixa; transformação suporta escala/letterbox, não pan/zoom interativo.
- Arte original de oito atores ainda é blockout; não copiar sprites externos.
- Botões de habilidade 1–3 são reais; use-with/drop/interact ainda sem resolver.
- Progressão/saldo locais são demonstrativos, não anticheat nem economia online.
- Balanceamento da nova IA precisa de playtest humano; stress não prova diversão.
- Helper individual permanece pausado, sem tocar sua branch.
- A publicação no chatgpt.site exige envio a origem Sites atualmente proibida.
  Não contornar por outro nome/URL. Preview Pages é o fluxo aprovado.

Gates: typecheck, Vitest, build, Playwright (um worker), diff --check e stress.
O ruleset desta entrega mudou intencionalmente: manter o novo baseline
determinístico, não tentar restaurar os resultados numéricos do MVP 1C.
Nenhum merge/force push. Atualizar checkpoint e confirmar push/HEAD.

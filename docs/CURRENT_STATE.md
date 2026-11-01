# Estado vigente — Roguelite Alpha implementada; publicação bloqueada —01/11/2026

## Atualização — A/B local autorizado concluído, sem fix ou novo CI

BackendSwiftShader reproduzido localmente;13amostras com mesma entrada de sessão
mantiveram1014eventos/entidades finais idênticos,16s/overlaps0. Completo software
12,933s→sem render5,442s;terreno contribui, máscara/efeitos não explicam tudo.
Cache de terreno só em memória reduziu15,6–20,8% em2pares; não prova CI resolvido
nem pixels idênticos. Quatro capturas Playwright5s falharam e foram preservadas;
par posterior com readback pós-métricas inspecionado, não é substituto do gate.
Comparação numéricaPNG bloqueada pela política de scripts,sem bypass.
Método/entradas/limites em RENDERER_AB_LOCAL.md. Fonteec42/testes/assets/CI intactos.
Só documentação atualizada;sem rerun/deploy/qualidade reduzida entregue.
Próximo passo proposto:otimização restrita do cenário estático, se autorizada,
com invalidação correta e gates/visual completos. PreviewAlpha segue bloqueado.

## Atualização — coleta Windows concluída, renderização software dominante

Usuário autorizou UMA coleta CPU/render. Branch isolada diagnostics/windows-cpu-profile-ec42,
commit83b2f35,run41329694126/job124916989158 FAILURE com artefato13093936077
preservado/hash conferido. Runtimeec42 intacto; sem instrumentação na feature,
sem retry de gate/deploy. Amostras curtas levam123,7/122,9s sem/com snapshots;
JS0,623/0,647s; processoGPU440,8/441,9sCPU. Renderer realSwiftShader/CPU,
4CPUs; evidência forte de gargalo gráfico nativo/software, efeito exato não
provado. Trêsloops timeout360s; inventário original assertions concluiu202,3s.
WarningsReadPixels preservados,sem pageerror. Limites do watchdog/coleta,
janelasCPU e comparação local descritos em WINDOWS_CPU_PROFILE.md.
PR ec42 FINAL FAILURE353unit/62E2EPASS/5timeouts/7notrun,deploySKIPPED.
Publicação continua bloqueada. Próximo A/B gráfico exige direção; nenhum
fix/retry novo iniciado. Registros abaixo são históricos, não estado vigente.

## Resultado atual — runtime ec42; push falhou; diagnóstico no runner exige decisão

Fonte ec42a20bbf11ccaa507818c6a5c1cc0f6827e942 enviada normalmente,local=origin/
CLEAN antes deste checkpoint. Nova CI push41283638985/job124780430857:
353unit/33files PASS;63E2E PASS/4timeouts/7nãoexecutados(1,1h). Novo teste HUD
e4Alpha E2E passaram remotamente. Deploy124794263515 SKIPPED. PR41283642777/
job124780442773 ainda em E2E nesta escrita;não cancelado nem contado como PASS.
Nenhum retry,novo fix especulativo ou publicação forçada.

O ganho local de HUD é real,mas não resolveu integralmente o gate remoto.
Artefato13075973127 preservado/hash verificado;quatro traces confirmam timeout
total220/360s antes de Close context. Três loops ainda em ciclo2;cenário tático
em boss;avanços250ms virtuais custam~1,9–2,4s de parede. No inventário,o último
click Knight inicia depois do fechamento,portanto não prova falha dessa aba.
Não atribuir causa última a CPU/GPU/driver/infra apenas com estes dados.

Próxima ação proposta:coleta temporária de perfil CPU/render no runner Windows,
mantendo assertions/deadlines/velocidade/permissões/proteções. Alteração da
coleta do CI e execução diagnóstica nova aguardam autorização do usuário.
Sem isso,não tentar novos reruns ou ajustes de gameplay/clock para esconder
o sintoma. PR pode concluir independentemente;não libera o push falho.
Detalhes HUD_PERFORMANCE_DIAGNOSIS.md;publicação Alpha continua bloqueada.
Manifest público reconferido:b9d0e3134dff5f47e3c76a3641767438c1f2749e,versão
anterior. Local compilado carimbadoec42 exato. Nenhum smoke público executado
contra o site antigo como se fosse a Alpha. Última leitura PR ainda E2E.

## Histórico desta continuação — gates locais não substituem CI

## Continuação autorizada — redução de redundância do HUD em validação

Usuário pediu continuar após47f50cb. Medição CDP isolada confirmou custo de
snapshots e DOM repetidos no HUD do laboratório; não reproduziu a causa última
dos timeouts de CI. Correção limitada a apresentação: refresh agrupado por
microtask, escritas idempotentes e Intl reutilizado. Domínio/input/Pixi/RNG/
velocidade/testes antigos/limites/workflows/arte/deps intactos.
Três amostras locais:JS1373–1550ms→574–642ms,parede9379–10106→8084–8603ms;
mesmos40s lógicos,overlaps0,console limpo. Não é FPS ou garantia de CI.
Ver HUD_PERFORMANCE_DIAGNOSIS.md para método, arquivos e limites.

Nova fonte: frozen install/typecheck353unit/33files PASS(96,79s),74E2E PASS
(11,6min),arte reproduzível/build/build:preview/diff PASS. Todos os5cenários
do push antigo passaram localmente, sem relaxamento. Novos3unit+1E2E protegem
agrupamento/reentrada/erro/DOM identity. Compilado real-clock Alpha PASS:
duas salas/22brasas→retirada11→forja8→saldo3/rank1/R,99sativos,console limpo.
Hunt compilada PASS24kills/4240XP/1540ouro/1token,overlaps/claims/cleanup0,
errors[]/warnings[]. PNGs HUD/vitória/refúgio inspecionados. Interação manual
assistida indisponível nesta rodada:conector de navegador falhou mesmo após
reset;sem contorno. Não confundir revisão de PNG/74E2E com nova partida manual.
Fonte ainda antes do novo commit; carimbo local de HEAD antigo não comprova
SHA da working-tree. Após commit/push normal, seguir NOVOS gates do runtime,
Pages/manifest/smoke. Não reutilizar o PR verde antigo como aprovação da nova
fonte nem repetir cegamente o job falho. Publicação permanece bloqueada.

## Histórico da rodada anterior — não são gates do ajuste de HUD

## Resultado remoto final desta rodada

Runtime2dea277811b4c5fe4cf3a95ce27f88723f0c084a, PR4 draft sobre a base de
gameplay. CI PR41269269697/job124738479668 SUCCESS:350unit/32files,
73E2E(1,0h),typecheck/arte reproduzível/build/build:preview/diff PASS.
CI push41269212360/job124738304396:350unit PASS, E2E61PASS/5timeouts/
7nãoexecutados(1,4h). Os4cenários Alpha passaram em AMBOS os jobs. Falhas
antigas de equipment(2),gameplay-shell,mvp0,tactical-consolidation impediram
o build/publicação desse push; deploy124754772262 SKIPPED. PR verde não
substitui o gate do workflow de publicação. Não houve rerun/fix de teste.

Artefato13070324721 preservado e hash verificado;5traces mostram timeout
total220/360s, teardown e fechamento de contexto antes do erro page closed.
Avanços de250ms chegaram a levar~3s. Causa última não comprovada; não concluir
regressão, infraestrutura ou GPU apenas pela diferença entre os jobs.
Diagnóstico em ROGUELITE_VALIDATION.md. Manifest público conferido após falha:
b9d0e3134dff5f47e3c76a3641767438c1f2749e, NÃO é a Alpha. Smoke público não
executado: não existe deploy aprovado2dea277. Preview público NÃO pronto.
Compilado local2dea277 e fluxo manual inspecionados; limites locais abaixo
continuam verdadeiros. Próxima ação: investigar timeouts, sem retry cego,
relaxar limites ou publicar por atalho. Nenhum monitor/automação reativado.

## Registro de implementação e validação local (preservado)

Novo pedido do usuário substitui o monitor antigo: fundação de action roguelite
manual sobre o código atual, sem recomeçar o projeto. Branch
`feature/roguelite-alpha`, base d14938ca33d3d48ae1fdeea44ef946f9b837edfc.
Entrada `alpha.html`; Hunt permanece em `index.html`. Ver ROGUELITE_ALPHA.md
e ROGUELITE_ART.md para arquitetura, escopo, fontes e limites.

Implementados Knight solo/Q/E/R desbloqueável,11salas, dois bosses, escolhas
temporárias, retornos/brasas permanentes/Forja I e Cronista por descobertas.
Três fundos originais ImageGen builtin. Sem backend/remote Sites/workflow novo.
Saves antigos preservados; namespace separado e checkpoint de sala.

Gates locais: typecheck/frozen install/arte nativa reproduzível/build/
build:preview/diff PASS.18unit Alpha PASS, jornada por comandos385750ms de
combate;4E2E Alpha PASS, inclusive boss real/vitória e clique no corpo visível.
Bloco serial mvp0+Alpha17/17 PASS(8,3min). Rodada completa anterior73E2E teve
71PASS/1falha/1nãoexecutado por reload Vite durante edição do agente, comprovado
no trace; o bloco afetado foi revalidado congelado sem alterar os critérios.

Última suíte unitária padrão346/348:dois timeouts5s em cenários antigos;
nenhum deadline/assertion/snapshot modificado. Os2testes de picking adicionados
depois passaram isolados; CI completo esperado350unit/73E2E. Não chamar a suíte
unitária local inteira de aprovada. Hashes de três Hunts evolutivas continuam
iguais ao commit-base. Build788módulos/maior chunk431,69kB, sem warning500kB.
Compiled smoke real-clock PASS, sem fixture/aceleração:duas salas e escolhas,
22brasas→retirada11→forja8→saldo3/rank1/R, caderno/pausa/um canvas,errors[]/
warnings[].100s ativos, PNGs inspecionados; não é vitória humana de10–15min nem
validação de SHA público. CI/deploy/public smoke ainda pendentes.
ROGUELITE_VALIDATION.md guarda resultados e limites, sem converter diagnóstico
em aprovação. Nenhum novo preview público deve ser declarado pronto ainda.

## Histórico SQM — não são gates da Alpha

## Diagnóstico atual — carga antecipada de38outfits confirmada;sem fix

Usuário autorizou investigar startup. Duas observações passivas,sem executar
smoke/combate:idle em4060,4ms frio/731,7ms recarga;após retorno de goto
2882,1/450,7ms. O preparing>5s anterior NÃO se reproduziu e causa específica
continua não comprovada. Não converter estas medições em aprovação do smoke.

Gargalo estrutural comprovado:SpriteLibrary aguarda todos48sprites,incluindo
38outfits mesmo com defaults. Trace dos workers confirmou38PNGs/4.679.730bytes
no frio e0bytes na recarga;eles bloqueiam idle. Sem erros observados nestas
duas medições,mas sem benchmark ou garantia. Detalhes STARTUP_DIAGNOSIS.md.
Proposta para autorização:carregar primeiro sprites necessários e demais
outfits sob demanda,sem alterar gameplay ou limites5s/500ms. Nada implementado.
Código/assets/testes/scripts/workflows intactos;somente diagnóstico/documentação.

## Histórico — smoke anterior permanece reprovado

## Atual — única reexecução do smoke falhou na inicialização

Usuário autorizou UMA reexecução de qa-training-team mantendo os limites.
Executada uma vez, isolada dos outros QAs desta rodada, URL/SHA b9d0e31,
label sqm-public-retry. EXIT1 em scripts/qa-training-team.mjs:14:64:
esperava data-session-state=idle, recebeu preparing por5000ms(14observações).
A falha ocorreu antes do clique500ms, da própria leitura de manifest do
script e do combate; não é reprodução comprovada da falha anterior de clique.
Manifest externo no preflight confirmou b9d0e31. Source/assets/tests/scripts/
deps/workflows iguais b9/f1200;HEAD1a2f949=origin/CLEAN antes deste registro.

Sem JSON final, trace ou screenshot dessa falha; console/economia/cleanup
finais não foram comprovados pelo smoke. Browser fechado em finally.
Pipeline parou:qa-outfits/qa-preview continuam sem execução pública.
Nenhuma nova tentativa, alteração de5s/500ms ou de código/testes foi feita.
Causa raiz não comprovada: preparing cobre inicialização do renderer e
carregamento de assets, mas não há evidência de qual etapa excedeu o tempo.
Próximo passo exige direção para investigação do carregamento, não novo
rerun automático. CI/deploy continuam aprovados; site publicado não equivale
a validação pública completa. Automação continua removida.

## Histórico — resultado da primeira rodada pública

## Resultado anterior — CI aprovado, mas validação pública incompleta

A única reexecução autorizada passou: run41125860437/job124455903967,
332unit(65,96s)/69E2E(57,8min), frozen/health/typecheck/arte/build/preview/diff.
Pages124468130514 SUCCESS. Checkout/health e version.json público confirmam
b9d0e3134dff5f47e3c76a3641767438c1f2749e. Esse checkpoint docs-only é equivalente
ao código f1200c4; source/tests/scripts/assets/deps/workflows não mudaram.

Smoke público obrigatório qa-training-team falhou em :59:26: clique no botão
training-warden excedeu500ms. O botão existia, visível/enabled/stable; o log
parou em performing click action. Causa raiz não comprovada, sem trace da
falha/JSON final/3vitórias; economia e cleanup finais não foram comprovados
por esse script. Nenhum timeout, assertion ou script foi alterado/repetido.
Pipeline parou: qa-outfits e qa-preview públicos não executados nesta rodada.

Evidência independente pública: drill manual/push1×/4×/Hunt/takeover/reset PASS,
body/logicaloverlap0/sync0/console limpo. É drill de movimento, não gate de
3vitórias: DruidKO na captura1×; treino4× encerrou com3derrotados. Geometria
4res×2modos19×11/semoverflow PASS, PNGs dos dois modos nas3res inspecionados.
Soak público iniciado antes da falha terminou PASS13Hunts/13tokens/partyviva,
290amostras body/logicaloverlap0/finalclaims0/consolelimpo;últimaHunt24kills/
4240XP1478gold1token. Não substitui os scripts obrigatórios ainda pendentes.
Histórico compilado verde não substitui os smokes públicos pendentes.

Preview publicado NÃO é entrega totalmente validada nem release estável.
Acompanhamento encerrado e automação removida; aguardar direção humana,
sem novos CI/smokes/fixes automáticos. Diagnóstico no workspace:
SQM_PUBLIC_SMOKE_DIAGNOSIS.md e sqm-public-training.log.

## Histórico — bloqueio anterior de CI, superado pela reexecução acima

## Resultado vigente — runtime f1200c4, sem novo deploy

Commit f1200c42d3c3450c5ac798e980b2f39285b8ef68 enviado normalmente; source
congelado. Local332unit/69E2E/typecheck/arte/build/build:preview/health/diff PASS.
Smokes compilados exactSHA PASS:3treinos/1231açõesbot/economia intacta/38outfits;
boss24kills4240XP1540gold1token;manual/push1×/4×;13Hunts consecutivas com13
bosses/recompensas/sessões,party viva,297amostras sem overlap lógico/corporal,
reservas finais0 e console/warnings limpos. Capturas4res×2modos inspecionadas.

CI PR41125868457/job124304105807 PASS332unit/69E2E(58,8min)/build/preview/diff.
CI push41125860437/job124304078404 FAIL:57E2E PASS,5timeouts,7nãoexecutados
(1,3h);unit332/typecheck/arte PASS. Deploy124338963135 SKIPPED. Artefato
13017156455 contém5traces;nenhuma reexecução ou fix automático foi iniciado.
Logs/checkout/health dos dois jobs confirmam f1200c4 exato. Testes afetados:
equipment(drop/equipar e painéis),gameplay-shell3loops,mvp0tokens e fluxo
tactical-consolidation. Três deadlines360s e dois220s,sem elevar limites.
Trace de inventário mostra timeout/After Hooks antes do erro ASSISTED vazio
com session closed;outros mostram clockRunFor250ms levando2,7–3,2s antes
de interromper. Isso não comprova causa raiz nem autoriza ignorar a falha.

Manifest público reconferido31/10:645267a7c30a8ff0209b061c6d460ff387892b34.
Portanto19×11/SQM/progressão NÃO estão publicados;sem smokes públicos novos.
Próximo passo depende de direção do usuário,sem rerun/cancel/fix automático.
Checkpoint posterior é somente docs [skip ci],não outro runtime.

## Histórico local anterior — substituído pelo resultado acima

## Pedido atual — janela19×11,corpos no SQM e Hunt progressiva

Usuário pediu somente+3–4SQMs horizontais,continuidade da câmera,respeito aos
SQMs ao andar/push,e confirmou QUANTIDADE E FORÇA progressivas na Hunt.
Contrato vigente:SQM_EXPANSION.md. Implementação registrada em f1200c4.
19×11(+4),mesmo tile aparente52,45/64,45/80,82px nas3res e câmera contínua.
48atlases medidos/envelope máximo30×30,sem corte;escala fixa poratlas/anchors
normalizados,bob/lean extra removidos,picking/hitArea alinhados ao corpo.
Grade/A*/MovementSystem preservados;diagnóstico inclui sobreposição em trânsito.
Produção strictCellMovement protege os dois cantos atravessados pela diagonal
apenas durante o passo,com reserva/commit/cancel existentes;cleanup inclui todas
as células. Reações de dano/ataque agora≤0,5px absolutos,sem lunge/shake acumulado.
Hunt opt-in5/6/8 e boss+4guardas=24kills;HP+0/2/4/6%,ataque+0/1/2/3% sobre
base do andar,reforços leves. Treino continua3bots;budget4240XP/1token intacto.
Gates locais finaisPASS332unit30files(63,89s),69E2E1worker(9,3min),typecheck,
arte reproduzível/build/build:preview/health/diff. Chunk581,61/581,66kBwarning
preservado. Novo SHA,smokes compilados/CI/manifest/públicos pendentes;645abaixo
é a versão pública anterior,não esta entrega.

## Histórico — entrega anterior645267a validada

## Atual — preview aprovado, não release estável

Runtime público645267a7c30a8ff0209b061c6d460ff387892b34;manifest reconferido
após CI. Push40076742272/job120821597914 PASS310unit/64E2E46,3min e Pages
120831302884SUCCESS. UMA reexecução PR explicitamente autorizada30/10:
run40076745331/job124190615051PASS310unit/27files,64E2E37,2min,frozen/health/
typecheck/arte/build/build:preview/diff/upload. Checkout/health6797981docs-only,
source/tests/scripts/assets/deps/workflows idênticos645. DeployPR124211142124
SKIPPED pela política normal;nenhum redeploy desnecessário ou nova tentativa.

Smokes públicos ORIGINAIS30/10,SHA645exato PASS:3vitórias manuais,1247açõesbot,
economia preservada,13cleanup0;38variantes de outfits/persistência/cosméticos;
Hunt19kills4240XP1489gold1token. Console/warnings[]/sync0/cleanup0. Drill público
adicional1×/4×/Hunt:drag distante/aproximação/push,taps/hold/diagonais/release,
troca de controle e reset PASS. Capturas públicas treino/atelier/Hunt e geometria
1366×768/1600×900/1920×1080 (+1902×978 referência) inspecionadas,sem overflow.
Ambos modos15×11,tiles52,45/64,45/80,82px (referência71,55px).

Readiness em dois contextos novos:idle3936/1807ms desde navegação,sem erros;
os smokes mantiveram5s original. Não reproduziu25s;causa última anterior não
comprovada,não atribuída automaticamente ao runner/rede. Nenhum fix especulativo,
timeout/assertion/snapshot alterado. Histórico de falhas abaixo preservado.
Latência pública keydown→movement_started:treino1×27–252,6ms;4×9–45,2ms;
Hunt1×40,8–228,9ms. Amostras instrumentais,não latência até pintura/FPS.
Callback público rAF médio2,31/2,45ms (1×/4×),máx144,3/64,1ms;não garantiaFPS.
Warning chunk577,24kB e limites de cores/diagonais/camadas continuam vigentes.

Usar ♙Outfits→escolher→Aplicar;selecionado Manual no treino,aliados Auto no
foco ofensivo explícito. Hunt mantém automação. Sem merge/forcepush/Sites/rede.
https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/?training=1&v=645267a7c30a8ff0209b061c6d460ff387892b34

## Histórico26/10 — bloqueios antes da validação30/10

## Retomada26/10 — publicado, mas entrega NÃO aprovada

Runtime645267a7c30a8ff0209b061c6d460ff387892b34 enviado por push normal e
confirmado em checkout/health do CI e version.json público. Push40076742272/
validate120821597914 PASS310unit/27files,64E2E(46,3min),frozen/typecheck/arte/
build/build:preview/diff;deploy120831302884 SUCCESS. PR40076745331/
validate120821607497 FAIL:54E2Epass,3timeouts,7nãoexecutados;310unitPASS.
Dois cenários de3loops chegaram a2ciclos antes360s; fluxo tático chegou ao
boss antes220s. Traces mostram clock.runFor250ms levando cerca2,4–3,0s reais
no final; fechamento por timeout precede erro session closed. Causa raiz NÃO
comprovada, não atribuir automaticamente ao runner nem ignorar gate falho.

Gates locais finais645 PASS310unit(83,44s)/64E2E(16min)/typecheck/build/
build:preview/health/arte/diff. QA compilado:3vitórias manuais,1330açõesbot,
economia intacta,38outfits,19kills4240XP1489gold1token. Soak14hunts/14bosses/
14recompensas,150069msativos1×/122706ms4×,console[]/warnings[]/sync0/cleanup0.
Picos amostrados723objetos/91VFX/update22,3ms; callback até324,5ms,nãoFPS.
Chunk577,19/577,24kB continua warning500kB,sem alterar o limite.

Smoke público de treino FAIL duas vezes no limite original5s:estado preparing,
não idle. Inspeção separada chegou idle aos25s,canvas presente,sem erros de
console/HTTP ou requests pendentes ao encerrar30s; NÃO equivale a smoke verde.
Não concluídos3treinos/boss públicos novos. Captura idle inspecionada,sem claim
de gameplay público aprovado. Sem fix/rerunCI/timeout aumentado/merge/force/Sites.
Próximo:diagnosticar readiness público e decidir tentativa única do PR;não
anunciar link como pronto. Histórico abaixo preserva o estado de cada etapa.

## Atual — implementação local, publicação nova pendente

Follow-up de gestos após e1fd205: magia/tecla nova cancela também drag ainda
não solto; release antigo não pode criar push tardio. Morte do foco encerra
ofensa, não libera held keys de movimento não relacionado. Sete E2E focados
PASS com o novo caso; suíte completa passa a64 e está em execução. Repetição
unitária concorrente teve2timeouts5s (308PASS), sem mismatch; será repetida
isoladamente, sem mudar deadline. Os gates310/63 abaixo são do ponto anterior.

Contrato canônico: TACTICAL_CONSOLIDATION.md. Janela15×11 comum, tiles32 lógicos,
treino36×18 independente de CSS; câmera/inversa/DPR/letterbox/picking/drag unidos.
Personagens/outfits.62 com anchors preservados; Hunt centrada nos SQMs reais.
Treino selecionado somente Manual, aliados Auto no foco explícito, bots AI.
Hunt preserva Auto/Assistido; inspeção não troca foco. Novas intenções cancelam
rota/approach/pré-commit. Push distante aproxima executor por A*, depois agenda
push adjacente normal, com snapshots/revalidação e nenhum destino reservado na
viagem. Hold manual250ms, AI220ms; não alegamos latência zero ou FPS garantido.

Entrada1293721=origin/CLEAN, runtime público74b confirmado, cobertura283/61.
Gates finais de source: frozen install/health/typecheck,310unit27files(137,41s),
63E2E(14,4min)/1worker, arte reproduzível, build/build:preview/diff PASS. Stress
Auto24/misto24/polished6 incluídos; nenhuma baseline regenerada. A/B contra
entrada1293721 preserva2868eventos/hash integral edcf9f6d…a554b em73/1000ms/batch.
Smokes reais de trabalho:3vitórias manuais em1×/4×,1214eventosbot,saves intactos,
13contadores cleanup0,errors[]/warnings[]. Ensaio prolongado ainda em fechamento.
Build principal576,95kB (preview577,01kB) mantém warning>500kB; sem mudar limite.
As evidências antigas abaixo NÃO validam esta consolidação. Sem push/deploy novo
confirmado ainda; o preview74b continua a versão anterior até manifest/smokes novos.

## Histórico encerrado — sprites MVP2C publicados

## Atual — sprites publicados e verificados —21/10/2026

Runtime74b3306d4ae17e43d182439fd5e79d8384479118 confirmado em checkout/health
dos CI e version.json público. Push39418552073/job118613470478 PASS283unit/
61E2E(59,7min)/build/build:preview/diff;deploy118641078023 SUCCESS. A primeira
validação PR falhou60/61E2E por timeout220s em inventário;trace mostrou contexto
fechando antes da assertion vazia,sem causa raiz comprovada. UMA reexecução
explicitamente autorizada:PR39418557264/novo job119043228558 PASS283unit25files/
61E2E(24,8min)/typecheck/frozen install/arte/build/build:preview/diff/upload.
DeployPR119051066711 SKIPPED por política;nenhum redeploy desnecessário.

Smokes públicos com SHA exato PASS:qa-outfits38variantes/4cardinais/persistência/
troca pausada sem estado alterado;qa-training-team3vitórias/1303eventosbot/
economia intacta;qa-preview boss19kills4240XP1489gold1token. QA complementar
Warrior2/Druid2/Mage2 passou3treinos e boss com saves/economia preservados nos
treinos,todos12contadores de cleanup0,errors[]/warnings[]. Capturas públicas
atelier/party personalizada no treino/hunt inspecionadas. Não houve fix,timeout
relaxado ou assertion ignorada. Originais/defaults preservados;usar♙Outfits,
escolher traje/addon e Aplicar. Preview compartilhado,não release estável.

38atlas/608poses RGBA448²(células112),12trajes×3níveis+2DLC,builtin ImageGen;
prompts/proveniência em OUTFIT_ART_2C.md. Addons compostos,não camadas;cores
seletivas/máscaras e diagonais dedicadas continuam pendentes. Chunk566,93kB
mantém warning>500kB;~30,5MB é estimativa de pixels,não benchmarkGPU/FPS.
Smoke público original:callback rAF médio5,08ms(1×)/8,53ms(4×),máximos260,1/
260,6ms;amostra instrumental isolada,não garantia de fluidez. Domínio intacto.
Link:https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/?training=1&v=74b3306d4ae17e43d182439fd5e79d8384479118

## Histórico — estados anteriores à publicação das sprites

## Atual — nova arte em gates locais

Continuação autorizada sobre2c7c89a:38atlas builtin imagegen reais importados,
12trajes com3níveis cumulativos e2DLC independentes. Todos com4cardinais/16poses,
RGBA448²/células112²/footpoint104,registro data-driven e mesmo relógio nativo.
Os sprites novos realmente trocam no mundo;3originais continuam disponíveis.
17E2E focados PASS(1,3min),incluindo12trajes/WASD/facing e hunt Warrior/Druid/Mage
novos até vitória,sem alterar combate. Gates locais integrais PASS:283unit25files,
61E2E(8,2min),typecheck/build/frozen install/arte/diff. Somente teste de captura
reforçado depois:17E2E(1,5min),PNG pausada precisa mudar sem alterar snapshot do
combate;imagem nova inspecionada. Runtime intacto. CI/deploy ainda pendentes;
runtime público6ff5b24 abaixo NÃO contém a nova arte. Ver OUTFIT_ART_2C.md.
Addons são atlas compostos,cores seletivas continuam pendentes de máscaras.
Sem tint global,economia nova,Adventure,backend,merge estável ou Sites.

## Histórico — fundação anterior

## Atual — preview2C publicado e verificado

Runtime público6ff5b24f15ede1d0b2981892dd91bc5abdb987c9,checkout/health do CI e
version.json exatos. Push39378261786/job118481194930 PASS279unit24arquivos/
48E2E(53,6min)/typecheck/arte/build/build:preview/diff;deploy118499012439 SUCCESS.
PR39378266572/job118481210536 também PASS279unit/48E2E(33,4min)/build/diff.
HEAD final local repetiu48E2E PASS(7,2min). Sem modificar timeouts/assertions.
Smokes públicos PASS:atelier com referênciaPNG1122×1402 decodificada,persistência,
troca cosmética sem alterar estado;3treinos1211eventosbot/economia intacta;hunt
boss19kills4240XP1489gold1token,errors[]/warnings[]. Cleanup zero;um tween
transitório no snapshot imediato foi reconferido em3treinos adicionais e todos
os contadores drenaram a0. Capturas públicas do atelier/personagem inspecionadas.
Registro final somente docs+QA [skip ci],não outro runtime;source do jogo intacto.

IMPORTANTE:fundação funcional com3sprites nativos aplicáveis e12REFERÊNCIAS.
Addons/DLC/paletas persistem,mas camadas animadas e máscaras dos12trajes novos
continuam PENDENTES. Paletas planejadas não recolorem assets atuais. Não declarar
spritesheets/direções/addons de produção inexistentes como concluídos.
Link: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/?training=1&v=6ff5b24f15ede1d0b2981892dd91bc5abdb987c9

## Histórico — validação local anterior à publicação

## MVP2C — implementação local, publicação ainda não confirmada

OutfitPanel compacto com12referências/3sprites originais aplicáveis,addons
cumulativos0/1/2,DLC Neymar/Mbappé,paletas5canais e save versionado por herói.
Aplicação cosmética no Unit existente,sem engine/economia/control/target/reset.
Os12novos trajes são ilustrações frontais:camadas animadas/cardinais/máscaras
PENDENTES. Paletas são salvas mas não recolorem imagens sem máscaras revisadas.
Fallback e “Paleta planejada” explícitos; sem facings inventados/tint global.
Ver OUTFITS_2C.md. Nenhuma nova arte gerada; referência1122×1402 intacta.
Gates locais até agora:typecheck,279unit24arquivos,frozen install,build PASS;
4novos E2E PASS,incluindo hunt personalizada até boss. Suíte integral48/48E2E
PASS(8,8min);CI/deploy/manifest/smoke2C ainda pendentes. Público2B.4 histórico abaixo.

## Histórico —2B.4 publicado

## Atual — preview público aprovado

Publicado a5be307b18ee3656143e945f0d34df9379f6c1d8 (checkout/health do CI e
version.json público coincidem). Este SHA é docs-only sobre o código1860ba8;
diff de src/public/tests/scripts/dependências/workflows vazio. Reexecução única
autorizada do push39364771626: job118457324904 SUCCESS,258unit/44E2E(30,5min),
typecheck/build/build:preview/arte/diff; deploy118466631698 SUCCESS. PR39364777345
também aprovada. Não houve alteração de código, assertions, timeout ou workflow.
Smokes públicos existentes com SHA exato PASS:3vitórias de treino,1224eventos de
bots,economia intacta; hunt boss19kills/4240XP/1489gold/1token. Console sem erros
ou warnings; cleanup sem resíduos, overlap/OOB/reservas/projéteis ativos zero.
PNG mvp2b4-public-final-arena.png inspecionado: arena ampla,6atores,nomes/barras
e dock1–9 legíveis. Preview compartilhado, não merge/release estável/PvP online;
OTSP não integrado. Encerramento somente docs [skip ci], sem novo build.
Link: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/?training=1&v=a5be307b18ee3656143e945f0d34df9379f6c1d8

## Histórico — bloqueio anterior à reexecução autorizada

Publicação ainda bloqueada (20/10): runtime1860ba8 tem gates locais verdes e
PR CI258unit/44E2E/build PASS, mas push CI43/44E2E falhou na matriz de inspeção
equipment.spec.ts:74/95 com timeout220s/session closed/valor de select vazio.
Não é a antiga falha da segunda hunt, que foi corrigida. Causa da divergência
ainda não estabelecida; nenhum timeout/assertion/código foi modificado pelo
monitor. Deploy SKIPPED, manifest público ainda bbd0fac. Acompanhamento pausado
aguardando direção. Detalhes/runIDs/continuação em SESSION_CHECKPOINT/NEXT_TASK.

Correção autorizada em20/10: o timeout de equipamento era uma derrota real da
segunda hunt, não apenas lentidão. Abas do inventário chamavam seleção de herói
de combate e assumiam Manual no Druid. Agora a inspeção tem estado separado,
sem comandos/modos/seleção de combate; abrir começa no herói da HUD. Testes novos
mantêm todas as assertions e verificam os3modos/foco/vitória após reload/forja.
Gates finais em execução; não anunciar publicação antes de CI/manifest/smoke.
Pacote OTSP real foi recebido depois da pasta vazia descrita abaixo, identificado
como arte comunitária declarada CC BY4.0, mas NÃO integrado nesta correção.

Aplicação local: dock 1–9 unificado, descrição lateral removida, arena clara com
todos os tiles amarelos ligados ao GridMap (largura por sessão, sem fake floor).
Seleção assume Manual somente no selecionado, companheiros Auto. Três bots de
vocação com foco por HP, movimento, magia/cura/runas reais e pixel art própria.
Sem alterações de economia/equipamento/forja nem rede. TRAINING_2B4.md descreve
contratos, fixtures e limites. assets_rtc indicada contém zero arquivos; sprites
Tibia NÃO foram integradas. Gates/publicação efetivos: SESSION_CHECKPOINT.md.
O público anterior bbd0fac NÃO é esta revisão. Não anunciar nova publicação sem
CI/deploy/manifest/smoke corretos. Próxima ação: finalizar gates, não outro sistema.

## Histórico — incremento 2B.3 publicado — 20/10/2026 UTC

Implementado e validado local/público: quatro runas por 4–7, push por 8/arrastar e Stop por 9 no treino;
três heróis com pixel art própria maior, sem zoom, mira de tile independente do
sprite. Perfil de nove magias de referência, Heal Friend ally-only e Mana Buffer
dos magos; hunt normal/saves preservados. TRAINING_2B3.md define regras/fontes e
limites. ART_PROMPTS.md registra o modo builtin e fontes/atlas. Não é PvP online
nem Wheel completa. Após confirmação do usuário, left-drag ganha prévia dos
vizinhos autorizados (não distância7); tecla8 continua alternativa. 251 unitários/
40 E2E PASS local e CI. Runtime publicado bbd0fac90bbc5ba27be4c9189f36513e1d59ee93:
CI push39347671213 e PR39347675576 aprovadas, deploy118395034330 aprovado e
version.json público conferido. Kit público passou: runas, cura, pausa/reset,
dois pushes e sete destinos no fixture diagonal, sem movimento durante holding.
Três treinos públicos venceram sem alterar saves econômicos; console/cleanup
limpos. Evidências completas e hunt até boss: SESSION_CHECKPOINT.md.
Checkpoint posterior altera somente documentação/tooling de QA, não o runtime.
Preview compartilhado, não merge/release estável:
https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/?training=1&v=bbd0fac

## Histórico — MVP 2B.2 publicado

Treino local Party × Bot em ?training=1, no mesmo motor, Manual inicial e sem
recompensas persistentes. Magic Wall/Fire Field por 4/5 + clique, com cargas,
exhaust, range/LoS, terreno e burning de domínio. Quinas dinâmicas revalidadas
no treino; inversão por tecla recente sem fila. Sprites próprios preservados.
Não é PvP online nem conversão completa de magias/passivas/Wheel do Tibia.
Contrato e fontes: TACTICAL_RUNES.md. A* original foi mantido após experimento
não benéfico; batch run evita cópias incrementais descartadas, sem mudar eventos.

Gates locais aprovados na retomada: 231 unitários, 36 E2E, typecheck, build e
diff --check. Instalação frozen e arte reproduzível aprovadas. LoS passou a
percorrer o supercover sem arrays/Set descartados; mesmos hashes e regras,
paredes/unidades revalidadas em cada chamada. Não foram elevados timeouts.
Runtime publicado: 88d3fc6256666038b0581c0674717cb20e45e79c. CI push
39311311231 e PR 39311319743 aprovadas (231 unitários/36 E2E); deploy Pages
aprovado e version.json público confirmado. Smoke público de runas/três treinos
sem alteração econômica e hunt normal 1x→4x até o boss: PASS, console e cleanup
limpos. Preview compartilhado: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/?training=1
O checkpoint documental posterior [skip ci] não muda o runtime publicado nem
representa novo build/merge estável. Detalhes: SESSION_CHECKPOINT.
Playtest via navegador real automatizado, com inspeção das imagens; não equivale
a teste de teclado físico. Computer Use nativo não foi contornado após a
interrupção registrada na sessão anterior. Ver SESSION_CHECKPOINT/NEXT_TASK.

## Histórico — entrega anterior publicada em 10/10/2026

# Estado anterior — MVP 2B.1 — retomada 10/10/2026

Implementação na branch `feature/gameplay-first-mvp2a`, sobre 7062c5d (código
anterior 8e2a309). Controles físicos separados Digit/Numpad, slots estáveis por
herói, Assistido com Auto Attack/Auto Magias independentes e HUD compacto em
screen space. O mundo mantém o viewport dominante e as passivas continuam visíveis.

Projéteis diretos são linhas contínuas entre pontos autorizados; supercover
serve para colisão, não animação. O ruleset 2B.1 usa ponto original, sem homing:
alvo que abandona o tile provoca cancelamento, não teleporte/dano fantasma.
Movimentos e impactos comprometidos resolvem nos prazos lógicos, entre decisões
de 250 ms; uma única amostra de input por decisão. Pausa/velocidade compartilham
esse relógio. O ruleset antigo permanece para regressões determinísticas.

Dois reforços originais: Bastião de Bronze e Balista Errante, com ataques
anunciados e recuperação. Roster 5/5/6/3, sem inflação de XP/loot pelos reforços;
IDs e RNG de recompensas existentes preservados. Inventário/forja/equipamentos
não foram reimplementados; troca da reserva com mochila cheia preservada.

Auto Druid recupera posição válida de cura quando LoS bloqueia um aliado ferido,
antes da ofensiva. O terceiro loop progressivo não pode sacrificar um herói por
esse bloqueio. Assistido não recebe movimento oculto; usa a posição do jogador.

Contrato detalhado: `GAMEPLAY_POLISH.md`. Gates, métricas, limitações e SHA
servido: `SESSION_CHECKPOINT.md`. Sequência permanece 2B → 2C → 2D → 2E → 2F.

Código da etapa: `d51361c0b822fa69d1e23d36ffd7e5b207c03462`, push normal para
origin confirmado. Gates locais: 216 unitários e 33 E2E; build de preview também
validado no base path real. CI push 38090057573 / PR 38090060114 aprovados,
deploy Pages aprovado e version.json público confirmado em d51361c. Smoke
público 1x→4x terminou em vitória, sem erros/resíduos. O fechamento documental
posterior não muda esse SHA de runtime; não confundir preview com release estável.

## Histórico — MVP 2B

# Estado vigente — MVP 2B — 05/10/2026

Implementação local validada em 05/10 na branch `feature/gameplay-first-mvp2a`:
184 unitários, 28 E2E, TypeScript/build/diff aprovados. A correção posterior a
dca5339 permite equipar diretamente da reserva mesmo com mochila cheia.
Publicação e CI: ver SESSION_CHECKPOINT.
Inventário local com 24 espaços, materiais em stacks de 99 e reserva sem descarte;
seis armas, duas armaduras e um material originais. Drops vêm do domínio em RNG
isolado, com IDs persistentes e recibos contra replay. Equipar/forjar somente
entre hunts com Loop OFF. Forja +1 custa 200 gold e uma Brasa do Templo.
Stats de nível e equipamento são calculados no domínio, também usado pela UI;
trocas não acumulam bônus nem recuperam HP/mana. XP, preferências e Boss Tokens
anteriores são preservados por migração aditiva. Save inválido não é apagado.

UI: drawer por herói, comparação, slots reais, forja, reserva, relatório com
drops reais, feedback compacto de Loop. Inputs do mundo bloqueados no drawer.
Polish focado em identificação da party, contraste de HP e comparação legível;
sprites existentes preservados. Contrato: `EQUIPMENT_AND_LOOT.md`.
Gates/ponto exato: `SESSION_CHECKPOINT.md`. Sem backend, comércio, descarte,
drag-and-drop, novos slots ou economia online. Roadmap vigente: 2B–2F.

## Histórico — Mouse-first + Encounter Depth — 26/09/2026

Branch feature/gameplay-first-mvp2a, base 58d9720. Este resumo substitui as
descrições históricas abaixo quando divergirem.

- Mouse: chão MoveTo, entidade seleção, direito engage, dois botões Look sem
  ações duplicadas. WASD e 1–3 mantidos; nenhum menu Attack/Follow/Stop no HUD.
- AUTO autônomo; MANUAL só ordens explícitas; ASSISTED aguarda alvo, usa rotação
  até sua morte e então para. Seleção não muda controller.
- Mundo domina a tela, party mínima e três slots reais com cooldown lógico.
  Análise/loot ficam em drawers; configuração de habilidades continua disponível.
- Quatro perfis originais: Custódio, Vigia, Garra e Oráculo. Ranged busca LoS/
  distância; flanker procura backline; caster pontua máscaras e candidatos
  determinísticos a cada 1500 ms lógicos.
- Regente Vazio tem fase abaixo de 50% HP e Queda da Coroa: aviso especial,
  impacto, escombros reais por 3000 ms, revisão de navegação e restauração.
- Magias comuns não pintam pretelegraph; magia de jogador mantém projétil/
  wave/impacto próprios. Apenas requiresTelegraph habilita aviso antecipado.
- Arte aprovada preservada; oito atores originais, novo relevo do templo e
  pools de efeitos animados. Build exclui cópias legadas, sem apagar fontes.
- Progressão XP/nível/passiva e store local da etapa anterior preservados.
- Novas regras alteram baseline Auto intencionalmente; repetibilidade completa
  em 24 combinações substitui comparação aos antigos hashes (preservados no Git).

Typecheck, 167 unitários, 24 E2E e build aprovados; evidências e publicação
consolidados em SESSION_CHECKPOINT. Não há backend, inventário real ou PvP.
Não confundir preview Pages com a referência estável chatgpt.site.

---

# Histórico — Consolidação visual e estrutural — 20/09/2026

Branch feature/visual-identity-foundation, base validada 64816ac. Motor e grid
inalterados; main.ts cria a sessão e PlayerControls usa PlayerControlPort.
Seis blockouts originais, quatro facings/seis ações e quatro pisos próprios
carregam via manifesto. Footpoint, sombras, seleção e offsets estão coerentes;
efeitos/projéteis param seus frames na pausa. Arte final e efeitos/ícones
originais ainda pendentes. Conceito ImageGen separado do runtime.

Pipeline de preview GitHub Pages adicionada ao repositório. Acesso Sites é
válido, porém o envio obrigatório ao repositório próprio conflita com a regra
contra remote sites. Nenhum envio a essa origem foi feito. O site estável
chatgpt.site permanece na versão anterior. Evidência final em SESSION_CHECKPOINT.

O histórico abaixo registra os marcos anteriores e suas limitações na época;
para a situação vigente, prevalecem este resumo e o checkpoint mais recente.

# Estado atual — MVP 0 até MVP 1D

## Takeover de 19/09/2026 — controle manual integrado

O HEAD de entrada `ed23459` continha apresentação funcional, mas não continha
PlayerController, ownership, comandos ou execução ao vivo. Portanto o MVP 1D
combinado estava **funcional porém incompleto**; a continuação permaneceu em
`feature/combat-presentation-astra`, sem iniciar uma branch 1E.

Agora existe um vertical slice Manual + Auto sobre o mesmo motor incremental:
WASD/setas/diagonais, ownership AI/Manual/Assistido por ator, seleção, ataque,
follow, stop, Look contextual e casts pela barra existente. A apresentação
estabilizada foi reutilizada; os 24 resultados Auto do HEAD de entrada são
protegidos por hashes completos. Use-with/drag possuem state machine e comandos,
com rejeição explícita enquanto não houver inventário real.

Gate final: typecheck, **145 testes**, build de **745 módulos**, **19 E2E**
(incluindo três loops/três resoluções) e diff --check aprovados. Stress misto de
24 hunts: 23 vitórias/uma derrota real; zero falhas de integridade.

Próximo gap: MVP 1E com exploração e interação concreta de mundo/NPC/quest,
sem antecipar inventário gigante, servidor ou PvP. Arte cardinal completa ainda
é pendência visual. Ver `docs/PLAYER_CONTROL.md` e checkpoint para evidências.

## MVP 1D — Combat Presentation & Visual Fidelity

- `CombatPresentationSystem` separa estado visual temporário do motor lógico.
- Movimento usa `movement_started/completed/cancelled`, durações lógicas e
  termina exatamente no centro do tile, sem drift.
- Facing cardinal acompanha movimento, alvo, cast e ataque.
- Estados visuais cobrem windup, ataque, recovery, cast, reação, cura,
  dodge, morte e idle.
- Melee possui lean, trace, impact e recovery sem invadir outro tile.
- Projectiles percorrem exatamente `pathTiles` entre `startedAt` e `impactAt`.
- Waves e telegraphs usam somente as máscaras lógicas emitidas pelo MVP 1C.
- Damage, critical, heal e dodge possuem feedback distinto e stacking.
- Footpoint, sombras e y-sort determinístico mantêm box, frontline e backline
  legíveis.
- Nomes, HP e mana ficam em uma camada acima dos efeitos.
- Pause, 1x, 2x e 4x usam o mesmo relógio lógico.
- Pools reutilizam floating texts, projectiles, telegraphs e impactos simples.
- Debug compara tile lógico, footpoint, bounds, facing, estado, progresso,
  target, y-sort e máscaras, e mede o custo da apresentação.
- `AnimationSet` prepara a troca futura por sprite sheets próprios.
- Helper individual permaneceu pausado; motor, inventário, equipamentos,
  backend, merge e publicação não foram alterados.

Consulte `docs/COMBAT_PRESENTATION.md` para a especificação permanente.

### Evidência do MVP 1D — 19/09/2026

| Validação | Resultado |
|---|---|
| TypeScript | zero erros |
| Vitest | 124 testes em 9 arquivos |
| Apresentação isolada | 33 casos aprovados |
| Build | 741 módulos, aprovado |
| Playwright/Edge | 15 cenários aprovados em 4,6 min no gate final |
| Manual | uma hunt completa em 1x, 2x e 4x |
| Loop | 3 ciclos sem duplicação |
| Integridade visual | sync 0 px, masks 0, overlap 0, resíduos 0 |
| Console | zero erros e warnings |
| Merge/publicação | não realizados |

## MVP 1C — Authoritative Grid Combat

- Entidades possuem `tileX`/`tileY` inteiros e exclusivos.
- `GridMap` contém limites, obstáculos, custos e footprints.
- `OccupancyGrid` impede overlap, reserva conflitante e head-on swap.
- Movimento ocorre em duas fases: origem ocupada e destino reservado por 220 ms
  lógicos até `movement_completed`.
- Spawn conflitante procura deterministicamente o tile livre mais próximo.
- A* determinístico move em oito direções sem cortar quinas.
- Knight, monstros e conjuradores usam o mesmo `MovementSystem`.
- Morte, fim de sala e reset cancelam movimentos, projéteis e hazards pendentes.
- Alcance corpo a corpo, de cura e magia é resolvido na grade.
- LoS usa supercover; projéteis possuem trajetória, `castId`, `sessionId` e
  `impactAt`, sem dano antes do impacto.
- Reachability precede o score, destinos falhos recebem cooldown e A→B→A
  injustificado é impedido.
- O aggro inicial limita formalmente a backline a dois atacantes.
- Waves, círculos e Challenge usam máscaras lógicas deduplicadas.
- Magias de monstros unem telegraph e impacto por `castId` e máscara idêntica.
- PixiJS apenas interpola e exibe eventos autoritativos.
- Obstáculos são visíveis; `?debug=1` mostra ocupação, reservas, caminhos e
  máscaras.
- `HuntResult` expõe métricas de pathfinding e recuperação.
- Helper individual permanece pausado e sua branch foi preservada.

Consulte `docs/GRID_COMBAT.md` para a especificação permanente.

### Correção final pontual — 07/08/2026

- Conjuradores deixam um tile sem LoS por meio de firing-position resolver
  determinístico e alcançável.
- Ausência de progresso possui tentativa de recuperação e encerramento
  explícito por stalemate; não existe mais sucesso implícito ao atingir o cap.
- `floor_complete` diferencia `victory`, `party_defeated`, `stalemate` e
  `turn_limit`.
- Movimentos pendentes revalidam terreno, ocupação e reserva antes do commit.
- Revisão da grade inclui mudanças do mapa e da ocupação.
- Métricas separam falhas gerais, sequência geral, sequência exclusivamente
  `no-route` e recuperações de firing position.

| Validação final | Resultado |
|---|---|
| TypeScript | zero erros |
| Vitest | 91 testes aprovados em 8 arquivos |
| Build | 739 módulos, aprovado |
| Playwright/Edge | 13 cenários aprovados em 4,9 min |
| Stress | 24 hunts; seeds 803–814; duas configurações |
| Seed 811 sem energy wave | vitória, 274 turnos, 71.100 ms, 2 recuperações |
| Integridade | zero deadlock, overlap, out-of-bounds, stale ou resíduo |
| Publicação/merge | não realizados |

### Evidência do MVP 1C — 06/08/2026

| Validação | Resultado |
|---|---|
| Instalação | lockfile aprovado |
| TypeScript | zero erros |
| Vitest | 79 testes aprovados em 7 arquivos |
| Build | 737 módulos, aprovado em 5,70 s |
| Playwright/Edge | 13 cenários aprovados em 4,2 min |
| Loop | 3 ciclos auditados |
| Grade | zero overlaps, zero fora da arena e zero reservas órfãs |
| Casts | zero impacto tardio e zero resíduos de projectile/telegraph |
| Debug manual | boss derrotado, 17 kills e zero erros de console |
| Publicação | não realizada |

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

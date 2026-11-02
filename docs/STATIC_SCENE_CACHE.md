# Cache do cenário estático — implementação autorizada, 01/11/2026

02/11: candidato local de desenho sob demanda em IDLE_RENDER_AND_DOM.md.
Cache continua integral; contexto WebGL restaurado invalida sua textura e a
cena. Não muda orçamento, sampling ou cadência ativa. Os gates anteriores54
abaixo não aprovam automaticamente esta nova fonte.

Investigação posterior02/11:21amostras locais da fonte54 em
[RESIDUAL_RENDER_COST.md](RESIDUAL_RENDER_COST.md). Custo de apresentação e
composição persiste; nenhuma layer isolada ou remoção CSSmotion resolveu a cena
completa. Não é fix/gate novo; os dois CIs abaixo continuam falhos.

## 01/11 — CI do cache encerrado: publicação bloqueada

Fonte/runtime `54f9a695a825e6e55968f1fe50d9a5fe263b9b6d`.
Push41340601548/job124949570821 e PR41340605212/job124949581900:
**FAILURE**, ambos363unit/34files PASS;67E2E PASS/4timeouts/7nãoexecutados(1,3h).
Os4E2E novos do cache e4Alpha passaram em ambos. Frozen install/health/
typecheck/arte/art-diff PASS; builds/build:preview/diff finais não executados.
Deploys124970114637/124969909312 SKIPPED. Não há publicação nova aprovada.

Artefatos13100006520/13100096094 preservados, SHA256 conferidos;8traces analisados.
Cache estava ativo,1rebuild nos loops;250ms virtuais ainda custavam~2,0–2,6s
parede. Loops pararam em2ciclos e cenário tático no boss. Timeout total precede
teardown; vazio/sessionclosed não prova bug de seleção/crash. Causa última
remanescente não comprovada; ganho local não resolveu o gate completo.
Diagnóstico: [STATIC_CACHE_CI_DIAGNOSIS.md](STATIC_CACHE_CI_DIAGNOSIS.md).
Manifest público continua versão anterior b9d0e31; não houve smoke público contra
build antigo, retry, fix, deploy forçado ou mudança de gates. Histórico local
362/363unit e78E2E PASS permanece distinto dos resultados remotos.
Próximo passo exige direção para investigação dirigida, não retry cego.
Entradas anteriores abaixo são histórico, não CI pendente atual.

## Escopo

Cache apenas da base estática da Hunt e do treino, no renderer existente.
CombatEngine, RNG, input, grade, câmera19×11, sprites, Alpha, economia, assets,
dependências, workflows, assertions, snapshots e deadlines permanecem intactos.
Não é uma migração de engine nem uma correção comprovada de todos os timeouts.

`StaticSceneCache` é uma política de apresentação sem Pixi/DOM no domínio.
`static-terrain` contém piso, moldura, grade, atmosfera, obstáculos fixos e relevo.
Runas, seu fade, escombros temporários e debug permanecem fora do cache, na
mesma ordem visual. Personagens, sombras, projéteis, UI e efeitos continuam vivos.

## Resolução, invalidação e descarte

- Resolução do cache = escala da câmera × resolução atual do renderer;
  nearest/sem antialias, sem reduzir a qualidade para caber em memória.
- Pan altera somente o transform do pai; não torna pixels locais estáticos
  inválidos. Mudança de escala/resolução recria o cache. Revisão de conteúdo
  ou mudança dos seus bounds invalida a textura; invalidações são agrupadas.
- A base atual é montada uma vez por sessão. Mudanças reais de terreno são
  siblings dinâmicos e não congelam no cache. Não armazenar runas/fades juntos.
- Orçamento considera backing power-of-two usado pelo Pixi:4096por dimensão,
  8.388.608pixels. Se excedido, usa o renderer original em resolução integral.
  DPR2/1920 é coberto como fallback, não uma imagem reduzida silenciosamente.
- Aproximadamente32MiB RGBA por backing no limite; não inclui attachments,
  overhead ou texturas retidas pelo pool Pixi. Não é medição de picoVRAM/FPS.
- Descarte idempotente desabilita o render group/cache e devolve sua textura
  ao pool da biblioteca antes de destruir o app. Não limpa pools globais de
  outras sessões nem destrói assets compartilhados.
- A opção de construtor `cacheStaticTerrain:false` é referência para regressão
  visual; produção usa true. Nenhum controle novo foi adicionado à interface.

## Testes reais da fonte congelada

Frozen install/typecheck PASS. Arte reproduzível sem diff de assets;
build/build:preview PASS,790módulos,maior chunk431,74kB. Diff-check PASS.

10unit novos PASS: resolução, pan sem rebuild, invalidação agrupada/bounds,
resize/DPR, orçamento padded, fallback integral, dados inválidos e descarte.
4E2E novos PASS e incluídos no full78E2E PASS/11,4min/1worker:

- Hunt e treino contra renderer sem cache,1366/1600/1920,3posições de câmera:
  18pares, mesmo estado/domínio, pixels não pretos e tolerâncias previamente
  fixadas(meanRGBdelta≤1,5; fração maxRGBdelta>24≤0,005). Não são screenshots
  regenerados ou alegação de identidade bit-a-bit.
- Runas/escombros realmente desenhados/removidos fora do cache; destruição dupla.
- DPR2 preserva buffer completo; fallback no orçamento e recuperação ao resize.

Comparação numérica aqui usa Canvas2D no próprio teste de integração e frames
vivos. O script PowerShell de comparaçãoPNG anteriormente bloqueado continua
sem execução/bypass ou mudança de política. PNGs de Hunt/treino1920 inspecionados.

### Falha preservada — suíte unitária NÃO está totalmente verde

Dois full363unit/34files:362PASS/1FAIL,144,78s e124,57s. Mesmo teste antigo
`HuntPressure.test.ts:61`, três Hunts evolutivas, timeout original5000ms
(primeiro5134ms). Arquivo isolado10PASS, caso4992ms. Não conta como fullPASS.
Nenhuma assertion/deadline foi alterada. Domínio/control/events/app/data têm
diff vazio contra ec42. O teste não importa o renderer novo. Não atribuir causa
última ao ambiente só com isso, nem corrigir o combate fora deste escopo.
Histórico completo e falha seguem explícitos; não repetir até obter verde.

## Desempenho medido da implementação, não do protótipo

Helper workspace `renderer-ab-local.mjs`, modo candidate com hashes dos três
arquivos de runtime, mesmas entradas/ID de sessão controlados. Essa instrumentação
é diagnóstico separado, NÃO um smoke de aceitação/público. Fonte da medição é
a mesma do full78E2E. Backend nativo IntelUHD versus software SwiftShader,
contextos separados,1366×768,sem snapshots. Sem mudanças de segurança/sandbox.

| Par | Sem cache→com cache,parede | CPU processoGPU | DrawElements |
|---|---:|---:|---:|
|16s lógicos,nativo|3,066→3,030s(~1,2%)|1,459→1,424s|1720→1283|
|16s lógicos,software|4,103→3,930s(~4,2%)|37,160→34,552s|1552→1104|
|40s lógicos,software A|14,861→9,381s(~36,9%)|146,890→85,299s|3830→2661|
|40s lógicos,software B,ordem inversa|14,440→9,364s(~35,1%)|142,823→86,843s|3830→2661|

Todos os pares têm eventos completos/entidades finais idênticos e overlaps0.
16s:1014eventos,hash6ba9633ae0b25f7fe82bdc65ed1f6f56e28135fbacb06dd83ae2e11484c75a54.
40s:2718eventos,hash7e2e492b155b35e87ac9608076a42bad853abe51a6ed4f488048cba4b11215a5.
Raw em renderer-ab/implementation*,análise renderer-ab/analysis.json,workspace.
Sem pageerrors; queueSerial warnings preservados nas amostras40s sem cache.

Não esconder o pequeno ganho da amostra16s, nem comparar máquinas/horários
como um A/B. n=2pares40s, ordem contrabalançada, sem inferência estatística.
CPU soma threads; máquina local12CPUs não é runner4CPUs. Não é FPSbenchmark,
prova do shader exato ou garantia de que o CI completo terminará no deadline.

## Smokes compilados

Scripts originais, sem fixtures, real-clock, build congelado working-tree:

- qa-training-team:3vitórias/1184açõesbot/economia intacta; errors[]/warnings[],
  reservas/campos/pushes/projéteis/claims/cleanup finais0.
- qa-outfits:38variantes aplicadas; errors[].
- qa-preview:boss24kills/4240XP/1540ouro/1token; errors[]/warnings[],cleanup0.
- qa-roguelite:costa/2encontros/escolhas/22brasas→retirada11→forja8→saldo3,
  rank1/R,save sem run,errors[]/warnings[]. Não é nova vitória humana completa.

Logs/JSON/hash de fontes em workspace static-cache-evidence/compiled-smokes/.
IMPORTANTE: build précommit tem carimbo b4a37eb,mas fonte working-tree nova;
isso foi registrado explicitamente, não contado como identidade do runtime b4a.
Depois do commit, carimbar o MESMO bundle com novoHEAD, conferir hashes de assets
inalterados/manifest exato e repetir outfits/Hunt com SHA completo antes do push.
PR4 guarda essas confirmações póscommit e os IDs/status da novaCI.
Nenhum smoke público foi substituído por essa validação local.

## Publicação

Implementação local testada e documentada, mas gate unitário local continua
falho. Envio normal em PR4draft não é aprovação de release. Nova fonte exige
CI padrão363unit/78E2E/arte/builds/diff; não reutilizar os jobs falhos de ec42,
rerun antigos, mudar proteções/deadlines ou forçar Pages. Congelar HEAD durante
CI/deploy porque o checkout usa branch viva; verificar checkout/stamp real.
Só aprovar preview após gates/deploy e manifest/smoke público exatos.
Preview não é release estável; remoteSites/merge/force continuam proibidos.

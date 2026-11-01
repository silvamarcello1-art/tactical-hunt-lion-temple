# Renderer — A/B local autorizado — 01/11/2026

## Resultado

A/B diagnóstico concluído, sem editar runtime, assets, testes, dependências,
workflows ou gates. Não houve CI, rerun, deploy ou fix de produção. A fonte
permanece `ec42a20bbf11ccaa507818c6a5c1cc0f6827e942`; checkout inicial
`3fca848d147020d8d6211ed0d072ab76bee9ca74`, local=origin/CLEAN.
Este relatório complementa WINDOWS_CPU_PROFILE.md; não substitui seus gates.

O backend software reproduz parte da lentidão localmente. Remover todo desenho
tem grande efeito; remover máscara, efeitos ou esconder o canvas não identifica
um único culpado. Cache experimental de terreno reduziu15,6–20,8% da parede
em duas comparações, mas não demonstra correção do CI ou identidade visual.
Nenhuma dessas substituições foi incorporada ao jogo.

## Método e fronteira

Helper workspace `renderer-ab-local.mjs`, saída `renderer-ab/`, análise
`analyze-renderer-ab.mjs`/`renderer-ab/analysis.json`. Vite próprio4184, Edge
isolado por amostra,1366×768. Servidor/contextos encerrados ao final.
SHA256 do helper final(syntax check PASS):
`bf66d760c285ec949e9cc7b434158f55f67355c9aca19c7594f8d6eed1d6d73f`.
Comandos no workspace, usando Node já instalado:
`node renderer-ab-local.mjs controlled native-full,software-full,software-no-render,software-no-world,software-no-scenery,software-no-terrain,software-no-mask 16`;
`node renderer-ab-local.mjs cache-probe software-full,software-cached-terrain,software-canvas-hidden,software-no-render-hidden 16`;
`node renderer-ab-local.mjs cache-visual software-full,software-cached-terrain 16`.
Helper evoluiu para controlar sessionId e depois adicionar readback pós-métricas;
capturas de controlled/cache-probe foram feitas ANTES dessa última adição.
Não sobrescrever diretórios de evidências ao reproduzir; escolher labels novos.
Sem agentes, automação, tarefa nova ou alteração da branch diagnóstica remota.

Backend normal versus seleção SwANGLE documentada pelo
[Chromium](https://chromium.googlesource.com/chromium/src/+/main/docs/gpu/swiftshader.md):
`--use-gl=angle --use-angle=swiftshader`. Não foi usado unsafe-swiftshader,
disable-web-security, disable-gpu-sandbox ou mudança de política/permissão.
Renderer informado: IntelUHD/D3D11 no normal; SwiftShader/Subzero no software.
Máquina local12CPUs, não replica runner4CPUs/OS/Node; não extrapolar ganho ao CI.

Hook somente na resposta HTTP local do PixiRenderer expõe a instância ao
instrumento. Substituições de renderable/mask/render/cache/CSS existem somente
na memória desse navegador, deliberadamente alteram o desenho para diagnóstico.
Não são smokes de aceitação nem uma entrega com qualidade reduzida.
WebGL wrappers contam calls/readbacks e usam relógio nativo capturado/verificado
com50ms de espera real; nenhum timer do jogo ou método de combate é substituído.
Clock instalado/pausado como nos testes,4×,16chamadas250ms,16s lógicos.
Não houve aumento de deadlines/assertions. Watchdog diagnóstico360s fecha o
contexto diretamente; não repete o prolongamento de coleta do perfil anterior.

## Controle de sessão: correção do desenho experimental

Rodadas preliminares `initial/` e `layers/` preservadas. Hashes dos eventos
divergiram: EquipmentDrops usa explicitamente sessionId para variar seu stream
de loot, separado do RNG de combate. Não foi bug do renderer nem regressão.
Normalizar só UUID no resultado não basta para comparar drops já diferentes.

Rodadas `controlled/`, `cache-probe/`, `cache-visual/` usam a MESMA entrada
`renderer-ab-fixed-session`, substituída apenas no retorno de criação de ID na
resposta HTTP de main.ts desse navegador diagnóstico. Não substituem Math.random,
RNG de combate, motor, save de usuário ou relógio. São experimentos com entrada
controlada, explicitamente NÃO fixtures usadas para liberar um smoke público.

Nas13amostras controladas, eventos completos+entidades finais idênticos,
1014eventos/16s,overlaps lógico/corporal0. Estado bruto preservado em *-state.json.
Hash de comparação(troca só ID exato por marcador após captura):
`6ba9633ae0b25f7fe82bdc65ed1f6f56e28135fbacb06dd83ae2e11484c75a54`.

## Medições

Parede do workload não inclui startup/screenshot. CPU é cumulativa entrethreads,
não percentual nem FPS. Sem V8profiler/timeline nesta rodada; não comparar
absolutos como se fossem iguais ao perfil instrumentado no CI.

| controlled/ | Parede(s) | CPU processoGPU(s) | DrawElements |
|---|---:|---:|---:|
|normal completo|4,727|2,335|1720|
|software completo|12,933|85,860|1552|
|software sem render|5,442|22,979|0|
|software sem world|6,260|35,871|250|
|software sem scenery|11,520|73,556|1302|
|software sem terreno|8,915|56,181|1052|
|software sem máscara|11,410|72,366|802|

Todos fizeram250chamadas ao renderer, inclusive no-render(que só omite o draw).
Esconder canvas via CSS(`cache-probe/`) manteve12,623s/84,901sGPU/1552draws;
sem render+hidden5,725s/26,505sGPU. Esconder canvas não elimina trabalhoWebGL.
Efeitos e unit-ui preliminares não mostraram ganho grande, mas tinham IDs
aleatórios; não são evidência causal quantitativa com economia idêntica.

Cache temporário da terrainLayer, API Pixi instalada cacheAsTexture, resolução
rendererResolution×worldScale, antialiasfalse/nearest; custo inicial incluído:

| Par | Completo→cache,parede(s) | CPU GPU(s) | DrawElements |
|---|---:|---:|---:|
|cache-probe|9,610→8,115(-15,6%)|62,392→49,524|1552→1106|
|cache-visual|11,161→8,837(-20,8%)|75,219→55,427|1552→1106|

Variação entre baselines9,6–12,9s é real; n=2pares sequenciais, sem inferência
estatística, thermal/OS/ordem não controlados. Cache não fez os trêsloops,
inventário, resize/pan/outfits/terreno dinâmico ou74E2E completos.

## Readback, capturas e limites

Nas13amostras controladas não houve readPixels/flush/finish JavaScript no
workload. A instrumentação não enxerga readback interno do browser, compositor
ou driver: não prova inexistência de todos os stalls nativos.
Tempo síncrono agregado de clear/drawElements do par visual foi13,5/48,2ms,
muito menor que parede. TrabalhoGPU assíncrono/waits fora das funções medidas
não pode ser atribuído a uma call/shader só por esse número.

Quatro das11amostras controlled/cache-probe tiveram timeout do screenshot
Playwright5s, registrado como capture-failed, não PASS nem timeout relaxado.
Sem pageerrors. Warnings de queueSerial ocorreram em no-render e cache,
preservados; não alegar console totalmente limpo.

No par cache-visual, readback canvas.toDataURL explícito PÓS métricas e antes
do screenshot foi adicionado só para inspeção. Ambos screenshots completos
então concluíram; isso muda a fase de captura, não valida o caminho original.
PNG canvas bruto do baseline saiu preto(buffer não preservado); não usá-lo
como comparação de imagem. Screenshots completos1366×768 baseline/cache foram
inspecionados: cena/composição equivalentes, mas não aprovar pixels idênticos.
Arquivos renderer-ab/cache-visual/software-full.png e software-cached-terrain.png.

Tentativa de comparação numérica por compare-renderer-png.ps1 foi BLOQUEADA
pela execution policy do Windows. Política não alterada; nenhum bypass ou
execução inline alternativa dessa rotina. Métrica de diferença pixel-a-pixel
indisponível nesta rodada. Hashes PNG distintos não medem por si qualidade.

## Decisão proposta, não implementada

Gargalo de desenho software reproduzido; terreno é contribuinte mensurável,
não causa única provada. Próximo passo útil: se autorizado, otimização restrita
de cenário estático/cache com invalidação de mudanças/pan/resize/resolução,
sem reduzir aparência. Exigir verificação visual proporcional, domínio/timeline
inalterados, gates completos originais e nova CI apenas após código validado.
O cache ingênuo experimental NÃO é considerado pronto nem solução comprovada
dos timeouts. Não aumentar deadlines/desligarassertions/mudar runner/permissões
ou publicar porque a amostra curta melhorou. Alpha pública continua bloqueada.

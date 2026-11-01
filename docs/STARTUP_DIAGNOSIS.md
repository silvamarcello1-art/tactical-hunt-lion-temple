# Diagnóstico de inicialização —31/10/2026

Escopo autorizado:investigar a demora,sem corrigir código,alterar limites ou
reexecutar o smoke obrigatório. Runtime público b9d0e31,equivalente f1200c4.
HEAD de entrada14f86a7docs-only/CLEAN. Falha anterior:qa-training-team:14
esperava idle e recebeu preparing por5000ms;sem trace dessa tentativa.

## Método e limites

Duas observações passivas em Edge isolado:abertura de contexto com cache vazio
e recarga no mesmo contexto com cache aquecido. Sem iniciar combate,clicar,
editar bundle,repo/scripts/testes,limites ou save do usuário.
Instrumentação somente em memória do contexto diagnóstico:MutationObserver
de estado,ResourceTiming,longtasks,getContext/decode e trace de rede.
Janela passiva de observação até20s NÃO muda o gate5s e não aprova o smoke.
Timings são instrumentados,duas amostras,não benchmark/garantia de startup/FPS.

## Medições

|Métrica|Cache vazio|Recarga com cache|
|---|---:|---:|
|Navegação até idle|4060,4ms|731,7ms|
|Retorno de page.goto até idle|2882,1ms|450,7ms|
|Fase preparing até idle|3268,9ms|584,5ms|
|Estado observado5s após goto|idle|idle|
|Requests de atlas de outfits|38|38|
|Bytes transferidos desses38atlases|4.679.730|0(cache)|
|Janela dos38requests,relativa ao primeiro request do documento|1777,8–3619,0ms|561,7–649,8ms|
|Maior duração de request de outfit|926,7ms|8,7ms|
|Maior espera de resposta de outfit|883,7ms|1,2ms|
|Longtasks na main thread|216ms(119+97)|0observadas|

Manifest b9exato e sem pageerror/consoleerror/warning nas duas observações.
Todas respostas de outfits200;sem falhas HTTP observadas. Os tempos de
getContextWebGL amostrados foram curtos(aprox16ms total no frio),mas NÃO
medem toda a preparação GPU/upload/shaders; não excluem outros custos.

## Gargalo estrutural comprovado

main.initialize só muda para idle depois de createRenderer/mount.
mount aguarda app.init e loadAssets;loadAssets aguarda SpriteLibrary.load.
SpriteLibrary.load usa Promise.all de TODOS os48sprites:10definições nativas
e38outfits,mesmo quando somente personagens padrão estão selecionados.
Depois ainda carrega os4tiles de terreno. O trace confirma38PNGs de outfits
na rota crítica antes de idle,transferindo4,68MB no frio.

Os PNGs são carregados/decodificados pelos workers de Pixi. ResourceTiming
da página principal não os lista;por isso contagem/bytes vêm de trace.network,
que inclui os requests dos workers. Não somar só os26resources da mainthread
e concluir falsamente que nenhum outfit foi carregado. Timings HAR usam
relógio monotônico relativo ao documento;timings da página usam performance.
Valores negativos de bodySize em cache não são bytes transferidos:foi usada
response._transferSize,zero na recarga.

## O que NÃO está comprovado

Não se reproduziu preparing por mais de5s nesta observação. As duas amostras
chegaram a idle antes do prazo equivalente do smoke. Isso NÃO invalida o
timeout anterior nem substitui3vitórias/economia/cleanup/outfits/Hunt.
Não há evidência histórica para atribuir aquela falha específica à rede,
GPU,decode,concorrência ou bug. Cache e dependência de todos os trajes são
custos comprovados;serem a causa exata do timeout anterior é hipótese.

## Proposta,não implementada

Reduzir a rota crítica:carregar primeiro os sprites realmente necessários
ao cenário/party/aparência ativa,e carregar outros trajes sob demanda,
aguardando o atlas antes de aplicar uma troca. Preservar previews/outfits/
bots/bosses,saves/gameplay e os limites5s/500ms. Testar essas transições e
gates existentes após autorização de implementação.

Não corrigir ou aumentar deadlines nesta tarefa de diagnóstico. CI332unit/
69E2E e Pages já passaram;não houve novo CI/rerun/deploy/smoke ou automação.
Validação pública completa continua pendente e preview não é release estável.

## Evidência local

Workspace:diagnose-sqm-startup.mjs,sqm-startup-diagnosis.log e pasta
sqm-startup-diagnosis/ com cold.json,warm-reload.json,reports.json,
cold-trace.zip,warm-reload-trace.zip e screenshots. Screenshot cold inspecionado.
Dados referem-se ao público b9,não a um build local modificado.

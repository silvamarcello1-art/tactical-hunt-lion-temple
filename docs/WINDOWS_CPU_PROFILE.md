# Windows CI — CPU/render, coleta única — 01/11/2026

## Resultado e fronteira

Coleta explicitamente autorizada pelo usuário. Run41329694126/job124916989158
terminou FAILURE; artefato13093936077 foi preservado com sucesso. Não é gate,
retry da validação ou aprovação de publicação. Não houve novo deploy.

Branch isolada `diagnostics/windows-cpu-profile-ec42`, commit
`83b2f35a4a072f71125a8ec6c9a96ac1c40158c5`. Apenas workflow diagnóstico,
collector e documentação próprios. Diff de src/public/tests/deps/configurações
e preview.yml vazio contra runtime `ec42a20bbf11ccaa507818c6a5c1cc0f6827e942`.
Feature permanece sem instrumentação. Checkout diagnóstico fixado no SHA,
contents:read, persist-credentials:false; sem Pages, schedule, dispatch ou PR.
Branch fica preservada, sem novos disparos; não foi removida remotamente.

ZIP workspace `windows-cpu-render-ec42.zip`,4.880.899bytes; SHA256 conferido:
`747167b74a836e6c7a99bc37772b87b845d8d13be6b6eac5bf5122ece2e1fc4d`.
Extração `windows-cpu-render-ec42/`, helper `analyze-windows-cpu-profile.mjs`.
Todos no workspace Codex; não incluídos como binários no repositório.
Artefato remoto expira08/11; cópia local preservada. [Run e artefato](https://github.com/silvamarcello1-art/tactical-hunt-lion-temple/actions/runs/41329694126).

## Ambiente real

Windows10.0.26100, Node22.23.4, Edge156.0.4314.58, EPYC7763/4CPUs lógicas,
17,17GB RAM. WebGL informa ANGLE/Vulkan/SwiftShader Device(Subzero).
SystemInfo: Microsoft Basic Render Driver, gpu_compositing/rasterization
disabled_software. Local usou IntelUHD/ANGLE D3D11,12CPUs,Node24; não são
máquinas equivalentes nem um A/B causal com apenas uma variável.

SwiftShader é implementação Vulkan na CPU segundo seu
[repositório oficial](https://swiftshader.googlesource.com/SwiftShader).
O processo chamado GPU aqui não representa consumo de uma GPU física.

## Medições reais

Wall de workload exclui setup/coleta quando disponível; CPU é tempo acumulado
entre threads, não percentual de parede. Uma amostra por condição.

| Amostra | Resultado | Workload parede | JS | CPU processo GPU | CPU renderer |
|---|---|---:|---:|---:|---:|
|40×250ms,sem snapshots|concluída,40s lógicos|123,717s|0,623s|440,834s|8,731s|
|mesma amostra,com snapshots|concluída,40s lógicos|122,864s|0,647s|441,896s|9,605s|
|três loops|timeout360s;última contagem2|sem fim válido|1,918s|1268,386s|29,463s|
|relógio real|concluída,22,8s lógicos|30,382s|1,550s|358,969s|4,412s|
|inventário original|assertions concluídas antes220s|202,321s|0,402s|780,839s|4,780s|

Curta local:9,414s sem snapshots/10,243s com,JS0,776/0,849s. No CI as40
chamadas clock custam123,605/122,715s,~3,1s cada; no local9,304/10,106s.
O custoJS da amostra curta não cresceu com a lentidão de parede. O processo
gráfico consumiu~3,56CPUs em média na amostra curta, de4CPUs disponíveis.
Snapshots não explicam a diferença de ordem de grandeza nesta amostra.

CPU V8 é dominada por `(program)`116,8/116,3s nas curtas, não por funçãoJS
do jogo. Esse bucket não identifica chamada nativa nem prova sozinhoCPU ativa.
syncDiagnostics é maior funçãoJS própria,~475/525ms, mas não explica124s.
Timeline mínima não inclui perfil nativo detalhado do processo GPU; não é
possível apontar shader/drawcall/camada causal com estes arquivos.

Inventário cumpriu AI/MANUAL/ASSISTED,3heroes/3viewports/foco/sem comando vazado;
últimos clicks5,5–6,2s cada. Sem pageerror nas5amostras. Todas têm warnings
GPU stall due to ReadPixels. Esses warnings não têm timestamps e incluem a
fase screenshot: não provam que readback do jogo causou cada stall.
PNGs curto/inventário inspecionados; não constituem nova partida manualAlpha.

## Limites importantes da instrumentação

- Deadlines220/360s e assertions10s mantidos. Três loops foi marcado timeout,
  não PASS. O watchdog coleta perfis ANTES de fechar contexto; essa coleta
  demorou~152s adicionais, enquanto ações pendentes puderam continuar.
  Portanto512,081s wall total e162chamadas totais NÃO são trabalho aceito no
  orçamento360s; só113chamadas terminaram antes do deadline. Último cycles2
  também pode ter sido atualizado na janela de coleta; não é snapshot exato360s.
- Inventário terminou workload em208,566s desde início;232,488s total inclui
  coleta após watchdog liberado. Real-clock levou10,254s na espera solicitada;
  workload30,382s inclui controles. JanelaCPU inclui~92s de setup de profiler/
  timeline antes do workload; não dividir esses358,969s por10s para dar utilização.
- Perfis/tracing alteram custo. Timeline circular16MiB tem eventos nested;
  somas não exclusivas não sãoCPU total. Trêsloops local teve dataLoss=true;
  CI false não transforma a coleta em captura completa do sistema.
- Processo Node/driver não foi perfilado; não háFPSbenchmark, A/B de renderer,
  prova de bug do SwiftShader ou identificação do efeito exato responsável.
- Job falha por timeout dosloops e warnings preservados. Não mascarar warnings,
  substituir screenshots, fixtures ou aumentar deadlines para dar verde.

## Conclusão e próximo passo proposto

Evidência forte de gargalo na renderização nativa/software do runner, não de
explosão do custoJS/HUD nem de snapshots como causa dominante da amostra curta.
O mecanismo gráfico exato permanece hipótese. Recomendação: autorizar um A/B
diagnóstico dirigido ao renderer, reproduzindo software localmente e isolando
custos visuais sem modificar combate/input/clock/gates ou reduzir qualidade
silenciosamente. Nenhum A/B adicional, fix, retry ou novo pipeline foi iniciado.

Gates ec42 continuam falhos: push41283638985 353unitPASS/63E2EPASS/4timeouts/
7notrun; PR41283642777 353unitPASS/62E2EPASS/5timeouts/7notrun, ambos deploy
SKIPPED. Perfil não substitui353unit/74E2E/builds nem smoke público exato.
PR4 permanece draft; Alpha pública não aprovada,manifest anteriorb9d0e31.

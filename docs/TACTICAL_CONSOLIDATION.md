# Consolidação visual e tática — contrato de 24/10/2026

Este pedido posterior prevalece sobre as regras de controle/câmera dos marcos
2B.1–2B.4. Não renumera MVP2C/outfits nem autoriza Adventure, rede ou OTSP.

## Geometria: medida e inferência

Captura de referência: 1902×978, mundo estimado x420–1478/y0–778,
1058×778px. Espaçamento entre arbustos (~140px, aparentemente dois SQMs) e
aspecto sugerem **15×11, lado ~70px**. É inferência visual, não uma grade
contada a partir de dados do jogo da referência. Ator montado estimado ~87×88px,
~1,25SQM; limites da montaria/efeito tornam essa estimativa menos precisa.
Não extraímos arte, textura ou código da captura.

Antes, local e público74b coincidiam. No treino, CSS determinava 39/36/35/35
colunas em1902/1366/1600/1920px, sempre18linhas: bug de acoplamento.
O tile lógico já era32px, não o tamanho aparente.

| Resolução | Antes treino: mundo/tile aparente | Depois: mundo/tile aparente, ambos modos |
|---|---|---|
|1902×978|1686×782px;39×18;43,23px|1073,18×787px;15×11;71,55px|
|1366×768|1150×572px;36×18;31,78px|786,82×577px;15×11;52,45px|
|1600×900|1384×704px;35×18;39,11px|966,82×709px;15×11;64,45px|
|1920×1080|1704×884px;35×18;48,69px|1212,27×889px;15×11;80,82px|

Depois = retângulo efetivamente pintado/clicável, excluindo letterbox neutro.
Em1902, começa aproximadamente x414,46/y75 (referência x420/y0).
A barra superior e o dock têm alturas próprias; não alegamos cópia pixel a pixel.
Hunt antes mostrava30×18, lado43,72/32,06/39,39/49,39px nas mesmas resoluções.

`renderConfig.WORLD_VIEW` (reexportado por worldViewport) centraliza janela15×11, escala de personagem.62,
treino36×18 e usa TILE_SIZE32 existente. `worldCamera` limita a janela ao mapa e
segue o footpoint interpolado do selecionado sem easing/lag. `viewportPoint`
é a inversa usada por mouse, picking, chão, overlays e drag. DPR fica no buffer
do renderer; coordenadas CSS não são multiplicadas novamente. A mesma janela e
escala uniforme valem nos dois modos. Uma máscara permanente impede pintar mundo
nas sobras laterais, que rejeitam comandos. Câmera não limita o mapa: caminhar
acompanha o selecionado; lista lateral permite foco explícito fora da janela.

Native80/foot74: alpha idle medido em50×60/42×60/35×60px para Knight/Druid/
Sorcerer. Com.62, largura.969/.814/.678SQM e altura **1,1625SQM**, antes1,875.
Overflow superior37,2px lógicos, nenhum pixel abaixo do pé. Sombras28×8px,
.875×.25SQM, não mudam posição com bob. WarriorAddon2 medido50×76px:
.969×1,4725SQM, overflow47,12px; acessórios não são altura de corpo.
Outfits112/foot104 preservam seu registro e a mesma escala, incluindo acessórios
mais altos/largos; não cortamos chapéus para fingir todos do mesmo tamanho.
Sombras continuam no chão, footprint lógico1×1. Pilares de treino28px (~.875SQM),
base do pilar do templo26px (~.81SQM), runas/máscaras32px (1SQM), projétil
64px×.52=33,28px (~1,04SQM de envelope de textura, desenho interno menor).
O boss conserva footprint lógico1×1 e definição visual própria45×64/scale1.08
(envelope nominal1,52×2,16SQM); não recebe a redução.62 dos personagens.
Piso da Hunt foi corrigido em meio SQM para centrar cada célula em tile×32,
como domínio/treino/obstáculos, e não deixar os pés numa interseção de piso.
Nomes/HP e feedback textual limitam ampliação screen-space; terreno e VFX
conservam a escala comum e máscaras reais.

## Controle e foco

- Treino: selecionado sempre MANUAL, demais heróis AI, três bots AI. Não existe
  escolha Auto/Assistido para o selecionado; domínio rejeita mesmo payload forjado.
- Hunt: Auto/Manual/Assistido mantidos. Selecionar/takeover assume Manual somente
  no novo herói; anterior volta a AI. Assistido conserva suas duas preferências.
- `selectedController`/`selectedHeroId` não são `partyFocusTargetId`.
  Esquerdo/direito no inimigo ou lista lateral enviam intenção ofensiva explícita.
  Aliados AI usam esse foco, aproximam/recuperam LoS, sem trocar primário válido.
  AOE continua podendo atingir outros inimigos; cura/suporte não são foco ofensivo.
- Troca de herói preserva foco. Equipamento/outfits/abas apenas inspecionam:
  suspendem gestos/teclas, não emitem combate/control nem trocam foco.
- Treino sem foco, após morte/invalidação ou Stop/ESC: nenhum ataque autônomo
  em outro inimigo. Hunt sem foco mantém aquisição própria. Bot não perde sua IA.

## Movimento e interrupção

Teclas físicas, oito direções, buffer de um tap; repeat do SO não cria fila.
WASD/setas/numpad passam pelo MovementSystem/A*/occupancy, quinas e reservas.
Hold manual usa250ms lógicos por passo, casando a decisão250ms e evitando a
pausa de30ms entre passos220ms. AI continua220ms, preservando toda Hunt Auto.
Interpolação linear, bob1,5px e lean.025rad somente durante passo; idle não oscila.
Resposta continua quantizada na decisão: suavidade não significa latência zero.

Qualquer nova intenção manual cancela destino/rota/approach/push pré-commit e
fila obsoleta. Cast/runa/novo push/ataque/move/MoveTo/Stop/troca não retomam rota.
Armar targeting envia `interrupt`, sem mudar foco ofensivo. Passo já reservado
termina pelo lifecycle normal; não paramos no meio de um SQM. Impactos e pushes
já comprometidos resolvem/revalidam normalmente. Painel não é nova intenção.

## Push distante

Snapshot `{id,source,target,origin,destination}` efêmero por ator. `pushApproach`
consulta o A* existente de forma síncrona/read-only, escolhe vizinho alcançável
determinístico e exclui alvo/destino do percurso. Apenas executor caminha, um
passo reservado por vez. Sem vizinho: `no-route`. Destino não fica reservado
durante o percurso e cooldown não é gasto por tentativa de aproximação.

Ao chegar, PushSystem normal agenda delay1000ms/cooldown2000ms uma única vez;
continua deslocamento de apenas um SQM adjacente ao alvo por MovementSystem.
A cada decisão/deadline revalida vida, ownership, snapshot, bounds, terreno,
criaturas, reservas, quinas, restrição do alvo e cooldown. Mudança de tile do
alvo cancela, não reajusta silenciosamente. Nova intenção substitui/remove a
identidade anterior; não há callback assíncrono que possa ressuscitá-la.
Pausa congela relógio; dispose/andar/reset removem contexto e reservas.

Preview distingue destinos vizinhos válidos e necessidade de aproximação:
“Aproximar para empurrar”. Readiness inicial não garante rota futura; execução
informa `no-route` ou bloqueio real se a situação mudar. Drag solto fora do mundo
ou no HUD cancela. Tecla8 chama o mesmo contrato, sem menu extra.

## Verificação e limites

Entrada: local=origin1293721 docs-only, runtime74b; worktree limpa; fetch/health
conferidos. Baseline real283unit/61E2E, sem usar CI antigo como gate novo.
Novos testes cobrem inversa/quatro cantos/resize/DPR2, modos/foco, cancelamentos,
paredes/ocupação/reservas/morte/target-moved, identidade substituída, nenhum push
tardio ou cooldown pré-adjacência e determinismo50/1000ms. Hunt Auto do perfil
novo é comparada integralmente ao perfil anterior, sem regenerar hashes.
Fixtures históricas isolam regressões de magias/Assistido; cenários de produção
novos não interceptam módulos. Mudaram coordenadas de câmera e expectativas do
contrato de treino, não os limites/assertions econômicos, timeouts ou snapshots.

Gates locais:310unit/27files e63E2E/1worker, typecheck/build/build:preview/frozen/
health/arte/diff aprovados. A/B com entrada1293721 mantém integralmente2868eventos
e hash edcf9f6d0aa4488bda430a900d74003401d5f924d48fc6b5627da8a5f87a554b.
Publicação e medições reais serão registradas em CURRENT_STATE e
SESSION_CHECKPOINT. Enquanto não houver CI/deploy/manifest/smokes novos aprovados,
74b continua sendo apenas a versão pública anterior, não esta consolidação.
Sem claim de FPS baseado em média de callback. Arte/cores/diagonais dedicadas e
benchmarkGPU/PvP massivo seguem limites de OUTFIT_ART_2C. Preview não é release.

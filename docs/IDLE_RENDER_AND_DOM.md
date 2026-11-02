# Redesenho ocioso e escritas DOM idênticas —02/11/2026

## Implementação autorizada e limites

Após a investigação residual, o usuário autorizou apenas esta otimização,
preservando aparência, controles e animação ativa, com medição antes de novo CI.
Base/runtime anterior54f9a695; checkout inicial documental6ecc723=origin/CLEAN.

- RenderInvalidation controla somente a necessidade de desenhar. O ticker
  Pixi, LiveEventPlayer.update e todos os callbacks/comandos mantêm a cadência.
  O callback de desenho continua na prioridade LOW original. Não parar/reiniciar
  ticker nem acumular um delta maior ao retomar.
- Execução ativa invalida todo frame; conclusão mantém os frames até o último
  tween. Pausa/idle estáveis não redesenham pixels idênticos. Seleção, target,
  resize, aparência, mira/push, eventos e criação de tweens invalidam a cena.
  Dispose remove os dois callbacks; app.render explícito continua disponível.
- Restauração WebGL invalida também o cache de terreno; retorno à aba invalida
  a imagem. AbortController remove os dois listeners no dispose. Teste real de
  perda/restauração confirma pixels, rebuild e redraw ainda em idle.
- continuousRendering é referência de regressão, não opção de qualidade/UI.
  Render full-quality, DPR, máscara, cache, assets e timings continuam iguais.
- PlayerControls.sync e updateCooldownVisuals evitam apenas setters de texto,
  atributos e estilo que já têm o valor desejado. Dados, arredondamentos,
  cadência de callbacks, ownership, saves e estado de interação não mudam.
  Mira/push idênticos também não recriam Graphics; a primeira chamada vazia
  ainda inicializa os atributos diagnósticos originais.
- Nenhuma mudança em combate/grade/RNG/timeline/Alpha/CSS/arte/deps/workflows,
  limites/assertions/snapshots antigos ou permissões. Não reduzir animação
  ativa, esconder layers ou desligar transições para obter ganho.
- A rodada82 expôs um defeito visual real já existente na base: tween de ação
  acessava sprite.position depois de a morte destruir o sprite. A exceção
  parou o ticker no boss. Tweens de spawn/ação/hurt/morte agora registram seu
  objeto dono; updateTweens descarta somente donos destruídos antes de chamar
  update/done. Não há catch-all nem supressão de erros/assertions, e nenhuma
  regra de morte/combate muda. Regressão determinística cobre essa ordenação.

## Medição local, não FPS nem gate remoto

SwiftShader confirmado, Edge headless1366×768, máquina local12CPUs. Servidor
diagnóstico4184 próprio. Baseline lê três módulos originais via git show54,
sem checkout/reescrita; candidato usa arquivos atuais. Tudo em contextos novos,
sequenciais, descartáveis. Nenhum CI foi iniciado por estas medições.

### Ocioso real e inventário —dois pares, ordem invertida

Cada janela dura3s reais; engine/result/tempo não mudaram durante a janela.
Depois há as mesmas interações de inventário nas três resoluções e seleção.

| Par | Frames baseline→candidato | CPU processo gráfico(s) | Inventário(ms) |
| --- | ---: | ---: | ---: |
|A|91→0|24,708→0,159|1891→877|
|B,ordem invertida|93→0|25,449→0,163|1932→745|
|C,fonte final com restauração|93→0|25,546→0,150|2340→854|
|D,fonte final com lifecycle|93→0|25,476→0,158|2324→829|

O benefício é real no ocioso nessas amostras: não há redraw redundante e há
menos CPU gráfica. CPU soma threads, não é tempo de parede/FPS/consumo de
bateria medido. Inventário local não prova resolver seu timeout no runner.
PNG candidato idle/seleção1920 inspecionado. Errors[]/warnings[] nos quatro.
Os paresA/B precedem a guarda de restauração,C precede a guarda de donos.
ParD confirma o benefício na fonte final. CPU renderer local aumentou de
~0,20–0,21s para~0,45–0,47s nessas
janelas, enquanto CPU gráfica caiu fortemente; não afirmar que zerou CPU ou
parou o ticker. Os oito contextos ociosos registraram errors[]/warnings[].

### Combate ativo —não anunciar aceleração

40s lógicos a4×,250ms por passo,fonte finalD:baseline14,876s/candidato15,012s,
CPU gráfica117,780/120,101s. Não houve ganho; a pequena piora desta amostra
também fica registrada, sem inferência estatística. ParB anterior15,498→15,321s
é histórico anterior à guarda de restauração, não fonte final.
Ambos625frames/2661drawElements/2718eventos,estado/entidades completos idênticos,
SHA2567e2e492b155b35e87ac9608076a42bad853abe51a6ed4f488048cba4b11215a5,
overlaps finais0/errors[]/warnings[]. Não é prova contínua de overlap0 ou3loops.

ParA preliminar15,136→15,442s foi preservado, não escondido; candidatoA precede
a correção da inicialização dos atributos vazios da mira. Não é a fonte
congelada final. Hashes do candidatoD conferem com a fonte dos gates atuais.
Nenhuma garantia de que o custo ativo de apresentação/CI tenha sido resolvido.

Evidências no workspace:idle-dom-evidence/{idle-before-a,idle-after-a,
idle-after-b,idle-before-b,idle-before-c,idle-after-c,idle-before-d,idle-after-d};renderer-ab/idle-dom-{before,after}-{a,b,c,d}.
analysis.json registra resultados/hashes da fonte; evidence-manifest.json
registra os arquivos. Helpers measure-idle-dom.mjs/serve-idle-ab.mjs só no
workspace. O campo runtime=ec42 do helper A/B histórico é base candidate,
não identifica a fonte servida: servedSource/idleMode/hashes discriminam54.

## Gates reais —não estão todos verdes

- Frozen install/typecheck PASS;7unit novos PASS.
- Suíte completa370unit/36files:369PASS/1FAIL em180,61s. Mesmo teste antigo
  HuntPressure.test.ts:61, três Hunts,5721ms no deadline original5000ms.
  Combate e esse teste não foram alterados. Não atribuir causa última ao
  ambiente só por histórico; não aumentar limite ou repetir até verde.
- Arte reproduzível/diff de assets PASS; build/build:preview PASS,
  792módulos,maior chunk431,74kB. Sem lint configurado.
- 5 E2E novos PASS:aposentadoria de sprite/ticker,
  restauração WebGL/cache/visibilidade/dispose,
  idle/pausa/cadência ativa/seleção/resize,mira vs referência
  full-quality/limpeza,identidade DOM. Os4E2E do cache passaram na rodada
  dirigida. Primeira rodada6/7:teste novo consultou contador no #game em vez
  de html; seletor corrigido mantendo assertion>0. Trace/PNG inicial preservados
  no workspace idle-dom-initial-selector-failure; não era falha funcional.
- Primeira suíte completa81E2E PASS16min, antes da guarda de restauração.
  Depois dela,8E2E dirigidos PASS29,2s. Rodada82:81PASS/1FAIL16,8min,
  player-control.spec.ts:34, por exceção visual real, não mera lentidão.
  Após a correção de dono:13E2E dirigidos PASS1,1min, incluindo cenário original
  em20,5s com os mesmos limites. Suíte final83E2E PASS14,9min,mesmo caso20,4s.
  Log completo:workspace idle-dom-owner-final-e2e.log. Não apagar a falha82.

Quatro QA compilados originais PASS:qa-training-team3wins/1231açõesbot/economia
intacta;qa-outfits12trajes/38sprites;qa-preview24kills4240XP1540gold1token;
qa-roguelite2encontros/upgrades/retirada/forja/save3brasas/rank1. Errors[];
warnings[] nos três helpers que coletam warnings,outfits só coleta erros.
PNGs de Hunt/treino/customizado/refúgio inspecionados. É QA real-clock local,
não uma vitória humana completa ou smoke público. Fonte congelada D;build
inicial contém stamp6ecc(HEAD documental anterior),não sua identidade de fonte.
17HTML/JS/CSS do bundle têm SHA256
8a3549de9ddd3ea5fd4cc42e11f3ec8f60f3531981983d2669e72266cafdb3dc.
Hashes de fonte e metadados preservam a distinção working-tree/commit servido.

Trace da falha82 preservado no workspace idle-dom-final-focus-failure;
SHA2567587dba8aa4017b1cacb1fb1934bb9108a7795586db9240cfd6a616c4fd2bf48.
pageError aponta animateUnit/updateTweens,sprite.position.set; logical-time
congelou47109,40ms/3127eventos/boss até a assertion100s. O callback é igual na
base54, mas a busca nos8traces antigos54 não encontrou pageError; não atribuir
aqueles CIs a esta falha específica nem afirmar que a publicação foi resolvida.
Helper inspect-idle-focus.mjs/summary.json guarda a leitura,sem alterar teste.

## Publicação

Não foi enviado novo runtime ao CI. O benefício ocioso não transforma os
370unit em verde e não substitui validação remota. Sem retry/novo pipeline/
deploy/merge/force/Sites/automação. A falha unitária fora do escopo fica
explícita; gates independentes continuam para delimitar a mudança.

Gates independentes foram concluídos;envio continua retido por369/370 até
decisão humana. Pergunta condicional de nova rodadaCI solicitada,nenhuma
resposta recebida neste checkpoint. LocalNode24.22.1/pnpm11.25.0 difere da
configuraçãoCI Node22/pnpm10;isto não comprova a causa do timeout. Nenhum
runtime foi instalado,trocado ou pinado para obter verde.

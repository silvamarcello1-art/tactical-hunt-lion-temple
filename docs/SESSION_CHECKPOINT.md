# Checkpoint — MVP 2B.3 publicado — 20/10/2026 UTC

## Fechamento vigente — prevalece sobre os registros históricos abaixo

Runtime público: bbd0fac90bbc5ba27be4c9189f36513e1d59ee93.
Branch feature/gameplay-first-mvp2a, origin GitHub, PR3 aberta sem merge.
CI push39347671213: validate118384098380 e deploy118395034330 SUCCESS.
CI PR39347675576: validate118384113457 SUCCESS (deploy PR é skipped por desenho).
Manifest público exato conferido em20/10UTC após01:02. Local251/251 unitários,
40/40 E2E Edge, typecheck/build, frozen install, health, arte reproduzível e
diff --check PASS; gates remotos também aprovados. Nenhum timeout/assert foi
afrouxado. Warning de chunk >500kB permanece; não há lint configurado.

Smokes públicos em Edge isolado, relógio real e SHA obrigatório:

- qa-training-kit: MW/mira, rejeição de Destroy Field sobre MW sem gastar carga,
  remoção de fogo, SD/projétil, Heal Friend em aliado, dois pushes (tecla/arraste),
  pausa/reset PASS. Oito vizinhos/sete livres no fixture, alvo imóvel ao segurar,
  soltura no vizinho autorizado. Console/resíduos zerados. Captura dos vizinhos
  inspecionada; runtime correto, sem zoom ajustável.
- qa-training: três vitórias, 1441 eventos, economia inalterada, zero console,
  overlap/OOB/reservas/projéteis/condições/pushes/VFX residuais. Variação de um
  evento contra amostra anterior de 1442 não foi usada como baseline determinístico:
  o smoke usa relógio real. Ruleset sem diff, testes/baselines determinísticos verdes.
- qa-preview: vitória real contra boss,19kills/4240XP/1489gold/1BossToken,
  simulação de52350ms (clock apresentado52363ms pelo frame real),1x→4x PASS.
  Zero console/warnings/overlap/OOB/reservas/projéteis/pushes/VFX residuais.
  Apresentação média0,075ms/pico1,1ms;594display objects,máximo97objetos visuais
  ativos/13efeitos. Callback rAF1x média0,920ms/pico56,1ms;4x média1,159ms/
  pico46,2ms. Amostras desta execução, não FPS nem prova de melhoria comparável.
  Screenshots em test-results/mvp2b3-public-final-* e mvp2b1-public-final-gameplay.png,
  fora do bundle. Smokes executados via scripts do repositório, não perfil do usuário.

scripts/qa-training-kit.mjs passou local compilado e público após trocar espera
arbitrária de500ms por deadline lógico queuedPush.time+2000 antes do segundo
gesto. É ajuste apenas do teste reutilizável; src/public/dependências/workflow
continuam exatamente no runtimebbd0fac. Fechamento doc/QA usa [skip ci] para não
disparar outra publicação idêntica. O SHA servido é do runtime, não desse checkpoint.

Usuário autorizou acompanhamento automático de5min; não foi necessário criar
agenda porque CI/deploy terminaram e a verificação foi concluída nesta sessão.
Sem merge, force push, Sites, ampliação de permissões ou Helper individual.
Treino Party × Bot, não PvP online; catálogo/Wheel/fórmulas/máscaras completos e
teclado físico manual continuam gaps documentados. Próxima fatia: NEXT_TASK.md.

## Histórico da implementação e espera (não é pendência atual)

## Follow-up — arraste esquerdo e vizinhos

Usuário corrigiu a resposta equivocada: apenas tiles imediatamente vizinhos,
não7tiles de distância. O código15cc18b já fazia left-drag/drop; follow-up adiciona
preview de8vizinhos, até7livres, fornecido read-only pelo mesmo domínio/readiness
da fila de push. Não afrouxa quinas/occupancy/reservas/atraso/clock. Tecla8 é
alternativa, não pré-requisito. Holding não desloca o alvo. Origem não é destino.
Typecheck,27unitáriosdirecionados e1E2E de push PASS; executar gates completos.
Commit15cc18bcc2f9111a80de19960ca1c904a017a7f5 está no origin, CI push39345124901/
PR39345131120 em execução. Follow-up ainda não commitado; não confundir versões.

### Fechamento local do follow-up

Estado operacional: runtimebbd0fac90bbc5ba27be4c9189f36513e1d59ee93 commitado e
push normal, local=origin confirmado. CI push39347671213/PR39347675576 em
validação E2E. Build:preview do bbd0fac e smoke compilado de kit/vizinhos + hunt
normal até boss PASS, manifest local correto, zero erros/resíduos. Única mudança
posterior ao runtime: qa-training-kit espera o deadline lógico de2000ms do push,
em vez de500ms de parede, antes do segundo gesto; sintaxe e execução compilada
PASS. É tooling de QA, não bundle/combate. Falta CI/deploy/manifest/smoke público
do bbd0fac; depois registrar, commit checkpoint doc/QA e push sem novo runtime.

- Health,251/251unitários(22arquivos,54,59s),typecheck/build e full Edge40/40
  (6,2min,1worker) PASS; subset final de push1/1(9,4s) PASS. Smoke real
  qa-training-kit validou novamente runas/cura/push por tecla e arraste, pausa/
  reset e sete destinos no fixture diagonal. Captura dos vizinhos inspecionada,
  sem erros/resíduos. Renderer não decide validade; holding não move a origem.
- Publicação anterior15cc18b: push39345124901 e PR39345131120 success; jobs
  validate118375757677/deploy118381843166 success. version.json público confirmou
  15cc18bcc2f9111a80de19960ca1c904a017a7f5 em20/10UTC. Isso NÃO confirma deploy
  do follow-up, que exige novo commit/push/CI/manifest/smoke.

## Sessão atual

- Entrada dca56a8aff487bd0171b04209f8d7205723abde9, local=origin e limpa;
  branch feature/gameplay-first-mvp2a/base visual58d9720. Fetch/health feitos.
- Concluído: SD/Destroy Field, push atrasado por MovementSystem, teclas1–9,
  mira de chão independente de sprites maiores e pixel art original três heróis.
  Perfil de nove magias, cooldown secundário e Mana Buffer dos magos só no treino.
  Sem zoom; sem alterar economia/saves/hunt normal. TRAINING_2B3 e ART_PROMPTS.
- Base antes das edições: typecheck/231 unit/build PASS. Novos E2E direcionados
  4/4 e regressão inicial de runas/sprites4/4 PASS. Imagens dos três atlas e captura
  do gameplay inspecionadas. São testes reais Edge do repositório, não teclado
  físico manual. Gate completo atual na execução70587; registrar resultado final.
- Não iniciado: Wheel completa, catálogo de cinco vocações, PvP online. Dano,
  requisitos, autoaim e máscaras ainda parcialmente de protótipo, documentados.
- Arquivos: combat/control/data/events, renderer/presentation, HUD/main/CSS,
  testes RuneSystem/Push/ManaBuffer/sprites/E2E, importador/gerador e docs.
  Raws fora do bundle em art/source/pixel-v1; runtime public/assets/original/pixel.
- Publicação nova NÃO confirmada ainda; público anterior88d3fc6. Usuário autorizou
  Pages depois dos gates. Não merge/Sites. Próximo comando: pnpm typecheck;
  pnpm exec vitest run; pnpm build; pnpm exec playwright test --reporter=line --workers=1.

## Evidência local consolidada

- pnpm install --frozen-lockfile, health, typecheck, build e diff --check PASS.
  Suíte final de 250/250 unitários,22 arquivos,88,66s. Full Edge40/40,1worker,
  7,1min; após ajuste restrito à mira SD no sprite, typecheck/build e subset de
  runas/sprites8/8 PASS(44s). Nenhum timeout/assert antigo ou baseline afrouxado.
- Acrescentados casos de CD secundário/grupo attack e SD com impacto real; fixture
  de baixo HP confirma Mana Buffer no pipeline de dano (restaura dados após uso).
- scripts/qa-training-kit.mjs local (relógio real): mira MW, rejeição de remoção de
  MW sem gastar carga, Destroy Field, SD, Heal Friend em aliado, dois pushes por
  hotkey/drag, pausa e reset; zero erros/resíduos. Não usa relógio simulado.
- scripts/qa-training.mjs: três vitórias,1442eventos, saves econômicos idênticos;
  zero overlap/OOB/reserva/projétil/condição/push órfãos. Fim:590display objects,
  máximo6VFX ativos, update apresentação médio0,093ms/máximo1,6ms na amostra.
- scripts/qa-preview.mjs: hunt normal 1x→4x, boss real,19kills/4240XP/1489gold/
  1token,52.350ms lógicos; zero erros/warnings/resíduos. Apresentação média0,112ms,
  máximo2,4ms,594objetos. Instrumentação rAF: 1x média1,50/max122,3ms;4x
  média1,34/max48,4ms. Custo de callback, não FPS; coleta concorrente a unitários,
  sem baseline comparável para afirmar ganho. Chunk >500kB continua warning.
- Reimportação dos três raw PNGs produziu SHA256 idêntico aos runtime PNGs;
  art:generate deixou assets rastreados sem diff. Raw art não está em dist.
  Capturas de mira/kit/gameplay e os três atlas inspecionados.
- Lint não configurado; teclado físico/NumLock manual não foi certificado. QA
  usa Edge real automatizado do repositório. Sem workaround de Computer Use.

## Histórico — MVP 2B.2 publicado e verificado

Entrada em 2378cb5f51f9013b95fa839e8b20a620d354bfd9, local=origin, worktree
limpa, branch feature/gameplay-first-mvp2a e base visual 58d9720 confirmadas.
Fetch/health aprovados; nenhum trabalho existente descartado.

## Fechamento da implementação e gates

- A execução antiga 66046 terminou com 4 timeouts e 2 erros de RPC do worker;
  NÃO foi considerada um gate verde nem prova de regressão funcional.
- Profiling local apontou alocações repetidas na LoS. visitSupercover mantém a
  ordem/quinas da geometria e interrompe no primeiro bloqueio; trace retorna
  dados independentes. Sem cache de visibilidade ou alteração de A*/regras.
- A/B seed 803: hash JSON completo idêntico
  edcf9f6d0aa4488bda430a900d74003401d5f924d48fc6b5627da8a5f87a554b em batch e
  frames 73/1000. Na amostra desta máquina: baseline 1254/1274/1300 ms e atual
  983/1024/986 ms. É custo de simulação, não FPS ou benchmark universal.
- pnpm typecheck; 231/231 unitários (20 arquivos, 103,02 s); pnpm build
  (769 módulos); 36/36 E2E (7,8 min, Edge, 1 worker); git diff --check: PASS.
  Auto baseline de 24 cenários e os três loops progressivos antigos preservados.
  Nenhum timeout/assertion antigo ou snapshot foi afrouxado/regenerado.
- pnpm install --frozen-lockfile e pnpm art:generate com diff vazio dos assets:
  PASS. Nenhuma dependência/lockfile alterada. Warning de chunk >500 kB permanece.
- E2E de treino: targeting, colisão, quina, burning, pausa, expiração, reset,
  três vitórias sem recompensas/alteração econômica, limpeza e três resoluções.
  Screenshot training-runes-gameplay.png inspecionado: party, barras, kit e
  runas legíveis. Imagens/trace/profile ficam em test-results (fora do bundle).
- Smoke real-clock local PASS: runas/pausa/expiração/reset e três treinos,
  1522 eventos, economia inalterada, zero console/overlap/out-of-bounds/reservas/
  projéteis/condições/VFX residuais. scripts/qa-training.mjs é reutilizável no
  base path Pages, em contexto isolado sem tocar saves do usuário.
- Smoke da hunt normal 1x→4x PASS: vitória em 52350 ms lógicos, 19 kills,
  4240 XP, 1489 ouro e um Boss Token; zero erros/warnings e lifecycle encerrado.
  Sync da apresentação: treino média 0,110 ms / pico 2 ms / 590 objetos finais;
  hunt média 0,126 ms / pico 2,9 ms / 594 objetos. Callback rAF na hunt teve picos
  115,4 ms (1x) e 67,7 ms (4x): continua sendo gap de profiling, não FPS medido.

## Publicação e QA público concluídos

Runtime: 88d3fc6256666038b0581c0674717cb20e45e79c, commit/push normal para
origin confirmado por ls-remote; worktree limpa e local=remoto. PR #3 continua
aberta, sem merge. CI push e deploy PASS:
https://github.com/silvamarcello1-art/tactical-hunt-lion-temple/actions/runs/39311311231
CI PR PASS:
https://github.com/silvamarcello1-art/tactical-hunt-lion-temple/actions/runs/39311319743
Logs confirmam 231 unitários/36 E2E em ambas; push 36 E2E em 28,9 min, PR em
22,4 min. A retomada do ambiente foi posterior à conclusão remota; não houve
alteração de código durante a espera. Manifest público confirmado em 19/10,
após 23:00 UTC, no SHA exato 88d3fc6, não no WIP anterior.

Preview: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/?training=1&v=88d3fc6
Build compilado local no base path Pages, com manifest 88d3fc6, passou treino e
hunt normal. Smoke público real-clock também PASS: parede/campo/colisão/burning,
pausa/expiração/reset e três treinos, 1520 eventos, economia inalterada. Zero
console, overlaps, out-of-bounds, reservas, projéteis/condições/VFX residuais.
Screenshot mvp2b2-public-runes.png inspecionado; bot/party/kit e runas visíveis.
Hunt pública normal 1x→4x: vitória em 52350 ms lógicos, 19 kills, 4240 XP,
1489 ouro, um Boss Token; zero erros/warnings e lifecycle encerrado.

Amostras públicas: apresentação treino média 0,080 ms/pico 0,9 ms/590 objetos;
hunt 0,079 ms/1,3 ms/594 objetos. Callback rAF teve pico 59,7 ms em 1x e 45,1 ms
em 4x. Não é FPS medido ou prova de ganho de renderização. Arte permanece
blockout, teclado físico/NumLock e aprovação humana de balanceamento são gaps.

Fechamento documental posterior usa [skip ci], sem mudar runtime/dependências;
não confundir HEAD documental com SHA servido. Não repetir gates completos sem
alteração de runtime. Próxima etapa está em NEXT_TASK, sem iniciar rede/Wheel
inteira incidentalmente. Não há release estável aprovada por esta entrega.
Computer Use nativo não foi usado para contornar a interrupção anterior; o QA
executa testes do próprio repositório em contexto isolado do navegador.
Não houve merge, Sites, force push, mudança de permissões ou Helper individual.

## Histórico — checkpoint parcial anterior

# Checkpoint parcial — MVP 2B.2 — 19/10/2026

Base local/origin 41477b948bdbda6079477ffb2163c01211b9f494, limpa na entrada;
branch feature/gameplay-first-mvp2a, base visual 58d9720. Fetch/health confirmados.
Usuário escolheu treino local contra bot, não PvP online. Sem backend, Helper
individual, merge, force push, Sites ou novas permissões.

## Concluído no código

- RuneSystem/data/runes, comando rune, charges/cooldown/range/LoS e terreno de
  Magic Wall; Fire Field walkable com entrada/burning fixo sem crítico/dodge.
- Scheduler com prazos de expiração/DoT, cleanup de sessão e eventos próprios.
- Treino Party × Bot no mesmo CombatEngine; base stats, Manual, sem XP/gold/
  drops/Boss Tokens/forja/Loop. Stores econômicos não recebem eventos de treino.
- Targeting 4/5/clique/ESC, UI do kit, pulsos/fade próprios no Pixi, input recente
  por eixo e revalidação de quinas/footprint em passos comprometidos de treino.
- Drenagem batch evita cópias incrementais descartadas; API ao vivo ainda clona.
  Experimento heap A* foi retirado, não melhorou cenário real; A* original intacto.
- Contrato/fontes/limites e plano de magias/passivas/Wheel em TACTICAL_RUNES.

## Parcialmente concluído / bloqueio da sessão

Typecheck passou. Baseline inicial: 216/216 unitários e build aprovados.
Novos testes: RuneSystem 12/12 e rota congelada 1/1 aprovados em casos isolados;
três E2E iniciais aprovaram runas, colisão, burning, pausa, expiração, reset,
isolamento econômico e resoluções. Depois o caso de vitória foi expandido para
três treinos e screenshot; essa versão ainda exige execução completa.

Gates completos NÃO verdes: rodadas tiveram 226/227 e 228/229 com timeout de 5s
em GameplayPolish (frame equivalence), sem divergência de resultado. Após retirar
heap, caso isolado 4025 ms; baseline Git 41477b9 no mesmo teste 4021 ms. Não houve
alteração de timeouts, assertions antigas ou snapshots. Profiling A/B confirmou
hash completo edcf9f6d0aa4488bda430a900d74003401d5f924d48fc6b5627da8a5f87a554b
para a seed 803, batch e frames 73/1000. Não é prova de melhoria de FPS.

Última execução terminal 66046 estava ativa: typecheck passou e Auto baseline
24 cenários passou (35,4s); depois um teste antigo de tiles em CombatEngine
excedeu 5s (5988 ms). Os gates seguintes são fail-fast; ler o resultado final.
Rodadas anteriores não chegaram ao build/E2E completos por causa dos unitários.

Playtest manual interrompido pela skill Computer Use: a ferramenta não conseguiu
confirmar com segurança a URL da janela do Edge e encerrou Computer Use neste
turno. Não emitir mais inputs nem contornar o bloqueio. Edge foi aberto numa
nova guia, sem navegação/entrada de texto/click no jogo. Nenhum save apagado.

## Não iniciado

Catálogo inteiro do Tibia atual, conversão de passivas/Wheel, Paladin/Monk,
Energy/Poison Field, crafting/supplies persistentes e PvP online. Valores de
runas são parâmetros de treino documentados, não paridade numérica certificada.
Publicação 2B.2 não realizada. Último runtime verificado em 10/10 era d51361c.

## Arquivos e continuação

Runtime: CombatEngine/RuneSystem, MovementSystem/OccupancyGrid, PlayerCommand/
PlayerControls/PlayerInput/InteractionState/PlayerControlPort, events/types,
PixiRenderer/CombatPresentationSystem, main/style e data/runes/training.
Testes: RuneSystem.test, Pathfinder.test e tests/e2e/runes.spec. Diagnósticos
read-only: scripts/profile-grid.mjs e baseline-vitest.config.mjs. Documentos:
TACTICAL_RUNES, ARCHITECTURE, PLAYER_CONTROL, COMBAT_PRESENTATION, ART_DIRECTION,
MVP_ROADMAP, DECISIONS, CURRENT_STATE, NEXT_TASK, SESSION_CHECKPOINT e CHANGELOG.

Próximo comando recomendado: pnpm health; depois ler saída da sessão 66046 e
executar os gates da implementação, sem elevar limites. Retomar QA manual em
nova sessão somente com URL reconhecida. Publicar apenas após validação verde.
Checkpoint WIP com [skip ci] evita deploy automático de código ainda em QA.

## Histórico — última entrega aprovada/publicada

# Checkpoint — MVP 2B.1 — retomada 10/10/2026

Branch `feature/gameplay-first-mvp2a`; entrada local/origin
`7062c5d872e4d43f7a61a2c06ad2b1389d0f2812`, upstream confirmado, worktree limpa
antes desta implementação. Origin GitHub correto; base visual 58d9720. Nenhuma
alteração alheia descartada, nenhum Helper/Sites/merge/force push.

Concluído: bindings estáveis, foco/targeting/self-heal, oito direções físicas,
Assistido por herói/persistência de booleans, projéteis contínuos, prazos lógicos,
party/slots/passivas compactos, dois inimigos/composições e debug opt-in.
Preservados inventário, recibos, RNG isolado e troca da reserva com mochila cheia.

Auditoria de publicação anterior: push 37353880622 falhou no timeout total do
cenário mouse-first (27/28 E2E passaram); PR 37353885091 passou. Deploy pulado;
manifest público ainda 056a743, não 8e2a309. Não atribuir esse site ao código novo.

Gates em 10/10: health, typecheck, 216/216 unitários (17 arquivos), build
de 766 módulos e reprodução de arte com hashes idênticos aprovados. Playwright
33/33 aprovados (8,2 min, um worker); diff --check aprovado, diff completo revisto.
Instalação frozen-lockfile também aprovada; nenhuma dependência/lockfile alterada.
Vitest serializa arquivos para evitar contenção de CPU: nenhum timeout/assertion
existente ampliado. Novos fixtures de teclado verificam origem livre e reinício
por direção; fixture antigo de obstáculos usa roster antigo (mesmos asserts).
Sem alterações de snapshots de combate. Regra nova isolada por `polishedRules`.

Correção causal final: no terceiro loop progressivo, Sorcerer morria enquanto
Druid tinha mana mas LoS de cura bloqueada. Auto Druid agora busca tile seguro e
alcançável de cura antes da ofensiva; Assistido não move. Três ciclos unitários
52350/50850/46350 ms, todos com três heróis vivos. Assert E2E original preservado.

Manual 10/10, save existente Lv22/23 preservado: 1x→4x, Loop OFF, vitória em
37s lógicos, 19 kills, 4240 XP, 1505 gold e 1 Boss Token real. Ao final zero
overlap/OOB/reservas/projéteis/telegraphs/tweens/resíduos, três heróis. Amostra
syncPresentation média 0,174 ms/máximo 3 ms, 594 objetos finais, pico 93 objetos
visuais ativos.
E2E de apresentação da rodada final: média 0,153 ms/máximo 3,8 ms,
594 objetos finais/pico 98 objetos visuais ativos.
São amostras diferentes, não FPS nem prova de ganho sobre a versão anterior.
Erros antigos da aba ao faltar servidor desapareceram após startup/reload;
filtrar console pelo timestamp desta sessão, não atribuí-los ao novo combate.
Manual: Digit1 Druid heal_friend, Digit1 Sorcerer flame_strike e Digit2 Knight
berserk resolveram os IDs corretos; mana foi debitada uma vez. ESC cancelou
targeting; quatro estados ON/OFF legíveis, alvo morto sem autoaquisição; Numpad4
moveu Sorcerer 5:12→4:12 mantendo Assistido. Latência observada desse tap 185,6 ms,
uma amostra com execução de gates concomitante, não benchmark comparável.
Smoke isolado real com scripts/qa-preview.mjs (1x→4x): vitória em 52s, 19 kills,
4240 XP, 1489 gold, um Boss Token, cura 1237; zero erros/avisos e lifecycle limpo.
Custo de execução de callbacks rAF (update/render/UI, não FPS): 1x, 3684 amostras,
média 2,034 ms/máximo 143 ms; 4x, 2508 amostras, média 2,414 ms/máximo 84 ms.
Há picos a perfilar; não foi feita comparação controlada com a versão anterior.
Playtest continuou até cinco ciclos concluídos (incluindo teste de modos e três
loops Auto posteriores). Loop OFF encerrou normalmente; três unidades e zero
resíduos/reservas/projéteis/overlap/OOB ao final. Nenhum save foi apagado.
Novo E2E inicialmente contou o intervalo fechado de 250 ms como um tick; dois
eventos eram de ticks distintos (250/500). Corrigido para exigir uma ação por
timestamp e categorias permitidas; caso isolado e suíte completa passaram.

Evidência inicial: seis hunts 803/811/814, wave ON/OFF, seis vitórias, zero overlap,
OOB e reservas/projéteis/perigos órfãos. Timeline exata em batch e frames 73/1000.
Numpad testado no Edge via protocolo físico com key numérico e key de navegação;
a luz/estado físico NumLock de um teclado real não pode ser alternada neste
ambiente. Esse playtest físico permanece como limitação explícita.

Código commitado/pushed: `d51361c0b822fa69d1e23d36ffd7e5b207c03462`;
local = origin confirmado, worktree limpa após commit. PR #3 atualizada.
CI push `38090057573` e PR `38090060114` concluídos com sucesso. O run do push
validou 216 unitários, 33 E2E (27,4 min no runner Windows), ambos os builds,
arte reproduzível e diff; deploy Pages aprovado. Nenhuma proteção alterada.
Smoke do build:preview no caminho real /tactical-hunt-lion-temple/ confirmou
version.json nesse SHA, vitória em 52s, 19 kills, 4240 XP, 1489 gold e um Boss Token.
Zero erros/avisos, overlap/OOB/reservas/projéteis/VFX residuais; três heróis vivos.
Callbacks rAF compilados: 1x, 3644 amostras, média 2,207 ms/máximo 127,5 ms;
4x, 2214 amostras, média 2,907 ms/máximo 130,3 ms. São custos de callbacks,
não FPS; picos permanecem como investigação futura, sem comparação controlada.

Publicação confirmada em 10/10: version.json público retornou exatamente
`d51361c0b822fa69d1e23d36ffd7e5b207c03462`. Smoke isolado 1x→4x no Pages:
vitória em 52s, 19 kills, 4240 XP, 1489 gold, um Boss Token e cura 1237.
Zero erros/avisos, overlap/OOB/reservas/projéteis/telegraphs/tweens/resíduos;
três heróis vivos e zero divergência de máscara/sync. 594 objetos finais,
pico 97 objetos visuais ativos; syncPresentation média 0,108 ms/máximo 3,5 ms.
Callbacks rAF públicos: 1x, 4016 amostras, média 1,538 ms/máximo 123,6 ms;
4x, 3094 amostras, média 1,660 ms/máximo 60,3 ms. Não são FPS nem comparação
controlada; picos continuam pendentes de profiling. Drops de equipamento variam
por sessão no RNG de recompensas isolado, sem mudar o resultado do combate.
CUA conferiu Druid/slots/Assistido com ambos toggles ON no site novo; voltou a
Auto sem iniciar combate, apagar saves ou alterar preferências persistentes.
Evidências ignoradas, fora do bundle: test-results/mvp2b1-public-gameplay.png e
mvp2b1-public-victory.png. Preview: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/

Este fechamento documental é um commit separado com [skip ci], sem alteração
de runtime; o SHA servido e validado é d51361c, não o HEAD documental posterior.
Nenhum merge estável ou envio a Sites. Próximo passo: playtest físico NumLock,
aprovação da arte/balanceamento e profiling; só então planejar 2C. Gates locais
e remotos encerrados; não repetir sem mudança de código.

## Histórico — checkpoint MVP 2B

# Checkpoint atual — MVP 2B (05/10/2026, em validação)

- Branch: `feature/gameplay-first-mvp2a`; ponto inicial local/remoto `bf8e823f8a9329a9cb42ddd460b6ce467b1e7ab2`.
- Implementado no worktree: drops determinísticos isolados do RNG de combate, inventário com IDs/stack/reserva, equipamento por vocação, stats canônicos, forja +1 atômica, persistência local versionada, drawer de comparação e relatório real.
- Equipar/forjar somente entre hunts com Loop OFF. Saves inválidos são preservados; recompensas pendentes bloqueiam novas hunts e transações até recuperação.
- Novos arquivos: EquipmentStore/test, Equipment, EquipmentDrops, items, EquipmentPanel, ItemIcons, E2E equipment e EQUIPMENT_AND_LOOT. Integrações: CombatEngine, eventos, ProgressionStore, PlayerControls, main/style e E2E existentes.
- Gates em 01/10: health, TypeScript, `pnpm exec vitest run` (183/183 em 16 arquivos), build (765 módulos), Playwright (27/27 em 5,6 min, um worker) e diff --check aprovados. Em 30/09 houve timeout de teste antigo/RPC; a nova rodada passou mantendo todos os limites/assertions/snapshots originais. Exigir CI verde e manifest conferido antes de considerar publicado.
- Ajustes finais validados: pagehide preserva arena em saída cancelada; relatório suspende reinício do Loop; loot varia deterministicamente por sessão. Teste de falha de storage aguarda um drop real (1 s não garantia morte no nível 1).
- Manual em 01/10: vitória equipada em 32 s lógicos, 17 mortes, 4.240 XP, 1.512 gold e Boss Token real. Nova alternativa Martelo versus Gume +1: -20 ataque/+12 defesa; mochila 24/24 preservou excedente na reserva. Forja +1 e reload já verificados. Amostra real de syncPresentation: média 0,046 ms, máximo 2,1 ms; 594 objetos, zero VFX/resíduos/reservas/overlap/OOB ao final. Não é medição de FPS.
- Commit/push confirmados: `dca53395721fa0e1e22d85a7ed2f7b87cb9d9276`, local = origin, PR #3 aberta. Diff revisto; README/contratos/roadmap atualizados. Nenhum merge/Sites.
- CI de push/deploy `36815714472` e PR `36815717660` cancelados antes da publicação: o playtest revelou equipamento preso na reserva com mochila cheia. Não representam aprovação final.
- Correção: equipar diretamente da reserva, trocando o item anterior para ela quando a mochila está cheia, numa gravação atômica. Testes específicos aprovados: 17 unitários de equipamento e E2E de mochila cheia/reload; suíte completa em execução. Manual confirmou comparação, equipamento da reserva e persistência após reload.
- Próxima verificação: finalizar gates da correção, commit/push, acompanhar novo CI e verificar https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/version.json.
- Retomada 05/10: local/origin continuam dca5339; alterações preservadas. TypeScript, 184/184 unitários com um worker e build aprovados. Nenhum timeout/assertion alterado; a execução concorrente de 01/10 havia excedido 5 s no teste antigo de equivalência de timeline.
- Manual 05/10: vitória equipada em 32 s, 17 mortes, 4.240 XP, 1.519 gold, 1 Boss Token e console sem erros. Troca direta Couraça da reserva por Manto equipado manteve mochila 24/24 e nove itens na reserva; comparação mostrou +6 defesa/+80 HP/-8 magia/-80 mana. Sem exclusão de dados ou reset de progresso.
- Gates finais 05/10: health, TypeScript, 184/184 unitários (um worker), build, 28/28 E2E (5,1 min, um worker), diff --check aprovados; diff completo revisto. Amostra manual syncPresentation média 0,051 ms/máximo 6,1 ms, zero overlap/OOB/reservas/resíduos. Commit/push da correção e CI são o próximo passo; ainda não afirmar publicação.
- Entrega da correção 05/10: commit 8e2a309f07a0521ceed02e265395df56acdb3600 enviado; HEAD local = remoto e worktree limpo confirmados antes deste registro documental. PR #3 atualizada; sem merge.
- CI em andamento: push/deploy https://github.com/silvamarcello1-art/tactical-hunt-lion-temple/actions/runs/37353880622 e PR https://github.com/silvamarcello1-art/tactical-hunt-lion-temple/actions/runs/37353885091. Última observação do push: instalação do Edge após gates unitários/arte. Ainda sem confirmação de deploy/manifest; preview não deve ser apresentado como versão nova.
- Próximo comando: consultar jobs do run 37353880622. Se falhar, ler logs/trace antes de alterar código; se aprovado, conferir version.json e smoke público. Este checkpoint documental não altera o código testado nem requer republicação própria.

## Histórico anterior — Mouse-first / Clean HUD / Encounter Depth

Data: 26/09/2026. Branch: feature/gameplay-first-mvp2a.
Base conferida: origin/feature/visual-identity-foundation =
58d97203a7666e1f5ed3d0a6040bc2d95c54ab38.
Histórico dos checkpoints anteriores permanece no Git.

## Concluído

- Preservados PixiJS, motor incremental, grade autoritativa e arte dos heróis.
- Mouse: chão MoveTo (último destino vence), seleção, engage por botão direito,
  Look por chord nas duas ordens; consumo exclusivo, sem clique através do HUD.
- Correção real de browser: pointerdown não entrega o segundo botão; roteamento
  usa mousedown/up e bloqueia picking duplicado de Pixi.
- Auto autônomo; Manual somente ordens/casts explícitos; Assisted espera engage
  e para ao morrer o alvo. Seleção não altera modo. WASD assume Manual.
- Três slots reais, magias/ícones originais, cura disponível mesmo com inimigo
  selecionado, pausa/velocidades e cooldown no mesmo relógio.
- HUD compacto, party mínima, A/M/S, mundo proporcional e painéis em drawers.
- Quatro perfis: bruiser, hunter, flanker e caster. Orientação/candidatos lógicos
  pontuados deterministicamente, cadence de 1500 ms e recuperação de linha de tiro.
- Boss com fase abaixo de 50% HP e Queda da Coroa: preaviso 1250 ms, impacto,
  tiles vazios bloqueados por 3000 ms, revisão da grade, revalidação e restauração.
- Map state limpo após reset/floor/loop; origens ocupadas e paredes preservadas.
- Somente perigo especial tem pretelegraph; VFX originais em camadas/pools.
- Dois sprites originais adicionais e relevos do templo; oito atores no manifesto.
- Progressão local já presente no worktree foi preservada/integrada, não descartada.
- Build exclui 32 cópias de referências legadas de dist. Fontes em public intactas.

## Gates locais

| Gate | Evidência |
|---|---|
| Instalação | pnpm install --frozen-lockfile, sem alteração do lockfile |
| TypeScript | aprovado |
| Vitest | 167/167 em 15 arquivos |
| Build | aprovado, 759 módulos |
| Playwright/Edge | 24/24, um worker, 5,0 min na rodada final |
| Stress Auto | 24 combinações 803–814 / wave ON-OFF, execução integral repetida |
| Stress controles | 24 hunts mistas, 24 vitórias, sem falhas de integridade |
| Loop / resoluções | três loops; 1366×768, 1600×900, 1920×1080 |
| Mouse | três tamanhos, chord, HUD, native menu boundary, destino mais recente |
| Integridade | zero overlaps, OOB, reservas órfãs, resíduos e mask mismatch nos cenários |
| Manual visual | hunt com 17 kills e boss reward; console sem erro/warning |
| Revisão | diff revisto; git diff --check aprovado |

Novo ruleset muda intencionalmente os resultados históricos: roster, magias,
IA e boss não são mais os do MVP 1C. Hashes antigos continuam no histórico;
novo snapshot guarda SHA-256 de todo HuntResult/timeline, além dos resumos.
Não atualizar snapshots para ocultar uma regressão.

Amostra headless Edge 1366×768/4x: syncPresentation médio ~0,082 ms, máximo
~2,4 ms; 594 objetos ao final, pico de 97 objetos visuais ativos, 81 sprites
de efeito criados/reutilizados, 306 recálculos de caminho e 27 decisões táticas.
São medidas desta execução, não promessa de FPS ou capacidade de PvP massivo.

## Arquivos principais alterados

CombatEngine, eventos/tipos, PlayerControls/Port/Command, main, GameplayHUD,
index/style, abilities/actionBar/config/encounters/worldDescriptions,
DirectionalTactics, TemporaryTerrain, Progression/Store, PixiRenderer,
OriginalEffects, DisplayObjectPool, SpriteDefinition e gerador/manifesto/assets.
Testes: EncounterDepth, MouseGesture, autoBaseline + snapshots, controles,
progressão, sprites e E2E. Scripts/package: exclusão de referências do build.
Docs: CURRENT_STATE, NEXT_TASK, PLAYER_CONTROL, COMBAT_PRESENTATION,
ARCHITECTURE, CHANGELOG e instrução de baseline em AGENTS.

## Limites / não iniciado

- Câmera fixa; pan/zoom interativo e massa de jogadores ainda não implementados.
- Interface desktop, largura mínima de 560 px; mobile estreito requer outra rodada.
- Arte ainda blockout original. Sem backend, rede, PvP, quests ou inventário real.
- Helper individual e sua branch continuam intocados.
- Nenhum merge/force push. Publicação estável não autorizada por exceção.
- Consulta ao chatgpt.site foi rejeitada pela revisão automática devido à regra
  contra Sites. Nenhum envio à origem Sites; não contornar por outro nome/URL.

## Entrega e continuidade

### Estado final da retomada de 30/09

- Código validado e enviado: `056a743bf9417edc7b29da0433e61e22023f1e4c`.
- Local: 167/167 unitários, 24/24 E2E (5,0 min), typecheck, build e diff check.
  Os timeouts locais transitórios da rodada anterior não se repetiram.
- CI push `36526442306`: validate aprovado, 167 unitários, 24 E2E (19,6 min),
  build, build:preview, diff check e upload do artifact aprovados.
- CI PR `36526446097`: aprovado; PR #3 continua aberto, sem merge.
- Bloqueio anterior de allowlist resolvido com autorização explícita do usuário:
  adicionada somente `feature/gameplay-first-mvp2a` (policy 61489770), mantendo
  `recovery/antigravity-mvp1b` (60465899) e proteção branch_policy 66126927.
- Reexecução somente dos jobs falhos do run `36526442306`, tentativa 2:
  deploy `109758004341` aprovado com o artifact validado antes de expirar.
- Manifest público version.json confirmou `056a743bf9417edc7b29da0433e61e22023f1e4c`.
  URL: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/
- Smoke público: Auto, 4x, Loop OFF; vitória em 47s lógicos, 17 mortes,
  4.240 XP, 1.515 gold, 1 Boss Token, cura 1.232. Boss realmente morto.
  Console sem erros/avisos; zero overlap/OOB/reservas pendentes/efeitos,
  projéteis e tweens residuais. Sem merge, sem alteração do site estável.
- Limite da ferramenta de navegador: cliques automatizados chegaram deslocados
  no viewport; controles foram acionados por foco + Enter e verificados na UI.
  Configuração aberta durante a tentativa foi cancelada sem salvar; gameplay
  e o smoke não exigiram nenhuma mudança de código. Mouse já coberto pelos E2E.
- Este registro altera somente documentação; CI não precisa ser repetido para
  ele. O artifact validado permanece vinculado ao SHA de código acima.

Entrega de gameplay enviada em 1dd6c573552abf811509f699d1172f5086be1219; PR #3.
O primeiro CI dessa entrega passou os 167 unitários e 19 E2E, mas detectou duas
corridas de testes: clicar depois da janela de 2s do loop e clicar em reiniciar
depois da morte do boss. Não houve deploy nesse run (36247097005).
O run do PR (36247139458) também expôs loop extra durante teste de idempotência
e teclas da diagonal chegando em ticks diferentes. A idempotência agora desliga
loop antes de iniciar; o chord é enviado com relógio congelado entre keydowns.
Correção posterior somente na sincronização E2E: Clock do Playwright executa
todos os frames e congela nas fronteiras para o clique real, sem mock do motor,
skip, force click ou redução das verificações. Fades finais são avançados antes
da contagem de resíduos. Demais cenários mantêm relógio real. Traces passam a ser
preservados como artifact quando o CI falhar. Os 167 unitários foram revalidados
isoladamente com um worker; timeout sob carga concorrente não motivou mudança
em limites nem nas assertions. Uma rodada local foi interrompida por suspensão
de rede do navegador (ERR_NETWORK_IO_SUSPENDED), exigindo nova rodada E2E limpa.
Rodada limpa posterior: 167/167 unitários (um worker), 24/24 E2E em 6,8 min,
typecheck, build e diff --check aprovados. Nenhuma alteração adicional em src/.
Arquivos da correção: controlled-clock.ts, gameplay-shell.spec.ts,
mvp0.spec.ts, player-control.spec.ts e .github/workflows/preview.yml,
além deste checkpoint, NEXT_TASK e CHANGELOG.

O run 36285078409 passou os unitários, mas estourou o orçamento total de E2E.
Traces comprovam três loops concluídos, sem erros de console, e chamadas de
250 ms custando até 1,54 s; clicks chegam a 8,43 s e teardown a 31 s no runner.
Um trace continha 1300 JPEGs (55,6 MB), contra 2 MB de eventos/snapshots.
Correção operacional seguinte: retirar somente o screencast contínuo do trace
(preservar snapshots, ações, fontes e PNG de falha) e dobrar orçamento total
apenas no CI. Timeouts de assertions/estados, cobertura e motor não mudam.
Rodada local com essa configuração: 24/24 E2E aprovados em 6,8 min (exit 0),
sem falhas no relatório final. Os 167 unitários e o build da mesma implementação
de gameplay já estavam aprovados; esta correção não altera src/.

Run 36487765160 (3a98e09): 167 unitários e 23/24 E2E aprovados; os três
cenários de loop e todas as falhas anteriores passaram. Falha restante no teste
de hotbar: leitura de lion-3 em (5,14), seguida de clique ~0,9 s depois, quando
o monstro já estava em (5,13). O trace confirma MoveTo no chão, não seleção.
Correção isolada: amostrar footpoint visual com Clock controlado, avançando
frames reais para WASD/cast e também durante a pausa para verificar cooldown.
Sem mudança em produção nem relaxamento de assertions. Deploy desse run pulado.
Teste de hotbar corrigido: três execuções consecutivas aprovadas no Edge local.

Push ce7b85f gerou run 36490592001, cancelado ainda na fila pelo PR
36490597126 porque ambos usavam o grupo único feature-pages. Separar grupo
de validação por PR do grupo serializado de deploy evita essa substituição.
Todos os gates e a condição de publicação continuam iguais. Referência:
https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency

ee1b502: PR run 36490812435 aprovou 167 unitários, 24 E2E e ambos os builds.
Push run 36490806945 falhou no limite total de 220 s do terceiro cenário de
três loops, após as verificações de conclusão/loot; o mesmo teste passou no PR.
Os três cenários duram ~210 s no CI. O orçamento especial de 360 s existia só
no teste de progressão: agora é compartilhado pelos três, sem mudar limites
de estados/assertions ou pular verificações. Correção de seleção passou no CI.
Revalidações locais nesta retomada sofreram timeouts de simulação e RPC do
Vitest (Node 24), além de perda temporária de DNS; não houve alteração de
assertions do motor nem de seus timeouts. CI Node 22 aprovou esses unitários.
Padronização dos loops validada localmente: typecheck, 3/3 cenários longos
(1,5 min) e diff --check aprovados, sem mudanças de gameplay.

O workflow preview.yml
é a fonte do estado de publicação GitHub Pages. Confirmar deployment e version.json
contra SHA remoto no post-flight; site estável permanece separado e não foi alterado.
Link de preview configurado: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/

Próximo comando recomendado: pnpm health (após git fetch origin --prune).
Próxima tarefa: revisão humana do preview e balanceamento; depois um slice curto
de exploração/objeto/NPC, conforme NEXT_TASK. Não reimplementar controles/grade.

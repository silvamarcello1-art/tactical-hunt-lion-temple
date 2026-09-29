# Checkpoint — Mouse-first / Clean HUD / Encounter Depth

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

### Estado final da retomada de 29/09

- Código validado e enviado: `056a743bf9417edc7b29da0433e61e22023f1e4c`.
- Local: 167/167 unitários, 24/24 E2E (5,0 min), typecheck, build e diff check.
  Os timeouts locais transitórios da rodada anterior não se repetiram.
- CI push `36526442306`: validate aprovado, 167 unitários, 24 E2E (19,6 min),
  build, build:preview, diff check e upload do artifact aprovados.
- CI PR `36526446097`: aprovado; PR #3 continua aberto, sem merge.
- Deploy `109276025132`: rejeitado pelas environment protection rules, antes
  de qualquer step. Somente `recovery/antigravity-mvp1b` está permitida.
- Nenhuma regra de proteção foi alterada. Nenhum deploy público concluído.
- Aguardar autorização específica para adicionar a branch de trabalho ao
  ambiente Pages, preservando as outras regras. Depois reexecutar somente o
  deploy falho e verificar manifest/hash/navegador público. Ver NEXT_TASK.
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

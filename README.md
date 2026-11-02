# Lion Temple — Tactical Hunt

02/11: investigação local de21amostras concluída, sem alteração do jogo/CI.
[Custo residual e limites](docs/RESIDUAL_RENDER_COST.md): apresentação/composição
ainda caras; nenhuma remoção de layer/CSS foi entregue como solução. Alpha
pública continua bloqueada pelos gates falhos abaixo.

Estado final do cache em01/11: push/PR falharam com363unit PASS,
67E2E PASS/4timeouts/7nãoexecutados cada;4cache+4Alpha E2E PASS.
Builds remotos e deploy não executados; preview Alpha continua bloqueado.
[Diagnóstico e próximos limites](docs/STATIC_CACHE_CI_DIAGNOSIS.md).
Os resultados e planos abaixo preservam o histórico, não gates atuais verdes.

Cache da base estática Hunt/treino implementado, sem alterar combate ou Alpha.
[Contrato e validação](docs/STATIC_SCENE_CACHE.md):78E2E PASS,builds PASS;
suíteunitária362/363 por timeout antigo5s. Ganho local não aprova publicação:
preview continua condicionado aos novos gates/manifest/smoke públicos.

A/B local autorizado concluído, sem alterar o jogo: custo software reproduzido,
cache experimental de terreno ganhou15,6–20,8%,mas não é fix/CI aprovado.
[Método e limites](docs/RENDERER_AB_LOCAL.md). Sem novo deploy ou retry.

Estado01/11: coleta Windows CPU/render autorizada foi encerrada; evidências
apontam gargalo gráfico software(SwiftShader), não custoJS dominante.
[Resultado e limites](docs/WINDOWS_CPU_PROFILE.md). Gates ec42 push/PR falharam;
Alpha pública continua bloqueada. Nenhum novo retry ou fix automático.

## Novo foco — Crônicas da Maré · Roguelite Alpha

Aventura manual em `alpha.html`: Knight solo, costa/prólogo, bosque
semi-procedural, escolhas temporárias, miniboss/boss e retorno a um refúgio
persistente com casa, Brasa e Cronista. WASD/setas para mover, espaço/clique
para engajar, Q/E habilidades, F interação próxima. R após Forja I.

O motor/grade/eventos existentes são reaproveitados. O laboratório anterior
continua em `index.html`, sem migração ou mistura de saves. Arquitetura, estado
real dos gates e limites: [Alpha](docs/ROGUELITE_ALPHA.md),
[arte original e prompts](docs/ROGUELITE_ART.md),
[estado vigente](docs/CURRENT_STATE.md). Preview não é release estável.
Meta10–15min total ainda depende de playtests; não é duração humana já medida.

Continuação01/11: HUD otimizado sem mudar regras/input;353unit/74E2E/builds
locais PASS. [Diagnóstico e limites](docs/HUD_PERFORMANCE_DIAGNOSIS.md).
Runtimeec42:pushCI63E2EPASS/4timeouts/7notrun;deploySKIPPED. PR ainda executando
no checkpoint. Coleta diagnóstica no runner aguarda direção;preview não pronto.

Histórico: runtime2dea277 no PR4 draft. CI PR350unit/73E2E/builds PASS;
CI push61E2E PASS/5timeouts/7nãoexecutados bloqueou o Pages. Público ainda
b9d0e31, não Alpha. Diagnóstico preservado; nenhum retry/relaxamento automático.

## Histórico da Hunt/laboratório (preservado)

Vertical slice jogável de uma hunt automática 2D com PixiJS. Knight, Druid e
Sorcerer atravessam três ondas e enfrentam um boss. Um motor incremental usa
grade autoritativa, A*, LoS e eventos determinísticos; PixiJS representa o
combate, e HTML/CSS apresenta controles Auto/Manual/Assisted, Party e Analyzer.

Janela19×11(+4SQMs),corpos/picking no SQM e inimigos em quantidade/força
progressivas. Contrato: [SQM expansion](docs/SQM_EXPANSION.md).
Preview compartilhado b9d0e31 publicado31/10 após única reexecução CI
332unit/69E2E PASS e PagesSUCCESS. Código equivalente f1200c4.
Validação pública ainda PENDENTE:smoke original falhou num clique500ms;
UMA reexecução autorizada falhou antes do combate,preparing por5s.
Nenhum limite foi alterado;outfits/preview públicos não executados.
Manual/geometria públicos PASS não
substituem os gates pendentes. Não é release estável ou entrega toda aprovada.
Manifest,CI,diagnóstico e limites em [estado vigente](docs/CURRENT_STATE.md).
O enquadramento15×11/preview645 anterior é histórico em
[Consolidação tática](docs/TACTICAL_CONSOLIDATION.md),não a configuração atual.

## Recompensas e build — MVP 2B

Desligue **Loop**, conclua uma hunt e abra **Inventário**. Escolha um herói,
compare uma arma/armadura e equipe por clique. A forja +1 custa 200 ouro e uma
Brasa do Templo; não tem falha nem destruição. Equipar/forjar só entre hunts.
O próximo combate utiliza os stats efetivos. Reload preserva XP, equipamentos,
ouro e Boss Tokens. Mochila cheia envia recompensas para uma reserva visível.
Regras e recuperação de save: [Equipment and Loot](docs/EQUIPMENT_AND_LOOT.md).

## Treino de movimento e runas — MVP 2B.4

Clique em **Treino de runas** entre sessões, ou abra `/?training=1` no servidor
local. Knight começa Manual, magos Auto, contra três bots ativos. Clique no
herói/card para controlá-lo; os demais voltam ao Auto. O selecionado pode ser
somente Manual; aliados Auto seguem o foco ofensivo explícito. Na Hunt as três
opções de automação continuam disponíveis. WASD, setas
ou Numpad movem; **4 + clique** coloca Magic Wall; **5 + clique** coloca Fire
Field; **6** Sudden Death, **7** Destroy Field. Para empurrar, **segure o botão
esquerdo sobre uma criatura e solte num vizinho livre dela**; o executor se
aproxima por A* antes do push adjacente. A prévia mostra
destinos permitidos. **8** oferece seleção alternativa, **9** para. Não se arrasta
sete tiles de distância. ESC para/limpa o foco. Nova intenção interrompe rota e
aproximação sem retomar passos antigos. As teclas 1–3 continuam
as magias da vocação; Numpad somente movimenta, não conjura.
Magias e runas ficam em sequência 1–9 no dock inferior. Toda a área amarela faz
parte da grade caminhável, salvo caixas/runas bloqueadoras; mapa36×18 fixo,
janela19×11/câmera uniforme, resize não altera combate. Bots perseguem o menor
percentual de vida, usam magias/cura/SD/Fire Field e respeitam custos/cooldowns.
Parede bloqueia caminhada/tiros; campo causa burning no adversário. Pausa e velocidades
compartilham o relógio lógico. Reiniciar repõe o kit gratuito de cada herói.

Sem recompensas persistentes, Loop ou PvP online. Não é o catálogo completo de
magias/passivas/Wheel do Tibia atual; parâmetros e próximos passos estão em
[Training 2B.4](docs/TRAINING_2B4.md) e [perfil 2B.3](docs/TRAINING_2B3.md).
Heróis/bots/outfits em pixel art própria,com envelope medido de até30×30px porSQM32,
sem zoom ajustável pelo usuário; prévia de tile facilita colocar MW sem acertar um sprite
por engano. [Origem da arte e prompts](docs/ART_PROMPTS.md).

Smoke real-clock do cenário atual: `node scripts/qa-training-team.mjs <URL> <SHA> <label>`.
`qa-training.mjs`/`qa-training-kit.mjs` são ferramentas históricas do fixture parado;
não representam a nova equipe ativa. O pacote assets_rtc indicado estava vazio.

## Executar

No Windows, também é possível usar `INICIAR_JOGO.bat`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Validar

```bash
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

`test:e2e` usa Edge e valida controles, três ciclos de loop e as resoluções
1366×768, 1600×900 e 1920×1080.

## Arquitetura

- `src/combat`: motor lógico, IA, áreas, aggro e loot.
- `src/events`: contrato e reprodução temporal.
- `src/app`: estado agregado independente do DOM.
- `src/data`: personagens, monstros, fases e habilidades.
- `src/game`: PixiJS, mapa, unidades, animações e efeitos.
- `src/main.ts`: orquestração da interface e da sessão.
- `tests/e2e`: smoke tests de navegador.
- `docs`: estado, arquitetura, roadmap, aceite e próxima tarefa.

## Estado

O MVP 0 é histórico; a etapa atual é MVP 2B.3 (treino local). Consulte:

- `docs/CURRENT_STATE.md`
- `docs/ACCEPTANCE_MVP0.md`
- `docs/NEXT_TASK.md`

## Limites

- Arena limitada; ainda sem Adventure, NPCs, quests ou campanha.
- Save local, sem backend, contas, multiplayer ou anticheat de economia online.
- Dois slots por herói, melhoria até +1; sem venda, descarte ou drag-and-drop.
- Heróis usam pixel art original v1; monstros continuam blockouts. Referências
  legadas e fontes raw da arte ficam fora do build.

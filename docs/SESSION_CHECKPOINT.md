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

Código preparado para commit/push normal na branch acima. O workflow preview.yml
é a fonte do estado de publicação GitHub Pages. Confirmar deployment e version.json
contra SHA remoto no post-flight; site estável permanece separado e não foi alterado.
Link de preview configurado: https://silvamarcello1-art.github.io/tactical-hunt-lion-temple/

Próximo comando recomendado: pnpm health (após git fetch origin --prune).
Próxima tarefa: revisão humana do preview e balanceamento; depois um slice curto
de exploração/objeto/NPC, conforme NEXT_TASK. Não reimplementar controles/grade.

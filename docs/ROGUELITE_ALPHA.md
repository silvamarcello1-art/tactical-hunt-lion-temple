# Crônicas da Maré — Vertical Slice Roguelite Alpha

Novo direcionamento explicitamente solicitado pelo usuário em31/10/2026.
Não é uma nova implementação do motor nem uma release estável. O laboratório
Hunt continua em `index.html`; a aventura é a entrada `alpha.html`.

## Auditoria e decisão

Base limpa d14938ca33d3d48ae1fdeea44ef946f9b837edfc, derivada da branch
feature/gameplay-first-mvp2a. Grade, comandos manuais, reservas diagonais,
LoS, projéteis, perigos anunciados e timeline incremental são reutilizáveis.
Party de três heróis, andares automáticos, Helper e economia antiga não
representam o novo loop; ficam preservados no laboratório, não transplantados.

Estratégia: entrada isolada → perfil de encontros solo no mesmo motor →
run/hub/persistência → apresentação original → testes e publicação pelos gates
existentes. Sem backend, migração de stack, permissões novas ou remote Sites.

## Jogar

- WASD, setas ou Numpad: movimentação em oito direções pela grade existente.
- Clique no chão: caminhar via A*. Clique em um inimigo ou espaço: engajar
  explicitamente; o ataque básico repete nesse alvo, não adquire outro sozinho.
- Q: Arco de Ferro; E: Ruptura. R: Chama interior, após Forja I.
- F: interagir quando a distância lógica ao marco é no máximo dois tiles.
- Escape: pausa. Perigos laranja indicam onde sair antes do impacto.
- Na costa/altar, investigar o vestígio antes da passagem. Após o combate,
  escolher uma melhoria e caminhar até a saída à direita.

## Slice e economia

Onze salas: costa/prólogo, três encontros do bosque, altar, miniboss,
quatro encontros adicionais e boss final. O roster, pequenas ruínas sólidas
e seed compõem geração **semi-procedural**, não um gerador infinito de mapas.
Três fundos originais são reutilizados com encontros/configurações distintas.

Melhorias temporárias: ataque, vida ou regeneração de mana. Cada escolha
restaura vida; altar, miniboss e último limiar oferecem recuperação completa
para a próxima sala. XP é um contador da jornada; as escolhas de sala são a
progressão temporária efetiva, não há uma árvore de níveis disfarçada.
Recompensas são por sala, não por repetição de matar um inimigo após reload.

Vitória deposita todas as brasas; derrota/retirada deposita metade, arredondada
para baixo. O depósito remove a run numa única transição, sem replay de prêmio.
No refúgio há casa/área do jogador, Brasa e o Cronista. Forja I custa8brasas,
desbloqueia cura manual e+200vida permanente. Cinco níveis; custos8+12×rank.
Novas classes, cidades, inventário roguelite e expansão da casa **não existem**
ainda; seus futuros dados não devem reaproveitar chaves da economia Hunt.

## Arquitetura e reutilização

| Camada | Responsabilidade |
|---|---|
| `combat/EncounterSetup.ts` | Dados opcionais do encontro; party/floors/bloqueios/habilidades/regen |
| `combat/CombatEngine.ts` | Mesma autoridade de dano, aggro, movimento, casts, projéteis e perigos |
| `roguelite/model.ts` | Room catalog, seed, run, escolhas, descobertas, progressão permanente e settlement |
| `roguelite/main.ts` | Orquestração DOM, interação por proximidade, input, saves e transições |
| `roguelite/RogueRenderer.ts` | Pixi, fundo, câmera, vitais inimigos, animação/feedback consumindo eventos |
| `roguelite/style.css`, `alpha.html` | Shell narrativo e HUD solo, modais de escolha/refúgio |
| `vite.config.ts` | Build de duas entradas, sem mudar workflow/dependências |

`EncounterSetup` é opt-in: os defaults da Hunt e seus hashes não são substituídos.
O perfil solo desliga decisões heroicas automáticas, cura automática entre ondas
e reposicionamento de recuperação AI. Mantém MovementSystem/OccupancyGrid como
únicos donos das posições e claims. A última onda permanece aberta para explorar;
`finishExploration()` rejeita saída com inimigos vivos ou party morta.
Salas subsequentes usam novos encontros, não um combate paralelo no renderer.

LiveEventPlayer e CombatPresentationSystem são reutilizados. SpriteLibrary ganha
apenas um filtro opcional de IDs; o laboratório continua com o comportamento
anterior. A Alpha carrega seis sprites nativos, sem os38outfits cosméticos.
Tick250ms e movimento de célula existentes: interpolação visual, não física
livre/subpixel. Câmera acompanha o Knight e respeita as bordas do mapa30×18.
Pausa para ticker/timeline/input, inclusive durante diálogos e perda de foco.
Picking usa os envelopes opacos medidos do SpriteLibrary e a posição visual
somente para selecionar um ID; PlayerCommand revalida alvo vivo/alcance/dano.
Isso permite clicar na parte superior do corpo sem confundi-la com o tile acima
dos pés. Caminhada continua usando exclusivamente a autoridade da grade.

## Save e recuperação

Namespace novo `tactical-hunt-roguelite-v1`. Sem ler ou modificar currency,
equipamento, XP ou aparência do laboratório. Save guarda seed, sala, HP do
checkpoint, escolhas, recursos e crônicas. Reload reinicia a sala atual, não um
snapshot do frame. Uma sala já recompensada volta vazia; o prêmio não repete.
Salvar falha/futuro formato inválido: aviso e jogo em memória, sem sobrescrever
o original. Sem cloud save, migração automática, suporte multiplayer ou segurança
de economia online; localStorage é editável pelo dono do navegador.

## Fundação de expansão

IDs de região/sala/lore e o catálogo de encontros ficam no domínio, não no Pixi.
Alpha2 pode extrair registries de Region/Class/NPC/Discovery sem trocar motor.
As descobertas maré/altar/guardião/regente já alimentam o caderno do Cronista.
Outras cidades, deuses e classes requerem conteúdo original/revisão de direitos;
referências de mundo não autorizam importar nomes, mapas, sprites ou marcas.

## Validação e limites

Testes novos: estado/persistência, recompensa única, forja, exploração longa,
controle manual, bordas, determinismo e jornada por comandos; navegador cobre
prólogo/encontro real/escolha/reload, derrota real/forja, hub/save protegido/layout.
Fixtures de save são usadas nos cenários isolados de derrota e formato futuro;
não são apresentadas como um playthrough humano completo.

Medição de desenvolvimento seed803:385750ms de combate por driver explícito,
com escolhas e evasão; não é duração de jogo humano nem FPS benchmark.
Meta total10–15min depende de navegação, leitura, decisões e habilidade; ainda
precisa de múltiplos playtests. Não alegar paridade de acabamento com referências.
Arte de fundo é bitmap, com colisões conservadoras/configuradas separadamente;
não é tilesheet, cenário destrutível ou geração de oclusão automática. Sem áudio,
diagonais de animação dedicadas, controller/touch completos ou animação final.
Relatório dos gates e publicação fica em CURRENT_STATE/SESSION_CHECKPOINT.

## Comandos

`pnpm install --frozen-lockfile`, `pnpm health`, `pnpm typecheck`, `pnpm test`,
`pnpm test:e2e --workers=1`, `pnpm art:generate`, `pnpm build`,
`pnpm build:preview`, `git diff --check`.
Preview local da aventura: `pnpm dev --host 127.0.0.1 --port 4180`, `/alpha.html`.
Assets/prompts: [ROGUELITE_ART.md](ROGUELITE_ART.md).

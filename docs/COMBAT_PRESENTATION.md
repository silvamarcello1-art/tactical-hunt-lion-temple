# MVP 1D — Combat Presentation & Visual Fidelity

Atualizado em 7 de agosto de 2026.

## Objetivo e regra de autoridade

O MVP 1D apresenta visualmente o combate autoritativo do MVP 1C sem alterar
dano, cura, alvo, alcance, LoS, pathfinding, ocupação, reservas ou áreas de
magia. A direção obrigatória dos dados é:

```text
CombatEngine -> CombatEvent[] -> EventPlayer -> CombatPresentationSystem
                                              -> PixiRenderer
```

`CombatPresentationSystem` mantém somente estado visual temporário. O renderer
nunca recalcula caminho, impacto, máscara ou resultado.

## Relógio e timeline visual

- `EventPlayer.time` é o único relógio da apresentação.
- Movimento usa `startedAt` e `completesAt`.
- Projéteis usam `startedAt`, `impactAt` e `pathTiles`.
- Telegraphs usam `logicalTiles`, timestamp inicial e `impactAt`.
- Pausa deixa de avançar o relógio; nenhum timer independente continua.
- 1x, 2x e 4x alteram o avanço do mesmo relógio, não o FPS da lógica.
- Reset descarta sistema de apresentação, tweens, pools ativos, unidades e
  camadas da sessão anterior.

## Estado visual por entidade

Estados suportados:

```text
idle
moving
attack_windup
attacking
cast_windup
casting
hit_reaction
healing
stagger
dying
dead
```

Morte cancela o movimento apresentado. Uma entidade morta não volta a andar ou
atacar. O contrato `AnimationSet` separa nomes de frames, facing, anchor do pé e
offset visual, deixando a troca futura por sprite sheets próprios independente
do motor.

## Movimento, footpoint e facing

- A posição visual interpola somente entre o centro lógico do tile de origem e
  o centro do tile de destino.
- Ao completar, a posição é fixada exatamente em `toTile * 32 px`.
- Cancelamento retorna ao tile de origem informado pelo evento.
- Não existe acumulação incremental; por isso 100 movimentos não geram drift.
- O `body` da entidade representa o footpoint lógico. Recoil ocorre no sprite
  filho e nunca desloca o footpoint.
- Facing cardinal: north, east, south e west.
- Movimento tem prioridade de facing; ataques e casts olham para o alvo; idle
  conserva a última direção válida.
- Sprites estáticos atuais espelham leste/oeste. Sprites direcionais trocam o
  conjunto de frames.

## Y-sort, box e profundidade

O sort key é determinístico:

```text
tileY -> tileX -> hash estável do entityId
```

Durante o movimento, o footpoint interpolado participa da ordenação. Sombras
ficam no chão e não acompanham recoil. Tiles adjacentes da box permanecem
distinguíveis por spacing, sombra, facing e ordenação. Knight e melee ocupam a
frontline; Druid, Sorcerer, ranged monsters e trajetórias compõem a backline.

## Camadas PixiJS

Ordem permanente:

1. `terrain`;
2. `telegraphs`;
3. `shadows`;
4. `entities`;
5. `effects`;
6. `projectiles`;
7. `unit-ui`;
8. `overlay/debug`.

Nomes, HP e mana vivem em `unit-ui`, portanto continuam acima de impactos e
magias. Efeitos nunca recebem o container da entidade e não podem alterar seu
anchor, alpha, escala, posição ou parentalidade.

## Ataques e impactos

### Melee

O evento autoritativo inicia windup, facing e um lean curto dentro do próprio
tile. O contato recebe trace e spark sem mover o atacante para o tile inimigo.
O evento `damage` continua sendo a única fonte do dano e da reação do alvo.

### Ranged e projéteis

O renderer usa exatamente `originTile`, `pathTiles`, `targetTile`, `startedAt` e
`impactAt`. A posição é interpolada por todos os tiles da trajetória. A rotação
segue o segmento atual. Cancelamento remove o visual sem spark; resolução gera
impacto no alvo e a aplicação de dano permanece no evento lógico correspondente.

## Magias, waves e telegraphs

- Effects de magia usam os tiles já emitidos pelo motor.
- Waves avançam visualmente a partir do caster por distância ao tile de origem.
- O footprint não adiciona nem remove tiles.
- Challenge usa o alcance lógico recebido e o feedback de aggro existente.
- `spell_telegraph` cria a geometria exclusivamente de `logicalTiles`.
- A intensidade do aviso deriva do progresso lógico até `impactAt`.
- `spell_resolved` e `spell_cancelled` eliminam o telegraph pelo mesmo `castId`.
- `data-mask-mismatch-count` compara a máscara lógica com os pontos mundiais
  emitidos; o valor esperado é zero.

## Feedback de combate

- Damage: número vermelho, subida curta e hit reaction.
- Critical: texto maior, scale punch e impacto mais forte.
- Heal: número positivo verde e movimento suave.
- Dodge: texto lateral sem número de dano.
- Textos do mesmo alvo recebem `stackIndex`, evitando sobreposição direta.
- Recoil modifica somente o sprite filho e sempre retorna à base.
- Death interrompe apresentação ativa, faz fade e remove body, UI e sombra sem
  interferir na ocupação já liberada pelo motor.

## Pooling e desempenho

`DisplayObjectPool` reutiliza:

- floating texts;
- projectiles;
- telegraphs;
- traces e hit sparks simples.

Os pools removem o objeto do stage, limpam transformações e geometria e o
devolvem pronto para reutilização. Diagnósticos expõem quantidades criadas,
ativas e disponíveis. Sprites de área com vida curta ainda usam cleanup ao fim
do tween; nenhuma criação ocorre a cada frame.

## Debug e garantias de sincronização

`?debug=1` mantém grid, caminhos, reservas, occupancy e masks do MVP 1C e inclui
uma camada de sync que desenha:

- tile lógico esperado;
- footpoint visual;
- linha da diferença durante interpolação;
- facing e animation state nos diagnósticos.

Principais atributos de auditoria em `#game`:

- `data-logical-time`;
- `data-visual-positions`;
- `data-visual-facings`;
- `data-presentation-states`;
- `data-max-visual-sync-error`;
- `data-visual-overlap-warnings`;
- `data-mask-mismatch-count`;
- `data-residual-visual-objects`;
- contagem das camadas e pools.

Garantias verificadas:

- erro parado/fim de movimento: 0 px;
- mask lógica versus visual: diferença 0;
- pausa congela tempo, posição, projétil, telegraph, estado e tween;
- reset e loop terminam com zero objeto visual residual;
- mesma seed preserva integralmente o resultado do MVP 1C.

## Validação de 7 de agosto de 2026

| Gate | Resultado |
|---|---|
| TypeScript | aprovado, zero erros |
| Vitest | 121 testes em 9 arquivos |
| Testes próprios da apresentação | 30 casos |
| Build | 741 módulos, aprovado |
| Playwright/Edge | 15 cenários, 4,7 min no gate final |
| Hunts manuais | uma completa em 1x, 2x e 4x |
| Três loops | aprovados, sem duplicação |
| Sync | 0 px de erro máximo |
| Masks | 0 divergências |
| Overlap | 0 lógico e 0 avisos visuais |
| Resíduos | 0 projectiles, telegraphs, floating texts ou display objects |
| Console | 0 erros e 0 warnings |

Na inspeção manual, melee e ranged são distinguíveis, a box e a separação entre
frontline/backline permanecem legíveis, waves partem do caster, projéteis viajam
pela grade, cura e dano são distintos e a cena continua compreensível em 4x.

## Limites reais

- Sprites e efeitos continuam provisórios; o `AnimationSet` está preparado para
  arte própria com frames completos.
- Heróis estáticos só comunicam leste/oeste por espelhamento; quatro direções
  visuais completas dependem dos sprite sheets próprios.
- Alguns spells ainda reutilizam o atlas provisório de efeitos.
- Sons, micro-shake e particles complexos foram adiados.
- O Helper individual continua pausado e não foi alterado.

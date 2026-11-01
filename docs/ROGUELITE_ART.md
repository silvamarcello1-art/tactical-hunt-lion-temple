# Arte original — Crônicas da Maré v1

Três imagens geradas pelo **ImageGen builtin** para este pedido, revisadas
visualmente antes da integração. Nenhuma captura, sprite, textura, marca ou
asset dos jogos de referência foi importado. Os personagens/efeitos nativos
originais do Tactical Hunt são reaproveitados; não se alega animação final nova.

Destino versionado: `public/assets/roguelite/v1/`.

| Asset | Origem builtin | Dimensão | Bytes |
|---|---|---|---|
| coast-v1.png | exec-02981077-2054-4e77-a433-6222badf636e.png |1619×971|3651669|
| forest-v1.png | exec-4fb91097-3506-4024-9e79-116449e3aa65.png |1672×941|3544695|
| refuge-v1.png | exec-a93e9f51-c61b-497c-ba0e-5a822290e845.png |1619×971|3572568|

Sessão de geração:01a194c4-cf64-7520-a876-92f7de4329cd. Cópias PNG integrais,
sem editar a referência do usuário, copiar arte alheia ou apagar versões antigas.
Os arquivos não pertencem ao gerador determinístico `art:generate` dos sprites.

## Briefs/prompts de produção (registro reproduzível)

Comum aos três: original full-bleed production pixel-art gameplay backdrop;
landscape approximately16:9, top-down three-quarter32px tile scale; rich limited
palette, crisp hard pixel clusters, amber/teal lighting; no borrowed game assets.
Keep central70–75% low-contrast floor clear. Tall objects only at perimeter.
No people, monsters, character silhouettes, words, logo, HUD, UI, watermark or
grid overlay. No horizon, dramatic perspective or blur. Not a sprite sheet.

**Costa:** starting coast/ancient ruins, damp silver sand and weathered paving,
tiny pebbles/flat seaweed; dark teal water at extreme left/bottom, wavelets and
rocks at edges. Fragmentary carved ruins/broken arches/monoliths/tufts on upper
and far right edges. Amber dusk peripheral braziers, teal coast ambient. Keep
x7–90%,y12–83% mostly clear; no central platform/building/circular arena.

**Bosque:** ancient forest clearing/forgotten ruins; broad irregular mossy earth
and flat grass, leaves and flush stepping stones. Dense trees/trunks/ferns/roots
only at edges, amber mushrooms/teal fungi peripheral, partial ruined wall/arch
upper edge. Subtle canopy shadows, readable center; asymmetric organic space,
not a circular arena.

**Refúgio:** welcoming village courtyard. Small player house upper-left, teal
roof/warm window/wood stack. Compact forge upper-center, open furnace/anvil/tools.
Cronista canvas library upper-right, books/scrolls/empty desk. Buildings intended
top25%, lower70% open cobbled/earth/moss courtyard; paths to entrances, lamps
and small campfires only at perimeter. Cool teal evening/amber warmth. No central
fountain, building or fire.

## Inspeção e adaptação

A costa contém água nos78–88% inferiores; bounds usam faixa seca conservadora.
O bosque tem clareira aberta e bordas de raízes; props sólidos adicionais são
dados seeded desenhados em Pixi. No refúgio, prédios ocupam cerca de31% do topo,
mais que o brief; rows anteriores a6 ficam bloqueadas. As imagens não têm todas
a mesma proporção exata; composição é adaptada ao mundo30×18, não usada como
autoridade de colisão. Escala/câmera e vinheta são de apresentação apenas.

Sites skill foi usada somente na rota de código/local preview. Não houve upload,
registro ou hospedagem Sites. Publicação usa apenas GitHub Pages já configurado.

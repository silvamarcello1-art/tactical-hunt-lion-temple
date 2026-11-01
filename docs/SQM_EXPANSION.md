# Janela ampliada, sprites no SQM e Hunt progressiva —30/10/2026

Pedido posterior à consolidação645267a: somente estes três ajustes. O usuário
confirmou explicitamente que progressão significa **quantidade e força**, por
onda/andar da Hunt. Não inclui PvP online, Adventure, backend ou arte nova.

## Janela19×11, com continuidade preservada

WORLD_VIEW muda15→19colunas (+4,26,7% horizontal),mantendo11linhas e tile lógico32.
Mapa Hunt30×18/treino36×18 não muda. A mesma câmera segue o herói selecionado,
com pan contínuo,clamp,letterbox neutro e uma inversa para picking/drag/DPR.
As rails flexíveis cedem espaço; nenhum stretch independente de X/Y.

| Resolução | Tile aparente antes/depois | Janela nova,ambos modos |
|---|---|---|
|1366×768|52,45px /52,45px|19×11|
|1600×900|64,45px /64,45px|19×11|
|1920×1080|80,82px /80,82px|19×11|
|1902×978,referência|71,55px /71,55px|19×11|

Medidas locais em oito capturas reais;scrollWidth=viewport nas quatro resoluções.
O contrato anterior15×11 e sua tabela permanecem como histórico em
TACTICAL_CONSOLIDATION.md,não como configuração atual.

## Corpos e áreas de clique

A grade já mantinha origem ocupada e destino reservado até o commit; isso não
impedia arte maior que um tile. Medidos os pixels alpha>16 de todas as poses:
nativos chegavam37–42px de altura,addonsaté59 e criaturasaté64,para tile32.
Também havia hitArea64×108 e picking maior que o corpo visível.

cellSpriteFit.ts registra a união opaca de48definições:3nativos,7criaturas/boss
e38outfits. SpriteLibrary aplica um único fator uniforme por atlas,limitando
largura/altura a30×30px lógicos em todas as poses. Não corta/recolore a arte,
não muda a escala entre frames ou direções e não adiciona leitura de pixels ao
startup de produção. O E2E mede novamente as imagens reais para detectar drift
dos metadados. Novos atlases sem medida falham explicitamente.

Footpoint lógico permanece tile×32. Pixels SVG abaixo do anchor antigo são
normalizados ao chão,com head/hand/chest/HP acompanhando a nova base. Sombras e
seleção são limitadas;walk frames continuam,mas bob/lean adicionais foram
retirados para não extravasar ao mover/push. Picking usa o envelope real em vez
da antiga região grande;troca de outfit atualiza também hitArea.

Não há máscara cortando corpo pelo tile nem movimento por pixels no domínio.
O envelope inteiro cabe na dimensão de um SQM e mantém separação entre corpos
em células adjacentes. VFX,nomes/HP e cadáveres não são ocupantes vivos.
bodyOverlaps/bodyEnvelopes diagnosticam os corpos vivos inclusive interpolando;
logical-overlaps continua verificando a grade separadamente.

Reações também respeitam o envelope:os antigos avanços7px,balanços5px e
levitação3px foram substituídos por offsets absolutos de no máximo0,5px,
sem rotação extra ou acúmulo quando dano/cast se sobrepõem. Frames e feedback
de alpha permanecem. Diagnóstico inclui o offset real do Sprite,não só seu root.

## Passagem diagonal protegida durante o passo

Reprodução por teste:enquanto A vai(1,1)→(2,2),B podia ir(3,1)→(2,1),invadindo
o canto atravessado pela diagonal. Destinos diferentes não bastavam para evitar
sobreposição em trânsito;revalidar só no fim podia cancelar A já quase chegando.

O perfil de produção ativa strictCellMovement. MovementSystem usa a reserva
existente de OccupancyGrid para reivindicar destino e os dois cantos de uma
diagonal,atomicamente,e apenas pela duração do passo comprometido. Origem
continua ocupada. Novo movimento/push não invade essas células. Paredes dinâmicas
continuam seguindo a regra existente de invalidar/revalidar o passo com segurança.
Commit/cancelamento/morte/sessão/reset liberam todas as claims,não só o destino.
Approach de push não reserva o destino durante a viagem;cada passo usa sua
própria reserva curta. Não há novo resolvedor físico ou movimento por pixels.

Defaults/fixtures históricos mantêm a política anterior explicitamente;main
ativa a nova segurança em Hunt e treino,para heróis e bots. reserved-cells
diagnostica todas as células reivindicadas,reservation-count mantém a contagem
histórica de atores/destinos. Testes cobrem cantos,atomicidade,push e cleanup.

## Quantidade e força progressivas

main ativa progressiveHunt no CombatEngine existente. Composição em
data/progressiveHunt.ts,sem mutar floors/polishedFloors históricos:

| Encontro | Inimigos | HP relativo à base do próprio andar | Ataque relativo |
|---|---|---|---|
|Onda1|5|100%|100%|
|Onda2|6|102%|101%|
|Onda3|8|104%|102%|
|Boss|1boss+4guardas|106%|103%|

São24derrotados por Hunt. O boss é um encontro próprio,não uma quarta onda
comum. Reforços leves têm HP180+20×índice do andar e ataque18+2×índice,antes
dos multiplicadores;eles somam pressão sem simplesmente duplicar elites.
Spawns e IDs são explícitos,únicos e dentro dos bounds. Valores não crescem
indefinidamente a cada loop:é uma curva por encontro,como autorizado.

Reforços usam rewardSuppressed existente,sem inflacionar orçamento de XP/loot:
Hunt completa com progressão mantém4240XP e1BossToken;preços de forja/saves
intactos. Gold continua sujeito aos rolls do combate,não é prometido idêntico.
Treino tem precedência no seletor de cenários e continua3bots/sem economia.
Legacy/polished e hashes antigos são fixtures preservados;nova produção tem
teste determinístico próprio50/1000ms,stress e três hunts evoluindo.
Baseline versionado novo:sqm-pressure-v1,seed803/sessãopressure-803,hashSHA256
dos eventos aa8ae5e05b6167e60fb74094859965a73aa645b2ca8dfb45710ddc5e2cd97ff8.
Mudou intencionalmente por quantidade/força e proteção de trânsito;nenhum
snapshot/hash legado foi regenerado para esconder regressões.

## Validação e publicação

Diagnóstico31/10 concluído sem fix:ver STARTUP_DIAGNOSIS.md. Abertura passiva
fria4,06s/recarga0,73s;timeout5s anterior não reproduzido. Confirmado que todos
38outfits/4,68MB bloqueiam idle mesmo comdefaults;proposta de carga sob demanda
aguarda autorização. Medição não aprova smokes pendentes nem prova causa histórica.

Histórico de validação:

Estado posterior31/10:humano autorizou UMA reexecução do smoke público de
treino sem mudar limites. Ela falhou antes do combate:preparing não chegou
a idle em5s,qa-training-team:14. Clique500ms anterior não foi alcançado.
Não repetir novamente ou aumentar limites;causa raiz ainda não comprovada.
Investigar inicialização depende de direção. CI/Pages e manifest b9aprovados
permanecem;validação pública obrigatória continua incompleta.

Histórico de QA anterior:

Estado31/10 posterior:única reexecução124455903967 PASS332unit/69E2E57,8min,
build/diff/Pages124468130514SUCCESS. Checkout/manifest b9d0e31docs-only,
source equivalente f1200. Novo bloqueio é smoke público training:clique
training-warden500ms falhou,não repetido/não relaxado,causa não comprovada.
Manual/push/geometria públicos PASS;não substituem3vitórias/38outfits/boss
dos scripts obrigatórios ainda pendentes. Não declarar entrega toda validada.
Detalhes/checkpoint preservam resultados independentes e limites.

Histórico anterior,substituído pelo estado acima:

Resultado31/10:runtimef1200c4 implementado/pushnormal,local332unit/69E2E e
smokescompilados(13Hunts/3treinos/38outfits/manualpush)PASS. PRCI41125868457
PASS332/69;pushCI41125860437FAIL57PASS/5timeouts/7nãoexecutados e Pages
SKIPPED. Manifestpúblico ainda645267a;novas alterações não publicadas.
Diagnóstico/checkpoint preservam traces e causa não comprovada. Sem retry,
fix automático ou relaxamento;próxima ação depende de direção humana.

Primeira curva forte falhou no boss;calibrada para crescimento gradual mantendo
assertions de vitória/party viva/orçamento. Nenhum deadline/snapshot foi relaxado.
Focados de câmera/alpha/movimento-push/fluxo ao boss passaram;gates completos,
smokes compilados/públicos e SHAs reais ficam em CURRENT_STATE e
SESSION_CHECKPOINT. Enquanto não houver novo CI/manifest/smokes,645267a continua
somente a versão pública anterior,não esta entrega.

Limites:ajuste pode reduzir um traje com acessórios largos mais que um básico;
isso é um fator fixo de atlas,não animação pulsando. Atlas originais preservados,
4cardinais/sem recolor seletivo ou novas camadas/diagonais dedicadas. Warning de
chunk e performance são registrados,não uma garantia de FPS. Sem scope extra.

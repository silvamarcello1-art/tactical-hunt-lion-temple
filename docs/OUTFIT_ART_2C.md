# MVP2C — sprites realmente aplicados ao mundo

## Assets integrados localmente — 20/10/2026

Continuação autorizada pelo usuário após a fundação com fallback: os12trajes
da referência precisam aparecer no personagem, não apenas na janela do atelier.
Não confundir os novos arquivos locais com o runtime público6ff5b24 anterior.
O encerramento e os gates finais pertencem ao SESSION_CHECKPOINT.

38atlas revisados/importados:12trajes×3níveis+2DLC,608poses reais. Os três
outfits nativos anteriores continuam disponíveis. Aplicação no mundo e uma hunt
com Warrior/Druid/Mage novos passaram no E2E focado. Gates locais283unit/61E2E/
typecheck/build/diff PASS;prova de pixels pausados reforçada e17E2E repetidos
PASS,sem runtime alterado. Publicação ainda pendente,não presumir que o site
já serve estes arquivos.38PNGs runtime4669452bytes,fontes brutas fora do bundle.

## Origem, arquivos e prompt set

Modo **builtin imagegen**, usando a PNG fornecida apenas como referência de
design; nenhuma imagem oficial de Tibia/OTSP foi usada. Fontes selecionadas em
`art/source/outfits-v1/*-source.png`; PNGs consumidas pelo jogo em
`public/assets/outfits/pixel-v1/*.png`. Cada fonte tem um `*-import.json` com
SHA256, dimensões, caixas dos16sprites e parâmetros técnicos de normalização.
Os descartes continuam fora do repositório e não são assets de produção.

Prompt comum das bases: gerar NOVO spritesheet transparente, UM personagem,
4colunas×4linhas,16figuras completas; colunas sul(frente),leste(nariz à direita
da tela),norte(costas sem rosto),oeste(nariz à esquerda). Linhas idle,pé esquerdo,
pé direito,ataque/conjuração. Preservar identidade/paleta/escala, vista superior
3/4,contorno escuro,sombras em blocos,pixel clusters nítidos. Margens/gutters
transparentes,sem texto/legendas/molduras/cenário/sombra de chão. Canvas solicitado
1024²; a ferramenta pode retornar1254². Não transformar a prancha recebida em
uma cópia transparente nem usar a mesma frente para direções diferentes.

Prompt dos addons: imagem1 é o spritesheet base selecionado; imagem2,quando
presente,é a referência de acessórios. Preservar16poses/direções/corpo e alterar
somente os acessórios abaixo. Addon2 SEMPRE conserva o conjunto1. Corrigir
pontualmente mão/facing quando a revisão detectar inconsistência.

|Traje|Base|Addon1|Addon2 adicional|
|---|---|---|---|
|Citizen|Cabelo castanho,camisa creme,couro marrom,lenço|Mochila enrolada|Chapéu marrom com pena branca|
|Warrior|Armadura aço,tabardo azul/dourado,cabelo castanho|Espinhos nos dois ombros|Capacete/pluma azul e espada nas costas|
|Mage|Cabelo branco,túnica azul/dourada|Cajado/cristal azul na mão|Chapéu azul/dourado|
|Druid|Capuz/túnica verde com folhas douradas|Patas de urso/garras nas duas mãos|Cobertura de cabeça de lobo cinza|
|Assassin|Cabelo preto,lenço vermelho,couro escuro|Duas adagas|Capuz e capa escuros/vermelhos|
|Hunter|Cabelo castanho,verde/couro,aljava nas costas|Duas luvas com garras|Capuz verde ampliado|
|Bolsonaro|Terno azul-escuro,gravata verde,cabelo preto|Faixa verde/amarela|Roseta e franjas na cintura|
|Lula|Terno azul-escuro,gravata vermelha,cabelo/barba brancos|Faixa verde/amarela|Roseta e franjas na cintura|
|Pope|Batina branca,solidéu,cruz dourada|Cajado dourado com cruz|Capa vermelha/dourada|
|Trump|Terno azul,gravata vermelha,cabelo loiro|Boné vermelho|Bandeira dos EUA segurada pela mão|
|Neymar|Uniforme amarelo/azul10,cabelo escuro com topo loiro|Faixa azul na cabeça|Gola azul levantada|
|Mbappé|Uniforme azul10,short branco,meia vermelha|Gola azul/vermelha levantada|Capa azul/vermelha com borda dourada|

DLC independente do nível: Neymar uniforme branco/azul com `100% JESUS` à frente;
Mbappé traje naval escuro com boné,óculos,detalhes dourados e capa vermelha.
As duas variantes preservam identidade/pele e os mesmos16slots; não alteram
stats,skills,vocação,loot,XP ou qualquer regra política/religiosa/de combate.

## Revisão e importação técnica

A primeira tentativa de folha4×12 retornou11linhas e direções inconsistentes:
DESCARTADA. Algumas gerações retornaram cópias da prancha: DESCARTADAS. Folhas
4×4 menores são revisadas por orientação,passos,corpo,adornos e transparência.
CitizenAddon2 teve dois passos leste corrigidos,sem espelhar automaticamente;
MageAddon2 teve dois frames frontais corrigidos para manter o cajado na mão
direita do personagem e a outra mão livre para conjuração.
Faixas de Bolsonaro/Lula foram corrigidas nas costas,inclusive durante ataque,
para manter ombro direito→quadril esquerdo;bordas/franjas não trocam de quadril.
TrumpAddon2 mantém a bandeira na mesma mão anatômica na vista de costas.

`scripts/import-outfit-atlas.mjs` só faz processamento técnico: identifica16
silhuetas alpha conectadas,confere quatro linhas/colunas por centros e recorta,
aplica escala uniforme nearest-neighbour e alinha pés. Não cria direções/poses
nem pinta elementos. Rejeita contagem inesperada e contato com borda da fonte.
Fontes podem ter espaçamento irregular; usar limites aritméticos4×4 cortava pés.
Projeções x/y de cajados inclinados também podem cruzar entre colunas sem que
as figuras se toquem. A segmentação2D evita esses cortes; figuras realmente
fundidas ou props grandes separados são rejeitados. PopeAddon2 teve um cajado
encostando no vizinho e precisou de correção artística,não de gate ignorado.

Runtime:448²RGBA,16células112²,baseline104. A margem maior acomoda chapéus/plumas
sem mover o footpoint. Fator corporal explícito por atlas revisado evita reduzir
o corpo por causa de um adorno alto; os metadados registram o fator exato.
Limite técnico:altura100/largura104 por célula. Nenhuma interpolação bilinear.

## Arquitetura e limites honestos

Verificação pública21/10/2026:runtime74b3306d4ae17e43d182439fd5e79d8384479118,
38variantes decodificadas/aplicadas no mundo e preview,capturas inspecionadas.
Party Warrior2/Druid2/Mage2 completou3treinos sem efeito econômico e huntboss
19kills/4240XP/1489gold/1token,console/cleanup limpos. CI final283unit/61E2E
verde no push e na única reexecução autorizada da PR. Ver SESSION_CHECKPOINT.md.

`data/outfitSprites.ts` registra apenas arquivos importados/revisados. O resolver
retorna IDs próprios `outfit-*`,não nomes novos para os três sprites antigos.
SpriteLibrary carrega esses atlas com o mesmo contrato de animação e relógio;
o canvas do atelier amostra as mesmas células. Troca altera textura/âncora e
posição visual das barras/nomes,sem recriar unidades nem modificar combate.
Bots mantêm seus próprios sprites. Preview mantém cache limitado a8imagens.

Addons são **atlas compostos**,não camadas alpha separáveis. Cada nível é um
desenho completo revisado com o conjunto de acessórios correspondente. O catálogo
mantém composição incremental1+2; os slots de futuras camadas continuam vazios.
DLC substitui o traje completo independentemente do addon salvo.

Somente quatro cardinais; não há diagonais dedicadas. Attack e cast compartilham
a quarta pose,com os timings já existentes; morte continua usando fade,sem queda
desenhada. Não são ciclos longos de animação nem roupas físicas simuladas.
Pequenas variações de desenho entre poses/níveis continuam possíveis.

Máscaras5regiões ainda PENDENTES. A UI mantém “Paleta planejada” e não recolore
pele/olhos/metais com tint global. Fontes/quadros reais novos não tornam máscaras
seletivas automaticamente disponíveis. Sem loja,economia nova,Adventure,backend,
merge estável ou remote Sites.

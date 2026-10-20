# MVP 2C — atelier de aparência e sprites de produção

## Continuação — arte aplicada no mundo

O usuário confirmou que os novos visuais precisam estar nos personagens reais.
Foram produzidos/revisados/importados38atlas:12trajes×base/addon1/addon2 e2DLC.
O resolver agora usa IDs e PNGs próprios,não o sprite nativo como substituto.
Quatro direções,dois passos,pose de ataque/conjuração,footpoint fixo e composição
cumulativa dos acessórios. OUTFIT_ART_2C.md contém promptset,proveniência,
revisão/formato e limites;SESSION_CHECKPOINT contém gates/publicação reais.

Addons usam atlas compostos,não camadas alpha independentes. Paletas continuam
planejadas: máscaras seletivas5regiões ainda pendentes,sem tint global. Fonte
recebida permanece referência intacta;as novas folhas são arte gerada/revisada.
O histórico abaixo descreve a fundação6ff5b24 anterior,não limita o novo registro.

## Histórico — fundação com fallback

## Verificação pública final

Runtime6ff5b24f15ede1d0b2981892dd91bc5abdb987c9 publicado em20/10/2026;
CI push/PR279unit/48E2E/build/diff aprovados,manifest e3smokes públicos com
SHA exato aprovados. Atelier/PNG decodificada e personagem no mundo inspecionados;
3treinos com economia intacta,huntboss19kills4240XP1489gold1token ecleanup
complementar(tweens inclusive)zero. SESSION_CHECKPOINT contém IDs/métricas.
Isso verifica a fundação COM fallback,não transforma as12referências em arte
de produção. Próximo checkpoint é apenas documentação e QA,sem outro runtime.

## Entrega funcional e limite de arte

Solicitação de20/10/2026: este slice2C é Outfit Customization, não Adventure.
São três sprites originais existentes aplicáveis (Guardião/Knight, Vigia/Druid,
Arcanista/Sorcerer) e12trajes de referência:Citizen,Warrior,Mage,Druid,Assassin,
Hunter,Bolsonaro,Lula,Pope,Trump,Neymar,Mbappé. Qualquer herói pode usar um dos
três sprites nativos; IDs de combate, stats, vocação e regras não mudam.

Os12trajes NÃO têm spritesheets de produção. Selecionar/salvar um deles mantém
o sprite original do próprio herói como fallback, claramente indicado. Addon0,
1,2 e DLC são preferências reais persistidas e referências visuais, não acessórios
animados entregues. Addon2 compõe os grupos1+2 no catálogo; DLC Neymar/Mbappé é
independente desse nível. Não há bônus, loja ou consumo/desbloqueio econômico.

## Inspeção da imagem recebida

Uma PNG1122×1402,2330784bytes; fundo creme opaco, textos, molduras e escalas
diferentes nas últimas duas linhas. Só uma vista ilustrada por variante; sem
separação corporal/addons/regiões, sem ciclos walk/attack/cast e sem norte/leste/
oeste/diagonais verificáveis. Roupas e acessórios assimétricos impedem espelhar
automaticamente. Chapéus/penas/capas precisam exceder o corpo sem perder baseline.
Repetições do corpo não constituem frames de animação. Recortes seriam utilizáveis
como referências frontais estáticas, não como personagem de produção em movimento.

Arquivo recebido copiado INTACTO para public/assets/outfits/reference-atlas.png,
SHA2561637451a4f83f092a091f2b7cb73dada529ca0d89aeb757cbcaf1c0a291fabc9.
A UI só apresenta uma janela CSS sobre a prancha, identificada como ilustração;
não remove fundo, não inventa direções e não usa essa prancha no PixiRenderer.
Nenhum asset oficial de Tibia, OTSP ou arte nova gerada foi importado.

## Arquitetura

- data/outfits.ts:OutfitDefinition/Variant/AddonDefinition/Palette/CharacterAppearance,
 12referências+3nativos,camadas cumulativas,slots por facing/action com flag reviewed.
 Slots vazios são PENDENTES. reviewedSlot exige orientação/ação exatas, sem mirror.
- app/AppearanceStore.ts:namespace tactical-hunt-appearance-v1,version1,por knight/
 druid/sorcerer; valida catálogo/addon/DLC/paleta. Sem save anterior usa originais,
 outfit removido usa fallback seguro; versão futura é preservada sem sobrescrever.
 Falha de storage aplica só na sessão com aviso. Não toca outros namespaces.
- ui/OutfitPanel.ts:dialog modal compacto,abas de inspeção independentes da seleção
 de combate,draft descartável até Aplicar,lista,referência frontal e canvas2D do
 sprite realmente usado. Rotação4cardinais,idle/walk/attack/cast compartilham
 pixelPreviewFrame/pixelDefinition. Sem diagonais de produção. Nearest-neighbour,
 animação de preview isolada (não avança engine),RAF cancelado ao fechar.
- main compõe o store e injeta somente appearanceSprite no renderer. Aplicar
 troca textura/definição/âncora do Unit existente,sem recriar entidades/motor,
 avançar clock ou reiniciar animação. Reset/loop usa o mesmo store. Bots não
 recebem as preferências da party. Seleção/target/control/progressão intactos.
- PlayerControls.suspendInput captura held keys/gestos no modal cosmético sem
 apagar target/enviar stop/controle. Morte/fim/reset ainda limpam normalmente.

## Cores — infraestrutura, não recoloração visual pronta

Cinco canais:head/primary/secondary/legs/detail; sete paletas+Original. Preferências
e swatches são salvas, mas TODOS os assets atuais estão sem máscaras revisadas.
A UI diz “Paleta planejada” e “nenhuma recoloração visual”. Não se promete que
o traje muda de cor. OutfitPalette.swapOutfitPalette aceita RGBA+mask explícita,
0protege pele/metal/olhos e1–5identificam regiões; preserva alpha e fonte. Nunca
infere máscara por matiz/retângulo nem aplica tint global. Integração visual de
paletas fica pendente até máscaras acompanharem todos os frames válidos.

## Desempenho e aceite

Não acrescenta trabalho ao loop de syncPresentation; resolução de catálogo/store
ocorre somente em spawn/aplicar. Reutiliza as mesmas texturas originais e o mesmo
display object. Preview tem no máximo3imagens320×320cacheadas,um canvas2D,nenhum
segundo renderer WebGL; só redesenha com modal aberto (~12,5Hz). Prancha2,3MB é
carregada sob demanda ao escolher referência, não no carregamento inicial.
Isso não é prova de aumento de FPS ou benchmark massivo. Gates finais/resultados
reais e limites em SESSION_CHECKPOINT. Testes novos protegem composição,dados
inválidos/save antigo/futuro,regiões protegidas,facings,fallback,persistência,
input capturado,alvo preservado,WASD,troca durante combate,reset e hunt até boss.

## Assets pendentes para completar o visual solicitado

Para cada traje/variante:base e camadas incrementais1/2,cardinais completos,
walk e attack/cast,footpoint e envelope seguros,máscaras explícitas5regiões,
z-order frontal/traseiro de mochila/espada/capa/cajado/garras e inspeção visual
por orientação/ação. Diagonais só com assets próprios. Preparar fontes/licenças
e não marcar reviewed até passar essa inspeção. Nenhuma etapa autoriza economia,
networking,merge estável ou Sites. Esta entrega é fundação funcional com fallback,
não a conclusão da produção artística dos12trajes.

# MVP 2B — contrato de recompensas e build

## Escopo

Hunt → drop de domínio → comparação → equipar → forja +1 → nova hunt.
Mesma branch de trabalho autorizada ao Pages, sem alterar proteções ou fazer merge.
Nenhum backend, PvP, Adventure, NPC, quest, campanha, comércio ou monetização.

## Catálogo / aleatoriedade

Seis armas (duas por vocação), duas armaduras universais e Brasa do Templo.
Ofensivas trocam defesa por ataque/poder mágico; alternativas oferecem mana e
resistência. Modificadores no catálogo, nunca no DOM. Poder mágico alimenta
magias e cura do Druid; defesa entra na fórmula existente de dano recebido.

O boss garante uma arma de cada vocação, uma armadura e três brasas. Inimigos
comuns têm 18% de chance de armadura. LCG da mesma família do motor com stream
isolado; não consome rolls de dodge/crítico/loot anterior. Mesma seed/sessão
gera os mesmos drops. IDs: sessão + criatura + índice. Recibos de item persistem
mesmo após fusão de pilha, evitando replay com novo event.id.
O stream incorpora a identidade da sessão: repetir a arena com seed de combate
fixa não prende o jogador à mesma arma. Replay da mesma sessão continua exato;
o teste de 64 sessões confirma que as seis alternativas são obtíveis.

Ouro vem dos eventos loot existentes e passa a ter saldo local real. Boss Tokens
permanecem no serviço existente. Troféus legados continuam no relatório da
expedição, sem aparentar ingredientes utilizáveis. Não são apagados do catálogo
histórico nem convertidos silenciosamente em ouro ou equipamento.

## Capacidade / identidade / conservação

- Mochila: 24 entradas; itens equipados não ocupam mochila.
- Equipamento: instância única, quantidade 1, arma ou armadura por herói.
- Materiais: pilhas de até 99. Não têm upgrade nem slot de equipamento.
- Excedentes vão para reserva persistente e visível, sem descarte. Receber
  reserva preenche espaços/pilhas; equipar libera espaço. Desequipar sem espaço
  é rejeitado e mantém a instância no herói. Não há destruição/venda neste slice.
- Recibos não são truncados: não reabilitar recompensas antigas após muitos loops.
- Reserva/ledger crescem localmente. Não equivalem a armazenamento online escalável.

## Equipamento / forja

Somente idle/completed/defeated, Loop OFF. Pausa não conta como intervalo.
Loadout é copiado para o motor; durante a hunt, não pode ser reconfigurado.
Comparação usa effectiveStats como o motor; retirar/equipar recompõe do zero.
Ganhos de máximo não restauram valores atuais, perdas aplicam clamp. Nova hunt
inicia recuperada pela regra já existente, com ou sem alteração de equipamento.

Forja: 200 ouro + 1 brasa → +1, uma vez, sem falha ou destruição. O catálogo
define incremento. Save único persiste custo/consumo/upgrade juntos; a instância
já +1 rejeita duplo clique/reenvio. Sem recursos não há alteração parcial.

## Persistência e falhas

Save `tactical-hunt-equipment-v2`, schema version 2. Migração aditiva da base:
não altera chaves de XP v1, preferências ou Boss Tokens. Ouro anterior era um
contador da sessão, não saldo persistido; não inventamos saldo retroativo.
Não confia em níveis/stats/modificadores derivados; catálogo é canônico.
Valida IDs, quantidades, upgrades, vocações, exclusividade, capacidade e slots.

Save inválido/versão desconhecida fica preservado, com aviso e exportação para
recuperação; novas hunts ficam bloqueadas. Falha de gravação de forja não aplica
nada. Recompensas não salvas ficam pendentes em memória, exportáveis, com retry e
aviso antes de fechar. Loop não reinicia com erro de persistência. Compare-before-
write detecta outra aba e impede sobrescrever; não é lock distribuído/anticheat.
Sincronização concorrente e recuperação automática multitab não fazem parte do slice.
Cancelamento de saída mantém renderer/controles vivos: a limpeza ocorre em
pagehide, não no aviso cancelável beforeunload. Resgate/forja aguardam o retry.

## UI / polish

Drawer por clique, sem drag-and-drop decorativo. Hero selector atualiza slots,
stats e restrições. Relatório mostra drops reais com atalho à comparação; loop
usa aviso compacto e relatório sob demanda. Inventário captura teclado/mouse;
ESC fecha primeiro o painel. Apenas consultas durante combate.
Consultar relatório suspende o reinício automático enquanto ele estiver aberto;
fechar retoma o intervalo do Loop, sem alterar sua configuração.

Três problemas priorizados na auditoria: nomes ocultos na party mínima; atributos
e diferenças sem representação; recompensa final apenas numérica. Correções:
nomes legíveis, comparação com sinal/cor/valores e cards com ícones originais.
Arte cardinal/blockout aprovada, footpoints, y-sort, sombras e efeitos preservados.
Não confundir legibilidade e determinismo com aprovação humana da diversão.

# Threat e aggro

Atualizado em 27 de julho de 2026.

## Autoridade

Toda decisão de alvo pertence ao `CombatEngine`. O renderer recebe
`target_change` e `aggro` apenas para representar o resultado.

## Aggro espacial inicial

- Cada monstro calcula threat inicial pela distância em tiles até os heróis.
- Um monstro próximo do Knight começa no Knight.
- Um monstro próximo do Druid ou Sorcerer começa no herói mais próximo.
- Em empate exato, o Knight vence o desempate.
- Não existe regra que force a backline a ser atacada.

## Threat durante a luta

- Dano gera threat no alvo atingido.
- Cura gera uma fração de threat em todos os inimigos vivos.
- Sem forced target, o monstro seleciona o herói vivo com maior threat.
- Mudanças são registradas na timeline com os motivos `spatial`, `threat`,
  `challenge` ou `forced_expired`.

## Challenge — `exeta res`

- Disponível somente após dois segundos lógicos do início do andar.
- Só é considerada quando ao menos um monstro válido está na backline.
- Alcance máximo: sete tiles, sem alcance global.
- Se nenhuma ameaça da backline estiver ao alcance, o Knight procura um tile
  caminhável que maximize a quantidade de ameaças alcançáveis.
- Ao conjurar, todos os monstros válidos dentro do alcance recebem forced target
  no Knight por seis segundos lógicos.
- A habilidade não teleporta nem puxa fisicamente criaturas.
- Ao expirar, o monstro volta a decidir pelo threat e pode abandonar o Knight.
- Se a backline voltar a ser atacada, o Challenge pode ser usado novamente,
  respeitando mana e cooldown.

## Critérios permanentes

- Pausa e velocidade não alteram a ordem ou duração lógica do forced target.
- Boss não é afetado pelo Challenge nesta vertical slice.
- Alterações exigem testes determinísticos do motor.


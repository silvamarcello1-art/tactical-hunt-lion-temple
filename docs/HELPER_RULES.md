# Regras do Helper e rotação

Atualizado em 27 de julho de 2026.

## Preferências atuais

Cada habilidade possui ativação e prioridade persistidas no navegador. A
definição em `src/data/abilities.ts` acrescenta:

- `preferredMinTargets`: preferência usada na pontuação da ação;
- `hardMinTargets`: mínimo obrigatório para a ação ser válida;
- `reserveForBoss`: impede o gasto antecipado de magias reservadas.

Uma wave com preferência de três alvos pode ser executada contra dois quando
dois respeitam o mínimo obrigatório e ela é a melhor ação válida.

## Seleção de ação

O motor filtra por ativação, mana, cooldown próprio, cooldown de grupo, alcance,
posição, mínimo obrigatório e reserva para boss. As ações restantes são
ordenadas por prioridade, atendimento da preferência, quantidade de alvos e
poder. Se nenhuma magia atingir da posição atual, o personagem pode
reposicionar-se; uma preferência não pode causar turno perdido.

## Posicionamento de Druid e Sorcerer

- O reposicionamento tático começa quando dois ou mais inimigos formam box no
  Knight.
- O motor gera candidatos entre três e sete tiles ao redor do Knight.
- Tiles fora da arena, ocupados ou perigosamente adjacentes a inimigos são
  rejeitados.
- O caminho curto não pode atravessar a box nem sobrepor outro personagem.
- A pontuação favorece segurança e maior cobertura das waves.
- Sem candidato seguro, o mago tenta outra magia válida em vez de congelar.
- Não há pathfinding avançado nesta etapa.

## Relógio e cooldown visual

- Eventos de cast carregam início, fim e duração do cooldown lógico.
- O HUD deriva máscara circular e numeral do `hunt-time`.
- Não existe timer independente por ícone.
- Pausa congela o indicador; 1x, 2x e 4x permanecem sincronizados.

## Pendente para o próximo incremento

- edição de `preferredMinTargets` e `hardMinTargets` na interface;
- limiar de cura configurável por personagem;
- migração para preferências versionadas individualmente por personagem;
- regras de distância e reserva editáveis no Helper.


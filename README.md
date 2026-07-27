# Lion Temple — vertical slice

Protótipo jogável de uma hunt automática 2D com PixiJS. Três personagens
atravessam três andares e enfrentam um chefe. O motor lógico gera uma timeline
determinística; o PixiJS reproduz os eventos e a interface HTML exibe controles,
party, habilidades, inventário e Hunt Analyzer.

## Executar

### Maneira fácil no Windows

Dê dois cliques em:

```text
INICIAR_JOGO.bat
```

O inicializador liga o servidor local e abre o jogo automaticamente no
navegador. A pequena janela minimizada chamada `Tactical Hunt Server` deve
permanecer aberta enquanto o jogo estiver sendo utilizado.

### Pelo terminal

```bash
npm install
npm run dev
```

Abra a URL indicada pelo Vite. Para validar:

```bash
npm run test
npm run build
```

## O que está implementado

- Mapa em grade de 30 × 18 tiles, com 32 pixels por tile.
- Cenário de templo reorganizado com piso de pedra, bordas e caminho central
  montados com tiles extraídos do pacote DAT/SPR fornecido.
- Knight, Druid e Sorcerer mantêm temporariamente as sprites antigas do
  protótipo; criaturas e chefe usam looktypes do pacote.
- Nomes, HP e mana aparecem sobre os personagens; HP muda de verde para
  amarelo em 60% e vermelho em 30%, e a mana é exibida em azul.
- Chivalrous Challenge (`exeta amp res`) puxa até quatro inimigos de distância
  para o Knight e mantém o aggro.
- Reposicionamento dos conjuradores para alcançar o alvo e retorno ao tile
  seguro.
- Nove habilidades com custo de mana, cooldown próprio e cooldown de grupo.
- Áreas explícitas por SQM: Berserk (9), Groundshaker (37), Strong Ice Wave
  (25), Energy Wave (11), Eternal Winter (61) e Rage of the Skies (85).
- As palavras de invocação aparecem sobre o conjurador e os efeitos SPR de
  gelo, fogo, energia, cura, físico, sagrado e terra são animados tile a tile.
- Áreas de monstros com aviso prévio e resolução nos tiles marcados.
- Quatro fases, boss, experiência, gold, loot, cura e dano.
- Interface compacta em três colunas, editor de habilidades e Hunt Analyzer.
- Velocidades 1×, 2× e 4×, pausa, reinício e loop automático opcional.
- Onze testes automatizados do motor, mana, pull, áreas e preferências.

## Arquitetura

- `src/combat`: motor lógico, movimentação, áreas, aggro e testes.
- `src/events`: contrato e reprodutor temporal dos eventos.
- `src/data`: personagens, monstros, andares e habilidades.
- `src/game`: renderização PixiJS, animações, tiles e efeitos.
- `src/main.ts`: interface, controles, editor e Analyzer.
- `scripts/tibia-assets`: importador local dos arquivos DAT/SPR.
- `public/assets/tibia`: atlas e tiles compactos usados no navegador.

## Importar novamente as sprites

O importador recebe a pasta `objectbuilder`, uma pasta temporária de inspeção e
o destino final dos assets:

```text
node scripts/tibia-assets/extract.mjs <objectbuilder> .tibia-preview public/assets/tibia
```

Ele suporta sprites estendidos em RGBA, frame groups e durações de animação. Os
arquivos `Tibia.dat`, `Tibia.spr` e `Tibia.otfi` permanecem intactos.

## Limitações atuais

- A movimentação é livre por tiles, mas ainda não existe colisão com todos os
  elementos decorativos nem pathfinding A* completo.
- A inteligência é determinística e baseada em prioridades.
- Não há backend, contas, banco de dados, equipamentos, multiplayer ou equipe
  AFK.
- Antes de uso comercial, a equipe deve confirmar as permissões dos assets ou
  substituí-los por arte própria.

## Próximos passos sugeridos

1. Definir obstáculos sólidos e pathfinding A*.
2. Criar editor data-driven de mapas, spawns e posições seguras.
3. Substituir gradualmente as sprites provisórias dos personagens por
   looktypes direcionais revisados.
4. Adicionar condições avançadas ao Helper: HP, mana, alvos e boss.
5. Persistir personagens e sessões em um backend.
6. Criar a equipe AFK e comparar os rendimentos das duas expedições.

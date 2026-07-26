# Lion Temple — vertical slice

Protótipo jogável de uma hunt automática 2D com PixiJS. Três personagens
atravessam três andares e enfrentam um chefe. O motor lógico gera uma timeline
determinística; o PixiJS somente reproduz os eventos e a interface HTML exibe
controles, party, habilidades, inventário e Hunt Analyzer.

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

- Mapa tático em grade de 30 × 18 tiles, com 32 pixels por tile.
- Knight, Druid e Sorcerer com movimentação e papéis diferentes.
- Aggro do Knight por área de tiles.
- Reposicionamento dos conjuradores para alcançar o alvo e retorno ao tile seguro.
- Nove habilidades com cooldown próprio e cooldown de grupo.
- Strong Ice Wave e Energy Wave com padrões direcionais próprios.
- Áreas de monstros com aviso prévio e resolução nos tiles marcados.
- Quatro fases, boss, experiência, gold, loot, cura e dano.
- Interface compacta em três colunas baseada na distribuição funcional da
  referência, com identidade própria.
- Editor para ativar/desativar habilidades e alterar prioridades.
- Velocidades 1×, 2× e 4×, pausa, reinício e loop automático opcional.
- Oito testes automatizados do motor, das áreas, dos tiles e das preferências.

## Arquitetura

- `src/combat`: motor lógico, padrões de tiles e testes.
- `src/events`: contrato e reprodutor temporal dos eventos.
- `src/data`: personagens, monstros, andares e habilidades.
- `src/game`: renderização PixiJS, animações e efeitos.
- `src/main.ts`: interface, controles, editor e Analyzer.

## Recursos visuais

Os heróis mantêm o atlas original do protótipo. Ícones de magia e três sprites
de criaturas da Tibia Wiki estão isolados em `public/assets/wiki` apenas como
placeholders temporários. Consulte `ASSET_SOURCES.md`.

## Limitações atuais

- Ainda não há colisões com paredes nem pathfinding A*.
- O mapa é uma arena tática; os tiles não vêm de um editor externo.
- A inteligência é determinística e baseada em prioridades.
- Não há backend, contas, banco de dados, equipamentos, multiplayer ou equipe AFK.
- Os sprites temporários devem ser substituídos por arte própria antes de uma
  distribuição comercial.

## Próximos passos sugeridos

1. Definir obstáculos, custo de movimento e pathfinding em tiles.
2. Criar editor data-driven de mapas, spawns e áreas seguras.
3. Substituir todos os recursos temporários por pixel art própria.
4. Adicionar condições avançadas ao Helper: HP, mana, número de alvos e boss.
5. Persistir personagens e sessões em um backend.
6. Criar a equipe AFK e comparar os rendimentos das duas expedições.

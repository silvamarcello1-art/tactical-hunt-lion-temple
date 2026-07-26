# Recursos visuais do protótipo

## Pacote DAT/SPR fornecido para o projeto

O mapa, os personagens, as criaturas e os efeitos animados usados pela
renderização PixiJS foram extraídos localmente do pacote fornecido pelo
responsável do projeto:

```text
rubinot- 2026/objectbuilder/Tibia.dat
rubinot- 2026/objectbuilder/Tibia.spr
rubinot- 2026/objectbuilder/Tibia.otfi
```

Nenhum dos arquivos originais é alterado ou publicado. O importador
`scripts/tibia-assets/extract.mjs` lê os metadados, extrai apenas os sprites
selecionados e gera atlas PNG/JSON compactos em `public/assets/tibia`.

O manifesto `public/assets/tibia/manifest.json` registra os looktypes, efeitos e
itens usados nesta vertical slice.

## Referências da Tibia Wiki

Os ícones das nove habilidades e os cooldowns de referência continuam
provisoriamente baseados nas páginas públicas da Tibia Wiki:

- Challenge, Berserk e Groundshaker.
- Heal Friend, Strong Ice Wave e Eternal Winter.
- Flame Strike, Energy Wave e Rage of the Skies.

Os antigos PNGs de criaturas em `public/assets/wiki` permanecem somente como
referência histórica e não são mais usados pela renderização da arena.

## Uso e distribuição

Os recursos de Tibia são usados somente nesta prova de conceito fornecida pelo
responsável do projeto. Antes de distribuição comercial ou divulgação pública
em escala, a equipe deve confirmar as permissões aplicáveis ou substituir os
recursos por arte própria. O motor, a timeline e o PixiJS continuam desacoplados
dos assets para permitir essa troca sem refazer as regras da hunt.

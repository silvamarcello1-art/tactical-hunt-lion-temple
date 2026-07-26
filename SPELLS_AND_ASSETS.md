# Magias, tiles e recursos visuais

## Rotação inicial

| Vocação | Magia | Palavras | Cooldown próprio | Grupo |
|---|---|---|---:|---:|
| Knight | Challenge | `exeta res` | 2 s | suporte: 2 s |
| Knight | Berserk | `exori` | 4 s | ataque: 2 s |
| Knight | Groundshaker | `exori mas` | 8 s | ataque: 2 s |
| Druid | Heal Friend | `exura sio` | 1 s | cura: 1 s |
| Druid | Strong Ice Wave | `exevo gran frigo hur` | 4 s | ataque: 2 s |
| Druid | Eternal Winter | `exevo gran mas frigo` | 40 s | focus: 4 s |
| Sorcerer | Flame Strike | `exori flam` | 2 s | ataque: 2 s |
| Sorcerer | Energy Wave | `exevo vis hur` | 8 s | ataque: 2 s |
| Sorcerer | Rage of the Skies | `exevo gran mas vis` | 40 s | focus: 4 s |

Os cooldowns foram consultados nas páginas individuais da Tibia Wiki em julho de
2026. A implementação mantém cooldown próprio e bloqueio do grupo em parâmetros
separados.

## Padrões de tiles no protótipo

- Berserk: área 3 × 3 centralizada no Knight.
- Strong Ice Wave: onda direcional com fileiras 1, 1, 3, 3 e 5.
- Energy Wave: onda direcional com fileiras 1, 1, 3, 3 e 3.
- Groundshaker, Eternal Winter e Rage of the Skies: áreas radiais discretas.
- Challenge: campo de aggro ao redor do Knight.
- Ataques dos magos inimigos e do boss: ondas direcionais com aviso prévio.

O conjurador escolhe a direção pelo alvo. Se nenhum inimigo estiver dentro do
padrão, ele avança um tile por ciclo até obter alcance. Depois de lançar a magia,
retorna um tile por ciclo à posição segura da formação.

## Arte

`public/assets/character-atlas.png` é um atlas original com os três heróis e
fallbacks visuais. Os GIFs em `public/assets/wiki` são recursos temporários
separados e documentados em `ASSET_SOURCES.md`.

# Pixel heroes v1 — origem e prompts — 19/10/2026

Continuação2C dos12trajes e addons/DLC:ver OUTFIT_ART_2C.md para o novo promptset,
38fontes builtin imagegen preservadas e38PNGs448²RGBA aplicadas no mundo.
O documento abaixo registra somente os três heróis nativos anteriores.

Modo: **builtin imagegen**, três gerações novas, fundo transparente, sem imagens
de referência e sem sprites/marcas de Tibia. A skill imagegen guiou prompts,
inspeção e conservação dos originais. Não requer chave OpenAI no projeto.

## Prompt set utilizado

Instrução comum: criar atlas quadrado de pixel art de RPG original, 4 colunas ×
4 linhas, vista superior 3/4; colunas sul/leste/norte/oeste. Linhas idle, passo
esquerdo, passo direito e ataque/conjuração. Exatamente um personagem por célula,
dimensão consistente, pés alinhados, margens transparentes sem sobreposição.
Contornos legíveis e paleta controlada; sem texto, logos, números, sombra de
chão incorporada, efeitos grandes ou cópia de jogo existente. Pedido de canvas
1024×1024; arquivos retornados são 1254×1254 RGBA, tratados proporcionalmente.

- Knight: cavaleiro original de aço escuro com detalhes de latão envelhecido,
  tabardo vinho, espada e escudo; silhueta robusta. Quarta linha golpe de espada.
- Druid: druida original com túnica/capuz verde floresta e musgo, broche de folha
  cobre e cajado de madeira com cristal verde pálido. Quarta linha conjuração.
- Sorcerer: mago original com túnica índigo, filetes de prata, manto violeta,
  cabelo escuro e cajado com esfera azul-violeta. Quarta linha conjuração.

## Arquivos e reprodução

Raw preservado em art/source/pixel-v1/{knight,druid,sorcerer}-source.png, fora do
public/bundle. Runtime em public/assets/original/pixel/{hero}-v1.png: 320×320,
RGBA/paleta, 16 células de 80×80, baseline y74, corpo idle ~60px.

scripts/import-pixel-atlas.mjs recebe herói, raw e caminho absoluto do módulo
Sharp do ambiente. Faz apenas recorte técnico por alpha, escala uniforme por
atlas com nearest-neighbour, alinhamento de pés e exportação; não inventa arte.
Não adiciona dependência runtime/CI. Exemplo, pelo próprio Codex:

```text
node scripts/import-pixel-atlas.mjs knight art/source/pixel-v1/knight-source.png <caminho-absoluto-do-modulo-sharp>
```

Os PNG finais são versionados. pnpm art:generate continua reproduzindo vetores
e ícones, não chama IA nem sobrescreve os PNG. pixelDefinition aplica o contrato
80×80 só aos três heróis, preservando monstros, IDs, footprint 1×1 e relógio.
Testes cobrem direções/frames/bounds, requests reais e pausa no navegador.

Limites de arte: atlas de 16 poses, morte usa fade do renderer; não há frames
dedicados de queda. Armas/roupas podem exigir retoque manual para registro perfeito
entre poses. Ícones de gelo e efeito de SD são vetores originais em código.
Não foi criado controle de zoom; o pedido final é arte maior e mira clara.

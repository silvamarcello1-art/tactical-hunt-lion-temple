# Roadmap

## MVP 0 — baseline estável

**Concluído em 27/07/2026.**

- Motor determinístico separado da timeline, renderer e interface.
- Hunt visual completa com boss.
- Controles, velocidade e loop estáveis.
- Limpeza explícita entre ciclos.
- Testes unitários e smoke tests em navegador.
- Build e publicação repetíveis.
- Mocks visíveis e contadores coerentes.

## MVP 1A — fidelidade da área da hunt

**Concluído em 27/07/2026.**

- shell mais compacto e arena central ampliada;
- escala, offsets, durações, câmera e debug centralizados;
- formação clara de frontline e backline;
- posições de party, spawns, combate e boss configuradas;
- estados visuais mínimos para movimento e combate;
- seleção de personagem pela Party e canvas;
- Helper filtrado pela vocação selecionada;
- debug opt-in e validação de limites;
- uma hunt completa nas três resoluções e três loops estáveis.

## MVP 1B — Helper individual e comportamento configurável

Base concluída:

- aggro espacial, threat e Challenge com forced target;
- reposicionamento tático da backline;
- rotação com preferência e mínimo obrigatório;
- reserva de habilidades para boss;
- cooldown visual sincronizado;
- camadas PixiJS de efeitos isoladas.

Próximo incremento:

- preferências independentes por personagem e contexto;
- limiar configurável de cura;
- edição do mínimo preferido e obrigatório para AOE;
- prioridade e distância de alvo;
- edição da rotação data-driven por vocação;
- comportamento de frontline e backline configurável;
- importação/exportação local das regras;
- testes determinísticos que provem a aplicação das preferências.

## MVP 1C — navegação e salas

- mapas e transições data-driven;
- tiles bloqueados e colisão;
- pathfinding simples e fallback explícito;
- threat/aggro configurável;
- reação a AOE;
- catálogo visual original/licenciado.

Backend, inventário e progressões permanecem proibidos.

Saída do MVP 1: dez ciclos consecutivos sem travar, atravessar obstáculos,
duplicar eventos/recompensas ou divergir do relatório.

## MVP 2 — inventário e progressão local

- item instance, Backpack, equipamentos e drag-and-drop;
- Loot Pouch, Supply Pouch, storage e mercador;
- Bestiário, Enciclopédia e árvore de progressão;
- save local versionado e migrações.

Ao final, decidir por ADR se contas e servidor são necessários.

## MVP 3 — retenção, competição e social

Condicionado ao gate de backend:

- Daily, Prey e eventos;
- Arena e ranking;
- Social, Guild e histórico.

## MVP 4 — economia online e operação

- market e comércio;
- loja/VIP conforme política não-P2W;
- pagamentos após revisão jurídica e antifraude;
- auditoria, moderação e métricas.

## Gates

1. **Arte:** licenciar ou substituir todo asset provisório.
2. **Backend:** ADR aprovada antes de persistência remota.
3. **Monetização:** revisão jurídica e política não-P2W.
4. **Escopo:** uma tarefa pertence a um único MVP.

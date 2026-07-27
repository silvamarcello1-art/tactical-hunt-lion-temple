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

## MVP 1 — fidelidade visual e mecânica da hunt

Escopo:

- mapas, salas, spawns e transições data-driven;
- tiles bloqueados e colisão;
- pathfinding simples e fallback explícito;
- threat/aggro configurável;
- formação, distância segura e reação a AOE;
- Helper mínimo para cura, alvo, AOE e rotação;
- catálogo visual original/licenciado;
- Analyzer ampliado sem divergência da timeline.

Backend, inventário e progressões permanecem proibidos.

Saída: dez ciclos consecutivos sem travar, atravessar obstáculos, duplicar
eventos/recompensas ou divergir do relatório.

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

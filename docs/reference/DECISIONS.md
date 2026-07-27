# Decisões e dúvidas

## Decisões aceitas

| ID | Decisão | Motivo |
|---|---|---|
| D-001 | PixiJS permanece como renderer | A vertical slice está validada nessa stack. |
| D-002 | Motor, timeline, renderer e interface ficam separados | Permite testes, AFK futuro e troca visual. |
| D-003 | Interface sem framework no MVP 1 | Não há benefício comprovado para migração agora. |
| D-004 | Sem backend no MVP 1 | Primeiro será validado o núcleo da hunt. |
| D-005 | Vídeo é referência de comportamento | Não copiar marca, código ou assets. |
| D-006 | Timeline pré-calculada e determinística no protótipo | Adequada ao baseline e aos testes. |
| D-007 | Modais preservam shell e contexto da hunt | Mantém densidade e continuidade visual. |
| D-008 | Documentos canônicos governam prompts curtos | Evita repetir contexto e perder decisões. |
| D-009 | Playwright/Edge protege o fluxo do MVP 0 | Cobre controle, loop, limpeza e responsividade. |
| D-010 | Debug visual é opt-in por `?debug=1` | Mantém diagnóstico disponível sem poluir a publicação normal. |
| D-011 | MVP 1A usa slots e deslocamentos curtos | Fidelidade suficiente sem antecipar pathfinding do MVP 1C. |
| D-012 | Seleção individual precede regras individuais | MVP 1A integra UI; preferências por personagem pertencem ao MVP 1B. |

## Riscos aceitos temporariamente

| ID | Risco | Tratamento |
|---|---|---|
| R-001 | Assets DAT/SPR e ícones são provisórios | Substituir/licenciar antes de uso comercial. |
| R-002 | Heróis usam animação provisória | Não bloquear o núcleo mecânico. |
| R-003 | Orquestração e seleção concentradas em `main.ts` | Extrair apenas com necessidade real. |
| R-004 | Sem lint | Typecheck, unitários e navegador são o gate atual. |

## Dúvidas pendentes

| ID | Pergunta | Decidir antes de |
|---|---|---|
| Q-001 | A*, flow field ou navegação por regiões? | Pathfinding do MVP 1. |
| Q-002 | Timeline inteira, em chunks ou ticks autoritativos? | Backend/sessões interrompíveis. |
| Q-003 | Quais módulos entram no primeiro lançamento? | Planejamento do MVP 2. |
| Q-004 | Arena assíncrona, PvE competitivo ou PvP? | MVP 3. |
| Q-005 | Quais benefícios VIP respeitam não-P2W? | MVP 4. |
| Q-006 | Qual estratégia de arte e licenciamento? | Expansão visual. |
| Q-007 | A equipe AFK de dois personagens permanece? | Persistência/economia. |
| Q-008 | Haverá suporte oficial a celular? | Fechamento visual do MVP 1. |

Mudança de stack, backend, autoridade, mapa ou monetização exige ADR própria.

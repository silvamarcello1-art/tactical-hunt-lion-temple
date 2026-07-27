# Linha de base verificável do MVP 0

Revisão realizada em 27/07/2026. A linha de base anterior às correções foi o
commit `2235b27`. Local e publicado apresentavam o mesmo canvas, estado `ready`,
Backpack `18 / 20` vazio e Loot Pouch `55 / 64` vazio.

## Alegações da conclusão anterior

| Alegação | Classificação após inspeção | Arquivos | Evidência | Problema encontrado | Decisão |
|---|---|---|---|---|---|
| MVP 0 funcional | IMPLEMENTADA E VALIDADA | `src/combat`, `src/events`, `src/game`, `src/main.ts` | Vitest + Playwright | Estado não distinguia transição, boss e derrota | Máquina de estados ampliada |
| Iniciar, pausar, continuar e reiniciar determinísticos | IMPLEMENTADA, MAS COM DEFEITO | `EventPlayer.ts`, `PixiRenderer.ts`, `main.ts` | Fluxo Playwright de sessão | Pausa congelava timeline, mas tweens continuavam | Ticker agora congela tweens durante pausa |
| Velocidades 1×, 2× e 4× | IMPLEMENTADA E VALIDADA | `EventPlayer.ts`, `main.ts` | teste parametrizado 1/2/4× e navegador | Cobertura anterior concentrada em 4× | Ordem testada nas três velocidades |
| Loop sem duplicação | IMPLEMENTADA E VALIDADA | `main.ts`, `PixiRenderer.ts` | 3 ciclos no Edge | Faltava evidência de boss e tweens | Boss único, 1 canvas, 3 heróis e 0 tweens validados |
| Limpeza de PixiJS | IMPLEMENTADA PARCIALMENTE | `PixiRenderer.ts` | `destroy()`, diagnósticos DOM | Pausa não suspendia tweens | Corrigido; cleanup entre sessões preservado |
| Todos os controles dão retorno | IMPLEMENTADA E VALIDADA | `index.html`, `main.ts` | primeiro cenário Playwright | Módulos futuros não usavam a frase padrão solicitada | Mensagem padronizada |
| 16 testes unitários | IMPLEMENTADA E VALIDADA | `src/**/*.test.ts` | `pnpm test` anterior | Faltavam 1×, 2×, dispose, dano recebido e boss | Ampliado para 20 testes |
| 4 testes no Edge | IMPLEMENTADA E VALIDADA | `tests/e2e/mvp0.spec.ts` | `pnpm test:e2e` | Cobertura de mocks e pausa visual incompleta | Cenários ampliados |
| Três resoluções sem rolagem horizontal | IMPLEMENTADA E VALIDADA | `src/style.css`, teste e2e | 1366×768, 1600×900, 1920×1080 | Nenhum defeito impeditivo | Mantido |
| Typecheck e build aprovados | IMPLEMENTADA E VALIDADA | `package.json` | `pnpm typecheck`, `pnpm build` | Sem lint configurado | Lint continua débito explícito |
| Documentação canônica | IMPLEMENTADA PARCIALMENTE | `docs/` | inspeção dos documentos | Faltava este baseline verificável | Documento criado |
| Publicação no mesmo site | IMPLEMENTADA E VALIDADA | `.openai/hosting.json` | smoke público | Deve ser repetida após esta manutenção | Republicar somente após validação |

## Elementos visíveis

| Elemento | Classificação | Arquivos responsáveis | Comportamento observado | Problema/decisão |
|---|---|---|---|---|
| Cabeçalho Tactical Hunt / PixiJS | funcional | `index.html`, `style.css` | Identidade e stack visíveis | Mantido |
| Moedas | SOMENTE INTERFACE OU MOCK | `index.html` | Valores fixos | Marcados como `DEMO` |
| Stamina e Boosts | SOMENTE INTERFACE OU MOCK | `index.html` | Valores fixos | Marcados como `DEMO` |
| Helper | funcional no escopo | `main.ts`, `abilities.ts` | Abre editor de ativação/prioridade | Helper completo fica no MVP 1 |
| Bestiário | placeholder explícito | `main.ts` | Abre aviso de próximo MVP | MVP 2 |
| Progressão | placeholder explícito | `main.ts` | Abre aviso de próximo MVP | MVP 2 |
| Armazém | placeholder explícito | `main.ts` | Abre aviso de próximo MVP | MVP 2 |
| Social | placeholder explícito | `main.ts` | Abre aviso de próximo MVP | MVP 3 |
| Hunt Analyzer | funcional | `LiveHuntState.ts`, `main.ts` | Tempo, XP, gold, kills, boss, dano, dano recebido e cura | Sem histórico; futuro |
| Registro | funcional | `main.ts` | Eventos relevantes da sessão atual | Limpo no reset |
| Etapas 1/2/3/boss | funcional | `CombatEngine.ts`, `main.ts` | Avanço em ordem | Transição/boss agora têm estado próprio |
| Loop | funcional | `main.ts` | Repete ou encerra | Três ciclos validados |
| Iniciar | funcional | `main.ts`, `EventPlayer.ts` | Só habilitado em `idle` | Sessão duplicada bloqueada |
| Pausar/continuar | funcional | `main.ts`, `PixiRenderer.ts` | Congela timeline, relógio e tweens | Corrigido nesta revisão |
| Reiniciar | funcional | `main.ts`, `PixiRenderer.ts` | Descarta sessão e retorna a zero | Concorrência bloqueada |
| Velocidades | funcional | `EventPlayer.ts`, `main.ts` | 1×, 2× e 4× sem reordenar eventos | Testes parametrizados |
| Habilidades | funcional no escopo | `abilities.ts`, `main.ts` | Configura ativa/prioridade e recalcula | Condições avançadas ficam no MVP 1 |
| Party e Config | parcialmente funcional | `main.ts`, `config.ts` | HP, mana, papéis e modal | Equipamentos/personagens extras fora do MVP 0 |
| Backpack | interface mockada | `index.html`, `main.ts` | 20 slots vazios | Contador corrigido para `0 / 20 slots` |
| Loot Pouch | parcialmente funcional | `LiveHuntState.ts`, `main.ts` | Lista loot da sessão | Contador agora representa tipos ocupando slots |
| Supply Pouch | interface mockada | `index.html`, `main.ts` | Valores fixos e aviso | Marcada `DEMO`; consumo no MVP 2 |
| Salvar e recalcular | funcional | `main.ts`, `localStorage` | Persiste preferências e reinicia limpo | Validado no navegador |
| Repetir hunt | funcional | `main.ts` | Disponível no relatório final | Cria nova sessão limpa |

## Resultado da revisão

O MVP 0 é uma vertical slice funcional e reproduzível. Inventário real,
progressões, backend e fidelidade mecânica avançada não foram localizados porque
estão fora do escopo. A próxima tarefa permanece o MVP 1.

## Reconciliação antes do MVP 1A

O commit `8220a6d` e a versão pública 6 foram revalidados em 27/07/2026 antes de
qualquer alteração do MVP 1A. Instalação, typecheck, 20 testes unitários, build,
4 fluxos no Edge, três loops, reset, Analyzer, Loot Pouch e ausência de
duplicação foram confirmados. Nenhuma alegação do encerramento precisou ser
reclassificada ou corrigida.

# Matriz de paridade

Referência comportamental: `docs/reference/VIDEO_REFERENCE_MAP.md`.

| Funcionalidade | Referência | Estado atual | Diferença | Prioridade | MVP | Dependências | Aceite |
|---|---|---|---|---|---|---|---|
| Shell compacto | Hunt central e dados nas bordas | Implementado no MVP 1A | Dados reais ainda limitados | P1 | 1A | Design | Hunt permanece principal em 1366–1920 px |
| Mapa em tiles | Salas e decoração variadas | Parcial, melhorado no MVP 1A | Um mapa, sem colisão sólida | P1 | 1A/1C | Modelo de mapa | Salas data-driven e obstáculos sólidos |
| Movimento da party | Formação e reposicionamento | Implementado com posição tática dos magos | Sem pathfinding avançado | P1 | 1A/1B | Timeline | Magos não atravessam a box, saem da arena ou se sobrepõem |
| Movimento de monstros | Cerco e perseguição | Parcial | Sem pathfinding | P1 | 1 | Colisão | Alvos alcançados sem atravessar bloqueios |
| Aggro do Knight | Tank concentra criaturas | Aggro espacial, threat e Challenge implementados | Parâmetros ainda não editáveis no Helper | P1 | 1B | Threat model | Proximidade, forced target, perda e recuperação testados |
| AOE de monstros | Aviso e impacto por tiles | Implementado | Poucos padrões | P1 | 1 | Catálogo | Aviso e dano usam os mesmos tiles |
| Magias da party | Palavras, área e animação | Áreas, rotação e cooldown lógico implementados | Arte provisória | P1 | 1A/1B | Asset pipeline | Preferência não bloqueia ação e cooldown acompanha pausa/velocidade |
| Cura e mana | Automação e barras | Implementado | Regra fixa | P1 | 1 | Helper | Limiares configuráveis e testados |
| Morte/limpeza | Feedback sem resíduo | Implementado com camadas PixiJS isoladas | Sem cadáver/revive | P2 | 2 | Regras | Entidade removida uma vez e efeitos/tweens terminam em zero |
| Transição | Ondas e boss no mesmo shell | Parcial | Mesmo mapa | P1 | 1 | Mapas | Troca clara e limpeza total |
| Loop | Repetição opcional | Implementado | Sem metas de parada | P1 | 1 | Sessão | ON repete, OFF encerra, sem duplicação |
| Party lateral | HP, mana e skills | Parcial | Sem equipamentos | P1 | 2 | Itens | Ficha real por personagem |
| Helper | Regras por personagem/contexto | Parcial, seleção individual no 1A | Ativação/prioridade ainda compartilhadas por habilidade | P1 | 1B | Rule engine | Cura, alvo, AOE e distância editáveis por personagem |
| Analyzer | XP, loot, boss, dano, dano recebido e cura | Implementado | Sem histórico | P1 | 1 | Telemetria | Timeline e relatório coincidem |
| Backpack | Slots e itens | Mock explícito | 20 slots vazios e contador coerente | P1 | 2 | Item instance | Mover item sem perda/duplicação |
| Equipamentos/DnD | Manipulação e comparação | Ausente | Sem modelo | P1 | 2 | Inventário | Operações atômicas e validadas |
| Loot/Supply Pouch | Filtros, capacidade e consumo | Parcial/mock explícito | Loot lista tipos; supply é `DEMO` | P1 | 2 | Inventário | Capacidade e custos no Analyzer |
| Bestiário/progressão | Catálogos e recompensas | Ausente | Aviso de roadmap | P2 | 2 | Persistência | Recompensa única e determinística |
| Daily/Arena/Social/Guild | Retenção e competição | Ausente | Aviso de roadmap | P3 | 3 | Backend | Regras autoritativas e permissões |
| Market/loja/VIP | Economia online | Ausente | Fora do protótipo | P3 | 4 | Backend/jurídico | Transações auditáveis e não-P2W |
| Arte e identidade | Visual consistente | Parcial | Assets provisórios | P0 | Gate | Licenças/arte | Release sem asset não licenciado |

# Matriz de paridade

Referência comportamental: `docs/reference/VIDEO_REFERENCE_MAP.md`.

| Funcionalidade | Referência | Estado atual | Diferença | Prioridade | MVP | Dependências | Aceite |
|---|---|---|---|---|---|---|---|
| Shell compacto | Hunt central e dados nas bordas | Implementado | Dados reais ainda limitados | P1 | 1 | Design | Hunt permanece principal em 1366–1920 px |
| Mapa em tiles | Salas e decoração variadas | Parcial | Um mapa, sem colisão | P1 | 1 | Modelo de mapa | Salas data-driven e obstáculos sólidos |
| Movimento da party | Formação e reposicionamento | Parcial | Movimento direto | P1 | 1 | Navegação | Papéis respeitam distância e tiles válidos |
| Movimento de monstros | Cerco e perseguição | Parcial | Sem pathfinding | P1 | 1 | Colisão | Alvos alcançados sem atravessar bloqueios |
| Aggro do Knight | Tank concentra criaturas | Implementado | Threat simplificado | P1 | 1 | Threat model | Ameaça configurável e testada |
| AOE de monstros | Aviso e impacto por tiles | Implementado | Poucos padrões | P1 | 1 | Catálogo | Aviso e dano usam os mesmos tiles |
| Magias da party | Palavras, área e animação | Implementado | Arte provisória | P1 | 1 | Asset pipeline | Três magias por vocação consistentes |
| Cura e mana | Automação e barras | Implementado | Regra fixa | P1 | 1 | Helper | Limiares configuráveis e testados |
| Morte/limpeza | Feedback sem resíduo | Implementado | Sem cadáver/revive | P2 | 2 | Regras | Entidade removida uma vez |
| Transição | Ondas e boss no mesmo shell | Parcial | Mesmo mapa | P1 | 1 | Mapas | Troca clara e limpeza total |
| Loop | Repetição opcional | Implementado | Sem metas de parada | P1 | 1 | Sessão | ON repete, OFF encerra, sem duplicação |
| Party lateral | HP, mana e skills | Parcial | Sem equipamentos | P1 | 2 | Itens | Ficha real por personagem |
| Helper | Regras por personagem/contexto | Parcial | Apenas ativação/prioridade | P1 | 1 | Rule engine | Cura, alvo, AOE e distância editáveis |
| Analyzer | XP, loot, boss, dano, dano recebido e cura | Implementado | Sem histórico | P1 | 1 | Telemetria | Timeline e relatório coincidem |
| Backpack | Slots e itens | Mock explícito | 20 slots vazios e contador coerente | P1 | 2 | Item instance | Mover item sem perda/duplicação |
| Equipamentos/DnD | Manipulação e comparação | Ausente | Sem modelo | P1 | 2 | Inventário | Operações atômicas e validadas |
| Loot/Supply Pouch | Filtros, capacidade e consumo | Parcial/mock explícito | Loot lista tipos; supply é `DEMO` | P1 | 2 | Inventário | Capacidade e custos no Analyzer |
| Bestiário/progressão | Catálogos e recompensas | Ausente | Aviso de roadmap | P2 | 2 | Persistência | Recompensa única e determinística |
| Daily/Arena/Social/Guild | Retenção e competição | Ausente | Aviso de roadmap | P3 | 3 | Backend | Regras autoritativas e permissões |
| Market/loja/VIP | Economia online | Ausente | Fora do protótipo | P3 | 4 | Backend/jurídico | Transações auditáveis e não-P2W |
| Arte e identidade | Visual consistente | Parcial | Assets provisórios | P0 | Gate | Licenças/arte | Release sem asset não licenciado |

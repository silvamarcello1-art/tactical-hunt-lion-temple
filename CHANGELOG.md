# Changelog

## 0.1.0 — 2026-07-27

### Estabilizado

- Estado explícito de sessão: carregando, pronto, rodando, pausado, concluído e
  erro.
- Reinício protegido contra concorrência.
- Velocidade preservada entre reinícios e ciclos.
- Loop cancelável sem iniciar um ciclo residual.
- Descarte de ticker, player, tweens, unidades e canvas.
- Remoção de unidades mortas e métricas seguras contra valores inválidos.
- Fallback controlado de carregamento.

### Interface

- Módulos futuros agora exibem o MVP correspondente.
- Helper abre a configuração de habilidades.
- Abas Geral, Combate e Loot dão retorno visível.
- Painéis recolhíveis e Supply Pouch respondem.
- Favicon próprio incluído.

### Qualidade

- `LiveHuntState` e constantes visuais extraídos.
- 16 testes unitários.
- 4 cenários Playwright cobrindo controles, três loops e resoluções.
- Documentação canônica consolidada em `docs/`.

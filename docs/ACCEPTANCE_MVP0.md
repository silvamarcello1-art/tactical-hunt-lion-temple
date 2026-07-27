# Aceite do MVP 0

## Resultado

**APROVADO em 27/07/2026.**

## Critérios comprovados

- [x] Instalação reproduzível a partir do lockfile.
- [x] TypeScript estrito sem erros.
- [x] 16 testes unitários aprovados.
- [x] 4 cenários Playwright aprovados no Edge.
- [x] Build Vite e bundle Sites gerados.
- [x] Uma hunt inicia, percorre três ondas e derrota o boss.
- [x] Knight, Druid e Sorcerer aparecem simultaneamente.
- [x] HP, mana, dano, cura, magias e AOE são atualizados.
- [x] Pausa congela o relógio e continuar retoma a mesma timeline.
- [x] Reinício volta a 00:00 e mantém apenas um canvas.
- [x] Velocidade selecionada permanece após reinício e loop.
- [x] Loop completa três ciclos sem eventos ou canvas duplicados.
- [x] Desativar o loop cancela a próxima repetição.
- [x] Analyzer final corresponde ao `HuntResult`.
- [x] Módulos futuros dão retorno explícito, sem botão silencioso.
- [x] Resoluções 1366×768, 1600×900 e 1920×1080 sem rolagem horizontal.
- [x] Nenhum erro de página ou console nos cenários automatizados.
- [x] Falha de inicialização possui fallback controlado.

## Evidência automatizada

```text
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

O cenário de loop aguarda `data-completed-cycles="3"`, desliga o loop, confirma
um canvas, três unidades remanescentes da party e ausência de quarto ciclo.

## Débitos aceitos

- Sem lint configurado.
- Assets provisórios não autorizam uso comercial.
- Sem colisão/pathfinding.
- Sem inventário, progressão ou backend.
- Dados de shell demonstrativos.

# Coleta Windows autorizada —01/11/2026

Usuário autorizou explicitamente a coleta temporária CPU/render no runner.
PR ec42 final:353unitPASS/62E2EPASS/5timeouts/7nãoexecutados(1,4h),deploySKIPPED.
Push ec42 anterior:353unitPASS/63E2EPASS/4timeouts/7nãoexecutados. Ambos terminaram.

Branch isolada diagnostics/windows-cpu-profile-ec42,fora de feature/**,sem PR.
Workflow próprio só nesta branch e para push com marcador[profile-ec42-once].
Não altera preview.yml,não usa Pages/ID-token,não publica e não substitui gates.
Checkout pinado em github.sha;script recusa diferenças de runtime/tests/config
em relação aec42. Contents read;credenciais não persistidas. Sem secrets/envdump.
Normal push dispara uma coleta;não repetir automaticamente. Branch retida como
histórico;sem apagar remote/rewrite ou integrar a instrumentação na feature.

Script diagnóstico usa Edge/Vite/viewport/pnpm10/node22 como o CI. Amostra curta
controlada40×250ms com/sem snapshots,cenário de3loops controlados (mesmo quantum/limite360s),
10s de relógio real4× e ações originais de inventário(220s). Assertions10s e
passos existentes preservados;testes reais não modificados. Profiling acrescenta
custo:resultados são diagnóstico,não aprovação ou comparação FPS. Sem flags
para desativar GPU/mudar browser security. Coleta versão/rendererGPU,CPUprofile,
Performance metrics,CPU nativa por processo(renderer/GPU/browser),timeline
nativa comprimida com buffer circular16MiB,
tempos de ações e PNGs. A timeline pode representar só a janela final;não é
histórico completo. PerfilCPU/métricas cobrem o intervalo medido. Coleta
inclui snapshots Playwright no cenário longo/inventário como no CI original.
O limite30min é só proteção do novo job de diagnóstico;nenhum limite220/360s
de cenário ou assertion10s foi ampliado. Artefatos coletados após o workload
não são tempo de jogo e têm custos separados. Dados preliminares locais
mostraram timeline irrestrita grande;categorias/buffer foram limitados antes
da execução Windows. Não coletar screenshots contínuos nem ambiente/secrets.
Artefatos em test-results/windows-profile;retenção7dias,upload mesmo com falha.
Todos os processos/contextos são próprios e encerrados em finally.

Referência de disparo por push em branch não-default:
https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#push

Validação local:cinco cenários concluídos,perfis/timelines/snapshots salvos sem
erros de coleta;Node --check PASS. API CPU por processo também conferida.
Resultados locais são apenas validação do coletor,não aprovação do WindowsCI.

Após coleta:analisar dados reais,registrar limites e preservar artefatos. Voltar
àfeature/roguelite-alpha sem mudar runtime;nenhuma nova tentativa ou fix especulativo.

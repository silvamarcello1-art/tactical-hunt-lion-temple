# Custo residual de apresentação — investigação local, 01–02/11/2026

Continuação autorizada02/11: implementação restrita candidata descrita em
IDLE_RENDER_AND_DOM.md. Benefício ocioso medido, não aceleração de combate;
limites/gates novos independentes. O restante deste documento preserva o
diagnóstico anterior à implementação, não uma proibição ainda sem autorização.

## Resultado e fronteiras

Investigação autorizada após os dois CIs falhos do cache. Foram concluídas
21 amostras locais: 15 de 40 segundos lógicos e 6 de 16 segundos. Nenhuma
mudança de runtime foi implementada e nenhum CI, retry ou deploy foi iniciado.
A fonte permanece54f9a695a825e6e55968f1fe50d9a5fe263b9b6d; checkout documental
de entrada07097d787477be9003365107ebe54cd8151930e0, local=origin/CLEAN.

Há custo mensurável tanto no desenho WebGL quanto na composição da página.
Remover máscara, efeitos, nomes/barras Pixi ou terreno isoladamente NÃO mostrou
uma solução forte para o custo residual. Desligar transições CSS também NÃO
melhorou a cena completa na amostra medida. Não propor esses controles
diagnósticos como redução de qualidade entregue nem como gate aprovado.

A timeline do navegador local concentra espera inclusiva em apresentação/swap
do processo gráfico, com JavaScript relativamente pequeno. Isso estreita a
investigação, mas NÃO identifica sozinho o shader/operação causal nem prova
a causa exata dos timeouts do runner Windows. Nenhuma correção/CI novo está
aprovado por estas medições.

## Método e identidade

- Edge headless, backend ANGLE/Vulkan SwiftShader confirmado em cada contexto;
  seleção oficial do driver, sem flag insegura ou alteração de sandbox/política.
- Máquina local12 CPUs lógicas; não é o runner4 CPUs. Execuções sequenciais,
  contextos novos e servidor Vite4184 próprio; servidor4181 existente preservado.
- Viewport1366×768, mesma fonte atual e o relógio controlado já empregado no
  diagnóstico; passos250ms e velocidade4×. Nenhum deadline/clock do teste foi
  editado. Estas são amostras parciais, NÃO três Hunts ou smokes de aceitação.
- Helpers somente no workspace. Hook da resposta Vite expõe o renderer e fixa
  o ID de sessão para conservar drops dependentes desse ID. Não altera RNG,
  motor ou arquivos. Ocultação de camadas e CSS existem só em memória no
  contexto descartável; todas as callbacks/simulação continuam executando.
- Todos os15 casos40s:2718 eventos completos e entidades finais idênticos,
  SHA2567e2e492b155b35e87ac9608076a42bad853abe51a6ed4f488048cba4b11215a5.
  Todos os6 casos16s:1014 eventos/entidades idênticos,
  SHA2566ba9633ae0b25f7fe82bdc65ed1f6f56e28135fbacb06dd83ae2e11484c75a54.
  Overlaps lógico/corporal finais0, sem pageerror. Não é prova contínua de
  ausência de overlap ou cleanup no fim de três ciclos.
- Quatro warnings queueSerial preservados no caso software-no-effects do
  primeiro bloco. Os demais casos não registraram warnings. Não declarar
  console universalmente limpo ocultando esses quatro avisos.
- Capturas e readback somente DEPOIS das métricas, como no helper anterior;
  não substituem o caminho original de screenshots. PNG full40s do bloco3
  inspecionado: cenário/boss/party presentes. Ocultações são controles
  negativos, não imagens de entrega. Sem alegação de pixel identity nova.

## Separação de camadas —40s lógicos

Cada linha é uma amostra, sem inferência estatística. Compare dentro do bloco;
não extrapolar entre datas/carga/ordem ou chamar CPU acumulada de FPS.

| Bloco | Controle | Parede(s) | CPU processo gráfico(s) | drawElements |
| --- | --- | ---: | ---: | ---: |
|1|Completo/cache atual|9,274|87,668|2661|
|1|Sem máscara|9,723|92,414|786|
|1|Sem efeitos/projéteis/telegraphs|8,933|83,951|2500|
|1|Sem nomes/barras Pixi|8,846|83,350|2660|
|1|Sem world, só cenário externo|7,904|69,753|625|
|1|Sem desenho Pixi|7,231|49,334|0|
|2|Sem desenho Pixi, canvas oculto|13,010|46,541|0|
|2|Sem cenário externo|10,465|90,632|2036|
|2|Sem terreno|11,167|99,433|2580|
|2|Completo/cache atual|10,898|96,492|2661|
|3|Sem desenho Pixi|8,401|48,856|0|
|3|Sem desenho Pixi, cooldowns ocultos|7,909|43,470|0|
|3|Sem desenho Pixi, shell oculto|8,100|0,252|0|
|3|Desenho Pixi ativo, shell oculto|11,956|104,259|2661|
|3|Completo/cache atual|10,789|91,831|2661|

A máscara cai de2661 para786 draws sem ganho de parede nesta amostra: contagem
de draws isolada não é um proxy suficiente. Ainda há custo gráfico sem Pixi;
ocultar só o canvas não o elimina. Ocultar o shell com Pixi desligado derruba
CPU gráfica48,856→0,252s, mas parede só8,401→8,100s. Portanto não há um único
custo somável nem prova de que esconder a página aceleraria o gate. Com Pixi
ativo e shell oculto, a GPU continua ocupada. Remover informação visual não é
solução aceita.

## Timeline curta e controle de transições —16s lógicos

Duas primeiras amostras: completo3,760s/CPU gráfica30,393s/JS0,285s;
sem desenho Pixi+shell oculto2,761s/CPU gráfica0,104s/JS0,168s.
No completo,16 eventos NativeViewGLSurfaceEGL:RealSwapBuffers somam3,350s
INCLUSIVOS; na repetição completa do bloco CSS,13 eventos somam2,659s.
Eventos SkiaOutputSurfaceImplOnGpu::SwapBuffers/Graphics.Pipeline são aninhados:
NÃO somar como custos independentes. Duração inclui espera/driver/trabalho
pendente e não é CPU exclusiva do swap, prova de shader específico ou FPS.
Coleta local adiciona overhead e não mede os jobs remotos atuais.

| Controle CSS | Parede(s) | CPU gráfica(s) | LayoutCount |
| --- | ---: | ---: | ---: |
|Sem desenho Pixi|3,322|19,897|546|
|Sem desenho Pixi, transições/animações CSS desligadas|2,933|11,780|222|
|Pixi completo, transições/animações CSS desligadas|4,231|33,564|16|
|Completo com CSS original|3,744|31,489|23|

Retirar movimento CSS ajuda o controle sem Pixi, mas NÃO a cena completa.
Não entregar animation:none nem chamá-lo de correção do CI. O profiler JS
amostrou principalmente idle/program/dispatchEvent; categorias nativas e
eventos inclusivos não permitem atribuir toda a diferença ao código de jogo.
Com shell oculto, LayoutCount continua alto(1664 no bloco40s), enquanto CPU
gráfica cai: contagem de layout sozinha também não explica o tempo total.

## Evidências e reprodução

Workspace C:/Users/Joao/Documents/Codex/2026-10-20/in-app-browser-context-source-ambient:

- renderer-ab/residual-cache-1, residual-cache-2, residual-cache-3:
  metadata/JSONs/estados completos/canvas/PNGs/server.log.
- renderer-ab/residual-cache-timeline e residual-css-motion:
  os mesmos dados, mais6 cpuprofiles e6 timelines do navegador.
- renderer-ab/residual-analysis.json:21 linhas com métricas/erros/avisos,
  perfil self e durações inclusivas por thread.
- renderer-ab/residual-evidence-manifest.json: SHA256/tamanho de cada arquivo.
  SHA256 do manifesto:
  ad55a699fcb3fb579961090b4f3757b2e0a3917a9cd40111f11ffebf3784be4d.
- renderer-ab-local.mjs SHA256:
  889935c18f3322ed30db413bbd1dae5cacf3dc0760c827de428fd47bb99faeca.
- analyze-residual-cache.mjs SHA256:
  0b02f2219116bd6d88327de125c38e8567b36ffc034b3a1bd1611b8b7f3d3e05.

O campo runtime=ec42 nos metadados do helper histórico identifica a BASE da
comparação candidate, não a fonte entregue nestas amostras. checkout07097d7,
sourceFiles hashes e diff vazio de src/public/tests/scripts/deps/workflows
contra54 identificam a fonte real. Não atribuir estas amostras ao runtimeec42.

Exemplo de comando diagnóstico já executado, não repetir como gate:

    node renderer-ab-local.mjs residual-cache-timeline software-full,software-no-render-page-hidden 16 candidate timeline

## Próxima decisão, sem fix especulativo

Uma otimização restrita candidata é evitar render contínuo quando a cena está
realmente estável/ociosa e escritas DOM idênticas em PlayerControls.sync e
updateCooldownVisuals. O código ainda escreve textos/atributos em hunt-time,
inclusive quando iguais. É uma hipótese localizada, NÃO causa comprovada nem
garantia de completar o CI; o cenário de inventário usa relógio real e ficou
idle, enquanto os loops permaneciam ativos.

Se autorizada, medir essa hipótese localmente antes de entregar: manter a
mesma cadência lógica/inputs/efeitos/animação ATIVA, aparência/pausa/resize/
outfits/mira, todos os callbacks e asserts originais. Só implementar e enviar
novo runtime após evidência de benefício e regressões completas. Não reduzir
qualidade, desligar transições, esconder layers, mudar CI/driver do workflow
ou repetir o gate cegamente.

Publicação continua BLOQUEADA pelos CIs54 já encerrados; manifest público
b9 é antigo. Sem smoke público contra versão errada, novo CI/retry/deploy,
fix, monitor, agente, goal, merge, force ou Sites. Navegadores/servidor4184
próprios foram fechados. Apenas checkpoint documental registra a investigação.

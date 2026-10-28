# Backlog de Tarefas — Weather App

Backlog derivado de [`plans/weather-app-plan.md`](../plans/weather-app-plan.md)
e rastreável a [`specs/weather-app-spec.md`](../specs/weather-app-spec.md).
As tarefas seguem o fluxo de implementação **tipos → funções puras → services →
hooks → componentes → integração → testes → hardening**. Dependências listam
pré-requisitos reais; tarefas sem relação de pré-requisito permanecem
independentes, mesmo quando aparecem em ordem de apresentação.

**Status:** Concluída = critérios atendidos e verificados; Parcial = há
implementação, mas faltam critérios ou verificação; Pendente = sem evidência de
implementação/verificação.

Evidências e gates de release: [registro de validação de 27/10/2026](../plans/weather-app-release-validation.md).
Os arquivos “prováveis” são sugestões; a implementação efetiva usa
`useWeather`, `SearchBar`, `UnitToggle` e testes em `tests/unit/`.
Registros de entregas intermediárias abaixo são históricos, não substituem o
status e os critérios atuais.

## Prioridade e tamanho relativo

**Prioridade:** P0 = caminho mínimo para uma primeira versão utilizável
(buscar cidade e consultar condições atuais); P1 = completar os requisitos
funcionais restantes e seus estados/coberturas; P2 = validações de release e
hardening operacional que não bloqueiam a primeira entrega funcional.

**Tamanho:** P = pequeno (uma responsabilidade simples, até cerca de meio dia);
M = médio (responsabilidade com vários casos/integração, cerca de 1–2 dias);
G = grande (coordenação ampla, cenários múltiplos ou validação de release,
mais de 2 dias). Estimativas relativas, não compromisso de prazo.

| Tarefa | Prioridade | Tamanho | Tarefa | Prioridade | Tamanho | Tarefa | Prioridade | Tamanho |
|---|---:|:---:|---|---:|:---:|---|---:|:---:|
| T-01 | P0 | P | T-14 | P0 | G | T-27 | P1 | M |
| T-02 | P0 | M | T-15 | P0 | M | T-28 | P0 | M |
| T-03 | P0 | M | T-16 | P0 | M | T-29 | P1 | P |
| T-04 | P0 | M | T-17 | P1 | M | T-30 | P0 | M |
| T-05 | P0 | P | T-18 | P0 | M | T-31 | P0 | G |
| T-06 | P0 | M | T-19 | P1 | M | T-32 | P1 | G |
| T-07 | P1 | P | T-20 | P0 | M | T-33 | P1 | M |
| T-08 | P0 | M | T-21 | P1 | M | T-34 | P1 | G |
| T-09 | P0 | M | T-22 | P0 | M | T-35 | P2 | G |
| T-10 | P0 | P | T-23 | P1 | M | T-36 | P2 | M |
| T-11 | P0 | M | T-24 | P1 | P | T-37 | P2 | P |
| T-12 | P0 | P | T-25 | P1 | P | T-38 | P2 | M |
| T-13 | P0 | P | T-26 | P0 | G | T-39 | P2 | M |

## Sequência sugerida em fatias verticais

As fatias abaixo entregam comportamento observável de ponta a ponta. Dentro de
cada uma, implementar o caminho fino primeiro e acrescentar os testes antes de
ampliar o escopo; os números referem-se às tarefas do backlog.

1. **Busca visível:** campo, envio explícito, resultados selecionáveis e estado
   vazio/error. Base: T-01, T-02, T-08, T-14, T-10, T-11; verificar com T-05,
   T-09, T-12, T-13 e T-15. Entrega uma busca funcional antes de integrar
   forecast.
2. **Condições atuais da cidade:** seleção dispara a consulta e exibe
   condições atuais com unidades, horário/fuso válido e indisponibilidades.
   Acrescentar T-03, T-04, T-16, T-17, T-26, T-20 e conectar em T-30; verificar
   com T-06, T-18, T-19, T-22, T-23 e T-28. A consulta já normaliza o snapshot
   completo, mas a interface desta fatia prioriza condições atuais. T-31
   valida a primeira fatia executável completa.
3. **Previsão de cinco dias visível:** expor na UI as datas locais e dados
   diários já normalizados, mantendo os dias/campos parciais. Acrescentar
   T-21; executar T-23 e ampliar T-31. (T-17 e T-19 podem estar concluídos na
   fatia 2 por serem pré-requisito técnico da consulta única.)
4. **Alternância de temperatura:** adicionar controle Celsius/Fahrenheit sem
   novo request. Acrescentar T-24 e T-27; verificar com T-07, T-25 e T-29 e
   completar o percurso principal de T-31.
5. **Resiliência e experiência de release:** validar falhas, retry, timeout,
   respostas parciais, viewports e acessibilidade com T-32, T-33 e T-34;
   fechar medições e gates operacionais com T-35–T-39.

## Matriz de rastreabilidade — requisitos funcionais

| Requisito da spec | Tarefas de implementação | Tarefas de verificação | Cobertura pendente |
|---|---|---|---|
| **RF-01 — Buscar e selecionar uma cidade** | T-02 valida entrada/deduplica cidades; T-08 integra geocodificação; T-10/T-11 implementam busca e escolha explícita; T-14 orquestra busca; T-30 compõe o fluxo. | T-05 valida regras puras; T-09 testa service; T-12/T-13 testam UI; T-15 testa hook; T-31/T-32 testam E2E. | Nenhuma identificada. |
| **RF-02 — Consultar condições atuais** | T-03 mapeia WMO; T-04 formata temperaturas; T-16 integra dados atuais; T-20 apresenta condições; T-26 consulta a cidade selecionada; T-30 compõe a experiência. | T-06 testa WMO; T-07 testa conversão/formatação; T-18 testa service; T-22 testa apresentação; T-28 testa hook; T-31/T-32 testam E2E. | Nenhuma após explicitar em T-20 que a UI não descreve os dados como observação em tempo real. |
| **RF-03 — Consultar previsão diária de cinco dias** | T-03 trata códigos/datas locais; T-04 formata temperaturas; T-17 normaliza os cinco dias e usa a probabilidade do provedor; T-21 apresenta previsão; T-26 orquestra consulta; T-30 compõe. | T-06 testa datas/WMO; T-07 testa temperatura; T-19 testa service; T-23 testa apresentação; T-28 testa hook; T-31/T-32 testam E2E. | Nenhuma após explicitar em T-17 que a probabilidade máxima é exibida sem recálculo. |
| **RF-04 — Alternar unidade de temperatura** | T-04 implementa conversão/formatação; T-24 implementa seletor; T-27 mantém estado da unidade na página; T-30 conecta seletor e dados. | T-07 testa unidade/formatação; T-25 testa componente; T-29 testa estado do hook; T-31 testa alternância E2E. | Nenhuma identificada. |
| **RF-05 — Comunicar estados e recuperar falhas** | T-08/T-16 implementam tratamento de falhas dos services; T-10/T-11/T-20/T-21 apresentam loading, vazio e erro; T-14/T-26 implementam timeout, cancelamento e retry; T-30 integra estados. | T-09/T-18/T-19 testam erros dos services; T-12/T-13/T-22/T-23 testam estados de UI; T-15/T-28 testam timeout e retry nos hooks; T-32 testa recuperação E2E. | Nenhuma identificada. |
| **RF-06 — Tratar respostas parciais** | T-16/T-17 preservam campos válidos e normalizam ausências; T-20/T-21 mostram indisponibilidade sem remover campos/dias; T-26/T-30 preservam estados e associação à cidade. | T-18/T-19 testam payloads parciais; T-22/T-23 testam apresentação; T-28/T-32 testam hook e cenários E2E. | Nenhuma identificada. |

## Etapa 1 — Tipos

### T-01 — Definir os contratos de domínio

- **Status:** Concluída.

- **Descrição:** Declarar os modelos meteorológicos, unidade e estados de busca
  e clima compartilhados.
- **Critérios de aceite:**
  - `City`, `CurrentWeather`, `ForecastDay` e `WeatherSnapshot` têm os campos
    e nulabilidade descritos no plano.
  - `TemperatureUnit` aceita somente `"celsius"` ou `"fahrenheit"`;
    `SearchState` e `WeatherState` discriminam todos os estados definidos no
    plano.
  - `pnpm build` conclui sem erros de tipos após a definição dos contratos.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-01–RF-06; RNF-05, RNF-07.

## Etapa 2 — Funções puras

### T-02 — Validar consultas e normalizar cidades

- **Status:** Concluída.

- **Descrição:** Implementar validação do texto de busca e regras puras de
  deduplicação e identificação de homônimos.
- **Critérios de aceite:**
  - A função de normalização remove espaços externos e conta pontos de código
    Unicode: vazio/espaços resulta inválido, 100 pontos é aceito e 101 é
    rejeitado.
  - A deduplicação elimina somente cidades iguais em nome, região, país e
    coordenadas, mantendo a primeira ocorrência e a ordem original.
  - Resultados com nome e contexto regional indistinguíveis recebem
    coordenadas formatadas com exatamente quatro casas decimais; por exemplo,
    `-23.54756` e `-46.63614` são exibidas como `-23.5476` e `-46.6361`.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weather.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-01; AC-01.1–AC-01.7.

### T-03 — Criar rótulos WMO e regras de datas

- **Status:** Concluída.

- **Descrição:** Implementar funções puras para rótulos de condição e
  tratamento das datas locais da previsão.
- **Critérios de aceite:**
  - Cada código WMO listado em RF-03 retorna exatamente o rótulo da tabela; um
    código não listado retorna indisponível.
  - As cinco datas usam as strings de calendário recebidas do provedor, sem
    conversão de dia ao mudar o fuso do ambiente de teste.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/lib/weather.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-02, RF-03, RF-06; AC-02.6, AC-03.1, AC-03.8,
  AC-03.10.

### T-04 — Converter e formatar temperaturas

- **Status:** Concluída.

- **Descrição:** Implementar conversão de Celsius para Fahrenheit e formatação
  de temperatura para apresentação.
- **Critérios de aceite:**
  - A conversão de °C para °F segue `(°C × 9/5) + 32`; 0 °C resulta em
    32,0 °F e 100 °C em 212,0 °F.
  - A formatação tem uma casa decimal, vírgula e half-up (empate para longe de
    zero), inclusive para valores negativos; `null` resulta em
    “Indisponível”.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weather.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-04; AC-04.2–AC-04.5.

## Etapa 3 — Services

### T-08 — Integrar o serviço de geocodificação

- **Status:** Concluída.

- **Descrição:** Consultar o Open-Meteo Geocoding e mapear respostas para o
  modelo `City`.
- **Critérios de aceite:**
  - Um `fetch` controlado confirma método GET e parâmetros `name` trimado,
    `count=10`, `language=pt` e `format=json`, com acentos codificados e
    decodificados sem alteração do texto.
  - Resposta com resultados é mapeada na ordem do provedor, limitada a dez,
    com coordenadas idênticas à resposta e campos regionais ausentes em `null`;
    duplicatas idênticas aparecem uma vez.
  - `{ "results": [] }` retorna lista vazia; HTTP não-OK, erro da API, JSON
    inválido e falha de rede rejeitam/retornam erro; sinal abortado chega ao
    `fetch`; nenhuma nova chamada é feita automaticamente.
- **Dependências:** T-01, T-02.
- **Entrega nesta etapa:** `searchCities(name)` em
  `src/services/weatherService.ts`, com `encodeURIComponent`, retorno vazio
  sem rede para input trimado vazio e `WeatherServiceError` para falhas.
  Integração de `AbortSignal` permanece pendente para a etapa do hook.
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-01, RF-05; AC-01.2, AC-01.4, AC-01.7–AC-01.8,
  AC-05.2.

### T-16 — Integrar o serviço de previsão

- **Status:** Concluída.

- **Proteção de transporte implementada:** busca e previsão compartilham
  `fetchWithTimeout`, abortando em 10s inclusive durante a leitura do corpo,
  convertendo abort/rede em `WeatherServiceError` e limpando timer no `finally`.
  Testar o limite exato com relógio falso. O prazo de operação de 8s e o
  cancelamento externo continuam pendentes para a integração com o hook.

- **Descrição:** Consultar Forecast API com coordenadas da cidade e normalizar
  condições atuais e metadados da resposta.
- **Critérios de aceite:**
  - `fetch` recebe GET para o endpoint de previsão, coordenadas da cidade sem
    arredondamento, todos os campos atuais do plano, Celsius/mm/kmh,
    `timezone=auto` e o `AbortSignal` fornecido.
  - Campos atuais finitos e dentro do domínio mapeiam para o modelo; campo
    ausente, não finito, umidade fora de 0–100 ou precipitação/vento negativo
    vira `null` sem invalidar os outros.
  - HTTP não-OK, erro declarado pelo provedor, JSON malformado, estrutura
    essencial inválida e erro de rede resultam em falha; não há retry
    automático.
- **Dependências:** T-01, T-03.
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-02, RF-05, RF-06; AC-02.1–AC-02.4, AC-02.9,
  AC-05.2, AC-06.1, AC-06.3–AC-06.5.

### T-17 — Integrar os dados de previsão diária

- **Status:** Concluída.

- **Descrição:** Normalizar os arrays diários da resposta e compor o período
  local de cinco dias.
- **Critérios de aceite:**
  - URL contém os seis campos diários do plano e `forecast_days=5`.
  - O resultado contém cinco itens para datas consecutivas do provedor; arrays
    curtos ou valores ausentes deixam somente o campo correspondente em `null`,
    sem remover dia nem descartar os demais campos válidos.
  - `precipitation_probability_max` é mapeado diretamente para a probabilidade
    do dia, sem recálculo pela aplicação.
  - Probabilidade fora de 0–100, precipitação/vento negativos e valores não
    finitos viram `null`; fuso ausente/inválido não apaga campos independentes
    dele.
- **Dependências:** T-16.
- **Arquivos prováveis:** `src/services/weatherService.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-03, RF-05, RF-06; AC-03.1–AC-03.6, AC-03.9–AC-03.10,
  AC-06.2–AC-06.5.

## Etapa 4 — Hooks e orquestração

### T-14 — Orquestrar a busca no hook

- **Status:** Concluída.

- **Correções de consistência:** união discriminada de estado; validação
  compartilhada entre UI/hook/service; limpar erro anterior ao editar e impedir
  retry de validação; distinguir cancelamento externo/timeout e preservar bugs
  de callback para diagnóstico. Cobrir com testes de regressão.

- **Revisão implementada:** `src/hooks/useWeather.ts` unifica os estados,
  mantém query/cities/data/error e carrega automaticamente a primeira cidade
  após buscar. `selectCity` consulta uma escolha posterior; `retry` repete a
  última busca completa ou seleção. Testar prazo total de 8s, cancelamento,
  respostas fora de ordem e unmount. Unidade agora vive no hook (T-27).

- **Descrição:** Implementar estado e fluxo de busca, com validação,
  cancelamento, timeout, retry manual e descarte de resposta obsoleta.
- **Critérios de aceite:**
  - Busca vazia/espaços mostra “Digite o nome de uma cidade.”; 101 pontos
    Unicode mostra “A busca deve ter até 100 caracteres.”; ambos não chamam o
    serviço.
  - Uma busca válida emite loading e termina em success, empty ou error; empty
    mostra a mensagem de AC-01.8 e não chama serviço meteorológico.
  - Com timer controlado, 8 segundos sem resposta abortam o sinal e produzem
    erro retryable; retry só chama o serviço após callback explícito.
  - Em duas respostas resolvidas fora de ordem, estado final contém somente os
    resultados da busca mais recente.
- **Dependências:** T-02, T-08.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-01, RF-05; AC-01.1–AC-01.3, AC-01.8, AC-01.10,
  AC-05.1–AC-05.4.

### T-26 — Orquestrar a seleção e consulta meteorológica

- **Status:** Concluída.

- **Descrição:** Implementar no hook seleção de cidade, consulta de clima,
  cancelamento, timeout, retry e prevenção de respostas obsoletas.
- **Critérios de aceite:**
  - Selecionar uma cidade chama o serviço uma vez com as coordenadas originais
    e transita para loading associado àquela cidade.
  - Sucesso associa snapshot à cidade selecionada; falha exibe estado error
    retryable para a cidade e nunca reutiliza snapshot anterior como atual.
  - Fake timers confirmam abort e erro timeout em 8 s; retry chama novamente
    somente após ação explícita e usa a mesma cidade.
  - Seleção de outra cidade, nova busca e desmontagem abortam/inutilizam a
    operação anterior; resposta atrasada não substitui estado da cidade ativa.
- **Dependências:** T-14, T-16, T-17.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-01–RF-03, RF-05, RF-06; AC-01.9–AC-01.10,
  AC-02.8, AC-05.1–AC-05.6, AC-06.4–AC-06.5.

### T-27 — Manter a unidade escolhida na página

- **Status:** Concluída — `useWeather` expõe `unit`/`setUnit`, preserva a escolha
  entre operações sem novos requests e reinicia em Celsius no remount.

- **Descrição:** Integrar o estado efêmero de unidade ao hook para aplicação
  uniforme aos dados meteorológicos renderizados.
- **Critérios de aceite:**
  - Hook retorna Celsius na montagem e mantém a escolha após seleção de outra
    cidade; nova montagem retorna Celsius.
  - Alternar unidade antes da resposta faz com que o hook exponha a unidade
    selecionada junto ao snapshot subsequente e não chama serviços adicionais.
  - Temperaturas atuais/mínimas/máximas compartilham unidade; demais campos do
    snapshot não são modificados pela alternância.
- **Dependências:** T-04, T-26.
- **Arquivos prováveis:** `src/hooks/useWeatherApp.ts`
- **Tipo:** Data
- **Rastreabilidade:** RF-04; AC-04.1–AC-04.8.

## Etapa 5 — Componentes de UI

### T-10 — Criar o campo de busca

- **Status:** Concluída.

- **Descrição:** Implementar o componente de entrada e envio explícito da
  busca como UI de apresentação.
- **Critérios de aceite:**
  - Submeter o formulário chama `onSearch` uma vez com o texto digitado;
    alterar o campo sem submeter não chama callback.
  - Props de validação, loading e erro exibem as mensagens/indicadores
    recebidos; o campo tem label acessível e o formulário pode ser submetido
    com Enter.
  - O componente não importa nem chama serviço de dados.
- **Dependências:** T-01, T-14.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-01, RF-05; AC-01.1–AC-01.3, AC-05.1; RNF-02.

### T-11 — Criar a lista de resultados da busca

- **Status:** Concluída — `CityResults` recebe estado e retry por props, com
  testes dedicados de loading/erro/vazio, contexto e seleção por teclado.

- **Descrição:** Implementar apresentação e seleção manual dos resultados de
  geocodificação.
- **Critérios de aceite:**
  - Cada resultado renderiza nome, região/estado e país quando disponíveis;
    coordenadas com quatro casas aparecem somente quando nome/contexto
    regional não distinguem os resultados.
  - Renderizar resultados não aciona `onSelect`; ativar um item com Enter ou
    Espaço aciona `onSelect` uma vez com o objeto e coordenadas originais.
  - Props de estado permitem renderizar loading, erro e vazio; vazio usa a
    mensagem de geocodificação definida em RF-05.
- **Dependências:** T-02, T-14.
- **Arquivos prováveis:** `src/components/CityResults.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-01; AC-01.4–AC-01.7, AC-01.9; RNF-02.

### T-20 — Criar o painel de condições atuais

- **Status:** Concluída.

- **Descrição:** Apresentar localidade e condições meteorológicas atuais por
  props, com unidades e dados indisponíveis.
- **Critérios de aceite:**
  - Para fixture válida, renderiza cidade, condição, temperatura, sensação,
    umidade, precipitação, vento e pressão superficial em hPa com valores/unidades fornecidos; `null`
    renderiza “Indisponível” no campo correspondente.
  - Timestamp é mostrado como hora local somente com fuso válido; sem fuso não
    é anunciado como horário local.
  - A interface identifica o horário de referência fornecido quando
    disponível e não descreve os dados como observação “em tempo real”.
  - Fixture sem campo atual válido renderiza “Dados meteorológicos
    indisponíveis.”; loading e erro são associados ao painel e anunciáveis.
  - O componente só recebe props e não inicia requests.
- **Dependências:** T-01, T-03, T-04, T-26.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`,
  `src/lib/weatherCodes.ts`, `src/lib/temperature.ts`.
- **Complemento de contrato:** adicionar `pressureHpa: number | null` a
  `CurrentWeather` e ao mock; o futuro service mapeia `surface_pressure` e
  rejeita pressão não positiva/não finita. Testar conversão, WMO, métricas e
  campos indisponíveis em `tests/unit/`.
- **Tipo:** UI
- **Rastreabilidade:** RF-02, RF-05, RF-06; AC-02.1–AC-02.4, AC-02.9,
  AC-05.1, AC-06.1, AC-06.3–AC-06.4; RNF-02, RNF-08.

### T-21 — Criar a lista de previsão diária

- **Status:** Concluída — `ForecastList` recebe loading/erro por props, oculta
  dados anteriores e usa o ano corrente no fuso da cidade; testes com relógio fixo.

- **Descrição:** Apresentar os cinco dias locais e seus campos meteorológicos
  por props.
- **Critérios de aceite:**
  - Fixture de previsão renderiza cinco itens na ordem recebida e todos os
    campos diários com suas unidades; todo `null` aparece como
    “Indisponível”, sem remover dia.
  - Sem fuso utilizável, renderiza “Não foi possível determinar as datas
    locais.” e não formata nem rotula datas como locais.
  - Props de estado permitem renderizar loading ou erro de operação sem
    mostrar snapshot anterior como atual.
  - Datas renderizam dia da semana e `dd/MM`; ano é incluído para data fora do
    ano corrente, usando relógio fixo nos testes.
  - Conteúdo tem estrutura e nomes acessíveis e o componente não inicia
    requests.
- **Dependências:** T-01, T-03, T-04, T-26.
- **Arquivos prováveis:** `src/components/ForecastList.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-03, RF-05, RF-06; AC-03.1–AC-03.5, AC-05.1,
  AC-06.2–AC-06.4; RNF-02, RNF-08.

### T-24 — Criar o seletor de unidade

- **Status:** Concluída.

- **Descrição:** Implementar o controle acessível para selecionar Celsius ou
  Fahrenheit.
- **Critérios de aceite:**
  - Estado inicial selecionado é Celsius; acionar Fahrenheit e Celsius
    informa a seleção por callback e expõe o valor selecionado
    programaticamente.
  - Controle pode ser acionado por teclado e tem nome acessível; seus props
    expõem somente seleção de unidade de temperatura (`celsius` ou
    `fahrenheit`).
- **Dependências:** T-01, T-27.
- **Arquivos prováveis:** `src/components/TemperatureUnit.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-04; AC-04.1, AC-04.6–AC-04.7; RNF-02.

## Etapa 6 — Integração da aplicação

### T-30 — Compor a aplicação

- **Status:** Concluída.

- **Integração atual:** substituir modo mock por `useWeather`, renderizar os
  cinco estados, ligar SearchBar a `search`, ErrorState a `retry` e distribuir
  `data`/unidade aos componentes. Unidade agora vem do hook; testes usam
  serviços mockados e APIs interceptadas, sem dependência da rede real.
- **Entrega intermediária de UI:** compor `App.tsx` com o mock e seletor de
  cenários `idle/loading/empty/error/success`, identificados como demonstração.
  Busca São Paulo exibe o mock; demais cidades exibem vazio. Retry repete a
  última busca. Incluir bootstrap React, Tailwind global e testes dos cinco
  estados e da preservação de unidade. A integração definitiva com API/hook
  permanece pendente.
- **Descrição:** Conectar componentes e hook no ponto de entrada da aplicação.
- **Critérios de aceite:**
  - Com interação de usuário, enviar busca chama o fluxo de busca; selecionar
    resultado chama a consulta com aquela cidade; retry e unidade chamam seus
    callbacks correspondentes.
  - Renderizações para loading, empty, error e success exibem o estado/cidade
    associados à operação ativa, sem apresentar dados de outra cidade como
    atuais.
  - Após recarregar a página, busca/cidade não estão restauradas e unidade está
    em Celsius.
- **Dependências:** T-10, T-11, T-14, T-20, T-21, T-24, T-26, T-27.
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI
- **Rastreabilidade:** RF-01–RF-06; AC-01.1–AC-01.10, AC-02.1–AC-02.9,
  AC-03.1–AC-03.10, AC-04.1–AC-04.8, AC-05.1–AC-05.6, AC-06.1–AC-06.5;
  RNF-02, RNF-07.

## Etapa 7 — Testes

### T-05 — Testar validação e normalização de cidades

- **Status:** Concluída.

- **Descrição:** Testar limites da consulta, deduplicação, ordem e distinção
  de homônimos.
- **Critérios de aceite:**
  - Testes unitários verificam: trim de `"  São Paulo  "`, entrada vazia,
    consulta com 100 e 101 pontos Unicode, incluindo caractere suplementar.
  - Testes verificam duplicata por todos os quatro campos, retenção da primeira
    ocorrência/ordem, distinção por região ou coordenadas e coordenadas com
    quatro casas decimais.
- **Dependências:** T-02.
- **Arquivos prováveis:** `tests/unit/city-search-rules.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01; AC-01.1–AC-01.7.

### T-06 — Testar rótulos WMO e datas locais

- **Status:** Concluída.

- **Descrição:** Testar códigos de condição conhecidos/desconhecidos e datas
  de calendário locais.
- **Critérios de aceite:**
  - Há uma asserção para cada par código/rótulo da tabela WMO em RF-03 e para
    pelo menos um código desconhecido.
  - Teste com datas em torno de uma transição de horário de verão confirma
    que as strings `2026-03-07` a `2026-03-11` permanecem cinco datas
    consecutivas de calendário; teste não usa `Date.now()` nem o fuso local do
    runner.
- **Dependências:** T-03.
- **Arquivos prováveis:** `tests/unit/weather-calendar.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-02, RF-03, RF-06; AC-02.6, AC-03.1, AC-03.8,
  AC-03.10.

### T-07 — Testar conversão e formatação de temperaturas

- **Status:** Concluída.

- **Descrição:** Testar unitariamente conversão de unidade e formatação da
  temperatura.
- **Critérios de aceite:**
  - Testes confirmam 0 °C → 32,0 °F, 100 °C → 212,0 °F e ida/volta °C/°F
    conforme as fórmulas de AC-04.2–AC-04.4.
  - Testes confirmam uma casa decimal, vírgula decimal, empate half-up para
    longe de zero (`1,25` → `1,3`; `-1,25` → `-1,3`) e
    `null` → “Indisponível”.
- **Dependências:** T-04.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-04; AC-04.2–AC-04.5.

### T-09 — Testar o serviço de geocodificação

- **Status:** Concluída — testes explícitos de sinal pré-abortado e abort
  durante fetch confirmam rejeição `cancelled`, sem lista vazia nem retry.

- **Descrição:** Testar requisição, mapeamento e falhas do serviço com mock de
  `fetch`.
- **Critérios de aceite:**
  - `fetch` é substituído por mock controlado nos testes; as asserções verificam
    cada parâmetro da URL, texto com acento, coordenadas, campos regionais,
    ordem e máximo de dez resultados.
  - Casos separados confirmam lista vazia sem erro e falhas distintas para
    HTTP não-OK, erro declarado, JSON/estrutura inválida, rejeição de rede e
    `AbortSignal`; nenhuma falha é convertida em lista vazia.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/services/geocodingService.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01, RF-05; AC-01.2, AC-01.4, AC-01.7–AC-01.8,
  AC-05.2.

### T-12 — Testar o campo de busca

- **Status:** Concluída.

- **Descrição:** Testar interação, acessibilidade e estados de apresentação do
  campo.
- **Critérios de aceite:**
  - Testes confirmam que editar não chama `onSearch`, submeter chama uma vez,
    Enter submete e valores de validação/loading/erro são exibidos.
  - Com props correspondentes, validação exibe literalmente “Digite o nome
    de uma cidade.” ou “A busca deve ter até 100 caracteres.”; erro de operação
    exibe “Não foi possível concluir a operação. Tente novamente.”.
  - O campo é encontrado por label/role acessível, sem consulta por seletor
    CSS interno.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-01, RF-05; AC-01.1–AC-01.3, AC-05.1; RNF-02.

### T-13 — Testar a lista de resultados

- **Status:** Concluída — testes dedicados de contexto, coordenadas apenas
  para homônimos indistinguíveis, Enter/Espaço e estados por props.

- **Descrição:** Testar apresentação, distinção e seleção manual das cidades.
- **Critérios de aceite:**
  - Testes comparam texto de nome/região/país; dois homônimos indistinguíveis
    exibem coordenadas com quatro casas e resultados distinguíveis não as
    exibem desnecessariamente.
  - Nenhum callback ocorre ao renderizar; Enter e Espaço selecionam o item
    correto uma única vez.
  - Com props de estado, loading expõe indicador/status acessível, erro mostra
    a mensagem de operação e resultado vazio mostra literalmente “Nenhuma
    cidade encontrada. Verifique a busca e tente novamente.”.
- **Dependências:** T-11.
- **Arquivos prováveis:** `tests/components/CityResults.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-01; AC-01.4–AC-01.7, AC-01.9; RNF-02.

### T-15 — Testar o fluxo de busca no hook

- **Status:** Concluída.

- **Descrição:** Testar estados, validação, retry, timeout e concorrência da
  busca.
- **Critérios de aceite:**
  - Testes afirmam os estados inicial, loading, success, empty e error e as
    mensagens exatas: “Digite o nome de uma cidade.”, “A busca deve ter até
    100 caracteres.”, “Nenhuma cidade encontrada. Verifique a busca e tente
    novamente.” e “Não foi possível concluir a operação. Tente novamente.”.
  - Fake timers demonstram abort em 8 s, nenhuma repetição automática e uma
    nova chamada após retry explícito.
  - Promises controladas resolvidas em ordem inversa deixam visíveis somente
    os resultados da última busca.
- **Dependências:** T-14.
- **Arquivos prováveis:** `tests/hooks/useWeatherSearch.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01, RF-05; AC-01.1–AC-01.3, AC-01.8, AC-01.10,
  AC-05.1–AC-05.4.

### T-18 — Testar o mapeamento das condições atuais

- **Status:** Concluída.

- **Descrição:** Testar parâmetros e normalização dos campos meteorológicos
  atuais do serviço.
- **Critérios de aceite:**
  - Testes de `fetch` controlado afirmam URL, coordenadas, campos atuais,
    timezone e unidades requeridos, além do mapeamento de cada propriedade do
    objeto `current`.
  - Fixtures cobrem campo válido, ausente, não numérico/não finito, umidade
    fora de faixa e precipitação/vento negativos; somente o campo inválido
    resulta em `null`.
  - Testes separados confirmam falha em HTTP não-OK, erro da API, JSON/contrato
    inválido e rede, e verificam o mesmo `AbortSignal` no `fetch`.
  - Cada teste substitui `fetch` por mock e confirma exatamente uma chamada
    por execução, sem tráfego de rede real ou retry automático.
- **Dependências:** T-16.
- **Arquivos prováveis:** `tests/services/weatherCurrentService.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-02, RF-05, RF-06; AC-02.1–AC-02.4, AC-02.9,
  AC-05.2, AC-06.1, AC-06.3–AC-06.5.

### T-19 — Testar o mapeamento da previsão diária

- **Status:** Concluída.

- **Descrição:** Testar arrays diários, período de cinco dias, datas e
  indisponibilidade por campo.
- **Critérios de aceite:**
  - Testes afirmam coordenadas, seis parâmetros diários, `forecast_days=5`,
    `timezone=auto` e mapeamento de cada array para `ForecastDay`.
  - Fixtures com cinco datas, array curto e campo ausente/não finito mantêm
    cinco itens e marcam somente os campos indisponíveis como `null`.
  - Probabilidade menor que 0 ou maior que 100, precipitação/vento negativos e
    fuso ausente/inválido seguem as regras do plano; JSON/estrutura essencial
    incompatível falha em vez de virar resposta parcial.
  - Cada teste substitui `fetch` por mock e confirma exatamente uma chamada
    por execução, sem tráfego de rede real ou retry automático.
- **Dependências:** T-17.
- **Arquivos prováveis:** `tests/services/weatherForecastService.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-03, RF-05, RF-06; AC-03.1–AC-03.6, AC-03.9–AC-03.10,
  AC-05.2, AC-06.2–AC-06.5.

### T-22 — Testar o painel de condições atuais

- **Status:** Concluída.

- **Descrição:** Testar apresentação, campos ausentes, horário e mensagens
  das condições atuais.
- **Critérios de aceite:**
  - Testes de renderização confirmam texto/unidade de cada campo atual, rótulo
    WMO, `Indisponível` individual e identificação da cidade.
  - Fixture com 12 °C renderiza exatamente “12,0 °C”; temperatura, sensação,
    precipitação e vento usam uma casa decimal com vírgula; umidade usa
    percentual inteiro. Hora válida usa relógio de 24 horas no fuso da cidade;
    fuso inválido não é rotulado como local.
  - Fixture sem nenhum campo atual válido mostra a mensagem exata da spec;
    loading mostra status associado ao painel e erro mostra a mensagem de
    operação; ambos têm role/anúncio acessível.
- **Dependências:** T-20.
- **Arquivos prováveis:** `tests/components/WeatherPanel.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-02, RF-05, RF-06; AC-02.1–AC-02.4, AC-02.9,
  AC-05.1, AC-06.1, AC-06.3–AC-06.4; RNF-02, RNF-08.

### T-23 — Testar a lista de previsão diária

- **Status:** Concluída.

- **Descrição:** Testar apresentação dos cinco dias, campos parciais e fuso
  na previsão.
- **Critérios de aceite:**
  - Fixture com cinco datas produz cinco itens na mesma ordem, incluindo
    texto da data local sem deslocamento de fuso; dias/campos nulos continuam
    visíveis como “Indisponível”.
  - Fuso ausente/inválido mostra a mensagem exata da spec e não exibe data
    como local; conteúdo e status têm nomes/roles acessíveis.
  - Datas renderizam dia da semana e `dd/MM`; o ano aparece fora do ano
    corrente, com relógio fixo nos testes.
  - Testes afirmam temperaturas de 12 °C como “12,0 °C”, precipitação/vento
    com uma casa decimal e probabilidade como percentual inteiro.
  - Props loading e error exibem, respectivamente, status de carregamento e
    mensagem de falha acessíveis, sem exibir dados de uma resposta anterior.
- **Dependências:** T-21.
- **Arquivos prováveis:** `tests/components/ForecastList.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-03, RF-05, RF-06; AC-03.1–AC-03.5, AC-05.1,
  AC-06.2–AC-06.4; RNF-02, RNF-08.

### T-25 — Testar o seletor de unidade

- **Status:** Concluída.

- **Descrição:** Testar estados e operação acessível do controle de unidade.
- **Critérios de aceite:**
  - Testes encontram o controle por role e nome acessível e confirmam °C
    selecionado inicialmente.
  - Seleção por teclado de °F e retorno a °C atualizam o estado selecionado e
    disparam o callback com os valores esperados.
- **Dependências:** T-24.
- **Arquivos prováveis:** `tests/components/TemperatureUnit.test.tsx`
- **Tipo:** Test
- **Rastreabilidade:** RF-04; AC-04.1, AC-04.6–AC-04.7; RNF-02.

### T-28 — Testar o fluxo meteorológico no hook

- **Status:** Concluída.

- **Descrição:** Testar seleção, estados, retry, timeout, cancelamento e
  concorrência da consulta de clima.
- **Critérios de aceite:**
  - Testes afirmam cidade/coordenadas usadas, estados loading/success/error,
    resposta parcial preservada e retry manual para cidade do erro.
  - Fake timers confirmam cancelamento/error após 8 s; selecionar outra cidade
    ou iniciar busca aborta a operação ativa.
  - Promises controladas resolvidas em ordem inversa e desmontagem confirmam
    que nenhuma resposta obsoleta altera o estado.
- **Dependências:** T-26.
- **Arquivos prováveis:** `tests/hooks/useWeatherForecast.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01–RF-03, RF-05, RF-06; AC-01.9–AC-01.10,
  AC-02.8, AC-05.1–AC-05.6, AC-06.4–AC-06.5.

### T-29 — Testar a unidade no hook

- **Status:** Concluída — teste do hook cobre montagem, snapshot pendente,
  alternância sem requests, troca de cidade e remount; reload real no E2E.

- **Descrição:** Testar persistência da unidade somente durante a vida da
  página e sua independência das consultas.
- **Critérios de aceite:**
  - Asserções confirmam Celsius inicial, unidade selecionada aplicada a dados
    já carregados e a snapshot resolvido depois da seleção da unidade.
  - Contador de chamadas dos serviços não muda ao alternar; selecionar outra
    cidade preserva a unidade; desmontar/remontar restaura Celsius.
- **Dependências:** T-27.
- **Arquivos prováveis:** `tests/hooks/useWeatherUnit.test.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-04; AC-04.1–AC-04.8.

### T-31 — Testar o percurso principal ponta a ponta

- **Status:** Concluída — busca, seleção explícita posterior, coordenadas,
  campos atuais/diários, conversão e invariância não térmica cobertos em
  320/1280 px, sem requests públicos e sem overflow horizontal.

- **Descrição:** Validar o fluxo integrado principal com APIs interceptadas
  em desktop e viewport mobile.
- **Critérios de aceite:**
  - Playwright submete uma consulta interceptada, seleciona um resultado e
    confirma a chamada de forecast com as coordenadas exatas do resultado.
  - A tela final contém os seis campos atuais da fixture, cinco datas/itens e
    valores diários, incluindo unidades; fixture com 12 °C aparece como
    “12,0 °C” inicialmente e como “53,6 °F” após alternar. Temperatura diária
    de 0 °C aparece como “32,0 °F”; valores não térmicos permanecem idênticos.
  - Toda chamada externa do cenário é interceptada; a execução não acessa a
    rede pública.
  - O percurso completo passa em viewport desktop de 1280 px e mobile de
    320 px; em ambos, `scrollWidth` não excede `clientWidth` e busca,
    seleção, dados essenciais e alternância de unidade podem ser operados.
- **Dependências:** T-30, T-09, T-12, T-13, T-15, T-18, T-19, T-22, T-23, T-25, T-28, T-29.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`,
  `tests/e2e/fixtures.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01–RF-04; AC-01.2, AC-01.4–AC-01.7, AC-01.9,
  AC-02.1–AC-02.2, AC-03.1–AC-03.2, AC-03.6–AC-03.7, AC-04.1–AC-04.6.

### T-32 — Testar falhas e casos parciais ponta a ponta

- **Status:** Concluída — timeout/cancelamento em 8 s, ausência de repetição
  automática, retry, falhas HTTP/API/rede, campos parciais e seleção fora de
  ordem têm E2E determinísticos com APIs interceptadas.

- **Descrição:** Validar estados de erro, recuperação e respostas parciais em
  fluxos integrados.
- **Critérios de aceite:**
  - Cenários separados afirmam mensagem e ausência de request para busca
    inválida; mensagem empty e ausência de forecast para busca sem resultados;
    seleção explícita para homônimos.
  - Cenários de geocoding e forecast em erro afirmam mensagem de falha, ação de
    retry e sucesso após retry explícito; timers controlados afirmam timeout e
    cancelamento em 8 s.
  - Fixtures parciais mantêm cada campo/dia válido e marcam os ausentes como
    “Indisponível”; resolução inversa de duas operações deixa visível somente
    a resposta da operação mais recente.
  - Asserções comparam literalmente “Não foi possível concluir a operação.
    Tente novamente.” para erro/timeout e confirmam que falhas de API/rede não
    exibem “Nenhuma cidade encontrada. Verifique a busca e tente novamente.”.
  - Todas as chamadas a APIs são interceptadas.
- **Dependências:** T-31.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`,
  `tests/e2e/fixtures.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01, RF-05, RF-06; AC-01.1–AC-01.10, AC-05.1–AC-05.6,
  AC-06.1–AC-06.5.

### T-33 — Validar responsividade ponta a ponta

- **Status:** Concluída — matriz de viewports/estados em testes independentes,
  incluindo 320/768/1280 px e retrato/paisagem emulados. A execução completa
  passou após corrigir a estrutura agregada do teste e validar requests.

- **Descrição:** Verificar disponibilidade dos controles e ausência de
  rolagem horizontal nos viewports especificados.
- **Critérios de aceite:**
  - Executar o percurso principal em larguras de 320, 768 e 1280 CSS px.
  - Em cada largura, `document.documentElement.scrollWidth` não excede
    `clientWidth`; campo de busca, botão de envio, seleção, dados essenciais e
    alternância de unidade permanecem visíveis/acessíveis.
  - Configurar e executar retrato e paisagem nos viewports móveis quando o
    runner suportar orientação; reportar explicitamente qualquer orientação
    não suportada.
- **Dependências:** T-31.
- **Arquivos prováveis:** `tests/e2e/responsive.spec.ts`,
  `playwright.config.ts`
- **Tipo:** Test
- **Rastreabilidade:** RF-01–RF-06; RNF-01.

### T-34 — Automatizar verificações de acessibilidade

- **Status:** Parcial — axe adicionado para cinco estados e testes de teclado
  ampliados; revisão humana por teclado/leitor de tela e inspeção complementar
  de contraste não executadas. Gates e responsáveis requeridos no registro.

- **Descrição:** Adicionar verificação automatizada de acessibilidade para os
  fluxos e estados principais.
- **Critérios de aceite:**
  - Automação de acessibilidade roda sobre a tela principal e pelo menos os
    estados loading, empty, error e success; axe reporta zero violações WCAG
    2.2 AA nos estados testados.
  - Testes de teclado percorrem busca, resultados, retry e unidade; cada
    controle recebe foco visível e acionamento sem mouse.
  - Testes verificam nomes acessíveis, anúncio programático dos estados e
    contraste AA de texto (4,5:1; texto grande 3:1) e componentes (3:1);
    revisão manual por teclado e leitor de tela registra resultado para
    loading, vazio, indisponibilidade, erro e operação dos controles; falhas
    não resolvidas impedem concluir a tarefa.
- **Dependências:** T-30, T-31, T-32.
- **Arquivos prováveis:** `tests/e2e/accessibility.spec.ts`,
  `playwright.config.ts`
- **Tipo:** Test
- **Rastreabilidade:** RNF-02; AC-01.1–AC-01.9, AC-04.1–AC-04.8,
  AC-05.1–AC-05.6, AC-06.1–AC-06.5.

## Etapa 8 — Hardening e preparação para release

### T-35 — Medir desempenho das operações

- **Status:** Concluída — 100 buscas e 100 seleções com cache desabilitado,
  HTTPS local/API 1 s e rede CDP 100 ms/10 Mbps. P95: busca 1.463,9 ms e
  seleção 1.438,6 ms antes da atualização de atribuição; reexecução final em
  28/10: 1.347,3 ms e 1.330,4 ms (ambos ≤ 5 s). Timeout de 8 s validado separadamente.
  Protocolo, comando e evidência no registro de validação.

- **Descrição:** Preparar medição controlada do p95 de busca e consulta
  meteorológica.
- **Critérios de aceite:**
  - Executar 100 buscas e, separadamente, 100 consultas meteorológicas
    bem-sucedidas com cache desabilitado, RTT de 100 ms, banda de 10 Mbps e
    API mock/controlada com latência de resposta de 1 s.
  - Medir cada execução do envio/seleção até conteúdo final renderizado;
    calcular p95 de cada operação e afirmar p95 ≤ 5 s.
  - Reportar os resultados por operação e medir/validar timeout máximo de 8 s
    separadamente; teste falha se qualquer p95 exceder o limite.
- **Dependências:** T-30, T-31.
- **Arquivos prováveis:** `tests/performance/weather-app.perf.ts`
- **Tipo:** Infra
- **Rastreabilidade:** RNF-03.

### T-36 — Registrar compatibilidade de navegadores

- **Status:** Parcial — versões reais dos engines Chromium/Firefox/WebKit e
  OS registradas; matriz das duas versões estáveis de cada navegador e
  dispositivos reais continua pendente. Emulação não foi declarada como Safari iOS.

- **Descrição:** Documentar os ambientes de navegador verificados em cada
  release.
- **Critérios de aceite:**
  - Registro do release contém nome e versão exata do navegador/OS, data da
    validação e resultado dos fluxos principais.
  - Cobertura inclui as duas versões estáveis mais recentes de Chrome, Edge,
    Firefox e Safari, Safari iOS e Chrome Android, conforme disponibilidade
    na janela de validação; qualquer ambiente não executado é identificado
    como pendente, não como aprovado.
- **Dependências:** T-31, T-33.
- **Arquivos prováveis:** documentação/checklist de release existente
- **Tipo:** Infra
- **Rastreabilidade:** RNF-04.

### T-37 — Confirmar termos e atribuição do provedor

- **Status:** Parcial — URLs consultadas em 28/10/2026, licença/limites
  registrados e atribuição ampliada. Aprovação de enquadramento, volume,
  obrigações da distribuição e nomeação de responsáveis ainda pendentes.

- **Descrição:** Registrar a verificação de atribuição, licença, termos e
  limites de uso do Open-Meteo como gate de lançamento.
- **Critérios de aceite:**
  - Checklist de release registra URL/data da consulta, atribuição exigida,
    licença, termos e limites de uso aplicáveis ao Open-Meteo.
  - Cada item tem status verificado/pendente e responsável; release não é
    marcado como pronto enquanto qualquer requisito obrigatório estiver
    pendente.
- **Dependências:** T-30.
- **Arquivos prováveis:** documentação/checklist de release existente
- **Tipo:** Infra
- **Rastreabilidade:** RNF-06; riscos de dependência do provedor em
  `plans/weather-app-plan.md`.

### T-38 — Documentar a comunicação com o provedor

- **Status:** Parcial — política versionada e servida junto ao build, com link
  no footer e junto à localidade/condições, com teste de navegação. Sem
  deploy/URL pública ou aprovação de privacidade/hospedagem nesta sessão;
  publicação permanece gate de release.

- **Descrição:** Atualizar a política de privacidade para descrever a
  comunicação necessária com o Open-Meteo.
- **Critérios de aceite:**
  - Política publicada identifica Open-Meteo como provedor consultado e
    informa que a conexão pode revelar metadados de rede, incluindo endereço
    IP, em conformidade com os termos aplicáveis.
  - Checklist de release aponta para a versão publicada da política.
- **Dependências:** T-30.
- **Arquivos prováveis:** política de privacidade existente,
  documentação/checklist de release existente
- **Tipo:** Infra
- **Rastreabilidade:** RNF-07.

### T-39 — Evitar coleta e persistência não previstas

- **Status:** Concluída — inspeção de requests e E2E verificam parâmetros
  permitidos, ausência de geolocalização/storage/cookies e reset por reload.
  Fontes Inter agora são locais, sem conexão automática ao Google.

- **Descrição:** Verificar no estado/composição da aplicação que a consulta
  usa apenas os dados necessários e não persiste informações entre sessões.
- **Critérios de aceite:**
  - Inspeção das permissões e dos requests confirma que a aplicação não solicita
    geolocalização e envia ao provedor somente consulta/cidade ou coordenadas
    necessárias, sem identificadores ou analytics adicionais.
  - Teste de recarga confirma que cidade, histórico e unidade não são
    restaurados; unidade retorna a Celsius.
- **Dependências:** T-30.
- **Arquivos prováveis:** `src/App.tsx`, `src/hooks/useWeatherApp.ts`
- **Tipo:** Infra
- **Rastreabilidade:** RNF-07; AC-04.7 (reinicialização da unidade).

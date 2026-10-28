<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

### Executando a aplicação

Execute `pnpm dev` para abrir a aplicação composta em [`App.tsx`](src/App.tsx).
Ela usa [`useWeather`](src/hooks/useWeather.ts), inicia em `idle`, com Celsius
selecionado, sem requisição inicial. Enviar uma cidade consulta Open-Meteo e
carrega o clima do primeiro resultado. A UI apresenta carregamento, vazio,
erro com a mensagem do hook e botão de retry, ou condições atuais e previsão.
Busca fica desabilitada durante a operação; unidade continua disponível e
persiste entre buscas e retries, sem chamadas extras. Recarregar reinicia em °C.
Não há mais seletor de cenários nem dados mock em runtime; fixtures ficam
disponíveis para desenvolvimento e testes. O botão de retry chama a ação do
hook e devolve foco ao conteúdo.

### Serviço de busca de cidades

[`searchCities(name)`](src/services/weatherService.ts) consulta o geocoding
Open-Meteo com nome trimado/codificado (`encodeURIComponent`), limite de dez
resultados e idioma português. Retorna `City[]`, com IDs string, coordenadas
preservadas, contexto regional ausente em `null` e duplicatas removidas.
Input vazio retorna `[]` sem rede; acima de 100 pontos Unicode lança erro.
Resultados ausentes/vazios retornam `[]`. HTTP não-OK, erro da API, JSON/contrato
inválido ou falha de rede lançam `WeatherServiceError` (status HTTP quando
disponível e causa original quando aplicável), sem retry automático.
O App usa este serviço por meio do hook.

[`getWeather(city)`](src/services/weatherService.ts) consulta o Forecast API
com condições atuais, pressão superficial e previsão de cinco dias. Mantém
Celsius/mm/kmh e as coordenadas exatas da cidade; não refaz requests.
Ausência de `current`/`daily` lança `WeatherServiceError`. Campos individuais
inválidos viram `null`. Os arrays diários são associados por índice à data do
provedor e normalizados em cinco datas consecutivas, preservando dias sem dados.
Uma data válida de `daily.time` ancora o período; com array vazio, usa a data
local de `current.time`. Sem nenhuma âncora ou sem array `daily.time`, lança
erro de contrato em vez de inventar datas. Fuso ausente/inválido vira `null`.
O serviço é independente da apresentação e aceita `AbortSignal` opcional.

As duas consultas usam `fetchWithTimeout`, com `AbortController` e limite de
10 segundos para transporte **e leitura do JSON**. O callback de leitura mantém
o timer ativo até o corpo ser consumido. Aborto por timer vira `WeatherServiceError`
com “A requisição demorou demais.”; cancelamento externo tem motivo `cancelled`
e mensagem própria. Falha de rede vira “Falha de rede.”.
O timer é sempre limpo no `finally`; erros HTTP e JSON preservam sua distinção.
Esse limite de transporte não substitui os 8 segundos por operação previstos
no hook, já conectado ao App.

### Hook meteorológico

A validação é compartilhada em [`validateSearch`](src/lib/search.ts).
O formulário bloqueia vazio e mais de 100 pontos Unicode com erro associado ao
campo, sem disparar busca. Ao editar, `clearError` remove o erro de operação
anterior e invalida seu retry, evitando alertas simultâneos e buscas antigas.
O hook usa estados discriminados e expõe `canRetry` somente para erro de operação.
`WeatherServiceError.reason` distingue `api`, `network`, `timeout`, `cancelled`
e `validation`. Cancelamento externo informa “A requisição foi cancelada.”,
enquanto o timer informa timeout. Erros inesperados do callback de leitura são
propagados para diagnóstico, não convertidos em falhas de rede.

[`useWeather`](src/hooks/useWeather.ts) expõe `status`, `data` (`WeatherData | null`),
`cities`, `error` (`string | null`), `query`, `search(name)`, `selectCity(city)` e
`retry()`. `search` aplica trim, valida 1–100 pontos Unicode, busca cidades e
consulta o clima da primeira automaticamente. Lista vazia termina em `empty`,
sem forecast. A lista é preservada para seleção posterior. `retry` repete a
última ação explícita (busca completa ou seleção); antes de qualquer ação não
faz nada. Os métodos retornam promises e expõem as falhas no estado `error`.

Cada operação tem prazo total de 8s, cancela a anterior e descarta respostas
atrasadas, inclusive após unmount. Os serviços agora aceitam `AbortSignal`
opcional; seu limite interno de 10s continua ativo. O hook mantém `unit` e
`setUnit` apenas em memória, reinicia em Celsius a cada montagem e expõe
`selectedCity` também durante loading/erro. Não acessa storage. O App distribui
unidade e dados aos componentes.

### Validação de release

Os resultados e gates ainda abertos estão no
[registro de validação](plans/weather-app-release-validation.md). A política de
privacidade versionada está em [public/privacy.html](public/privacy.html), servida
como `privacy.html` junto ao app; publicação externa e aprovação operacional
continuam sendo gates de release.
Inter é servida localmente; sua licença OFL também é incluída no build e
acessível no footer, sem requisição automática ao Google Fonts.

```bash
pnpm test --maxWorkers=1
pnpm test:e2e --workers=1
pnpm build
pnpm exec playwright test --config playwright.performance.config.ts --workers=1
```

O último comando requer Chromium e `openssl`. Mede 100 buscas e 100 seleções
contra um servidor HTTPS local com latência de 1 s, cache desabilitado e rede
Chromium limitada a RTT de 100 ms / 10 Mbps. Não consulta o provedor público.
Anexa amostras e p95 em JSON ao resultado Playwright. Firefox/WebKit do runner
não substituem Chrome/Edge/Safari estáveis nem dispositivos reais.

### Campo de busca

[`SearchBar`](src/components/SearchBar.tsx) recebe `onSearch(city: string)` e
`disabled` (opcional, `false` por padrão). O formulário tem região de busca e
label acessíveis; botão e Enter enviam o texto sem espaços nas extremidades.
Entradas vazias não chamam o callback e exibem “Digite o nome de uma cidade.”.
Quando desabilitado, o componente bloqueia edição e envio. Não acessa a API.

### Seletor de temperatura

[`UnitToggle`](src/components/UnitToggle.tsx) recebe `unit: Unit` e
`onChange(unit: Unit)`. O componente é controlado: o pai mantém a unidade e deve
iniciá-la em `'celsius'`. Os botões °C/°F expõem a seleção via `aria-pressed`,
agrupados com o nome acessível “Unidade de temperatura”. Use Tab/Shift+Tab para
navegar e Enter/Espaço para selecionar. O controle apenas comunica a seleção;
não converte dados nem faz requisições.

### Condições atuais

[`CurrentWeather`](src/components/CurrentWeather.tsx) recebe `city`, `current`
e `unit`. Exibe temperatura, sensação térmica, condição WMO e métricas com
formatação pt-BR; valores ausentes/inválidos são “Indisponível”.
[`weatherCodes`](src/lib/weatherCodes.ts) fornece rótulos e ícones decorativos;
[`temperature`](src/lib/temperature.ts) converte e formata as temperaturas
somente para apresentação. O modelo inclui pressão superficial em `pressureHpa`
(hPa, positiva e finita), a ser mapeada de `surface_pressure` na integração.
Sem prop de fuso, o componente não anuncia um horário como local.

### Previsão diária

[`ForecastList`](src/components/ForecastList.tsx) recebe `forecast: ForecastDay[]`,
`unit: Unit` e `timezone: string | null`. Preserva os dias e a ordem recebidos,
em grid de 2/3/5 colunas. Fuso ausente/inválido e lista vazia têm mensagens
explícitas. Cada [`ForecastCard`](src/components/ForecastCard.tsx) recebe `day`
e `unit`, exibindo data, condição, máxima, mínima e probabilidade de chuva.
[`formatDayLabel`](src/lib/format.ts) formata a data de calendário em pt-BR,
sem deslocamento pelo fuso do dispositivo; inclui o ano quando diferente do
ano UTC corrente. Campos indisponíveis não removem o card.

### Estados de apresentação

Os componentes em [`src/components/states/`](src/components/states/) não
acessam a API:

- [`LoadingState`](src/components/states/LoadingState.tsx): `role="status"`,
  mensagem opcional (`message`) e spinner decorativo que respeita movimento
  reduzido.
- [`ErrorState`](src/components/states/ErrorState.tsx): mensagem opcional
  (`message`) anunciada como alerta e botão “Tentar novamente” que chama
  `onRetry`, obrigatório. Não repete operações automaticamente.
- [`EmptyState`](src/components/states/EmptyState.tsx): título (`title`) e dica
  (`hint`) opcionais, anunciados como status. Por padrão, comunica uma busca
  sem resultados; personalize ambos para a tela inicial.

### Revisão de acessibilidade e responsividade da UI

Correções aplicadas: quebra de palavras longas nos cards e no hero, bordas
dos campos com contraste mínimo de 3:1, seletor com altura mínima de 44px,
foco devolvido ao conteúdo após retry e anúncio discreto do sucesso via
`aria-live="polite"`. Labels, agrupamento de unidade com `aria-pressed`,
ícones decorativos, alertas, skip link e foco visível foram preservados.

[`accessibility.spec.ts`](tests/e2e/accessibility.spec.ts) verifica no Chromium:
ausência de overflow de página e conteúdo de 320px a 1440px nos cinco estados,
incluindo viewport paisagem 844×390; operação por teclado e foco após retry;
contraste de texto dos controles opacos (≥4,5:1) e bordas dos campos (≥3:1).
Execute `pnpm exec playwright test tests/e2e/accessibility.spec.ts --project=chromium --workers=1`.
Esses testes não substituem auditoria WCAG completa: ainda é recomendada
validação manual com leitor de tela, alto contraste e Safari/Firefox.

### Dados mock para desenvolver a UI

Os contratos estão em [`src/types/weather.ts`](src/types/weather.ts).
`Unit` e `WeatherData` também são exportados como `TemperatureUnit` e
`WeatherSnapshot`, respectivamente, para compatibilidade com o plano.
Temperaturas ficam em Celsius; campos indisponíveis são representados por `null`.

Use o mock tipado de [`src/mocks/weather.ts`](src/mocks/weather.ts) sem chamadas
à API:

```ts
import { MOCK_WEATHER } from './mocks/weather';
import type { Unit, WeatherData } from './types/weather';

const weather: WeatherData = MOCK_WEATHER;
const unit: Unit = 'celsius';
```

O exemplo considera um módulo diretamente em `src/`. Os dados são fictícios e
fixos: São Paulo, fuso `America/Sao_Paulo`, condições atuais de 27/10/2026 e
previsão dessa data até 31/10/2026. Não representam uma consulta real nem
acompanham a data do dispositivo.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>

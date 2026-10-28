# Validação de release — Weather App

Janela iniciada em **27/10/2026**. **Release não aprovado**: há gates humanos,
de publicação e de compatibilidade ainda abertos. Este registro não substitui
aprovação de produto, operação ou jurídico.

Sessão: `2aae5b82-0be7-4bd4-be53-b6e8c4431784`
(`agent-host-session://ahp-session/2aae5b82-0be7-4bd4-be53-b6e8c4431784`).

## Evidência automatizada

Ambiente: Debian GNU/Linux 13.7 (trixie), kernel Linux 6.8.0-1064-azure,
Node 22.23.3, pnpm 11.8.0, Playwright 1.61.0. Sem chamadas às APIs públicas
nos testes. O build inclui fontes Inter locais; não há conexão automática ao
Google Fonts.

| Comando | Resultado |
|---|---|
| `pnpm lint` | Passou: 40 arquivos, zero erros. |
| `pnpm build` | Passou: TypeScript e Vite; inclui fontes locais e `privacy.html`. |
| `pnpm test` | Passou na execução final: 241 testes, 15 arquivos. |
| `pnpm test:e2e tests/e2e/weather.spec.ts tests/e2e/accessibility.spec.ts --workers=1 --grep 'timeout\|recente\|reload\|conversão completas\|axe'` | Execução inicial: 18 passaram, 4 falharam no novo teste de timeout porque o relógio ainda avançava em tempo real. Corrigido pausando-o antes do envio. |
| `pnpm test:e2e tests/e2e/weather.spec.ts --project=chromium --project=mobile --workers=1 --grep 'timeout'` | Passou: 4 testes; loading em 7.999 ms, abort/erro em 8.000 ms e retry somente explícito. |
| `pnpm test:e2e tests/e2e/weather.spec.ts --project=firefox --project=webkit --workers=1 --grep 'conversão completas'` | Passou: 4 testes, fluxos em 320 e 1280 px. |
| `pnpm test:e2e tests/e2e/accessibility.spec.ts --workers=1 --grep 'axe'` | Passou: 10 testes, zero violações nos cinco estados em desktop/mobile, após corrigir o alvo de toque do link da licença Inter. |
| `pnpm test:e2e --workers=1` | Passou na execução final: 175 testes, 1 ignorado (teclado físico no mobile), 4,3 min; Chromium, mobile emulado, Firefox e WebKit. |
| `pnpm test:e2e tests/e2e/accessibility.spec.ts tests/e2e/weather.spec.ts --workers=1 --grep 'axe\|busca, seleção e conversão completas\|reload não restaura'` | Passou após aproximar as atribuições da localidade/dados e detalhar a retenção de logs: 22 testes em Chromium, mobile emulado, Firefox e WebKit. |
| `pnpm exec playwright test --config playwright.performance.config.ts --workers=1` | Passou: 1 teste, 200 operações medidas, 6,0 min após inclusão de atribuição junto aos dados. P95 busca 1.347,3 ms; seleção 1.330,4 ms. |

### Diagnóstico e regressões corrigidas

- O teste responsivo antigo fazia 35 cenários e múltiplas navegações dentro de
  um único timeout de 60 s. A reprodução isolada mobile passou em 35,9 s
  (41,1 s incluindo setup), portanto não foi possível provar a causa histórica
  apenas pelo sintoma `page/context closed`. Os cenários agora são testes
  independentes por viewport/estado, sem aumentar o timeout nem repetir falhas.
- Durante a implementação houve execuções completas interrompidas, **não
  usadas como aprovação**. A nova inspeção de requests detectou Google Fonts
  no HTML inicial (fora dos services). A fonte foi movida para o próprio
  build, preservando Inter sem transmitir IP ao Google no carregamento.
- O lint detectou imports CSS após `@tailwind`; a ordem foi corrigida antes
  da validação final. A primeira tentativa da medição também identificou as
  fontes externas; outra tentativa encontrou um preview residual próprio,
  encerrado pelo PID específico antes de reiniciar.
- Ao incluir a licença OFL distribuída com Inter, axe detectou que o novo link
  tinha alvo de toque de 17 px e distância insuficiente do link anterior.
  Corrigido para altura mínima de 44 px e foco explícito; os 10 testes axe
  passaram novamente. Nenhuma regra foi desabilitada.
- O ano dos cartões usava o primeiro ano recebido em vez do ano corrente da
  cidade. A referência agora usa o fuso validado e um relógio fixo nos testes.
- Unidade está no hook, com teste de montagem, alteração durante loading,
  preservação entre cidades e reset em remount. Teste E2E cobre reload real,
  storage/cookies vazios, ausência de geolocalização e parâmetros permitidos.
- AbortSignal pré-abortado e cancelamento em andamento têm testes explícitos.
  O service compõe um sinal interno para seu teto de transporte de 10 s:
  preserva o cancelamento externo, não a identidade do objeto de sinal.

## T-34 — Acessibilidade

Axe (`@axe-core/playwright` 4.11.0) verifica WCAG 2 A/AA, 2.1 A/AA e 2.2 AA
em idle, loading, empty, error e success. Há testes de teclado para busca,
seleção de resultado, unidade, skip link e retry, além de foco e contraste.
O teste de teclado físico é explicitamente ignorado no projeto mobile.
Ausência de violações automatizadas **não comprova conformidade WCAG completa**.

| Gate manual | Resultado | Responsável requerido |
|---|---|---|
| Teclado: ordem/foco visível em todos os controles e estados | Pendente de revisão humana | QA/acessibilidade, pessoa a designar |
| Leitor de tela: loading, vazio, indisponibilidade, erro e controles | Não executado neste ambiente | QA/acessibilidade, pessoa a designar |
| Contraste e componentes fora da cobertura automatizada | Pendente de inspeção manual | QA/acessibilidade, pessoa a designar |

T-34 permanece **Parcial**.

## T-35 — Protocolo de desempenho

Configuração dedicada: [playwright.performance.config.ts](../playwright.performance.config.ts).
O teste usa o build de produção, um servidor HTTPS local efêmero com atraso
fixo de 1.000 ms por resposta, `Cache-Control: no-store`, cache Chromium
desabilitado e CDP configurado para RTT de 100 ms / 10 Mbps em ambas as direções.
`route.continue` redireciona as APIs para HTTPS local; não usa `route.fulfill`,
que contornaria a limitação de rede. Requer `openssl`; certificado e chave de
teste são temporários e removidos no encerramento.

São 100 buscas medidas até os resultados renderizados (aguardando o forecast
automático antes da próxima busca), seguidas de 100 seleções medidas até os
dados atuais e os cinco cartões renderizados. Duas animações de frame confirmam
oportunidade de pintura. O início é capturado no evento DOM de submit/click,
sem contar preenchimento do campo. A confirmação pelo driver acrescenta pequena
sobremedição conservadora. P95 usa nearest rank: item 95 de 100 ordenados.
O teste exige 100 geocodings, 200 forecasts (100 automáticos + 100 seleções),
amostras ≥ 1 s e p95 ≤ 5 s; anexa as 200 amostras e o resumo em JSON.
Timeout de 8 s é verificado separadamente nos E2E com relógio controlado.

Resultado final observado em 28/10: **100/100 buscas e 100/100 seleções**,
100 requisições de geocoding e 200 de forecast. P95 busca **1.347,3 ms**,
p95 seleção **1.330,4 ms**, ambos abaixo de **5.000 ms**. Execuções anteriores
também passaram (1.463,9 / 1.438,6 ms e 1.471,6 / 1.393,2 ms). O relatório
Playwright local inclui 200 amostras e é gerado novamente pelo comando; os
resultados agregados e condições estão preservados neste documento versionável.
T-35 **Concluída**; isto não mede a disponibilidade ou latência do provedor real.

## T-36 — Compatibilidade

As versões abaixo vêm de `browser.version()`, não de nomes de dispositivos.

Versões candidatas em fontes oficiais consultadas em 28/10/2026 (não
confundidas com as versões efetivamente testadas):

| Navegador/plataforma | Última estável identificada | Anterior confirmada nesta consulta | Fonte | Execução deste app |
|---|---|---|---|---|
| Chrome desktop | 156.0.8078.73 Linux (27/10) | A confirmar na página de arquivo | [Chrome Stable](https://chromereleases.googleblog.com/2026/10/stable-channel-update-for-desktop_0562499947.html) | Não executado nesse Chrome |
| Microsoft Edge | 156.0.4314.50 (26/10) | 155.0.4283.62 (16/10) | [Edge Stable](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-relnote-stable-channel) | Não executado |
| Firefox | 159.0 (27/10) | 158.0 (13/10) | [Firefox version feed](https://product-details.mozilla.org/1.0/firefox_versions.json) e [158 release notes](https://www.mozilla.org/en-US/firefox/158.0/releasenotes/) | Não executado nessas versões |
| Safari macOS | 27.0 (14/09) | 26.0 (15/09/2025) | [Safari 27](https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes.md) e [Safari 26](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes.md) | Sem macOS/Safari no runner |
| iOS/iPadOS | 27.2 (26/10) e 18.7.11 (26/10) | Canais/patches observados, seleção de matriz a confirmar | [Apple releases](https://developer.apple.com/news/releases/) | Não há dispositivo real |
| Chrome Android | Atualização estável publicada em 27/10 | Versões exatas não recuperadas nesta consulta | [Chrome releases](https://chromereleases.googleblog.com/2026/10/chrome-for-android-update_0160078013.html) | Não há Android real |

Versões realmente executadas no runner:

| Engine Playwright / host | Versão observada | Evidência |
|---|---|---|
| Chromium / Debian 13.7 | 149.0.7827.55 | Testes E2E Chromium |
| Emulação iPhone 13 com Chromium | 149.0.7827.55 | Viewports; não é Safari iOS |
| Firefox / Debian 13.7 | 151.0 | Fluxo principal em 320/1280 px |
| WebKit / Debian 13.7 | 26.5 | Fluxo principal em 320/1280 px; não é Safari distribuído pela Apple |

T-36 permanece **Parcial**. Identificar versão não equivale a testar. É
necessário confirmar o Chrome anterior e as versões móveis exatas e executar
as duas versões exigidas em navegadores/dispositivos suportados.

## T-37 — Provedor: consulta documental e aprovação de uso

Fontes públicas consultadas em **28/10/2026**:

| Item | Fonte / constatação | Status e responsável |
|---|---|---|
| Licença dos dados | [Licença Open-Meteo](https://open-meteo.com/en/licence): CC BY 4.0, crédito, link para licença e indicação de alterações | Verificação documental realizada nesta sessão; footer atualizado com crédito, licença, arredondamento/conversão |
| Termos do serviço gratuito | [Termos](https://open-meteo.com/en/terms): uso não comercial; menos de 10.000 chamadas/dia, 5.000/hora e 600/minuto; logs de diagnóstico podem conter coordenadas; sem garantia de disponibilidade/precisão | Consulta realizada; produto/operação ainda deve aprovar enquadramento e volume, pessoa a designar |
| Volume mensal e planos | [Pricing](https://open-meteo.com/en/pricing): tabela indica limite gratuito de 300.000 chamadas/mês e uso não comercial; planos comerciais usam endpoint dedicado, com volumes de chamadas definidos | Fonte consultada; projeção de tráfego e adequação do plano pendentes de produto/operação |
| Geocoding | [Documentação](https://open-meteo.com/en/docs/geocoding-api) | Crédito GeoNames incluído; confirmar obrigações específicas na distribuição final com mantenedor/jurídico |
| Metadados de rede | [Termos e privacidade](https://open-meteo.com/en/terms): descrevem logs de diagnóstico e retenção de 90 dias | Consulta realizada; não é garantia sobre tratamento futuro; política da aplicação aponta para a fonte |
| Uso efetivamente previsto, hospedagem, volume e monitoramento | Não há aprovação externa registrada | Pendente de produto/operação/jurídico, pessoas a designar |

T-37 permanece **Parcial**. A consulta automatizada não autoriza afirmar que os
termos permitem toda futura distribuição. Revalidar fontes na janela real de
release e nomear responsáveis; qualquer obrigação pendente bloqueia o release.
Os termos explicitamente classificam uso em conteúdo educacional como
não comercial. Isso corresponde ao propósito de treinamento deste repositório,
mas não determina o modelo de hospedagem, audiência ou uso posterior do produto.

## T-38 — Política de privacidade

Versão **28/10/2026**: [public/privacy.html](../public/privacy.html), acessível
pelo footer e incluída pelo Vite no build como `privacy.html`, inclusive sob
base path de deploy. Identifica Open-Meteo, cidade/coordenadas enviadas,
metadados como IP e retenção de logs descrita pelo provedor (90 dias na página
consultada nesta data), ausência de conta/GPS/analytics/persistência e limites da
política quanto ao provedor e à hospedagem.

O E2E verifica navegação e texto. **Não foi efetuado deploy nesta sessão**;
URL pública, contato do responsável, política de logs da hospedagem e aprovação
de privacidade ainda dependem do release. Responsável requerido:
mantenedor/operação/privacidade, pessoas a designar. T-38 permanece **Parcial**,
não “política publicada e aprovada”.

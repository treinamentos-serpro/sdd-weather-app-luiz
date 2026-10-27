# Especificação de Produto — Weather App

## Overview

Aplicação web responsiva para buscar uma cidade e consultar as condições
meteorológicas atuais e a previsão diária de cinco dias. A interface inicial é
em português do Brasil (pt-BR). A fonte de geocodificação e previsão é
Open-Meteo, sem API key.

O fluxo principal é: informar cidade → escolher resultado → consultar condições
atuais e previsão → alternar a unidade de temperatura. O período da previsão
inclui a data local atual e os quatro dias locais seguintes. Celsius é a unidade
inicial; Fahrenheit é a alternativa.

Personas de discovery (hipóteses ainda não validadas): Camila, que consulta o
clima antes de sair; Rafael, que planeja uma viagem; e Morgan, que prefere
Fahrenheit.

**Objetivo da versão:** permitir que a pessoa conclua uma consulta para a
localidade correta e compreenda as temperaturas na unidade escolhida. Métricas
de adoção e validação das personas serão definidas com stakeholders; não são
critérios de aceite desta versão.

## Functional Requirements

### RF-01 — Buscar e selecionar uma cidade

O sistema deve aceitar uma busca manual pelo nome de uma cidade e consultar a
geocodificação do Open-Meteo somente após envio explícito. Após remover espaços
nas extremidades, a consulta deve conter de 1 a 100 pontos de código Unicode. A
aplicação deve aceitar acentos e caracteres válidos em nomes de localidades,
codificando-os corretamente na requisição. Deve apresentar até 10 resultados,
na ordem recebida do provedor, com nome da cidade e campos regionais disponíveis
(região/estado e país). A pessoa deve selecionar um resultado; nenhuma cidade
será escolhida automaticamente. Se resultados não puderem ser distinguidos por
nome e campos regionais, apresentar as coordenadas em latitude/longitude WGS 84
com quatro casas decimais. Resultados idênticos em nome, região, país e
coordenadas devem ser deduplicados.

### RF-02 — Consultar condições atuais

Após selecionar uma cidade, o sistema deve consultar e apresentar, quando
disponíveis, condição meteorológica, temperatura, sensação térmica, umidade
relativa, precipitação e velocidade do vento. Os dados devem corresponder às
coordenadas da cidade selecionada. “Atual” significa o dado mais recente
disponibilizado pelo endpoint de condições atuais do Open-Meteo; não deve ser
descrito como observação em tempo real. Quando fornecido, o horário do dado deve
ser apresentado na hora local da cidade.

Unidades iniciais: temperatura em °C, precipitação em mm, velocidade do vento
em km/h e umidade em %. Temperatura, precipitação e velocidade do vento são
exibidos com uma casa decimal; umidade, como percentual inteiro. Usar vírgula
decimal e arredondamento half-up (empates para longe de zero). Campos ausentes
ou fora do domínio válido (umidade fora de 0–100%, valores
negativos de precipitação ou vento) devem ser indicados individualmente como
indisponíveis; não se deve inferir valores. Cada código WMO suportado deve ter
um rótulo pt-BR determinístico; códigos desconhecidos são indisponíveis.

### RF-03 — Consultar previsão diária de cinco dias

Após selecionar uma cidade, o sistema deve apresentar previsão diária para a
data local atual e os quatro dias locais seguintes, usando o fuso horário
identificado para as coordenadas pelo Open-Meteo. Para cada dia, deve apresentar
condição, temperaturas mínima e máxima, soma de precipitação, probabilidade
máxima de precipitação e velocidade máxima do vento, quando fornecidas.

As unidades iniciais são °C, mm, %, e km/h, respectivamente. Cada item deve
identificar sua data local. A interface não deve converter datas usando o fuso
do dispositivo da pessoa. Temperatura, precipitação e velocidade do vento são
exibidos com uma casa decimal; probabilidade de precipitação, como percentual
inteiro. Usar vírgula decimal e arredondamento half-up (empates para longe de
zero). A probabilidade diária corresponde ao máximo diário fornecido pelo
provedor; a aplicação não deve recalculá-la. Cada código WMO suportado deve ter
um rótulo pt-BR determinístico; códigos desconhecidos são indisponíveis.

Rótulos obrigatórios para os códigos WMO cobertos pelo provedor:

| Código | Rótulo pt-BR |
|---|---|
| 0 | Céu limpo |
| 1 | Predominantemente limpo |
| 2 | Parcialmente nublado |
| 3 | Encoberto |
| 45 | Nevoeiro |
| 48 | Nevoeiro com deposição de geada |
| 51 | Chuvisco leve |
| 53 | Chuvisco moderado |
| 55 | Chuvisco intenso |
| 56 | Chuvisco congelante leve |
| 57 | Chuvisco congelante intenso |
| 61 | Chuva fraca |
| 63 | Chuva moderada |
| 65 | Chuva forte |
| 66 | Chuva congelante fraca |
| 67 | Chuva congelante forte |
| 71 | Neve fraca |
| 73 | Neve moderada |
| 75 | Neve forte |
| 77 | Grãos de neve |
| 80 | Pancadas de chuva leves |
| 81 | Pancadas de chuva moderadas |
| 82 | Pancadas de chuva violentas |
| 85 | Pancadas de neve leves |
| 86 | Pancadas de neve fortes |
| 95 | Trovoada fraca ou moderada |
| 96 | Trovoada com granizo leve |
| 99 | Trovoada com granizo forte |

### RF-04 — Alternar unidade de temperatura

O sistema deve oferecer seleção explícita de Celsius ou Fahrenheit, iniciando
em Celsius. A seleção se aplica a todos os valores de temperatura de condições
atuais e previsão exibidos na consulta. As demais unidades não mudam com essa
seleção. Os cálculos usam Celsius como valor canônico e convertem uma única vez
para exibição. A escolha permanece enquanto a página atual estiver aberta,
inclusive ao trocar de cidade; recarga completa inicia novamente em Celsius.

### RF-05 — Comunicar estados e recuperar falhas

O sistema deve apresentar estados distintos de carregamento, resultados vazios,
dados indisponíveis e falha de operação. Falha de rede, erro do provedor ou
timeout não pode ser apresentada como busca sem resultados. Para cada operação
que falhar, deve haver ação explícita para nova tentativa.

Cada operação iniciada pela pessoa (busca ou consulta meteorológica) deve
terminar em até 8 segundos, medidos do envio ou seleção até a resposta completa.
Ao exceder esse limite, todas as requisições da operação devem ser canceladas e
encerradas como timeout, com mensagem de falha e ação para tentar novamente.
Não haverá repetição automática.

Mensagens obrigatórias em pt-BR: campo vazio — “Digite o nome de uma cidade.”;
consulta acima do limite — “A busca deve ter até 100 caracteres.”; busca sem
resultados — “Nenhuma cidade encontrada. Verifique a busca e tente novamente.”;
falha ou timeout — “Não foi possível concluir a operação. Tente novamente.”;
campo meteorológico ausente ou inválido — “Indisponível”; todos os dados de
condições atuais ausentes — “Dados meteorológicos indisponíveis.”; fuso da
previsão ausente/inválido — “Não foi possível determinar as datas locais.”

### RF-06 — Tratar respostas parciais

O sistema deve apresentar os campos válidos recebidos mesmo quando outros
campos ou dias estiverem ausentes. Deve marcar cada campo ou dia ausente como
indisponível, sem substituir dados, remover silenciosamente o período ou
apresentar a resposta parcial como completa.

## User Stories

- **US-01 (RF-01):** Como Camila, quero buscar uma cidade para encontrar o local
  cujo clima desejo consultar.
- **US-02 (RF-02):** Como Camila, quero ver as condições atuais da cidade
  selecionada para me preparar antes de sair.
- **US-03 (RF-03):** Como Rafael, quero consultar a previsão de hoje e dos quatro
  dias seguintes no destino da viagem para planejar minhas atividades.
- **US-04 (RF-04):** Como Morgan, quero alternar entre Celsius e Fahrenheit para
  compreender as temperaturas na unidade que prefiro.
- **US-05 (RF-05):** Como Camila, quero saber quando uma operação falha e poder
  tentar novamente para concluir a consulta.
- **US-06 (RF-06):** Como Rafael, quero identificar os dados ausentes para
  planejar sem confundir uma previsão parcial com uma previsão completa.

## Traceability Matrix

| User Story | Requisito funcional | Acceptance Criteria | Requisitos não funcionais relevantes |
|---|---|---|---|
| US-01 — Buscar cidade (Camila) | RF-01 — Buscar e selecionar uma cidade | AC-01.1–AC-01.10 | RNF-01 Responsividade; RNF-02 Acessibilidade; RNF-03 Desempenho; RNF-04 Compatibilidade; RNF-07 Privacidade; RNF-08 Idioma e formatos |
| US-02 — Ver condições atuais (Camila) | RF-02 — Consultar condições atuais | AC-02.1–AC-02.9 | RNF-01 Responsividade; RNF-02 Acessibilidade; RNF-03 Desempenho; RNF-04 Compatibilidade; RNF-05 Integridade e atualidade dos dados; RNF-06 Disponibilidade; RNF-08 Idioma e formatos |
| US-03 — Planejar com previsão de cinco dias (Rafael) | RF-03 — Consultar previsão diária de cinco dias | AC-03.1–AC-03.10 | RNF-01 Responsividade; RNF-02 Acessibilidade; RNF-03 Desempenho; RNF-04 Compatibilidade; RNF-05 Integridade e atualidade dos dados; RNF-06 Disponibilidade; RNF-08 Idioma e formatos |
| US-04 — Alternar temperatura (Morgan) | RF-04 — Alternar unidade de temperatura | AC-04.1–AC-04.8 | RNF-01 Responsividade; RNF-02 Acessibilidade; RNF-04 Compatibilidade; RNF-05 Integridade dos dados; RNF-08 Idioma e formatos |
| US-05 — Recuperar falha (Camila) | RF-05 — Comunicar estados e recuperar falhas | AC-05.1–AC-05.6 | RNF-01 Responsividade; RNF-02 Acessibilidade; RNF-03 Desempenho; RNF-04 Compatibilidade; RNF-06 Disponibilidade |
| US-06 — Identificar dados ausentes (Rafael) | RF-06 — Tratar respostas parciais | AC-06.1–AC-06.5 | RNF-01 Responsividade; RNF-02 Acessibilidade; RNF-04 Compatibilidade; RNF-05 Integridade e atualidade dos dados; RNF-06 Disponibilidade; RNF-08 Idioma e formatos |

## Acceptance Criteria

Os cenários abaixo são critérios de aceite automatizáveis. Testes de integração
devem usar respostas controladas do provedor; testes ponta a ponta devem
verificar os resultados observáveis na interface.

### AC-01 — Busca e seleção de cidade (RF-01)

1. **Given** o campo de busca vazio ou contendo somente espaços, **When** a
   pessoa envia a busca, **Then** a aplicação exibe “Digite o nome de uma
   cidade.” e não envia requisição de geocodificação.
2. **Given** uma consulta com 1 a 100 pontos de código Unicode após trim,
   incluindo acentos, apóstrofos ou hífens, **When** a pessoa envia a busca,
   **Then** uma requisição corretamente codificada é enviada ao Open-Meteo com
   o texto da consulta preservado, exceto espaços externos.
3. **Given** uma consulta com mais de 100 pontos de código Unicode após trim,
   **When** a pessoa tenta enviá-la, **Then** a aplicação exibe “A busca deve
   ter até 100 caracteres.” e não envia requisição de geocodificação.
4. **Given** uma resposta de geocodificação com resultados, **When** a busca
   termina, **Then** a interface exibe no máximo 10 resultados na ordem recebida,
   incluindo nome e os campos de região/estado e país presentes na resposta.
5. **Given** resultados com nomes de cidade iguais, **When** a lista é exibida,
   **Then** cada item mostra os campos regionais disponíveis e nenhum resultado
   é selecionado automaticamente.
6. **Given** resultados que continuam indistinguíveis pelos campos regionais,
   **When** a lista é exibida, **Then** cada resultado inclui as coordenadas
   recebidas em WGS 84, arredondadas a quatro casas decimais.
7. **Given** resultados com mesmo nome, região, país e coordenadas, **When** a
   lista é montada, **Then** somente um resultado é exibido para esse conjunto.
8. **Given** uma resposta de geocodificação vazia, **When** a busca termina,
   **Then** a interface exibe “Nenhuma cidade encontrada. Verifique a busca e
   tente novamente.”, não solicita clima para nenhuma localidade e permite
   editar a consulta.
9. **Given** resultados exibidos, **When** a pessoa seleciona um resultado,
   **Then** as coordenadas e o nome correspondentes a esse item são usados na
   consulta meteorológica e a localidade é identificada na tela.
10. **Given** a pessoa envia uma consulta enquanto outra busca ainda está em
   andamento, **When** as respostas chegam fora de ordem, **Then** somente os
   resultados da consulta mais recente são exibidos.

### AC-02 — Condições atuais (RF-02)

1. **Given** uma cidade selecionada e uma resposta atual válida, **When** a
   consulta termina, **Then** a interface exibe condição, temperatura, sensação
   térmica, umidade, precipitação e velocidade do vento conforme os campos
   presentes na resposta, com cidade e unidades identificadas.
2. **Given** a resposta inclui horário do dado e fuso da cidade, **When** as
   condições atuais são exibidas, **Then** o horário é apresentado na hora local
   dessa cidade.
3. **Given** um ou mais campos atuais ausentes, **When** a resposta é exibida,
   **Then** cada campo ausente é marcado como “Indisponível” e os demais campos
   válidos continuam visíveis.
4. **Given** nenhum campo meteorológico atual válido, **When** a consulta
   termina, **Then** a interface exibe “Dados meteorológicos indisponíveis.” e
   não exibe valores inventados nem de outra cidade.
5. **Given** um valor de temperatura de 12 °C, **When** ele é exibido em
   Celsius, **Then** aparece como “12,0 °C”.
6. **Given** um código WMO listado na tabela desta especificação ou um código
   desconhecido, **When** a condição atual é exibida, **Then** o rótulo pt-BR da
   tabela é exibido exatamente (por exemplo, 0 é “Céu limpo”) e um código
   desconhecido é marcado como “Indisponível”.
7. **Given** um campo numérico atual fora do domínio definido em RF-02, **When**
   a resposta é processada, **Then** somente esse campo é marcado como
   indisponível e os demais campos válidos permanecem exibidos.
8. **Given** duas cidades consultadas em sequência e respostas meteorológicas
   recebidas fora de ordem, **When** a segunda cidade já está selecionada,
   **Then** somente os dados da segunda cidade são exibidos.
9. **Given** um timestamp atual recebido sem fuso horário válido, **When** as
   condições atuais são exibidas, **Then** o timestamp não é apresentado como
   hora local.

### AC-03 — Previsão de cinco dias (RF-03)

1. **Given** uma resposta diária válida com todos os dias disponíveis, **When**
   a previsão é exibida, **Then** ela contém cinco datas locais consecutivas,
   começando na data local atual da cidade consultada.
2. **Given** um dia com campos disponíveis, **When** esse dia é exibido, **Then**
   condição, mínima, máxima, soma de precipitação, probabilidade máxima de
   precipitação e vento máximo aparecem com data e unidade, conforme presentes
   na resposta.
3. **Given** campos ausentes em um dia, **When** esse dia é exibido, **Then**
   cada campo ausente é identificado como “Indisponível” e os demais valores
   válidos do dia permanecem visíveis.
4. **Given** uma ou mais datas sem dados, **When** a previsão é exibida,
   **Then** cada data do período solicitado permanece identificada e as datas
   sem dados são marcadas como indisponíveis, sem preenchimento inventado.
5. **Given** uma resposta que não contém um fuso horário utilizável, **When** a
   consulta da previsão termina, **Then** a interface exibe “Não foi possível
   determinar as datas locais.” e não apresenta rótulos de data como se fossem
   locais.
6. **Given** uma cidade selecionada, **When** os dados de previsão são
   solicitados, **Then** a requisição usa as coordenadas dessa cidade e o fuso
   horário automático determinado pelo provedor para essas coordenadas.
7. **Given** um valor de temperatura de 12 °C em um item de previsão, **When**
   ele é exibido em Celsius, **Then** aparece como “12,0 °C”.
8. **Given** um código WMO listado na tabela desta especificação ou um código
   desconhecido, **When** a condição diária é exibida, **Then** o rótulo pt-BR da
   tabela é exibido exatamente (por exemplo, 61 é “Chuva fraca”) e um código
   desconhecido é marcado como “Indisponível”.
9. **Given** um valor de probabilidade fora de 0–100%, ou
   precipitação/vento negativo, **When** a resposta é processada, **Then** o
   campo inválido é marcado como indisponível sem invalidar os outros campos
   válidos.
10. **Given** a data local atravessa uma mudança de horário de verão, **When**
    os cinco dias são determinados, **Then** são usadas cinco datas consecutivas
    no calendário local retornado pelo provedor, não cinco períodos fixos de 24
    horas.

### AC-04 — Alternância de unidade (RF-04)

1. **Given** uma página recém-aberta, **When** temperaturas
   são exibidas, **Then** todas estão em °C.
2. **Given** temperaturas atuais e previsão exibidas em °C, **When** a pessoa
   seleciona °F, **Then** todos os valores de temperatura visíveis são
   convertidos com a fórmula °F = (°C × 9/5) + 32 e identificados em °F.
3. **Given** temperaturas exibidas em °F, **When** a pessoa seleciona °C,
   **Then** todos os valores são convertidos com a fórmula °C = (°F − 32) × 5/9
   e identificados em °C.
4. **Given** uma temperatura de 0 °C ou 100 °C, **When** exibida em °F,
   **Then** o resultado aparece como “32,0 °F” ou “212,0 °F”,
   respectivamente.
5. **Given** uma temperatura convertida, **When** é formatada, **Then** é
   arredondada para uma casa decimal (empates para longe de zero) e exibida com
   vírgula decimal.
6. **Given** dados meteorológicos já exibidos, **When** a unidade é alternada,
   **Then** cidade, datas, condições e valores não relacionados à temperatura
   permanecem inalterados.
7. **Given** uma unidade escolhida na página atual, **When** a página é
   recarregada, **Then** a unidade inicial volta a Celsius.
8. **Given** os dados meteorológicos ainda estão carregando, **When** a pessoa
   seleciona outra unidade, **Then** todos os valores exibidos após a resposta
   usam a unidade selecionada, sem mistura de unidades.

### AC-05 — Estados, timeout e recuperação (RF-05)

1. **Given** uma busca ou consulta em andamento, **When** a requisição ainda não
   terminou, **Then** a interface apresenta estado de carregamento associado à
   operação.
2. **Given** a API retorna erro ou ocorre falha de rede, **When** a operação
   termina, **Then** a interface exibe “Não foi possível concluir a operação.
   Tente novamente.”, não informa “Nenhuma cidade encontrada” e oferece nova
   tentativa.
3. **Given** uma operação sem conclusão após 8 segundos desde o envio ou
   seleção, **When** o limite é atingido, **Then** suas requisições são
   canceladas, a interface exibe “Não foi possível concluir a operação. Tente
   novamente.”, identifica falha por timeout e oferece nova tentativa.
4. **Given** uma operação falhou, **When** a pessoa aciona nova tentativa,
   **Then** uma nova requisição é enviada e não ocorre repetição automática
   adicional.
5. **Given** uma nova tentativa bem-sucedida, **When** a resposta chega,
   **Then** a interface exibe dados da tentativa atual para a cidade selecionada.
6. **Given** uma resposta de busca ou clima que falha, **When** o estado final é
   exibido, **Then** dados dessa operação não são apresentados como resultado
   válido ou atual.

### AC-06 — Respostas parciais (RF-06)

1. **Given** uma resposta atual com alguns campos válidos e outros ausentes,
   **When** a consulta termina, **Then** os campos válidos são exibidos e cada
   campo ausente é marcado como “Indisponível”.
2. **Given** uma resposta de previsão com dias válidos e dias ausentes,
   **When** a previsão é exibida, **Then** todos os cinco dias do período são
   representados e os dias sem dados são marcados como “Indisponível”.
3. **Given** um valor malformado ou não numérico em um campo meteorológico,
   **When** a resposta é processada, **Then** esse campo é tratado como
   “Indisponível”, enquanto os demais campos válidos são exibidos.
4. **Given** nenhuma informação meteorológica válida na resposta, **When** a
   resposta é processada, **Then** a interface comunica indisponibilidade e não
   apresenta um painel vazio como consulta concluída com sucesso.
5. **Given** uma resposta HTTP de sucesso cujo corpo não pode ser interpretado
   conforme o contrato esperado, **When** a resposta é processada, **Then** a
   operação é classificada como erro de serviço e oferece nova tentativa, sem
   ser confundida com resposta válida vazia.

## Non-Functional Requirements

### RNF-01 — Responsividade

As funções RF-01 a RF-06 devem ser operáveis em viewports de 320 px, 768 px e
1280 px de largura, em orientações retrato e paisagem quando suportadas pelo
dispositivo. Em cada viewport, os testes devem confirmar que controles e dados
essenciais estão disponíveis e que a página não exige rolagem horizontal.
Conteúdo que exceda a altura da tela pode usar rolagem vertical.

### RNF-02 — Acessibilidade

A interface deve atender WCAG 2.2 nível AA. Todos os fluxos devem ser
completáveis por teclado, com foco visível, ordem de foco coerente, nomes
acessíveis para controles e anúncio programático de carregamento, estado vazio,
indisponibilidade e falha. Contraste de texto e componentes deve atender aos
limites WCAG 2.2 AA. Validar com análise automatizada e verificação manual por
teclado e leitor de tela.

### RNF-03 — Desempenho

Em teste de 100 execuções bem-sucedidas por operação, com cache desabilitado,
RTT de rede de 100 ms, largura de banda de 10 Mbps e API de teste com latência
de resposta fixa de 1 segundo, o percentil 95 entre envio da busca e exibição
dos resultados deve ser no máximo 5 segundos. O mesmo limite se aplica entre a
seleção da cidade e a exibição dos dados meteorológicos. Medir até o conteúdo
final estar renderizado, sem incluir o tempo anterior ao envio. O timeout de 8
segundos de RF-05 é o limite máximo por operação. Desempenho real do provedor
deve ser monitorado separadamente e não altera este teste controlado.

### RNF-04 — Compatibilidade

Os fluxos principais devem funcionar nas duas versões estáveis mais recentes de
Chrome, Edge, Firefox e Safari; em Safari para iOS e Chrome para Android nas
duas versões estáveis mais recentes disponíveis. O conjunto de ambientes e
versões usados nos testes deve ser registrado para cada release. “Versão
estável mais recente” significa a versão estável publicada na data de início da
janela de validação do release.

### RNF-05 — Integridade e atualidade dos dados

Valores devem corresponder à resposta do Open-Meteo, às coordenadas selecionadas
e às unidades declaradas. O horário local exibido deve corresponder ao fuso
retornado para a cidade. Campos ausentes ou inválidos devem obedecer a RF-06.
Não afirmar observação em tempo real; identificar o horário de referência
fornecido pela fonte quando disponível.

### RNF-06 — Disponibilidade e dependências

A disponibilidade da aplicação e a disponibilidade das APIs do Open-Meteo são
dependências distintas. A aplicação deve tratar falhas da API conforme RF-05;
não se garante disponibilidade da fonte externa. Meta mensal proposta para
disponibilidade do shell da aplicação: 99,5% do tempo calendário, excluindo
indisponibilidade do provedor e manutenção previamente comunicada. Uma falha que
impeça o carregamento do shell conta como indisponibilidade; falhas da API são
medidas separadamente como taxa de sucesso das consultas. Essa meta e o método
de medição requerem aprovação operacional antes do lançamento.

### RNF-07 — Privacidade e armazenamento

Não é necessária conta. A aplicação não solicita geolocalização do dispositivo
nem mantém cidade, histórico ou unidade entre sessões. Deve enviar ao provedor
somente os dados necessários à geocodificação e à consulta meteorológica; a
conexão também pode revelar ao provedor metadados de rede, como endereço IP. A
aplicação não deve adicionar identificadores de usuário, analytics ou histórico
nas requisições. A política de privacidade deve informar a comunicação com o
provedor e o tratamento de metadados de rede conforme os termos aplicáveis.

### RNF-08 — Idioma e formatos

Textos da interface devem estar em pt-BR. Datas devem usar dia da semana e data
no padrão brasileiro (dd/MM); incluir o ano quando a data não pertencer ao ano
corrente. Horários devem usar relógio de 24 horas e o fuso local da cidade
consultada. Unidades devem acompanhar cada valor ou grupo de valores de forma
inequívoca.

## Edge Cases

- **Cidade inexistente ou geocoding sem resultados:** exibir estado vazio,
  permitir corrigir a busca e não iniciar consulta meteorológica.
- **Input vazio ou espaços:** bloquear envio, orientar a pessoa e não chamar o
  provedor.
- **Acentos, apóstrofos, hífens e outros caracteres válidos:** codificar a
  entrada corretamente; preservar caracteres digitados. Não prometer resultados
  para todo alfabeto sem cobertura confirmada pelo provedor.
- **Entrada acima de 100 caracteres:** impedir envio e informar o limite.
- **Cidades homônimas:** exigir seleção explícita; exibir os campos regionais
  disponíveis e, se persistir igualdade visual, incluir as coordenadas
  arredondadas recebidas para distinção.
- **Timeout, falha de rede ou erro HTTP/API:** distinguir falha de resultado
  vazio; encerrar a operação em 8 segundos e oferecer nova tentativa manual.
- **Busca subsequente mais recente:** ignorar resposta atrasada de uma consulta
  anterior.
- **Resposta parcial ou campo malformado:** exibir dados válidos e marcar
  somente campos/dias inválidos como indisponíveis.
- **Sem dados meteorológicos válidos:** comunicar indisponibilidade; não mostrar
  dados de outra cidade nem valores inventados.
- **Fuso ausente ou inválido:** não rotular datas como locais; informar que não
  foi possível determinar o período local.
- **Temperaturas negativas ou decimais:** aplicar fórmulas de conversão e
  arredondar para uma casa decimal (empates para longe de zero), com vírgula
  decimal; nunca omitir o sinal ou a unidade.
- **Mudança de unidade durante carregamento:** aplicar a unidade escolhida a
  todos os dados quando carregarem, sem misturar °C e °F.
- **Perda de conexão após dados carregados:** não atualizar silenciosamente os
  valores; caso permaneçam na tela, identificá-los como dados previamente
  carregados, não como resultado atualizado.

## Assumptions

- Produto web responsivo; busca manual, sem localização automática.
- Open-Meteo é a fonte de geocodificação e previsão, sem API key.
- Previsão é diária para hoje local e os quatro dias seguintes.
- Os campos e unidades meteorológicas são os definidos em RF-02 e RF-03.
- Celsius é padrão; a unidade escolhida dura somente enquanto a página atual
  estiver aberta.
- Não há contas, persistência de servidor, favoritos ou histórico.
- Personas são hipóteses; validar público e metas de produto não bloqueia os
  critérios funcionais definidos, mas deve ocorrer antes de otimizações de
  produto.
- Meta de disponibilidade de 99,5% é proposta e depende de aprovação operacional.

## Risks

| Risco | Mitigação |
|---|---|
| Open-Meteo indisponível, limitado ou com termos incompatíveis | Validar limites, cobertura, licença, atribuição e disponibilidade antes do lançamento; manter estados de falha e recuperação testados. |
| Dados/modelos atrasados interpretados como observação em tempo real | Usar a semântica de dado mais recente do provedor e mostrar timestamp quando disponível; nunca prometer tempo real. |
| Homônimo escolhido incorretamente | Exibir contexto regional e exigir seleção; cobrir homônimos em testes. |
| API não retorna campos ou fuso esperados | Validar payload, apresentar indisponibilidade por campo e monitorar falhas de contrato. |
| Metas de qualidade não aprovadas ou sem responsável | Aprovar meta operacional e atribuir responsáveis de monitoramento antes do lançamento. |
| Personas não representam usuários reais | Validar tarefas e prioridades com usuários antes de expandir o escopo. |

## Out of Scope

- Localização automática, GPS e solicitação de permissão de localização.
- Busca por código postal ou endereço; busca por nome de cidade somente.
- Previsão horária, alertas, notificações e avisos meteorológicos oficiais.
- Login, perfis, favoritos, histórico, sincronização e persistência de preferências.
- Cache, modo offline e apresentação de previsões antigas.
- Aplicativo nativo e PWA.
- Publicidade, monetização, analytics e compartilhamento de dados com terceiros.
- Conversão ou preferência de unidade para vento, precipitação e outras variáveis.

## Open Questions

As decisões abaixo são gates operacionais/comerciais, não lacunas para os
critérios funcionais:

1. Os termos vigentes do Open-Meteo permitem o uso previsto, volume esperado e
   atribuição definidos para a distribuição do produto?
2. Stakeholders e operação aprovam a meta proposta de disponibilidade de 99,5%
   mensal e a exclusão de indisponibilidade do provedor?
3. Qual equipe será responsável por monitoramento, suporte, incidentes e
   comunicação de falhas?
4. Quais regiões de hospedagem, volume de tráfego e requisitos corporativos de
   retenção/conformidade se aplicam?
5. As personas hipotéticas e a definição de sucesso devem ser validadas com
   quais usuários e metas quantitativas antes da avaliação do produto?

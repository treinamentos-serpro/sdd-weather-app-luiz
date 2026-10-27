# Análise de Discovery — Aplicação de Previsão do Tempo

## Contexto

A empresa solicitou uma aplicação para que usuários consultem o clima de cidades de seu interesse. A experiência deve apresentar as condições atuais e uma previsão para cinco dias, permitir alternância entre Celsius e Fahrenheit e funcionar em dispositivos móveis.

O briefing define o propósito geral, mas ainda não determina o público prioritário, os detalhes dos dados meteorológicos ou o comportamento esperado em situações como cidades com nomes iguais e falhas de conexão. Essas decisões precisam ser esclarecidas antes de fechar o escopo do produto.

## Personas (hipóteses para validação)

As personas abaixo são hipóteses baseadas nos usos prováveis de uma aplicação de clima; não representam pesquisa com usuários já realizada. Devem ser validadas e priorizadas com stakeholders e usuários reais.

### 1. Camila — pessoa que consulta o clima para se preparar para o dia

- **Objetivo principal:** verificar rapidamente as condições atuais e a previsão próxima para decidir como se vestir ou se preparar para sair.
- **Contexto de uso:** principalmente mobile, em momentos curtos antes de sair de casa ou durante deslocamentos; pode estar em uma rede móvel instável.
- **Métrica de sucesso do ponto de vista dela:** consegue encontrar a cidade desejada e entender as condições atuais e a previsão sem erro ou ajuda; medir por taxa de conclusão da consulta e tempo até localizar a informação.

### 2. Rafael — viajante que compara destinos e planeja os próximos dias

- **Objetivo principal:** consultar a previsão de cinco dias de uma cidade para planejar atividades e avaliar o que levar.
- **Contexto de uso:** desktop ou tablet ao organizar a viagem; mobile durante o deslocamento para rever a previsão.
- **Métrica de sucesso do ponto de vista dele:** consulta a previsão do destino correto e identifica as condições relevantes para os cinco dias; medir por taxa de conclusão sem selecionar uma cidade homônima incorreta e avaliação de confiança na informação.

### 3. Morgan — pessoa que prefere Fahrenheit

- **Objetivo principal:** consultar o clima atual e a previsão em Fahrenheit, sem precisar converter valores mentalmente.
- **Contexto de uso:** mobile ou desktop, possivelmente em uma viagem ou em localidade onde a convenção usada é diferente da sua preferência.
- **Métrica de sucesso do ponto de vista dela:** todos os valores de temperatura relevantes aparecem na unidade selecionada e a alternância é fácil de encontrar; medir por conclusão bem-sucedida da troca de unidade e ausência de valores inconsistentes.

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir que o usuário informe uma cidade para consultar sua previsão.
- **RF2 — Consultar clima atual:** apresentar as condições meteorológicas atuais da cidade selecionada.
- **RF3 — Consultar previsão:** apresentar a previsão do tempo para cinco dias da cidade selecionada.
- **RF4 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit para os valores de temperatura apresentados.

### Revisão da classificação do briefing

| Item do briefing | Classificação | Avaliação |
| --- | --- | --- |
| Buscar cidades | Funcional | Correto: descreve uma ação que o sistema deve oferecer. |
| Ver o clima atual | Funcional | Correto: descreve informação que o sistema deve apresentar. |
| Ver a previsão de 5 dias | Funcional | Correto: descreve informação que o sistema deve apresentar. |
| Alternar entre Celsius e Fahrenheit | Funcional | Correto: descreve uma interação que o sistema deve permitir. |
| Usar em dispositivos móveis | Não funcional | Deve ser tratado como responsividade/compatibilidade, pois define a qualidade e os contextos em que as funções devem funcionar, não uma função independente. |

Assim, os quatro primeiros itens estão classificados corretamente como funcionais. O antigo RF5 foi classificado incorretamente como funcional e foi movido para os requisitos não funcionais de responsividade e compatibilidade abaixo.

## Requisitos Não-Funcionais

- **RNF1 — Responsividade (inclui o uso em dispositivos móveis):** a interface e todas as funções devem se adaptar a telas móveis sem perda de conteúdo ou operação; larguras mínimas, orientação e suporte a tablets ainda precisam ser definidos.
- **RNF2 — Usabilidade:** busca, clima atual, previsão e unidade selecionada devem ser compreensíveis e fáceis de localizar.
- **RNF3 — Acessibilidade:** controles e informações devem ser utilizáveis por pessoas com diferentes necessidades de acesso, incluindo navegação por teclado e tecnologias assistivas; nível de conformidade e critérios específicos precisam ser acordados.
- **RNF4 — Desempenho:** busca e consulta devem responder em tempo adequado para o usuário; estabelecer metas de tempo de resposta para busca e carregamento dos dados, além das condições de rede usadas na medição.
- **RNF5 — Compatibilidade:** navegadores e versões de sistemas operacionais suportados precisam ser definidos.
- **RNF6 — Confiabilidade dos dados:** as informações meteorológicas devem indicar a cidade consultada e o período a que se referem; frequência de atualização e fonte ainda precisam ser definidas.
- **RNF7 — Disponibilidade e recuperação:** definir a disponibilidade esperada do serviço e o comportamento quando a aplicação ou a fonte meteorológica estiver indisponível, incluindo mensagem de erro e possibilidade de tentar novamente.

### Requisitos não funcionais a detalhar

Responsividade, acessibilidade e desempenho já constavam na lista original, mas ainda sem critérios verificáveis. Disponibilidade não estava expressa como requisito. Para tornar esses requisitos testáveis, recomenda-se acordar critérios de aceite antes da especificação, por exemplo:

- **Responsividade:** definir larguras de tela e dispositivos suportados e verificar que busca, dados atuais, previsão e controle de unidade continuam utilizáveis nesses tamanhos.
- **Acessibilidade:** escolher um nível de conformidade (por exemplo, WCAG 2.2 nível AA, sujeito à aprovação do produto) e validar teclado, foco visível, nomes acessíveis e contraste.
- **Desempenho:** estabelecer limites máximos de resposta para busca e exibição dos dados, medidos em condições de rede e dispositivo acordadas.
- **Disponibilidade:** estabelecer uma meta de disponibilidade e definir a experiência de recuperação para indisponibilidade da API, falha de rede e novas tentativas.

Os exemplos acima são propostas para orientar a decisão, não metas já aprovadas; valores, escopo de medição e exceções permanecem em aberto.

## Riscos

| Categoria | Risco | Probabilidade | Impacto | Estratégia de mitigação |
| --- | --- | --- | --- | --- |
| Produto | Público, necessidades e critérios de sucesso não estão definidos, levando a uma experiência que não resolve a principal necessidade dos usuários. | Média | Alto: investimento pode não gerar adoção ou valor percebido. | Validar personas, casos de uso prioritários e métricas de sucesso com usuários e stakeholders antes de fechar a especificação. |
| Produto | Escopo ambíguo (por exemplo, o significado de “5 dias”, quais dados mostrar e se haverá localização automática) produz expectativas divergentes. | Alta | Alto: retrabalho, atrasos e critérios de aceite incompatíveis. | Resolver as perguntas em aberto, documentar decisões e obter aprovação do escopo e dos critérios de aceite. |
| Produto | Busca seleciona uma cidade homônima ou localização incorreta. | Média | Alto: usuário toma decisões com dados de outro local e perde confiança no app. | Mostrar região e país nos resultados, permitir confirmação da localidade e testar casos de cidades homônimas. |
| Produto | Dados apresentados não correspondem ao que usuários entendem por “clima atual” ou previsão útil. | Média | Alto: informação pode ser interpretada incorretamente e reduzir a confiança no produto. | Definir variáveis, granularidade, fuso horário, horário de atualização e explicação da fonte; validar a apresentação com usuários. |
| Produto | Interface ou conteúdo não atende usuários móveis ou pessoas com necessidades de acessibilidade. | Média | Alto: parte do público não consegue completar tarefas essenciais. | Definir matriz de dispositivos e critérios de acessibilidade; validar responsividade, teclado, leitores de tela e contraste. |
| Técnico | API de geocodificação ou previsão fica indisponível, lenta ou sujeita a limites de uso. | Média | Alto: busca ou consulta pode falhar para todos ou parte dos usuários. | Avaliar limites, disponibilidade, licenças e custos da fonte; tratar falhas explicitamente, monitorar dependências e oferecer nova tentativa. |
| Técnico | Dados meteorológicos chegam atrasados, incompletos ou com cobertura insuficiente para a localização. | Média | Alto: informações podem ser desatualizadas ou indisponíveis. | Avaliar cobertura e atualização da fonte; exibir horário de atualização e indisponibilidade, e não apresentar dados antigos como atuais. |
| Técnico | Latência de rede ou do serviço torna a busca e a consulta lentas. | Média | Médio/Alto: aumenta abandono e prejudica o uso em redes móveis. | Estabelecer metas de desempenho, medir em redes e dispositivos representativos, reduzir chamadas desnecessárias e usar carregamento progressivo quando apropriado. |
| Técnico | Falha de conectividade deixa a tela sem resultado ou sem orientação de recuperação. | Alta | Médio: usuário não consegue concluir a consulta durante a falha. | Implementar estados claros de carregamento, erro e vazio, permitir nova tentativa e decidir explicitamente se cache ou modo offline fazem parte do escopo. |
| Técnico | Conversão ou alternância entre Celsius e Fahrenheit fica inconsistente em diferentes componentes. | Baixa | Alto: exibição incorreta pode induzir decisão equivocada. | Manter uma unidade canônica internamente, converter somente na apresentação e testar todos os valores e estados da interface para ambas as unidades. |
| Técnico | Dados de localização ou histórico de busca são coletados ou armazenados além do necessário. | Baixa/Média | Alto: exposição de informação sensível, perda de confiança ou obrigação regulatória. | Minimizar coleta e retenção, pedir permissão quando aplicável, documentar finalidade e proteger qualquer dado armazenado conforme as políticas da empresa. |
| Técnico | Diferenças entre navegadores, sistemas operacionais e tamanhos de tela causam falhas de interface. | Média | Médio: funções essenciais podem ficar difíceis ou impossíveis de usar em certos dispositivos. | Definir navegadores e dispositivos suportados e executar testes responsivos e de compatibilidade nos ambientes prioritários. |

## Perguntas em Aberto

As perguntas abaixo precisam de resposta para transformar o briefing em escopo e critérios de aceite. O impacto descreve o risco de decidir por omissão.

### Produto e público

1. **Quem são os públicos prioritários e em quais situações usarão o app (por exemplo, consulta rápida diária ou planejamento de viagem)?** Impacto: sem conhecer as necessidades prioritárias, não é possível decidir a hierarquia das informações nem avaliar se a experiência atende aos usuários mais importantes.
2. **Qual problema de negócio o app deve resolver e como será medido o sucesso (por exemplo, consultas concluídas, retorno de usuários ou satisfação)?** Impacto: sem objetivo e métricas, decisões de escopo e prioridades não terão uma medida comum de valor.
3. **O produto é apenas um site responsivo ou também deve ser instalável como PWA ou publicado em lojas de aplicativos?** Impacto: muda expectativas de instalação, notificações, funcionamento offline, compatibilidade e esforço de entrega.
4. **Quais funções fazem parte do escopo além da consulta básica: cidades favoritas, histórico, compartilhamento, alertas ou notificações?** Impacto: sem delimitação, há risco de incluir ou excluir capacidades esperadas, alterando arquitetura, prazo e critérios de aceite.
5. **Há identidade visual, conteúdo, tom de voz ou diretrizes de marca obrigatórios?** Impacto: a interface pode ser incompatível com a marca ou exigir retrabalho de design e conteúdo.

### Busca e localização

6. **A busca aceita nomes de cidades, localidades, códigos postais ou outros tipos de localização?** Impacto: determina o comportamento da busca, os dados necessários e a cobertura geográfica.
7. **A busca deve sugerir resultados enquanto o usuário digita, exigir envio explícito ou aceitar busca parcial e erros de digitação?** Impacto: define a interação, o volume de chamadas ao serviço e as expectativas de resposta.
8. **Como identificar e ordenar cidades homônimas (país, região, coordenadas ou distância)?** Impacto: sem desambiguação suficiente, o usuário pode ver a previsão de um local incorreto.
9. **Qual cobertura geográfica é necessária, incluindo países, localidades pequenas e alfabetos/acentos diferentes?** Impacto: pode limitar a fonte de geocodificação e deixar usuários sem resultados adequados.
10. **A consulta deve começar por busca manual, localização automática do dispositivo ou ambas? Se houver localização automática, quando solicitar permissão e qual alternativa oferecer se for negada?** Impacto: afeta o fluxo inicial, as permissões e a privacidade; sem alternativa, alguns usuários podem ficar sem conseguir consultar.
11. **A localização selecionada deve permanecer durante a navegação ou ser lembrada quando o usuário retornar?** Impacto: define se será necessário persistir estado local ou conta de usuário e altera a experiência entre sessões.

### Dados meteorológicos e apresentação

12. **[Decidido parcialmente] A fonte será Open-Meteo, sem API key. Quais limites de uso, custos, atribuição obrigatória ou condições de licenciamento devem ser considerados?** Impacto: a fonte está definida, mas os termos e limites ainda podem afetar viabilidade, conformidade, confiabilidade e custos operacionais.
13. **O que significa “clima atual”: observação medida, condição mais recente disponível ou estimativa? Qual atraso máximo é aceitável?** Impacto: sem definição, o usuário pode interpretar dados defasados como observações em tempo real.
14. **[Decidido parcialmente] A previsão de cinco dias será hoje + quatro dias. Qual fuso horário define a virada do dia e como lidar com dados incompletos para o dia atual?** Impacto: o intervalo está definido, mas sem fuso e regra para dados parciais os rótulos e a quantidade de informação podem variar por local.
15. **A previsão deve ser diária, horária ou ambas? Quais períodos do dia, se houver, precisam ser exibidos?** Impacto: determina o volume de informação, a estrutura da interface e os dados exigidos da fonte.
16. **Quais variáveis devem aparecer no clima atual e na previsão (por exemplo, mínima/máxima, sensação térmica, precipitação, vento, umidade ou índice UV)?** Impacto: sem uma lista, o produto pode não atender às decisões do usuário ou apresentar informação excessiva; também afeta fonte e layout.
17. **Como devem ser representadas condições meteorológicas, ícones, probabilidades e alertas? Há necessidade de explicações ou atribuição da fonte?** Impacto: interpretações inconsistentes ou pouco claras podem induzir decisões equivocadas.
18. **[Decidido parcialmente] A unidade inicial será Celsius. A preferência escolhida pelo usuário deve persistir entre cidades, recargas ou sessões?** Impacto: o padrão está definido, mas a persistência continua em aberto e pode exigir armazenamento local ou perfil; não há persistência de servidor decidida.
19. **Além da temperatura, quais unidades usar para vento, precipitação, pressão e distância? Devem ser fixas ou seguir região/preferência?** Impacto: alternar apenas a temperatura pode deixar valores incompatíveis com a expectativa regional e gerar leituras confusas.
20. **Com que frequência os dados devem ser atualizados e o usuário poderá atualizá-los manualmente?** Impacto: afeta atualidade percebida, consumo de API, desempenho e limites de uso.
21. **Como indicar a fonte, horário da última atualização e indisponibilidade de dados para uma localização?** Impacto: sem contexto e transparência, o usuário não consegue avaliar a atualidade nem a confiabilidade do resultado.

### Qualidade, operação e restrições

22. **[Decidido parcialmente] O idioma da interface será pt-BR. Quais formatos de data/hora e convenções regionais devem ser aplicados, e haverá suporte a outros idiomas?** Impacto: o idioma inicial está definido, mas formatos e eventual internacionalização adicional afetam compreensão, implementação e cobertura.
23. **Quais navegadores, versões, sistemas operacionais, larguras de tela e orientações devem ser suportados?** Impacto: sem uma matriz de suporte, não é possível validar compatibilidade de forma consistente.
24. **Qual nível de acessibilidade será exigido e quais tecnologias assistivas/dispositivos devem ser considerados?** Impacto: sem critérios de conformidade e validação, barreiras de acesso podem permanecer invisíveis até a entrega.
25. **Quais metas de desempenho são esperadas para carregar a interface, buscar uma cidade e exibir os dados, e em quais condições de rede/dispositivo?** Impacto: “rápido” não é verificável sem limites e condições de medição; problemas de latência podem comprometer o uso.
26. **Qual disponibilidade é esperada e quais dependências estão dentro desse compromisso (site, geocodificação e previsão)?** Impacto: sem objetivo e fronteiras de medição, não há como definir prioridade operacional ou avaliar se o serviço é confiável.
27. **O que o usuário deve ver quando a busca não encontra resultados, a API falha, os dados estão incompletos ou a rede cai? É necessário cache ou modo offline?** Impacto: define estados de erro e recuperação; sem isso, a experiência pode terminar em tela vazia ou dados desatualizados sem aviso.
28. **Há limites esperados de tráfego, crescimento, regiões de hospedagem ou requisitos de escalabilidade?** Impacto: dimensionamento inadequado pode causar lentidão, indisponibilidade ou custos inesperados.
29. **Quais dados pessoais serão coletados (por exemplo, localização precisa ou histórico de buscas), por quanto tempo e para quais finalidades?** Impacto: sem minimização, transparência e política de retenção, há risco de violar expectativas de privacidade e obrigações legais.
30. **Há requisitos de segurança, privacidade, conformidade ou retenção de dados definidos pela empresa ou pela legislação aplicável?** Impacto: decisões tardias podem exigir mudanças de arquitetura, consentimento, armazenamento ou operação.
31. **O app terá publicidade, monetização, analytics ou compartilhamento de dados com terceiros?** Impacto: afeta privacidade, consentimento, desempenho, experiência e escolha de fornecedores.
32. **Quem será responsável por monitoramento, suporte, tratamento de incidentes e comunicação de falhas?** Impacto: sem responsabilidades operacionais, falhas podem permanecer sem diagnóstico ou resposta adequada.

## Decisões

| Decisão | Justificativa | Perguntas em aberto que resolve |
| --- | --- | --- |
| **Fonte de dados: Open-Meteo, sem API key.** | Define a dependência de dados meteorológicos e evita exigir configuração de uma chave de API para o uso previsto. | Resolve a escolha inicial da fonte meteorológica e de geocodificação (pergunta 12). Limites de uso, atribuição, cobertura, disponibilidade e condições de licenciamento ainda precisam ser verificados. |
| **Período da previsão: hoje + quatro dias seguintes.** | Torna explícito o intervalo de cinco dias e dá uma base comum para a especificação e os critérios de aceite. | Resolve se o período inclui hoje ou começa amanhã (pergunta 14). Fuso horário e tratamento de dados incompletos do dia atual permanecem em aberto. |
| **Unidade padrão: Celsius.** | Define uma apresentação inicial consistente para todos os usuários, mantendo a alternância para Fahrenheit prevista no briefing. | Resolve qual unidade será exibida inicialmente (pergunta 18). Persistência da preferência escolhida pelo usuário entre sessões continua em aberto. |
| **Sem autenticação e sem persistência de servidor.** | Mantém o escopo inicial sem contas de usuário nem armazenamento de dados associado a uma conta no servidor. | Resolve se o escopo exige autenticação e persistência de dados no servidor. Não decide se haverá armazenamento local no dispositivo, nem inclui automaticamente favoritos ou histórico. |
| **Idioma da interface: pt-BR.** | Define o idioma inicial da experiência e evita deixar a tradução da interface indefinida para a primeira versão. | Resolve o idioma inicial da interface (pergunta 22). Formatos de data/hora, convenções regionais e eventual suporte a outros idiomas permanecem em aberto. |

## Suposições

- O produto deve permitir que a consulta seja iniciada pela escolha ou busca de uma cidade, pois o briefing não menciona localização automática.
- Celsius e Fahrenheit se referem à apresentação de temperaturas; outras unidades meteorológicas não foram especificadas.
- A aplicação depende de dados meteorológicos externos do Open-Meteo e de conexão para realizar consultas; comportamento sem conexão ainda precisa de decisão.
- A previsão de cinco dias cobre hoje e os quatro dias seguintes; fuso horário e tratamento de dados incompletos ainda precisam ser definidos.
- Celsius é a unidade inicial e a interface será apresentada em pt-BR.
- Não há requisitos informados de autenticação, perfil de usuário, favoritos ou persistência de preferências; não se presume que essas funções façam parte do escopo.
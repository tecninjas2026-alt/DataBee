# D15 — começar sem custo e permitir evolução futura

## Decisão recebida

Em 23/10/2026, a professora autorizou no chat: “isso, podemos iniciar gratuitamente e depois progredir para algo pago”. O teto autorizado agora é **zero**: não habilitar cobrança, recarga, plano pago ou fallback pago. Uma migração paga futura exige decisão específica de orçamento. Sem criar conta ou aceitar termos em nome da equipe.

## Correção da recomendação de Gemini

Gemini foi sugerido por ter uma modalidade gratuita. A conferência dos [termos oficiais](https://ai.google.dev/gemini-api/terms), vigentes desde 23/03/2026 e consultados em 23/10, encontrou na seção Age Requirements uma restrição explícita a clientes destinados a pessoas menores de 18 anos ou que provavelmente sejam acessados por elas.

O DataBee envolve estudantes do ensino médio e testes escolares. Por isso o Gemini Developer API **não será ativado neste contexto**. Não basta colocar a chave em conta de um adulto ou no servidor para remover a restrição do aplicativo. A recomendação anterior foi corrigida à professora antes de qualquer envio de foto. O plano pago dessa mesma API não deve ser tratado como solução automática para essa cláusula.

Não foi verificada alternativa gratuita e elegível para ativação imediata. A [tabela atual de Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers/pricing) não inclui créditos para contas gratuitas; não prometer uma cota antiga. Outros serviços exigem avaliação própria de acesso, termos, imagem/schema, disponibilidade e qualidade; não escolher apenas pela palavra “grátis”.

## Trabalho independente do provedor

- Contrato BeeAnalysisV2/schema 2.0 e validador preparados na IMP-023.
- Prompt bee-v2 transcrito do [texto oficial no Notion](https://app.notion.com/p/9dbd3425eae4830bb2b8818cd38e1d9f), com montagem de contexto por lista explícita de campos. Nenhuma escolha de modelo, chave, envio externo ou tentativa de classificação.
- Catálogo deverá ser aprovado e versionado; o rascunho da IMP-070 não é promovido automaticamente. Região é opcional e limitada aos rótulos D10. Identidade, GPS exato e observação completa não entram no contexto.
- Salvar/histórico continuam funcionando sem IA. Nenhum resultado simulado passa por identificação real, métrica científica ou dado de produção.

## Próximo passo

Escolher serviço gratuito compatível com o público escolar e disponibilizar acesso somente no servidor. Se não houver opção adequada, manter o protótipo sem chamada real enquanto se prepara e valida o restante do fluxo. Não registrar D15 como integralmente resolvida: custo zero foi decidido; provedor elegível, conta, modelo e cotas operacionais ainda pendentes.

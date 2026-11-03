# Falha qualitativa confirmada — 02/11/2026

A professora informou que criou outra observação e solicitou análise nova no APK 1.0.7; a mesma foto foi sugerida como Jataí, embora ela informe Apis mellifera. A identificação fornecida pela usuária não é revisão independente do Prof. Rodrigo.

Consulta somente leitura, restrita aos metadados/resultados recentes da conta já vinculada ao relato anterior: a análise mais recente registra catalog_version v2-species-2026-11-02 (13 espécies), prompt_version bee-v2, modelo ministral-8b-2512, possible_match, qualidade adequate e somente sp-tetragonisca-angustula. Portanto, este caso não é explicado por reabertura do cache v1 nem ausência de Apis na lista. Não foram consultados GPS, perfil, e-mail ou foto privada. IDs/resultado bruto mantidos somente em .tmp ignorado.

A evidência textual do modelo menciona faixas amarelo-alaranjadas nas asas e infere tamanho/abelha sem ferrão. São afirmações do modelo, não fatos aceitos pelo projeto. A foto anexada não sustenta essas afirmações como diagnóstico seguro. O contrato valida estrutura/IDs, não a correspondência biológica; 12/12 e demais verificações técnicas anteriores não demonstram qualidade de identificação.

## Próxima verificação preparada

Comparar a configuração vigente com instruções revisadas que exigem distinguir estruturas visíveis, não inferir tamanho real sem escala e confrontar candidatas antes de escolher, preservando abstenção e até três possibilidades. Não citar Apis como resposta esperada no prompt nem forçar três IDs. Usar caso DEV com referência humana, referência independente de Jataí e controle sem abelha; separar de TEST reservado. Registrar versões, resultados e limites antes de promover qualquer alteração.

Solicitada autorização específica para enviar apenas a foto da abelha na flor, sem metadados/GPS/identidade, à mesma API Mistral, custo zero. A professora autorizou expressamente “Sim, usar essa foto no teste controlado”. Preparada rota administrativa de comparação, desligada por padrão, autenticada com credencial de operador existente, duas variantes fixas, JPEG sem EXIF até 5 MB, timeout, sem dados de conta, banco ou persistência. Instruções normais do app permanecem bee-v2. 15/15 verificações locais de acesso/limites e 37/37 regressão do adaptador aprovadas; teste real em preparação. Referências públicas podem ser usadas se essa for a preferência.

Estado: falha qualitativa real relatada e caminho técnico confirmado, correção de reconhecimento não demonstrada. APK 1.0.7 não deve ser apresentado como solução comprovada para esse erro. Não trocar automaticamente Jataí por Apis, não atribuir porcentagem, não ampliar piloto ou habilitar pagamento.

## Resultado real da comparação autorizada

Cinco gerações isoladas via mesma conta/modelo, sem persistência de observação:

| Entrada DEV | Instruções atuais | Instruções conservadoras | Limite |
|---|---|---|---|
| Abelha na flor, informada como Apis mellifera pela usuária | Jataí, possible_match | inconclusive, sem candidatas | Não reconheceu Apis em nenhuma variante |
| Referência licenciada de Tetragonisca angustula | inconclusive | inconclusive | Nenhuma variante sugeriu a espécie de referência |
| JPEG artificial sem abelha | — | no_match | Controle negativo preservado |

Um ensaio adicional usou recorte retangular da foto fornecida, mantendo a abelha e sem acrescentar resposta ao prompt: o baseline repetiu Jataí. Isso não isola matematicamente o efeito de enquadramento, mas não sustentou tratar este erro apenas como falta de recorte. Somente o nome/status do resultado adicional foi publicado; fotografia/recorte permanecem em .tmp.

As instruções conservadoras NÃO foram promovidas: trocar um erro por abstenção nesse caso não demonstra reconhecimento suficiente. O app continua com bee-v2, sem novo APK, alteração dos resultados pessoais, espécies forçadas ou porcentagens. A comparação foi de DEV pequeno e escolhido por relato; não é métrica de acurácia geral/TEST ou validação científica. Os nomes esperados têm proveniência distinta (relato da usuária vs referência pública licenciada).

A rota administrativa foi desligada após os ensaios; chamada de operador confirmou evaluation_disabled/503. Participante e anônimo receberam 401 antes de geração. 4/4 verificações pós-ensaio do cache/acesso do endpoint normal passaram, sem novas tentativas ou reescrita.

O painel https://console.mistral.ai/ não abriu no navegador interno (conexão reiniciada). Não houve upgrade, pagamento ou troca de modelo sem verificar a condição gratuita. Próximo trabalho: conferir plano/limites e capacidade de outro modelo visual elegível na mesma conta, comparar nesse DEV e em referências adicionais antes de promover. Não solicitar repetição no celular como se uma correção estivesse pronta.

Referência Jataí: [Bibafu, Tetragonisca angustula.JPG](https://commons.wikimedia.org/wiki/File:Tetragonisca_angustula.JPG), CC BY-SA 3.0, mesma referência DEV documentada em 29/10; usada redimensionada/reencodada sem EXIF. Nenhuma imagem anexada ao Git/Notion.

Documentação primária consultada: [Mistral Vision](https://docs.mistral.ai/studio/conversations/vision) e [Playground/free mode](https://docs.mistral.ai/getting-started/quickstarts/studio/test-model-playground). Documentação pública não substitui conferir plano/limite efetivo desta conta para mudar modelo.

# Comparação gratuita de modelo — 03/11/2026

Usuária orientou: se não for possível avançar gratuitamente, manter o protótipo atual. Não há autorização de cobrança.

Painel oficial https://admin.mistral.ai/subscription aberto após console.mistral.ai falhar: plano Gratuito, franquia mensal de API/Studio inclusa de US$ 10, uso exibido US$ 0; API Pay-as-you-go mostra Ativar (inativo). Nenhuma configuração de conta foi alterada. Limites atuais listam ministral-14b-2512: 937.500 tokens/minuto e 0,50 requisições/segundo, além do 8b atual. API privacy: treinamento desligado e Labs desligados. Isso permite ensaio dentro da franquia sem ativar pagamento, não significa API ilimitada ou modelo intrinsecamente gratuito.

Somente a porta administrativa de DEV passa a testar ministral-14b-2512, estável/versionado e suportado oficialmente. O provedor normal do app continua configurado por MISTRAL_MODEL, sem mudança nesta preparação. Rota de DEV permanece desligada por padrão e exige credencial de operador existente. Catálogo de 13 e prompt bee-v2 preservados para comparação, sem revelar espécie esperada ao modelo.

Usar somente foto da abelha na flor já autorizada, referência DEV de Jataí e controle sem abelha; sem metadados, GPS, identidade ou alterações de observações. Resultados em preparação, não promover sem evidência. Se o acesso exigir pagamento ou o resultado não melhorar, manter como estava. Sem novo APK nesta etapa.

Referências oficiais: [assinatura](https://docs.mistral.ai/admin/billing-usage/subscriptions), [modelo](https://docs.mistral.ai/models/ministral-3-14b-25-12).

## Resultado e encerramento

A primeira chamada 14b não entregou identificação válida (HTTP 502). Adicionada temporariamente somente uma classificação sanitizada de erro da porta DEV, com 15/15 verificações locais e TypeScript; segunda chamada informou HTTP 429 / limited. Nenhum desses erros é resultado biológico, acerto ou evidência de que o modelo 14b identifica melhor/pior. Não houve comparação concluída nas três imagens, fallback ou retry automático.

Seguindo a instrução da usuária de preservar o protótipo quando não houver avanço gratuito, não foram feitas novas gerações, upgrade, ativação PAYG ou troca de modelo normal. Código temporário da porta de avaliação e índice do serviço restaurados exatamente ao HEAD anterior, incluindo provedor normal ministral-8b-2512 configurado pelo servidor. A flag administrativa foi desligada em finally; serviço original reimplantado e consulta de cache/acesso conferida. APK continua 1.0.7-test/código 8, sem nova instalação.

A resposta 429 indica limite da chamada; não permite afirmar que o 14b é pago, que toda a franquia mensal acabou ou quando o limite se renova. Painel continua indicando plano Gratuito, PAYG inativo. O protótipo pode seguir sendo testado com a limitação de reconhecimento já documentada. Nada foi reescrito em observações e a IA continua sugestão não validada.

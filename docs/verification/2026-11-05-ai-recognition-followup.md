# Reavaliação da identificação em 5 de novembro de 2026

## Resultado

A professora informou que imagens já usadas passaram a receber somente análise inconclusiva e pediu atualização do aplicativo. A consulta real confirma quatro análises recentes inconclusivas, sem candidatas, registradas em 4 e 5 de novembro. Todas usam ministral-8b-2512, bee-v2 e catálogo v2-species-2026-11-02. Os resultados anteriores de 3 de novembro ainda estão salvos. Nenhuma correção de reconhecimento foi demonstrada nesta execução.

O aplicativo lê corretamente o estado persistido. Erros técnicos não estão sendo convertidos em inconclusivo por esse caminho. As imagens recentes foram lidas localmente para diagnóstico: JPEGs abrem, dimensões entre 1220×1048 e 2048×1536, tamanhos declarados conferem com os arquivos. Algumas são fotos de tela ou impressão. Isso pode reduzir detalhe útil, mas não comprova a causa exclusiva da abstenção do modelo nem uma regressão de processamento.

Download da função publicado pela CLI interrompeu a extração ao atingir o catálogo fora da pasta de funções. Sem contornar a proteção: os três arquivos já extraídos de prompt, adaptador Mistral e entrada da função foram comparados à origem anterior e eram idênticos após normalização de finais de linha. Essa verificação não é uma comparação integral de todos os arquivos remotos.

## Conta e limites

Admin oficial consultado em 05/11: plano Gratuito, uso incluso de API exibido US$ 0,01 de US$ 10; Pay-as-you-go inativo; treinamento da API e Labs desligados. Nenhuma configuração de conta, pagamento ou chave foi alterada. Usar franquia inclusa não torna o modelo intrinsecamente gratuito nem garante disponibilidade permanente.

## Comparações DEV

Somente a foto da abelha na flor já autorizada foi reenviada à mesma API Mistral, sem metadados. Referência independente: Bibafu, Wikimedia Commons, Tetragonisca angustula.JPG, CC BY-SA 3.0, já usada em DEV. Controle negativo: JPEG sintético sem abelha. As outras fotos recentes da professora foram somente inspecionadas localmente, sem envio ao provedor.

| Candidato | Foto autorizada com rótulo humano Apis | Referência Jataí | Controle sem abelha |
|---|---|---|---|
| Ministral 14B com bee-v2 | Inconclusivo | Inconclusivo | no_match |
| Mistral Large 2512 | Erro de configuração/acesso na primeira chamada | Não executado | Não executado |
| Mistral Small 2603 | HTTP 429 limited na primeira chamada | Não executado | Não executado |
| Ministral 8B com instrução DEV balanceada | Apis na primeira posição, com evidência visual incorreta | Inconclusivo | no_match |

A instrução balanceada pediu avaliar detalhe visível sem exigir microscopia, comparar o catálogo inteiro e preservar a possibilidade de abstenção. Apesar do nome Apis coincidir com o rótulo fornecido pela professora, a resposta inventou faixas amarelas nas asas e utilizou tamanho relativo às flores como evidência. Por isso foi rejeitada; acertar o nome isoladamente não demonstra identificação confiável. O rótulo humano Apis desta foto não recebeu validação científica independente nesta execução. Nenhum ajuste usou conjunto TEST reservado.

Nenhum modelo ou prompt foi promovido. HTTP 429 não comprova esgotamento mensal nem necessidade de pagar. O modelo Large 2512 está marcado como descontinuado na documentação atual e não foi selecionado para integração. Large 4 está em preview e não atende à regra atual de modelo estável; não foi chamado.

## Mudança técnica entregue

Comparações administrativas agora podem selecionar um modelo por BEE_AI_EVALUATION_MODEL no servidor, independentemente de MISTRAL_MODEL da análise normal. O participante não escolhe modelo ou prompt. A rota distingue códigos sanitizados de limite, timeout e resposta inválida, sem expor diagnósticos brutos. A instrução balanceada temporária foi retirada.

- 18/18 verificações locais das fronteiras administrativas e erros sanitizados.
- TypeScript estrito do backend e npm run check aprovados.
- Função implantada com JWT preservado, sem migração, alteração de permissões ou quotas.
- 4/4 verificações reais de cache/acesso após a implantação; resultado técnico anterior preservado, nenhuma nova tentativa de IA criada por consulta.
- Rota de avaliação desativada ao fim, confirmada por HTTP 503 com credencial de operador.
- Análise normal permanece ministral-8b-2512 e bee-v2; registros pessoais não foram reescritos.
- Nenhum APK novo publicado: não houve mudança do cliente nem melhora de reconhecimento comprovada.

## Próxima condição para uma atualização de reconhecimento

Conferir exemplos rotulados e suas características distintivas com a equipe científica, manter referências DEV licenciadas separadas do TEST e exigir respostas com evidências visuais sustentadas, além do nome esperado. Um modelo elegível precisa passar por essa avaliação dentro do teto zero antes da troca. A entrega técnica desta sessão facilita essa verificação, mas não resolve a limitação científica do reconhecimento.

## Referências

- https://docs.mistral.ai/inference/conversations/vision
- https://docs.mistral.ai/models/ministral-3-14b-25-12
- https://docs.mistral.ai/models/mistral-large-3-25-12
- https://docs.mistral.ai/models/mistral-large-4-0
- https://docs.mistral.ai/models/mistral-small-4-0-26-03
- https://commons.wikimedia.org/wiki/File:Tetragonisca_angustula.JPG
- Dados sanitizados: 2026-11-05-ai-recognition-dev.json.

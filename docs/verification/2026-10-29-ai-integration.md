# IA — integração do protótipo restrito, 29/10/2026

## O que funciona

Catálogo versionado com somente os 12 nomes/IDs já validados; uso restrito autorizado expressamente pela professora. Nenhuma família/gênero ou característica visual inventada. Servidor autentica, confere dono/registro privado/foto, reserva tentativa, revalida JPEG, chama Mistral uma vez e valida BeeAnalysisV2/IDs antes de gravar resultado+estado juntos.

Botão **Analisar foto com IA** na tela existente de resultado. Só o clique explícito solicita análise; mensagem informa envio da foto à Mistral e pede imagens sem rostos/informações pessoais. Reabrir/Consultar resultado lê o banco. Loading, falha, inconclusivo, nenhum candidato, limitações, nomes populares/científicos e evidências tratados; nenhuma porcentagem/validação humana fabricada.

## Banco aprovado e aplicado

Professora aprovou especificamente aplicar e testar a proposta `20261029190000_imp029_atomic_ai_attempts.sql`, depois da inspeção de dependências e dry-run somente dessa migration. Aplicada uma vez; imutável. Nova tabela de tentativas com RLS sem acesso de participantes/anônimos, token de tentativa e quatro RPCs somente servidor. Caps de segurança planejados: 3 reservas/observação e 20/usuário/dia UTC; lease 120 s. Nenhuma exclusão.

- **31/31 verificações SQL reais**, com SDK A/B/anônimo, concorrência real na mesma observação e entre observações do mesmo dono, quotas, dia UTC, rollback de resultado inválido, cache, lease vencido, token antigo e permissões. Conta técnica A atinge deliberadamente 20 reservas/dia; não resetar/excluir fixtures. JSON `2026-10-29-atomic-ai-remote.json`.
- **21/21 locais** do adaptador de persistência: projeção de RPC, referências, versões, booleanos, rejeição de candidato inventado/fixture e diagnóstico sanitizado. JSON `2026-10-29-bee-attempt-store-local.json`.
- **38/38** de regressão do handler: 33 sintéticos e 5 com SDK real, preservando autenticação/ownership/limites de entrada. JSON `2026-10-29-analysis-handler-regression.json`.

## Primeiro teste real de imagem

**6/6 casos aprovados** contra o serviço implantado: JPEG artificial sem abelha/pessoa/GPS enviado uma vez; Mistral retornou `no_match`, schema e persistência conferidos. Segunda solicitação trouxe `cached:true`, mesmo ID/data de resultado e somente uma reserva. Usuário não liberado (403), outro dono (404) e anônimo (401) recusados. JSON `2026-10-29-ai-image-live.json`. Isso demonstra integração; **não mede acurácia com abelhas reais nem revisão científica**. Fixture preservada; nenhuma foto pessoal enviada pelo agente.

Segundo ensaio DEV: fotografia **Tetragonisca angustula.JPG**, de **Bibafu**, Wikimedia Commons, **CC BY-SA 3.0**. Fonte e licença conferidas; imagem inspecionada sem pessoas, reduzida a até 2048 px/reencodada em JPEG, sem EXIF, e validada pelo parser do servidor. Resultado real **inconclusive**, sem candidatos; 6/6 verificações de integração/cache/acesso também passaram. Sem ajuste do prompt ou interpretação como espécie correta/acurácia. JSON `2026-10-29-ai-bee-dev.json`. Não compõe o conjunto TEST reservado.

Crédito da referência DEV: [Bibafu — arquivo original, 2010](https://commons.wikimedia.org/wiki/File:Tetragonisca_angustula.JPG), [licença CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Alterações: apenas tamanho/reencode e remoção de metadados. Cópia processada mantém CC BY-SA 3.0; arquivo em `.tmp`, sem embutir no APK ou feed público. Autor/fonte não endossam o DataBee ou seu modelo.

## Liberação operacional limitada

Escolha técnica de piloto fechado: somente a conta do registro já confirmado da professora e a conta técnica B. IDs ficam apenas na configuração do servidor, não no Git/Notion/APK. Outros participantes recebem recusa antes de foto/custo. Não ampliar para alunos/público geral sem conferir consentimentos e condições de uso; os termos institucionais Mistral exigem consentimento adequado dos responsáveis para menores. Nenhuma afirmação de consentimento dos alunos foi feita.

Privacidade da API conferida novamente no painel: treinamento desligado, Labs desligado. Assinatura Gratuito, franquia inclusa e Pay-as-you-go não ativado. Não houve cartão, compra, recarga, upgrade ou fallback pago. Modelo estável `ministral-8b-2512`, documentação de visão/schema e teste real de schema no piloto. Secret nunca no cliente/Git/Notion/logs. Conta, fonte e escopo revisados apenas para esse teste adulto/técnico; não equivalem à aprovação de implantação escolar geral.

## Pendente

Browser autenticado da professora: tela de resultado e botão/disclosure conferidos em 360 × 800, conteúdo sem overflow horizontal; nenhuma foto pessoal enviada. Botões com área mínima de 44 px. Reabertura permaneceu leitura, sem disparo automático. Estado com candidatos/qualidade em fotos pessoais e teste físico continuam pendentes.

Teste físico do novo APK, fotos DEV autorizadas de abelhas com avaliação humana, demais critérios de Gate 2/SMTP e liberação mais ampla. C05, revisão científica educativa, imagens de referência pendentes, feed/publicação e descarte remoto continuam separados. Preparar APK 1.0.4-test/código 5 e publicar no Notion pelo padrão existente. Nenhuma task inteira marcada Done por estas verificações.

Referências oficiais: [Mistral — condições institucionais, seções 1.4 e 2.2(c)](https://legal.mistral.ai/terms/commercial-terms-of-service/), [opt-out separado da API](https://help.mistral.ai/en/articles/455207-can-i-opt-out-of-my-input-or-output-data-being-used-for-training), [modelo e capacidades](https://docs.mistral.ai/models/ministral-3-8b-25-12).

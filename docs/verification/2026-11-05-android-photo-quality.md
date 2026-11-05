# Android 1.0.8 e novas referências de identificação

## Alterações no aplicativo

- JPEG de novos registros usa qualidade 0,92 em vez de 0,85, com o mesmo limite de 2048 pixels e 5 MB. Reencode continua removendo EXIF; não amplia imagens pequenas.
- Referências locais de recuperação guardam a versão do encoder. Envios anteriores sem esse campo usam jpeg-v1/0,85, preservando conferência estrita dos bytes e hash. A imagem recuperada do servidor mantém essa versão. Não há alteração no banco remoto.
- Tela de foto orienta selecionar o arquivo original e avisa quando a imagem é pequena, sem impedir o salvamento.
- Resultado da análise mostra a foto privada correspondente. Reutiliza o componente existente, com autorização pelo dono, cancelamento e URL curta apenas em memória.
- Resultado inconclusivo explica que a observação está salva, que reabrir não faz outra chamada de IA e que as limitações também são produzidas pelo modelo. Atalho Registrar outra foto abre o fluxo existente sem apagar o registro.
- Android 1.0.8-test, código 9, mesma aplicação/assinatura. Instalar como atualização.

## Correção de contexto fornecida pela professora

A professora esclareceu que Jataí estava correta em um dos testes anteriores. Não generalizar o erro de Apis para todos os resultados Jataí. As três imagens novas foram rotuladas pela professora como Jataí (alaranjada), Tubuna (preta) e Apis mellifera (na flor). Esses são rótulos humanos fornecidos para comparação DEV, sem validação científica independente inferida.

Em 05/11 autorizou explicitamente o envio dessas três imagens à mesma API Mistral, sem metadados/GPS/dados da conta e com custo adicional zero. Imagens saneadas ficam somente no diretório local ignorado. Nenhuma imagem foi incluída no APK, Git ou Notion como catálogo de treinamento; nomes/arquivos esperados não foram enviados ao modelo.

## Resultado real dos novos testes

| Configuração isolada com bee-v2 | Jataí informada | Tubuna informada | Apis informada | Controle sem abelha |
|---|---|---|---|---|
| ministral-8b-2512 | Inconclusivo | Inconclusivo | Apis como candidata | no_match |
| ministral-14b-2512 | Inconclusivo | Inconclusivo | Apis como candidata | no_match |
| mistral-small-2603 | HTTP 429 limited | Não executado | Não executado | Não executado |

As entradas foram reencodadas sem EXIF, sem ampliar nem recortar, a partir dos arquivos autorizados. A imagem Apis fornecida tem 474×316 pixels; não inventar detalhe por ampliação. Nenhuma métrica global de acerto pode ser extraída dessa seleção pequena e informada pela usuária.

O modelo/prompt normal continuam 8B/bee-v2 e o catálogo continua com 13 espécies. O 14B não mostrou vantagem nesses exemplos e o Small foi interrompido ao primeiro limite, sem retry automático. Cobrança adicional/PAYG permanece inativa; não houve pagamento, troca de credenciais ou mudança de privacidade. A rota de avaliação é desligada em finally após cada comparação e novamente conferida com operador/HTTP 503 ao fim.

Esta atualização melhora o processamento e o fluxo da fotografia. Não comprova correção da identificação de Jataí ou Tubuna; não apresentar o novo APK como modelo treinado ou reconhecimento resolvido. Resultados já gravados não são reescritos nem reanalisados automaticamente.

## Verificações

- npm run check aprovado, sem novos avisos; android:sync aprovado.
- 25/25 verificações locais simuladas de upload/recuperação, incluindo referência antiga, encoder novo e rejeição de versão desconhecida. Não são provas novas de RLS remoto.
- 4/4 verificações no navegador com JPEG sintético: remoção de metadados pelo pipeline real, limite de dimensões/bytes, recuperação do encoder anterior com bytes idênticos e ausência de ampliação. A URI da galeria foi simulada; não é teste físico Android.
- Prévia controlada do resultado com foto/estado/atalho e quadro de 360 pixels; aviso de foto pequena e botão Continuar conferidos. Dados artificiais, sem sessão de participante ou chamadas de IA nessa prévia.
- Teste físico desta versão ainda pendente. Download, integridade e assinatura são registrados após gerar o APK.

Relatórios: `2026-11-05-three-labelled-photos.json` e `2026-11-05-photo-quality-recovery.json`.

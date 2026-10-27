# Android 1.0.2-test — consulta do resultado salvo

- Fonte: `4c30e488a233ca9ebc00bcf2ed38e666afbe58d9`; APK código 3 / versão 1.0.2-test, pacote com.tecninjas.databee, min API 24 / target 36.
- Build de produção aprovado, `cap sync android` e `assembleDebug`: **BUILD SUCCESSFUL**, 2m48s, 278 tarefas (33 executadas / 245 atualizadas). Avisos overridePathCheck/flatDir e leitura de XML do SDK não impediram a compilação; sem mudança de plugins ou permissões.
- Arquivo `.tmp/DataBee-2026-10-27-4c30e48-debug.apk`, **9.113.564 bytes**.
- SHA-256: `7fd7f0070b70bed887fef3f225087b5212921e76ac7f8ec343abb9bdd33ac234`.
- 44 assets web comparados byte a byte por SHA-256 com www validado; sem server.url/local host embutido.
- Assinatura verificada, mesmo certificado de 22/10 e 23/10: SHA-256 `6057817ca356a35baa87de581492ab2a0ff93c354cda93adb14e85b0a50d8043`. Instalar como atualização.
- [Release de teste](https://github.com/tecninjas2026-alt/DataBee/releases/tag/android-test-2026-10-27-4c30e48) e [download direto](https://github.com/tecninjas2026-alt/DataBee/releases/download/android-test-2026-10-27-4c30e48/DataBee-2026-10-27-4c30e48-debug.apk). Asset 682561170, tamanho/digest verificados no upload; download público HEAD HTTP 200, tamanho correto.
- [Página oficial do Notion](https://app.notion.com/p/401d3425eae4800c811ffcbc7967cc6a) atualizada com link no topo, notas em títulos/listas e seção 27/10 antes de 23/10 e 22/10. Estado **Disponível para teste**, sem aprovação física presumida. Arquivo excede 5 MB; hospedado no GitHub conforme padrão aprovado.

## O que muda

Detalhe → Ver resultado da análise: consulta dados guardados sem chamar IA. Estado Não analisada informa que o registro segue salvo. Inclui loading/erro/retry de leitura, status persistido e rótulo explícito de simulação técnica. Mantém login, câmera/galeria, GPS opcional, salvar e reabrir. **Não identifica fotos ainda**; integração, catálogo/nomes/candidatos, textos educativos, publicação/feed e descarte remoto pendentes.

Serviço 18/18 (SDK real e fronteiras locais), contrato 37/37, prompt 16/16 e navegador autenticado em 395 px aprovados. Não medem acurácia da IA. Ver `2026-10-27-analysis-read.md`. Teste Android da nova versão ainda não executado.

**Atualização posterior em 27/10:** a professora confirmou salvar o primeiro registro e reencontrar foto/dados após reabrir no celular. Estado atualizado no Notion para Em teste. Consulta específica de resultado não confirmada; não extrapolar aprovação integral. Detalhes em [relato humano](2026-10-27-android-save-device.md).

## Roteiro da equipe

1. Baixar pelo Notion e atualizar o aplicativo.
2. Entrar → Minhas observações → abrir um registro salvo → Ver resultado da análise.
3. Conferir Não analisada, voltar e reabrir. Foto/dados devem continuar disponíveis.

## Publicação e integridade do histórico

Durante a edição do link no Notion, uma seleção atingiu o corpo inteiro. A ação foi desfeita imediatamente (duas operações de undo: colagem e exclusão). A restauração foi conferida antes de continuar; os textos/testes/links de 23/10 e 22/10 foram verificados novamente pela interface. A publicação nova foi inserida preservando os blocos históricos; duplicações de título/instrução resultantes da colagem foram removidas individualmente pelo menu de bloco. Sem perda de histórico alegada ou alteração de resultados humanos anteriores.

Verificação local: `.tmp/apk-20261027-verification.json`, `.tmp/android-20261027-release.json`. Scripts temporários `.tmp/verify-apk-20261027.ps1` e `.tmp/publish-android-20261027.mjs`; credencial do Git capturada apenas no processo, sem exibição.

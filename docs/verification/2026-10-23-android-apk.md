# Android 1.0.1-test — 23/10/2026

**Estado:** Disponível para teste. Validação técnica aprovada; nova interface ainda não testada por humano no celular.

## Acesso

- [Página oficial de versões no Notion](https://app.notion.com/p/401d3425eae4800c811ffcbc7967cc6a), com acesso rápido, versão mais recente primeiro e histórico anterior preservado.
- [Baixar APK 1.0.1-test](https://github.com/tecninjas2026-alt/DataBee/releases/download/android-test-2026-10-23-ba10fcf/DataBee-2026-10-23-ba10fcf-debug.apk).
- [Notas no GitHub Releases](https://github.com/tecninjas2026-alt/DataBee/releases/tag/android-test-2026-10-23-ba10fcf).
- Cópia local: `.tmp/DataBee-2026-10-23-ba10fcf-debug.apk`.

O Notion Free limita anexos a 5 MB, conforme verificação anterior. Esta entrega usa download externo do GitHub Releases, não anexo binário direto no Notion.

## Conferência

| Item | Resultado |
|---|---|
| Código | ba10fcfd1958c3b02fd7fe0ba1126c5083f39d78, main enviada |
| Aplicativo | com.tecninjas.databee |
| Versão Android | 1.0.1-test / código 2 |
| Android mínimo / alvo | API 24 / 36 |
| Bytes | 9.109.852 |
| SHA-256 | 1842a30841c444e33b8df8f5576d3f0cdcc907ef588689ee754728d6c18ebebd |
| Assinatura | apksigner aprovado; certificado idêntico à versão de 22/10 |
| Interface empacotada | 44 arquivos www comparados por SHA-256 com assets/public do APK, todos iguais |
| Servidor local | capacitor.config.json sem server.url |
| Download público | HEAD HTTP 200, Content-Length 9.109.852 |
| Publicação | GitHub asset 669391148, estado uploaded e digest/tamanho conferidos |

`npm run check` passou sem warnings novos; `npm run android:sync` e `gradlew.bat assembleDebug --console=plain` aprovados. Gradle: 278 tarefas, 33 executadas, 245 atualizadas; avisos existentes de overridePathCheck, flatDir e XML do SDK. Nenhuma nova licença ou dependência.

## O que mudou e como testar

Salvar envia a foto tratada, guarda localização opcional só na tabela privada, valida o arquivo no servidor e confirma o registro privado sem IA. Minhas observações consulta salvos do dono e permite reabrir foto/dados. Contagem inicial agora vem do banco. Recuperação usa os mesmos IDs e confere os bytes da foto.

1. Pelo celular, baixar o APK e instalar como **atualização**, preservando os dados da instalação anterior.
2. Entrar com a conta já confirmada; exige internet.
3. Registrar → foto → Continuar → Salvar observação.
4. Fechar e reabrir → Minhas observações → Abrir observação. Conferir foto, origem e localização escolhida.

Não há IA, publicação/feed ou descarte remoto nesta versão. Cadastro novo/entrega/confirmação de e-mail continuam pendentes de validação própria. Os testes físicos de 22/10 ficam preservados no histórico; não foram atribuídos automaticamente ao novo APK.

Validação do novo fluxo: [22 casos locais de upload](2026-10-23-upload-local.json), [8 JPEG](2026-10-23-save-jpeg-local.json), [10 SDK A/B/anon](2026-10-23-save-remote.json) e [11 integração dos serviços Angular com servidor](2026-10-23-app-flow-remote.json). Limites e recursos sintéticos preservados em [registro técnico](2026-10-23-upload-save.md). UI visual foi bloqueada pela política da ferramenta do navegador, sem contorno. Nada disso comprova execução física no Android.

## Notion e continuidade

IMP-022/035/036/037 atualizadas com registro do agente, explicação para a equipe e estado In progress. Nenhum Done humano presumido. Página de versões conserva o padrão de títulos, listas, download visível e histórico. A professora delegou decisões técnicas em 23/10; continuar o trabalho já autorizado sem pedir repetidamente os mesmos comandos ou critérios.

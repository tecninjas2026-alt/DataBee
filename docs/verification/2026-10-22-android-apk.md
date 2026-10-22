# APK atualizado — 22/10/2026

Código: `08ab799` (main). APK de desenvolvimento para testes físicos, não publicação em loja.

## Preparação e execução

- Repositório atualizado com `git pull --ff-only`; nenhuma alteração no código do app.
- `npm run check` aprovado nesta sessão antes desta preparação (lint e produção).
- `npm run android:sync` aprovado; seis plugins existentes sincronizados.
- Instalados Platform-Tools e Build-Tools 35.0.0; Build-Tools 36.0.0 já presente. Licença Android já registrada no PC; nenhum aceite novo solicitado.
- Instalador Java usou `JAVA_TOOL_OPTIONS=-Djavax.net.ssl.trustStoreType=Windows-ROOT`, como a adaptação de certificados já usada pelo Gradle neste PC.
- Plataforma 36 estava registrada, mas faltavam android.jar, build.prop e outros arquivos principais. Recuperados do pacote oficial `https://dl.google.com/android/repository/platform-36_r02.zip`; SHA-1 conferido contra repository2-3.xml: `2c1a80dd4d9f7d0e6dd336ec603d9b5c55a6f576`. Arquivos principais repostos no SDK existente, sem exclusão de diretórios.
- `android/gradlew.bat assembleDebug --console=plain`: BUILD SUCCESSFUL, 278 tarefas (27 executadas).
- Avisos existentes: overridePathCheck, flatDir e versão de XML do SDK; não impediram a geração.

## Artefato e conferência

- Saída: `android/app/build/outputs/apk/debug/app-debug.apk`.
- Cópia para entrega local: `.tmp/DataBee-2026-10-22-08ab799-debug.apk` (ignorada pelo Git).
- Tamanho: **9.372.065 bytes**.
- SHA-256: `C7C5F45D79B4D6ECBF67B10B900A320917FA599B7F68FA0BA08FE1CC2B523B1B`.
- Assinatura: `apksigner verify --verbose` aprovado, esquema v2, um assinante.
- Manifesto: DataBee, `com.tecninjas.databee`, versão 1.0/código 1, mínimo API 24, alvo API 36.
- 41 arquivos de www comparados por SHA-256 com as entradas assets/public do APK: todos iguais.
- capacitor.config.json empacotado sem server.url: interface incluída no APK; login exige internet com Supabase.
- aapt não aceita o caminho com acento neste PC; manifesto inspecionado por cópia temporária em caminho ASCII, com SHA-256 idêntico.

## Limites e próximo passo

Nenhuma instalação ou execução em aparelho nesta rodada. Os 11 casos da IMP-021 continuam pendentes de observação humana no celular. Nenhum Done atribuído. Cadastro/confirmação real de e-mail e sessão IMP-033/034 continuam pendentes; salvamento e IA não foram implementados por este build.

Notion consultado em leitura no navegador durante a sessão; escrita autenticada indisponível. Nenhum status oficial alterado. Nenhum dado remoto, permissão do banco, dependência do app ou segredo alterado.

## Explicação para a equipe

O build transforma a interface e os plugins em um instalador Android. A assinatura permite ao Android conferir a integridade do instalador. Conferir o pacote no computador não comprova câmera, GPS e permissões no aparelho: isso vem no teste físico.

Instalar este APK atualizado, entrar com uma conta de teste e seguir os 11 casos em `2026-10-21-imp-021-034-checkpoints.md`. Fotos da galeria não recebem GPS atual; localização permanece opcional nas fotos da câmera. Salvar continua desabilitado.

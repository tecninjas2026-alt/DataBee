# Versões Android para testes — DataBee

Página oficial: [Versões Android para testes — DataBee](https://app.notion.com/p/401d3425eae4800c811ffcbc7967cc6a), no Guia de execução, em **Comece por aqui**.

Cada versão terá APK acessível, data, código de origem, estado e descrição simples. Um APK compilado não significa aprovação no celular. O Notion Free recusou o anexo de 9,4 MB por limitar arquivos a 5 MB; o APK foi hospedado no GitHub Releases e seu download direto está no Notion.

| Versão | Estado | Permite testar | Falta | Arquivo |
|---|---|---|---|---|
| 22/10/2026 · 08ab799 | Em teste — login, câmera, galeria e GPS confirmados pela professora no Galaxy S24 Ultra / Android 16 | Foto, localização e acesso com conta confirmada | Casos de interrupção/permissão e sessão; cadastro/confirmação completos; salvar e IA ainda não disponíveis | [Baixar APK — 9,4 MB](https://github.com/tecninjas2026-alt/DataBee/releases/download/android-test-2026-10-22-08ab799/DataBee-2026-10-22-08ab799-debug.apk) |

Arquivo local: `.tmp/DataBee-2026-10-22-08ab799-debug.apk`. Evidência: `docs/verification/2026-10-22-android-apk.md`.

Próxima rodada: concluir interrupções/permissões e sessão no aparelho, além do cadastro/confirmação no navegador. A equipe iniciou os testes físicos após a publicação. Usar estados Em preparação, Disponível para teste, Em teste, Aprovada pela equipe e Substituída; preservar o histórico. Evidência: `docs/verification/2026-10-22-android-device-report.md`.

Instalar: baixar o APK da versão escolhida no Notion, abrir no Android e instalar/atualizar. Login exige internet. Se houver erro na atualização, registrar a mensagem e conferir a assinatura antes de sugerir desinstalação.

## Padrão obrigatório de organização

Usar Markdown convertido em blocos nativos do Notion:

- `## Acesso rápido`: download direto da versão mais recente e índice das anteriores, no topo.
- `## DD/MM/AAAA · código XXXXXXX`: uma seção por versão, da mais recente para a mais antiga.
- `### Estado`, `### Permite testar`, `### Ainda falta`, `### Download e instalação`.
- Listas curtas, rótulos claros e links descritivos; informar tamanho, Android mínimo e necessidade de internet.
- `## Próximas versões` e `## Padrão de publicação do projeto`, separados das versões já disponíveis.

## Padrão obrigatório de publicação

1. Gerar de código identificado; conferir compilação, assinatura, conteúdo, tamanho e SHA-256; registrar a evidência técnica.
2. Nomear `DataBee-AAAA-MM-DD-CODIGO-debug.apk` e preservar arquivos e notas anteriores. Não sobrescrever silenciosamente um APK.
3. Publicar e atualizar a página oficial do Notion. Link local no chat não substitui a entrega compartilhada.
4. Anexar no Notion quando permitido; se exceder o limite, publicar uma prévia de teste no GitHub Releases e manter no Notion o download direto e as notas. Não contratar plano ou serviço por suposição.
5. Só atribuir aprovação da equipe depois dos resultados humanos; compilação não prova câmera/GPS no celular.

## Linguagem e continuidade

Consultar sempre o Guia de execução e Template operacional do Notion, `AGENTS.md`, `docs/HANDOFF.md` e `docs/guides/student-communication.md`. Memória ajuda a retomar; documentos oficiais e estado atual orientam a execução.

Usar português simples, explicar termos novos, executar o trabalho técnico já autorizado e separar decisão, implementação, teste e pendência. Ao concluir uma etapa, explicar o que foi feito, como funciona, como testar e próximo passo. Pedir à equipe somente acesso, decisão ou ação física que dependa dela.

[Notas da versão no GitHub](https://github.com/tecninjas2026-alt/DataBee/releases/tag/android-test-2026-10-22-08ab799). Publicação: `docs/verification/2026-10-22-android-publication.md`.

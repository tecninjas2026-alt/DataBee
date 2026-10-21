# IMP-032 — aplicação e integração em 21/10/2026

**Estado:** migration aplicada no dev, perfil integrado ao login e matriz SDK real **29/29 Pass** confirmada pela equipe. Fluxo real do app (login/restauração/troca) ainda requer confirmação específica; GitHub continua recusando acesso com suspensão (403). Não declarar Done.

## 🤖 Registro do agente — 21/10/2026

### Autorização e banco

Após receber a [proposta](2026-10-21-imp-032-proposal.md), a equipe respondeu **“PODE CONFIRMAR”** à pergunta sobre aplicar no banco de desenvolvimento e seguir com a integração ao login.

| Ação | Resultado |
|---|---|
| Novo `npm.cmd run supabase -- db push --dry-run` | Somente `20261021115711_imp032_profiles.sql` pendente |
| `npm.cmd run supabase -- db push --yes` | Migration aplicada com sucesso no projeto vinculado `uqfuuahziwgxwjymtwil` |
| Consulta de histórico em transação somente de leitura | Versões `20261016032127` e `20261021115711` confirmadas |
| Inspeção administrativa da estrutura e contagens | Dois perfis, ambos com Participante, nenhuma conta sem perfil; RLS ligado; três colunas obrigatórias; data automática; um trigger habilitado |
| Inspeção das permissões | Autenticado lê os três campos, insere id/apelido e atualiza apenas apelido; anon sem grants; função de trigger sem execução para anon/authenticated e com `search_path` vazio |

A primeira tentativa de `migration list --linked` após aplicação falhou ao conectar como papel temporário da CLI. A consulta pelo Management API confirmou o histórico sem pedir outra senha ou alterar credenciais. Inspeção administrativa confere estrutura, **não** substitui o teste de permissões com clientes.

O arquivo SQL aplicado não foi alterado. Correções futuras exigem uma nova migration.

### Integração no app

- `core/profiles/profile.service.ts`: lê o próprio perfil; se ausente, tenta criar usando o id atual e nome válido ou Participante. Conflitos são ignorados, seguidos de nova leitura; não sobrescreve apelido salvo. Requisição cancelável com limite de 15 segundos para a sequência.
- `core/auth/auth.service.ts`: perfil, carregamento e erro em signals; usa `profiles` como fonte do apelido após login/restauração. Limpa perfil/cancela requisição ao sair ou trocar conta. Respostas antigas só são aceitas quando a requisição e o usuário ainda são os atuais.
- O callback de autenticação permanece síncrono e apenas agenda a consulta para depois de liberar o controle interno do SDK. Eventos repetidos para a mesma conta não duplicam a carga em andamento ou o perfil já carregado.
- Início: mostra carregamento, erro seguro e botão de nova tentativa. Falha no perfil não encerra uma sessão válida nem exibe metadado como perfil salvo. Não foi criada tela de edição.
- `profile.model.ts`, `app-error.ts` e mapa de arquitetura atualizados. Avisos de autenticação não imprimem objetos de erro ou sessão.

Referências consultadas: [eventos de autenticação do SDK](https://supabase.com/docs/reference/javascript/auth-onauthstatechange), [upsert](https://supabase.com/docs/reference/javascript/upsert) e [signals do Angular](https://angular.dev/guide/signals). A implementação usa as dependências existentes, sem nova biblioteca.

### Ferramenta local para A/B

`npm.cmd run verify:profiles` abre **http://127.0.0.1:4214**. Reaproveita o servidor de verificação anterior com modo `--profiles`; `verify:privacy` mantém o modo da IMP-013 em 4213. A ferramenta fica fora do app/APK e usa o SDK instalado.

São 29 verificações manuais acionadas pela equipe. Contas entram somente na página local; sessões não são persistidas e credenciais são apagadas do formulário. O SDK envia senhas diretamente ao Supabase. O servidor recebe apenas IDs fixos de caso, Pass/Fail/Not run e códigos permitidos; grava relatório sanitizado com versão/hash da migration. Não há nomes, e-mails, identificadores das contas, tokens ou senhas no relatório.

O teste troca temporariamente o apelido de A por valores sintéticos para verificar escrita e limites, e tenta restaurar o original no `finally`. Se a rede cair, o item **Apelido original restaurado** precisa ser conferido. Não cria nem apaga contas/perfis; tentativas de DELETE têm dois filtros incompatíveis, após confirmar que A e B são diferentes. O INSERT forjando id de B usa conflito ignorado para não confundir chave duplicada com proteção de propriedade.

### Verificações executadas e limites

| Verificação | Resultado |
|---|---|
| `npm.cmd run check` | Lint e build de produção passaram; sem warnings novos |
| TypeScript estrito do cliente manual + sintaxe Node do servidor | Passaram |
| SDK real sem login | **4/4 Pass**: SELECT/INSERT/UPDATE/DELETE recusados com `42501`; relatório em `2026-10-21-imp-032-anonymous.json` |
| SDK real com A/B/anon executado pela equipe | **29/29 Pass**, zero Fail/Not run; relatório de 21/10 às 09:30:55 (Brasília) validado por projeto, versão, hash e 29 IDs únicos; inclui apelido original restaurado |
| Início em Chrome isolado, respostas de rede sintéticas | Fonte do nome = perfil salvo, evento repetido sem nova escrita/leitura, limpeza ao trocar conta, erro e nova tentativa, criação ausente com Participante, limpeza ao sair; todos conferidos, zero exceções |
| Layout do app | Sem rolagem horizontal em 360 px; captura de sucesso em 390×844 inspecionada |
| Ferramenta manual em Chrome isolado | 29 casos renderizados, quatro campos obrigatórios, formulário vazio recusado; sem exceções/overflow em 360/390 px; testes reais não iniciados pelo agente |
| `git fetch origin` | Recusado: conta suspensa, HTTP 403; sem push/PR/merge |

A tentativa inicial do SDK Node não chegou ao banco por conexão HTTPS; repetição com `node --use-system-ca` usou os certificados confiáveis do Windows, preservou TLS e confirmou 4/4. A inspeção com respostas sintéticas confere o comportamento do app, **não prova** RLS ou login real. O cadastro de uma conta nova para executar o trigger, a recuperação real de perfil ausente e concorrência entre clientes não foram testados no projeto remoto.

Não houve edição no Notion (ferramenta indisponível), APK novo ou teste Android. Esta task não altera plugins/permissões Android. Os bloqueios anteriores de SDK/aparelho continuam registrados no HANDOFF.

### Verificação humana

1. **Concluído:** equipe executou a ferramenta em http://127.0.0.1:4214 com A e B.
2. **Confirmado:** 29 Pass · 0 Fail · 0 Not run, incluindo Apelido original restaurado. Relatório sanitizado validado e versionado em `2026-10-21-imp-032-client.json`.
3. **Pendente no app:** abrir http://localhost:4200. Entrar com A: Início deve mostrar o apelido salvo (Participante, se ainda não alterado). Recarregar: o mesmo perfil volta. Sair: login. Entrar com B: perfil de B, sem resíduos de A.

## 🎓 Explicação para a equipe

**Entrada → processamento → saída:** a pessoa entra na conta → o app busca a ficha no banco → mostra o apelido na saudação do Início. Se a ficha faltar, tenta criá-la uma vez; repetir a entrada preserva o que já estava salvo. A ficha contém só identificador, apelido e data.

**RLS é o porteiro:** pessoas com login podem ler fichas mínimas, mas só o dono altera seu apelido. Data e identificador também têm proteção por coluna. A equipe executou o cliente real A/B/anon e os 29 casos passaram, incluindo a restauração do apelido. Evidência em [relatório sanitizado](2026-10-21-imp-032-client.json).

**Se a rede falhar:** a conta continua conectada, o nome anterior é removido e aparece uma mensagem com botão de nova tentativa. Trocar de conta cancela a consulta anterior para que o apelido não se misture.

<details><summary>Entrar outra vez troca ou duplica o perfil?</summary>Não deve. O app lê a mesma ficha; se precisar criar, ignora o conflito em vez de sobrescrever o apelido.</details>

<details><summary>O que a equipe ainda precisa comprovar?</summary>Os acessos A/B no banco real já passaram. Falta confirmar o caminho no app: login, recarregamento, saída e entrada com outra conta. Cadastro novo e recuperação real de perfil ausente continuam sem execução remota.</details>

<details><summary>O código já está no GitHub?</summary>Sim, desde 21/10/2026. A conta antiga foi suspensa; o projeto foi migrado para https://github.com/tecninjas2026-alt/DataBee e este trabalho foi integrado à <code>main</code>.</details>

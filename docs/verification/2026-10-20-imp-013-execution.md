# IMP-013 — aplicação e verificação em 20/10/2026

**Estado:** migration aplicada no dev; **59/59 casos SDK A/B/anon Pass**, com confirmação da equipe. Código e testes prontos para revisão final. **Envio da evidência final e merge bloqueados pelo GitHub**, que informou conta suspensa (HTTP 403). Não declarar Done; Notion e checkpoint continuam pendentes.

## 🤖 Registro do agente — 20/10/2026

A [proposta](2026-10-20-imp-013-proposal.md) foi entregue no [PR #9](https://github.com/TEC-NINJAS/DataBee/pull/9). Após a solicitação de autorização para aplicá-la no dev, a equipe respondeu “pode confirmar”. O agente informou que seguiria com simulação e aplicação apenas se a simulação mostrasse a única migration revisada. Não houve alteração do SQL após sua aplicação.

O Notion continua inacessível nesta sessão. Os estados oficiais de IMP-004/011/012, a leitura integral do Data Model/D10/D21/D22 e a atualização da task permanecem sem confirmação; não se inferiu Done. A implementação segue os critérios colados pela equipe e as definições locais. CLI/vínculo e configuração pública haviam sido conferidos tecnicamente na proposta; essa evidência não substitui a revisão humana das dependências.

### Banco e comandos realmente executados

Alvo: DataBee `uqfuuahziwgxwjymtwil`, `ca-central-1`, PostgreSQL 17. A mudança cria somente `observations` e `observation_private_locations`, índices, restrições, políticas e permissões; sem dados iniciais, Storage, funções ou IA.

| Comando | Resultado observado |
|---|---|
| `npm.cmd run supabase -- db push --dry-run` | Código 0; somente `20261016032127_imp013_observations_private_locations.sql`; sem seeds ou roles adicionais |
| `npm.cmd run supabase -- db push --yes` | Código 0; migration aplicada com sucesso |
| `npm.cmd run supabase -- migration list --linked` | Versão `20261016032127` presente nas colunas local e remota |
| `npm.cmd run check` | Lint e build de produção passaram sem warnings |
| `node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --strict --target es2022 --module preserve --moduleResolution bundler --lib es2022,dom --resolveJsonModule --esModuleInterop --skipLibCheck scripts/manual/observation-privacy.client.ts` | Cliente manual passou na verificação de tipos |
| `node --check scripts/verify-observation-privacy.mjs` | Sintaxe do servidor local válida |
| `npm.cmd run verify:privacy` | Página disponível somente em `http://127.0.0.1:4213` |
| Chrome isolado sem credenciais, 360 e 390 px | 59 casos carregados; quatro campos obrigatórios; formulário vazio recusado; sem erros de execução ou rolagem horizontal; screenshot inspecionada |

Uma tentativa inicial de typecheck precisou ser corrigida com `--ignoreConfig`, exigido pelo TypeScript 6 quando se especifica um arquivo diretamente. A primeira inspeção do Chrome na área restrita não concluiu; repetida fora dela, a inspeção da página isolada passou. Não foram acessados perfis pessoais do navegador.

Fingerprint SHA-256 do SQL aplicado: `59c2375ff2b4f937d292adf1a0a3ea578649d3b96294b3b72adb3d438e59482f`.

### Evidência real com SDK anônimo

Executada pelo agente com `@supabase/supabase-js` e a chave pública local, sem sessão, sem chave administrativa e sem SQL admin como prova de RLS. [Relatório sanitizado](2026-10-20-imp-013-anonymous.json).

| Operação nas duas tabelas | Resultado |
|---|---|
| SELECT | Negado: `42501` em ambos os casos |
| INSERT com dados artificiais | Negado: `42501` em ambos os casos |
| UPDATE com filtro sem correspondência | Negado: `42501` em ambos os casos |
| DELETE com filtro sem correspondência | Negado: `42501` em ambos os casos |

**8/8 Pass.** Isso comprova a negação ao papel anônimo. Como a negação ocorre por permissão, não comprova o isolamento entre donos autenticados.

Os probes de UPDATE/DELETE usam igualdade e desigualdade simultâneas para o mesmo identificador: nenhuma linha pode corresponder ao filtro, mesmo se houver permissão indevida. Não se apagou nenhum registro remoto nem se removeu usuário/projeto.

### Cliente manual A/B/anon

Arquivos: `scripts/verify-observation-privacy.mjs`, `scripts/manual/observation-privacy.{client.ts,cases.json,html,css}` e comando `verify:privacy` no `package.json`. O rascunho preexistente foi revisado e complementado para 59 casos, incluindo dono legítimo, ausência de GPS, isolamento, limites numéricos, estados protegidos, UPDATE permitido, identificadores e negação de DELETE.

O servidor escuta somente em loopback, confere Host e origem do envio de relatório, usa CSP e `no-store`. Só disponibiliza URL/chave pública; as credenciais são enviadas pelo SDK do navegador diretamente ao Supabase. Sessões de A/B ficam em memória, separadas, sem persistência. Campos são apagados ao terminar, mesmo em falha. Nenhuma senha/token entra no servidor local ou relatório.

O relatório aceita somente IDs fixos dos casos, Pass/Fail/Not run, código SQL com formato restrito e motivos de autenticação de uma lista fixa. Descarta campos extras. Inclui versão e hash da migration; fica em `.tmp/imp013-privacy-report.json`, ignorado pelo Git. É um registro das respostas observadas pelo cliente, não uma assinatura inviolável do servidor.

Para cada execução completa, o teste cria três drafts artificiais e uma localização artificial, sem câmera/GPS real, upload ou custo de IA. As tentativas de DELETE também usam filtros contraditórios. Os dados sintéticos permanecem no dev, sem limpeza remota nesta task.

Na [tentativa registrada](2026-10-20-imp-013-initial-auth.json): **auth-a Pass; auth-b Fail; 57 casos Not run**. A falha ocorreu antes da criação de dados e antes da matriz de isolamento. Após melhorar a mensagem segura e recarregar a página, o relatório confirmou `invalid_credentials`: e-mail/senha de B não foram aceitos. Isso não distingue qual dos dois valores está incorreto ou se a conta existe; não é falha de RLS. Solicitada à equipe a correção do acesso de B na página ou conferência no Dashboard, sem compartilhar credenciais.

### Resultado final autenticado

Depois, a equipe informou **“deu tudo certo agora”**. O agente leu o relatório mais recente, gerado em **20/10/2026 às 22:57:40 (America/Sao_Paulo)**, e confirmou **59 Pass, 0 Fail e 0 Not run**. [Relatório final sanitizado](2026-10-20-imp-013-client.json).

Antes de guardar a evidência, foram conferidos referência do projeto, versão/hash do SQL, origem do relatório, IDs únicos e correspondência exata dos 59 casos com a matriz versionada. Só foram copiados metadados públicos, IDs de casos, resultados e códigos SQL permitidos. A tentativa inicial de autenticação foi mantida como histórico e não representa o resultado final.

| Verificação | Resultado real |
|---|---|
| A/B autenticados e distintos; criação e leitura próprias | Pass |
| B não lê/altera observação ou localização de A; A não lê observação de B | Pass |
| Draft sem GPS; captured_at NULL quando omitido; SELECT observations sem campos de GPS | Pass |
| GPS artificial e vínculo do dono; precisão NULL/zero/positiva | Pass |
| Limites superior/inferior de latitude/longitude, precisão negativa e origem/consentimento inválidos | Recusados como esperado |
| INSERT/UPDATE de lifecycle, publication, analysis_status, curation_status, analysis_started_at, região pública e created_at | Recusados como esperado |
| Troca de donos ou vínculo da localização | Recusada como esperado |
| UPDATE permitido pelo dono | Pass |
| A/B/anon sem grant DELETE, com filtros sem correspondência | Recusado como esperado; nenhuma linha apagada |
| Integridade final de estados, donos e dados artificiais | Pass |

O problema de autenticação de B foi resolvido pela equipe na página; o agente não recebeu nem alterou a senha. Não houve redefinição de conta, alteração de RLS para contornar acesso ou uso de SQL admin para provar isolamento.

### GitHub: bloqueio externo na finalização

Ao conferir main antes do merge, `git fetch origin` retornou **403** e a mensagem **“Your account is suspended”**. Uma consulta autenticada de leitura ao PR #9 também retornou **403**, com suspensão de conta confirmada na resposta. Não se trocou de conta nem se tentou contornar a restrição.

Até a última comunicação bem-sucedida, o PR #9 estava aberto em rascunho e a branch remota continha `dbfde94` (aplicação/cliente/evidência parcial). Os arquivos finais ficam em commit local enquanto a conta não recupera acesso. Não foi possível verificar se main mudou, enviar a evidência final, atualizar o PR ou realizar merge. A referência origin/main em cache não é uma nova conferência do remoto.

### Pendências para fechar a etapa

1. Responsável recuperar o acesso da conta no GitHub; não há pendência de senha B nos testes.
2. Com acesso restabelecido: fetch, conferir main, rebase se necessário, realizar os checks pertinentes e enviar a evidência final ao PR #9. Não repetir a aplicação da migration nem os testes sem motivo novo.
3. Reconciliar documentação/status da task e dependências no Notion quando houver acesso; obter revisão humana/checkpoint.
4. Atualizar o PR, retirar de rascunho e fazer merge conforme workflow. Atualizar main local após merge. `Done` depende da confirmação da equipe; não foi alterado nesta sessão.

APK não gerado: esta task não altera câmera, GPS do aparelho ou Android. O botão Salvar do app continua dependendo das tasks de persistência.

## 🎓 Explicação para a equipe

Agora a receita foi aplicada: as duas gavetas já existem no Supabase. Entrada: conta e dados de uma observação → processamento: o banco confere quem é o dono, os campos permitidos e os limites dos valores → saída: rascunho privado e localização separada quando ela for informada.

Os testes confirmaram que uma pessoa sem login não abre as gavetas e que B não acessa os registros privados de A. Os 59 casos passaram com as contas distintas. Isso protege os dados mesmo quando uma requisição tenta mudar estados fora da tela. O bloqueio atual está no GitHub, não na entrada de B nem no banco.

### Como testar no computador

1. Abrir `http://127.0.0.1:4213`; se já estava aberta, recarregar.
2. Preencher as duas contas de teste somente nessa página.
3. Clicar em **Executar verificação real**.
4. Esperado: **59/59 Pass; 0 Fail; 0 Not run**. Se houver falha, copiar apenas o nome do caso e a mensagem segura; não enviar credenciais.
5. O relatório sem dados pessoais fica no computador e pode ser baixado pelo link da página.

<details>
<summary>Aplicar a migration significa que todos os testes passaram?</summary>
Não. Significa que o banco aceitou a estrutura. Os testes com contas diferentes precisam comprovar o comportamento de acesso e escrita.
</details>

<details>
<summary>Por que não chamar uma falha de entrada de “RLS funcionando”?</summary>
Porque a conta nem chegou à consulta dos dados. Precisamos de sessões válidas de A e B para verificar o porteiro do banco.
</details>

<details>
<summary>Os testes apagam alguma observação?</summary>
Não. Os pedidos DELETE usam condições que nunca podem ser verdadeiras ao mesmo tempo e devem ser recusados por falta de permissão. Os drafts de teste ficam no dev.
</details>

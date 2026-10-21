# IMP-014 — aplicação e testes em 21/10/2026

**Estado:** migration aplicada no dev, estrutura conferida e matriz SDK real A/B/anon **32/32 Pass**, confirmada pela equipe. Quatro verificações anônimas independentes também passaram. Sem bucket/upload ou merge; revisão/Notion/fluxo Git ainda impedem declarar Done.

## 🤖 Registro do agente — 21/10/2026

### Autorização e aplicação

A equipe respondeu **“Sim, pode aplicar a IMP-014”** após receber a [proposta revisável](2026-10-21-imp-014-proposal.md). A autorização abrange a IMP-014; não autoriza aplicar a IMP-015.

| Ação | Resultado real |
|---|---|
| `npm.cmd run supabase -- db push --dry-run` | Somente `20261021122259_imp014_observation_images.sql` pendente |
| `npm.cmd run supabase -- db push --yes` | Aplicação concluída no dev vinculado `uqfuuahziwgxwjymtwil` |
| Consulta administrativa somente de leitura | Histórico contém IMP-013, IMP-032 e IMP-014; nove colunas obrigatórias; RLS ligado; constraints e políticas esperadas presentes |
| SDK real sem login | **4 Pass / 0 Fail**: leitura, inserção, alteração e exclusão recusadas com `42501`; evidência em `2026-10-21-imp-014-anonymous.json` |
| SDK real com A/B/anon, executado pela equipe | **32 Pass / 0 Fail / 0 Not run**; relatório de 21/10 às 10:04:26 (Brasília), conferido por projeto, versão, hash e 32 IDs únicos; evidência em `2026-10-21-imp-014-client.json` |
| `npm.cmd run check` | Lint e build de produção passaram, sem warnings novos |
| TypeScript estrito da página/roteiro + `node --check` do servidor | Passaram |
| Chrome isolado 360/390 px | 32 verificações renderizadas, quatro campos obrigatórios, formulário vazio recusado, sem exceções ou rolagem horizontal |

O arquivo de migration aplicado não foi alterado; correções exigem uma nova migration. Inspeção administrativa comprova estrutura e histórico, **não** é prova de RLS. A recusa anônima foi conferida pelo SDK apenas com a chave pública e sem sessão. O Node usou `--use-system-ca` para confiar nos certificados existentes do Windows, sem desativar HTTPS.

### Arquivos e comportamento

- Migration `20261021122259_imp014_observation_images.sql`: uma imagem por observação e caminho único; FK composta conserva dono; JPEG/PNG; bytes de 1 a 5.242.880; posição não negativa com padrão 0; data automática; origem camera/gallery preservada. Cliente insere somente em draft/idle próprio e lê somente dados próprios; sem UPDATE/DELETE.
- `observation.model.ts`: tipo de leitura inclui `photo_source`; inclusão tipada exclui data e exige id para compor o caminho canônico.
- `scripts/manual/observation-images.matrix.ts`: SDK com dois rascunhos e dois metadados sintéticos, verificações de propriedade/imutabilidade e limites, sem arquivos ou GPS. Resultados são emitidos por callback antes de interromper em falha.
- `observation-images.client.ts`, `.cases.json` e `.html`: formulário A/B, mensagens, contagem e relatório sanitizado.
- `scripts/verify-observation-privacy.mjs`: novo modo `--images` na porta 4215; modos anteriores permanecem em 4213/4214. `npm run verify:images` inicia a página local; nenhuma dependência adicionada.

Credenciais entram somente na página local e seguem diretamente ao Supabase pelo SDK. Os clientes não persistem sessão; o formulário é limpo e o logout local é tentado ao terminar. Relatório contém somente projeto/versão/hash, data e IDs fixos de casos com Pass/Fail/Not run e códigos permitidos. Não registra e-mails, senhas, tokens, IDs das contas ou caminhos privados.

### Matriz A/B executada pela equipe

A equipe executou **http://127.0.0.1:4215** com contas diferentes e informou “não houve falhas”. O agente validou o relatório `.tmp/imp014-privacy-report.json` contra os casos, projeto, versão e hash: **32 Pass · 0 Fail · 0 Not run**. Cópia sanitizada em [relatório real da IMP-014](2026-10-21-imp-014-client.json).

| Critério obrigatório | Casos correspondentes | Estado nesta etapa |
|---|---|---|
| A insere em draft próprio | a-draft, own-image | Pass |
| Segunda foto recusada | second-image-rejected | Pass |
| A não vincula à observação de B | foreign-observation-rejected, forged-owner-rejected | Pass |
| B não lê/altera A | b-cannot-read-a, b-cannot-update-a | Pass |
| Nem dono altera caminho/metadados | owner-cannot-update, owner-cannot-update-path, metadata-unchanged | Pass |
| Somente nove campos, sem binário | metadata-only | Pass |

O roteiro também cobre bytes zero/negativo/acima do limite, MIME proibido, posição negativa, URL/caminho de outro dono, origem diferente do pai, data protegida, JPEG no limite máximo e PNG com tamanho mínimo. Os números são **metadados declarados sintéticos**: não significam validação de arquivo ou upload real. Não há exclusão de dados; DELETE usa filtros contraditórios. Dois rascunhos e dois metadados válidos são mantidos para a equipe.

Limites ainda não executados no remoto: recusa de inserção em observação saved/processing com fixtures autorizadas do backend, concorrência com finalização e validação de bytes/MIME do arquivo real. Não alterar estados protegidos via cliente para fabricar um teste positivo. A integração de upload/salvamento pertence às tasks seguintes.

### Pendências

- Matriz A/B confirmada e registrada. Ainda falta revisão/checkpoint de entendimento e o fluxo Git/Notion antes de Done.
- GitHub continua com suspensão 403 na última verificação desta sessão; sem push, PR, merge ou main atualizado. Preservar commits locais, sem contornar restrições.
- Notion indisponível: registro e status oficiais não atualizados. Não inferir Done de dependências.
- IMP-015 recebida integralmente: dependência técnica IMP-014 aplicada/testes obrigatórios agora confirmada; pode preparar proposta para revisão. Sua aplicação remota continua exigindo autorização própria. Nenhum bucket foi criado na IMP-014.
- Nenhuma mudança Android, APK ou teste em aparelho nesta task.

## 🎓 Explicação para a equipe

**Entrada → processamento → saída:** informações da foto → banco confere dono, estado e limites → guarda uma etiqueta ligada à observação. A etiqueta tem caminho, formato, tamanho e origem; a fotografia ainda não foi enviada.

**Uma ficha, uma foto:** `observation_id` único impede cadastrar duas fotos na mesma observação. O vínculo composto é uma conferência dupla: número da observação e dono precisam combinar.

**RLS é o porteiro:** cada pessoa vê suas próprias etiquetas. Mesmo o dono não recebe alteração/exclusão direta depois de criá-las. A limpeza futura será feita por um programa autorizado no servidor.

**Como testar:** abrir a página local, preencher A/B e clicar em **Verificar metadados com A e B**. Devem aparecer 32 Pass. O teste não usa a câmera, arquivos privados, GPS ou IA e conserva os dados artificiais no banco.

<details><summary>O número bytes contém a foto?</summary>Não. É apenas o tamanho declarado do arquivo. O conteúdo da foto fica no Storage, que será preparado na IMP-015.</details>

<details><summary>Uma foto da galeria vira camera depois da conversão?</summary>Não. A origem continua gallery; JPEG/PNG descrevem formato, não origem.</details>

<details><summary>Esta etapa já permite salvar a foto no app?</summary>Ainda não. Ela prepara os dados que identificam o arquivo. Upload e finalização do registro continuam nas próximas tasks.</details>

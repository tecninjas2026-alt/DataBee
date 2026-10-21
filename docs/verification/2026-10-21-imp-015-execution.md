# IMP-015 — aplicação e testes em 21/10/2026

**Estado:** bucket privado e policies aplicados no dev; matriz SDK real A/B/anon aprovada: **25 Pass · 0 Fail · 0 Not run**. Evidência validada em 21/10 às 10:34:38 (Brasília). Revisão humana/checkpoint, Notion e merge continuam pendentes; não declarar Done.

## 🤖 Registro do agente — 21/10/2026

### Autorização e aplicação

Após a [proposta da IMP-015](2026-10-21-imp-015-proposal.md), a equipe respondeu **“autorizo”** à pergunta sobre aplicar no Supabase de desenvolvimento.

| Comando/ação | Resultado real |
|---|---|
| `npm.cmd run supabase -- db push --dry-run` | Somente `20261021130929_imp015_private_storage.sql` pendente |
| `npm.cmd run supabase -- db push --yes` | Aplicação concluída no projeto vinculado `uqfuuahziwgxwjymtwil` |
| Inspeção read-only do histórico/configuração | Quatro migrations aplicadas; um bucket, `observation-images`, public=false, limite 5242880 bytes e MIME image/jpeg + image/png |
| Inspeção read-only das policies | RLS ligado; INSERT/SELECT/DELETE para authenticated conforme proposta; nenhuma UPDATE ou policy para anon |
| `npm.cmd run check` | Lint e build de produção passaram sem warnings novos |
| TypeScript estrito da página/roteiro + `node --check` do servidor | Passaram |
| Casos declarados versus roteiro SDK | 25 casos, incluindo dois logins; 23 verificações do roteiro, sem divergência |
| Chrome isolado em 360/390 px | 25 casos renderizados, quatro campos obrigatórios, formulário vazio recusado, sem exceções ou rolagem horizontal |

Essas consultas administrativas comprovam configuração e estrutura, **não** RLS com usuários. O arquivo SQL aplicado foi preservado; qualquer correção futura exige nova migration. Não houve criação de bucket alternativo, liberação pública ou mudança em grants/estrutura de storage.objects.

### Código e ferramentas

- Bucket/policies em `20261021130929_imp015_private_storage.sql`; contrato do cliente em `core/config/observation-storage.ts`.
- `observation-storage.matrix.ts`: usa clientes SDK A/B/anon, PNG artificial de 16×16 px, dois rascunhos e duas imagens sintéticas. Compara o conteúdo baixado byte a byte, testa metadados/finalização e preservação da imagem. Não usa câmera, arquivos pessoais, GPS, IA ou chave administrativa.
- `observation-storage.client.ts`, `.cases.json` e `.html`: página local, formulário A/B, resultados e relatório sanitizado.
- `npm.cmd run verify:storage` inicia **http://127.0.0.1:4216**. Servidor manual compartilhado passou a usar lista explícita de modos; anteriores mantêm portas 4213/4214/4215, arquivos e versões. Sem dependência nova.

Credenciais são enviadas pelo SDK diretamente ao Supabase, sem servidor intermediário, persistência de sessão no cliente ou logs. O formulário é limpo ao terminar; logout da sessão de teste é tentado. O servidor salva só casos, status e códigos permitidos, junto de projeto/versão/hash/data; exclui imagens, caminhos, URLs, ids das contas, e-mails e senhas.

### Matriz real A/B/anon — 25/25 Pass

A execução pela página local gerou relatório real em **2026-10-21T13:34:38.325Z** (10:34:38 Brasília): **25 Pass · 0 Fail · 0 Not run**. Agente conferiu projeto vinculado, versão `20261021130929`, SHA-256 do SQL aplicado e os 25 IDs únicos contra a lista de casos. Evidência sanitizada: [2026-10-21-imp-015-client.json](2026-10-21-imp-015-client.json). Não foram coletadas credenciais, imagens ou identificadores das contas.

| Teste obrigatório | Casos preparados | Estado nesta etapa |
|---|---|---|
| 1. Upload válido de A em draft próprio | own-draft, owner-upload | Pass |
| 2. Dono baixa sua imagem | owner-download; compara os bytes | Pass |
| 3. B não acessa/envia em A | other-download-denied, other-upload-denied; teste simétrico A/B e B lê o próprio | Pass |
| 4. Anônimo não acessa | anonymous-download-denied, anonymous-upload-denied | Pass |
| 5. Arquivo maior que 5 MB recusado | oversize-rejected, 5242881 bytes artificiais | Pass |
| 6. MIME proibido recusado | mime-rejected, text/plain artificial | Pass |
| 7. Upsert não sobrescreve | upsert-overwrite-denied, direct-update-denied | Pass |
| 8. Finalizado não pode ser alterado/apagado | finalized-update-denied, finalized-delete-blocked, finalized-file-preserved | Pass |
| 9. URL pública não libera imagem | public-url-denied, requisição sem sessão | Pass |

O caso DELETE é uma **tentativa negativa**, restrita ao PNG criado e finalizado na mesma execução. Espera erro de acesso ou zero objetos removidos; depois exige download do mesmo arquivo intacto. Não há limpeza nem exclusão positiva de temporários; imagens/dados artificiais ficam no projeto. Falha da proteção deve aparecer como Fail, não ser escondida. Nenhuma operação de arquivo é realizada por SQL.

Limites ainda não verificados no remoto: upload JPEG (PNG é a fixture positiva), recusa de upload em saved/processing com fixtures de backend, exclusão positiva de temporário e concorrência com finalização. Os formatos/limites do bucket não substituem a revalidação do conteúdo no backend. Não há promessa de transação única entre banco e Storage; rotinas posteriores precisam coordenar a finalização/cleanup.

### Pendências

- A/B/anon executados e relatório conferido; revisão humana e compreensão pela equipe ainda não registradas. Não repetir a matriz para produzir dados adicionais.
- GitHub continua suspenso no último fetch desta sessão (403); commits locais preservados, sem push/PR/merge ou main atualizado. Não contornar a suspensão.
- Notion indisponível; status/checkpoint e registro oficial ainda pendentes. Não marcar Done só por configurar o bucket.
- Sem mudança Android, APK novo ou teste em aparelho.
- IMP-069 recebida integralmente pela conversa. Primeiro conferir IMP-013/014/015/016 e apresentar plano de criação/limpeza; nenhuma nova escrita remota ou exclusão autorizada por esse recebimento.

## 🎓 Explicação para a equipe

**Storage é a pasta de arquivos na nuvem; bucket é a pasta principal.** Agora existe a pasta privada observation-images. Seu endereço público não deverá abrir as fotos.

**Entrada → processamento → saída:** foto preparada → serviço confere conta/caminho/observação/formato/tamanho → guarda arquivo privado. Os metadados da IMP-014 são a etiqueta que aponta para ele. O botão de salvar do app ainda depende das próximas tasks.

**RLS é o porteiro:** só permite caminho e observação do dono. Enquanto não há etiqueta final, o arquivo é temporário; depois da etiqueta, não pode ser trocado ou apagado diretamente pelo cliente.

**Como testar:** a execução A/B já foi concluída com 25 Pass. Conferir o relatório acima e a explicação da proteção. Não é preciso repetir o teste; uma repetição cria novos dados artificiais.

<details><summary>Conhecer a URL pública abre uma foto privada?</summary>Não deve. O teste precisa comprovar a recusa, além de confirmar que o dono consegue baixar o arquivo com sua sessão.</details>

<details><summary>O teste vai apagar nossas fotos?</summary>Ele não usa fotos existentes e não faz limpeza. A tentativa de apagar mira somente a imagem artificial finalizada recém-criada, espera bloqueio e confere que continua intacta.</details>

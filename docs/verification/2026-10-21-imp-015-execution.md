# IMP-015 — aplicação e testes em 21/10/2026

**Estado:** bucket privado e policies aplicados no dev. Configuração/estrutura verificadas, código aprovado e página A/B pronta. Os testes reais de arquivos ainda aguardam execução da equipe; não declarar Done.

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

### Matriz real A/B/anon — ainda aguardando

A equipe deve abrir **http://127.0.0.1:4216**, preencher as contas de teste somente ali e clicar em **Verificar arquivos privados com A e B**. Esperado: **25 Pass · 0 Fail · 0 Not run**. O relatório será `.tmp/imp015-privacy-report.json`; validar projeto, versão, hash e 25 IDs únicos antes de registrar sucesso.

| Teste obrigatório | Casos preparados | Estado nesta etapa |
|---|---|---|
| 1. Upload válido de A em draft próprio | own-draft, owner-upload | Não executado |
| 2. Dono baixa sua imagem | owner-download; compara os bytes | Não executado |
| 3. B não acessa/envia em A | other-download-denied, other-upload-denied; teste simétrico A/B e B lê o próprio | Não executado |
| 4. Anônimo não acessa | anonymous-download-denied, anonymous-upload-denied | Não executado |
| 5. Arquivo maior que 5 MB recusado | oversize-rejected, 5242881 bytes artificiais | Não executado |
| 6. MIME proibido recusado | mime-rejected, text/plain artificial | Não executado |
| 7. Upsert não sobrescreve | upsert-overwrite-denied, direct-update-denied | Não executado |
| 8. Finalizado não pode ser alterado/apagado | finalized-update-denied, finalized-delete-blocked, finalized-file-preserved | Não executado |
| 9. URL pública não libera imagem | public-url-denied, requisição sem sessão | Não executado |

O caso DELETE é uma **tentativa negativa**, restrita ao PNG criado e finalizado na mesma execução. Espera erro de acesso ou zero objetos removidos; depois exige download do mesmo arquivo intacto. Não há limpeza nem exclusão positiva de temporários; imagens/dados artificiais ficam no projeto. Falha da proteção deve aparecer como Fail, não ser escondida. Nenhuma operação de arquivo é realizada por SQL.

Limites ainda não verificados no remoto: upload JPEG (PNG é a fixture positiva), recusa de upload em saved/processing com fixtures de backend, exclusão positiva de temporário e concorrência com finalização. Os formatos/limites do bucket não substituem a revalidação do conteúdo no backend. Não há promessa de transação única entre banco e Storage; rotinas posteriores precisam coordenar a finalização/cleanup.

### Pendências

- Equipe executar A/B/anon; agente validar e registrar resultados reais. Solicitação enviada enquanto o registro era preparado.
- GitHub continua suspenso no último fetch desta sessão (403); commits locais preservados, sem push/PR/merge ou main atualizado. Não contornar a suspensão.
- Notion indisponível; status/checkpoint e registro oficial ainda pendentes. Não marcar Done só por configurar o bucket.
- Sem mudança Android, APK novo ou teste em aparelho.
- Próximas tasks de upload/finalização precisam de critérios completos. Solicitado o texto da IMP-069, conforme sequência do HANDOFF, sem presumir sua implementação.

## 🎓 Explicação para a equipe

**Storage é a pasta de arquivos na nuvem; bucket é a pasta principal.** Agora existe a pasta privada observation-images. Seu endereço público não deverá abrir as fotos.

**Entrada → processamento → saída:** foto preparada → serviço confere conta/caminho/observação/formato/tamanho → guarda arquivo privado. Os metadados da IMP-014 são a etiqueta que aponta para ele. O botão de salvar do app ainda depende das próximas tasks.

**RLS é o porteiro:** só permite caminho e observação do dono. Enquanto não há etiqueta final, o arquivo é temporário; depois da etiqueta, não pode ser trocado ou apagado diretamente pelo cliente.

**Como testar:** abrir a página local, entrar com A/B e executar. Ela cria duas imagens artificiais, sem fotos pessoais ou GPS; 25 Pass é o esperado, ainda não o resultado obtido nesta etapa.

<details><summary>Conhecer a URL pública abre uma foto privada?</summary>Não deve. O teste precisa comprovar a recusa, além de confirmar que o dono consegue baixar o arquivo com sua sessão.</details>

<details><summary>O teste vai apagar nossas fotos?</summary>Ele não usa fotos existentes e não faz limpeza. A tentativa de apagar mira somente a imagem artificial finalizada recém-criada, espera bloqueio e confere que continua intacta.</details>

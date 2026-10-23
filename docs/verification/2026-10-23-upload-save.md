# Envio privado, salvamento e histórico — 23/10/2026

## Estado

Upload recuperável, salvamento privado e histórico/detalhe implementados, **em validação**, sem Done humano presumido. Migration aplicada e Function implantada após revisão, dry-run e delegação da professora: “Tome as decisões necessárias com base no que precisamos para construir nosso aplicativo”. Descarte remoto não implementado. Criadas duas contas técnicas sintéticas e conjuntos de teste reservados; nenhum dado anterior modificado ou excluído.

Fontes consultadas no Notion: [IMP-022](https://app.notion.com/p/ef3d3425eae4827496aa01ad66f34616), [IMP-035](https://app.notion.com/p/c66d3425eae4833197af01777ecdf472) e [padrão operacional](https://app.notion.com/p/300d3425eae482a88f4381f83aa5a325). Dependências e preparação anterior em [plano de 21/10](2026-10-21-imp-022-035-preparation.md). Os testes humanos confirmados em 22/10 foram preservados; não equivalem à matriz integral de IMP-021/034, nem ao teste do novo upload.

## Implementação no app — IMP-022

- `observation-upload.service.ts`: reserva IDs antes de qualquer escrita; cria draft/private/idle, localização privada opcional, arquivo privado e metadados. Usa o cliente Supabase existente, com autorização real pelas policies já aplicadas. Nenhuma IA.
- `upload-reference.ts`: referência durável por dono no aparelho, com IDs, hash, origem, datas e etapa. Não persiste foto, GPS, sessão ou URL assinada. Escrita local bloqueada impede iniciar o envio. Referências inválidas não são descartadas silenciosamente.
- Novas tentativas consultam o mesmo draft, arquivo e metadado. Download autenticado confere o hash dos bytes. `upsert:false`, sem sobrescrever arquivos. Rede/403 não são tratados como ausência.
- Escritas SQL são reconciliadas após resposta ambígua. Falha de metadados preserva pendência e arquivo reservado para recuperação; **não há limpeza automática nem exclusão remota** nesta entrega. A pendência fica visível ao dono na tela Foto.
- Uma operação por vez, inclusive entre abas do mesmo aparelho por Web Locks. Espera SQL limitada a 30 s, download a 60 s e upload a 60 s. O SDK não permite abortar o upload nessa API: o timeout limita a espera da tela; uma resposta tardia não inicia as etapas seguintes. Retry confere o mesmo caminho.
- Troca de foto/conta invalida etapas posteriores. Galeria continua sem GPS atual. Consentimento tem momento próprio, separado da leitura do GPS. Escolha fica bloqueada depois de reservar o envio.
- Tela Dados oferece **Salvar observação**, mostra andamento/erro/referência e executa envio + confirmação do servidor em uma ação. Reconcilia resposta perdida pelo mesmo ID, inclusive se o servidor já salvou. Depois abre o detalhe e limpa a prévia.
- Tela Foto lista envios do dono deste aparelho e permite retomar. Foto já enviada é recuperada do servidor. Se o arquivo não chegou e a memória foi perdida, exige selecionar os mesmos bytes tratados; outra imagem é recusada. Para câmera sem cópia disponível, conservar pendência para o futuro descarte autorizado. Se GPS não chegou, pedir nova escolha explícita, sem inventar coordenadas ou precisão.

## Servidor implantado — IMP-035, parte salvar

Arquivos implementados:

- `supabase/migrations/20261023133000_imp035_save_private_observation.sql`.
- `supabase/functions/save-observation/index.ts`.
- `supabase/functions/_shared/validate-jpeg.ts`.
- Tipo `SavedObservationConfirmation` em `observation.model.ts`.

A Function recebe apenas o ID. Confere autenticação, dono, estado, metadados, caminho e arquivo privado. Validação estrutural de JPEG: assinatura, marcadores, dimensões até 2048 px, até 5 MB, sem EXIF/XMP/COM e sem bytes extras. **Não é decodificação integral de pixels**. Consulta e download usam JWT do dono e RLS; privilégio elevado é usado apenas na confirmação final.

A rotina SQL bloqueia a linha para serializar confirmações, confere dono, vínculo e catálogo do arquivo e promove somente lifecycle para saved. Mantém private/idle e não depende de IA. Repetir confirma a mesma observação. Execução concedida somente a service_role, nunca ao cliente comum. A rotina não apaga dados nem amplia UPDATE do app. Usa os secrets padrão do runtime, preferindo os novos conjuntos de chaves; nenhuma chave real incluída no código.

`npm run supabase -- db push --dry-run` listou **somente** `20261023133000_imp035_save_private_observation.sql`. Após revisão e delegação técnica da professora, `db push` aplicou essa migration e `functions deploy save-observation --use-api` implantou a Function. Autenticação mantida, nenhum `--no-verify-jwt`. O dry-run sozinho não valida SQL; aplicação e matriz real abaixo confirmaram a execução. Migration aplicada é imutável. Não executar descarte ou limpeza dos dados IMP-069.

## Histórico e detalhe — IMP-036/037

- Consulta real por dono e lifecycle=saved, ordem created_at/id decrescente e páginas de 20. Rascunhos ficam separados, com acesso à recuperação deste aparelho. Loading, vazio, erro/retry e pull-to-refresh tratados.
- Fotos por URL assinada de 60 segundos; nova autorização exigida ao recarregar foto. URL fica só na memória, nunca no banco/armazenamento local/logs. Respostas antigas e troca de conta não preenchem outra tela.
- Detalhe mostra foto, origem, criação/captura sem inventar data da galeria, estado e coordenadas privadas do dono. ID inexistente/sem acesso mostra indisponível. Reabrir não chama IA.
- Contagem do Início consulta o banco; falha não aparece como zero. Conquistas continuam pendentes.
- IA/resultados/candidatos/cartões educativos curados serão integrados quando suas tabelas e conteúdo aprovados existirem. Nenhum resultado científico inventado. Descarte remoto da IMP-035 ainda exige coordenação e revisão próprias; a task inteira não foi declarada concluída.

Fontes adicionais consultadas: [IMP-036](https://app.notion.com/p/50fd3425eae483ae8c14812ada99e7d8), [IMP-037](https://app.notion.com/p/ee8d3425eae483cdb09d0164d17f784c).

## Verificação e limites

- `npm run check`: lint e build de produção aprovados durante a implementação; repetir após a revisão final antes do commit.
- Verificação TypeScript da Function com tipos do SDK 2.117.3 instalado e declaração mínima do runtime Deno: aprovada. Não é execução no runtime remoto.
- **22 cenários locais** de recuperação aprovados: relatório sanitizado em `2026-10-23-upload-local.json`. Usam serviço real Angular com fronteiras SDK simuladas; não comprovam RLS remoto, plugins ou execução visual.
- Validador JPEG: 8 casos locais aprovados, incluindo JPEG real sintético 8×8 gerado no computador, EXIF, truncamento, dimensões e limite. Relatório `2026-10-23-save-jpeg-local.json`.
- Servidor de desenvolvimento iniciado em `http://localhost:4200`. Ferramenta do navegador recusou adquirir a aba local por política de URL. Não houve contorno por outro navegador ou automação indireta. **Fluxo visual e envio real A/B/anon: Not run nesta sessão.**
- **10 casos reais SDK A/B/anon** aprovados contra a Function implantada: salvar, repetir, reabrir, isolamento e rotina privilegiada inacessível ao cliente. Relatório `2026-10-23-save-remote.json`.
- **11 casos de integração** aprovados com os serviços Angular reais e clientes autenticados: app envia/salva, A vê dois salvos/um draft separado, nova instância reabre, B vazio/sem acesso, JPEG com EXIF recusado, URL de 60 s expira de fato e é renovada pelo dono. Relatório `2026-10-23-app-flow-remote.json`. Web Locks e leitura de dimensões em Node usam adaptações em memória; isso não prova UI/plugins Android.
- Duas contas técnicas usam endereços sintéticos e confirmação administrativa, sem disparo de e-mail; **não comprovam cadastro/SMTP**. Senhas/tokens/chaves não foram gravados nem exibidos. Manifesto privado `.tmp/imp035-remote-manifest.json` identifica os recursos reservados; preservar sem limpeza.
- Dependências preservadas. APK 1.0.1-test/código 2 em preparação; publicação seguirá o padrão do Notion. Teste humano do novo fluxo ainda pendente.

## Como testar a próxima etapa

No novo APK, entrar → Registrar → foto autorizada → Continuar → escolher GPS opcional → Salvar observação. Deve abrir foto/dados privados e Não analisada. Fechar/reabrir → Minhas observações → Abrir observação deve preservar foto/dados. Galeria permanece sem GPS atual. Falhas mostram pendência recuperável. O APK anterior de 22/10 não contém estas mudanças.

## Explicação para a equipe

A foto e sua ficha ficam em lugares diferentes. O app guarda uma etiqueta do envio antes de começar. Se a conexão cair, procura essa mesma etiqueta e continua de onde parou, em vez de criar outra ficha. O servidor será quem confirma que tudo está coerente para passar de rascunho para salvo.

Referências técnicas conferidas: [upload sem sobrescrita](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [download autenticado](https://supabase.com/docs/reference/javascript/file-buckets-download), [códigos de erro do Storage](https://supabase.com/docs/guides/storage/debugging/error-codes), [variáveis padrão das Functions](https://supabase.com/docs/guides/functions/secrets). APIs também conferidas no código da versão instalada do SDK.

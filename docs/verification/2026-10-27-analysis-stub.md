# IMP-027 — preparação local do serviço autenticado

Fonte: [task IMP-027 no Notion](https://app.notion.com/p/693d3425eae482438b2501e3f87d33c1), consultada em 27/10. Também lidos os critérios IMP-029: persistência atômica/tentativas/quotas ficam para essa etapa posterior e não foram implementadas aqui.

## Implementado

- `supabase/functions/analyze-observation/handler.ts`: aceita somente POST com ID da observação; limita a leitura do corpo a 1.024 bytes reais; confere autenticação, dono, estado saved/private, catálogo revisado e metadados/arquivo JPEG. Recusa caminhos, tamanho, MIME, origem, EXIF e conteúdo estrutural inválidos. OPTIONS/CORS sem autenticação; demais métodos recusados.
- `index.ts`: adaptador com SDK 2.117.3, JWT validado em Auth e consultas com a própria sessão/RLS. Não usa chave administrativa, não consulta GPS/perfil e não oferece operação de escrita. Consultas e download têm limites de tempo. Erros externos são sanitizados.
- Catálogo mantido como `null` no ponto de entrada: configuração ausente resulta em 503 controlado **antes de buscar/baixar a imagem**. O catálogo draft não foi promovido; aprovação não pode ser enviada no pedido HTTP.
- O caminho de simulação foi exercitado somente localmente com catálogo e JPEG artificiais explícitos: `simulation: true`, `persisted: false`, inconclusive/matches vazio/poor e limitação “SIMULAÇÃO”. Essa resposta não descreve a qualidade real da foto e não é gravada.

## Verificado

**38/38 Pass**, relatório sanitizado em [JSON](2026-10-27-analysis-stub.json):

- 33 verificações locais: CORS/métodos, autenticação/pedido, isolamento, estado, configuração, metadados, JPEG/EXIF, erro sanitizado e resposta de simulação explícita. Foto e catálogo de fixture não avaliam biologia.
- 5 verificações com **handler executado localmente e SDK real no Supabase dev**: A consulta próprio saved/idle e recebe catálogo indisponível; B não obtém o de A; JWT forjado é negado pelo Auth real; ID inválido é recusado após autenticação; estado do registro próprio continua saved/private/idle.
- Contas técnicas A/B e registro anterior reutilizados; sessões técnicas locais encerradas. Nenhum novo usuário, fixture remota, envio de e-mail, exclusão ou alteração de observação.
- TypeScript estrito do código de servidor conferido com a declaração mínima de Deno e SDK instalado; isso não equivale a execução no runtime remoto Deno. `npm run check` aprovado.

Executor temporário `.tmp/check-analysis-stub.mjs`, usando esbuild/TypeScript já instalados; nenhuma dependência adicionada. Nenhum provedor de IA foi invocado, nenhuma foto foi transmitida a provedor, nenhum custo habilitado.

## Pendências

**Não implantado e não conectado à interface.** A função no servidor e o teste Android desta etapa não foram executados. Não há novo APK: o app instalado e o download compartilhado continuam na versão 1.0.2-test.

Faltam revisão do Gate 2/aceites das dependências, catálogo aprovado com fonte controlada e serviço de IA elegível com teto zero. O serviço real requer execução, controles atômicos de tentativas/quotas/persistência da IMP-029 e testes posteriores; este código não os substitui. Não prometer identificação ou acurácia com esta preparação.

Registro técnico e explicação publicados na IMP-027 em **In progress**; não marcar Done nem dependentes Ready por esta preparação. Salvamento/reabertura humanos documentados separadamente em [teste do aparelho](2026-10-27-android-save-device.md).

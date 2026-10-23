# Preparação do prompt bee-v2 e início sem custo

## Implementado

- `supabase/functions/_shared/bee-prompt.ts` preserva integralmente o texto oficial [Bee Identification AI Prompt](https://app.notion.com/p/9dbd3425eae4830bb2b8818cd38e1d9f), consultado em 23/10/2026. Versão bee-v2, contrato 2.0. Sem ajuste com imagens TEST ou alteração de regra científica.
- `buildBeePromptContext` seleciona explicitamente apenas versão de catálogo, IDs, níveis, nomes e características visuais revisadas. Região ampla é opcional e aceita somente os dois rótulos D10. Campos extras são ignorados: não serializa observação, GPS exato, identidade ou URLs de imagens.
- Catálogo não vazio e explicitamente aprovado exigido em tempo de execução; até 100 itens, sem IDs repetidos, nomes até 160 caracteres, até 10 características por item e 500 caracteres por característica. São limites técnicos. O status approved deve vir de fonte mantida no servidor, nunca de payload do cliente. Esta função pura não consulta/verifica aprovação científica em banco.
- Rascunho IMP-070 preservado. Não inferimos família, nomes, características, textos educativos ou licenças.
- Não há chamada de IA, adaptação Gemini/OpenAI, endpoint de análise, alteração de banco, resultado falso na tela, APK novo ou custo.

## Verificação realizada

- 16/16 verificações locais artificiais, relatório `2026-10-23-bee-prompt-local.json`: igualdade exata com texto do Notion, catálogo aprovado, região omitida/dois valores aceitos, draft/vazio/duplicata/nível/nome inválido/tamanhos recusados, GPS não aceito como região, remoção de campos extras privados e erro sem ecoar dados. Executor temporário `.tmp/check-bee-prompt.mjs`; nenhuma dependência/framework adicionada.
- TypeScript estrito: `tsc --ignoreConfig --noEmit --strict --skipLibCheck --allowImportingTsExtensions --target ES2022 --module ESNext --moduleResolution bundler supabase/functions/_shared/bee-prompt.ts` aprovado após explicitar tipos nos callbacks. Essa verificação separada é necessária porque o arquivo ainda não faz parte de endpoint compilado pelo app.
- `npm run check`: lint e build aprovados. Sem teste Android novo; não há comportamento nativo novo.
- Critério científico, disponibilidade do provedor e teste com fotos reais: **não executados**. A preparação não fecha a IMP-024 nem suas dependências; registro no Notion distingue implementação de ativação.

## Decisão operacional

Professora autorizou iniciar gratuitamente e evoluir para pago depois. [D15 — decisão e evidências](../decisions/2026-10-23-free-ai-prototype.md). Gemini não foi ativado: [termos oficiais](https://ai.google.dev/gemini-api/terms), Age Requirements, restringem aplicações destinadas/provavelmente acessadas por menores de 18 anos. A restrição afeta o projeto escolar e foi comunicada à professora; não há tentativa de contorno nem conta adulta como solução presumida. Não foi encontrada/verificada alternativa gratuita elegível para ativação imediata. Nenhuma despesa autorizada.

Próximo: selecionar provedor elegível ao público e acesso seguro, concluir catálogo/gates e integrar execução autenticada, persistência atômica/cache e UI. Salvar/histórico permanecem independentes.

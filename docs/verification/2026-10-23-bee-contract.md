# IMP-023 — preparação do contrato de identificação

## Entrega

- Fonte consultada: [task IMP-023](https://app.notion.com/p/be6d3425eae482f3acd4013ad823a965) e [Data Model](https://app.notion.com/p/f8cd3425eae4834ea86901a55f278347), em 23/10/2026.
- `supabase/functions/_shared/bee-analysis.ts`: tipos BeeAnalysisV2, JSON Schema 2.0, limites técnicos, parser e validação de campos, tipos, catálogo/nível, unicidade, rank sequencial, evidências e estados. Erros sanitizados, sem ecoar a resposta recebida.
- O modelo Angular existente reexporta somente os tipos desse módulo: uma definição compartilhada, sem incluir validador ou configuração do provedor no aplicativo.
- Catálogo é argumento obrigatório e não vazio. O futuro serviço deve fornecer a versão aprovada usada na chamada, nunca uma lista recebida do cliente. Rascunho IMP-070 não foi promovido a catálogo aprovado.
- Limites técnicos: 16 KiB de JSON, três candidatos, cinco evidências por candidato, cinco limitações, 500 caracteres por texto, 100 por ID. São limites de entrada, sem interpretação científica.
- Cada candidato exige evidência escrita. Resultado inconclusivo ou imagem de qualidade pobre exige limitação. Nenhum código determina pela frase se a espécie está realmente sustentada: isso depende do prompt, da foto e de revisão científica. Qualidade pobre com evidência insuficiente deve resultar em inconclusive; o validador não inventa esse julgamento.
- `possible_match`/`no_match` mapeiam para completed; inconclusive permanece distinto. Falhas de formato lançam erro; não fabricam resultado científico. O futuro adaptador também deverá recusar refusal/incomplete antes de chamar o parser.

## Verificação

- `npm run check`: lint e build aprovados, sem novos avisos.
- TypeScript 6, `tsc --ignoreConfig --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution bundler supabase/functions/_shared/bee-analysis.ts`: aprovado.
- 37/37 cenários locais: espécie/gênero/família com IDs artificiais, até três candidatos, inconclusivo e no_match; rejeições de campos ausentes/extras, IDs desconhecidos, nível incompatível, ordem duplicada/incorreta, textos/listas excessivos, evidência vazia, JSON inválido e catálogo inválido; cópia defensiva e schema estrito nos dois objetos. Relatório: `2026-10-23-bee-contract-local.json`. Executor temporário em `.tmp/check-bee-contract.mjs` (sem nova dependência/framework).
- Revisão do schema contra [Structured Outputs, documentação oficial](https://developers.openai.com/api/docs/guides/structured-outputs): todos os campos required, additionalProperties false em cada objeto, sem condicionais complexas. Compatibilidade de modelo concreto ainda pendente de D15; nenhuma requisição à API executada.
- Consulta de configuração do Supabase verificou ausência de OPENAI_API_KEY e OPENAI_MODEL; somente metadados de secrets, sem ler seus valores.

## Limites e continuidade

Preparação local integrada ao repositório, **ainda sem endpoint de análise, implantação ou resultado na tela**. Não modifica banco, fotos, contas, catálogo, APK ou dados existentes. Testes A/B/RLS não se aplicam a estas funções puras; deverão acompanhar a futura persistência. Sem teste Android ou métrica biológica alegados.

Dependências IMP-038/070 e revisões C05/D24 continuam abertas. IMP-023 fica In progress; não concluir antes da integração e revisão humana. Próximo trabalho: prompt bee-v2, tabela e execução autenticada com gravação atômica/cache. Ativação paga depende da decisão D15 (conta, orçamento/quota e modelo). Chave somente no servidor, nunca no chat, Git ou Notion.

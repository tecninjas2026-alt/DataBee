# IMP-030/037 — consulta do resultado salvo (preparação)

## Entrega e limites

- [Critérios IMP-030](https://app.notion.com/p/d38d3425eae4830283528119bd2728d8) consultados. Preparação da leitura; **não conclui a task**: endpoint/provedor, catálogo aprovado, nomes/níveis/rank/evidências dos candidatos, conteúdo educativo D24 e avaliação real continuam pendentes. Não criamos nomes/taxonomia a partir de IDs nem promovemos o rascunho do catálogo.
- `analysis-results.service.ts`: consulta a observação saved do próprio usuário e, quando completed/inconclusive, busca ai_identifications persistida. Não lê GPS/foto, não escreve no banco e não invoca function/provedor. Idle/processing/failed não exibem cache de tentativa anterior.
- `analysis-result.page.ts/html`: substitui texto de cronograma por loading, erro com retry de leitura, ausência/sem acesso, não analisada, processing com consulta manual, falha técnica e resposta salva com data/limitações. Fixtures reconhecidas por provider fixture/model SIMULATED são exibidas como **Simulação de teste**, sem alegar identificação.
- `observation-detail.page.html`: botão Ver resultado da análise. Voltar/reabrir mantém observação salva. Sem botão Analisar habilitado enquanto a integração estiver pendente; retry apenas lê o banco.
- O validador compartilhado agora separa `validateBeeAnalysisStructure` para leitura da forma e `validateBeeAnalysis` para backend com catálogo real. A segunda continua exigindo IDs/níveis permitidos. A primeira não prova taxonomia. Ajustados acessos de propriedades de dicionário para o compilador Angular estrito (TS4111), sem enfraquecer configuração.
- Interface limpa dados ao sair, ignora retornos atrasados de outra conta/ID e cancela leituras com limite de 20 s. Dados em memória, sem novo cache local persistente.
- APK preparado como 1.0.2-test / código 3, mesma identidade Android. Compilação/publicação do binário registrada separadamente após verificação.

## Verificado

- `npm run check`: lint/build aprovados após corrigir TS4111. Sem novos avisos. Validador completo preserva **37/37** casos anteriores; prompt **16/16**. Reexecuções não chamaram IA.
- **18/18** controles do serviço Angular, relatório `2026-10-27-analysis-read.json`. SDK real contra Supabase com A/B/anon: A lê fixture identificada como simulação, nova instância reabre cache, B não abre A, anon/local-owner forjado e ausência de sessão negados, ID desconhecido/inválido indisponível, observação real de teste idle não vira análise, cancelamento rejeitado. Controles sintéticos focados: troca de conta durante resposta atrasada, cache ausente/malformado, schema/status incoerentes e não mostrar cache antigo em idle/processing/failed. Zero chamadas functions.invoke durante as leituras.
- Sem novas contas, fixtures, exclusões, migrations ou deploy. Apenas reutilizou a fixture IMP-026 preservada. Executor local em `.tmp/check-analysis-read.ts`/`.mjs`, compilado com esbuild já instalado; sem framework/dependência nova.
- Navegador autenticado real da professora: detalhe carregou foto/origem/estado Não analisada; botão levou à rota de resultado, loading encerrou, estado Não analisada informou que o registro está salvo. Viewport observado 395 px. Captura local `.tmp/analysis-result-idle-20261027.jpg` (sem foto/GPS/identidade). Reabertura/retorno conferidos sem analisar foto. A inspeção não mede precisão científica nem equivale a teste Android.

## Falta para concluir

Concluir execução autenticada/persistência atômica/cache (IMP-027/029), provedor elegível com acesso e custo zero (D15), catálogo aprovado (IMP-070/C05), conteúdo curado (D24) e apresentação completa de candidatos. Ler resultado com candidatos atualmente mostra indisponibilidade dos nomes; não revela IDs técnicos nem inventa nomes. Fotos DEV reais, falhas de rede no dispositivo e revisão humana ainda não comprovadas. Manter In progress; nenhum Done presumido.

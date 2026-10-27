# IMP-029 — orquestração local de uma tentativa de identificação

Fonte: [IMP-029 no Notion](https://app.notion.com/p/d66d3425eae483b089d70165cc693a53), critérios consultados em 27/10. Essa preparação não conclui a task nem suas dependências.

## Código

`supabase/functions/_shared/bee-execution.ts` prepara o fluxo, separado do provedor e do banco:

1. Valida referências e catálogo aprovado; consulta resultado salvo compatível com schema 2.0, bee-v2 e versão do catálogo. Valida candidatos/níveis/ranks pelo contrato completo antes de devolver cache, inclusive quando o provedor está indisponível. Resultado inválido não provoca reanálise automática.
2. Sem resultado, exige configuração do provedor antes de reservar uma tentativa. O adaptador futuro do banco deve verificar propriedade, estado, quotas e aquisição exclusiva atomicamente; retorna busy/limited/cache/started. Uma segunda consulta de cache ocorre sob o bloqueio desse adaptador para fechar a corrida entre pedidos.
3. Depois de adquirir uma tentativa válida, carrega/verifica JPEG e transmite ao adaptador de IA somente imagem saneada, prompt fixo e projeção do catálogo. Não passa ID/dono/GPS, observação completa ou URL assinada ao provedor.
4. Uma chamada, sem retry/fallback automático. Limite de 45 segundos para carregar/analisar; cancelamento impede consumir resposta tardia mesmo se o adaptador ignorar o sinal. Isso não garante interrupção ou ausência de cobrança externa.
5. Valida resultado integralmente e solicita gravação conjunta do resultado/status condicionada ao attempt_id atual. possible_match/no_match → completed; inconclusive → inconclusive. Falhas pedem encerramento apenas da tentativa atual; erro de confirmação de gravação não autoriza apagar resultado/observação/foto.

Os métodos `acquire`, `complete` e `fail` são **contratos de adaptação**, não rotinas SQL já implementadas. O módulo não implementa autenticação HTTP; isso permanece no serviço chamador antes de qualquer acesso/custo. Não contém provedor configurado, SQL, segredo, chamada externa concreta ou acesso direto ao banco.

## Verificação

**32/32 verificações sintéticas locais** em [JSON](2026-10-27-bee-execution.json). Cobrem cache sem provedor, metadados/cache malformados, ID fora do catálogo, busy/limited, reabertura, duas solicitações concorrentes com adaptador em memória, estados científicos válidos, JPEG inválido, falhas de leitura/aquisição/provedor/gravação, cancelamento, resposta tardia e tentativa substituída.

O caso de timeout substitui somente no executor local o relógio de 45 segundos por 10 ms. Não é medição de rede/provedor real. As duas solicitações simulam o contrato de exclusão em memória; **não provam concorrência, quota, RLS ou atomicidade no PostgreSQL**. Fixture sem dados científicos reais; nenhuma acurácia medida.

TypeScript estrito do módulo, lint específico e `npm run check` aprovados. Executor `.tmp/check-bee-execution.mjs` utiliza ferramentas já instaladas; sem framework/dependência nova. Após a revisão do cancelamento, os 32 casos foram executados novamente.

## Ainda não executado

Adaptador SQL/rotinas atômicas, quotas efetivas, expiração de processing no banco, rollback SQL e SDK A/B/anon dessa futura escrita; integração com função implantada, provedor real e Android. Limites planejados 3 tentativas/observação e 20 chamadas/usuário/dia continuam sem ativação/ratificação de acesso ou orçamento.

Nenhuma migration/deploy/alteração remota, envio de foto, custo ou APK novo nesta etapa. O módulo não está conectado à interface nem à função stub. Próxima etapa técnica é implementar/revisar o adaptador atômico e demonstrar o contrato com PostgreSQL real antes de ativar qualquer análise.

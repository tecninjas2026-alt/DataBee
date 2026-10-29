# IMP-025/027/028 — acesso real aos metadados Mistral

Data: 29/10/2026 (America/Sao_Paulo). Projeto: `uqfuuahziwgxwjymtwil`.

## Resultado confirmado

**HTTP 200** da consulta administrativa `GET /analyze-observation/provider-readiness`, executada no Supabase e limitada a `GET https://api.mistral.ai/v1/models/ministral-8b-2512`. A resposta informa `vision: true` e `completion_chat: true`. **Não houve geração de texto, envio de foto, avaliação de qualidade, custo habilitado ou identificação de abelha.** Metadados não provam compatibilidade do schema durante uma geração, cotas de geração ou qualidade científica.

`analyze-observation` publicado no ambiente existente, com `verify_jwt: true`. A análise de observações continua sem catálogo aprovado, retorna `catalog_unavailable` antes de consultar/baixar a imagem e não está ligada à interface. A rota administrativa exige credencial privada do servidor; JWT de participante e chave pública não bastam. Não há novo endpoint de análise paralelo, dependência ou permissão no APK.

## Correção necessária e evidência anterior

O primeiro ensaio de 28/10 teve 5/8 verificações aprovadas: comparação com credencial administrativa legada não funcionou no servidor; uma expectativa do roteiro também usava `configuration_missing`, mas o handler retorna corretamente `catalog_unavailable` quando falta catálogo. Nenhuma dessas respostas provou acesso Mistral.

Em 29/10, a credencial atual do servidor em header administrativo explícito foi aceita. A consulta passou a detectar **valor Mistral malformado** (espaços internos). A conferência de 27/10 provava apenas que um valor havia sido salvo e seu digest correspondia, não que fosse uma chave válida. Esse limite corrige as conclusões anteriores; a causa exata do conteúdo capturado anteriormente não foi recuperada.

Substituição `DataBee-dev-2026-10-29`, mesmo Default Workspace, somente conectores compartilhados e mesmo vencimento **26/11/2026**, após a professora concordar em refazer o cadastro. Área de transferência limpa antes da cópia; valor conferido contra a confirmação atual e formato esperado, sem mostrá-lo. Substituído `MISTRAL_API_KEY` no cofre Supabase; digest igual e persistência após reload conferidos. Chave somente em memória durante a transferência; nenhum arquivo/chat/Notion/log com seu valor. Temporários e clipboard limpos. **Chave antiga não revogada** nesta etapa; não executar exclusão/limpeza sem autorização específica.

## Verificações

- **34/34 locais**, HTTP simulado: autenticação por credenciais configuradas, recusa de usuário/chave pública, chave atual, headers traduzidos/operacionais, métodos/query, cancelamento, timeout, limites de corpo, formato, UTF-8, respostas inesperadas e ausência de reenvio automático. Relatório `2026-10-29-provider-readiness-local.json`.
- **8/8 remotas**, SDK e contas técnicas existentes A/B/anon: operador consulta Mistral (200); participantes e anônimo recusados na rota administrativa (401); operador POST recusado (405); observação própria sem catálogo preservada/desabilitada (503); B não consulta análise de A (404); anônimo recusado na análise (401). Relatório `2026-10-29-provider-readiness-remote.json`.
- TypeScript estrito e lint específicos, bundle local e `npm.cmd run check` aprovados. Credencial atual Supabase obtida da CLI somente em memória; não pedir segredo no chat.
- CLI 2.121 não oferece `--dry-run` em `functions deploy`: validação/bundle locais foram executados antes da publicação via `--use-api`, sem desligar JWT. Não chamar essa validação de simulação remota. Nenhuma migration foi criada/aplicada.

## Operação e limites

Rota de manutenção, sem CORS para o aplicativo. GET sem query/body; chamada única, host/modelo fixos, redirects recusados, timeout de 10 s e metadados até 16 KiB. Compara credenciais configuradas por hash, não confia em uma role simplesmente decodificada do JWT. Credencial atual no header `x-databee-operator-key` evita depender da representação do bearer legado na infraestrutura; a causa exata da divergência legada não foi comprovada. Erros sanitizados; valores, payloads do provedor, identidade/GPS/observações não são retornados.

O modelo da consulta é um candidato fixo para inspeção, **não o modelo configurado para análise de fotos**. Seguem pendentes: elegibilidade/público/consentimentos, catálogo aprovado, persistência atômica e quotas, chamada de imagem/schema real e avaliação DEV/TEST. Sem novo APK nesta alteração de servidor. Não marcar IMP-025/028 Done nem liberar identificação por este resultado.

Fontes oficiais consultadas: [Models API Mistral](https://docs.mistral.ai/api/endpoint/models), [modelo e capacidades documentadas](https://docs.mistral.ai/models/ministral-3-8b-25-12), [segredos e variáveis Supabase](https://supabase.com/docs/guides/functions/secrets).

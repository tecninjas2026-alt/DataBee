# IMP-028 — adaptador candidato Mistral, somente local

Data: 27/10/2026. Estado: preparação; identificação automática ainda indisponível.

## Implementado

`supabase/functions/_shared/mistral-vision.ts` adapta a chamada de visão ao contrato `BeeVisionProvider`, sem nova dependência e sem ligação ao endpoint implantado. Exige habilitação explícita, confirmação do modo gratuito, opção de treinamento da API desabilitada, revisão de público/termos e modelo estável com capacidades conferidas na conta. Esses registros são verificações humanas; o código não comprova configurações de cobrança ou consentimento.

O pedido usa o host oficial fixo, JPEG revalidado em base64, prompt bee-v2 e projeção exata do catálogo aprovado. Não inclui GPS, identidade, observação completa ou URL privada. Uma chamada, sem redirecionamento, retry ou fallback. Limite de 35 segundos e resposta de até 64 KiB; JSON do resultado também respeita o limite próprio do contrato. Recusa, truncamento, modelo divergente e candidato fora do catálogo são rejeitados. Erros não revelam resposta bruta ou credenciais.

## Conferência realizada

37/37 cenários de HTTP **simulado localmente**, em `.tmp/check-mistral-vision.mjs`. Relatório sanitizado: `2026-10-27-mistral-adapter.json`.

- Cinco condições de habilitação, segredo/modelo inválidos e catálogo draft bloqueados.
- Pedido com host fixo, base64, schema e campos limitados; prompt alterado e JPEG inválido bloqueados antes de HTTP.
- 401/403, 429, 408/504, 500 e erro de rede tratados sem retry ou vazamento.
- Cancelamento, deadline com relógio encurtado, corpo excessivo, JSON inválido, recusa, truncamento, tool call, múltiplas escolhas, modelo divergente e táxon inventado.
- Respostas válidas no_match e inconclusive preservadas.

Compilação TypeScript estrita e lint específicos aprovados. `npm.cmd run check` aprovado. Nenhuma métrica de identificação deriva desses casos.

## Ainda não verificado / não executado

A professora confirmou que a equipe não tem conta Mistral. Não houve conta/chave criada, aceite de termos, chamada de modelo, transmissão de foto, mudança de cobrança, migration, deploy ou novo APK nesta etapa. Disponibilidade do modelo, limites efetivos, modelo retornado e compatibilidade completa com o schema exigem ensaio real autorizado.

Para ativar: responsável cria conta e confere Free mode, termos/público/consentimentos e opt-out específico da API; segredo fica apenas no servidor. Ainda faltam catálogo aprovado, persistência SQL atômica/quotas e ligação ao serviço/interface. Testar com fotos DEV autorizadas e medir qualidade antes de afirmar funcionamento. A escolha permanece condicional; teto de custo zero.

Fontes oficiais e procedimento: `docs/decisions/2026-10-27-ai-free-provider-review.md`.

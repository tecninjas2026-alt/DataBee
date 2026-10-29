# Mistral — conferência da conta e privacidade

> **Correção posterior, 29/10:** a conferência de presença/digest abaixo não comprovava que o valor era uma chave válida. A consulta real detectou valor malformado; o cadastro foi substituído por DataBee-dev-2026-10-29, com mesmo escopo e vencimento 26/11/2026, e a API de metadados respondeu HTTP 200. A chave antiga não foi revogada. Estado atual/evidências: `2026-10-29-provider-readiness.md`. Não interpretar o registro histórico de 27/10 como teste de funcionamento do provedor.

Data: 27/10/2026 (America/Sao_Paulo). Conferência por interface autenticada, sem exposição de credenciais.

## Confirmado

- Professora criou a conta e abriu Mistral Studio; acesso autenticado observado.
- Assinatura exibe **Gratuito**. Franquia inclusa da API/Studio exibida como US$ 0 utilizados de US$ 10; o painel explica que é limite incluso, não custo adicional. Não interpretar como crédito transferível nem garantia de acesso de qualquer modelo.
- API Pay-as-you-go exibe **Ativar**, sem ativação executada.
- Limites listam `ministral-8b-2512` (625.000 tokens/minuto; 3,13 requisições/segundo no painel). A listagem não comprova uma chamada autorizada ou qualidade.
- Treinamento das chamadas de API inicialmente ligado. A professora autorizou expressamente desativar; opção desligada e persistência **confirmada após recarregar**. Modelos Labs continuam desligados. Não alterar a opção separada de Vibe.

## Divergência de acesso a esclarecer

O Studio → Chaves de API mostra botão Nova chave desabilitado e aviso de upgrade para organização Free. Admin → Chaves de API oferece o formulário regular. Com autorização específica da professora, a criação **foi concluída pela interface administrativa normal**, sem upgrade/pagamento. O uso efetivo da API ainda não foi verificado; criar chave não prova acesso ao modelo.

Chave criada: `DataBee-dev-2026-10-27`, Default Workspace, 30 dias (26/11/2026), somente conectores/conexões compartilhados. Após login humano, **`MISTRAL_API_KEY` cadastrado no cofre das Edge Functions do projeto `uqfuuahziwgxwjymtwil`**, com autorização específica já concedida. Digest SHA-256 apresentado pelo servidor comparado em memória com o valor transferido: igual. Listagem persistente após recarregar conferida. Nenhum valor secreto em chat/Git/Notion/logs/arquivo local; área de transferência e referências temporárias limpas após transferência. O relato anterior de login pendente foi resolvido na nova aba autenticada do projeto correto.

## Não executado

Nenhuma chamada de modelo, foto transmitida, migration, deploy, pagamento ou APK nesta conferência. A única configuração Supabase alterada foi o cadastro autorizado do secret. Antes de liberar identificação, faltam acesso gratuito efetivo, público/termos/consentimentos, modelo/schema ao vivo, catálogo e persistência atômica/quotas. Ter o secret cadastrado não habilita a identificação: o adaptador segue isolado e nenhum booleano de liberação foi ativado. Opt-out não equivale a ausência absoluta de retenção. `npm.cmd run check` aprovado na preparação; esta conclusão altera documentação/configuração do cofre, sem mudança de código executável.

Fontes: telas autenticadas de `/subscription`, `/plateforme/limits`, `/plateforme/privacy`, `/organization/api-keys` no Admin Mistral e `/api-keys` no Studio; cofre de Edge Functions do projeto DataBee no Supabase. Provas locais (ignoradas pelo Git): `.tmp/mistral-api-training-disabled-20261027.jpg`, `.tmp/mistral-key-prepared-20261027.jpg` e `.tmp/supabase-mistral-secret-saved-20261027.jpg`; sem valor secreto. Documentação do modelo: https://docs.mistral.ai/models/ministral-3-8b-25-12 (visão e Structured Outputs documentados; execução real pendente).

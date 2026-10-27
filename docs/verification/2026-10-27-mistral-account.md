# Mistral — conferência da conta e privacidade

Data: 27/10/2026 (America/Sao_Paulo). Conferência por interface autenticada, sem exposição de credenciais.

## Confirmado

- Professora criou a conta e abriu Mistral Studio; acesso autenticado observado.
- Assinatura exibe **Gratuito**. Franquia inclusa da API/Studio exibida como US$ 0 utilizados de US$ 10; o painel explica que é limite incluso, não custo adicional. Não interpretar como crédito transferível nem garantia de acesso de qualquer modelo.
- API Pay-as-you-go exibe **Ativar**, sem ativação executada.
- Limites listam `ministral-8b-2512` (625.000 tokens/minuto; 3,13 requisições/segundo no painel). A listagem não comprova uma chamada autorizada ou qualidade.
- Treinamento das chamadas de API inicialmente ligado. A professora autorizou expressamente desativar; opção desligada e persistência **confirmada após recarregar**. Modelos Labs continuam desligados. Não alterar a opção separada de Vibe.

## Divergência de acesso a esclarecer

O Studio → Chaves de API mostra botão Nova chave desabilitado e aviso de upgrade para organização Free. Admin → Chaves de API oferece o formulário regular. Com autorização específica da professora, a criação **foi concluída pela interface administrativa normal**, sem upgrade/pagamento. O uso efetivo da API ainda não foi verificado; criar chave não prova acesso ao modelo.

Chave criada: `DataBee-dev-2026-10-27`, Default Workspace, 30 dias (26/11/2026), somente conectores/conexões compartilhados. Valor capturado somente em memória para transferência autorizada ao Supabase, sem exposição no chat/Git/Notion/logs ou arquivo local. Área de transferência limpa após captura. O Dashboard Supabase pediu login; tentativa normal de acesso via GitHub também pediu autenticação. Solicitado que a professora conclua esse login no navegador. **Secret ainda não cadastrado no Supabase.** Preservar a aba de criação até concluir armazenamento, sem capturar seu segredo em screenshots.

## Não executado

Nenhuma chamada de modelo, foto transmitida, configuração Supabase alterada, migration, deploy, pagamento ou APK nesta conferência. Antes de liberar identificação, faltam login/secret no servidor, acesso gratuito efetivo, público/termos/consentimentos, modelo/schema ao vivo, catálogo e persistência atômica/quotas. Opt-out não equivale a ausência absoluta de retenção. `npm.cmd run check` aprovado nesta etapa.

Fontes: telas autenticadas de `/subscription`, `/plateforme/limits`, `/plateforme/privacy`, `/organization/api-keys` no Admin Mistral e `/api-keys` no Studio. Provas locais (ignoradas pelo Git): `.tmp/mistral-api-training-disabled-20261027.jpg` e `.tmp/mistral-key-prepared-20261027.jpg`; sem segredo. Documentação do modelo: https://docs.mistral.ai/models/ministral-3-8b-25-12 (visão e Structured Outputs documentados; execução real pendente).

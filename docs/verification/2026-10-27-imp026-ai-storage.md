# IMP-026 — armazenamento protegido dos resultados

## O que foi entregue

- [Critérios completos da IMP-026](https://app.notion.com/p/c63d3425eae483f898e201d4be96350f) lidos em 27/10/2026. IMP-013 aplicada; contrato IMP-023 implementado, mas revisão humana/gates e catálogo continuam pendentes. Nenhum Done presumido.
- Migration `20261027143000_imp026_ai_identifications.sql`: uma linha por observação, vínculo obrigatório, identificação do provedor/modelo/versões e resultado BeeAnalysisV2. `model_version` pode ficar nulo quando o provedor não o revelar. `catalog_version` obrigatório para rastreabilidade.
- RLS ativo desde a criação. Apenas SELECT do próprio resultado para authenticated; nenhum INSERT, UPDATE, DELETE ou upsert pelo cliente. Anônimo sem acesso. Não permite leitura por publicação nesta etapa, conforme a task.
- O banco reforça formato do envelope, schema 2.0, estados, até três candidatos, até cinco limitações e tamanho de 16 KiB. **Não valida taxonomia nem todo campo interno de cada candidato:** a gravação futura deve passar pelo validador completo da IMP-023 e catálogo aprovado no backend. Não guardar resposta bruta do provedor.
- Tipo de leitura `src/app/core/models/ai-identification.model.ts`, sem tipos de escrita para cliente.
- Não altera estados de observações existentes, fotos, usuários, configurações de conta ou permissões de salvamento. Não cria endpoint nem modifica telas. Sem chamada de IA, custo ou APK novo.

## Revisão e aplicação

Retomada autorizada pela professora no chat em 27/10, preservando a delegação anterior de decisões e execução técnicas necessárias (AGENTS §4). Alteração aditiva revisada e explicada antes da aplicação; teto de custo de IA permanece zero. Sem pedir confirmação técnica redundante.

1. `git switch main`, `git pull --ff-only`: main limpa e atualizada, origem 869b28c.
2. Inspeção somente leitura: cinco migrations anteriores aplicadas; tabela ai_identifications ausente (PGRST205); tabela observations existente. Grants remotos conferidos: INSERT só id/user_id/captured_at/photo_source e UPDATE só captured_at; estados e curadoria já protegidos.
3. `npm run supabase -- db push --dry-run`: listou **somente** a migration IMP-026, sem seed ou alteração de roles.
4. `npm run supabase -- db push --yes`: aplicação aprovada pela CLI, sem reset. Listagem posterior confirmou versão local/remota 20261027143000. SQL aplicado é imutável.
5. Inspeção posterior confirmou RLS ativo e única policy SELECT de authenticated/owner. Essa inspeção é complementar; a prova de acesso veio dos clientes SDK abaixo.

## Evidência real de permissões

**42/42 Pass** contra o projeto dev `uqfuuahziwgxwjymtwil`, usando Supabase SDK real, JWT de A, JWT de B e cliente anônimo. Relatório sanitizado `2026-10-27-imp026-remote.json`, com hash da migration e data da execução.

- A lê sua simulação; B não recebe a linha; anônimo não tem SELECT.
- A/B/anon não inserem, alteram ou excluem resultados; A não faz upsert.
- A não forja INSERT/UPDATE de analysis_status, analysis_started_at, curation_status, publication, public_region_label e lifecycle.
- Backend não consegue criar dois resultados para a mesma observação, referenciar observação inexistente ou gravar envelopes inválidos, schema antigo e provedor vazio.
- Após as tentativas rejeitadas, simulação e observação mantiveram os valores iniciais.

Contas técnicas A/B de 23/10 reutilizadas após conferência da marca de teste. Nenhuma conta nova, mensagem de e-mail ou credencial solicitada. Tokens apenas em memória; segredo da CLI capturado dentro do processo e não impresso.

Foi criado **um registro artificial separado**, privado, com provider `fixture`, model `SIMULATED-IMP026-NO-VLM`, catálogo `fixture-contract-v1`, matches vazio e limitação explícita de simulação. A observação técnica correspondente não contém foto/GPS. Não representa análise real, não muda observação de usuário e não mede acurácia. IDs somente em `.tmp/imp026-fixture-manifest.json`, preservado.

O roteiro da task prevê remoção posterior da fixture. Não foi executada exclusão administrativa: o histórico da equipe exige confirmação específica para apagar dados remotos. A fixture fica preservada; limpeza e checkpoint de compreensão permanecem pendentes. Tentativas de DELETE dos clientes foram negadas pelo banco.

## Verificações locais e próximos passos

- `npm run check`: lint e build aprovados, sem novos avisos; formatação do tipo aprovada.
- Executor focado temporário `.tmp/check-imp026-remote.mjs`, com helper `.tmp/imp026-clients.mjs`; sem nova dependência ou framework.
- Não houve alteração visual/nativa; teste Android novo não se aplica a esta etapa. Não alegar aprovação humana do APK de 23/10: ela segue pendente para salvar/reabrir.
- Persistência real e atômica junto ao estado, bloqueio de tentativas concorrentes, cache e interface pertencem às IMP-027/029/030. Catálogo aprovado e serviço elegível com acesso ainda necessários. Nenhuma configuração paga autorizada.
- A task permanece In progress por dependências/revisão humana e tratamento autorizado da fixture; não declarar o fluxo de identificação concluído.

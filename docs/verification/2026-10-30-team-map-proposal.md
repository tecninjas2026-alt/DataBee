# Mapa da equipe — proposta para revisão, 30/10/2026

**Preparação local. Banco NÃO alterado; mapa ainda não integrado ao APK.**

A professora pediu mapa de Curitiba/RMC por GPS e escolheu registros da equipe com localização aproximada. Isso autoriza a preparação. A precisão de cerca de 2 km, a alteração do banco e a extensão de D10 abaixo são propostas para revisão.

## Resultado proposto

1. Mapa de Curitiba e dos 29 municípios da RMC, com zoom, recorte regional e créditos.
2. No registro salvo com GPS, a pessoa escolhe **Compartilhar área aproximada no mapa**. Nenhum registro anterior será compartilhado automaticamente. GPS localiza o registro; não detecta abelhas/ninhos automaticamente.
3. Equipe = participantes autenticados do DataBee, conforme audiência D09. Não existe grupo separado no banco; sem mapa anônimo/aberto à internet.
4. Servidor transforma o GPS já salvo em célula fixa de cerca de 2 km por lado. Mapa recebe áreas e contagens, sem foto, nome, e-mail, ID do participante/observação ou coordenada real. Não é mapa de ruas ou ponto exato de ninho.
5. Retirar do mapa inativa o compartilhamento e preserva o registro/foto privados. Compartilhar área não publica a observação completa nem depende do feed.
6. Sem rastreamento contínuo. GPS opcional; galeria continua sem GPS atual. Compartilhamento exige GPS do dispositivo com consentimento salvo, precisão informada de até 1 km e ponto dentro da base simplificada da RMC. Caso contrário, registro permanece salvo/privado.

## Mudança concreta no banco

Arquivo: `supabase/migrations/20261030140000_imp066_approximate_team_map.sql`.

- Nova tabela `map_observation_shares`: referência/dono privados, índices de célula, data ao dia, consentimento e ativo/inativo. RLS ligado, sem acesso direto de participantes/anônimos. Sem GPS exato nessa tabela.
- `get_my_map_share` / `set_my_map_share`: somente dono autenticado; conferem observação salva/GPS adequado. Compartilhar exige escolha explícita; retirada inativa sem DELETE.
- `list_map_cells`: somente autenticados; contagens por célula, quantidade com análise, dia mais recente e quantidade própria. Paginação por célula; sem fotos, identidades, IDs privados ou coordenadas reais. Ter análise não comprova espécie/presença.
- Três rotinas `SECURITY DEFINER`, `search_path` vazio, defesa `auth.uid/auth.role` e filtro explícito de dono. Função geométrica auxiliar sem execução por participante/anônimo. Revisar antes de aplicar.
- Sem mudar políticas atuais de observações/GPS, estados de análise/publicação, PostGIS, cobrança ou chamada à IA.

**Impacto em D10:** hoje só são compartilhados dois rótulos regionais amplos. Propomos acrescentar, exclusivamente no mapa e por escolha, células aproximadas de 2 km. Isso continua sendo informação de localização e não garante anonimização. GPS exato permanece privado. A extensão de D10 precisa da mesma aprovação específica da migration; os documentos anteriores não foram substituídos silenciosamente.

## Fontes e verificações

- [AMEP — composição da RMC](https://www.amep.pr.gov.br/FAQ/Municipios-da-Regiao-Metropolitana-de-Curitiba): 29 municípios.
- [IBGE — malhas simplificadas v3](https://servicodados.ibge.gov.br/api/docs/malhas?versao=3): limites e códigos obtidos nas APIs oficiais em 30/10/2026. Data da consulta não é ano do levantamento; base ilustrativa, sem precisão de navegação/levantamento.
- 29 municípios, 2.633 vértices; script em `scripts/prepare-curitiba-region.mjs`; dados públicos/tipos em `src/app/features/map`.
- Prévia independente `docs/previews/curitiba-team-map.html`: pontos fictícios rotulados, zoom e Curitiba/RMC, sem GPS, sessão ou rede de mapas. SVG local serve para revisar layout/geometria. Integração final da IMP-066 prevê Leaflet com a mesma base local; nenhuma dependência adicionada agora.
- Inspeção remota somente leitura: estrutura/chave composta compatíveis, RLS ativo, tabela/funções novas sem conflito.
- `db push --dry-run`: somente `20261030140000_imp066_approximate_team_map.sql`; seeds/roles vazios. **Não valida execução SQL, permissões ou consentimento. Não aplicada.**
- Cinco verificações locais de cartografia/projeção passaram; lint/build passou. Prévia em 390 px, sem overflow horizontal. Não há teste de compartilhamento remoto ou teste físico do mapa.

## Depois da aprovação

Aplicar somente a migration revisada e provar com clientes reais A/B/anônimo: agregados autenticados; acesso direto proibido; compartilhar/retirar somente do dono; sem GPS exato; recusa de rascunho/sem GPS/fora da região; paginação, concorrência e fronteiras. Erro após aplicação exige nova migration, preservando as aplicadas.

Depois integrar o mapa e o botão explícito, verificar navegador/Android e entregar APK no Notion. IMP-066/D06 era Stretch com dependências IMP-056/039; pedido atual prioriza a preparação, sem presumir gates/Done ou remover Core pendente. Diferença proposta: áreas agregadas consentidas, sem abrir detalhe/foto publicados nesta primeira entrega.

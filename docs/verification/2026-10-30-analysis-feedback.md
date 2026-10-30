# Retorno Android: análise volta a Não analisada — 30/10/2026

## Relato e diagnóstico

Professora relata botão e mensagem Analisando a foto visíveis, mas todas as tentativas terminam em Não analisada. Informa usar a mesma conta do primeiro registro. Não é Pass nem comprovação de resultado inconclusivo. Causa específica do aparelho ainda não confirmada.

Consulta remota minimizada: a conta originalmente liberada não possui tentativa reservada; registro original segue idle. Há outra conta não técnica com registros recentes idle, mas não atribuir essa conta à professora nem ampliar o piloto por suposição. Configuração de IDs conferida por digest e coincide com o manifesto. O campo da CLI de secrets é value (digest), não digest; checagem inicial usando campo inexistente foi descartada. Nenhum valor de segredo ou ID pessoal publicado.

Serviço implantado responde 200/cached para o resultado técnico já existente; OPTIONS para origem Android responde 204 com os quatro headers usados. Isso não prova a conexão do telefone. Painel de logs do Supabase permaneceu carregando; não inventar diagnóstico a partir dele. Nenhuma foto pessoal enviada pelo agente, nova geração, mudança de permissão, migration, cobrança ou exclusão.

## Correção de feedback

A tela antiga mantinha Não analisada em destaque após falha anterior à reserva e mostrava o erro mais abaixo. Agora, após erro com banco idle, mostra Análise não iniciada e o motivo logo abaixo do título. Falta de liberação no piloto é explícita; HTTP 401 do gateway, mesmo sem código do handler, orienta renovar sessão. Mensagens brutas/segredos nunca são mostrados; consulta e envio continuam separados.

Seis verificações focadas do serviço Angular: cache real existente, recusa real de conta técnica excluída, 401 sem código, falha de transporte, sucesso com status inválido e resposta atrasada após troca de conta. 6/6 Pass; detalhes em 2026-10-30-analysis-feedback.json. Duas chamadas SDK reais, demais fronteiras controladas. Nenhuma chamada nova de modelo.

APK 1.0.5-test/código 6 publicado para tornar o motivo visível no aparelho. Essa atualização melhora o diagnóstico; não comprova resolução da causa do pedido recusado nem acurácia. Próximo: instalar atualização e registrar a mensagem exata exibida após um único pedido. Preservar todas as observações e a restrição de acesso atual.

## Conferência visual controlada

Template e lógica da página exercitados em prévia Angular local de 360 × 800, com dependências de leitura/pedido substituídas por dados artificiais e recusa controlada; adaptação JIT do input de rota/lifecycle somente no harness ignorado. Toque no botão mudou Não analisada para Análise não iniciada, com a mensagem vermelha junto do título. Sem sessão real, envio de imagem ou prova da causa do telefone. Check de produção, sync e assembleDebug aprovados; teste físico pendente.

## Entrega compartilhada

Fonte bf5f56b47f09a816b82d7b17ad750d20a704ee33; APK 9.127.520 bytes, 44 assets web iguais por hash, sem server.url, assinatura igual à anterior. SHA-256 ac7c172b16cdd2192386f5c3864057596ed9c6d770b2a0c890e1350799af24c7. [Download público](https://github.com/tecninjas2026-alt/DataBee/releases/download/android-test-2026-10-30-bf5f56b/DataBee-2026-10-30-bf5f56b-debug.apk) com HTTP 200/tamanho/digest conferidos. Notion versões atualizado com download no topo e seção 1.0.5, mantendo histórico; IMP-030 recebeu relato, evidência, explicação e pendência em Review. Teste físico desta atualização e resolução da causa continuam pendentes.

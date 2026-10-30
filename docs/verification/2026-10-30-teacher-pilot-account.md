# Bloqueio do piloto confirmado e conta da professora corrigida — 30/10/2026

## Evidência nova

Professora enviou capturas do próprio aparelho após confirmar que usa sua conta. O aviso vermelho corresponde exatamente ao código pilot_restricted da versão 1.0.4: a requisição chegou ao handler autenticado, mas a lista do piloto recusou o dono antes de reservar tentativa/baixar foto/chamar modelo. Não era resultado biológico inconclusivo, erro do botão ou falha de persistência. A orientação anterior de repetir o botão não resolvia essa restrição.

Metadados visíveis da captura (minuto de criação, minuto de captura, origem câmera, registro privado e salvo) corresponderam a uma única observação no projeto. Seu dono é uma conta confirmada, não técnica, ausente da lista original montada a partir do primeiro registro. Nenhuma coordenada, foto, e-mail ou ID de participante foi publicado. A captura com localização privada permanece somente no anexo fornecido pela usuária, sem cópia em Git/Notion ou envio ao VLM.

## Correção

Incluída somente a conta identificada como professora nas capturas e na declaração direta, preservando as duas entradas anteriores (professora original e técnica B). IDs continuam no servidor/manifesto local ignorado. Não ampliado para alunos, público geral ou wildcard. O acesso é somente às próprias observações; RLS, JWT e quotas preservados. Lista anterior conferida antes da alteração e digest posterior comparado. Sem chave nova, mudança de plano, migration, cobrança ou exclusão.

Cinco verificações remotas aprovadas: cache técnico segue 200/cached (sem nova geração); conta técnica excluída segue 403; B não acessa observação privada da professora (404); anônimo segue 401; registro pessoal permanece idle, sem análise automática. JSON: 2026-10-30-teacher-pilot-account.json. A prova de configuração não equivale ao teste final com a sessão da professora no aparelho; esse novo clique permanece pendente.

Servidor analyze-observation atualizado com o mesmo código/autenticação para carregar a configuração corrigida. Nenhum APK novo necessário para remover o bloqueio; 1.0.4 e 1.0.5 usam o mesmo serviço. 1.0.5 mantém a melhoria de feedback.

## Próximo teste

Na instalação atual, abrir o mesmo registro e tocar uma vez em Analisar foto com IA. A professora decide o envio explícito da própria foto; agente não a transmitiu. Guardar o resultado ou mensagem efetivamente recebida. Não marcar Done/identificação bem-sucedida/acurácia antes dessa confirmação. Custo zero mantido.

Registro de continuidade: Notion versões e IMP-030 receberam a correção posterior, causa comprovada nas capturas, limites e roteiro sem nova instalação. Tarefa permanece Review; confirmação humana da análise continua pendente. Quatro verificações de cache/403/404/401 também passaram após a atualização do serviço.

## Confirmação humana posterior

Professora confirmou Sugestão disponível, visualização da sugestão no resultado e preservação após fechar/reabrir. O teste pendente acima foi realizado nesse escopo; não pedir repetição. Evidência e limites em `2026-10-30-android-ai-device.md`. Não valida acerto científico nem versão instalada específica.

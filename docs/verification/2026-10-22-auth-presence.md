# Contas no Supabase — 22/10/2026

## Relato resolvido

A equipe relatou contas ausentes em Authentication → Users. Depois confirmou que estava olhando outro projeto Supabase e que os usuários estão gravados corretamente. Não é uma falha comprovada de gravação ou de sessão do app.

## Conferência somente leitura pelo agente

- App vinculado ao projeto `uqfuuahziwgxwjymtwil`.
- GET /auth/v1/settings: HTTP 200, e-mail e cadastro habilitados, confirmação obrigatória. Chave lida em memória e não publicada.
- Consulta administrativa em transação somente leitura: **4 contas, 3 confirmadas, 1 aguardando confirmação; 4 perfis, nenhuma conta sem perfil**. Datas de criação entre 16 e 22/10.
- Trigger de perfil ativo após INSERT em auth.users.
- Navegador do chat mostrou sessão ativa e perfil carregado; não equivale a novo login/cadastro testado.
- Nenhum e-mail, senha, token ou identificador de usuário publicado; nenhum dado remoto alterado.

Painel correto: https://supabase.com/dashboard/project/uqfuuahziwgxwjymtwil/auth/users

## Continuidade

Preservar autenticação existente. Ainda faltam comprovação de cadastro novo, entrega/confirmação de e-mail e escopo completo de sessão conforme IMP-033/034. A equipe pediu avançar no navegador antes de retomar testes físicos. Nenhum Done novo atribuído.

Conferência adicional: uma nova aba do navegador abriu diretamente /tabs/registrar e restaurou a sessão existente, exibindo Tirar foto e Escolher da galeria. Sem login novo, upload ou alteração remota. Isso comprova restauração no navegador atual, sem declarar validação completa da IMP-034.

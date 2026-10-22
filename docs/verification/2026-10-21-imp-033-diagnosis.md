# IMP-033 — cadastro existente, mensagens revisadas e confirmação real pendente

**Data:** 21/10/2026 (America/Sao_Paulo). **Agente:** Codex.
**Fonte:** texto completo da [IMP-033](https://app.notion.com/p/051d3425eae482848b6201bb2acdcac1), fornecido pela equipe nesta conversa. Não houve confirmação humana de cadastro novo, recebimento ou abertura do e-mail. Notion indisponível; nenhum status oficial alterado. **Não marcar Done.**

## 🤖 Registro do agente — 21/10/2026

### Dependências e diagnóstico antes das alterações

- IMP-016 consta Done no HANDOFF, com seis cenários reais confirmados anteriormente pela equipe.
- IMP-032 tem migration aplicada e matriz SDK A/B/anon real 29/29 Pass; consta Review por faltar a confirmação do apelido no fluxo real do app. Não confundir implementação/permissões verificadas com fechamento formal.
- Formulário Criar conta já existe em `features/auth/login.page.*`: nome/apelido, e-mail e senha, limite de apelido, validação de e-mail/senha e nome não vazio após trim. Botão bloqueado durante a solicitação; senha limpa no finally.
- `AuthService.signUp()` já usa o SDK existente e envia somente `display_name` como metadado inicial. Sessão nula resulta em orientação para confirmar o e-mail, sem navegação autenticada.
- Migration `20261021115711_imp032_profiles.sql` e `ProfileService` inspecionados: perfil com id real do Auth, apelido e data; trigger interno cria o perfil sem expor e-mail; recuperação ignora conflito em vez de duplicar/sobrescrever apelido. RLS/grants existentes preservados. Não foi criado outro cadastro, serviço de perfil ou cliente Supabase.

### Necessidade identificada e alterações pontuais

1. `core/auth/auth.service.ts` passou a tratar `email_address_invalid` e `email_address_not_authorized` com mensagens próprias em português. A segunda orienta procurar a equipe sem expor configuração, credenciais ou detalhes internos. Tratamento existente de senha fraca, e-mail não confirmado, conta existente e limite de envio foi preservado.
2. `core/errors/app-error.ts` recebeu os dois códigos correspondentes. Nenhum erro bruto ou token é exibido.
3. `features/auth/login.page.html` passou a indicar o limite de nome/apelido como mensagem do campo.
4. `features/auth/login.page.ts` orienta consultar caixa de entrada/spam e confirmar pelo link, sem afirmar entrega do e-mail. Retorno do cadastro não prova chegada da mensagem na caixa postal.

Referências conferidas: [códigos oficiais do Auth](https://supabase.com/docs/guides/auth/debugging/error-codes), tipos/código do SDK instalado e [restrições do SMTP padrão](https://supabase.com/docs/guides/auth/auth-smtp). Sem SMTP próprio, o envio padrão se limita a destinatários elegíveis da equipe/organização; não adicionar alunos como administradores para contornar isso. Não escolher provedor, gerar custo ou alterar D16 por conta própria.

### Verificação realizada

Chrome real, com respostas de cadastro **interceptadas localmente** antes de chegar ao Supabase: **8/8 controles Pass**. Conferidos nome obrigatório, e-mail inválido, senha curta, endereço recusado pelo envio, endereço rejeitado pelo backend simulado e limite de e-mail; o carregamento terminou e a senha foi limpa, sem criar sessão. Foram três respostas HTTP simuladas, **zero cadastros/e-mails remotos**. [Relatório sanitizado](2026-10-21-imp-033-browser.json).

A primeira resposta simulada omitia a exposição do cabeçalho de versão da API e o SDK não reconheceu seu código de erro. O ensaio foi corrigido para refletir os cabeçalhos do serviço e repetido; os oito controles passaram. Essa correção foi no roteiro local descartável, não numa configuração CORS remota. Não há suíte de testes adicionada ao projeto.

`npm.cmd run check`: lint e produção aprovados; nenhum pacote instalado ou atualizado. Não houve alteração de SMTP, confirmação de e-mail, Site URL, Redirect URLs, tabela/perfil, conta real ou policy. Os ajustes de privacidade em paralelo pertencem ao [checkpoint IMP-021/034](2026-10-21-imp-021-034-checkpoints.md), não à implementação do cadastro.

### Casos obrigatórios e evidência atual

| Caso | Evidência desta sessão | Resultado / limite |
|---|---|---|
| 1 cadastro válido com e-mail elegível | Nenhuma conta nova criada | Not run |
| 2 recebimento do e-mail | Caixa postal não consultada | Not run |
| 3 confirmação + login + Registrar | Link real não aberto | Not run |
| 4 e-mail não confirmado | Nenhuma conta pendente real usada | Not run |
| 5 senha fraca | Frontend recusou senha curta sem enviar; requisitos reais do backend não consultados | Pass local / backend Not run |
| 6 e-mail inválido | Formulário recusou; resposta de endereço rejeitado também simulada e tratada | Pass local; sem alegar teste de envio |
| 7 falha/limite de envio | HTTP 429/código oficial simulados; mensagem e fim de carregamento conferidos | Pass para tratamento local; SMTP real Not run |
| 8 perfil de usuário novo confirmado | Código/trigger existentes revisados; não houve cadastro novo real | Not run para o novo usuário |
| 9 cadastro/confirmação/login sem IA | Código não chama IA; sequência real ainda não executada | Not run para fluxo completo |

### Próximo teste humano, sem divulgar credenciais

1. O responsável confere no Dashboard do projeto dev: confirmação de e-mail **ligada**, Site URL/Redirect URLs efetivas e serviço de envio conforme D16. Não assumir que `localhost:4200` já está autorizado apenas porque o app usa esse endereço. Nenhuma configuração remota foi alterada pelo agente.
2. Escolher um e-mail de teste controlado pelo responsável e elegível no envio atual, ainda não cadastrado. Inserir esse e-mail, senha e apelido somente em **http://localhost:4200 → Criar conta**. Não enviar credenciais ao chat.
3. A pessoa verifica a mensagem real na caixa de entrada/spam, abre o link, volta ao app e entra. Conferir acesso a Registrar e apelido correto; recarregar e confirmar o mesmo perfil. Não confirmar usuário administrativamente para simular o teste do link.
4. Registrar resultados observados, erro seguro se houver e build/horário, sem publicar e-mail, link com token, senha ou dados da caixa postal. Se aparecer bloqueio do destinatário/SMTP, preservar como pendência; não tentar envios em massa ou desligar confirmação.
5. Somente após essa evidência e revisão humana concluir IMP-033 e seguir para a validação completa da IMP-034. A implementação de upload/salvar segue as dependências do [plano IMP-022/035](2026-10-21-imp-022-035-preparation.md).

## 🎓 Explicação para a equipe

Cadastro cria a conta; confirmação comprova que a pessoa controla aquele e-mail; login abre uma sessão para usar o app. São três etapas diferentes. A mensagem na tela pede que a pessoa consulte o e-mail, mas só a caixa postal comprova que ele chegou.

Entrada → apelido, e-mail e senha no formulário → Supabase cria a conta e solicita confirmação → pessoa abre o link e entra; o app busca o perfil mínimo no banco. Se o serviço de envio bloquear o destinatário, agora aparece uma orientação clara. Nenhum passo depende de IA.

<details><summary>Oito controles locais aprovados provam entrega de e-mail?</summary>Não. Eles conferem as mensagens e a validação com respostas simuladas. O recebimento e a confirmação dependem de um teste real com endereço autorizado.</details>

<details><summary>Por que não criar outro perfil toda vez que entra?</summary>A ficha usa o mesmo identificador da conta. O app procura a ficha existente; se precisar criá-la, o conflito é ignorado e a ficha é lida de novo, sem duplicação.</details>

<details><summary>Podemos desligar confirmação para terminar logo?</summary>Não. A confirmação é requisito do projeto e precisa ser testada, não contornada.</details>

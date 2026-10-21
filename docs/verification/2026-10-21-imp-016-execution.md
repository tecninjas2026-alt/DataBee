# IMP-016 — diagnóstico, correções e validação do login

**Estado:** correções locais prontas; lint/build e 18 verificações no navegador com rede sintética aprovados. Os seis cenários do login foram confirmados pela equipe em 21/10: **6/6 Pass por relato humano**. Revisão/checkpoint, Notion e merge ainda pendentes; sem Done ou alteração de banco. Equipe pediu pausa após a confirmação.

**Fonte:** [IMP-016 — Implementar login seguro sem dependência da IA](https://app.notion.com/p/1a0d3425eae48318984181f9bb26e4d1), texto completo recebido nesta conversa em 21/10. Cadastro e confirmação de e-mail continuam fora do escopo desta tarefa; código existente preservado.

## 🤖 Registro do agente — 21/10/2026

### Diagnóstico apresentado antes de alterar arquivos

Lidos AGENTS.md, HANDOFF, README, manifesto/lockfile e guias Angular/Ionic/segurança/Supabase. Git limpo no início, histórico de dez commits conferido; trabalho anterior preservado. Lockfile versão 3 com 599 entradas e dependências da raiz coincidentes. Sem instalação ou nova biblioteca.

Já existiam:

- Formulário com e-mail/senha, `signInWithPassword`, indicador de carregamento, bloqueio de envio duplicado e mensagens de erro fixas em português.
- Inicialização assíncrona via `provideAppInitializer(() => AuthService.init())`, aguardando `getSession()` antes de iniciar o app; SDK com persistência e renovação da sessão.
- Logout local pelo SDK; limpeza de perfil e rascunho (foto/localização em memória), redirecionamento ao login com substituição do histórico ao perder sessão.
- Login A → Início, saída e login B → Início [confirmados pela equipe em 15–16/10](2026-10-15-supabase-auth.md). Isso não comprovava todos os seis testes da task, em especial Registrar, senha errada, recarregamento e retorno após logout.
- Nenhuma chamada à IA nos serviços/tela de login; implementação de cadastro já existente, preservada e sem declaração de validação integral da IMP-033/034.

Problemas concretos apresentados na conversa antes das edições:

1. `authGuard` aceitava modo de prévia como autorização para todas as rotas privadas, inclusive Registrar. Contraria o critério de não usar prévia como autenticação real.
2. A senha continuava no formulário após tentativa e a página Ionic podia manter seus campos em cache ao navegar.
3. Necessidade de conferir a saída em falha de conexão. A inspeção do SDK instalado mostrou que `_signOut` remove a sessão local também em erros de rede da chamada de logout. O estado do app ainda precisava de limpeza em `finally` para cobrir exceção inesperada; não prometer revogação instantânea de JWT.

### Dependência IMP-011

Configuração local ignorada pelo Git, projeto esperado, prefixo de publishable key válido. Consulta somente de leitura a `/auth/v1/settings`, com a chave pública lida em memória, retornou **HTTP 200** em 21/10. Nenhuma chave ou resposta de configuração foi impressa. A primeira tentativa foi impedida pela área restrita (`EACCES`); repetição autorizada fora dela passou, mantendo TLS e CAs confiáveis do Windows.

Isso comprova a configuração funcional necessária ao login. Critérios completos, revisão e status oficial da IMP-011 no Notion não foram conferidos; não declarar fechamento formal dessa task apenas pelo HTTP 200.

### Alterações realizadas após o diagnóstico

| Arquivo | Mudança e motivo |
|---|---|
| `src/app/core/auth/auth.guards.ts` | Rota privada exige inicialização concluída e sessão; `tabsChildGuard` verifica cada navegação entre abas. Prévia limitada ao Início sem dados privados; Registrar/Dados/Minhas/Feed/Detalhe/Resultado exigem sessão |
| `src/app/app.routes.ts` | Usa `canActivateChild` nas abas, para conferir acesso também quando o contêiner já está ativo |
| `src/app/features/auth/login.page.ts` | Limpa senha no `finally` após sucesso/falha e formulário/mensagens ao sair da página Ionic; preserva formulário, cadastro e tratamento de erro existentes |
| `src/app/core/auth/auth.service.ts` | Limpa sessão/perfil do app em `finally` na saída; aviso fixo sem objeto de erro, sem afirmar revogação imediata ou resultado remoto não confirmado |
| Este registro, relatório do navegador, plano IMP-069 e HANDOFF | Evidências, diagnóstico e pendências atualizados |

Não houve nova tela, alteração de schema/policy, criação/exclusão de contas ou observações, upload, credencial administrativa em login, provedor de IA ou deploy. A exceção da prévia serve só ao protótipo sem dados; com Supabase configurado, qualquer aba exige autenticação.

### Comandos e resultados reais

| Verificação | Resultado |
|---|---|
| `git status --short --branch`, `git log --oneline -10` | Base local preservada; branch de correção `fix/imp-016-protected-login`, baseada na proposta local da IMP-069; main remoto não atualizado devido à suspensão |
| Manifesto versus package-lock e arquivos de autenticação | Sem divergência nas dependências; nenhuma instalação |
| HTTP em `http://localhost:4200` | 200; servidor existente reutilizado |
| Consulta pública de leitura `/auth/v1/settings` | 200, projeto/chave pública corretos; comprova configuração, não login de uma conta |
| `npm.cmd run check` | Pass: lint e build de produção, sem warnings novos; saída `www`, main `main-N5B3ZGBC.js` |
| Chrome isolado, 390×844 e 360 px, rede Supabase inteiramente interceptada | **18/18 verificações Pass**, zero exceções, zero chamadas à IA, zero requisições backend inesperadas; [relatório sanitizado](2026-10-21-imp-016-app-browser.json) com hash dos quatro arquivos alterados |
| `git diff --check` e revisão do diff | Conferidos antes do commit; sem segredo novo ou código de teste no app |

O navegador usou sessões e respostas **artificiais**, sem credenciais de usuários nem chamadas ao Supabase real. Conferiu: rota direta sem sessão; carregamento visível; erro compreensível; um único pedido em duplo envio; senha apagada no sucesso/falha; acesso autenticado a Registrar; página privada ausente durante renovação inicial atrasada; restauração; logout limpando perfil/foto/localização/consentimento e sessão do SDK; Voltar e rota direta bloqueados; troca para B; prévia do Início preservada com Registrar/Dados bloqueados; layout 360/390 px. Não prova login real, RLS ou comportamento Android.

A ferramenta descartável precisou corrigir a composição do hash, reproduzir o cabeçalho de versão da resposta Auth e selecionar a mensagem do formulário em vez da região vazia de validação interna do Ionic. A execução final passou; não houve correção de código do app motivada por esses erros da ferramenta. Nenhuma suíte automatizada adicionada ao repositório.

### Matriz obrigatória — contas reais no app atual

| Teste | Evidência anterior | Resultado completo nesta versão |
|---|---|---|
| 1. A entra e acessa Registrar | Roteiro real confirmado pela equipe; login A anterior e SDK real complementam a evidência | Pass — relato humano |
| 2. Senha errada: erro claro e carregamento encerrado | Roteiro real confirmado pela equipe; comportamento sintético também aprovado | Pass — relato humano |
| 3. A recarrega Registrar e restaura sessão | Roteiro real confirmado pela equipe; espera pela renovação inicial verificada sinteticamente | Pass — relato humano |
| 4. Sair encerra sessão e bloqueia funções privadas | Roteiro real confirmado pela equipe; limpeza de dados temporários verificada sinteticamente | Pass — relato humano |
| 5. Voltar/acesso direto após logout exigem login | Roteiro real confirmado pela equipe; navegação sintética também aprovada | Pass — relato humano |
| 6. B entra, nova sessão pertence a B | Roteiro real confirmado pela equipe; identidade A/B distinta também comprovada no SDK e na simulação | Pass — relato humano |

Não misturar a autenticação das matrizes SDK com a navegação e restauração do app. Nem a troca A/B nem os testes com rede artificial substituem RLS real.

### Roteiro enviado à equipe

1. Abrir http://localhost:4200/login, entrar com A e tocar **Registrar abelha**. Deve abrir Registrar.
2. Recarregar nessa rota. Após a verificação inicial, Registrar deve voltar com sessão válida.
3. Ir ao Início e tocar **Sair** (ícone no canto superior). Deve aparecer login.
4. Usar **Voltar** e tentar http://localhost:4200/tabs/registrar. Ambos devem exigir login, sem foto/localização privadas.
5. Tentar **uma vez** entrar com senha errada, de pelo menos oito caracteres para exercitar o servidor. Deve aparecer **E-mail ou senha incorretos.**, apagar senha e encerrar carregamento.
6. Entrar com B e abrir Registrar. Deve funcionar sem perfil/rascunho de A.

Preencher senhas somente no app, nunca no chat. Informar resultados por passo, sem prints contendo e-mail/senha. O roteiro não salva observações nem chama IA. Solicitação enviada pelo canal de pergunta; sem resposta humana na preparação deste registro.

**Retorno posterior da equipe em 21/10:** “ok, ja fiz”. Confirma a execução do roteiro, mas não informa explicitamente o resultado dos seis passos. Solicitada confirmação única de que todos passaram, ou indicação de falha/passo pendente. Os resultados completos permanecem sem comprovação; não converter o relato de execução em seis Pass. Também solicitada a autorização específica de criação da IMP-069, condicionada à validação desta dependência; nenhuma exclusão incluída.

**Esclarecimento e confirmação final em 21/10:** inicialmente foi selecionado “Houve falha ou algum passo ficou pendente”. Ao perguntar qual passo, a equipe explicou que esperava identificação da abelha ao colocar a foto. Foi esclarecido que a IA ainda não está conectada e não faz parte do login. À pergunta explícita sobre os seis cenários de login e se a única pendência percebida era a identificação, respondeu **“Sim, o login funcionou; faltou identificar a abelha”**. Resultado: seis testes de login **Pass por confirmação humana do roteiro**, sem alegar observação direta do agente, captura de credenciais ou relatório SDK desses seis passos. A ausência de identificação continua pendência de produto, não bug de login. A equipe autorizou separadamente os dois conjuntos TEST DATA/PNG da IMP-069 conforme o plano; exclusões não autorizadas. Em seguida pediu pausa: não iniciar a IMP-069 até a retomada.

### Limites e próximo passo

Sem Android disponível comprovado: SDK configurado não localizado na preparação anterior, nenhum aparelho/teste real ou APK atualizado. A tarefa não alterou plugins/permissões; limites de Android permanecem no HANDOFF. Não apresentar o APK antigo como atual.

Sessão local encerrada não significa revogar imediatamente um JWT já copiado; ele pode valer até expirar. Erro de armazenamento do navegador não foi provocado nesta verificação. Cadastro/SMTP/Redirect URLs e escopo completo da IMP-033/034 continuam pendentes, sem expansão nesta task.

GitHub suspenso: somente commits locais; sem push, PR/merge novo ou tentativa de contornar restrições. Notion indisponível; revisão humana/checkpoint e status oficial ainda pendentes. Os seis cenários da IMP-016 estão tecnicamente validados por relato humano; não confundir com fechamento formal. IMP-069 segue sem execução; criação conforme o plano/PNG autorizada, limpeza não autorizada. Equipe pediu pausa: retomar somente quando voltar, sem solicitar novamente a autorização de criação já concedida.

## 🎓 Explicação para a equipe

**Entrada → processamento → saída:** e-mail/senha no formulário → Supabase confere a conta → SDK administra a sessão e libera Registrar. O login não chama a IA. A senha sai da memória do formulário após a tentativa; a sessão, como uma pulseira temporária de acesso, fica sob controle do SDK.

**Guard é o porteiro da tela:** espera o app concluir a restauração e só libera a rota privada para uma sessão. O modo de prévia permite ver o Início sem dados, mas não fornece uma pulseira para Registrar. O porteiro do banco (RLS) é outra proteção, testada separadamente.

**Ao sair:** SDK encerra a sessão desta instalação; o app limpa perfil, foto e localização temporários e volta ao login. Conhecer o endereço de Registrar ou apertar Voltar não deve liberar acesso. Se uma senha estiver errada, a mensagem não revela dados da conta e o botão volta a funcionar.

<details><summary>O login depende de pagar ou configurar IA?</summary>Não. A autenticação usa Supabase Auth e funciona sem chamar o provedor de IA.</details>

<details><summary>Quem confirmou os seis testes reais?</summary>A equipe confirmou o roteiro no app com A e B. O agente verificou separadamente 18 comportamentos usando respostas artificiais. São fontes diferentes; a confirmação humana não significa que o agente observou diretamente os seis testes reais.</details>

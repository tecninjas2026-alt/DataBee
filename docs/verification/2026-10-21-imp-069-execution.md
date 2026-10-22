# IMP-069 — ferramenta manual preparada; execução A/B pendente

**Data:** 21/10/2026 (America/Sao_Paulo). **Agente:** Codex.
**Estado:** implementação local verificada; criação dos conjuntos e matriz real **Not run**. Nenhuma escrita remota desta task. Não marcar Done ou Review da task completa antes da execução humana A/B e revisão dos resultados. Notion indisponível nesta sessão; registro abaixo preparado para transferência.

Fonte: [plano completo e autorização preservada](2026-10-21-imp-069-plan.md), [HANDOFF](../HANDOFF.md) e retomada da equipe nesta conversa. Dependências IMP-013/014/015/016 constam Done no HANDOFF atualizado. O plano histórico descreve uma pausa anterior e fechamento então pendente; isso não é um novo pedido de autorização. A autorização cobre dois conjuntos com PNG artificial; **não cobre exclusão**.

## 🤖 Registro do agente — 21/10/2026

### Entrega

- `npm.cmd run verify:seed` reutiliza o servidor manual existente, em **http://127.0.0.1:4217**. Não altera app, APK, schema, policies, catálogo ou dependências.
- `scripts/manual/test-data.html`, `.client.ts`, `.matrix.ts`, `.types.ts`, `.cases.json` e `.server.mjs`: formulário A/B, PNG canvas de 480×160 com texto TEST DATA, reserva prévia de IDs, progresso e 18 verificações de execução/acesso. A inspeção de arquivos/segredos complementa o sexto critério do plano; os 18 casos não substituem essa revisão.
- Manifesto local: `.tmp/imp069-<run_id>-manifest.json`, com projeto, papéis A/B, donos, IDs, caminhos, coordenadas explicitamente fictícias, hash/MIME/bytes da fixture e estados `planned`/`pending`/`confirmed`. PNG salvo ao lado; ponteiro `.tmp/imp069-active-run.json`. Tudo ignorado pelo Git. Não publicar esses arquivos.
- O servidor confirma a gravação local antes de entregar IDs ao cliente. Antes de cada escrita remota, grava `pending`; confirma por releitura dos IDs exatos. Uma etapa ausente só é criada se a leitura comprovar ausência. Etapa já confirmada que desapareceu, conflito, etiqueta diferente ou erro de rede interrompem o fluxo. Sem IDs substitutos, sobrescrita ou limpeza automática.
- A retomada exige as mesmas contas, na mesma ordem, e reutiliza o PNG salvo. Um bloqueio local impede duas abas executando simultaneamente. Se a aba fechar sem liberar o bloqueio, reiniciar **somente o servidor**, preservando `.tmp`, permite retomar. Não reiniciar enquanto outra execução estiver ativa.
- Cada conjunto contém draft/private/idle pelos defaults do banco, captura nula, localização `user_informed` A=(0,0)/B=(0,1), precisão/consentimento nulos, imagem e metadados `gallery`. Nenhuma coleta de GPS ou chamada de IA. Etiqueta do objeto: `dataset_label=TEST DATA`, `run_id`; conferida via API `info` antes de finalizar os metadados. As tabelas não têm campo de rótulo: o manifesto é sua relação exata.
- Relatórios sanitizados por execução e cópia atual `.tmp/imp069-privacy-report.json`: apenas casos fixos, resultados, motivos de autenticação permitidos, projeto, horário, hashes do cliente/servidor e versões/hashes das migrations locais. Não contêm IDs dos donos/observações, caminhos privados, e-mails, senhas ou tokens. O relatório registra resultados recebidos do cliente; não é uma certificação independente.

### Segurança e limites

As credenciais passam somente do navegador para o Supabase. Clientes A/B e anônimo usam a chave publicável; sessões em memória, sem persistência; formulário limpo inclusive em falhas. Servidor limitado ao loopback, com Host/origem conferidos, limite de payload e política de conteúdo restrita. Não recebe credenciais Supabase nem usa acesso administrativo para provar RLS.

As tentativas de UPDATE miram exclusivamente o conjunto artificial A reservado nesta execução. Usam campo permitido do rascunho, longitude fictícia, bytes dos metadados e o mesmo caminho do PNG. Se uma proteção falhar, o fluxo para; não restaura nem exclui dados para esconder a falha. B é o controle e permanece preservado. **Não há chamada de DELETE neste roteiro.**

Fonte técnica consultada: [implementação oficial de informações do objeto](https://github.com/supabase/storage/blob/master/src/storage/renderer/info.ts), que devolve a etiqueta customizada em `metadata`; o SDK instalado converte recursivamente as chaves para camelCase. APIs e tipos também conferidos no SDK local 2.117.3. Nenhuma leitura/escrita direta de `storage.objects` foi acrescentada.

### Verificado

| Verificação | Resultado / limite |
|---|---|
| `git switch main` + `git pull --ff-only` | Main já atualizada; sem branches/PRs |
| `npm.cmd start` | App servido em http://localhost:4200 |
| `npm.cmd run check` | Lint e produção aprovados, sem warnings novos |
| TypeScript estrito dos três arquivos manuais + ESLint | Aprovados; arquivos manuais estão fora do lint/build do app e foram conferidos separadamente |
| `node --check` dos servidores | Aprovado |
| Chrome real, página local, larguras 360/390 px | 18 casos inicialmente Not run, quatro campos obrigatórios, formulário vazio recusado, sem overflow ou exceções JavaScript; nenhum login submetido |
| PNG local | Inspecionado visualmente: TEST DATA / DataBee DEV — sem valor científico |
| Ensaio local isolado, sem Supabase | 17 controles confirmados: persistência antes da resposta, PNG idêntico, retomada com mesmos IDs e pendência, contas diferentes recusadas, bloqueio entre abas, licença inválida, regressão de etapa, manifesto inconsistente, Host/origem externos; [evidência sanitizada](2026-10-21-imp-069-local.json) |
| `npm.cmd run supabase -- migration list --linked` | Somente leitura: quatro versões remotas coincidem com as locais (20261016032127, 20261021115711, 20261021122259, 20261021130929) |
| Manifesto da execução real | Ainda ausente; ferramenta pronta aguardando login A/B |
| Criação A/B, leitura própria, isolamento B/anon, integridade final | **Not run**; verificações locais não provam RLS remoto |
| Android | Não se aplica: ferramenta exclusiva de desenvolvimento |

O primeiro Chrome não respondeu no ambiente restrito; nova execução autorizada fora da restrição passou. A CLI precisou atualizar seu arquivo local de telemetria fora do repositório; a consulta remota foi somente leitura. Nenhuma credencial registrada.

### Execução pela equipe

1. Com o servidor aberto pelo agente, acessar **http://127.0.0.1:4217** neste computador. Conferir o título TEST DATA e projeto dev `uqfuuahziwgxwjymtwil`.
2. Preencher as contas de teste A e B **somente no formulário local**. Não enviar senhas ao chat. Usar duas contas diferentes e preservar sua ordem na retomada.
3. Clicar **Criar ou retomar os dois conjuntos TEST DATA** uma vez. Aguardar; ao concluir, são esperados 18 Pass. Se houver falha, relatar o nome da etapa e as contagens, sem credenciais ou IDs.
4. Baixar o relatório sanitizado. O link do manifesto é para consulta **local privada** e permanece no computador. Não apagar `.tmp` nem tentar limpar dados pelo Dashboard durante o teste.
5. O agente deve conferir os resultados reais e o manifesto, registrar quais etapas foram confirmadas/ausentes/incertas, atualizar HANDOFF e Notion e mover a task para Review. Done depende de confirmação da equipe. Qualquer limpeza futura segue o plano e exige autorização da lista exata.

## 🎓 Explicação para a equipe

**Preparamos peças de treino para ensaiar o salvamento sem usar fotos ou localizações pessoais.** A lista de etiquetas dessas peças é o manifesto. Ele fica no computador antes de qualquer criação no banco.

Entrada → contas A/B e PNG artificial → salvar as etiquetas, criar cada peça, conferir quem pode ler/alterar → dois conjuntos privados no Supabase e relatório sem dados pessoais no computador. Se a conexão falhar, as etiquetas permitem conferir o que ficou e continuar sem duplicar. O porteiro do banco (RLS) deve deixar cada conta abrir somente seu próprio conjunto.

<details><summary>Já criamos os dados de treino?</summary>Não nesta etapa. A ferramenta está pronta; a criação e os testes reais exigem a entrada das contas A/B no formulário local.</details>

<details><summary>Por que salvar o manifesto antes?</summary>Para saber exatamente quais peças pertencem ao ensaio, mesmo se a internet cair depois da criação. Sem isso poderíamos confundir dados de teste com outros registros.</details>

<details><summary>Por que entrar com duas contas?</summary>A deve conseguir ler suas peças. B deve ler suas próprias peças e ser impedido de abrir ou alterar as de A. Isso verifica o porteiro com usuários comuns, sem uma chave administrativa que abriria todas as portas.</details>

<details><summary>Retomar cria outra cópia?</summary>O botão reutiliza os mesmos IDs e lê cada peça antes de tentar criá-la. Se houver conflito ou dúvida na rede, para. As peças já confirmadas não são recriadas.</details>

<details><summary>Podemos apagar tudo depois?</summary>A autorização atual só permite criar os dois conjuntos. Uma limpeza futura precisa da lista exata aprovada; B deve continuar inteiro como controle.</details>

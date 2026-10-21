# Guia — Fluxo de trabalho (tasks, Git, Notion, handoff, prompts)

## 1. Fontes de verdade
| Assunto | Onde |
|---|---|
| Decisões (D01–D25), escopo, requisitos, tasks IMP-xxx, critérios de aceite | Notion — links em `AGENTS.md` §2 |
| Código, migrations, configuração compartilhável | Este repositório (https://github.com/tecninjas2026-alt/DataBee) |
| Estado atual para o próximo agente/aluno | `docs/HANDOFF.md` |
| Regras para agentes | `AGENTS.md` + `docs/guides/` |
Conflito entre repo e Notion: pare e pergunte; não "corrija" decisão humana.

## 2. Executar uma task IMP-xxx (agente com autonomia + alunos)
1. **Agente** escolhe a task (Ready/In progress com dependências Done), lê a página inteira no Notion e conta aos alunos o plano em linguagem simples. Status da task → `In progress`.
2. **Agente**: `git switch main && git pull --ff-only` (só existe a `main`).
3. **Agente** implementa só a task, roda `npm run check`, testa no navegador (e gera APK se tocar Android) e commita direto na `main` (§3) a cada etapa estável.
4. **Agente** atualiza `docs/HANDOFF.md`, faz a autorrevisão (§6) e envia: `git push origin main`. Código quebrado nunca é enviado; dúvida de produto = parar e perguntar antes de commitar.
5. **Agente** registra no Notion (seções "🤖 Registro do agente" e "🎓 Explicação para a equipe"), Status `Review`, e relata aos alunos (formato em `student-communication.md`).
6. **Alunos** testam (navegador/celular) seguindo os passos dados e conseguem explicar entrada → processamento → saída. Pedem ajuda ao agente se algo não ficou claro; correções viram novos commits `fix(...)` na `main`.
7. Com a confirmação da equipe: Status `Done` e as tasks dependentes que ficaram liberadas → `Ready`.

## 3. Git — Conventional Commits
- **Só a `main`.** Sem branches e sem PRs (decisão da equipe em 21/10/2026). O GitHub (https://github.com/tecninjas2026-alt/DataBee) é o registro histórico online; cada commit com mensagem clara conta a história do projeto.
- Mensagem:
```text
<tipo>(<escopo>): <descrição curta no imperativo, minúsculas, sem ponto final>

<corpo opcional: o que e por quê>

Refs: IMP-019
```
- Tipos: `feat` nova funcionalidade · `fix` correção · `docs` documentação · `style` formatação · `refactor` reorganização sem mudar comportamento · `perf` desempenho · `test` testes · `build` dependências/build/Android · `ci` automação · `chore` manutenção.
- Escopos usuais: `auth`, `register`, `observations`, `feed`, `ai`, `catalog`, `supabase`, `android`, `ui`, `deps`, `docs`, `agents`.
- Mudança que quebra compatibilidade: `feat(api)!: ...` + rodapé `BREAKING CHANGE: ...`.
- Commits pequenos, um assunto por commit, `git add <arquivos específicos>`; revisar `git diff --staged` (segredos!) antes.
- Envio (feito pelo agente):
```bash
git switch main && git pull --ff-only     # sempre começar atualizado
npm run check                             # tem que passar antes de cada commit/push
git add <arquivos específicos>
git commit -m "feat(register): add photo upload" -m "Refs: IMP-022"
git push origin main                      # se recusado: git pull --rebase origin main, check de novo, push
```
- `main` sempre executável. Proibido: `push --force`, `reset --hard`, `clean -fd`, resolver conflito com ours/theirs em massa.
- Nunca commitar: `node_modules/`, `www/`, `android/app/build/`, `supabase.config.ts`, `.env*`, APKs.

## 4. Protocolo de handoff (obrigatório para qualquer agente ou pessoa que alterar o projeto)
Ao terminar (mesmo parcialmente), edite `docs/HANDOFF.md`:
- **Estado atual**: o que funciona agora (verificado como?).
- **Última sessão**: data, quem/qual agente, task, arquivos principais, verificação feita.
- **Próximos passos**: ordenados, com ID da task.
- **Pendências/bloqueios**: com responsável (humano) quando for conta/chave/decisão.
- Remova itens desatualizados; mantenha o arquivo curto (< ~150 linhas). Histórico detalhado vai no Git/Notion.

## 5. Pedidos rápidos que os alunos podem fazer ao agente
O agente deve entender pedidos simples como estes e executar tudo sozinho:
- "Qual o estado do projeto?" / "O que fazemos agora?"
- "Roda o app para eu ver." → `npm start` e indica o endereço.
- "Gera o APK." → build + sync + `assembleDebug`, informa o caminho do arquivo e como instalar.
- "Implementa a próxima task." / "Faz a IMP-022."
- "Explica o que você fez na IMP-xxx." / "O que é RLS?"
- "Deu erro: <print ou texto>." → diagnosticar, corrigir e explicar.

## 6. Prompt de autorrevisão (antes de cada push)
```text
Revise o diff a enviar (git diff --staged ou git diff origin/main) contra AGENTS.md e o guia da área. Liste só problemas reais:
segurança/privacidade, RLS, segredos, estados de loading/erro, duplo envio, tipos any, escopo extra.
Não reescreva o código; aponte arquivo:linha e a correção mínima.
```
Economia de tokens: uma task por conversa; carregar só o guia da área; o HANDOFF carrega o contexto entre conversas.

## 7. Definition of Done global (Notion "Git Workflow e DoD")
Código executa e `npm run check` passa · comportamento e erros testados · nenhum segredo no diff/bundle/logs · alteração autorrevisada pelo agente e explicada à equipe · caminhos/comandos/configuração manual registrados · evidência identifica o build · alunos explicam entrada/processamento/saída/armazenamento/falha (apoiados pela "🎓 Explicação para a equipe").

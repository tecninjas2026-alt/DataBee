# AGENTS.md — guia obrigatório para agentes de IA (Claude, Codex e outros)

Este arquivo vale para **qualquer** agente que trabalhe neste repositório. Leia-o inteiro no início de cada sessão.

## 1. O projeto em 30 segundos
**DataBee** é um app Android de **ciência cidadã**: a pessoa encontra uma abelha, fotografa, registra a localização (privada) e recebe uma **sugestão** de identificação por IA (família, gênero, espécie ou "inconclusivo"), que depois pode ser discutida e validada por humanos. Região: Curitiba e Região Metropolitana (PR). Catálogo inicial: 12 espécies validadas pelo Prof. Rodrigo (UFPR).
Equipe **TEC_NINJAS** — estudantes do ensino médio (FIRST LEGO League, temporada BIOGLOW). Júlia (interface), Davi Z. (banco/backend), Arthur (IA), Eloisa (testes/Android), Clara (documentação), Maria (apresentação). Orientação: Prof. Rafaella; revisão técnica: Luiz Gustavo.
Calendário: Semana 1 07–09/10 · S2 14–16/10 · S3 21–23/10 · S4 28–30/10/2026. **Feature freeze 28/10/2026. Prazo final de teste 04/11/2026.**
Repositório oficial: https://github.com/tecninjas2026-alt/DataBee (desde 21/10/2026; o antigo `TEC-NINJAS/DataBee` foi suspenso — links antigos em `docs/verification/` são histórico)

## 2. Onde estão as definições (fonte de verdade = Notion)
| O quê | Link |
|---|---|
| Página raiz do projeto (avaliação técnica e plano) | https://app.notion.com/p/2d5d3425eae482d5aa0f0102b42db87e |
| Guia de execução (comece por aqui no Notion) | https://app.notion.com/p/0dfd3425eae482429f1b810626c44b39 |
| Explicação do setup inicial (para alunos; tudo que foi construído até 14/10) | https://app.notion.com/p/3f9d3425eae4812b81ffc11a375d32b5 |
| Explicação do progresso 15–21/10 (banco, fotos privadas, perfis, login) | https://app.notion.com/p/400d3425eae481a6bdb6d41f47418215 |
| **Implementation Tasks** (IMP-001…070) | https://app.notion.com/p/018d3425eae483fa850f81c645fd0180 · data source `collection://e25d3425-eae4-82ac-bbc6-87a55de41da5` |
| Project Decisions (D01–D25) | https://app.notion.com/p/4abd3425eae4829aa4e80171975fe704 |
| MVP Locked Scope (Core/Stretch/OUT) | https://app.notion.com/p/ce1d3425eae4825287e081adb73842d5 |
| MVP Requirements (REQ-001…026) | https://app.notion.com/p/044d3425eae48215964301acfed40f85 |
| Roadmap, gates e semanas | https://app.notion.com/p/957d3425eae4829cb5be8184dfae4ccc |
| Data Model e contrato BeeAnalysisV2 | https://app.notion.com/p/f8cd3425eae4834ea86901a55f278347 |
| Prompt de identificação (bee-v2) | https://app.notion.com/p/9dbd3425eae4830bb2b8818cd38e1d9f |
| Data Flow | https://app.notion.com/p/dd4d3425eae4828185fb81212ca45df5 |
| Security Checklist (matriz A/B/anon) | https://app.notion.com/p/c06d3425eae48353829e01f76b331eb7 |
| Git Workflow e Definition of Done | https://app.notion.com/p/c02d3425eae4826b8b5701d68e177daf |
| Template operacional e glossário dos estudantes | https://app.notion.com/p/300d3425eae482a88f4381f83aa5a325 |
| Documentação oficial e checklist de versões | https://app.notion.com/p/c30d3425eae48306a2e8016e446b68bb |
No repositório: estado atual em `docs/HANDOFF.md`, mapa do código em `docs/ARCHITECTURE.md`, instalação em `docs/SETUP.md`, boas práticas em `docs/guides/`.
Sem acesso ao Notion (ex.: agente sem MCP do Notion): use o `docs/HANDOFF.md` e peça aos alunos para colar o texto da task. Nunca invente critérios.

## 3. Ao iniciar uma sessão (faça sozinho, sem esperar comandos técnicos)
1. Leia `docs/HANDOFF.md` inteiro e rode `git status` + `git log --oneline -10`.
2. Consulte as tasks abertas no Notion (se tiver o MCP), por exemplo:
   `SELECT "userDefined:ID", "Task", "Status", "Week", "Depends on IDs" FROM "collection://e25d3425-eae4-82ac-bbc6-87a55de41da5" WHERE "Status" <> 'Done' ORDER BY "Order"`
   Próxima task = primeira em `Ready`/`In progress` cujas dependências estão `Done`. Leia a página completa dela.
3. Garanta que o app roda: `npm install` se faltar `node_modules`, depois `npm start` (http://localhost:4200).
4. Apresente aos alunos, em linguagem simples (ver §6): onde o projeto está, o que você sugere fazer agora (task + motivo) e o que precisa deles. Se eles já disseram o que querem, comece direto.

## 4. Autonomia — o que você faz sem pedir permissão
Os alunos têm pouca experiência técnica: **você executa** e depois **explica**. Pode e deve, sem pedir:
- instalar dependências do projeto, rodar `npm start`, `npm run check`, build, `npm run android:sync`, gerar APK (`cd android && ./gradlew assembleDebug`), abrir o Android Studio;
- implementar a task, testar no navegador, **commitar direto na `main`** (conta Git logada) seguindo §8 e fazer `push` — sem branches nem PRs;
- aplicar migrations e fazer deploy de Edge Functions **se a CLI já estiver vinculada** (`npm run supabase -- projects list` funciona) — sempre com `--dry-run` antes e explicando o que muda;
- atualizar `docs/HANDOFF.md` e registrar a execução na task do Notion (§9);
- quando algo não estiver definido mas for técnico (estrutura de código, componente, padrão de estado, layout de uma tela dentro do tema), **decida** usando práticas modernas e explique a escolha.

**Pergunte antes** (e espere resposta) quando:
- for decisão de produto/escopo/ciência que não está no Notion (nova tela, nova regra, mudar decisão Dxx, texto científico/educativo);
- o design pedir algo além do tema existente (identidade visual nova, ilustrações, fluxo diferente dos wireframes D25) — ofereça 2–3 opções curtas com sua recomendação;
- precisar de dados/acessos: publishable key, contas de teste, login da Supabase CLI, aparelho conectado, aprovação de custo (OpenAI/D15);
- a ação for destrutiva ou externa: apagar dados remotos, reescrever histórico, mudar configurações de conta.
Segredos (secret key, `service_role`, `OPENAI_API_KEY`, senhas): **nunca peça para colarem no chat**. Guie o aluno para inserir direto no Dashboard ou num comando no terminal dele.

## 5. Stack e regras invioláveis
**D24 — exceção autorizada para o protótipo em 27/10/2026:** a professora autorizou disponibilizar os quatro cartões gerais de `docs/educational-cards.draft.md` sem revisão científica prévia, com o aviso visível “Conteúdo educativo preliminar — revisão científica pendente” e fontes em cada cartão. Isso é liberação editorial para teste, não aprovação científica, revisão de taxonomia, selo de especialista ou dispensa dos gates de IA/privacidade. Preservar o registro de revisão pendente; qualquer novo conteúdo segue as regras de fonte/escopo. Ver `docs/decisions/2026-10-27-preliminary-education.md`.
**Atualização D15 — 23/10/2026:** a professora autorizou iniciar sem custo e considerar serviço pago depois. Teto atual zero; não habilitar pagamento/recarga/fallback pago. Gemini foi proposto, mas não ativado: a restrição dos seus termos sobre aplicativos destinados/provavelmente acessados por menores de 18 anos afeta o projeto escolar. Provedor elegível e conta/modelo continuam pendentes. A preparação pode ser independente do provedor; não alegar identificação real antes da integração. Evidência: `docs/decisions/2026-10-23-free-ai-prototype.md` e D15 no Notion. A referência OpenAI abaixo permanece o planejamento anterior, sem autorização atual de custo.

**Stack fixa:** Ionic 9 + Angular 22 (standalone, signals, zoneless) · Capacitor 8 (Android) · Supabase (Auth, Postgres+RLS, Storage privado, Edge Functions Deno) · VLM remoto (OpenAI, Structured Outputs) chamado **só** pela Edge Function `analyze-observation`.
Proibido no Core: Firebase, NgRx/Redux, servidor próprio, Python, ML local/ONNX/embeddings, PostGIS, Tailwind/Bootstrap, outra biblioteca de UI. Nova dependência só com motivo registrado no HANDOFF e versão exata (`npm i -E`).
- **Segredos** nunca no frontend, Git, Notion, logs ou chat. Frontend só usa Project URL + publishable key (`src/environments/supabase.config.ts`, ignorado pelo Git).
- **GPS exato** só em `observation_private_locations` (dono). Nunca no feed, no VLM, em logs ou URLs. Público = "Curitiba — PR" ou "Região Metropolitana de Curitiba (RMC) — PR" (D10).
- **Fotos** sempre reencodadas no cliente (`PhotoService`, sem EXIF) e revalidadas no servidor. Bucket privado.
- **IA é sugestão:** sem porcentagem/score; até 3 candidatos por `rank`; inconclusivo/no_match são respostas válidas; `failed` = erro técnico. Só humano autorizado marca `validated` (D22).
- **Observação antes da IA:** salvar funciona sem VLM; reabrir resultado lê cache, nunca chama o provedor de novo.
- **RLS ligado em toda tabela.** Nunca desligar RLS/auth para "resolver" 401/403. Cliente nunca escreve status de análise, resultado de IA, curadoria ou campos públicos.
- **Escopo:** só o que a task pede. Stretch (mapa, catálogo navegável, multi-foto, votos) só após IMP-056 e antes do freeze. Nada OUT (D06).
- **Não invente** dados científicos, taxonomia, textos educativos, resultados de teste ou aprovações.
- Nunca: `git push --force`, `reset --hard`, `clean -fd`, `supabase db reset` remoto, apagar dados remotos.

## 6. Como falar com os alunos (obrigatório)
Português, frases curtas, sem jargão sem explicação. Todo termo técnico novo ganha uma explicação com analogia na primeira vez (ex.: "RLS é o porteiro do banco: confere quem você é antes de mostrar cada linha"). Ao terminar cada etapa, responda neste formato:
1. **O que eu fiz** — em 2–5 itens, linguagem simples.
2. **Como funciona** — entrada → processamento → saída, onde o dado fica, o que pode falhar.
3. **Como vocês testam** — passos clicáveis (o que abrir, onde tocar, o que deve aparecer).
4. **Próximo passo** — o que sugiro fazer a seguir e por quê.
5. **Preciso de vocês** — só se houver (dado, acesso, decisão, teste no celular).
Detalhes e modelos em `docs/guides/student-communication.md`.

## 7. Qualidade do app (dinâmico, funcional e bonito)
- Mobile-first (360–412 px), componentes Ionic, tema em `src/theme/variables.scss` (mel/âmbar). Telas com hierarquia clara, cartões, ícones, espaçamento generoso, feedback imediato (spinner/skeleton, toasts), estados vazio/erro/sucesso sempre tratados, animações sutis do Ionic.
- TypeScript `strict`, sem `any`; componentes standalone `OnPush`, `inject()`, `input()`, signals, `@if/@for`. Página → serviço/store → Supabase/plugin. Erros via `AppError` + `toUserMessage`.
- Mudança de schema = migration em `supabase/migrations/` + tipos em `src/app/core/models/` no mesmo commit.
- Sem testes automatizados (decisão da equipe). Verificação = `npm run check` + uso real no navegador (e roteiro Android quando tocar câmera/GPS/permissões).
- Leia o guia da área antes de mexer: `docs/guides/angular-ionic.md` (telas), `capacitor-android.md` (câmera/GPS/APK), `supabase.md` (banco/RLS/Storage/functions), `ai-identification.md` (IA/catálogo), `security-privacy.md` (dados pessoais/chaves), `workflow.md` (Git/Notion/handoff).

## 8. Git — Conventional Commits
- **Só existe a `main`.** O Git é o registro histórico do projeto, acessível online em https://github.com/tecninjas2026-alt/DataBee. Não crie branches nem PRs (decisão da equipe em 21/10/2026: PRs estavam travados e confundiam a equipe).
- Mensagem: `<tipo>(<escopo>): <descrição curta no imperativo>` + linha em branco + corpo opcional + rodapé `Refs: IMP-019`.
  Tipos: `feat` (funcionalidade), `fix` (correção), `docs`, `style` (formatação), `refactor`, `perf`, `test`, `build` (dependências/build), `ci`, `chore` (manutenção). Escopos: `auth`, `register`, `observations`, `feed`, `ai`, `supabase`, `android`, `ui`, `deps`, `docs`.
  Ex.: `feat(register): add camera capture with EXIF-free reencode` · `Refs: IMP-019`.
- Commits pequenos e coerentes; `git add` de arquivos específicos; revise `git diff --staged` buscando segredos antes de cada commit.
- Ciclo do agente (automático, sem pedir permissão):
  1. no início: `git switch main && git pull --ff-only`;
  2. durante a task: commits pequenos na `main` a cada etapa que funciona (`npm run check` verde);
  3. antes de cada `git push origin main`: `npm run check` passa, autorrevisão de `git diff --staged` com o prompt de `docs/guides/workflow.md` §6, nenhum segredo, `docs/HANDOFF.md` atualizado no último commit da task.
- Código que ainda não funciona **não vai para a `main`**: mantenha local até passar no check; se a sessão precisar parar, registre no HANDOFF o que falta e só commite o que está estável.
- Se `git push` for recusado porque a `main` remota andou: `git pull --rebase origin main`, resolva conflitos entendendo as duas mudanças, rode `npm run check` e envie de novo. Nunca force push.

## 9. Ao concluir uma task (Definition of Done do agente)
1. `npm run check` passa sem erros/warnings novos; fluxo testado no navegador; APK gerado se a task tocar Android.
2. Commits feitos na `main` e enviados (`git push origin main`); `git status` limpo.
3. `docs/HANDOFF.md` atualizado (estado, próximos passos, pendências).
4. No Notion, na página da task: seção **"🤖 Registro do agente — data"** (arquivos, comandos, verificado/não verificado) e seção **"🎓 Explicação para a equipe"** (conceitos e processo explicados para iniciantes, com perguntas do checkpoint e respostas em toggles). Ao fechar um marco (gate/semana), crie uma página-filha do Guia de execução no mesmo estilo de "Explicação do setup inicial", consolidando tudo o que foi feito. Status → `Review` (o código já está em `main`). `Done` quando a equipe confirmar que testou e entendeu (ou pedir explicitamente para concluir); depois marque como `Ready` as tasks que ficaram desbloqueadas.
5. Relate aos alunos no formato do §6.

## Entrega e continuidade — preferência da equipe em 22/10/2026
- Página oficial: https://app.notion.com/p/401d3425eae4800c811ffcbc7967cc6a. Padrão: docs/android-versions.md. Usar títulos hierárquicos, listas curtas, versões da mais recente para a mais antiga e download direto visível no topo.
- Notion Free deste workspace limita arquivos a 5 MB. Se o APK exceder o limite, hospedar em GitHub Releases como teste e incluir download direto no Notion; não contratar plano nem alegar anexo direto quando for link externo.
- Publicar cada APK de teste na página compartilhada de versões Android do Notion, com arquivo acessível à equipe, data, código de origem e descrição curta do que funciona e falta. Link local no chat não substitui entrega compartilhada.
- Preservar histórico e só marcar aprovação após teste real. Se escrita/upload não estiverem disponíveis, registrar pendência sem alegar publicação.
- Retomar as bases do Notion, este arquivo, HANDOFF e student-communication.md antes de conduzir o chat. Fazer o trabalho técnico autorizado e explicar em português simples, sem repetir solicitações já resolvidas.

## 10. Comandos
```bash
npm install                  # instala dependências (npm ci em máquina limpa)
npm start                    # app em http://localhost:4200
npm run start:lan            # acessível pelo celular na mesma rede
npm run check                # lint + build de produção
npm run android:sync         # build web + copia para android/
npm run android:open         # abre no Android Studio (Run ▶ instala no celular)
cd android && ./gradlew assembleDebug   # APK em android/app/build/outputs/apk/debug/app-debug.apk
npm run supabase -- <args>   # Supabase CLI (login, link, migration new, db push, functions deploy)
```
Particularidades do PC da equipe (Avast, caminho com acento, variáveis Java/Android): `docs/SETUP.md` e `docs/guides/capacitor-android.md` §5.

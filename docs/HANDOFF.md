# HANDOFF — estado atual do DataBee

> **Obrigatório:** todo agente ou pessoa que alterar o projeto atualiza este arquivo ao final (protocolo em `docs/guides/workflow.md` §4). Mantenha curto e atual; apague o que ficou velho. Histórico detalhado = `git log` + `docs/verification/` + Notion.

**Atualizado em:** 2026-10-22 · **Por:** Codex · **Semana:** 3 (21–23/10) · **Meta da equipe:** app pronto em **28/10** (feature freeze) · teste final até 04/11.

## Resumo em 30 segundos
- O app abre, faz **login real** (contas A/B), tira/escolhe foto (sem EXIF) e lê o GPS com consentimento. **Ainda não salva observações nem identifica a abelha** — dados de treino IMP-069 criados/testados; salvar no app vem nas IMP-022 → 035; IA nas IMP-023…031.
- Banco Supabase pronto para guardar observações: tabelas de observações, localização privada, metadados da foto, perfis e pasta privada de fotos, todas com RLS testado com contas A/B reais.
- Git: **só a `main`**, commits diretos (sem branches/PRs). Repositório: https://github.com/tecninjas2026-alt/DataBee.

## Estado por área
| Área | Situação | Evidência |
|---|---|---|
| App base (Ionic 9 + Angular 22.2 + Capacitor 8) | `npm run check` sem warnings; 8 rotas da D25; modo pré-visualização sem chave | — |
| Supabase (projeto `DataBee`, ref `uqfuuahziwgxwjymtwil`, Canadá Central) | Publishable key no arquivo local ignorado; CLI autenticada e vinculada | `docs/verification/2026-10-15-supabase-auth.md`, `2026-10-16-imp-012-cli.md` |
| Login / sessão (IMP-016) | Guard exige sessão em Registrar; logout limpa estado; 6/6 cenários reais confirmados pela equipe | `docs/verification/2026-10-21-imp-016-execution.md` |
| Cadastro / sessão (IMP-033/034) | Textos completos recebidos; cadastro já existente, mensagens de e-mail revisadas; troca direta de conta e retornos atrasados de foto/GPS protegidos. Chrome: 8 controles locais de cadastro + 12 de privacidade aprovados; **sem comprovação de entrega/confirmação de e-mail ou novo fluxo real A/B** | `docs/verification/2026-10-21-imp-033-diagnosis.md`, `2026-10-21-imp-021-034-checkpoints.md` |
| Perfis (IMP-032) | Migration aplicada; saudação usa apelido; SDK A/B/anon 29/29 | `docs/verification/2026-10-21-imp-032-execution.md` |
| Observações + localização privada (IMP-013) | Migration aplicada; SDK A/B/anon 59/59 | `docs/verification/2026-10-20-imp-013-execution.md` |
| Metadados da foto (IMP-014) | Migration aplicada; SDK 32/32 | `docs/verification/2026-10-21-imp-014-execution.md` |
| Storage privado `observation-images` (IMP-015) | Migration aplicada; SDK 25/25 | `docs/verification/2026-10-21-imp-015-execution.md` |
| Foto (IMP-018/019) | Câmera/galeria v8, JPEG ≤ 2048 px / 5 MB sem EXIF; nova foto limpa GPS anterior; resposta atrasada após logout é ignorada | falta Android real |
| GPS (IMP-020) | Opcional somente na câmera; **galeria omite GPS atual por decisão da equipe em 21/10**; retorno antigo não preenche outra foto/conta | falta Android real |
| Android (IMP-017/021) | SDK reparado; APK atualizado de 22/10 gerado e assinado, 9.372.065 bytes, código 08ab799. Conteúdo web conferido (41 arquivos). Falta instalar e testar no celular | `docs/verification/2026-10-22-android-apk.md`; 11 casos físicos Not run |
| Dados de teste (IMP-069) | Dois conjuntos TEST DATA A/B criados; equipe confirmou **18/18 Pass** do SDK. Relatório, manifesto (8/8 etapas confirmadas), PNG e hashes conferidos pelo agente. IDs privados preservados em `.tmp`; sem limpeza. **Nenhuma exclusão autorizada** | `docs/verification/2026-10-21-imp-069-execution.md`, `2026-10-21-imp-069-client.json` |
| Upload / salvar / descarte (IMP-022/035) | Critérios completos recebidos, estrutura remota inspecionada só em leitura e plano pronto. **Implementação aguarda dependências IMP-020/021 e IMP-033/034**; Salvar segue desabilitado. Nenhuma mudança remota autorizada nesta etapa | `docs/verification/2026-10-21-imp-022-035-preparation.md` |
| Catálogo (IMP-070) | Rascunho com 12 espécies em `supabase/catalog/catalog-v1.draft.json`; família (C05) e textos educativos (D24) pendentes | — |
| Telas 5–8 (Resultado, Minhas, Detalhe, Feed) | Placeholders com `TODO(IMP-xxx)` | — |

Migrations aplicadas no dev (não editar; correção = nova migration): `20261016032127` IMP-013 · `20261021115711` IMP-032 · `20261021122259` IMP-014 · `20261021130929` IMP-015. Dados artificiais dos testes permanecem no dev (sem limpeza).

## Tasks no Notion (última consulta em 21/10 — Notion é a fonte oficial)
- **Done:** IMP-001, 006, 007, 008, 009, 010, 011, 012, 013, 014, 015, 016, 018.
- **Review:** IMP-002 (humano), IMP-032 (falta confirmar o apelido no fluxo real do app).
- **IMP-069:** Ready na última consulta; implementação entregue e execução real 18/18 Pass confirmada pela equipe. Pronta para Review técnico; registro oficial e checkpoint de compreensão para Done pendentes. Notion indisponível ao Codex; nenhum status oficial alterado.
- **In progress:** IMP-017 (APK pronto, instalar), IMP-019/020 (testar no celular), IMP-070 (catálogo).
- **Pendentes humanas:** IMP-003/004 (decisões D06–D12 já registradas; equipe pode fechar), IMP-005.

## Próximos passos (ordem sugerida)
1. **Preparação da próxima versão (agente + equipe):** equipe adiou testes físicos em 22/10; avançar primeiro no navegador com IMP-033/034. Página de versões Android publicada no Notion (https://app.notion.com/p/401d3425eae4800c811ffcbc7967cc6a), com APK hospedado no GitHub Releases: Notion Free recusou anexo acima de 5 MB. Padrão em docs/android-versions.md.
2. **Cadastro/sessão (IMP-033/034):** textos recebidos e diagnóstico pronto; confirmar apelido no fluxo real (IMP-032), configuração efetiva de confirmação/URLs/SMTP conforme D16 e cadastro de e-mail elegível. Credenciais somente no formulário/Dashboard. Comprovar e-mail, confirmação e login, depois restauração/logout/expiração. Não solicitar os textos de novo.
3. **Upload / salvar (IMP-022 → 035):** seguir plano registrado após dependências. Reutilizar tratamento de foto, store e cliente existentes; mesmo UUID por tentativa; backend restrito para saved/descarte. Nada de migration/deploy/exclusão remota antes da revisão e autorização específica pedida nas tasks. Depois IMP-036/037 → Gate 2 (IMP-038).
4. **IA (equipe decide primeiro):** D15 — modelo, conta e orçamento da OpenAI. Sem isso as IMP-025/028 não começam; IMP-023/024/026/027 podem ser preparadas antes.
5. **Perfis (equipe):** confirmar no app que o apelido aparece certo após entrar/recarregar/sair/entrar com B → IMP-032 Done.
6. **Notion / IMP-069:** transferir registros/explicações preparados, confirmar checkpoint de compreensão e revisar dependentes antes de Done/Ready. Execução A/B já confirmada; não repetir criação. Preservar `.tmp/imp069-*`; nenhuma exclusão autorizada.

## Pendências e decisões abertas
- **D15** (IA: modelo/conta/orçamento) · **D16** (SMTP: o padrão só envia e-mail para membros do projeto Supabase) · **C05** (níveis do catálogo, Prof. Rodrigo) · **D24** (textos educativos com fonte).
- **Foto da galeria + GPS decidido:** omitir localização atual; já aplicado ao código, falta teste Android. Não perguntar novamente essa decisão.
- Cadastro novo, recebimento/confirmação real de e-mail e URLs efetivas (IMP-033/034) ainda não comprovados; diagnóstico e mensagens de erro preparados.
- SDK Android reparado em 22/10 e APK atualizado entregue localmente. Testes no aparelho continuam pendentes.
- `gh` não instalado — não é necessário (sem PRs). PRs #1–#9 ficaram no repositório antigo suspenso (`TEC-NINJAS/DataBee`); todo o histórico está no novo.

## Ambiente do PC da equipe
Node 24.19 · npm 11.17 · Git 2.56 · JDK 21 presente (`C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot`). **SDK Android: plataforma 36 reparada em 22/10; Platform-Tools e Build-Tools 35/36 disponíveis. ANDROID_HOME aponta para o SDK existente e assembleDebug aprovado.** Android Studio instalado/iniciado. Supabase CLI 2.121 via npm (`scripts/supabase.mjs`, adaptação do Avast). Gradle usa certificados do Windows; caminho com acento → `android.overridePathCheck=true`. Avisos npm allow-scripts e avisos Gradle overridePathCheck/flatDir já previstos. Ferramentas manuais em `scripts/manual/` e `.tmp/` (ignorado).

## Última sessão
2026-10-22 — Codex, publicação Android: página de versões criada no Guia do Notion, organizada com Markdown/títulos/listas e padrão de linguagem. Anexo direto recusado pelo limite de 5 MB; APK publicado em prévia no GitHub Releases, com download direto no Notion e integridade conferida. Sem mudança de plano, código ou aprovação física. Evidência: docs/verification/2026-10-22-android-publication.md.
2026-10-22 — Codex, continuidade: professora confirmou que contas estavam corretas; observava outro projeto Supabase. Consulta somente leitura: 4 contas (3 confirmadas/1 pendente), 4 perfis. Sem falha de persistência comprovada. Equipe pediu APKs sempre em página compartilhada no Notion, linguagem conforme bases anteriores e avanço no navegador antes do celular. Conteúdo preparado; publicação/anexo ainda pendentes. Evidência: docs/verification/2026-10-22-auth-presence.md.
2026-10-22 — Codex: SDK reparado com pacote oficial e integridade verificada; Platform-Tools/Build-Tools instalados; android:sync e assembleDebug aprovados. APK 08ab799 com assinatura v2 e 41 assets conferidos entregue localmente. Sem alteração de código do app, dados remotos ou status no Notion; teste físico pendente. Evidência: docs/verification/2026-10-22-android-apk.md.
2026-10-21 — Codex, preparação IMP-022/035 e dependências: textos completos IMP-021/022/033/034/035 recebidos. Inspeção remota somente de estrutura: RLS ativo, bucket privado, cliente atualiza apenas captured_at; plano registrado. Decisão da equipe aplicada: galeria sem GPS atual. Corrigidos rascunho na troca direta A → B e retornos antigos de foto/GPS após logout/troca. Mensagens de cadastro revisadas. Check aprovado; Chrome local 12/12 privacidade e 8/8 mensagens/validação, sem conta/e-mail remoto criado. Android sync aprovado, assembleDebug bloqueado por SDK ausente; Studio aberto e equipe orientada. Nenhum teste físico, migration, deploy ou exclusão; nenhum Done declarado. Upload/salvar ainda não implementados por dependências pendentes. Evidências em `docs/verification/2026-10-21-imp-022-035-preparation.md`, `2026-10-21-imp-021-034-checkpoints.md`, `2026-10-21-imp-033-diagnosis.md`.
2026-10-21 — Codex, confirmação IMP-069: equipe relatou “tudo certo. tudo pass”; agente conferiu relatório SDK **18/18 Pass** (21:44:52 BRT), cópia por execução, manifesto com dois conjuntos e oito etapas confirmadas, PNG e hashes do código/migrations. Evidência sanitizada arquivada em `docs/verification/2026-10-21-imp-069-client.json`; documentação atualizada. Conferência posterior somente local, sem novas escritas/exclusões remotas. Pendem atualização no Notion e checkpoint de compreensão; próxima implementação depende dos critérios completos IMP-022/035.
2026-10-21 — Claude, organização do projeto: pilha IMP-013/014/015/016/032/069 + preparação Android integrada na `main` (fast-forward, check verde); todas as outras branches apagadas (locais e GitHub) e remote antigo removido; processo mudou para commits diretos na `main` (AGENTS.md §8, workflow.md, CLAUDE.md; template de PR removido); APK debug atual gerado; HANDOFF reescrito; Notion com status e registros atualizados. Nenhum dado remoto alterado.
2026-10-21 — Claude, migração do repositório para `tecninjas2026-alt/DataBee` após suspensão da conta `TEC-NINJAS`.
2026-10-15 a 21/10 — Codex: Supabase novo (Canadá), chave pública, CLI vinculada, IMP-013/014/015/032 aplicadas e testadas, correções de login (IMP-016), plano IMP-069. Detalhes em `docs/verification/` e `git log`.
2026-10-14 — Claude: setup inicial (ambiente, scaffold, serviços, docs para agentes). Explicações para alunos: setup https://app.notion.com/p/3f9d3425eae4812b81ffc11a375d32b5 · progresso 15–21/10 https://app.notion.com/p/400d3425eae481a6bdb6d41f47418215

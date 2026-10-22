# HANDOFF — estado atual do DataBee

> **Obrigatório:** todo agente ou pessoa que alterar o projeto atualiza este arquivo ao final (protocolo em `docs/guides/workflow.md` §4). Mantenha curto e atual; apague o que ficou velho. Histórico detalhado = `git log` + `docs/verification/` + Notion.

**Atualizado em:** 2026-10-21 · **Por:** Codex · **Semana:** 3 (21–23/10) · **Meta da equipe:** app pronto em **28/10** (feature freeze) · teste final até 04/11.

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
| Perfis (IMP-032) | Migration aplicada; saudação usa apelido; SDK A/B/anon 29/29 | `docs/verification/2026-10-21-imp-032-execution.md` |
| Observações + localização privada (IMP-013) | Migration aplicada; SDK A/B/anon 59/59 | `docs/verification/2026-10-20-imp-013-execution.md` |
| Metadados da foto (IMP-014) | Migration aplicada; SDK 32/32 | `docs/verification/2026-10-21-imp-014-execution.md` |
| Storage privado `observation-images` (IMP-015) | Migration aplicada; SDK 25/25 | `docs/verification/2026-10-21-imp-015-execution.md` |
| Foto (IMP-018/019) | Câmera/galeria v8, reencode JPEG ≤ 2048 px / 5 MB sem EXIF; testado no navegador | falta Android real |
| GPS (IMP-020) | Consentimento, leitura única, precisão, recusa não bloqueia; texto deixa claro que salvar ainda não existe | falta Android real |
| Android (IMP-017) | APK debug **gerado em 21/10 com o código atual**: `android/app/build/outputs/apk/debug/app-debug.apk` | falta instalar no Galaxy S25 FE (roteiro em `docs/verification/2026-10-20-android-preparation.md`) |
| Dados de teste (IMP-069) | Dois conjuntos TEST DATA A/B criados; equipe confirmou **18/18 Pass** do SDK. Relatório, manifesto (8/8 etapas confirmadas), PNG e hashes conferidos pelo agente. IDs privados preservados em `.tmp`; sem limpeza. **Nenhuma exclusão autorizada** | `docs/verification/2026-10-21-imp-069-execution.md`, `2026-10-21-imp-069-client.json` |
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
1. **Salvar observação (agente + equipe):** obter os critérios completos das IMP-022 e IMP-035 no Notion (ou colados pela equipe enquanto o acesso estiver indisponível) e implementar upload + salvar. Banco, Storage e dados de treino estão prontos. Depois IMP-036/037 (Minhas e Detalhe) → Gate 2 (IMP-038).
2. **IMP-069 (registro):** transferir execução/explicação de `docs/verification/2026-10-21-imp-069-execution.md` ao Notion; registrar checkpoint de compreensão e revisar dependentes antes de Done/Ready. Execução A/B já confirmada, sem necessidade de repetir. Preservar `.tmp/imp069-*`; nenhuma exclusão autorizada.
3. **Android (equipe + agente):** instalar o APK atual no celular e seguir o roteiro de câmera/GPS (IMP-017/019/020/021).
4. **IA (equipe decide primeiro):** D15 — modelo, conta e orçamento da OpenAI. Sem isso as IMP-025/028 não começam; IMP-023/024/026/027 podem ser preparadas antes.
5. **Perfis (equipe):** confirmar no app que o apelido aparece certo após entrar/recarregar/sair/entrar com B → IMP-032 Done.

## Pendências e decisões abertas
- **D15** (IA: modelo/conta/orçamento) · **D16** (SMTP: o padrão só envia e-mail para membros do projeto Supabase) · **C05** (níveis do catálogo, Prof. Rodrigo) · **D24** (textos educativos com fonte).
- **Foto da galeria + GPS:** decidir se a localização atual do celular deve ser omitida ou marcada `user_informed` para fotos da galeria.
- Cadastro novo, confirmação de e-mail e Redirect URLs (IMP-033/034) ainda não testados.
- `gh` não instalado — não é necessário (sem PRs). PRs #1–#9 ficaram no repositório antigo suspenso (`TEC-NINJAS/DataBee`); todo o histórico está no novo.

## Ambiente do PC da equipe
Node 24.19 · npm 11.17 · Git 2.56 · JDK 21 (`C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot`) · Android SDK em `%LOCALAPPDATA%\Android\Sdk` (platform 36, build-tools 36.0.0; `ANDROID_HOME` definido) · Supabase CLI 2.121 via npm (`npm.cmd run supabase -- ...` usa `scripts/supabase.mjs` por causa do Avast). Avast intercepta HTTPS: Gradle confia nos certificados do Windows (`~/.gradle/gradle.properties`). Caminho com acento → `android.overridePathCheck=true`. Avisos `npm warn allow-scripts` são esperados. Ferramentas manuais de verificação ficam em `scripts/manual/` e `.tmp/` (ignorado pelo Git).

## Última sessão
2026-10-21 — Codex, confirmação IMP-069: equipe relatou “tudo certo. tudo pass”; agente conferiu relatório SDK **18/18 Pass** (21:44:52 BRT), cópia por execução, manifesto com dois conjuntos e oito etapas confirmadas, PNG e hashes do código/migrations. Evidência sanitizada arquivada em `docs/verification/2026-10-21-imp-069-client.json`; documentação atualizada. Conferência posterior somente local, sem novas escritas/exclusões remotas. Pendem atualização no Notion e checkpoint de compreensão; próxima implementação depende dos critérios completos IMP-022/035.
2026-10-21 — Claude, organização do projeto: pilha IMP-013/014/015/016/032/069 + preparação Android integrada na `main` (fast-forward, check verde); todas as outras branches apagadas (locais e GitHub) e remote antigo removido; processo mudou para commits diretos na `main` (AGENTS.md §8, workflow.md, CLAUDE.md; template de PR removido); APK debug atual gerado; HANDOFF reescrito; Notion com status e registros atualizados. Nenhum dado remoto alterado.
2026-10-21 — Claude, migração do repositório para `tecninjas2026-alt/DataBee` após suspensão da conta `TEC-NINJAS`.
2026-10-15 a 21/10 — Codex: Supabase novo (Canadá), chave pública, CLI vinculada, IMP-013/014/015/032 aplicadas e testadas, correções de login (IMP-016), plano IMP-069. Detalhes em `docs/verification/` e `git log`.
2026-10-14 — Claude: setup inicial (ambiente, scaffold, serviços, docs para agentes). Explicações para alunos: setup https://app.notion.com/p/3f9d3425eae4812b81ffc11a375d32b5 · progresso 15–21/10 https://app.notion.com/p/400d3425eae481a6bdb6d41f47418215

# Guia — Supabase (Auth, Postgres + RLS, Storage, Edge Functions)

Projeto hospedado adotado no recomeço autorizado em 15/10/2026: `DataBee`, ref `uqfuuahziwgxwjymtwil`, região `ca-central-1` (Canadá Central), organização `TEC-NINJAS's Org`, plano Free conforme o painel mostrado pela equipe. Atualização de D13 no Notion pendente; **login da CLI e vínculo concluídos e conferidos em 16/10** (`projects list` com `linked: true`). Usamos o **projeto remoto** (sem Docker). CLI como devDependency: `npm run supabase -- <comando>`.

## 1. Chaves — quem pode ver o quê
| Valor | Onde fica | Público? |
|---|---|---|
| Project URL + publishable key (`sb_publishable_…`) | `src/environments/supabase.config.ts` (ignorado pelo Git) | Sim (vai no APK). Segurança vem do RLS. |
| Secret key (`sb_secret_…`) / `service_role` | Só Edge Functions (variável de ambiente do Supabase) | **Nunca** |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | `supabase secrets set` / Dashboard → Edge Functions → Secrets | **Nunca** |
| Senha do banco, access token da CLI | Gerenciador de senhas do adulto responsável | **Nunca** |
`APP_CONFIG` recusa chave secreta no frontend e mostra erro no console.

## 2. Vincular a CLI (uma vez por máquina — humano)
```bash
npm.cmd run supabase -- login --agent no --output-format text  # PowerShell: login interativo do responsável
npm.cmd run supabase -- projects list                       # conferir a referência no Dashboard
npm.cmd run supabase -- link --project-ref uqfuuahziwgxwjymtwil
```

O código de verificação mostrado no navegador é preenchido somente no terminal que iniciou o login. Nunca registrar token/código/senha em chat, Git ou Notion. As opções do login evitam `Cannot prompt for input in JSON output mode` em terminais abertos pelo agente. Login no Dashboard não autentica automaticamente a CLI. Em outros shells, `npm` também pode ser usado.

No Windows com Avast, use o comando do projeto (`npm.cmd run supabase -- ...`). Ele passa por `scripts/supabase.mjs`: o Node lê os certificados públicos já confiáveis no Windows e prepara um arquivo temporário para a CLI, que usa Bun. O processo filho recebe `SSL_CERT_FILE` e, se ainda ausente, `NODE_EXTRA_CA_CERTS`; o arquivo é removido ao terminar. Uma configuração explícita de `SSL_CERT_FILE` é preservada. Outros sistemas seguem com o executável oficial sem essa adaptação. Nenhuma validação TLS é desativada, nenhum certificado é instalado e nenhuma variável permanente do Windows é alterada.

Diagnóstico de 16/10: uma consulta pública a `https://api.supabase.com/v1/projects`, sem credenciais, falhou com `UNABLE_TO_VERIFY_LEAF_SIGNATURE` no Node padrão e recebeu HTTP 401 com as CAs do Windows. O 401 é esperado para essa consulta sem autenticação e confirma que a conexão segura chegou ao servidor. Após o ajuste, a equipe concluiu o login e o agente confirmou a listagem/vínculo do projeto. Evidência em `docs/verification/2026-10-16-imp-012-cli.md`.

Referências: [CAs do sistema no Node](https://nodejs.org/api/tls.html#tlsgetcacertificatestype) e [SSL_CERT_FILE no Bun](https://bun.com/docs/runtime/environment-variables#configuring-bun). Ao relatar erros de login, omita a URL que contém o código temporário; use um novo fluxo de login depois de uma falha.

IMP-012 prepara CLI/configuração/procedimento; não exige migration vazia. A primeira migration de tabelas pertence à IMP-013; profiles continuam na IMP-032. Criar tabelas depende dos critérios completos da task correspondente.

## 3. Migrations (única forma de mudar o schema)
```bash
npm run supabase -- migration new imp013_observations   # cria supabase/migrations/<timestamp>_imp013_observations.sql
# escreva o SQL, revise com o orientador
npm run supabase -- db push --dry-run                    # mostra o que vai aplicar
npm run supabase -- db push                              # aplica no projeto remoto
```
Regras:
- Uma migration por task, nome com o ID (`impXXX_…`). **Nunca edite migration já aplicada** — crie outra.
- Não altere schema pelo Table Editor/SQL Editor do Dashboard (fica fora do Git). Exceção documentada: experimento descartável.
- Depois de criar/alterar tabela: atualize `src/app/core/models/*.model.ts` e, se adotado, gere tipos: `npm run supabase -- gen types typescript --linked > src/app/core/supabase/database.types.ts`.
- Constraints no banco reforçam a UI: `check` de faixas (lat −90..90, lon −180..180, accuracy ≥ 0, body 1–1000, display_name 1–80, bytes ≤ 5 MB), enums via `check (col in (...))`, `not null`, `unique`.

### Esqueleto obrigatório de tabela
```sql
create table public.observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  lifecycle text not null default 'draft' check (lifecycle in ('draft','saved')),
  -- ...
);
alter table public.observations enable row level security;   -- SEMPRE na mesma migration
create index on public.observations (user_id, created_at desc);
```

## 4. RLS — padrões
- Uma policy por operação (`select`, `insert`, `update`, `delete`) e por papel (`to authenticated`). Sem policy = negado (bom padrão).
- Use `(select auth.uid())` (com select — o Postgres cacheia por query).
- `insert` precisa `with check`; `update` precisa `using` **e** `with check`.
```sql
create policy "owner reads own observations" on public.observations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "owner inserts initial draft" on public.observations
  for insert to authenticated
  with check (user_id = (select auth.uid()) and lifecycle = 'draft'
              and publication = 'private' and analysis_status = 'idle');
```
- **RLS autoriza linhas, não colunas.** Para impedir que o dono altere `analysis_status`, resultado de IA, `curation_status`, `shared_object_path`: não dê `update` amplo; use `revoke update ... from authenticated` + `grant update (colunas_permitidas)`, ou funções específicas.
- Funções privilegiadas (`security definer`): `set search_path = ''`, nomes totalmente qualificados (`public.tabela`), checam `auth.uid()`/ownership explicitamente, `revoke execute ... from public, anon` e `grant execute` só a quem precisa. Funções internas (gravar resultado da IA) **não** recebem grant para `authenticated`.
- Profile automático (IMP-032): trigger `after insert on auth.users` que cria `public.profiles(id, display_name)` a partir de `raw_user_meta_data->>'display_name'` (o app já envia esse campo no cadastro).
- Prova de RLS = teste com **cliente** autenticado como A, como B e anônimo (matriz A/B/anon). SQL Editor roda como admin e **não prova nada**.

## 5. Storage
- **Nome atual pedido pela equipe na IMP-015: `observation-images`**, privado; substitui o nome antigo `observation-photos` deste guia. Criado em 21/10 após autorização; policies aplicadas, matriz A/B de arquivos ainda aguardando resultado. `file_size_limit` 5.242.880 bytes; `allowed_mime_types` `image/jpeg, image/png`.
- Path: `<user_id>/<observation_id>/<image_id>.jpg` ou `.png`, coerente com os metadados da IMP-014. Policies conferem dono do objeto, pasta do usuário e dono da observação. Upload somente draft/idle próprio sem metadado final; `shared/` é reservado ao backend.
- Sem UPDATE ou `upsert` para sobrescrever. DELETE direto somente de temporário próprio sem metadado correspondente; não executar limpeza como parte dos testes. Arquivo finalizado exige backend autorizado (IMP-035).
- Cópia compartilhada `shared/<observation_id>/<uuid>.jpg` é escrita só pelo backend (IMP-039); leitura por outros só via Function `get-observation-image` que assina URL de **60 s** (IMP-040). Nunca bucket público.

## 6. Auth
- E-mail + senha; confirmação de e-mail ligada (D16 — SMTP padrão só envia para membros da equipe; usuários externos exigem SMTP próprio, decisão do adulto responsável).
- Dashboard → Authentication → URL Configuration: Site URL / Redirect URLs de acordo com o ambiente (registrar no HANDOFF).
- Logout = `signOut({ scope: 'local' })`; JWT emitido segue válido até expirar (limitação documentada, IMP-034).

## 7. Edge Functions (Deno/TypeScript)
```bash
npm run supabase -- functions new analyze-observation          # cria supabase/functions/analyze-observation/index.ts
npm run supabase -- secrets set OPENAI_MODEL=<id aprovado em D15>   # humano; OPENAI_API_KEY idem
npm run supabase -- functions deploy analyze-observation       # sem Docker: adicione --use-api se a CLI pedir
```
- **Salvar arquivo não é deploy.** Confirme no Dashboard a versão remota e teste contra ela.
- Código compartilhado entre functions em `supabase/functions/_shared/` (contrato, validador, cliente admin, CORS).
- Autenticação: mantenha `verify_jwt` ligado; dentro da function valide o usuário a partir do header `Authorization` (cliente Supabase com o JWT do usuário → `auth.getUser()`/`getClaims()`), depois verifique **ownership** da observação antes de qualquer custo (VLM). Cliente com chave secreta só depois disso e só para a operação necessária.
- Respostas de erro: `{ error: { code, message } }` com status 400/401/403/404/409/429/502/504; sem stack, sem segredo, sem payload do provedor.
- CORS: responder `OPTIONS` e incluir headers `authorization, x-client-info, apikey, content-type`.
- Leia a doc atual de variáveis de ambiente padrão das functions (nomes das chaves mudaram com as novas API keys) antes de usar `Deno.env.get(...)`.
- Frontend chama com `supabase.functions.invoke('analyze-observation', { body: { observation_id } })` — o SDK envia o JWT.

-- IMP-026: somente armazenamento e permissões. Não chama IA nem muda observações.
-- Validação completa BeeAnalysisV2/catálogo no backend antes da escrita (IMP-029).
begin;

create table public.ai_identifications (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null unique references public.observations (id) on delete cascade,
  provider text not null check (char_length(btrim(provider)) between 1 and 80),
  model text not null check (char_length(btrim(model)) between 1 and 160),
  model_version text check (model_version is null or char_length(btrim(model_version)) between 1 and 160),
  schema_version text not null check (schema_version = '2.0'),
  prompt_version text not null check (char_length(btrim(prompt_version)) between 1 and 80),
  catalog_version text not null check (char_length(btrim(catalog_version)) between 1 and 80),
  result jsonb not null,
  created_at timestamptz not null default now() check (isfinite(created_at)),
  constraint ai_identifications_result_envelope check ((
    jsonb_typeof(result) = 'object'
    and result ?& array['status', 'matches', 'imageQuality', 'limitations']
    and result - array['status', 'matches', 'imageQuality', 'limitations'] = '{}'::jsonb
    and result ->> 'status' in ('possible_match', 'inconclusive', 'no_match')
    and result ->> 'imageQuality' in ('adequate', 'poor')
    and octet_length(result::text) <= 16384
    and case when jsonb_typeof(result -> 'matches') = 'array' then
      jsonb_array_length(result -> 'matches') <= 3
      and case result ->> 'status'
        when 'possible_match' then jsonb_array_length(result -> 'matches') >= 1
        when 'no_match' then jsonb_array_length(result -> 'matches') = 0
        else true
      end
    else false end
    and case when jsonb_typeof(result -> 'limitations') = 'array' then
      jsonb_array_length(result -> 'limitations') <= 5
      and case when result ->> 'status' = 'inconclusive' or result ->> 'imageQuality' = 'poor'
        then jsonb_array_length(result -> 'limitations') >= 1 else true end
    else false end
  ) is true)
);

alter table public.ai_identifications enable row level security;

-- Privilégios padrão do Supabase não podem permitir resultado forjado pelo app.
revoke all on table public.ai_identifications from public, anon, authenticated;
grant select on table public.ai_identifications to authenticated;
grant select, insert, update, delete on table public.ai_identifications to service_role;

create policy "owner reads own AI result" on public.ai_identifications
  for select to authenticated using (
    exists (
      select 1 from public.observations as observation
      where observation.id = ai_identifications.observation_id
        and observation.user_id = (select auth.uid())
    )
  );

-- Preserva o INSERT/UPDATE por coluna da IMP-013 e o salvamento restrito IMP-035.
-- Não acrescentar grants de status, resultado, timestamps de análise ou curadoria.
comment on table public.ai_identifications is
  'Um resultado por observação. Cliente só lê o próprio. Escrita exclusiva do backend, após validação do contrato/catálogo. Sem chamada ao provedor nesta migration.';
comment on column public.ai_identifications.result is
  'BeeAnalysisV2 schema 2.0. CHECK protege envelope e tamanhos básicos; backend valida cada candidato, IDs/níveis/ranks/evidências antes de escrever. Não guarda resposta bruta do provedor.';
comment on column public.ai_identifications.catalog_version is
  'Versão do catálogo usada na análise; definida pelo backend, nunca pelo modelo ou cliente.';

commit;

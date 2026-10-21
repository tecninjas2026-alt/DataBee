-- Refs: IMP-013. GPS exato existe somente na tabela privada abaixo.
-- Proposta para revisão: aplicar no projeto dev somente após autorização explícita.
-- A data de captura não tem default: galeria sem data confiável permanece NULL.
create table public.observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  captured_at timestamptz,
  photo_source text not null check (photo_source in ('camera', 'gallery')),
  lifecycle text not null default 'draft' check (lifecycle in ('draft', 'saved')),
  publication text not null default 'private' check (publication in ('private', 'published')),
  analysis_status text not null default 'idle'
    check (analysis_status in ('idle', 'processing', 'completed', 'inconclusive', 'failed')),
  curation_status text default null check (curation_status in ('suggested', 'in_review', 'validated')),
  analysis_started_at timestamptz,
  public_region_label text check (
    public_region_label in ('Curitiba — PR', 'Região Metropolitana de Curitiba (RMC) — PR')
  ),
  constraint observations_owner_reference unique (id, user_id),
  constraint observations_capture_time_finite check (captured_at is null or isfinite(captured_at)),
  constraint observations_analysis_time_finite check (analysis_started_at is null or isfinite(analysis_started_at))
);

alter table public.observations enable row level security;
create index observations_owner_created_at_idx on public.observations (user_id, created_at desc);

create table public.observation_private_locations (
  observation_id uuid primary key,
  owner_id uuid not null default auth.uid(),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy double precision check (accuracy >= 0 and accuracy < 'Infinity'::double precision),
  location_source text not null check (location_source in ('device_gps', 'image_metadata', 'user_informed')),
  consent_at timestamptz,
  -- A chave composta impede anexar uma localização com dono diferente da observação.
  constraint private_locations_same_owner foreign key (observation_id, owner_id)
    references public.observations (id, user_id) on delete cascade,
  constraint private_locations_device_consent check (location_source <> 'device_gps' or consent_at is not null),
  constraint private_locations_consent_time_finite check (consent_at is null or isfinite(consent_at))
);

alter table public.observation_private_locations enable row level security;
create index private_locations_owner_idx on public.observation_private_locations (owner_id);

-- Supabase pode conceder privilégios padrão amplos; recomeçar por uma lista explícita.
revoke all on table public.observations from public, anon, authenticated;
revoke all on table public.observation_private_locations from public, anon, authenticated;

grant select on table public.observations to authenticated;
-- RLS filtra linhas; estes grants limitam também quais colunas o cliente pode escrever.
-- created_at, estados, início de análise e região pública não recebem INSERT/UPDATE.
grant insert (id, user_id, captured_at, photo_source) on public.observations to authenticated;
grant update (captured_at) on public.observations to authenticated;

grant select on table public.observation_private_locations to authenticated;
grant insert (observation_id, owner_id, latitude, longitude, accuracy, location_source, consent_at)
  on public.observation_private_locations to authenticated;
grant update (latitude, longitude, accuracy, location_source, consent_at)
  on public.observation_private_locations to authenticated;

-- Backend confiável terá suas rotinas específicas nas tasks de salvar/IA/curadoria.
-- Nenhum cliente comum recebe DELETE ou escrita em estados/campos públicos.
grant select, insert, update, delete on public.observations, public.observation_private_locations to service_role;

create policy "owner reads observations" on public.observations
  for select to authenticated using (user_id = (select auth.uid()));

create policy "owner inserts initial draft" on public.observations
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and lifecycle = 'draft'
    and publication = 'private'
    and analysis_status = 'idle'
    and curation_status is null
    and analysis_started_at is null
    and public_region_label is null
  );

create policy "owner updates allowed observation fields" on public.observations
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "owner reads private location" on public.observation_private_locations
  for select to authenticated using (owner_id = (select auth.uid()));

create policy "owner inserts own observation location" on public.observation_private_locations
  for insert to authenticated with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.observations as observation
      where observation.id = observation_private_locations.observation_id and observation.user_id = (select auth.uid())
    )
  );

create policy "owner updates private location" on public.observation_private_locations
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.observations as observation
      where observation.id = observation_private_locations.observation_id and observation.user_id = (select auth.uid())
    )
  );

comment on column public.observations.captured_at is 'Somente data de captura com fonte confiável; nunca preencher por suposição.';
comment on column public.observations.photo_source is 'Origem da foto (D21), preservada do modelo do app.';
comment on column public.observations.curation_status is 'Backend só sugere após resultado persistido; validated exige humano autorizado. Cliente comum não escreve.';
comment on table public.observation_private_locations is 'Localização exata owner-only; não enviar ao feed, ao VLM, a logs ou URLs.';
comment on column public.observation_private_locations.location_source is 'Origem explícita: localização manual não equivale a GPS do dispositivo.';

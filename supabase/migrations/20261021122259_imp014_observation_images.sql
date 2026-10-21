-- Refs: IMP-014. Proposta local para revisão; aplicação remota ainda não autorizada.
-- Somente metadados sintéticos/reais da foto; nunca conteúdo binário ou URL assinada.
create table public.observation_images (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null unique,
  owner_id uuid not null default auth.uid(),
  object_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png')),
  bytes integer not null check (bytes > 0 and bytes <= 5242880),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  photo_source text not null check (photo_source in ('camera', 'gallery')),
  constraint observation_images_same_owner foreign key (observation_id, owner_id)
    references public.observations (id, user_id) on delete cascade,
  -- Caminho reproduzível da IMP-015: sem domínio, query string, EXIF ou nome pessoal.
  -- O cliente gera id antes do upload; conversão de formato não muda photo_source.
  constraint observation_images_object_path check (
    object_path = owner_id::text || '/' || observation_id::text || '/' || id::text ||
      case mime_type when 'image/jpeg' then '.jpg' when 'image/png' then '.png' end
  )
);

alter table public.observation_images enable row level security;
create index observation_images_owner_idx on public.observation_images (owner_id);

revoke all on table public.observation_images from public, anon, authenticated;
grant select on table public.observation_images to authenticated;
grant insert (id, observation_id, owner_id, object_path, mime_type, bytes, position, photo_source)
  on public.observation_images to authenticated;
-- UPDATE/DELETE do cliente não são concedidos, mesmo enquanto a observação é draft.
grant select, insert, update, delete on public.observation_images to service_role;

create policy "owner reads image metadata" on public.observation_images
  for select to authenticated using (owner_id = (select auth.uid()));

create policy "owner inserts image metadata into own idle draft" on public.observation_images
  for insert to authenticated with check (
    owner_id = (select auth.uid())
    and exists (
      select 1 from public.observations as observation
      where observation.id = observation_images.observation_id
        and observation.user_id = (select auth.uid())
        and observation.lifecycle = 'draft'
        and observation.analysis_status = 'idle'
        and observation.photo_source = observation_images.photo_source
    )
  );

comment on table public.observation_images is 'Uma foto por observação no Core. Guarda caminho e metadados, nunca binário. Cliente só insere/lê o próprio; alterações e limpeza exigem backend autorizado.';
comment on column public.observation_images.object_path is 'Caminho owner_id/observation_id/id.jpg (JPEG) ou .png (PNG); não aceita URL assinada ou pública.';
comment on column public.observation_images.bytes is 'Tamanho declarado, 1 a 5242880 bytes. Validação do conteúdo do arquivo depende do fluxo de upload/backend.';
comment on column public.observation_images.photo_source is 'Origem camera/gallery preservada da observação, independente de reencode, MIME ou remoção de EXIF.';

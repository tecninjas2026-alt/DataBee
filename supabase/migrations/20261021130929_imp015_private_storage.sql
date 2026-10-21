-- Refs: IMP-015. Proposta local: não aplicar antes da revisão e autorização específica.
-- storage.objects é gerenciada pelo Supabase e já tem RLS ligado (inspecionado).
-- Não alterar sua estrutura, grants ou objetos diretamente por SQL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'observation-images', 'observation-images', false, 5242880,
  array['image/jpeg', 'image/png']::text[]
);

create policy "databee owner uploads temporary image" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'observation-images'
    and owner_id = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.filename(name) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$'
    and exists (
      select 1 from public.observations as observation
      where observation.id::text = (storage.foldername(name))[2]
        and observation.user_id = (select auth.uid())
        and observation.lifecycle = 'draft'
        and observation.analysis_status = 'idle'
    )
    and not exists (
      select 1 from public.observation_images as image
      where image.observation_id::text = (storage.foldername(name))[2]
    )
  );

create policy "databee owner reads private image" on storage.objects
  for select to authenticated using (
    bucket_id = 'observation-images'
    and owner_id = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.observations as observation
      where observation.id::text = (storage.foldername(name))[2]
        and observation.user_id = (select auth.uid())
    )
  );

create policy "databee owner deletes only temporary image" on storage.objects
  for delete to authenticated using (
    bucket_id = 'observation-images'
    and owner_id = (select auth.uid())::text
    and array_length(storage.foldername(name), 1) = 2
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.observations as observation
      where observation.id::text = (storage.foldername(name))[2]
        and observation.user_id = (select auth.uid())
    )
    and not exists (
      select 1 from public.observation_images as image
      where image.object_path = storage.objects.name
    )
  );

-- Sem policy UPDATE: nem update, move ou upsert podem sobrescrever arquivo.
-- Prefixo shared/ não passa pelo caminho UUID do dono; escrita só via backend.
-- Futuras rotinas de finalização/cleanup precisam coordenar concorrência e
-- revalidar o conteúdo do arquivo. Não inserir/apagar storage.objects por SQL.

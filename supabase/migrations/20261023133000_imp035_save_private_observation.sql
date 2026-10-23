-- IMP-035, parte salvar. Revisão e dry-run em 23/10; equipe delegou a execução técnica.
-- Chamável só pela Edge Function, depois de baixar e validar o JPEG real.
-- Não implementa descarte, não remove dados e não amplia grants do cliente.
begin;

create function public.save_validated_observation(
  p_observation_id uuid,
  p_owner_id uuid,
  p_image_id uuid,
  p_bytes integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  observation public.observations%rowtype;
  image public.observation_images%rowtype;
begin
  -- O lock serializa confirmações concorrentes da mesma observação.
  select * into observation from public.observations
    where id = p_observation_id and user_id = p_owner_id for update;
  if not found then
    raise exception 'observation_not_found' using errcode = 'P0002';
  end if;
  if observation.publication <> 'private' or observation.analysis_status <> 'idle' then
    raise exception 'observation_state_conflict' using errcode = 'P0001';
  end if;
  select * into image from public.observation_images
    where observation_id = p_observation_id and owner_id = p_owner_id;
  if not found or image.id <> p_image_id or image.mime_type <> 'image/jpeg'
      or image.bytes <> p_bytes or image.position <> 0
      or image.photo_source <> observation.photo_source
      or image.object_path <> p_owner_id::text || '/' || p_observation_id::text || '/' || p_image_id::text || '.jpg'
      or (observation.photo_source = 'gallery' and observation.captured_at is not null) then
    raise exception 'image_metadata_conflict' using errcode = 'P0001';
  end if;
  -- Só consulta o catálogo do Storage; nenhum INSERT/DELETE direto em storage.objects.
  if not exists (
    select 1 from storage.objects as object
    where object.bucket_id = 'observation-images'
      and object.name = image.object_path
      and object.owner_id = p_owner_id::text
      and (object.metadata->>'size')::bigint = p_bytes
      and object.metadata->>'mimetype' = 'image/jpeg'
  ) then
    raise exception 'image_file_conflict' using errcode = 'P0001';
  end if;
  -- Repetir a confirmação não cria outro registro nem inicia análise.
  if observation.lifecycle = 'draft' then
    update public.observations set lifecycle = 'saved' where id = p_observation_id;
  end if;
  return jsonb_build_object('id', p_observation_id, 'lifecycle', 'saved',
    'publication', 'private', 'analysis_status', 'idle');
end;
$$;

revoke all on function public.save_validated_observation(uuid, uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.save_validated_observation(uuid, uuid, uuid, integer) to service_role;
comment on function public.save_validated_observation(uuid, uuid, uuid, integer)
  is 'IMP-035: confirmação privada sem IA, exclusiva do backend após validar o JPEG; não oferece descarte.';
commit;

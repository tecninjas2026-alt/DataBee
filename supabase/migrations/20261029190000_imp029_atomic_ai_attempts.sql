-- IMP-029: additive proposal. No provider call, photo access, deletion or public grants.
begin;

create table public.ai_analysis_attempts (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null,
  owner_id uuid not null,
  schema_version text not null check (schema_version = '2.0'),
  prompt_version text not null check (char_length(btrim(prompt_version)) between 1 and 80),
  catalog_version text not null check (char_length(btrim(catalog_version)) between 1 and 80),
  started_at timestamptz not null default now() check (isfinite(started_at)),
  finished_at timestamptz check (finished_at is null or isfinite(finished_at)),
  outcome text not null default 'processing' check (outcome in ('processing','completed','inconclusive','failed')),
  constraint ai_attempt_owner foreign key (observation_id, owner_id)
    references public.observations (id,user_id) on delete cascade,
  constraint ai_attempt_finished check ((outcome='processing' and finished_at is null)
    or (outcome<>'processing' and finished_at is not null and finished_at>=started_at))
);
alter table public.ai_analysis_attempts enable row level security;
revoke all on public.ai_analysis_attempts from public,anon,authenticated,service_role;
grant select,insert,update on public.ai_analysis_attempts to service_role;
create unique index ai_one_processing_attempt on public.ai_analysis_attempts(observation_id) where outcome='processing';
create index ai_attempts_owner_time on public.ai_analysis_attempts(owner_id,started_at);
create index ai_attempts_observation on public.ai_analysis_attempts(observation_id);

-- Opaque server fence. Owner interfaces may omit it from their projection.
alter table public.observations add column analysis_attempt_id uuid;
comment on column public.observations.analysis_attempt_id is 'Current server attempt fence. No client INSERT/UPDATE grant. Checked with attempt owner/observation in server-only RPCs.';

create function public.read_ai_analysis_cache(p_observation_id uuid,p_owner_id uuid)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare cached jsonb;
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception 'server_only' using errcode='42501';
  end if;
  select pg_catalog.jsonb_build_object(
    'schemaVersion',a.schema_version,'promptVersion',a.prompt_version,'catalogVersion',a.catalog_version,
    'provider',a.provider,'model',a.model,'modelVersion',a.model_version,
    'status',o.analysis_status,'result',a.result
  ) into cached from public.ai_identifications a join public.observations o on o.id=a.observation_id
  where o.id=p_observation_id and o.user_id=p_owner_id and o.lifecycle='saved' and o.publication='private';
  return cached;
end;
$$;

create function public.acquire_ai_analysis_attempt(
  p_observation_id uuid,p_owner_id uuid,p_schema_version text,p_prompt_version text,p_catalog_version text
) returns jsonb language plpgsql volatile security invoker set search_path='' as $$
declare
  observation public.observations%rowtype;
  cached jsonb;
  attempt_id uuid;
  attempt_time timestamptz := pg_catalog.now();
  day_start timestamptz := pg_catalog.date_trunc('day',pg_catalog.now() at time zone 'UTC') at time zone 'UTC';
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception 'server_only' using errcode='42501';
  end if;
  if p_observation_id is null or p_owner_id is null or p_schema_version is distinct from '2.0'
    or p_prompt_version is null or char_length(btrim(p_prompt_version)) not between 1 and 80
    or p_catalog_version is null or char_length(btrim(p_catalog_version)) not between 1 and 80 then
    raise exception 'invalid_attempt_configuration' using errcode='22023';
  end if;
  -- Serialize quota reservations for one owner, including different observations.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('databee-ai:'||p_owner_id::text,0));
  select * into observation from public.observations where id=p_observation_id and user_id=p_owner_id for update;
  if not found then raise exception 'observation_not_found' using errcode='P0002'; end if;
  if observation.lifecycle<>'saved' or observation.publication<>'private' then
    raise exception 'observation_not_ready' using errcode='55000';
  end if;
  cached := public.read_ai_analysis_cache(p_observation_id,p_owner_id);
  if cached is not null then
    -- Never overwrite cached result or silently rerun after a version mismatch.
    if observation.analysis_status not in ('completed','inconclusive') then
      raise exception 'cache_state_conflict' using errcode='55000';
    end if;
    return pg_catalog.jsonb_build_object('kind','cached','record',cached);
  end if;
  if observation.analysis_status in ('completed','inconclusive') then
    raise exception 'result_missing' using errcode='55000';
  end if;
  if observation.analysis_status='processing' then
    if observation.analysis_started_at is not null and observation.analysis_started_at>attempt_time-interval '120 seconds' then
      return pg_catalog.jsonb_build_object('kind','busy');
    end if;
    update public.ai_analysis_attempts set outcome='failed',finished_at=attempt_time
      where id=observation.analysis_attempt_id and observation_id=p_observation_id and owner_id=p_owner_id and outcome='processing';
    update public.observations set analysis_status='failed',analysis_attempt_id=null,analysis_started_at=null where id=p_observation_id;
  end if;
  -- Planned safety caps: all reservations count, including network failures.
  if (select count(*) from public.ai_analysis_attempts where observation_id=p_observation_id)>=3
    or (select count(*) from public.ai_analysis_attempts where owner_id=p_owner_id and started_at>=day_start and started_at<day_start+interval '1 day')>=20 then
    return pg_catalog.jsonb_build_object('kind','limited');
  end if;
  insert into public.ai_analysis_attempts(observation_id,owner_id,schema_version,prompt_version,catalog_version)
    values(p_observation_id,p_owner_id,p_schema_version,p_prompt_version,p_catalog_version) returning id into attempt_id;
  update public.observations set analysis_status='processing',analysis_attempt_id=attempt_id,analysis_started_at=attempt_time where id=p_observation_id;
  return pg_catalog.jsonb_build_object('kind','started','attemptId',attempt_id);
end;
$$;

create function public.complete_ai_analysis_attempt(
  p_observation_id uuid,p_owner_id uuid,p_attempt_id uuid,p_record jsonb
) returns boolean language plpgsql volatile security invoker set search_path='' as $$
declare
  observation public.observations%rowtype;
  attempt public.ai_analysis_attempts%rowtype;
  final_status text;
begin
  if (select auth.role()) is distinct from 'service_role' then raise exception 'server_only' using errcode='42501'; end if;
  select * into observation from public.observations where id=p_observation_id and user_id=p_owner_id for update;
  if not found or observation.analysis_status<>'processing' or observation.analysis_attempt_id is distinct from p_attempt_id
    or observation.lifecycle<>'saved' or observation.publication<>'private' then return false; end if;
  select * into attempt from public.ai_analysis_attempts
    where id=p_attempt_id and observation_id=p_observation_id and owner_id=p_owner_id and outcome='processing' for update;
  if not found or attempt.started_at<=pg_catalog.now()-interval '120 seconds' then return false; end if;
  if pg_catalog.jsonb_typeof(p_record) is distinct from 'object'
    or (p_record->>'schemaVersion') is distinct from attempt.schema_version
    or (p_record->>'promptVersion') is distinct from attempt.prompt_version
    or (p_record->>'catalogVersion') is distinct from attempt.catalog_version then
    raise exception 'attempt_version_mismatch' using errcode='22023';
  end if;
  final_status := case when p_record->'result'->>'status'='inconclusive' then 'inconclusive' else 'completed' end;
  if (p_record->>'status') is distinct from final_status then
    raise exception 'result_status_mismatch' using errcode='22023';
  end if;
  -- Existing result constraints plus full schema/catalog validation in the server adapter.
  -- A failed INSERT rolls back status and attempt updates in this same transaction.
  insert into public.ai_identifications(observation_id,provider,model,model_version,schema_version,prompt_version,catalog_version,result)
    values(p_observation_id,p_record->>'provider',p_record->>'model',p_record->>'modelVersion',
      attempt.schema_version,attempt.prompt_version,attempt.catalog_version,p_record->'result');
  update public.ai_analysis_attempts set outcome=final_status,finished_at=pg_catalog.now() where id=p_attempt_id;
  update public.observations set analysis_status=final_status,curation_status='suggested',analysis_started_at=null where id=p_observation_id;
  return true;
end;
$$;

create function public.fail_ai_analysis_attempt(p_observation_id uuid,p_owner_id uuid,p_attempt_id uuid)
returns boolean language plpgsql volatile security invoker set search_path='' as $$
declare observation public.observations%rowtype;
begin
  if (select auth.role()) is distinct from 'service_role' then raise exception 'server_only' using errcode='42501'; end if;
  select * into observation from public.observations where id=p_observation_id and user_id=p_owner_id for update;
  if not found or observation.analysis_status<>'processing' or observation.analysis_attempt_id is distinct from p_attempt_id then return false; end if;
  update public.ai_analysis_attempts set outcome='failed',finished_at=pg_catalog.now()
    where id=p_attempt_id and observation_id=p_observation_id and owner_id=p_owner_id and outcome='processing';
  if not found then return false; end if;
  update public.observations set analysis_status='failed',analysis_attempt_id=null,analysis_started_at=null where id=p_observation_id;
  return true;
end;
$$;

revoke all on function public.read_ai_analysis_cache(uuid,uuid) from public,anon,authenticated;
revoke all on function public.acquire_ai_analysis_attempt(uuid,uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.complete_ai_analysis_attempt(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.fail_ai_analysis_attempt(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.read_ai_analysis_cache(uuid,uuid) to service_role;
grant execute on function public.acquire_ai_analysis_attempt(uuid,uuid,text,text,text) to service_role;
grant execute on function public.complete_ai_analysis_attempt(uuid,uuid,uuid,jsonb) to service_role;
grant execute on function public.fail_ai_analysis_attempt(uuid,uuid,uuid) to service_role;

comment on table public.ai_analysis_attempts is 'Server-only reservation history. No photo/GPS/provider payload. Caps: 3 attempts per observation, 20 per owner per UTC day; 120s processing lease. No cost authorization.';
commit;

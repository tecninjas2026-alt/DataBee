-- Refs: IMP-032. Proposta local: aplicar somente após revisão e autorização específica.
-- Nenhum e-mail, senha, foto ou localização pertence a profiles.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 80),
  constraint profiles_display_name_not_blank check (display_name ~ '[^[:space:]]')
);

alter table public.profiles enable row level security;

-- Remover grants padrão amplos antes de conceder somente o necessário.
revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant insert (id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

create policy "authenticated reads minimal profiles" on public.profiles
  for select to authenticated using ((select auth.uid()) is not null);

create policy "owner inserts own profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

create policy "owner updates own display name" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Rotina interna: o cadastro precisa criar o perfil antes de haver sessão no app.
-- Não aceitar parâmetros do cliente nem disponibilizar esta rotina como RPC.
create function public.create_profile_after_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_display_name text;
begin
  if pg_catalog.jsonb_typeof(new.raw_user_meta_data -> 'display_name') = 'string' then
    profile_display_name := pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name');
  end if;

  -- Não converter objetos/números em apelidos nem derivar nomes do e-mail.
  if profile_display_name is null
    or pg_catalog.char_length(profile_display_name) not between 1 and 80
    or profile_display_name !~ '[^[:space:]]'
  then
    profile_display_name := 'Participante';
  end if;

  insert into public.profiles (id, display_name)
    values (new.id, profile_display_name)
    on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_profile_after_signup() from public, anon, authenticated;

create trigger databee_create_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_profile_after_signup();

-- Contas existentes recebem perfil sem alterar auth.users nem sobrescrever apelidos.
-- created_at registra a criação do perfil, não a data antiga da conta.
insert into public.profiles (id, display_name)
select account.id,
  case
    when pg_catalog.jsonb_typeof(account.raw_user_meta_data -> 'display_name') = 'string'
      and pg_catalog.char_length(pg_catalog.btrim(account.raw_user_meta_data ->> 'display_name')) between 1 and 80
      and pg_catalog.btrim(account.raw_user_meta_data ->> 'display_name') ~ '[^[:space:]]'
    then pg_catalog.btrim(account.raw_user_meta_data ->> 'display_name')
    else 'Participante'
  end
from auth.users as account
on conflict (id) do nothing;

comment on table public.profiles is 'Perfil mínimo: leitura entre autenticados; escrita de apelido somente pelo dono. Sem e-mail ou localização.';
comment on column public.profiles.created_at is 'Data automática de criação do perfil; cliente não informa nem altera.';
comment on function public.create_profile_after_signup() is 'Trigger interno de cadastro; nome inválido usa Participante. Não concede autorização a partir de user_metadata.';

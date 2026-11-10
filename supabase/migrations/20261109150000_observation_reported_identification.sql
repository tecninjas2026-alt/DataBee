-- Keep the owner's reported name separate from automated analysis and scientific curation.
alter table public.observations
  add column owner_reported_identification text,
  add constraint observations_reported_identification_valid
    check (
      owner_reported_identification is null
      or (
        lifecycle = 'saved'
        and char_length(owner_reported_identification) between 1 and 80
        and owner_reported_identification = btrim(owner_reported_identification)
        and owner_reported_identification !~ '[[:cntrl:]]'
      )
    );

comment on column public.observations.owner_reported_identification is
  'Nome informado pelo dono da observação, registrado por operador. Privado sob RLS. Não representa sugestão da IA nem validação científica.';

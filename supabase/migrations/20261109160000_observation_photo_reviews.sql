create table public.observation_photo_reviews (
  observation_id uuid primary key,
  owner_id uuid not null default auth.uid(),
  photo_sha256 text not null check (photo_sha256 ~ '^[0-9a-f]{64}$'),
  constraint observation_photo_reviews_owner_photo_key unique (owner_id, photo_sha256),
  constraint observation_photo_reviews_observation_owner_fkey
    foreign key (observation_id, owner_id)
    references public.observations (id, user_id) on delete cascade
);

alter table public.observation_photo_reviews enable row level security;
revoke all on public.observation_photo_reviews from public, anon, authenticated;
grant select (observation_id, owner_id), insert (observation_id, photo_sha256)
  on public.observation_photo_reviews to authenticated;

create policy "owner reads photo reviews"
  on public.observation_photo_reviews for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "owner confirms a saved observation photo"
  on public.observation_photo_reviews for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.observations as observation
      join public.observation_images as image on image.observation_id = observation.id
        and image.owner_id = observation.user_id and image.position = 0
      where observation.id = observation_photo_reviews.observation_id
        and observation.user_id = observation_photo_reviews.owner_id
        and observation.lifecycle = 'saved'
    )
  );

comment on table public.observation_photo_reviews is
  'Private self-assessment for Olhar Atento. One review per saved observation and per identical file within the same account.';

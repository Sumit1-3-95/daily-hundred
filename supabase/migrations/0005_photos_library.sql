-- Daily Hundred: round 6
-- Photos for foods, workouts, tasks and lists, stored in a public Supabase Storage bucket
-- (served from Supabase's CDN). Each user can only write inside their own folder.

alter table public.workout_types add column if not exists image_url text;
alter table public.workout_types add column if not exists archived boolean not null default false;
alter table public.tasks add column if not exists image_url text;
alter table public.lists add column if not exists image_url text;
alter table public.lists add column if not exists icon text;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "photos are public" on storage.objects;
create policy "photos are public" on storage.objects for select using (bucket_id = 'photos');

drop policy if exists "upload own photos" on storage.objects;
create policy "upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "update own photos" on storage.objects;
create policy "update own photos" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "delete own photos" on storage.objects;
create policy "delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- default icons for the starter lists
update lists set icon = case when kind = 'routine' then 'sun' else 'list' end where icon is null;

-- Daily Hundred: workout plan
-- One row per planned day: what to do (checklist), what gets logged when you finish, and its status.
create table if not exists public.plan_days (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  kind text not null default 'strength' check (kind in ('strength','cardio','class','mobility','rest')),
  title text not null,
  place text,
  minutes int not null default 0,
  kcal int not null default 0,
  items jsonb not null default '[]',      -- [{ "id": "1", "name": "Goblet squat", "detail": "3 × 10" }]
  logs jsonb not null default '[]',       -- workouts logged on "Done": [{ "name", "area", "minutes", "kcal" }]
  checked text[] not null default '{}',   -- item ids ticked off
  status text not null default 'planned' check (status in ('planned','done','skipped')),
  note text,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.plan_days enable row level security;
drop policy if exists "own rows" on public.plan_days;
create policy "own rows" on public.plan_days for all using (user_id = auth.uid()) with check (user_id = auth.uid());

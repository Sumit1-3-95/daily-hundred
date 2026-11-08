-- Daily Hundred: initial schema
-- Run in Supabase SQL editor (or `supabase db push`).
-- Every table is private per user via Row Level Security.

create extension if not exists pgcrypto;

-- ---------- profile & targets ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  tz text not null default 'Asia/Kolkata',
  targets jsonb not null default '{
    "bmr":1605,"deficit":500,"workoutMin":45,"protein":125,"kcal":2000,
    "water":3000,"sleep":8,"goalWeight":71.5,"startWeight":77.1
  }'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- food ----------
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  serving text not null,
  kcal numeric not null check (kcal >= 0),
  protein numeric not null default 0,
  carbs numeric,
  fat numeric,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  food_id uuid not null references public.foods(id) on delete cascade,
  qty numeric not null default 1 check (qty > 0),
  meal text not null check (meal in ('Breakfast','Lunch','Snack','Dinner')),
  created_at timestamptz not null default now()
);
create index on public.food_logs (user_id, day);

-- ---------- workouts ----------
create table public.workout_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  area text not null,
  kcal_per_min numeric not null default 6,
  created_at timestamptz not null default now()
);
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  type_id uuid references public.workout_types(id) on delete set null,
  name text not null,
  area text not null default 'Other',
  minutes numeric not null check (minutes >= 0),
  kcal numeric not null default 0,
  source text not null default 'manual' check (source in ('apple_watch','cult','manual')),
  external_id text,          -- Apple Health workout id, used to avoid duplicates on re-sync
  started_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);
create index on public.workouts (user_id, day);

-- ---------- one row per user per day ----------
create table public.day_logs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  water_ml int not null default 0,
  sleep_hours numeric,
  bed_time time,
  wake_time time,
  weight numeric,
  active_kcal numeric,       -- from Apple Watch (Active Energy)
  steps int,
  closed boolean not null default false,
  rest boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- ---------- lists (routines, packing lists, notes) ----------
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'note' check (kind in ('note','routine')),
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  list_id uuid not null references public.lists(id) on delete cascade,
  text text not null,
  checked boolean not null default false,  -- used by note lists (e.g. packing)
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.list_items (list_id);

-- ---------- tasks & daily score ----------
-- type: check | number | auto | checklist
-- auto_key (for type auto): workout | protein | water | sleep | closed | deficit
-- weight: how many points the task is worth in the day score
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('check','number','auto','checklist')),
  auto_key text check (auto_key in ('workout','protein','water','sleep','closed','deficit')),
  target numeric,
  unit text,
  list_id uuid references public.lists(id) on delete set null,
  weight int not null default 1 check (weight between 1 and 10),
  days int[] not null default '{0,1,2,3,4,5,6}',
  sort int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.task_logs (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  task_id uuid not null references public.tasks(id) on delete cascade,
  done boolean not null default false,
  value numeric,                          -- for number tasks
  items uuid[] not null default '{}',     -- checked list_item ids for checklist tasks
  updated_at timestamptz not null default now(),
  primary key (user_id, day, task_id)
);

-- ---------- body ----------
create table public.body_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  source text,
  weight numeric, pbf numeric, fat_mass numeric, smm numeric,
  visceral numeric, whr numeric, bmr numeric, score numeric,
  seg jsonb,   -- segmental fat: {la, ra, tr, ll, rl}
  created_at timestamptz not null default now()
);
create table public.blood_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date date not null,
  name text not null,
  value numeric not null,
  unit text,
  created_at timestamptz not null default now()
);

-- ---------- nudges & push ----------
-- kind: sleep | weight | water | routine | close_day
create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('sleep','weight','water','routine','close_day')),
  at_time time not null,
  enabled boolean not null default true,
  days int[] not null default '{0,1,2,3,4,5,6}',
  created_at timestamptz not null default now()
);
create table public.nudge_sends (
  nudge_id uuid not null references public.nudges(id) on delete cascade,
  day date not null,
  sent_at timestamptz not null default now(),
  primary key (nudge_id, day)
);
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ---------- personal API token for the Apple Health Shortcut ----------
create table public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  token_hash text not null unique,  -- sha256 hex of the token; the token itself is never stored
  label text,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- product analytics ----------
create table public.events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  props jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.events (user_id, created_at);

-- ---------- Row Level Security: owner-only on every table ----------
do $$
declare t text;
begin
  foreach t in array array['foods','food_logs','workout_types','workouts','day_logs','lists','list_items',
    'tasks','task_logs','body_scans','blood_results','nudges','push_subscriptions','api_tokens','events']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- nudge_sends is written only by the send-nudges function (service role); no client access
alter table public.nudge_sends enable row level security;

-- ---------- invite-only sign-up ----------
-- Add emails here (SQL editor) to restrict who can create an account.
-- While this table is empty, anyone with the link can sign up.
create table public.allowed_emails (email text primary key);
alter table public.allowed_emails enable row level security;  -- no policies: managed from the SQL editor only

create or replace function public.check_allowed_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from allowed_emails)
     and not exists (select 1 from allowed_emails where lower(email) = lower(new.email)) then
    raise exception 'This email has not been invited to Daily Hundred';
  end if;
  return new;
end $$;

create trigger before_auth_user_created
  before insert on auth.users
  for each row execute function public.check_allowed_email();

-- ---------- defaults for every new user ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := new.id;
  routine_id uuid;
  packing_id uuid;
begin
  insert into profiles (id, name) values (uid, split_part(new.email, '@', 1));

  insert into foods (user_id, name, serving, kcal, protein) values
    (uid,'Roti (phulka)','1 pc',85,3),
    (uid,'Steamed rice','1 katori (150 g)',195,4),
    (uid,'Dal (toor / moong)','1 katori',150,9),
    (uid,'Rajma','1 katori',210,11),
    (uid,'Chole','1 katori',230,10),
    (uid,'Paneer sabzi','1 katori',280,14),
    (uid,'Mixed veg sabzi','1 katori',120,3),
    (uid,'Curd','1 katori (150 g)',90,5),
    (uid,'Milk (toned)','1 glass (250 ml)',150,8),
    (uid,'Boiled egg','1 egg',75,6),
    (uid,'Poha','1 plate',250,5),
    (uid,'Upma','1 plate',240,6),
    (uid,'Besan chilla','1 pc',120,6),
    (uid,'Chicken curry','1 katori',260,24),
    (uid,'Whey protein','1 scoop (30 g)',120,24),
    (uid,'Banana','1 medium',105,1),
    (uid,'Sprouts salad','1 bowl',110,7),
    (uid,'Masala chai (with sugar)','1 cup',90,3),
    (uid,'Mixed nuts','30 g',180,5);

  insert into workout_types (user_id, name, area, kcal_per_min) values
    (uid,'Cult Strength','Full body',7),
    (uid,'Cult HRX','Full body',9),
    (uid,'Upper body strength','Upper body',6),
    (uid,'Leg day','Lower body',7),
    (uid,'Outdoor walk','Cardio',5),
    (uid,'Run','Cardio',11),
    (uid,'Yoga','Mobility',4);

  insert into lists (user_id, title, kind, sort) values (uid,'Morning routine','routine',0) returning id into routine_id;
  insert into list_items (user_id, list_id, text, sort) values
    (uid,routine_id,'500 ml water',0),(uid,routine_id,'10 min stretching',1),
    (uid,routine_id,'Supplements',2),(uid,routine_id,'Plan the day',3),(uid,routine_id,'No phone for 30 min',4);
  insert into lists (user_id, title, kind, sort) values (uid,'Jaipur packing','note',1) returning id into packing_id;
  insert into list_items (user_id, list_id, text, sort) values
    (uid,packing_id,'Chargers',0),(uid,packing_id,'Gym clothes',1),(uid,packing_id,'Whey sachets',2),(uid,packing_id,'Toiletries',3);

  insert into tasks (user_id, name, type, auto_key, target, unit, list_id, weight, days, sort) values
    (uid,'Morning routine','checklist',null,null,null,routine_id,2,'{0,1,2,3,4,5,6}',0),
    (uid,'Workout','auto','workout',null,null,null,3,'{1,2,3,4,5,6}',1),
    (uid,'Hit protein target','auto','protein',null,null,null,2,'{0,1,2,3,4,5,6}',2),
    (uid,'Drink water target','auto','water',null,null,null,1,'{0,1,2,3,4,5,6}',3),
    (uid,'Read','number',null,25,'pages',null,1,'{0,1,2,3,4,5,6}',4),
    (uid,'Sleep target','auto','sleep',null,null,null,1,'{0,1,2,3,4,5,6}',5),
    (uid,'Log all meals and close the day','auto','closed',null,null,null,1,'{0,1,2,3,4,5,6}',6);

  insert into nudges (user_id, kind, at_time) values
    (uid,'sleep','07:30'),(uid,'weight','08:00'),(uid,'routine','09:30'),
    (uid,'water','12:00'),(uid,'water','16:00'),(uid,'water','19:00'),(uid,'close_day','21:30');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Daily Hundred: one-time to-dos (laundry, chores) that roll over.
-- A to-do belongs to one day (on_day). If it isn't done when the day closes (or the date changes),
-- a copy is created for the next day; carried_from points to the one it came from.
alter table public.tasks drop constraint if exists tasks_type_check;
alter table public.tasks add constraint tasks_type_check check (type in ('check','number','auto','checklist','avoid','todo'));
alter table public.tasks add column if not exists on_day date;
alter table public.tasks add column if not exists carried_from uuid references public.tasks(id) on delete set null;
create index if not exists tasks_on_day on public.tasks (user_id, on_day) where type = 'todo';
create unique index if not exists tasks_carry_once on public.tasks (carried_from) where carried_from is not null;

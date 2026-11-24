-- 0012: steps as an auto habit (from Apple Watch sync), sleep score, and Sumit's new habits. Safe to run again.
alter table public.tasks drop constraint if exists tasks_auto_key_check;
alter table public.tasks add constraint tasks_auto_key_check
  check (auto_key in ('workout','protein','water','sleep','closed','deficit','calories','burn','steps'));
alter table public.day_logs add column if not exists sleep_score int check (sleep_score between 0 and 100);

-- Sumit: 10,000 steps + apply to 20 jobs, steps target 10,000
insert into public.tasks (user_id, name, type, auto_key, target, unit, weight, days, sort, image_url)
select u.id, x.name, x.type, x.auto_key, x.target, x.unit, 1, '{0,1,2,3,4,5,6}', x.sort, x.img
from auth.users u, (values
  ('10,000 steps', 'auto', 'steps', null::numeric, null, 40, '/art/steps.svg'),
  ('Apply to 20 jobs', 'number', null, 20, 'jobs', 41, '/art/jobs.svg')
) as x(name, type, auto_key, target, unit, sort, img)
where u.email = 'sumit.sharma.na08@gmail.com'
  and not exists (select 1 from public.tasks t where t.user_id = u.id and not t.archived
                  and (t.auto_key = x.auto_key or lower(t.name) = lower(x.name)));
update public.profiles set targets = targets || '{"steps":10000}'::jsonb
where id = (select id from auth.users where email = 'sumit.sharma.na08@gmail.com');

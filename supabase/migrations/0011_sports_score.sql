-- 0011: sports workouts, calories out of the score, stick-figure pictures for workout types.
-- Safe to run more than once.

-- 1. New workout types for everyone who doesn't have them yet
insert into public.workout_types (user_id, name, area, kcal_per_min, image_url)
select p.id, x.name, x.area, x.kpm, x.img
from public.profiles p
cross join (values
  ('Badminton', 'Sport', 7.0, '/ex/badminton.svg'),
  ('Cricket', 'Sport', 5.0, '/ex/cricket.svg'),
  ('Treadmill', 'Cardio', 9.5, '/ex/jog.svg'),
  ('Incline walk', 'Cardio', 8.0, '/ex/incline.svg'),
  ('Functional strength', 'Full body', 7.0, '/ex/kb-swing.svg')
) as x(name, area, kpm, img)
where not exists (select 1 from public.workout_types w where w.user_id = p.id and lower(w.name) = lower(x.name));

-- 2. Calories and deficit stay on screen but no longer count towards the day score.
--    (The app ignores them in the score anyway; this hides the old tasks from lists.)
update public.tasks set archived = true where type = 'auto' and auto_key in ('calories', 'deficit') and not archived;

-- 3. New sign-ups also get the sports types
create or replace function public.seed_sport_types() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into workout_types (user_id, name, area, kcal_per_min, image_url)
  select new.id, x.name, x.area, x.kpm, x.img
  from (values ('Badminton','Sport',7.0,'/ex/badminton.svg'), ('Cricket','Sport',5.0,'/ex/cricket.svg'),
               ('Treadmill','Cardio',9.5,'/ex/jog.svg'), ('Incline walk','Cardio',8.0,'/ex/incline.svg')) as x(name, area, kpm, img)
  where not exists (select 1 from workout_types w where w.user_id = new.id and lower(w.name) = lower(x.name));
  update tasks set archived = true where user_id = new.id and type = 'auto' and auto_key in ('calories', 'deficit');
  return new;
end $$;
drop trigger if exists seed_sport_types on public.profiles;
create trigger seed_sport_types after insert on public.profiles for each row execute function public.seed_sport_types();

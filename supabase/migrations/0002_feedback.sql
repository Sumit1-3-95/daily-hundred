-- Daily Hundred: round-2 feedback
-- Run once in the Supabase SQL editor, after 0001_init.sql.
-- 1) quick-pick meals with icons  2) home metrics + focus habit  3) new automatic tasks
-- 4) protein target 100 g  5) ask for a real name instead of the email prefix

-- ---------- schema ----------
alter table public.foods add column if not exists quick boolean not null default false;
alter table public.foods add column if not exists icon text;
alter table public.profiles add column if not exists prefs jsonb not null default '{}'::jsonb;

alter table public.tasks drop constraint if exists tasks_auto_key_check;
alter table public.tasks add constraint tasks_auto_key_check
  check (auto_key in ('workout','protein','water','sleep','closed','deficit','calories','burn'));

-- ---------- default regulars for one user ----------
create or replace function public.seed_regular_foods(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into foods (user_id, name, serving, kcal, protein, quick, icon) values
    (uid,'Roti sabzi curd','2 roti + 1 katori sabzi + curd',380,14,true,'thali'),
    (uid,'Dal chawal curd','1 katori dal + rice + curd',440,18,true,'dalchawal'),
    (uid,'Aloo tikki salad','2 tikki + salad',350,7,true,'tikki'),
    (uid,'Paneer salad','100 g paneer + veggies',330,20,true,'paneer'),
    (uid,'Sub-style sandwich','6-inch, veg or paneer',380,16,true,'sandwich'),
    (uid,'Daliya','1 bowl',220,7,true,'daliya'),
    (uid,'Protein shake','1 scoop whey in water',130,25,true,'shake'),
    (uid,'Soya dish','1 katori (50 g dry chunks)',250,25,true,'soya'),
    (uid,'Indian sweet','1 piece',150,2,true,'sweet'),
    (uid,'Masala chai','1 cup with sugar',90,3,true,'chai'),
    (uid,'Extra roti','1 roti',85,3,false,'roti'),
    (uid,'Rice','1 katori',195,4,false,'dalchawal'),
    (uid,'Curd','1 katori',90,5,false,'curd'),
    (uid,'Boiled egg','1 egg',75,6,false,'egg'),
    (uid,'Milk','1 glass',150,8,false,'milk'),
    (uid,'Fruit','1 medium (banana, apple)',100,1,false,'fruit');
end $$;

-- ---------- defaults for new users ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := new.id;
  routine_id uuid;
  packing_id uuid;
begin
  insert into profiles (id, name, targets, prefs) values (uid, null,
    '{"bmr":1605,"deficit":500,"workoutMin":45,"protein":100,"kcal":2000,"water":3000,"sleep":8,"activeKcal":400,"steps":8000,"goalWeight":71.5,"startWeight":77.1}',
    jsonb_build_object('home_metrics', '["water","protein","eaten","burned","weight","sleep"]'::jsonb,
                       'focus', jsonb_build_object('metric','water','days',7,'start', to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-DD'))));

  perform seed_regular_foods(uid);

  insert into workout_types (user_id, name, area, kcal_per_min) values
    (uid,'Cult Strength','Full body',7),(uid,'Cult HRX','Full body',9),(uid,'Upper body strength','Upper body',6),
    (uid,'Leg day','Lower body',7),(uid,'Outdoor walk','Cardio',5),(uid,'Run','Cardio',11),(uid,'Yoga','Mobility',4);

  insert into lists (user_id, title, kind, sort) values (uid,'Morning routine','routine',0) returning id into routine_id;
  insert into list_items (user_id, list_id, text, sort) values
    (uid,routine_id,'500 ml water',0),(uid,routine_id,'10 min stretching',1),
    (uid,routine_id,'Supplements',2),(uid,routine_id,'Plan the day',3),(uid,routine_id,'No phone for 30 min',4);
  insert into lists (user_id, title, kind, sort) values (uid,'Jaipur packing','note',1) returning id into packing_id;
  insert into list_items (user_id, list_id, text, sort) values
    (uid,packing_id,'Chargers',0),(uid,packing_id,'Gym clothes',1),(uid,packing_id,'Whey sachets',2),(uid,packing_id,'Toiletries',3);

  insert into tasks (user_id, name, type, auto_key, target, unit, list_id, weight, days, sort) values
    (uid,'Morning routine','checklist',null,null,null,routine_id,2,'{0,1,2,3,4,5,6}',0),
    (uid,'Water','auto','water',null,null,null,2,'{0,1,2,3,4,5,6}',1),
    (uid,'Protein','auto','protein',null,null,null,2,'{0,1,2,3,4,5,6}',2),
    (uid,'Workout','auto','workout',null,null,null,3,'{1,2,3,4,5,6}',3),
    (uid,'Active burn','auto','burn',null,null,null,1,'{0,1,2,3,4,5,6}',4),
    (uid,'Calories','auto','calories',null,null,null,1,'{0,1,2,3,4,5,6}',5),
    (uid,'Deficit','auto','deficit',null,null,null,2,'{0,1,2,3,4,5,6}',6),
    (uid,'Read','number',null,25,'pages',null,1,'{0,1,2,3,4,5,6}',7),
    (uid,'Sleep','auto','sleep',null,null,null,1,'{0,1,2,3,4,5,6}',8),
    (uid,'Close the day','auto','closed',null,null,null,1,'{0,1,2,3,4,5,6}',9);

  insert into nudges (user_id, kind, at_time) values
    (uid,'sleep','07:30'),(uid,'weight','08:00'),(uid,'routine','09:30'),
    (uid,'water','11:00'),(uid,'water','14:00'),(uid,'water','17:00'),(uid,'water','20:00'),(uid,'close_day','22:00');
  return new;
end $$;

-- ---------- update existing accounts ----------
do $$
declare p record;
begin
  for p in select pr.id, u.email from profiles pr join auth.users u on u.id = pr.id loop
    -- swap the old long food list for the regulars (old logs keep working)
    if not exists (select 1 from foods where user_id = p.id and quick) then
      update foods set archived = true where user_id = p.id;
      perform seed_regular_foods(p.id);
    end if;

    -- new automatic tasks, if missing
    insert into tasks (user_id, name, type, auto_key, weight, days, sort)
    select p.id, x.name, 'auto', x.k, x.w, '{0,1,2,3,4,5,6}', x.s
    from (values ('Active burn','burn',1,20),('Calories','calories',1,21),('Deficit','deficit',2,22)) as x(name,k,w,s)
    where not exists (select 1 from tasks t where t.user_id = p.id and t.auto_key = x.k and not t.archived);
    update tasks set weight = 2 where user_id = p.id and auto_key = 'water' and weight = 1;
  end loop;
end $$;

update profiles set
  targets = targets || '{"protein":100,"activeKcal":400,"steps":8000}'::jsonb,
  prefs = case when prefs ? 'home_metrics' then prefs else prefs || jsonb_build_object(
    'home_metrics', '["water","protein","eaten","burned","weight","sleep"]'::jsonb,
    'focus', jsonb_build_object('metric','water','days',7,'start', to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-DD'))) end;

-- the app asks for a name when it's empty; clear names that are just the email prefix
update profiles pr set name = null from auth.users u
where u.id = pr.id and pr.name = split_part(u.email, '@', 1);

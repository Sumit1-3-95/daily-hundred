-- Daily Hundred: round 5
-- 1) dish pictures, new regulars (poha, coffee, chicken salad, protein bar, chicken sandwich), single items retired
-- 2) default meals: food logged automatically when a meal time passes (marked is_default)
-- 3) "avoid" tasks (alcohol, smoking) that take points off the day score

alter table public.tasks drop constraint if exists tasks_type_check;
alter table public.tasks add constraint tasks_type_check check (type in ('check','number','auto','checklist','avoid'));

alter table public.day_logs add column if not exists autofilled text[] not null default '{}';
alter table public.food_logs add column if not exists is_default boolean not null default false;

-- ---------- foods ----------
create or replace function public.seed_regular_foods(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into foods (user_id, name, serving, kcal, protein, quick, icon, meals, image_url) values
    (uid,'Poha','1 plate',250,5,true,'bowl','{Breakfast}','/food/poha.svg'),
    (uid,'Coffee','1 cup with milk',70,3,true,'chai','{Breakfast,Snack}','/food/coffee.svg'),
    (uid,'Protein shake','1 scoop whey in water',130,25,true,'shake','{Breakfast,Snack}','/food/shake.svg'),
    (uid,'Masala chai','1 cup with sugar',90,3,true,'chai','{Breakfast,Snack}','/food/chai.svg'),
    (uid,'Protein bar','1 bar (60 g)',210,20,true,'bolt','{Snack}','/food/proteinbar.svg'),
    (uid,'Chicken salad','1 bowl, grilled chicken',350,35,true,'salad','{Lunch,Dinner}','/food/chickensalad.svg'),
    (uid,'Chicken sandwich (Sub)','6-inch',400,28,true,'sandwich','{Lunch,Dinner,Snack}','/food/chickensandwich.svg'),
    (uid,'Paneer sandwich (Sub)','6-inch',380,16,true,'sandwich','{Lunch,Dinner,Snack}','/food/sandwich.svg'),
    (uid,'Roti sabzi curd','2 roti + 1 katori sabzi + curd',380,14,true,'thali','{Lunch,Dinner}','/food/thali.svg'),
    (uid,'Dal chawal curd','1 katori dal + rice + curd',440,18,true,'dalchawal','{Lunch,Dinner}','/food/dalchawal.svg'),
    (uid,'Paneer salad','100 g paneer + veggies',330,20,true,'paneer','{Lunch,Dinner}','/food/paneersalad.svg'),
    (uid,'Soya dish','1 katori (50 g dry chunks)',250,25,true,'soya','{Lunch,Dinner}','/food/soya.svg'),
    (uid,'Aloo tikki salad','2 tikki + salad',350,7,true,'tikki','{Breakfast,Snack}','/food/tikki.svg'),
    (uid,'Daliya','1 bowl',220,7,true,'daliya','{Breakfast}','/food/daliya.svg'),
    (uid,'Indian sweet','1 piece',150,2,true,'sweet','{Lunch,Snack,Dinner}','/food/sweet.svg');
end $$;

-- ---------- avoid tasks for a user ----------
create or replace function public.seed_avoid_tasks(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into tasks (user_id, name, type, weight, unit, icon, days, sort)
  select uid, x.name, 'avoid', x.w, x.unit, x.icon, '{0,1,2,3,4,5,6}', x.s
  from (values ('Alcohol',3,'drinks','drink',90),('Smoking',3,'cigarettes','smoke',91)) as x(name,w,unit,icon,s)
  where not exists (select 1 from tasks t where t.user_id = uid and t.type = 'avoid' and t.name = x.name and not t.archived);
end $$;

-- new users get avoid tasks (profiles row is created by handle_new_user)
create or replace function public.after_profile_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform seed_avoid_tasks(new.id); return new; end $$;
drop trigger if exists profile_avoid_tasks on public.profiles;
create trigger profile_avoid_tasks after insert on public.profiles for each row execute function public.after_profile_created();

-- ---------- existing accounts ----------
do $$
declare p record;
begin
  for p in select id from profiles loop
    -- retire single items, keep combos
    update foods set archived = true
    where user_id = p.id and name in ('Extra roti','Rice','Curd','Boiled egg','Milk','Fruit');
    update foods set name = 'Paneer sandwich (Sub)', image_url = '/food/sandwich.svg'
    where user_id = p.id and name = 'Sub-style sandwich';

    -- add the new regulars if missing
    insert into foods (user_id, name, serving, kcal, protein, quick, icon, meals, image_url)
    select p.id, x.name, x.serving, x.kcal, x.protein, true, x.icon, x.meals::text[], x.img
    from (values
      ('Poha','1 plate',250,5,'bowl','{Breakfast}','/food/poha.svg'),
      ('Coffee','1 cup with milk',70,3,'chai','{Breakfast,Snack}','/food/coffee.svg'),
      ('Protein bar','1 bar (60 g)',210,20,'bolt','{Snack}','/food/proteinbar.svg'),
      ('Chicken salad','1 bowl, grilled chicken',350,35,'salad','{Lunch,Dinner}','/food/chickensalad.svg'),
      ('Chicken sandwich (Sub)','6-inch',400,28,'sandwich','{Lunch,Dinner,Snack}','/food/chickensandwich.svg')
    ) as x(name,serving,kcal,protein,icon,meals,img)
    where not exists (select 1 from foods f where f.user_id = p.id and f.name = x.name and not f.archived);

    perform seed_avoid_tasks(p.id);
  end loop;
end $$;

-- pictures for the existing regulars
update foods set image_url = case name
  when 'Roti sabzi curd' then '/food/thali.svg'   when 'Dal chawal curd' then '/food/dalchawal.svg'
  when 'Aloo tikki salad' then '/food/tikki.svg'  when 'Paneer salad' then '/food/paneersalad.svg'
  when 'Daliya' then '/food/daliya.svg'           when 'Protein shake' then '/food/shake.svg'
  when 'Soya dish' then '/food/soya.svg'          when 'Indian sweet' then '/food/sweet.svg'
  when 'Masala chai' then '/food/chai.svg'        else image_url end
where image_url is null;
update foods set meals = '{Lunch,Dinner,Snack}' where name = 'Paneer sandwich (Sub)' and meals <> '{Lunch,Dinner,Snack}';

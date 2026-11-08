-- Daily Hundred: round 3
-- Foods belong to meals (breakfast / lunch / snack / dinner) and can have a photo later.
-- Tasks get an icon.

alter table public.foods add column if not exists meals text[] not null default '{}';
alter table public.foods add column if not exists image_url text;
alter table public.tasks add column if not exists icon text;

-- meal categories for the regulars (empty = shows under every meal)
update foods set meals = case icon
  when 'daliya'    then '{Breakfast}'
  when 'sandwich'  then '{Breakfast,Lunch,Snack}'
  when 'tikki'     then '{Breakfast,Snack}'
  when 'chai'      then '{Breakfast,Snack}'
  when 'shake'     then '{Breakfast,Snack}'
  when 'egg'       then '{Breakfast}'
  when 'milk'      then '{Breakfast,Dinner}'
  when 'thali'     then '{Lunch,Dinner}'
  when 'dalchawal' then '{Lunch,Dinner}'
  when 'paneer'    then '{Lunch,Dinner}'
  when 'soya'      then '{Lunch,Dinner}'
  when 'roti'      then '{Lunch,Dinner}'
  when 'curd'      then '{Lunch,Dinner}'
  when 'sweet'     then '{Lunch,Snack,Dinner}'
  when 'fruit'     then '{Breakfast,Snack}'
  else meals end
where meals = '{}';

-- icons for the default tasks
update tasks set icon = case
  when type = 'checklist' then 'sun'
  when auto_key = 'water' then 'water'
  when auto_key = 'protein' then 'bolt'
  when auto_key = 'workout' then 'dumbbell'
  when auto_key = 'burn' then 'fire'
  when auto_key = 'calories' then 'calories'
  when auto_key = 'deficit' then 'target'
  when auto_key = 'sleep' then 'moon'
  when auto_key = 'closed' then 'flag'
  when name ilike '%read%' then 'book'
  else 'check' end
where icon is null;

-- new users: same categories (seed function re-created with meals)
create or replace function public.seed_regular_foods(uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into foods (user_id, name, serving, kcal, protein, quick, icon, meals) values
    (uid,'Roti sabzi curd','2 roti + 1 katori sabzi + curd',380,14,true,'thali','{Lunch,Dinner}'),
    (uid,'Dal chawal curd','1 katori dal + rice + curd',440,18,true,'dalchawal','{Lunch,Dinner}'),
    (uid,'Aloo tikki salad','2 tikki + salad',350,7,true,'tikki','{Breakfast,Snack}'),
    (uid,'Paneer salad','100 g paneer + veggies',330,20,true,'paneer','{Lunch,Dinner}'),
    (uid,'Sub-style sandwich','6-inch, veg or paneer',380,16,true,'sandwich','{Breakfast,Lunch,Snack}'),
    (uid,'Daliya','1 bowl',220,7,true,'daliya','{Breakfast}'),
    (uid,'Protein shake','1 scoop whey in water',130,25,true,'shake','{Breakfast,Snack}'),
    (uid,'Soya dish','1 katori (50 g dry chunks)',250,25,true,'soya','{Lunch,Dinner}'),
    (uid,'Indian sweet','1 piece',150,2,true,'sweet','{Lunch,Snack,Dinner}'),
    (uid,'Masala chai','1 cup with sugar',90,3,true,'chai','{Breakfast,Snack}'),
    (uid,'Extra roti','1 roti',85,3,false,'roti','{Lunch,Dinner}'),
    (uid,'Rice','1 katori',195,4,false,'dalchawal','{Lunch,Dinner}'),
    (uid,'Curd','1 katori',90,5,false,'curd','{Lunch,Dinner}'),
    (uid,'Boiled egg','1 egg',75,6,false,'egg','{Breakfast}'),
    (uid,'Milk','1 glass',150,8,false,'milk','{Breakfast,Dinner}'),
    (uid,'Fruit','1 medium (banana, apple)',100,1,false,'fruit','{Breakfast,Snack}');
end $$;

-- new users' tasks get icons too
create or replace function public.set_task_icon()
returns trigger language plpgsql as $$
begin
  if new.icon is null then
    new.icon := case
      when new.type = 'checklist' then 'sun'
      when new.auto_key = 'water' then 'water' when new.auto_key = 'protein' then 'bolt'
      when new.auto_key = 'workout' then 'dumbbell' when new.auto_key = 'burn' then 'fire'
      when new.auto_key = 'calories' then 'calories' when new.auto_key = 'deficit' then 'target'
      when new.auto_key = 'sleep' then 'moon' when new.auto_key = 'closed' then 'flag'
      when new.name ilike '%read%' then 'book' else 'check' end;
  end if;
  return new;
end $$;
drop trigger if exists tasks_icon on public.tasks;
create trigger tasks_icon before insert on public.tasks for each row execute function public.set_task_icon();

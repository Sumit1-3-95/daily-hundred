-- 24 Nov: simpler habits + protein-only tracking for Sumit. Safe to run again.
with me as (select id from auth.users where email = 'sumit.sharma.na08@gmail.com')

-- 1. Drop the morning and night routines from the daily habits
, a as (update public.tasks set archived = true
        where user_id in (select id from me) and name in ('Morning routine', 'Night routine', 'Night time routine') and not archived returning 1)

-- 2. Every habit counts the same (score = habits done / habits)
, w as (update public.tasks set weight = 1
        where user_id in (select id from me) and type in ('check', 'number', 'auto', 'checklist') and not archived returning 1)

-- 3. Protein: 100 g a day, regular meals assumed to give 40 g, you log the other 60 g
, p as (update public.profiles set targets = targets || '{"protein":100,"proteinBase":40,"proteinSince":"2026-11-24"}'::jsonb
        where id in (select id from me) returning 1)

-- 4. Mark the protein add-ons
, c as (update public.foods set category = 'protein', quick = true
        where user_id in (select id from me) and not archived
          and name in ('Protein shake', 'Boiled eggs ×4', 'Soya dish', 'Paneer toast', 'Protein bar', 'Paneer salad', 'Chicken salad') returning 1)
select (select count(*) from a) as routines_removed, (select count(*) from w) as habits, (select count(*) from p) as targets, (select count(*) from c) as protein_foods;

-- 5. A few more protein add-ons
insert into public.foods (user_id, name, serving, kcal, protein, quick, icon, meals, category)
select u.id, x.name, x.serving, x.kcal, x.protein, true, x.icon, '{Breakfast,Lunch,Snack,Dinner}', 'protein'
from auth.users u, (values
  ('Greek yogurt', '1 cup (150 g)', 130, 15, 'curd'),
  ('Boiled eggs ×2', '2 boiled eggs', 155, 12, 'egg'),
  ('Paneer 100 g', '100 g, cubes or bhurji', 265, 18, 'paneer'),
  ('Chicken breast', '150 g cooked', 250, 45, 'bowl'),
  ('Milk', '1 glass (250 ml)', 150, 8, 'milk'),
  ('Sprouts chaat', '1 bowl', 150, 10, 'salad')
) as x(name, serving, kcal, protein, icon)
where u.email = 'sumit.sharma.na08@gmail.com'
  and not exists (select 1 from public.foods f where f.user_id = u.id and f.name = x.name and not f.archived);

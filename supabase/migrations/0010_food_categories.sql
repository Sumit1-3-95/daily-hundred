-- Daily Hundred: food categories (drinks, street food) and new foods with pictures.
alter table public.foods add column if not exists category text;  -- null = regular meal, 'drink', 'street'

update public.foods set category = 'drink'
where category is null and name in ('Coffee', 'Masala chai', 'Protein shake');

insert into public.foods (user_id, name, serving, kcal, protein, quick, icon, meals, image_url, category)
select p.id, x.name, x.serving, x.kcal, x.protein, true, x.icon, x.meals::text[], x.img, x.cat
from public.profiles p, (values
  ('Paneer toast', '2 slices high-protein bread + 100 g paneer', 400, 32, 'paneer', '{Breakfast,Snack}', '/food/paneertoast.svg', null),
  ('Boiled eggs ×4', '4 boiled eggs', 310, 25, 'egg', '{Breakfast}', '/food/eggs.svg', null),
  ('Fruit salad', '1 bowl', 150, 2, 'fruit', '{Breakfast,Snack}', '/food/fruitsalad.svg', null),
  ('Aloo tikki chaat', '1 plate', 350, 7, 'tikki', '{Snack}', '/food/tikkichaat.svg', 'street'),
  ('Pani puri', '6 puris', 220, 4, 'bowl', '{Snack}', '/food/panipuri.svg', 'street'),
  ('Namkeen', '1 small bowl (30 g)', 160, 4, 'bowl', '{Snack}', '/food/namkeen.svg', 'street'),
  ('Bhel puri', '1 plate', 280, 6, 'bowl', '{Snack}', '/food/bhelpuri.svg', 'street'),
  ('Lemonade', '1 glass nimbu pani', 90, 0, 'chai', '{Breakfast,Lunch,Snack}', '/food/lemonade.svg', 'drink'),
  ('Banana shake', '1 glass with milk', 250, 9, 'shake', '{Breakfast,Snack}', '/food/bananashake.svg', 'drink'),
  ('Buttermilk', '1 glass chaas', 60, 3, 'chai', '{Lunch,Snack,Dinner}', '/food/buttermilk.svg', 'drink')
) as x(name, serving, kcal, protein, icon, meals, img, cat)
where not exists (select 1 from public.foods f where f.user_id = p.id and f.name = x.name and not f.archived);

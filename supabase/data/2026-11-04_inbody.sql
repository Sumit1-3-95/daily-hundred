-- InBody 260 at Cult, 4 Nov 2026, 08:12 — Sumit
-- Run in the Supabase SQL editor. Safe to run twice (skips if already there).
insert into body_scans (user_id, date, source, weight, pbf, fat_mass, smm, visceral, whr, bmr, score, seg)
select u.id, '2026-11-04', 'InBody 260 at Cult', 77.1, 25.8, 19.9, 32.3, 8, 0.96, 1605, 71,
       '{"la":1.2,"ra":1.1,"tr":11.0,"ll":2.7,"rl":2.7}'::jsonb
from auth.users u
where u.email = 'sumit.sharma.na08@gmail.com'
  and not exists (select 1 from body_scans b where b.user_id = u.id and b.date = '2026-11-04');

-- the same morning's weight on the daily log
insert into day_logs (user_id, day, weight)
select u.id, '2026-11-04', 77.1 from auth.users u where u.email = 'sumit.sharma.na08@gmail.com'
on conflict (user_id, day) do update set weight = excluded.weight;

-- Other numbers from the report, for reference (not shown in the app yet):
-- total body water 41.9 L, protein 11.4 kg, minerals 3.89 kg, fat-free mass 57.2 kg,
-- SMI 8.0 kg/m², obesity degree 117%, recommended intake 2264 kcal,
-- lean mass: left arm 3.19, right arm 3.42, trunk 26.3, left leg 8.52, right leg 8.67 kg.

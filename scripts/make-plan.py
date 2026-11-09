# Builds Sumit's 4-week plan (9 Nov – 6 Dec 2026) as SQL + JSON.
# Week 1: home gym (45 min strength + 20 min treadmill). Weeks 2–4: Cult, Noida.
import datetime as dt, json, os

START = dt.date(2026, 11, 9)
EMAIL = 'sumit.sharma.na08@gmail.com'
ROOT = os.path.join(os.path.dirname(__file__), '..')

WARM = ('Warm-up', '5 min easy cardio + arm/hip circles')
INTERVALS = ('Treadmill intervals · 20 min', '5 min walk 5.5 km/h → 6 × (1 min jog 8.5 km/h + 1 min walk) → 3 min easy')
INCLINE = ('Incline walk · 20 min', '12% incline, 5.2 km/h, steady breathing')
STRETCH = ('Stretch', '5 min: hamstrings, hips, chest')
SHAKE = ('Protein after', 'Shake within 45 min')

UPPER = [WARM, ('Dumbbell bench press', '3 × 10'), ('Lat pulldown', '3 × 10'), ('Seated dumbbell shoulder press', '3 × 10'),
         ('Seated cable row', '3 × 12'), ('Biceps curl + triceps pushdown', '2 × 12 each, back to back'), ('Plank', '3 × 30 s')]
LOWER = [WARM, ('Goblet squat', '3 × 10'), ('Dumbbell Romanian deadlift', '3 × 10'), ('Leg press', '3 × 12'),
         ('Walking lunges', '2 × 10 each leg'), ('Lying leg curl', '2 × 12'), ('Dead bug', '3 × 10')]
CIRCUIT = [WARM, ('Circuit × 3 rounds', '15 kettlebell swings · 10 push-ups · 12 goblet squats · 30 s mountain climbers · 40 s plank, 90 s rest'),
           ('Bike', '10 min, moderate'), ('Side plank', '2 × 25 s each side')]

def gym(title, items, tread, kcal):
    return dict(kind='strength', title=title, place='GG Gym', minutes=65, kcal=kcal,
                items=items + [tread, STRETCH, SHAKE],
                logs=[dict(name=title, area='Upper body' if 'Upper' in title else 'Lower body' if 'Lower' in title else 'Full body', minutes=45, kcal=kcal - 190),
                      dict(name='Treadmill', area='Cardio', minutes=20, kcal=190)])

def cult(title, area, extra_walk, kcal, focus):
    items = [('Get there 10 min early', 'Fill water bottle, light warm-up'), (f'{title} class · 50 min', focus)]
    logs = [dict(name=title, area=area, minutes=50, kcal=kcal)]
    mins = 50
    if extra_walk:
        items.append((f'Incline walk · {extra_walk} min', '10% incline, 5.2 km/h, after class'))
        logs.append(dict(name='Incline walk', area='Cardio', minutes=extra_walk, kcal=extra_walk * 8)); mins += extra_walk
    items += [STRETCH, SHAKE]
    return dict(kind='class', title=title + (' + walk' if extra_walk else ''), place='Cult, Noida', minutes=mins,
                kcal=sum(l['kcal'] for l in logs), items=items, logs=logs)

def week_cult(w):
    walk = 10 if w == 2 else 15
    z2 = {2: 40, 3: 45, 4: 50}[w]
    return [
        cult('Cult Strength', 'Upper body', walk, 330, 'Upper-body focus. Pick weights where the last 2 reps are hard.'),
        cult('Cult HRX', 'Full body', 0, 450, 'Push the intervals, recover fully in the rests.'),
        cult('Cult Strength', 'Lower body', walk, 340, 'Lower-body focus. Slow on the way down.'),
        dict(kind='mobility', title='Cult Yoga', place='Cult, Noida', minutes=50, kcal=180,
             items=[('Yoga class · 50 min', 'Recovery day: go easy, focus on hips and back'), ('Evening walk', '20 min, easy')],
             logs=[dict(name='Cult Yoga', area='Mobility', minutes=50, kcal=180)]),
        cult('Cult HRX', 'Full body', 0, 450, 'Or a Burn class if HRX is full.'),
        dict(kind='cardio', title=f'Long easy cardio · {z2} min', place='Outdoors', minutes=z2 + 10, kcal=z2 * 7 + 40,
             items=[('Brisk walk or easy jog', f'{z2} min at a pace you can still talk'), ('Core', '10 min: dead bug, side plank, bird dog'), STRETCH],
             logs=[dict(name='Outdoor walk / jog', area='Cardio', minutes=z2, kcal=z2 * 7), dict(name='Core', area='Core', minutes=10, kcal=40)]),
        dict(kind='rest', title='Rest day', place='', minutes=0, kcal=0,
             items=[('Easy steps', '8,000 steps through the day'), ('Mobility', '10 min stretching before bed')], logs=[]),
    ]

days = [
    gym('Upper body', UPPER, INTERVALS, 470),
    gym('Lower body', LOWER, INCLINE, 480),
    gym('Full-body circuit', CIRCUIT, INTERVALS, 500),
    gym('Upper body', UPPER, INCLINE, 460),
    gym('Lower body', LOWER, INTERVALS, 490),
    dict(kind='cardio', title='Travel day · walk', place='', minutes=30, kcal=150,
         items=[('Walk', '30 min, any time today'), ('Stretch', '10 min after the drive')], logs=[dict(name='Outdoor walk', area='Cardio', minutes=30, kcal=150)]),
    dict(kind='rest', title='Rest day', place='', minutes=0, kcal=0,
         items=[('Easy steps', '8,000 steps'), ('Plan the Cult week', 'Book Mon–Fri classes in the Cult app')], logs=[]),
]
for w in (2, 3, 4):
    days += week_cult(w)
assert len(days) == 28

# InBody re-scan on Wed 2 Dec (day 23)
days[23]['items'].insert(0, ('InBody re-scan', 'Morning, before breakfast and water, at Cult'))
days[23]['note'] = '4 weeks since the last scan'

rows = []
for i, d in enumerate(days):
    day = (START + dt.timedelta(days=i)).isoformat()
    items = [dict(id=str(j + 1), name=n, detail=det) for j, (n, det) in enumerate(d['items'])]
    rows.append(dict(day=day, kind=d['kind'], title=d['title'], place=d['place'], minutes=d['minutes'], kcal=d['kcal'],
                     items=items, logs=d['logs'], note=d.get('note')))

q = lambda s: "'" + str(s).replace("'", "''") + "'" if s is not None else 'null'
values = ',\n'.join(
    f"  ({q(r['day'])}, {q(r['kind'])}, {q(r['title'])}, {q(r['place'])}, {r['minutes']}, {r['kcal']}, {q(json.dumps(r['items']))}::jsonb, {q(json.dumps(r['logs']))}::jsonb, {q(r['note'])})"
    for r in rows)
sql = f"""-- Sumit's 4-week plan: 9 Nov – 6 Dec 2026. Run after 0006_plan.sql. Safe to run again (replaces planned days, keeps done ones).
insert into plan_days (user_id, day, kind, title, place, minutes, kcal, items, logs, note)
select u.id, v.day::date, v.kind, v.title, v.place, v.minutes, v.kcal, v.items, v.logs, v.note
from auth.users u, (values
{values}
) as v(day, kind, title, place, minutes, kcal, items, logs, note)
where u.email = {q(EMAIL)}
on conflict (user_id, day) do update set kind = excluded.kind, title = excluded.title, place = excluded.place,
  minutes = excluded.minutes, kcal = excluded.kcal, items = excluded.items, logs = excluded.logs, note = excluded.note
  where plan_days.status = 'planned';
"""
os.makedirs(os.path.join(ROOT, 'supabase', 'data'), exist_ok=True)
open(os.path.join(ROOT, 'supabase', 'data', 'plan_2026-11-09.sql'), 'w').write(sql)
open(os.path.join(ROOT, 'mock', 'plan.json'), 'w').write(json.dumps(rows, indent=1))
print('plan rows:', len(rows), 'total planned min/week1:', sum(r['minutes'] for r in rows[:7]))

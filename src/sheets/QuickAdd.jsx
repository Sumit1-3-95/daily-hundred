import { useStore } from '../store.jsx';
import { MEALS, addDays, key, lastN, mealNow, parse } from '../lib/dates.js';
import { fmt } from '../components/ui.jsx';

/** Foods you log most often in the last 30 days (falls back to your library order). */
export function frequentFoods(S, today, n = 8) {
  const count = {};
  lastN(30, parse(today)).forEach((k) => (S.days[k]?.food || []).forEach((f) => { count[f.food_id] = (count[f.food_id] || 0) + 1; }));
  const live = S.foods.filter((f) => !f.archived);
  const ranked = live.filter((f) => count[f.id]).sort((a, b) => count[b.id] - count[a.id]);
  return [...ranked, ...live.filter((f) => !count[f.id])].slice(0, n);
}

function frequentWorkouts(S, today, n = 3) {
  const by = {};
  lastN(30, parse(today)).forEach((k) => (S.days[k]?.workouts || []).forEach((w) => {
    const id = w.name;
    (by[id] ||= { name: w.name, area: w.area, type_id: w.type_id, mins: [], kcals: [] });
    by[id].mins.push(Number(w.minutes)); by[id].kcals.push(Number(w.kcal));
  }));
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const ranked = Object.values(by).sort((a, b) => b.mins.length - a.mins.length).map((x) => ({ ...x, minutes: med(x.mins), kcal: med(x.kcals) }));
  if (ranked.length) return ranked.slice(0, n);
  return S.wtypes.slice(0, n).map((w) => ({ name: w.name, area: w.area, type_id: w.id, minutes: 45, kcal: Math.round(45 * w.kcal_per_min) }));
}

const ACTIONS = [
  ['logFood', 'Food', 'F', 'var(--r2)'], ['logWorkout', 'Workout', 'W', 'var(--r3)'], ['water', 'Water', 'H₂O', '#2F7FD8'],
  ['weight', 'Weight', 'kg', 'var(--ink)'], ['sleep', 'Sleep', 'Zz', 'var(--r1)'], ['task', 'Task', '✓', 'var(--muted)'],
];

export default function QuickAdd() {
  const { S, today, A, open, close } = useStore();
  const yday = key(addDays(parse(today), -1));
  const ymeals = MEALS.map((m) => {
    const rows = (S.days[yday]?.food || []).filter((f) => f.meal === m);
    const kcal = rows.reduce((a, f) => a + (S.foodsById[f.food_id]?.kcal || 0) * f.qty, 0);
    return { m, rows, kcal };
  }).filter((x) => x.rows.length);
  const meal = mealNow();
  ymeals.sort((a, b) => (b.m === meal) - (a.m === meal));
  ymeals.splice(2);
  const foods = frequentFoods(S, today, 8);
  const wks = frequentWorkouts(S, today);
  return (
    <>
      <h2>Add</h2>
      <div className="qp-h">Quick picks · tap once to log</div>
      {ymeals.length > 0 && (
        <div className="chips">{ymeals.map((x) => (
          <button key={x.m} className="chip" onClick={() => A.repeatMeal(yday, x.m, today)}>Repeat yesterday's {x.m.toLowerCase()}<b>{fmt(x.kcal)}</b></button>
        ))}</div>
      )}
      <div className="chips">{foods.map((f) => (
        <button key={f.id} className="chip" onClick={() => A.logFood(today, f.id, meal)}>+ {f.name.split(' (')[0]}<b>{fmt(f.kcal)}</b></button>
      ))}</div>
      <div className="chips">
        {[250, 500].map((ml) => <button key={ml} className="chip" onClick={() => A.addWater(today, ml)}>+ {ml} ml water</button>)}
        {wks.map((w) => (
          <button key={w.name} className="chip" onClick={async () => {
            await A.logWorkout(today, { type_id: w.type_id, name: w.name, area: w.area, minutes: w.minutes, kcal: w.kcal, source: 'manual' });
            close();
          }}>{w.name} · {fmt(w.minutes)} min</button>
        ))}
      </div>
      <p className="hint">Foods go to {meal.toLowerCase()}. Change quantities in Health → Food.</p>
      <div className="qp-h">Everything else</div>
      <div className="quick">{ACTIONS.map(([s, l, ic, col]) => (
        <button key={s} onClick={() => open(s)}><span className="ic" style={{ background: col }}>{ic}</span>{l}</button>
      ))}</div>
      <div className="btn-row">
        <button className="btn ghost sm" onClick={() => open('list')}>New list</button>
        <button className="btn ghost sm" onClick={() => open('closeDay')}>Close today</button>
      </div>
    </>
  );
}

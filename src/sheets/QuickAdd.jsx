import { useStore } from '../store.jsx';
import FoodPicker from '../components/FoodPicker.jsx';
import { WaterButtons } from '../components/Nudges.jsx';
import { IconTile } from '../components/Icons.jsx';
import { addDays, key, lastN, mealNow, parse } from '../lib/dates.js';
import { fmt } from '../components/ui.jsx';

/** Foods you log most often in the last 30 days (falls back to your quick picks). */
export function frequentFoods(S, today, n = 8) {
  const count = {};
  lastN(30, parse(today)).forEach((k) => (S.days[k]?.food || []).forEach((f) => { count[f.food_id] = (count[f.food_id] || 0) + 1; }));
  const live = S.foods.filter((f) => !f.archived);
  const ranked = live.filter((f) => count[f.id]).sort((a, b) => count[b.id] - count[a.id]);
  return [...ranked, ...live.filter((f) => !count[f.id] && f.quick)].slice(0, n);
}

const ACTIONS = [
  ['logWorkout', 'Workout', 'dumbbell'], ['weight', 'Weight', 'scale'], ['sleep', 'Wake-up', 'sun'],
  ['task', 'Task', 'check'], ['list', 'List', 'list'], ['closeDay', 'Sign off', 'moon'],
];

export default function QuickAdd() {
  const { S, today, A, open } = useStore();
  const yday = key(addDays(parse(today), -1));
  const meal = mealNow();
  const yRows = (S.days[yday]?.food || []).filter((f) => f.meal === meal);
  const yKcal = yRows.reduce((a, f) => a + (S.foodsById[f.food_id]?.kcal || 0) * f.qty, 0);
  return (
    <>
      <h2>Add</h2>
      <div className="qp-h">Water</div>
      <WaterButtons k={today} />
      <div className="row-h"><div className="qp-h">Food · tap a card to add one</div>
        {yRows.length > 0 && <button className="link" onClick={() => A.repeatMeal(yday, meal, today)}>Same {meal.toLowerCase()} as yesterday ({fmt(yKcal)} kcal)</button>}</div>
      <FoodPicker k={today} />
      <div className="qp-h">Everything else</div>
      <div className="quick">{ACTIONS.map(([s, l, ic]) => (
        <button key={s} onClick={() => open(s)}><IconTile name={ic} />{l}</button>
      ))}</div>
    </>
  );
}


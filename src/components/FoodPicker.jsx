// Food picker grouped by meal. Each food is a picture card (photo if set, otherwise a drawn icon).
// Tap a card to add one serving; the badge shows how many you've had today.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon, IconTile } from './Icons.jsx';
import { fmt } from './ui.jsx';
import { MEALS, mealNow } from '../lib/dates.js';

const MEAL_ICON = { Breakfast: 'sun', Lunch: 'thali', Snack: 'chai', Dinner: 'moon' };

export default function FoodPicker({ k }) {
  const { S, A, calc, open } = useStore();
  const [meal, setMeal] = useState(mealNow());
  const [all, setAll] = useState(false);
  const [qy, setQ] = useState('');
  const c = calc(k), t = S.targets;
  const live = S.foods.filter((f) => !f.archived);
  const forMeal = live.filter((f) => f.quick && (!f.meals?.length || f.meals.includes(meal)));
  const rest = live.filter((f) => !forMeal.includes(f) && (!qy.trim() || f.name.toLowerCase().includes(qy.trim().toLowerCase())));
  const countIn = (id) => c.d.food.filter((f) => f.food_id === id && f.meal === meal).reduce((a, f) => a + Number(f.qty), 0);
  const mealKcal = (m) => c.d.food.filter((f) => f.meal === m).reduce((a, f) => a + (S.foodsById[f.food_id]?.kcal || 0) * f.qty, 0);

  const Card = ({ f }) => {
    const n = countIn(f.id);
    return (
      <div className={`fcard${n ? ' on' : ''}`}>
        <button className="fmain" onClick={() => A.logFood(k, f.id, meal)} aria-label={`Add ${f.name} to ${meal}`}>
          <span className="fimg">{f.image_url ? <img src={f.image_url} alt="" loading="lazy" /> : <IconTile name={f.icon || 'bowl'} size="lg" />}</span>
          <span className="fname">{f.name}</span>
          <span className="fnum">{fmt(f.kcal)} kcal · {f.protein} g</span>
        </button>
        {n > 0 && <>
          <span className="fcount">{n}</span>
          <button className="fminus" onClick={() => A.removeOneFood(k, f.id, meal)} aria-label={`Remove one ${f.name}`}>−</button>
        </>}
      </div>
    );
  };

  return (
    <div className="picker">
      <div className="ptotals-line">
        <span><b>{fmt(c.eaten)}</b> / {fmt(t.kcal)} kcal</span>
        <span><b>{fmt(c.protein)}</b> / {t.protein} g protein</span>
      </div>
      <div className="mealtabs" role="tablist" aria-label="Meal">
        {MEALS.map((m) => (
          <button key={m} role="tab" aria-selected={meal === m} onClick={() => setMeal(m)}>
            <Icon name={MEAL_ICON[m]} size={18} /><span>{m}</span>{mealKcal(m) > 0 && <small>{fmt(mealKcal(m))}</small>}
          </button>
        ))}
      </div>
      <div className="fgrid">{forMeal.map((f) => <Card key={f.id} f={f} />)}</div>
      {!forMeal.length && <div className="empty">No quick picks for {meal.toLowerCase()} yet.</div>}
      <div className="btn-row">
        <button className="btn ghost sm" onClick={() => setAll((x) => !x)} aria-expanded={all}>{all ? 'Hide other foods' : 'Other foods'}</button>
        <button className="btn ghost sm" onClick={() => open('newFood', { name: qy, meal })}>+ New food</button>
      </div>
      {all && <>
        <input className="search" value={qy} onChange={(e) => setQ(e.target.value)} placeholder="Search foods" aria-label="Search foods" />
        <div className="list">{rest.map((f) => (
          <div className="li" key={f.id}><IconTile name={f.icon || 'bowl'} size="sm" />
            <div className="grow"><div className="nm">{f.name}{countIn(f.id) ? <span className="weight-tag">{countIn(f.id)}</span> : null}</div>
              <div className="mt">{f.serving} · {fmt(f.kcal)} kcal · {f.protein} g</div></div>
            <button className="add1" onClick={() => A.logFood(k, f.id, meal)} aria-label={`Add ${f.name}`}>+</button>
          </div>
        ))}{!rest.length && <div className="empty">No match.</div>}</div>
      </>}
    </div>
  );
}

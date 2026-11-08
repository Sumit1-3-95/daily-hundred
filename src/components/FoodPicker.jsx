// Tap-to-log food grid: your regular meals as picture cards with calories and protein.
// Tap a card to add one serving; the count and the day's totals update right away.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { IconTile } from './Icons.jsx';
import { MBar, fmt } from './ui.jsx';
import { MEALS, mealNow } from '../lib/dates.js';

export default function FoodPicker({ k, showTotals = true }) {
  const { S, A, calc, open } = useStore();
  const [meal, setMeal] = useState(mealNow());
  const [more, setMore] = useState(false);
  const [qy, setQ] = useState('');
  const c = calc(k), t = S.targets;
  const live = S.foods.filter((f) => !f.archived);
  const quick = live.filter((f) => f.quick);
  const others = live.filter((f) => !f.quick && (!qy.trim() || f.name.toLowerCase().includes(qy.trim().toLowerCase())));
  const count = (id) => c.d.food.filter((f) => f.food_id === id).reduce((a, f) => a + Number(f.qty), 0);

  const Card = ({ f }) => {
    const n = count(f.id);
    return (
      <div className={`fcard${n ? ' on' : ''}`}>
        <button className="fmain" onClick={() => A.logFood(k, f.id, meal)} aria-label={`Add ${f.name} to ${meal}`}>
          <IconTile name={f.icon || 'bowl'} />
          <span className="fname">{f.name}</span>
          <span className="fnum"><b>{fmt(f.kcal)}</b> kcal · <b>{f.protein}</b> g</span>
        </button>
        {n > 0 && <>
          <span className="fcount" aria-label={`${n} today`}>×{n}</span>
          <button className="fminus" onClick={() => A.removeOneFood(k, f.id, meal)} aria-label={`Remove one ${f.name}`}>−</button>
        </>}
      </div>
    );
  };

  return (
    <div className="picker">
      {showTotals && (
        <div className="ptotals">
          <div><span>Calories</span><b>{fmt(c.eaten)}</b><small>/ {fmt(t.kcal)}</small><MBar v={c.eaten / t.kcal} cls="r2" /></div>
          <div><span>Protein</span><b>{fmt(c.protein)} g</b><small>/ {t.protein} g</small><MBar v={c.protein / t.protein} cls="r3" /></div>
        </div>
      )}
      <div className="mealbar" role="group" aria-label="Meal">
        {MEALS.map((m) => <button key={m} aria-pressed={meal === m} onClick={() => setMeal(m)}>{m}</button>)}
      </div>
      <div className="fgrid">{quick.map((f) => <Card key={f.id} f={f} />)}</div>
      {!quick.length && <div className="empty">No quick picks yet. Add a food and tick “Show in quick picks”.</div>}
      <div className="btn-row">
        <button className="btn ghost sm" onClick={() => setMore((m) => !m)} aria-expanded={more}>{more ? 'Hide other foods' : `Other foods (${live.length - quick.length})`}</button>
        <button className="btn ghost sm" onClick={() => open('newFood', { name: qy })}>+ New food</button>
      </div>
      {more && (
        <>
          <div className="field"><label htmlFor="fpSearch">Search</label>
            <input id="fpSearch" value={qy} onChange={(e) => setQ(e.target.value)} placeholder="roti, egg…" autoComplete="off" /></div>
          <div className="list">{others.map((f) => (
            <div className="li" key={f.id}>
              <IconTile name={f.icon || 'bowl'} size="sm" />
              <div className="grow"><div className="nm">{f.name}{count(f.id) ? <span className="weight-tag">×{count(f.id)}</span> : null}</div>
                <div className="mt">{f.serving} · {fmt(f.kcal)} kcal · {f.protein} g</div></div>
              <button className="add1" onClick={() => A.logFood(k, f.id, meal)}>+ Add</button>
            </div>
          ))}{!others.length && <div className="empty">No match.</div>}</div>
        </>
      )}
    </div>
  );
}

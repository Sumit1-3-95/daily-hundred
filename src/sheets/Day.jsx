// A simple log of one day: score, numbers, food, workouts and tasks. Swipe through days with ‹ ›.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { MiniRings } from '../components/Rings.jsx';
import { IconTile, iconForWorkout } from '../components/Icons.jsx';
import { taskName } from '../lib/calc.js';
import { MEALS, addDays, key, parse } from '../lib/dates.js';
import { fmt } from '../components/ui.jsx';
import { taskIcon } from '../components/TaskRow.jsx';

const SRC = { apple_watch: 'Apple Watch', cult: 'Cult', manual: 'Manual' };

export default function DaySheet({ k: k0 }) {
  const { S, today, calc, A } = useStore();
  const [k, setK] = useState(k0 || today);
  const c = calc(k), t = S.targets;
  const go = (n) => { const nk = key(addDays(parse(k), n)); if (nk <= today) setK(nk); };
  const label = parse(k).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const Num = ({ ic, l, v }) => <div className="dnum"><IconTile name={ic} size="sm" /><span>{l}</span><b>{v}</b></div>;
  return (
    <>
      <div className="day-nav">
        <button onClick={() => go(-1)} aria-label="Previous day">‹</button>
        <h2>{k === today ? 'Today' : label}</h2>
        <button onClick={() => go(1)} disabled={k >= today} aria-label="Next day">›</button>
      </div>
      {!c.hasData ? <div className="empty">Nothing was logged on this day.</div> : <>
        <div className="day-top">
          <span className="day-rings"><MiniRings c={c} /></span>
          <div><b className="day-score">{Math.round(c.score * 100)}%</b><span className="sub"> day score · {c.done} of {c.total} tasks</span>
            <div className="sub">{c.closed ? 'Closed' : 'Not closed'}{c.rest ? ' · rest day' : ''}</div></div>
        </div>
        <div className="dnums">
          <Num ic="calories" l="Eaten" v={`${fmt(c.eaten)} kcal`} />
          <Num ic="bolt" l="Protein" v={`${fmt(c.protein)} g`} />
          <Num ic="target" l="Deficit" v={c.d.food.length ? `${fmt(c.closed ? c.deficit : c.shownD)}` : '—'} />
          <Num ic="water" l="Water" v={`${(c.water / 1000).toFixed(2)} L`} />
          <Num ic="moon" l="Sleep" v={c.sleep ? `${c.sleep} h` : '—'} />
          <Num ic="scale" l="Weight" v={c.weight != null ? `${c.weight.toFixed(1)} kg` : '—'} />
        </div>

        <h3 className="dh">Food</h3>
        {!c.d.food.length && <p className="hint">No food logged.</p>}
        {MEALS.map((m) => {
          const rows = c.d.food.filter((f) => f.meal === m);
          if (!rows.length) return null;
          const kc = rows.reduce((a, f) => a + (S.foodsById[f.food_id]?.kcal || 0) * f.qty, 0);
          return (
            <div key={m} className="dmeal"><div className="meal-h"><span>{m}</span><span>{fmt(kc)} kcal</span></div>
              {rows.map((f) => { const x = S.foodsById[f.food_id] || { name: 'Deleted item', kcal: 0, protein: 0 };
                return <div className="dline" key={f.id}><IconTile name={x.icon || 'bowl'} size="sm" /><span className="grow">{x.name}{Number(f.qty) !== 1 ? ` ×${Number(f.qty)}` : ''}</span><span className="sub">{fmt(x.kcal * f.qty)} · {fmt(x.protein * f.qty)} g</span></div>; })}
            </div>
          );
        })}

        <h3 className="dh">Workout</h3>
        {!c.d.workouts.length && <p className="hint">{c.rest ? 'Rest day.' : 'No workout logged.'}</p>}
        {c.d.workouts.map((w) => (
          <div className="dline" key={w.id}><IconTile name={iconForWorkout(w.area)} size="sm" />
            <span className="grow">{w.name}<span className="sub"> · {w.area} · {SRC[w.source]}</span></span>
            <span className="sub">{fmt(w.minutes)} min · {fmt(w.kcal)} kcal</span></div>
        ))}
        {c.active > c.wKcal && <p className="hint">Active energy for the day: {fmt(c.active)} kcal{c.steps != null ? ` · ${fmt(c.steps)} steps` : ''}</p>}

        <h3 className="dh">Tasks</h3>
        {c.scored.map(({ task, credit }) => (
          <div className={`dline${credit >= 0.999 ? ' ok' : ''}`} key={task.id}><IconTile name={taskIcon(task)} size="sm" tone={credit >= 0.999 ? 'teal' : 'slate'} />
            <span className="grow">{taskName(task, t)}</span><span className="sub">{credit >= 0.999 ? 'Done' : `${Math.round(credit * 100)}%`}</span></div>
        ))}
        {k !== today && !c.closed && c.d.food.length > 0 && <button className="btn ghost" onClick={() => A.closeDay(k)}>Close this day</button>}
      </>}
    </>
  );
}

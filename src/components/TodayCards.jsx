// Home "Today" sections: Workout, Tasks and Food. Each is a header, two progress bars and a strip of cards.
import { useStore } from '../store.jsx';
import { Icon, IconTile, iconForWorkout } from './Icons.jsx';
import { fmt } from './ui.jsx';
import { AUTO_SHEET, taskIcon } from './TaskRow.jsx';
import { taskName } from '../lib/calc.js';
import { MEALS } from '../lib/dates.js';

/** Two labelled bars side by side. */
function Bars({ items }) {
  return (
    <div className="bars2">{items.map(([label, val, of, unit, cls]) => (
      <div key={label} className="b2">
        <div className="b2-top"><span>{label}</span><span><b>{fmt(val)}</b> / {fmt(of)} {unit}</span></div>
        <div className={`mbar ${cls}`}><i style={{ width: `${Math.max(0, Math.min(1, val / (of || 1))) * 100}%` }} /></div>
      </div>
    ))}</div>
  );
}

export function FoodThumb({ f, size = 'sm' }) {
  return f?.image_url ? <img className={`thumb ${size}`} src={f.image_url} alt="" loading="lazy" /> : <IconTile name={f?.icon || 'bowl'} size={size} />;
}

export function WorkoutSection() {
  const { S, today, calc, open } = useStore();
  const c = calc(today), t = S.targets;
  return (
    <section className="card sec">
      <div className="row-h"><h3><Icon name="dumbbell" size={16} /> Workout</h3><button className="link" onClick={() => open('logWorkout')}>+ Log</button></div>
      <Bars items={[['Time', c.rest ? t.workoutMin : c.wMin, t.workoutMin, 'min', 'r3'], ['Calories burned', c.active, t.activeKcal, 'kcal', 'r2']]} />
      {c.rest && <p className="hint">Rest day.</p>}
      {c.d.workouts.length > 0 && (
        <div className="strip">{c.d.workouts.map((w) => (
          <button key={w.id} className="scard" onClick={() => open('day', { k: today })}>
            <span className="sc-k">{fmt(w.kcal)}<small> kcal</small></span>
            <span className="sc-name">{w.name}</span>
            <span className="sc-m">{fmt(w.minutes)} min</span>
            <span className="sc-ic"><Icon name={iconForWorkout(w.area)} size={16} /></span>
          </button>
        ))}</div>
      )}
    </section>
  );
}

/** Compact task cards: the progress number sits top-left; grey until started, bar while partial, green when done. */
export function TaskSection({ goTab }) {
  const { S, today, calc, A, open } = useStore();
  const c = calc(today), t = S.targets;
  const order = [...c.scored].sort((a, b) => (a.credit >= 0.999) - (b.credit >= 0.999));
  const act = (task) => {
    const tl = c.d.tlogs[task.id] || {};
    if (task.type === 'check') return A.setTaskLog(today, task, { done: !tl.done });
    if (task.type === 'checklist' || task.type === 'number') return open('taskOne', { id: task.id });
    const sheet = AUTO_SHEET[task.auto_key];
    if (sheet) open(sheet);
  };
  const num = (task, credit) => {
    const tl = c.d.tlogs[task.id] || {};
    if (credit >= 0.999) return <Icon name="check" size={18} />;
    if (task.type === 'number') return `${tl.value || 0}/${task.target}`;
    if (task.type === 'checklist') { const its = S.items.filter((i) => i.list_id === task.list_id); return `${Math.round(credit * its.length)}/${its.length}`; }
    if (task.type === 'check') return `+${task.weight}`;
    return `${Math.round(credit * 100)}%`;
  };
  return (
    <section className="card sec">
      <div className="row-h"><h3><Icon name="check" size={16} /> Tasks</h3>
        <span className="sub">{c.done}/{c.total} done{c.penalty ? ` · −${c.penalty} pts` : ''} · <button className="link" onClick={() => goTab('today')}>Plan</button></span></div>
      <div className="tgrid">{order.map(({ task, credit }) => {
        const st = credit >= 0.999 ? 'done' : credit > 0 ? 'part' : 'todo';
        return (
          <button key={task.id} className={`tcard ${st}`} onClick={() => act(task)}>
            <span className="tc-top"><span className="tc-num">{num(task, credit)}</span>{task.image_url ? <img className="thumb xs" src={task.image_url} alt="" /> : <Icon name={taskIcon(task)} size={16} />}</span>
            <span className="tc-name">{taskName(task, t)}</span>
            {st === 'part' && <span className="tbar"><i style={{ width: `${credit * 100}%` }} /></span>}
          </button>
        );
      })}</div>
    </section>
  );
}

export function FoodSection() {
  const { S, today, calc, open } = useStore();
  const c = calc(today), t = S.targets;
  const rows = MEALS.flatMap((m) => c.d.food.filter((f) => f.meal === m));
  return (
    <section className="card sec">
      <div className="row-h"><h3><Icon name="thali" size={16} /> Food</h3><button className="link" onClick={() => open('logFood')}>+ Add</button></div>
      <Bars items={[['Calories', c.eaten, t.kcal, 'kcal', 'r2'], ['Protein', c.protein, t.protein, 'g', 'r3']]} />
      {rows.length ? (
        <div className="strip">{rows.map((f) => {
          const x = S.foodsById[f.food_id] || { name: 'Deleted', kcal: 0 };
          return (
            <button key={f.id} className={`scard food${f.is_default ? ' dflt' : ''}`} onClick={() => open('logFood')}>
              <span className="sc-img"><FoodThumb f={x} />{Number(f.qty) > 1 && <span className="qtag">×{Number(f.qty)}</span>}</span>
              <span className="sc-k">{fmt(x.kcal * f.qty)}<small> kcal</small></span>
              <span className="sc-name">{x.name}</span>
              {f.is_default && <span className="sc-m">default</span>}
            </button>
          );
        })}</div>
      ) : <p className="hint">Nothing logged yet.</p>}
    </section>
  );
}

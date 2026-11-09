// Home "Today" sections: Workout, Tasks and Food. Each is a header, two progress bars and a strip of cards.
import { useStore } from '../store.jsx';
import { Icon, IconTile, iconForWorkout } from './Icons.jsx';
import { MBar, fmt, progState } from './ui.jsx';
import { AUTO_SHEET, taskIcon } from './TaskRow.jsx';
import { streak, taskName } from '../lib/calc.js';
import { HabitCard, TodoRow } from './Habits.jsx';
import { PlanCard } from './Plan.jsx';
import { runShortcut } from '../sheets/Settings.jsx';
import { Glass, WaterButtons } from './Nudges.jsx';
import { MEALS } from '../lib/dates.js';

/** Two labelled bars side by side. */
function Bars({ items }) {
  return (
    <div className="bars2">{items.map(([label, val, of, unit, cls]) => (
      <div key={label} className="b2">
        <div className="b2-top"><span>{label}</span><span><b>{fmt(val)}</b> / {fmt(of)} {unit}</span></div>
        <MBar v={val / (of || 1)} />
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
      <div className="row-h"><h3><Icon name="dumbbell" size={16} /> Workout <span className="pct">{Math.round((c.rest ? 1 : c.pillars.workout.score ?? 0) * 100)}%</span></h3><span className="row-acts"><button className="link" onClick={runShortcut} aria-label="Sync from Apple Watch">↻ Watch</button><button className="link" onClick={() => open('logWorkout')}>+ Log</button></span></div>
      <PlanCard k={today} compact />
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
  const order = c.scored.filter((s) => s.pillar === 'habits').sort((a, b) => (a.credit >= 0.999) - (b.credit >= 0.999));
  const H = c.pillars.habits;
  const act = (task) => {
    const tl = c.d.tlogs[task.id] || {};
    if (task.type === 'check' || task.type === 'todo') return A.setTaskLog(today, task, { done: !tl.done });
    if (task.type === 'number' && /read|book|page/i.test(task.name)) return open('books');
    if (task.type === 'checklist' || task.type === 'number') return open('taskOne', { id: task.id });
    const sheet = AUTO_SHEET[task.auto_key];
    if (sheet) open(sheet);
  };
  const num = (task, credit) => {
    const tl = c.d.tlogs[task.id] || {};
    if (credit >= 0.999) return <Icon name="check" size={18} />;
    if (task.type === 'number') return `${tl.value || 0}/${task.target}`;
    if (task.type === 'checklist') { const its = S.items.filter((i) => i.list_id === task.list_id); return `${Math.round(credit * its.length)}/${its.length}`; }
    if (task.type === 'check' || task.type === 'todo') return `+${task.weight}`;
    return `${Math.round(credit * 100)}%`;
  };
  return (
    <section className="card sec">
      <div className="row-h"><h3><Icon name="check" size={16} /> Habits <span className="pct">{Math.round((H.score ?? 0) * 100)}%</span></h3>
        <span className="sub">{H.done}/{H.total}{c.penalty ? ` · −${c.penalty} pts` : ''} · <button className="link" onClick={() => goTab('today')}>All</button></span></div>
      <div className="tgrid">{order.map(({ task, credit }) => {
        const st = credit >= 0.999 ? 'done' : credit > 0 ? 'part' : 'todo';
        return (
          <button key={task.id} className={`tcard ${st}`} onClick={() => act(task)}>
            <span className="tc-top"><span className="tc-num">{num(task, credit)}</span>{task.image_url ? <img className="thumb xs" src={task.image_url} alt="" /> : <Icon name={taskIcon(task)} size={16} />}</span>
            <span className="tc-name">{taskName(task, t)}</span>{task.type === 'todo' && <span className="tc-todo">to-do</span>}
            <span className={`tbar ${progState(credit)}`}><i style={{ width: `${credit * 100}%` }} /></span>
          </button>
        );
      })}</div>
    </section>
  );
}

export function IntakeSection() {
  const { S, today, calc, open } = useStore();
  const c = calc(today), t = S.targets;
  const rows = MEALS.flatMap((m) => c.d.food.filter((f) => f.meal === m));
  return (
    <section className="card sec intake">
      <div className="row-h"><h3><Icon name="bolt" size={16} /> Intake <span className="pct">{Math.round((c.pillars.intake.score ?? 0) * 100)}%</span></h3><button className="link" onClick={() => open('logFood')}>+ Food</button></div>
      <div className="water-row">
        <button className="focus-vis" onClick={() => open('water')} aria-label="Water"><Glass p={c.water / t.water} size={52} /></button>
        <div className="wr-b"><span className="wr-n"><b>{(c.water / 1000).toFixed(2)}</b> / {t.water / 1000} L water</span><WaterButtons k={today} compact /></div>
      </div>
      <Bars items={[['Protein', c.protein, t.protein, 'g', 'r3'], ['Calories', c.eaten, t.kcal, 'kcal', 'r2']]} />
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

/** Home habits: a ring, a nudge that changes with progress, habit cards and open to-dos. */
export function HabitsSection({ goTab }) {
  const { S, today, calc } = useStore();
  const c = calc(today), H = c.pillars.habits;
  const habits = c.scored.filter((x) => x.pillar === 'habits' && x.task.type !== 'todo');
  const todos = c.scored.filter((x) => x.task.type === 'todo' && x.credit < 0.999);
  const st = streak(S, today);
  const left = habits.filter((x) => x.credit < 0.999).length;
  const hs = H.score ?? 0;
  const msg = hs >= 0.999 ? ['Every habit done today', 'That is how streaks are built.']
    : hs >= 0.6 ? [`${left} to go. You're close`, 'Finish strong and keep the streak.']
    : hs > 0 ? [`Good start. ${left} habits left`, 'One more now makes the next one easier.']
    : ['Start with the easiest one', 'Small wins first. Tap a card when it is done.'];
  const R = 22, C = 2 * Math.PI * R;
  return (
    <section className={`card sec habits-home${hs >= 0.999 ? ' all' : ''}`}>
      <div className="hh-top">
        <span className="hh-ring"><svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true"><circle cx="26" cy="26" r={R} className="hr-trk" />
          {hs > 0 && <circle cx="26" cy="26" r={R} className={`hr-arc ${progState(hs)}`} strokeDasharray={`${(hs * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 26 26)" />}</svg>
          <b>{Math.round(hs * 100)}</b></span>
        <div className="hh-b"><b>{msg[0]}</b><span>{msg[1]}</span></div>
        {st > 0 && <span className="badge fire"><Icon name="fire" size={13} />{st}</span>}
      </div>
      <div className="hgrid">{habits.map((x) => <HabitCard key={x.task.id} k={today} task={x.task} credit={x.credit} />)}</div>
      {todos.length > 0 && <div className="todos">{todos.map((x) => <TodoRow key={x.task.id} k={today} task={x.task} credit={x.credit} />)}</div>}
      <button className="link hh-all" onClick={() => goTab('today')}>All habits and to-dos ›</button>
    </section>
  );
}

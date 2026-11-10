// Home sections, all built from the same tile and all foldable.
import { useStore } from '../store.jsx';
import { Sec, Tile, TileGrid } from './Tile.jsx';
import { Icon, iconForWorkout } from './Icons.jsx';
import { MiniRings } from './Rings.jsx';
import { Glass } from './Nudges.jsx';
import { useTaskAct } from './Habits.jsx';
import { taskIcon, autoMeta } from './TaskRow.jsx';
import { Cover } from '../sheets/Books.jsx';
import { MBar, fmt } from './ui.jsx';
import { DEFAULT_HOME, METRICS } from '../lib/metrics.js';
import { METRIC_ART, habitArt } from '../lib/art.js';
import { streak, taskName } from '../lib/calc.js';
import { DOW, MEALS, lastN, parse, short } from '../lib/dates.js';

const TONE = { water: 'blue', protein: 'teal', eaten: 'orange', burned: 'pink', deficit: 'orange', workout: 'green', weight: 'slate', sleep: 'violet', steps: 'amber' };
const TAP = { water: 'water', protein: 'logFood', eaten: 'logFood', sleep: 'sleep', workout: 'logWorkout', burned: 'logWorkout', deficit: 'closeDay' };
const TONES = ['violet', 'teal', 'amber', 'blue', 'pink', 'green', 'orange'];
const toneFor = (id = '') => TONES[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
const pct = (v) => `${Math.round(Math.max(0, v || 0) * 100)}%`;

export function WeekRings() {
  const { today, calc, open } = useStore();
  const days = lastN(7, parse(today));
  const avg = days.map(calc).filter((c) => c.hasData).reduce((a, c, _, arr) => a + c.score / arr.length, 0);
  return (
    <Sec id="week" title="Last 7 days" icon="flag" defaultOpen={false}
      summary={<span className="sub">Average day score <b>{pct(avg)}</b> · tap to see each day</span>}>
      <div className="week">{days.map((k) => (
        <button key={k} className={k === today ? 'is-today' : ''} onClick={() => open('day', { k })} aria-label={`Open ${short(k)}`}><MiniRings c={calc(k)} />{DOW[parse(k).getDay()].slice(0, 2)}</button>
      ))}</div>
    </Sec>
  );
}

export function Glance() {
  const { S, today, calc, open } = useStore();
  const c = calc(today), t = S.targets;
  const pinned = (S.profile.prefs?.home_metrics || DEFAULT_HOME).filter((m) => METRICS[m] && m !== 'weight');
  const hit = pinned.filter((m) => { const p = METRICS[m].p(c, t); return p != null && p >= 0.999; }).length;
  return (
    <Sec id="glance" title="At a glance" icon="target" badge={<span className="pct">{hit}/{pinned.length}</span>}
      right={<button className="link" onClick={() => open('metrics')}>Edit</button>}
      summary={<span className="sub">{pinned.map((m) => `${METRICS[m].label} ${METRICS[m].value(c, t)}`).join(' · ')}</span>}>
      <TileGrid>{pinned.map((m) => {
        const M = METRICS[m], p = M.p(c, t);
        return <Tile key={m} img={METRIC_ART[m]} icon={M.icon} tone={TONE[m] || 'slate'} num={M.value(c, t)} label={M.label} sub={M.sub(c, t)} p={p} onClick={() => TAP[m] && open(TAP[m])} />;
      })}</TileGrid>
    </Sec>
  );
}

/** Habits and to-dos as tiles. Finished ones drop out so only what's left shows. */
export function HabitsHome({ goTab }) {
  const { S, today, calc } = useStore();
  const act = useTaskAct(today);
  const c = calc(today), H = c.pillars.habits, t = S.targets;
  const all = c.scored.filter((x) => x.pillar === 'habits');
  const left = all.filter((x) => x.credit < 0.999);
  const st = streak(S, today);
  const hs = H.score ?? 0;
  const msg = hs >= 0.999 ? 'Every habit done. That is how streaks are built.'
    : left.length <= 2 ? `${left.length} to go. Finish strong.`
    : hs > 0 ? `Good start. ${left.length} left.` : 'Start with the easiest one.';
  const num = (task, credit) => {
    const tl = c.d.tlogs[task.id] || {};
    if (task.type === 'number') return `${tl.value || 0}/${task.target}`;
    if (task.type === 'checklist') { const n = S.items.filter((i) => i.list_id === task.list_id).length; return `${Math.round(credit * n)}/${n}`; }
    if (task.type === 'auto') return pct(credit);
    return `+${task.weight}`;
  };
  return (
    <Sec id="habits" title="Habits" icon="check" className="habits-home2"
      badge={<span className="pct">{pct(hs)}</span>}
      right={<span className="row-acts">{st > 0 && <span className="badge fire"><Icon name="fire" size={12} />{st}</span>}<button className="link" onClick={() => goTab('today')}>All</button></span>}
      summary={<span className="sub">{H.done} of {H.total} done · {msg}</span>}>
      <div className="hh-msg"><b>{msg}</b><span>{H.done} of {H.total} done{c.penalty ? ` · −${c.penalty} pts` : ''}</span></div>
      {left.length ? (
        <TileGrid>{left.map(({ task, credit }) => (
          <Tile key={task.id} img={habitArt(task)} icon={taskIcon(task)} tone={toneFor(task.id)} num={num(task, credit)}
            label={taskName(task, t)} sub={task.type === 'todo' ? 'to-do' : task.type === 'auto' ? autoMeta(task, c, t)?.split(' · ')[0] : null}
            p={credit} onClick={() => act(task)} />
        ))}</TileGrid>
      ) : <div className="all-done"><Icon name="check" size={22} /><span>All {H.total} done today</span></div>}
    </Sec>
  );
}

export function BooksHome() {
  const { S, open } = useStore();
  if (!S.books?.length) return null;
  const now = S.books.find((b) => b.status === 'reading');
  const next = S.books.filter((b) => b.status === 'next'), read = S.books.filter((b) => b.status === 'read');
  const p = now?.total_pages ? Math.min(1, now.pages_read / now.total_pages) : 0;
  return (
    <Sec id="books" title="Reading" icon="book" className="books-home"
      badge={now ? <span className="pct">{Math.round(p * 100)}%</span> : null}
      right={<button className="link" onClick={() => open('books')}>Shelf</button>}
      summary={<span className="sub">{now ? `${now.title} · ${now.pages_read}/${now.total_pages} pages` : `${read.length} books read`}</span>}>
      {now ? (
        <button className="bh-now" onClick={() => open('books', { id: now.id })}>
          <Cover book={now} size="md" />
          <span className="bh-b">
            <span className="eyebrow">Reading now</span>
            <span className="bh-t">{now.title}</span>
            <span className="nc-a">{now.author}</span>
            <MBar v={p} />
            <span className="nc-p"><b>{now.pages_read}</b> / {now.total_pages} pages · {Math.max(0, now.total_pages - now.pages_read)} to go</span>
          </span>
          <span className="bh-log">Log</span>
        </button>
      ) : <button className="btn ghost" onClick={() => open('books')}>Pick your next book</button>}
      <div className="bh-shelf">
        {[...next, ...read].slice(0, 6).map((b) => <button key={b.id} onClick={() => open('books', { id: b.id })} aria-label={b.title}><Cover book={b} size="xs2" /></button>)}
        <span className="sub">{read.length} read · {next.length} next</span>
      </div>
    </Sec>
  );
}

export function WaterHome() {
  const { S, today, calc, A } = useStore();
  const c = calc(today), t = S.targets;
  const days = lastN(7, parse(today));
  return (
    <Sec id="water" title="Water" icon="water" className="water-home"
      badge={<span className="pct">{pct(c.water / t.water)}</span>}
      summary={<span className="sub">{(c.water / 1000).toFixed(2)} / {t.water / 1000} L</span>}>
      <div className="wh-row">
        <Glass p={c.water / t.water} size={72} />
        <div className="wh-b">
          <div><b className="wh-n">{(c.water / 1000).toFixed(2)}</b> <span className="sub">of {t.water / 1000} L</span></div>
          <MBar v={c.water / t.water} />
          <div className="wh-days">{days.map((k) => { const w = calc(k).water; return <i key={k} className={w >= t.water ? 'on' : w > 0 ? 'part' : ''} title={short(k)} />; })}<span>7 days</span></div>
        </div>
        <div className="wh-btns">
          <button className="wh-add" onClick={() => A.addWater(today, 250)} aria-label="Add 250 ml"><Icon name="water" size={20} /><span>+250</span></button>
          <button className="wh-undo" onClick={() => A.addWater(today, -250)} aria-label="Undo 250 ml">Undo</button>
        </div>
      </div>
    </Sec>
  );
}

export function FoodHome() {
  const { S, today, calc, open } = useStore();
  const c = calc(today), t = S.targets;
  const rows = MEALS.flatMap((m) => c.d.food.filter((f) => f.meal === m));
  return (
    <Sec id="food" title="Food" icon="thali" badge={<span className="pct">{pct(c.pillars.intake.score)}</span>}
      right={<button className="link" onClick={() => open('logFood')}>+ Add</button>}
      summary={<span className="sub">{fmt(c.eaten)} kcal · {fmt(c.protein)} g protein · {rows.length} items</span>}>
      <div className="bars2">
        <div className="b2"><div className="b2-top"><span>Protein</span><span><b>{fmt(c.protein)}</b> / {t.protein} g</span></div><MBar v={c.protein / t.protein} /></div>
        <div className="b2"><div className="b2-top"><span>Calories</span><span><b>{fmt(c.eaten)}</b> / {fmt(t.kcal)}</span></div><MBar v={c.eaten / t.kcal} /></div>
      </div>
      {rows.length ? <TileGrid>{rows.map((f) => {
        const x = S.foodsById[f.food_id] || { name: 'Deleted', kcal: 0 };
        return <Tile key={f.id} img={x.image_url} icon={x.icon || 'bowl'} tone="orange" num={fmt(x.kcal * f.qty)} label={x.name}
          sub={f.is_default ? 'default' : f.meal} badge={Number(f.qty) > 1 ? `×${Number(f.qty)}` : null} className={f.is_default ? 'dflt' : ''} onClick={() => open('logFood')} />;
      })}</TileGrid> : <p className="hint">Nothing logged yet.</p>}
    </Sec>
  );
}

/** Only what you've done: each workout as a tile. */
export function WorkoutHome() {
  const { S, today, calc, open } = useStore();
  const c = calc(today), t = S.targets;
  const plan = S.plan?.[today];
  return (
    <Sec id="workout" title="Workout" icon="dumbbell"
      badge={<span className="pct">{pct(c.rest ? 1 : c.pillars.workout.score)}</span>}
      right={<span className="row-acts">{plan && <button className="link" onClick={() => open('planDay', { k: today })}>Plan</button>}<button className="link" onClick={() => open('logWorkout')}>+ Log</button></span>}
      summary={<span className="sub">{fmt(c.wMin)} / {t.workoutMin} min · {fmt(c.active)} kcal</span>}>
      <div className="wk-sum"><span><b>{fmt(c.wMin)}</b> / {t.workoutMin} min</span><span><b>{fmt(c.active)}</b> / {t.activeKcal} kcal</span>
        {c.watchMin > c.loggedMin && <span className="sub">Apple Watch</span>}</div>
      {c.d.workouts.length ? <TileGrid>{c.d.workouts.map((w) => {
        const type = S.wtypes.find((x) => x.id === w.type_id);
        return <Tile key={w.id} img={type?.image_url} icon={iconForWorkout(w.area)} tone="teal" num={fmt(w.kcal)} label={w.name} sub={`${fmt(w.minutes)} min`} onClick={() => open('day', { k: today })} />;
      })}</TileGrid> : <p className="hint">{c.rest ? 'Rest day.' : plan ? `Today: ${plan.title}. Tap Plan to start.` : 'No workout yet.'}</p>}
    </Sec>
  );
}

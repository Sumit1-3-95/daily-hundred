import { useState } from 'react';
import { useStore } from '../store.jsx';
import { BigRings, MiniRings } from '../components/Rings.jsx';
import TaskRow from '../components/TaskRow.jsx';
import NudgeCards, { Glass, WaterButtons } from '../components/Nudges.jsx';
import { Icon, IconTile } from '../components/Icons.jsx';
import { MBar, fmt } from '../components/ui.jsx';
import { DEFAULT_FOCUS, DEFAULT_HOME, METRICS } from '../lib/metrics.js';
import { DOW, addDays, key, lastN, parse, short } from '../lib/dates.js';

function NameCard() {
  const { A } = useStore();
  const [name, setName] = useState('');
  return (
    <section className="card nudge">
      <div className="nudge-h"><IconTile name="flag" size="sm" /><h3>What should we call you?</h3></div>
      <form className="inline" onSubmit={(e) => { e.preventDefault(); if (name.trim()) A.saveProfile({ name: name.trim() }); }}>
        <div className="field"><label htmlFor="nmIn">First name</label><input id="nmIn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sumit" autoComplete="given-name" /></div>
        <button className="btn sm">Save</button>
      </form>
    </section>
  );
}

/** The one habit you're building right now, with a day-by-day streak. */
function FocusCard() {
  const { S, today, calc, open } = useStore();
  const t = S.targets;
  const f = { ...DEFAULT_FOCUS, start: today, ...(S.profile.prefs?.focus || {}) };
  const M = METRICS[f.metric] || METRICS.water;
  const c = calc(today);
  const days = Array.from({ length: f.days }, (_, i) => key(addDays(parse(f.start), i)));
  const idx = days.indexOf(today);
  const finished = today > days[days.length - 1];
  const hits = days.filter((k) => k <= today && M.hit(calc(k), t)).length;
  const p = M.p(c, t);
  const action = { protein: ['logFood', 'Log food'], eaten: ['logFood', 'Log food'], workout: ['logWorkout', 'Log workout'],
    weight: ['weight', 'Log weight'], sleep: ['sleep', 'Log wake-up'], deficit: ['closeDay', 'Close the day'], burned: ['logWorkout', 'Log workout'] }[f.metric];
  return (
    <section className="card focus">
      <div className="row-h">
        <div><div className="eyebrow">Focus habit · {finished ? 'complete' : `day ${idx + 1} of ${f.days}`}</div><h3>{M.goal(t)}</h3></div>
        <button className="link" onClick={() => open('metrics')}>Change</button>
      </div>
      <div className="focus-body">
        {f.metric === 'water' ? <Glass p={p} size={112} /> : <IconTile name={M.icon} size="lg" />}
        <div className="focus-num">
          <b>{M.value(c, t)}</b><small>{M.sub(c, t)}</small>
          {p != null && <MBar v={p} cls="r1" />}
          <span className="sub">{M.hit(c, t) ? 'Done for today' : f.metric === 'water' ? `${((t.water - c.water) / 1000).toFixed(2)} L to go` : 'Not yet today'}</span>
        </div>
      </div>
      {f.metric === 'water' ? <WaterButtons k={today} /> : action && <button className="btn ghost" onClick={() => open(action[0])}>{action[1]}</button>}
      <div className="streak-row" aria-label={`${hits} of ${f.days} days hit`}>
        {days.map((k) => {
          const st = k > today ? 'future' : M.hit(calc(k), t) ? 'hit' : k === today ? 'today' : 'miss';
          return <span key={k} className={`sday ${st}`} title={short(k)}>{st === 'hit' ? <Icon name={M.icon} size={13} /> : DOW[parse(k).getDay()][0]}</span>;
        })}
      </div>
      <p className="hint">{finished
        ? `You hit it on ${hits} of ${f.days} days. Pick your next focus habit.`
        : `${hits} of ${f.days} days hit so far. Started ${short(f.start)}.`}</p>
    </section>
  );
}

export default function Home({ goTab }) {
  const { S, today, calc, open } = useStore();
  const c = calc(today), t = S.targets;
  const wkAgo = calc(key(addDays(parse(today), -7))).weight;
  const wDelta = c.weight != null && wkAgo != null ? c.weight - wkAgo : null;
  const pending = c.scored.filter((s) => s.credit < 0.999).slice(0, 3);
  const latestW = c.weight ?? [...Object.keys(S.days)].sort().reverse().map((k) => S.days[k].log?.weight).find((w) => w != null) ?? t.startWeight;
  const lost = t.startWeight - latestW, need = t.startWeight - t.goalWeight;
  const pinned = (S.profile.prefs?.home_metrics || DEFAULT_HOME).filter((m) => METRICS[m]);
  return (
    <>
      {!S.profile.name && <NameCard />}
      <section className="card hero">
        <div className="rings-wrap"><BigRings c={c} />
          <div className="ring-center"><b>{Math.round(c.score * 100)}%</b><span>day score</span></div></div>
        <ul className="legend">
          <li><i className="dot r1" /><div><span>Tasks</span><b>{c.done} of {c.total} done</b></div></li>
          <li><i className="dot r2" /><div><span>Deficit{c.open && <em className="prov">projected</em>}</span>
            <b>{fmt(c.shownD)} / {t.deficit} kcal</b>
            {c.open && <small className="sub" style={{ display: 'block' }}>{fmt(Math.max(0, c.left))} kcal left to eat today</small>}</div></li>
          <li><i className="dot r3" /><div><span>Workout</span><b>{c.rest ? 'Rest day' : `${Math.round(c.wMin)} / ${t.workoutMin} min`}</b></div></li>
        </ul>
        <div className="score-under">
          <div className="big">{Math.round(c.score * 100)}<small>/ 100</small></div>
          <div className="sub">{c.pts.toFixed(1).replace('.0', '')} of {c.maxPts} points<br />{c.score >= 0.999 ? 'Perfect day' : `${Math.round((1 - c.score) * 100)} to go`}</div>
        </div>
      </section>
      <FocusCard />
      <NudgeCards k={today} />
      <section className="card">
        <div className="row-h"><h3>Today</h3><button className="link" onClick={() => open('metrics')}>Customize</button></div>
        <div className="stat-grid">{pinned.map((m) => {
          const M = METRICS[m], p = M.p(c, t);
          const sub = m === 'weight' && wDelta != null ? `${wDelta <= 0 ? '▼' : '▲'} ${Math.abs(wDelta).toFixed(1)} kg in 7 days` : M.sub(c, t);
          const tap = { water: 'water', protein: 'logFood', eaten: 'logFood', weight: 'weight', sleep: 'sleep', workout: 'logWorkout' }[m];
          return (
            <button key={m} className="stat" onClick={() => tap && open(tap)}>
              <div className="stat-h"><IconTile name={M.icon} size="sm" /><span>{M.label}</span></div>
              <b>{M.value(c, t)}</b><small>{sub}</small>{p != null && <MBar v={p} cls={m === 'protein' ? 'r3' : m === 'sleep' ? 'r1' : ''} />}
            </button>
          );
        })}</div>
      </section>
      <section className="card"><div className="row-h"><h3>Last 7 days</h3><span className="sub">tasks · deficit · workout</span></div>
        <div className="week">{lastN(7, parse(today)).map((k) => (
          <div key={k} className={k === today ? 'is-today' : ''}><MiniRings c={calc(k)} />{DOW[parse(k).getDay()].slice(0, 2)}</div>
        ))}</div></section>
      <section className="card"><div className="row-h"><h3>Up next</h3><button className="link" onClick={() => goTab('today')}>All tasks</button></div>
        <div className="tasks">{pending.length
          ? pending.map((s) => <TaskRow key={s.task.id} k={today} c={c} task={s.task} credit={s.credit} />)
          : <div className="empty">Everything is done. That's a 100% day.</div>}</div></section>
      <section className="card"><div className="row-h"><div className="nudge-h"><IconTile name="scale" size="sm" /><h3>Goal</h3></div><span className="sub">{t.goalWeight} kg</span></div>
        <div className="goalbar"><i style={{ width: `${Math.max(0, Math.min(1, lost / need)) * 100}%` }} /></div>
        <div className="goal-ends"><span>Started at {t.startWeight} kg</span><span>{Math.max(0, lost).toFixed(1)} of {need.toFixed(1)} kg lost</span></div></section>
      {!c.closed && <button className="btn ghost" onClick={() => open('closeDay')}><Icon name="moon" size={16} /> Sign off: close the day</button>}
    </>
  );
}

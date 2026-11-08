import { useState } from 'react';
import { useStore } from '../store.jsx';
import TaskRow from '../components/TaskRow.jsx';
import { Icon } from '../components/Icons.jsx';
import { streak } from '../lib/calc.js';
import { key, parse } from '../lib/dates.js';

export function ScoreRing({ v, size = 92 }) {
  const r = 40, C = 2 * Math.PI * r;
  return (
    <span className="score-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="sr-trk" />
        {v > 0.001 && <circle cx="50" cy="50" r={r} className="sr-arc" strokeDasharray={`${(Math.min(1, v) * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 50 50)" />}
      </svg>
      <b>{Math.round(v * 100)}<small>%</small></b>
    </span>
  );
}

export function MonthCalendar({ onPick }) {
  const { today, calc } = useStore();
  const T = parse(today), y = T.getFullYear(), mo = T.getMonth();
  const dim = new Date(y, mo + 1, 0).getDate(), off = (new Date(y, mo, 1).getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < off; i++) cells.push(<span key={`o${i}`} />);
  for (let d = 1; d <= dim; d++) {
    const k = key(new Date(y, mo, d)), fut = k > today, cc = calc(k);
    let cls = 'c';
    if (!fut && cc.hasData) {
      const s = cc.score;
      cls += ` ${s >= 0.999 ? 's4 perfect' : s >= 0.75 ? 's3' : s >= 0.5 ? 's2' : s > 0 ? 's1' : ''}`;
    }
    if (fut) cls += ' future';
    if (k === today) cls += ' today';
    cells.push(fut ? <span key={k} className={cls}>{d}</span>
      : <button key={k} className={cls} onClick={() => onPick(k)} aria-label={`${d} ${T.toLocaleDateString('en-IN', { month: 'long' })}${cc.hasData ? `, ${Math.round(cc.score * 100)}%` : ''}`}>{d}</button>);
  }
  return <div className="cal">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((h, i) => <span key={`h${i}`} className="h">{h}</span>)}{cells}</div>;
}

export default function Today() {
  const { S, today, calc, A, open } = useStore();
  const [manage, setManage] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const c = calc(today);
  const st = streak(S, today);
  const todo = c.scored.filter((s) => s.credit < 0.999);
  const done = c.scored.filter((s) => s.credit >= 0.999);
  const left = Math.round((1 - c.score) * 100);
  const T = parse(today);
  let perfect = 0;
  for (let d = 1; d <= T.getDate(); d++) { const cc = calc(key(new Date(T.getFullYear(), T.getMonth(), d))); if (cc.hasData && cc.score >= 0.999) perfect++; }
  const row = (s) => <TaskRow key={s.task.id} k={today} c={c} task={s.task} credit={s.credit} manage={manage} onEdit={(t) => open('task', { task: t })} />;

  return (
    <>
      <section className={`card today-head${c.score >= 0.999 ? ' perfect' : ''}`}>
        <ScoreRing v={c.score} />
        <div className="th-body">
          <div className="th-title">{c.score >= 0.999 ? 'Perfect day!' : left <= 20 ? 'Almost there' : todo.length === c.total ? "Let's get going" : 'Keep going'}</div>
          <div className="th-sub">{c.score >= 0.999 ? 'Every task done. Enjoy it.' : `${left} points to 100 · ${todo.length} task${todo.length === 1 ? '' : 's'} left`}</div>
          <div className="chips">
            <span className="badge fire"><Icon name="fire" size={14} />{st ? `${st}-day streak` : "Start a streak today"}</span>
            <span className="badge"><Icon name="flag" size={14} />{perfect} perfect this month</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="row-h"><h3>To do</h3><button className="link" onClick={() => setManage((m) => !m)}>{manage ? 'Done' : 'Edit'}</button></div>
        <div className="tlist">{todo.map(row)}{!todo.length && <div className="empty">All done. That's a 100% day.</div>}</div>
        {done.length > 0 && <>
          <button className="done-h" onClick={() => setShowDone((x) => !x)} aria-expanded={showDone}>
            <span>Done · {done.length}</span><span>{showDone ? 'Hide' : 'Show'}</span></button>
          {showDone && <div className="tlist">{done.map(row)}</div>}
        </>}
        <div className="btn-row">
          <button className="btn ghost sm" onClick={() => open('task')}>+ Add task</button>
          <button className={`btn ghost sm${c.rest ? ' on' : ''}`} onClick={() => A.saveDay(today, { rest: !c.rest })} aria-pressed={c.rest}>
            {c.rest ? 'Rest day: on' : 'Rest day'}</button>
        </div>
      </section>

      <section className="card"><div className="row-h"><h3>{T.toLocaleDateString('en-IN', { month: 'long' })}</h3><span className="sub">tap a day to see it</span></div>
        <MonthCalendar onPick={(k) => open('day', { k })} /></section>
    </>
  );
}

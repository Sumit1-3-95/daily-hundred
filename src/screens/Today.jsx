// Habits tab: today's habit score, habit cards, one-time to-dos, detractors and the month calendar.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon } from '../components/Icons.jsx';
import { AvoidCards } from '../components/Avoid.jsx';
import { HabitCard, TodoAdd, TodoRow } from '../components/Habits.jsx';
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
    if (!fut && cc.hasData) { const s = cc.score; cls += ` ${s >= 0.999 ? 's4 perfect' : s >= 0.75 ? 's3' : s >= 0.5 ? 's2' : s > 0 ? 's1' : ''}`; }
    if (fut) cls += ' future';
    if (k === today) cls += ' today';
    cells.push(fut ? <span key={k} className={cls}>{d}</span> : <button key={k} className={cls} onClick={() => onPick(k)} aria-label={`${d}${cc.hasData ? `, ${Math.round(cc.score * 100)}%` : ''}`}>{d}</button>);
  }
  return <div className="cal">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((h, i) => <span key={`h${i}`} className="h">{h}</span>)}{cells}</div>;
}

export default function Today() {
  const { S, today, calc, open } = useStore();
  const [manage, setManage] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const c = calc(today), H = c.pillars.habits;
  const st = streak(S, today);
  const habits = c.scored.filter((s) => s.pillar === 'habits' && s.task.type !== 'todo');
  const todos = c.scored.filter((s) => s.task.type === 'todo');
  const todoOpen = todos.filter((s) => s.credit < 0.999), todoDone = todos.filter((s) => s.credit >= 0.999);
  const hs = H.score ?? 0;
  const msg = hs >= 0.999 ? 'All habits done!' : hs >= 0.75 ? 'Almost there' : hs > 0 ? 'Keep going' : "Let's start";

  return (
    <>
      <section className={`card today-head${hs >= 0.999 ? ' perfect' : ''}`}>
        <ScoreRing v={hs} />
        <div className="th-body">
          <div className="th-title">{msg}</div>
          <div className="th-sub">{H.done} of {H.total} habits · day score {Math.round(c.score * 100)}%</div>
          <div className="chips">
            <span className="badge fire"><Icon name="fire" size={14} />{st ? `${st}-day streak` : 'Start a streak'}</span>
            {c.penalty > 0 && <span className="badge bad">−{c.penalty} pts</span>}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="row-h"><h3>Habits</h3><button className="link" onClick={() => setManage((m) => !m)}>{manage ? 'Done' : 'Edit'}</button></div>
        <div className="hgrid">
          {habits.map((s) => <HabitCard key={s.task.id} k={today} task={s.task} credit={s.credit} onEdit={manage ? (t) => open('task', { task: t }) : undefined} />)}
          <button className="hcard add" onClick={() => open('task')}><Icon name="check" size={20} /><span>New habit</span></button>
        </div>
      </section>

      <section className="card">
        <div className="row-h"><h3>To-dos</h3><span className="sub">{todoOpen.length ? `${todoOpen.length} left · unfinished ones move to tomorrow` : todos.length ? 'All done' : 'One-time jobs for today'}</span></div>
        <TodoAdd k={today} />
        <div className="todos">{todoOpen.map((s) => <TodoRow key={s.task.id} k={today} task={s.task} credit={s.credit} manage={manage} />)}</div>
        {todoDone.length > 0 && <>
          <button className="done-h" onClick={() => setShowDone((x) => !x)} aria-expanded={showDone}><span>Done · {todoDone.length}</span><span>{showDone ? 'Hide' : 'Show'}</span></button>
          {showDone && <div className="todos">{todoDone.map((s) => <TodoRow key={s.task.id} k={today} task={s.task} credit={s.credit} manage={manage} />)}</div>}
        </>}
      </section>

      <section className="card"><div className="row-h"><h3>Detractors</h3><span className="sub">{c.penalty ? `−${c.penalty} pts today` : 'none today'}</span></div>
        <AvoidCards k={today} /></section>

      <section className="card"><div className="row-h"><h3>{parse(today).toLocaleDateString('en-IN', { month: 'long' })}</h3><span className="sub">tap a day</span></div>
        <MonthCalendar onPick={(k) => open('day', { k })} /></section>
    </>
  );
}

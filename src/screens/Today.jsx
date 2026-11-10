// Habits tab: today's habit score, habit cards, one-time to-dos, detractors and the month calendar.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon } from '../components/Icons.jsx';
import { AvoidCards } from '../components/Avoid.jsx';
import { TodoAdd, TodoRow, useTaskAct } from '../components/Habits.jsx';
import { Sec, Tile, TileGrid } from '../components/Tile.jsx';
import { taskIcon } from '../components/TaskRow.jsx';
import { habitArt } from '../lib/art.js';
import { streak, taskName } from '../lib/calc.js';
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
  const { S, today, calc, open, A } = useStore();
  const act = useTaskAct(today);
  const [manage, setManage] = useState(false);
  const c = calc(today), H = c.pillars.habits, t = S.targets;
  const st = streak(S, today);
  const habits = c.scored.filter((x) => x.pillar === 'habits' && x.task.type !== 'todo');
  const todos = c.scored.filter((x) => x.task.type === 'todo');
  const todoOpen = todos.filter((x) => x.credit < 0.999), todoDone = todos.filter((x) => x.credit >= 0.999);
  const hs = H.score ?? 0;
  const msg = hs >= 0.999 ? 'All habits done!' : hs >= 0.75 ? 'Almost there' : hs > 0 ? 'Keep going' : "Let's start";
  const num = (task, credit) => {
    const tl = c.d.tlogs[task.id] || {};
    if (credit >= 0.999) return '✓';
    if (task.type === 'number') return `${tl.value || 0}/${task.target}`;
    if (task.type === 'checklist') { const n = S.items.filter((i) => i.list_id === task.list_id).length; return `${Math.round(credit * n)}/${n}`; }
    if (task.type === 'auto') return `${Math.round(credit * 100)}%`;
    return `+${task.weight}`;
  };
  const sorted = [...habits].sort((a, b) => (a.credit >= 0.999) - (b.credit >= 0.999));

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

      <Sec id="h-habits" title="Habits" icon="check" badge={<span className="pct">{H.done}/{H.total}</span>}
        right={<button className="link" onClick={() => setManage((m) => !m)}>{manage ? 'Done' : 'Edit'}</button>}
        summary={<span className="sub">{habits.filter((x) => x.credit < 0.999).map((x) => taskName(x.task, t)).join(' · ') || 'All done'}</span>}>
        <TileGrid>
          {sorted.map(({ task, credit }) => (
            <Tile key={task.id} img={habitArt(task)} icon={taskIcon(task)} tone="violet" num={num(task, credit)} label={taskName(task, t)}
              sub={manage ? 'Edit' : `+${task.weight} pts`} p={credit} dim={credit >= 0.999 && !manage}
              onClick={() => (manage ? open('task', { task }) : act(task))} />
          ))}
          <button className="tile2 add" onClick={() => open('task')}><span>+</span>New habit</button>
        </TileGrid>
      </Sec>

      <Sec id="h-todos" title="To-dos" icon="list" badge={todos.length ? <span className="pct">{todoDone.length}/{todos.length}</span> : null}
        summary={<span className="sub">{todoOpen.length ? `${todoOpen.length} left · unfinished ones move to tomorrow` : 'Nothing pending'}</span>}>
        <TodoAdd k={today} />
        {todoOpen.length > 0 && <TileGrid>{todoOpen.map(({ task, credit }) => (
          <Tile key={task.id} img={habitArt(task)} icon="check" tone="blue" num={`+${task.weight}`} label={task.name}
            sub={manage ? 'Tap to delete' : task.carried_from ? 'carried over' : 'to-do'} p={credit} onClick={() => (manage ? A.archiveTask(task.id) : act(task))} />
        ))}</TileGrid>}
        {todoDone.length > 0 && <div className="todos">{todoDone.map((x) => <TodoRow key={x.task.id} k={today} task={x.task} credit={x.credit} manage={manage} />)}</div>}
      </Sec>

      <Sec id="h-avoid" title="Detractors" icon="drink" defaultOpen={false} badge={c.penalty ? <span className="pct bad">−{c.penalty}</span> : null}
        summary={<span className="sub">{c.penalty ? `−${c.penalty} points today` : 'None today'}</span>}>
        <AvoidCards k={today} />
      </Sec>

      <Sec id="h-cal" title={parse(today).toLocaleDateString('en-IN', { month: 'long' })} icon="flag" defaultOpen={false}
        summary={<span className="sub">Daily scores this month · tap to open</span>}>
        <MonthCalendar onPick={(k) => open('day', { k })} />
      </Sec>
    </>
  );
}

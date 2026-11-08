import { useState } from 'react';
import { useStore } from '../store.jsx';
import TaskRow from '../components/TaskRow.jsx';
import { MBar } from '../components/ui.jsx';
import { streak } from '../lib/calc.js';
import { key, parse } from '../lib/dates.js';

export default function Today() {
  const { S, today, calc, A, open } = useStore();
  const [manage, setManage] = useState(false);
  const c = calc(today);
  const st = streak(S, today);
  const T = parse(today), y = T.getFullYear(), mo = T.getMonth();
  const dim = new Date(y, mo + 1, 0).getDate(), off = (new Date(y, mo, 1).getDay() + 6) % 7;
  let perfect = 0;
  const cells = [];
  for (let i = 0; i < off; i++) cells.push(<div key={`o${i}`} />);
  for (let d = 1; d <= dim; d++) {
    const k = key(new Date(y, mo, d)), fut = k > today;
    let cls = 'c';
    const cc = calc(k);
    if (!fut && cc.hasData) {
      const s = cc.score;
      cls += ` ${s >= 0.999 ? 's4' : s >= 0.75 ? 's3' : s >= 0.5 ? 's2' : s > 0 ? 's1' : ''}`;
      if (s >= 0.999) { cls += ' perfect'; perfect++; }
    }
    if (fut) cls += ' future';
    if (k === today) cls += ' today';
    cells.push(<div key={k} className={cls} title={!fut && cc.hasData ? `${Math.round(cc.score * 100)}%` : undefined}>{d}</div>);
  }
  return (
    <>
      <section className="card">
        <div className="score-head"><div className="score-big">{Math.round(c.score * 100)}<small>%</small></div>
          <div className="score-meta">
            <span><b>{c.pts.toFixed(1).replace('.0', '')} of {c.maxPts}</b> points · {c.done} of {c.total} tasks</span>
            <span>Perfect-day streak: <b>{st} day{st === 1 ? '' : 's'}</b></span>
            <span>Perfect days this month: <b>{perfect}</b></span>
          </div></div>
        <MBar v={c.score} cls="r1" />
        <p className="hint">Tasks marked ×2 or ×3 are worth more points. Partly done tasks earn partial points.</p>
      </section>
      <section className="card">
        <div className="row-h"><h3>Today's plan</h3><button className="link" onClick={() => setManage((m) => !m)}>{manage ? 'Done' : 'Edit tasks'}</button></div>
        <div className="tasks">{c.scored.map((s) => (
          <TaskRow key={s.task.id} k={today} c={c} task={s.task} credit={s.credit} manage={manage} onEdit={(t) => open('task', { task: t })} />
        ))}{!c.scored.length && <div className="empty">No tasks today. Add your first one below.</div>}</div>
        <div className="toggle"><span>Rest day<br /><small className="sub">The workout task is skipped and the workout ring counts as closed</small></span>
          <button className="switch" role="switch" aria-checked={c.rest} aria-label="Rest day" onClick={() => A.saveDay(today, { rest: !c.rest })} /></div>
        <button className="btn ghost" onClick={() => open('task')}>Add a task or goal</button>
      </section>
      <section className="card"><div className="row-h"><h3>{T.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3><span className="sub">daily score</span></div>
        <div className="cal">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((h, i) => <div key={`h${i}`} className="h">{h}</div>)}{cells}</div>
        <div className="cal-key"><span>0%</span>
          <i style={{ background: 'var(--surface-2)' }} /><i style={{ background: 'color-mix(in srgb,var(--r1) 22%,var(--surface-2))' }} />
          <i style={{ background: 'color-mix(in srgb,var(--r1) 45%,var(--surface-2))' }} /><i style={{ background: 'color-mix(in srgb,var(--r1) 70%,var(--surface-2))' }} />
          <i style={{ background: 'var(--r1)' }} /><span>100%, dot marks a perfect day</span></div>
      </section>
    </>
  );
}

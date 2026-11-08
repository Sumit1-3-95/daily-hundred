import { useStore } from '../store.jsx';
import { BigRings, MiniRings } from '../components/Rings.jsx';
import TaskRow from '../components/TaskRow.jsx';
import NudgeCards from '../components/Nudges.jsx';
import { MBar, fmt } from '../components/ui.jsx';
import { DOW, addDays, key, lastN, parse } from '../lib/dates.js';

export default function Home({ goTab }) {
  const { S, today, calc, A } = useStore();
  const c = calc(today), t = S.targets;
  const wkAgo = calc(key(addDays(parse(today), -7))).weight;
  const wDelta = c.weight != null && wkAgo != null ? c.weight - wkAgo : null;
  const pending = c.scored.filter((s) => s.credit < 0.999).slice(0, 3);
  const latestW = c.weight ?? [...Object.keys(S.days)].sort().reverse().map((k) => S.days[k].log?.weight).find((w) => w != null) ?? t.startWeight;
  const lost = t.startWeight - latestW, need = t.startWeight - t.goalWeight;
  const Stat = ({ l, v, s, p, cls }) => (
    <div className="stat"><span>{l}</span><b>{v}</b><small>{s}</small>{p != null && <MBar v={p} cls={cls} />}</div>
  );
  return (
    <>
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
          <div className="sub">{(c.pts).toFixed(1).replace('.0', '')} of {c.maxPts} points<br />{c.score >= 0.999 ? 'Perfect day' : `${Math.round((1 - c.score) * 100)} to go`}</div>
        </div>
        <div className="hero-foot">{c.closed
          ? <p className="closed-note">Day closed. Your deficit is locked in.</p>
          : <button className="btn ghost" onClick={() => A.closeDay(today)}>Close day: food is fully logged</button>}</div>
      </section>
      <NudgeCards k={today} />
      <section className="stat-grid">
        <Stat l="Eaten" v={fmt(c.eaten)} s={`of ${fmt(t.kcal)} kcal`} p={c.eaten / t.kcal} />
        <Stat l="Burned" v={fmt(c.burned)} s={`${t.bmr} rest + ${fmt(c.active)} active`} />
        <Stat l="Protein" v={`${fmt(c.protein)} g`} s={`of ${t.protein} g`} p={c.protein / t.protein} cls="r3" />
        <Stat l="Water" v={`${(c.water / 1000).toFixed(2)} L`} s={`of ${t.water / 1000} L`} p={c.water / t.water} />
        <Stat l="Weight" v={c.weight != null ? c.weight.toFixed(1) : '—'} s={wDelta != null ? `${wDelta <= 0 ? '▼' : '▲'} ${Math.abs(wDelta).toFixed(1)} kg in 7 days` : 'kg'} />
        <Stat l="Sleep" v={`${c.sleep || 0} h`} s={`of ${t.sleep} h`} p={c.sleep / t.sleep} cls="r1" />
      </section>
      <section className="card"><div className="row-h"><h3>Last 7 days</h3><span className="sub">tasks · deficit · workout</span></div>
        <div className="week">{lastN(7, parse(today)).map((k) => (
          <div key={k} className={k === today ? 'is-today' : ''}><MiniRings c={calc(k)} />{DOW[parse(k).getDay()].slice(0, 2)}</div>
        ))}</div></section>
      <section className="card"><div className="row-h"><h3>Up next</h3><button className="link" onClick={() => goTab('today')}>All tasks</button></div>
        <div className="tasks">{pending.length
          ? pending.map((s) => <TaskRow key={s.task.id} k={today} c={c} task={s.task} credit={s.credit} />)
          : <div className="empty">Everything is done. That's a 100% day.</div>}</div></section>
      <section className="card"><div className="row-h"><h3>Goal</h3><span className="sub">{t.goalWeight} kg</span></div>
        <div className="goalbar"><i style={{ width: `${Math.max(0, Math.min(1, lost / need)) * 100}%` }} /></div>
        <div className="goal-ends"><span>Started at {t.startWeight} kg</span><span>{Math.max(0, lost).toFixed(1)} of {need.toFixed(1)} kg lost</span></div></section>
    </>
  );
}

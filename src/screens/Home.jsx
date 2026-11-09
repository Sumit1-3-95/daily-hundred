import { useState } from 'react';
import { useStore } from '../store.jsx';
import { BigRings, MiniRings } from '../components/Rings.jsx';
import { FoodSection, TaskSection, WorkoutSection } from '../components/TodayCards.jsx';
import { Alerts, Glass, WaterButtons } from '../components/Nudges.jsx';
import { Icon, IconTile } from '../components/Icons.jsx';
import { MBar } from '../components/ui.jsx';
import { DEFAULT_FOCUS, DEFAULT_HOME, METRICS } from '../lib/metrics.js';
import { DOW, addDays, key, lastN, parse, short } from '../lib/dates.js';

const TONE = { water: 'blue', protein: 'teal', eaten: 'orange', burned: 'pink', deficit: 'orange', workout: 'green', weight: 'slate', sleep: 'violet', steps: 'amber' };
const pct = (v) => `${Math.round(Math.max(0, v) * 100)}%`;

function NameCard() {
  const { A } = useStore();
  const [name, setName] = useState('');
  return (
    <section className="card">
      <form className="inline" onSubmit={(e) => { e.preventDefault(); if (name.trim()) A.saveProfile({ name: name.trim() }); }}>
        <div className="field"><label htmlFor="nmIn">What should we call you?</label><input id="nmIn" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sumit" autoComplete="given-name" /></div>
        <button className="btn sm">Save</button>
      </form>
    </section>
  );
}

/** The one habit you're building right now: compact card with a day-by-day streak. */
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
  const action = { water: 'water', protein: 'logFood', eaten: 'logFood', workout: 'logWorkout', weight: 'weight', sleep: 'sleep', deficit: 'closeDay', burned: 'logWorkout' }[f.metric];
  return (
    <section className="card focus">
      <div className="focus-row">
        <button className="focus-vis" onClick={() => action && open(action)} aria-label={`Log ${M.label}`}>
          {f.metric === 'water' ? <Glass p={p} size={64} /> : <IconTile name={M.icon} size="lg" />}
        </button>
        <div className="focus-num">
          <div className="eyebrow">{M.label} habit · {finished ? 'complete' : `day ${idx + 1} of ${f.days}`}</div>
          <div><b>{M.value(c, t)}</b> <small>{M.sub(c, t)}</small></div>
          {p != null && <MBar v={p} cls="r1" />}
        </div>
        <button className="link" onClick={() => open('metrics')}>Change</button>
      </div>
      {f.metric === 'water' && <WaterButtons k={today} compact />}
      <div className="streak-row" aria-label={`${hits} of ${f.days} days hit`}>
        {days.map((k) => {
          const st = k > today ? 'future' : M.hit(calc(k), t) ? 'hit' : k === today ? 'today' : 'miss';
          return <span key={k} className={`sday ${st}`} title={short(k)}>{st === 'hit' ? <Icon name="check" size={12} /> : DOW[parse(k).getDay()][0]}</span>;
        })}
        <span className="streak-sum">{hits}/{f.days}</span>
      </div>
    </section>
  );
}

export default function Home({ goTab }) {
  const { S, today, calc, open } = useStore();
  const c = calc(today), t = S.targets;
  const wkAgo = calc(key(addDays(parse(today), -7))).weight;
  const wDelta = c.weight != null && wkAgo != null ? c.weight - wkAgo : null;
  const latestW = c.weight ?? [...Object.keys(S.days)].sort().reverse().map((k) => S.days[k].log?.weight).find((w) => w != null) ?? t.startWeight;
  const lost = t.startWeight - latestW, need = t.startWeight - t.goalWeight;
  const pinned = (S.profile.prefs?.home_metrics || DEFAULT_HOME).filter((m) => METRICS[m]);
  return (
    <>
      {!S.profile.name && <NameCard />}
      <section className="card hero">
        <div className="rings-wrap"><BigRings c={c} /></div>
        <div className="hero-r">
          <div className="hero-score"><b>{pct(c.score)}</b></div>
          <div className="sub">day score</div>
          <ul className="legend">
            <li><i className="dot r1" /><span>Tasks</span><b>{pct(c.ringT)}</b></li>
            <li><i className="dot r2" /><span>Deficit{c.open ? ' (so far)' : ''}</span><b>{pct(c.ringD)}</b></li>
            <li><i className="dot r3" /><span>Workout</span><b>{pct(c.ringW)}</b></li>
          </ul>
        </div>
      </section>
      <section className="card week-card">
        <div className="week">{lastN(7, parse(today)).map((k) => (
          <button key={k} className={k === today ? 'is-today' : ''} onClick={() => open('day', { k })} aria-label={`Open ${short(k)}`}><MiniRings c={calc(k)} />{DOW[parse(k).getDay()].slice(0, 2)}</button>
        ))}</div>
      </section>
      <section className="card">
        <div className="row-h"><h3>At a glance</h3><button className="link" onClick={() => open('metrics')}>Edit</button></div>
        <div className="glance">{pinned.filter((m) => m !== 'weight').map((m) => {
          const M = METRICS[m], p = M.p(c, t);
          const tap = { water: 'water', protein: 'logFood', eaten: 'logFood', sleep: 'sleep', workout: 'logWorkout', burned: 'logWorkout', deficit: 'closeDay', steps: null }[m];
          const f = Math.max(0, Math.min(1, p || 0));
          return (
            <button key={m} className={`gl t-${TONE[m] || 'slate'}${p != null && f >= 0.999 ? ' hit' : ''}`} onClick={() => tap && open(tap)}>
              <span className="gl-top"><b>{M.value(c, t)}</b><Icon name={M.icon} size={15} /></span>
              <span className="gl-l">{M.label}</span>
              {p != null && <span className="gl-bar"><i style={{ width: `${f * 100}%` }} /></span>}
            </button>
          );
        })}</div>
      </section>
      <Alerts k={today} />
      <FocusCard />
      <WorkoutSection />
      <TaskSection goTab={goTab} />
      <FoodSection />
    </>
  );
}

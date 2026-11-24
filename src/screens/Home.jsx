// Home = Habits. A few daily habits, each with a streak: 7 days first, then 21 days for a medal.
import { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { Alerts } from '../components/Nudges.jsx';
import { Icon } from '../components/Icons.jsx';
import { isReading } from '../components/Habits.jsx';
import { progState } from '../components/ui.jsx';
import { habitArt } from '../lib/art.js';
import { runShortcut } from '../sheets/Settings.jsx';
import { habitStreaks, streak, taskName } from '../lib/calc.js';
import { DOW, lastN, parse } from '../lib/dates.js';

const pct = (v) => `${Math.round(Math.max(0, v || 0) * 100)}%`;
const f0 = (n) => Math.round(n || 0).toLocaleString('en-IN');

export function Medal({ n = 21, size = 44, dim }) {
  return (
    <svg className={`medal${dim ? ' dim' : ''}`} viewBox="0 0 48 56" width={size} height={size * 56 / 48} aria-hidden="true">
      <path d="M14 2h8l4 18-8 2zM34 2h-8l-4 18 8 2z" fill={dim ? '#C9CED8' : '#E2483B'} />
      <path d="M22 2h4l-2 16z" fill={dim ? '#B4BAC6' : '#B8302A'} />
      <circle cx="24" cy="36" r="17" fill={dim ? '#DDE1E8' : '#F6C343'} stroke={dim ? '#B4BAC6' : '#C9921B'} strokeWidth="3" />
      <circle cx="24" cy="36" r="11.5" fill="none" stroke={dim ? '#C2C7D1' : '#FBE08A'} strokeWidth="2" />
      <text x="24" y="40.5" textAnchor="middle" fontFamily="var(--display)" fontWeight="800" fontSize="12" fill={dim ? '#8A90A0' : '#7A5308'}>{n}</text>
    </svg>
  );
}

/** What a habit shows and what its button does. */
function useHabit(task, credit) {
  const { S, today, calc, A, open } = useStore();
  const c = calc(today), t = S.targets, tl = c.d.tlogs[task.id] || {};
  const plan = S.plan?.[today];
  const done = credit >= 0.999;
  if (task.type === 'auto') {
    switch (task.auto_key) {
      case 'water': return { line: `${(c.water / 1000).toFixed(2)} of ${t.water / 1000} L`, btn: '+250', act: () => A.addWater(today, 250), tap: () => open('water') };
      case 'protein': return { line: c.pMode ? `${f0(c.protein)} of ${t.protein} g · added ${f0(c.proteinExtra)}/${f0(c.pExtraTarget)}` : `${f0(c.protein)} of ${t.protein} g`, btn: '+ Add', act: () => open('logFood') };
      case 'workout': return { line: c.rest ? 'Rest day' : `${f0(c.wMin)} of ${t.workoutMin} min${plan && plan.status !== 'done' ? ` · ${plan.title}` : ''}`, btn: done ? null : plan && plan.status === 'planned' ? 'Plan' : 'Log',
        act: () => (plan && plan.status === 'planned' ? open('planDay', { k: today }) : open('logWorkout')) };
      case 'sleep': return { line: `${c.sleep || 0} of ${t.sleep} h`, btn: 'Log', act: () => open('sleep') };
      case 'steps': return { line: c.steps != null ? `${f0(c.steps)} of ${f0(t.steps || 10000)} · from Apple Watch` : 'Syncs from your Apple Watch', btn: done ? null : 'Sync', act: runShortcut };
      default: return { line: pct(credit), btn: null, act: () => {} };
    }
  }
  if (task.type === 'number') {
    const go = () => (isReading(task) ? open('books') : open('taskOne', { id: task.id }));
    const line = `${tl.value || 0} of ${task.target} ${task.unit || (isReading(task) ? 'pages' : '')}`;
    if (isReading(task)) return { line, btn: done ? null : 'Log', act: go };
    const step = task.target >= 10 ? 5 : 1;      // jobs: +5 at a time; tap the row for the exact number
    return { line, btn: done ? null : `+${step}`, act: () => A.setTaskLog(today, task, { value: (Number(tl.value) || 0) + step }), tap: go };
  }
  if (task.type === 'checklist') return { line: `${Math.round(credit * 100)}% of steps`, btn: 'Open', act: () => open('taskOne', { id: task.id }) };
  const toggle = () => A.setTaskLog(today, task, { done: !tl.done });
  return { line: done ? 'Done today' : 'Not done yet', btn: done ? null : 'Done', act: toggle, tap: toggle };
}

function HabitRow({ task, credit, st }) {
  const { S } = useStore();
  const h = useHabit(task, credit);
  const done = credit >= 0.999;
  const goal = st?.goal || 7, run = st?.run || 0;
  const seg = goal === 7 ? 7 : 21;
  const into = goal === 7 ? run : run - (goal - 21);
  const left = goal - run;
  return (
    <div className={`hrow ${progState(credit)}${done ? ' done' : ''}`}>
      <button className="hr-main" onClick={h.tap || h.act}>
        <span className="hr-art"><img src={habitArt(task)} alt="" />{done && <span className="hr-ok"><Icon name="check" size={16} /></span>}</span>
        <span className="hr-b">
          <span className="hr-n">{taskName(task, S.targets)}</span>
          <span className="hr-l">{h.line}</span>
          <span className="hr-bar"><i style={{ width: `${Math.min(1, credit) * 100}%` }} /></span>
          <span className="hr-st">
            <span className={`hr-segs s${seg}`}>{Array.from({ length: seg }, (_, i) => <i key={i} className={i < into ? 'on' : ''} />)}</span>
            <span className="hr-sl">{run ? <><b>{run} day{run > 1 ? 's' : ''}</b> · </> : done ? null : 'Start today · '}{left === 1 && !done ? (goal === 7 ? 'today makes 7' : 'medal today') : (run ? `${left} to ${goal === 7 ? '7' : 'medal'}` : '7-day goal')}</span>
          </span>
        </span>
      </button>
      {h.btn && <button className="hr-btn" onClick={h.act}>{h.btn}</button>}
    </div>
  );
}

/** Pops up the day a habit reaches 7 days, or earns a 21-day medal. Once per habit per day. */
function Celebrate({ list }) {
  const { today } = useStore();
  const seen = (id) => { try { return localStorage.getItem(`dh.cel.${id}.${today}`) === '1'; } catch { return false; } };
  const hit = list.find(({ st }) => st?.doneToday && (st.run === 7 || st.run % 21 === 0) && !seen(st.id));
  const [, force] = useState(0);
  useEffect(() => { if (hit && navigator.vibrate) navigator.vibrate([30, 40, 30]); }, [hit?.st.id]);
  if (!hit) return null;
  const medal = hit.st.run % 21 === 0;
  const shut = () => { try { localStorage.setItem(`dh.cel.${hit.st.id}.${today}`, '1'); } catch { /* ignore */ } force((n) => n + 1); };
  return (
    <div className="celebrate" role="dialog" aria-label="Streak reached" onClick={shut}>
      <div className="cel-card">
        {medal ? <Medal n={21} size={96} /> : <span className="cel-7">7</span>}
        <h2>{medal ? 'Medal earned!' : 'One week strong!'}</h2>
        <p>{hit.name}: {hit.st.run} days in a row.{medal ? '' : ' Next stop: 21 days and a medal.'}</p>
        <button className="btn">Keep going</button>
      </div>
    </div>
  );
}

/** Only shows once you've earned a medal. */
function Medals({ list }) {
  const won = list.filter(({ st }) => st?.medals > 0);
  if (!won.length) return null;
  return (
    <section className="card medals">
      <div className="row-h"><h3>Medals</h3><span className="sub">21 days in a row = 1 medal</span></div>
      <div className="md-row">{won.map(({ task, name, st }) => (
        <div key={task.id} className="md"><Medal n={21} size={40} /><b>{name}</b><span>×{st.medals} · best {st.best} days</span></div>
      ))}</div>
    </section>
  );
}

/** Last night's sleep and this morning's weight, one tap to log either. */
function BodyStrip() {
  const { S, today, calc, open } = useStore();
  const c = calc(today), t = S.targets;
  const lastW = Object.keys(S.days).sort().reverse().map((k) => [k, S.days[k].log?.weight]).find(([, w]) => w != null);
  const sc = c.log.sleep_score;
  const sp = c.sleep ? Math.min(1, c.sleep / (t.sleep || 8)) : 0;
  return (
    <section className="body-strip">
      <button className={`bs-tile sleep${c.sleep ? '' : ' empty'}`} onClick={() => open('sleep')}>
        <span className="bs-ic"><Icon name="moon" size={18} /></span>
        <span className="bs-b"><span className="bs-l">Sleep</span>
          {c.sleep ? <b>{c.sleep}<small> h</small>{sc != null && <em className={sc >= 80 ? 'good' : sc >= 60 ? 'ok' : 'bad'}>{sc}</em>}</b> : <b className="bs-add">Log sleep</b>}
          <span className="bs-s">{c.log.wake_time ? `up at ${c.log.wake_time.slice(0, 5)}` : c.sleep ? `of ${t.sleep} h` : 'last night'}</span></span>
        {c.sleep > 0 && <span className="bs-bar"><i style={{ width: `${sp * 100}%` }} /></span>}
      </button>
      <button className={`bs-tile weight${c.weight != null ? '' : ' empty'}`} onClick={() => open('weightPage')}>
        <span className="bs-ic"><Icon name="scale" size={18} /></span>
        <span className="bs-b"><span className="bs-l">Weight</span>
          {c.weight != null ? <b>{c.weight.toFixed(1)}<small> kg</small></b> : <b className="bs-add">Weigh in</b>}
          <span className="bs-s">{c.weight != null ? 'today' : lastW ? `last ${Number(lastW[1]).toFixed(1)} kg` : 'before breakfast'}</span></span>
      </button>
    </section>
  );
}

export default function Home() {
  const { S, today, calc, open } = useStore();
  const c = calc(today), t = S.targets;
  const sts = habitStreaks(S, today);
  const list = c.scored.map((x) => ({ ...x, name: taskName(x.task, t), st: sts[x.task.id] && { ...sts[x.task.id], id: x.task.id } }));
  const sorted = [...list].sort((a, b) => (a.credit >= 0.999) - (b.credit >= 0.999) || a.task.sort - b.task.sort);
  const doneN = list.filter((x) => x.credit >= 0.999).length;
  const perfect = streak(S, today);
  const days = lastN(7, parse(today));
  const msg = !list.length ? 'Add a habit to start.' : doneN === list.length ? 'Everything done. Perfect day!' : list.length - doneN === 1 ? 'One left. Finish it.' : doneN ? `${list.length - doneN} left today.` : 'Start with the easiest one.';
  const R = 40, C = 2 * Math.PI * R;

  return (
    <>
      <Alerts k={today} />
      <section className={`card hb-hero${doneN === list.length && list.length ? ' perfect' : ''}`}>
        <span className="hb-ring">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r={R} className="sr-trk" />
            {c.score > 0.001 && <circle cx="50" cy="50" r={R} className="sr-arc" strokeDasharray={`${(Math.min(1, c.score) * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 50 50)" />}
          </svg>
          <b>{doneN}<small>/{list.length}</small></b>
        </span>
        <div className="hb-b">
          <div className="hb-msg">{msg}</div>
          <div className="sub">Day score {pct(c.score)}{perfect ? ` · ${perfect} perfect day${perfect > 1 ? 's' : ''} in a row` : ''}</div>
          <div className="hb-week">{days.map((k) => {
            const s = calc(k).score;
            return (
              <button key={k} className={`${k === today ? 'today ' : ''}${s >= 0.999 ? 'full' : s >= 0.5 ? 'half' : s > 0 ? 'low' : ''}`} onClick={() => open('day', { k })} aria-label={`${k}: ${pct(s)}`}>
                <i style={{ '--p': Math.min(1, s) }} /><span>{DOW[parse(k).getDay()][0]}</span>
              </button>
            );
          })}</div>
        </div>
      </section>

      <BodyStrip />

      <section className="hb-list" aria-label="Today's habits">
        {sorted.map((x) => <HabitRow key={x.task.id} task={x.task} credit={x.credit} st={x.st} />)}
        <button className="hb-add" onClick={() => open('task')}><Icon name="check" size={16} /> Add a habit</button>
      </section>

      <Medals list={list} />
      <Celebrate list={list} />
    </>
  );
}

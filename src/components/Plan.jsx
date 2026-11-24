// Workout plan: today's session as a checklist you follow, and the 4-week calendar.
import { useStore } from '../store.jsx';
import { Check, fmt } from './ui.jsx';
import { Icon, IconTile } from './Icons.jsx';
import { DOW, addDays, key, parse } from '../lib/dates.js';
import { EX } from '../lib/art.js';

export const KIND = {
  strength: { icon: 'dumbbell', tone: 'teal', label: 'Strength' },
  class: { icon: 'dumbbell', tone: 'violet', label: 'Class' },
  cardio: { icon: 'shoe', tone: 'blue', label: 'Cardio' },
  mobility: { icon: 'lotus', tone: 'green', label: 'Mobility' },
  rest: { icon: 'moon', tone: 'slate', label: 'Rest' },
};

/** Old plans stored plain steps; give them a picture too. */
const guessAct = (i) => i.act || (/warm/i.test(i.name) ? 'jumping-jack' : /tread|run|jog|interval/i.test(i.name) ? 'jog' : /incline/i.test(i.name) ? 'incline'
  : /walk|steps/i.test(i.name) ? 'walk' : /stretch|mobil/i.test(i.name) ? 'hamstring' : /yoga/i.test(i.name) ? 'tree' : /plank|core/i.test(i.name) ? 'plank'
  : /squat|lunge|leg/i.test(i.name) ? 'squat' : /press|bench|curl/i.test(i.name) ? 'press' : /row|pull/i.test(i.name) ? 'row' : /class|cult/i.test(i.name) ? 'class' : 'kb-swing');
const TONE_OF = { 'jumping-jack': 'amber', jog: 'blue', incline: 'blue', walk: 'blue', steps: 'blue', hamstring: 'green', tree: 'green', plank: 'violet', sleep: 'violet', class: 'pink' };
const toneOf = (act) => TONE_OF[act] || 'orange';

/** Today's (or any day's) plan: a few big activity cards. Tap one for what to do; tick it when done. */
export function PlanCard({ k, compact }) {
  const { S, today, A, open } = useStore();
  const p = S.plan?.[k];
  if (!p) return compact ? null : <div className="empty">No plan for this day.</div>;
  const K = KIND[p.kind] || KIND.strength;
  const items = p.items || [], checked = p.checked || [];
  const n = items.filter((i) => checked.includes(i.id)).length;
  const done = p.status === 'done', skipped = p.status === 'skipped';
  const next = items.find((i) => !checked.includes(i.id));
  const label = k === today ? 'Today' : parse(k).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
  const focus = items.find((i) => /^Focus:/i.test(i.focus || ''))?.focus.replace(/^Focus:\s*/i, '').split(/[.(·]/)[0].trim();
  const summary = items.filter((i) => i.minutes > 0).map((i) => `${i.minutes}m ${i.name.toLowerCase()}`).join(' · ');

  if (compact) {
    return (
      <button className={`plan-mini ${done ? 'done' : ''}`} onClick={() => open('planDay', { k })}>
        <span className={`pm-art t-${toneOf(guessAct(next || items[0] || {}))}`}><img src={EX(guessAct(next || items[0] || {}))} alt="" /></span>
        <span className="pm-b"><span className="pm-t">{done ? 'Done · ' : ''}{p.title}</span>
          <span className="pm-m">{done ? 'Logged' : next ? `Next: ${next.minutes ? `${next.minutes} min ` : ''}${next.name.toLowerCase()}` : 'Tap to finish'}</span></span>
        <span className="pm-n">{done ? <Icon name="check" size={18} /> : `${n}/${items.length}`}</span>
      </button>
    );
  }
  return (
    <section className={`card plan2 ${p.kind}${done ? ' is-done' : ''}${skipped ? ' is-skip' : ''}`}>
      <div className="p2-h">
        <div className="grow">
          <div className="eyebrow">{label}{p.place ? ` · ${p.place}` : ''}</div>
          <h3>{p.title}</h3>
          {focus && <span className="p2-focus">Focus: {focus}</span>}
        </div>
        <div className="p2-tot"><b>{p.minutes || items.reduce((a, i) => a + (i.minutes || 0), 0)}</b><span>min</span>{p.kcal > 0 && <small>~{fmt(p.kcal)} kcal</small>}</div>
      </div>
      {p.note && <div className="p2-note"><Icon name="flag" size={14} />{p.note}</div>}
      <div className={`p2-cards n${Math.min(items.length, 4)}`}>{items.map((i) => {
        const on = checked.includes(i.id) || done, act = guessAct(i);
        return (
          <div key={i.id} className={`act t-${toneOf(act)}${on ? ' on' : ''}${!done && next?.id === i.id ? ' next' : ''}`}>
            <button className="act-main" onClick={() => open('planAct', { k, id: i.id })} aria-label={`${i.name}: see exercises`}>
              <img src={EX(act)} alt="" />
              <span className="act-min">{i.minutes ? <>{i.minutes}<small>min</small></> : <small>today</small>}</span>
              <span className="act-n">{i.name}</span>
              {i.focus && <span className="act-f">{i.focus.replace(/^Focus:\s*/i, '')}</span>}
            </button>
            <button className="act-tick" onClick={() => !done && A.togglePlanItem(k, i.id)} aria-pressed={on} aria-label={on ? `Untick ${i.name}` : `Mark ${i.name} done`} disabled={done}><Check /></button>
          </div>
        );
      })}</div>
      {!done && summary && <p className="hint p2-hint">Tap a card for exercises. Tick it when it's done.</p>}
      {done ? (
        <div className="btn-row"><span className="sub">Logged to your workouts.</span><button className="link" onClick={() => A.reopenPlan(k)}>Undo</button></div>
      ) : k <= today && (
        <div className="btn-row">
          <button className="btn" onClick={() => A.completePlan(k)}>{p.kind === 'rest' ? 'Rest day done' : n === items.length ? 'Done · log it' : n ? `Log ${n} done` : 'Finish & log'}</button>
          {skipped ? <button className="btn ghost sm" onClick={() => A.reopenPlan(k)}>Unskip</button>
            : <button className="btn ghost sm" onClick={() => A.skipPlan(k)}>Skip</button>}
        </div>
      )}
    </section>
  );
}

/** One activity: what to do, with a picture per exercise. */
export function PlanActSheet({ k, id }) {
  const { S, A, close } = useStore();
  const p = S.plan?.[k], i = p?.items?.find((x) => x.id === id);
  if (!i) return <h2>Not found</h2>;
  const act = guessAct(i), on = (p.checked || []).includes(id) || p.status === 'done';
  const tips = i.tips?.length ? i.tips : i.detail ? [{ ex: act, name: i.name, how: i.detail }] : [];
  return (
    <>
      <div className={`pa-hero t-${toneOf(act)}`}>
        <img src={EX(act)} alt="" />
        <div><div className="eyebrow">{p.title}</div><h2>{i.name}</h2>
          <span className="pa-m">{i.minutes ? `${i.minutes} min` : 'Through the day'}{i.kcal ? ` · ~${fmt(i.kcal)} kcal` : ''}</span></div>
      </div>
      {i.focus && <p className="pa-focus">{i.focus}</p>}
      <div className="pa-list">{tips.map((t, j) => (
        <div key={j} className="pa-ex"><span className={`pa-img t-${toneOf(t.ex)}`}><img src={EX(t.ex)} alt="" /></span>
          <span className="pa-b"><b>{t.name}</b><span>{t.how}</span></span></div>
      ))}</div>
      {p.status !== 'done' && <button className={`btn${on ? ' ghost' : ''}`} onClick={async () => { await A.togglePlanItem(k, id); if (!on) close(); }}>{on ? 'Not done yet' : 'Mark done'}</button>}
    </>
  );
}

/** 4-week calendar of planned sessions. */
export function PlanCalendar() {
  const { S, today, open } = useStore();
  const ks = Object.keys(S.plan || {}).sort();
  if (!ks.length) return null;
  const start = parse(ks[0]);
  const mon = addDays(start, -((start.getDay() + 6) % 7));
  const end = parse(ks[ks.length - 1]);
  const weeks = [];
  for (let w = mon; w <= end; w = addDays(w, 7)) weeks.push(Array.from({ length: 7 }, (_, i) => key(addDays(w, i))));
  const doneCount = ks.filter((k) => S.plan[k].status === 'done').length;
  const dueCount = ks.filter((k) => k <= today).length;
  return (
    <section className="card">
      <div className="row-h"><h3>4-week plan</h3><span className="sub">{doneCount} of {dueCount} done so far</span></div>
      <div className="pcal">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((h, i) => <span key={i} className="h">{h}</span>)}
        {weeks.flat().map((k) => {
          const p = S.plan[k];
          if (!p) return <span key={k} />;
          const K = KIND[p.kind] || KIND.strength;
          const st = p.status === 'done' ? 'done' : p.status === 'skipped' ? 'skip' : k < today ? 'missed' : k === today ? 'today' : 'up';
          return (
            <button key={k} className={`pday t-${K.tone} ${st}`} onClick={() => open('planDay', { k })} aria-label={`${parse(k).getDate()}: ${p.title}`}>
              <span className="pd-d">{parse(k).getDate()}</span>
              {st === 'done' ? <span className="pd-ok"><Check /></span> : <Icon name={K.icon} size={15} />}
            </button>
          );
        })}
      </div>
      <div className="pkey">{Object.values(KIND).map((K) => <span key={K.label}><i className={`t-${K.tone}`} />{K.label}</span>)}</div>
    </section>
  );
}

export function PlanDaySheet({ k }) {
  const { S } = useStore();
  const p = S.plan?.[k];
  return <>{!p && <h2>{DOW[parse(k).getDay()]}</h2>}<PlanCard k={k} /></>;
}

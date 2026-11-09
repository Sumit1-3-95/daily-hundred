// Workout plan: today's session as a checklist you follow, and the 4-week calendar.
import { useStore } from '../store.jsx';
import { Check, fmt } from './ui.jsx';
import { Icon, IconTile } from './Icons.jsx';
import { DOW, addDays, key, parse } from '../lib/dates.js';

export const KIND = {
  strength: { icon: 'dumbbell', tone: 'teal', label: 'Strength' },
  class: { icon: 'dumbbell', tone: 'violet', label: 'Class' },
  cardio: { icon: 'shoe', tone: 'blue', label: 'Cardio' },
  mobility: { icon: 'lotus', tone: 'green', label: 'Mobility' },
  rest: { icon: 'moon', tone: 'slate', label: 'Rest' },
};

/** Today's (or any day's) plan: tick each step as you go, then Done logs the workout. */
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

  if (compact) {
    return (
      <button className={`plan-mini ${done ? 'done' : ''}`} onClick={() => open('planDay', { k })}>
        <IconTile name={K.icon} size="sm" tone={done ? 'teal' : K.tone} />
        <span className="pm-b"><span className="pm-t">{done ? 'Done · ' : 'Plan · '}{p.title}</span>
          <span className="pm-m">{done ? 'Logged' : next ? `Next: ${next.name}` : 'Tap to finish'}</span></span>
        <span className="pm-n">{done ? <Icon name="check" size={18} /> : `${n}/${items.length}`}</span>
      </button>
    );
  }
  return (
    <section className={`card plan ${p.kind}${done ? ' is-done' : ''}${skipped ? ' is-skip' : ''}`}>
      <div className="plan-h">
        <IconTile name={K.icon} tone={done ? 'teal' : K.tone} />
        <div className="grow"><div className="eyebrow">{label}{p.place ? ` · ${p.place}` : ''}</div><h3>{p.title}</h3></div>
        <span className="plan-n">{done ? <Icon name="check" size={20} /> : `${n}/${items.length}`}</span>
      </div>
      <div className="chips">
        {p.minutes > 0 && <span className="badge"><Icon name="target" size={13} />{p.minutes} min</span>}
        {p.kcal > 0 && <span className="badge fire"><Icon name="fire" size={13} />~{fmt(p.kcal)} kcal</span>}
        {p.note && <span className="badge">{p.note}</span>}
      </div>
      <div className="steps">{items.map((i) => {
        const on = checked.includes(i.id), isNext = !done && next?.id === i.id;
        return (
          <button key={i.id} className={`step${on ? ' on' : ''}${isNext ? ' next' : ''}`} onClick={() => !done && A.togglePlanItem(k, i.id)} aria-pressed={on} disabled={done}>
            <span className="ibox"><Check /></span>
            <span className="st-b"><span className="st-n">{i.name}</span>{i.detail && <span className="st-d">{i.detail}</span>}</span>
          </button>
        );
      })}</div>
      {done ? (
        <div className="btn-row"><span className="sub">Logged to your workouts.</span><button className="link" onClick={() => A.reopenPlan(k)}>Undo</button></div>
      ) : k <= today && (
        <div className="btn-row">
          <button className="btn" onClick={() => A.completePlan(k)}>{p.kind === 'rest' ? 'Rest day done' : n === items.length ? 'Done · log it' : 'Finish & log'}</button>
          {skipped ? <button className="btn ghost sm" onClick={() => A.reopenPlan(k)}>Unskip</button>
            : <button className="btn ghost sm" onClick={() => A.skipPlan(k)}>Skip</button>}
        </div>
      )}
    </section>
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

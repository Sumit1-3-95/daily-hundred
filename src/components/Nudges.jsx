// In-app nudges on Home. The same blocks open in a sheet when you tap a push notification.
// Sleep is split: bedtime is logged when you close the day at night, wake time in the morning.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { addDays, key, parse, sleepHours } from '../lib/dates.js';
import { Check, Field, fmt } from './ui.jsx';
import { Icon, IconTile } from './Icons.jsx';

const DK = (k) => `dh.dismiss.${k}`;
const getDismissed = (k) => { try { return JSON.parse(localStorage.getItem(DK(k))) || []; } catch { return []; } };
const addDismissed = (k, id) => { try { localStorage.setItem(DK(k), JSON.stringify([...getDismissed(k), id])); } catch { /* ignore */ } };
const nowHHMM = () => { const d = new Date(); const m = Math.round(d.getMinutes() / 5) * 5; d.setMinutes(m); return d.toTimeString().slice(0, 5); };
const yesterday = (k) => key(addDays(parse(k), -1));

export function routineTasks(S, c) {
  return c.scored.filter((s) => s.task.type === 'checklist' && S.lists.find((l) => l.id === s.task.list_id)?.kind === 'routine');
}

/** Morning: wake time. Uses last night's bedtime (logged when you closed the day) to work out sleep. */
export function WakeBlock({ k, onDone }) {
  const { A, calc } = useStore();
  const log = calc(k).log;
  const bedLogged = calc(yesterday(k)).log.bed_time?.slice(0, 5);
  const [bed, setBed] = useState(bedLogged || '23:00');
  const [wake, setWake] = useState(log.wake_time?.slice(0, 5) || nowHHMM());
  const h = sleepHours(bed, wake);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      if (!bedLogged) await A.saveDay(yesterday(k), { bed_time: bed });
      await A.saveDay(k, { wake_time: wake, sleep_hours: h });
      onDone?.();
    }}>
      {bedLogged
        ? <p className="hint"><Icon name="moon" size={14} /> You went to bed at <b>{bedLogged}</b> last night.</p>
        : <Field label="Went to bed last night" id="nbed"><input id="nbed" type="time" value={bed} onChange={(e) => setBed(e.target.value)} required /></Field>}
      <Field label="Woke up at" id="nwake"><input id="nwake" type="time" value={wake} onChange={(e) => setWake(e.target.value)} required /></Field>
      <button className="btn">Save · {h ?? '–'} h sleep</button>
    </form>
  );
}

export function WeightBlock({ k, onDone }) {
  const { A, calc, S } = useStore();
  const last = Object.keys(S.days).sort().reverse().map((d) => S.days[d].log?.weight).find((w) => w != null);
  const [w, setW] = useState(calc(k).weight ?? last ?? '');
  return (
    <form className="inline" onSubmit={async (e) => { e.preventDefault(); await A.saveDay(k, { weight: Math.round(Number(w) * 10) / 10 }); onDone?.(); }}>
      <IconTile name="scale" />
      <Field label="Weight (kg)" id="nw"><input id="nw" type="number" inputMode="decimal" step="0.1" min="30" max="250" value={w} onChange={(e) => setW(e.target.value)} required /></Field>
      <button className="btn sm">Save</button>
    </form>
  );
}

export function WaterButtons({ k, compact }) {
  const { A } = useStore();
  return (
    <div className={`water-btns${compact ? ' compact' : ''}`}>
      <button onClick={() => A.addWater(k, 250)}><Icon name="water" size={compact ? 16 : 20} /><span>+250 ml</span>{!compact && <small>glass</small>}</button>
      <button onClick={() => A.addWater(k, 500)}><Icon name="bottle" size={compact ? 16 : 20} /><span>+500 ml</span>{!compact && <small>bottle</small>}</button>
      <button onClick={() => A.addWater(k, 1000)}><Icon name="bottle" size={compact ? 16 : 20} /><span>+1 L</span>{!compact && <small>big bottle</small>}</button>
      <button className="undo" onClick={() => A.addWater(k, -250)} aria-label="Undo 250 ml"><span>Undo</span>{!compact && <small>−250 ml</small>}</button>
    </div>
  );
}

export function WaterBlock({ k, onDone }) {
  const { A, calc, S } = useStore();
  const c = calc(k);
  const [total, setTotal] = useState('');
  return (
    <>
      <div className="inline" style={{ alignItems: 'center' }}>
        <Glass p={c.water / S.targets.water} size={56} />
        <p className="hint" style={{ flex: 1 }}>So far <b>{(c.water / 1000).toFixed(2)} L</b> of {S.targets.water / 1000} L</p>
      </div>
      <WaterButtons k={k} />
      <form className="inline" onSubmit={async (e) => { e.preventDefault(); await A.saveDay(k, { water_ml: Math.round(Number(total) * 1000) }); setTotal(''); onDone?.(); }}>
        <Field label="Or set today's total (L)" id="nwt"><input id="nwt" type="number" inputMode="decimal" step="0.05" min="0" max="10" value={total} onChange={(e) => setTotal(e.target.value)} required /></Field>
        <button className="btn sm ghost">Set total</button>
      </form>
    </>
  );
}

/** A glass that fills up. p = 0..1+ */
export function Glass({ p, size = 120 }) {
  const fill = Math.max(0, Math.min(1, p || 0));
  const top = 8 + (1 - fill) * 84;
  const id = `g${size}`;
  return (
    <svg className="glass" width={size * 0.8} height={size} viewBox="0 0 80 100" role="img" aria-label={`${Math.round(fill * 100)}% of water target`}>
      <defs><clipPath id={id}><path d="M10 6h60l-7 86a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4z" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x="0" y="0" width="80" height="100" className="glass-bg" />
        {fill > 0 && <path className="glass-water" d={`M0 ${top} q10 -5 20 0 t20 0 t20 0 t20 0 V100 H0z`} />}
        {fill > 0.15 && <><circle className="glass-bubble" cx="30" cy={Math.min(88, top + 18)} r="2" /><circle className="glass-bubble" cx="48" cy={Math.min(90, top + 30)} r="1.5" /></>}
      </g>
      <path className="glass-line" d="M10 6h60l-7 86a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4z" />
      {[0.25, 0.5, 0.75].map((m) => <path key={m} className="glass-tick" d={`M${64 - m * 0} ${8 + (1 - m) * 84}h-6`} />)}
    </svg>
  );
}

export function RoutineBlock({ k }) {
  const { S, A, calc } = useStore();
  const c = calc(k);
  const rts = routineTasks(S, c);
  if (!rts.length) return <p className="hint">No routine is scheduled today. Create a routine list in Lists, then add it as a checklist task.</p>;
  return rts.map(({ task }) => {
    const tl = c.d.tlogs[task.id] || {};
    const items = S.items.filter((i) => i.list_id === task.list_id);
    return (
      <div key={task.id} className="subitems" style={{ paddingLeft: 0 }}>
        {items.map((i) => {
          const on = (tl.items || []).includes(i.id);
          return (
            <button key={i.id} className={`subitem${on ? ' on' : ''}`} onClick={() => A.toggleChecklistItem(k, task, i.id)} aria-pressed={on}>
              <span className="box"><Check /></span><span>{i.text}</span>
            </button>
          );
        })}
      </div>
    );
  });
}

/** Night: confirm the day's numbers, note bedtime, close the day. */
export function CloseBlock({ k, onDone }) {
  const { A, calc, S } = useStore();
  const c = calc(k);
  const [bed, setBed] = useState(c.log.bed_time?.slice(0, 5) || nowHHMM());
  return (
    <>
      <div className="close-sum">
        <div><IconTile name="calories" size="sm" /><span>Eaten</span><b>{fmt(c.eaten)}</b></div>
        <div><IconTile name="fire" size="sm" /><span>Burned</span><b>{fmt(c.burned)}</b></div>
        <div><IconTile name="target" size="sm" /><span>Deficit</span><b>{fmt(c.deficit)}</b></div>
        <div><IconTile name="bolt" size="sm" /><span>Protein</span><b>{fmt(c.protein)} g</b></div>
      </div>
      <p className="hint">If all your meals are logged, close the day to lock in the deficit (target {S.targets.deficit} kcal).</p>
      <Field label="Going to bed at" id="nbt"><input id="nbt" type="time" value={bed} onChange={(e) => setBed(e.target.value)} /></Field>
      <button className="btn" onClick={async () => { if (await A.closeDay(k)) { if (bed) await A.saveDay(k, { bed_time: bed }); onDone?.(); } }}>
        Close the day and sign off
      </button>
    </>
  );
}

/** Which nudges to show on Home right now. */
function dueNudges(S, c, hour) {
  const t = S.targets, out = [];
  const rts = routineTasks(S, c);
  if (hour >= 5 && hour < 13 && !c.log.wake_time && !c.log.sleep_hours) out.push(['wake', 'sun', 'Good morning. What time did you wake up?']);
  if (hour >= 5 && hour < 12 && c.weight == null) out.push(['weight', 'scale', 'Morning weigh-in']);
  if (hour >= 8 && rts.some((r) => r.credit < 0.999)) out.push(['routine', 'list', 'Is your morning routine done?']);
  if (hour >= 21 && !c.closed) out.push(['close', 'moon', 'Ready to sign off for the day?']);
  return out;
}

export default function NudgeCards({ k }) {
  const { S, calc, track } = useStore();
  const [, force] = useState(0);
  const c = calc(k);
  const dismissed = getDismissed(k);
  const list = dueNudges(S, c, new Date().getHours()).filter(([id]) => !dismissed.includes(id)).slice(0, 2);
  if (!list.length) return null;
  const Block = { wake: WakeBlock, weight: WeightBlock, routine: RoutineBlock, close: CloseBlock };
  return list.map(([id, icon, title]) => {
    const B = Block[id];
    return (
      <section key={id} className="card nudge">
        <div className="row-h"><div className="nudge-h"><IconTile name={icon} size="sm" /><h3>{title}</h3></div>
          <button className="x" onClick={() => { addDismissed(k, id); track('nudge_dismissed', { id }); force((n) => n + 1); }}>Later</button></div>
        <B k={k} />
      </section>
    );
  });
}

/** Short "do this now" list for the top of Home. Each line opens the right log. */
export function Alerts({ k }) {
  const { S, calc, open } = useStore();
  const [, force] = useState(0);
  const c = calc(k);
  const h = new Date().getHours();
  const dismissed = getDismissed(k);
  const ate = (m) => c.d.food.some((f) => f.meal === m);
  const rts = routineTasks(S, c);
  const list = [];
  if (h >= 5 && !c.log.wake_time && !c.log.sleep_hours) list.push(['wake', 'sun', 'Add your wake-up time', 'sleep']);
  if (h >= 5 && h < 12 && c.weight == null) list.push(['weight', 'scale', 'Weigh in before breakfast', 'weight']);
  if (h >= 8 && rts.some((r) => r.credit < 0.999)) list.push(['routine', 'list', 'Finish your morning routine', 'routine']);
  // only the latest meal that's missing, so the list stays short
  const missing = [[21, 'Dinner'], [15, 'Lunch'], [10, 'Breakfast']].find(([hr, m]) => h >= hr && !ate(m));
  if (missing) list.push([`meal-${missing[1]}`, 'thali', `Log your ${missing[1].toLowerCase()}`, 'logFood']);
  if (h >= 21 && !c.closed) list.push(['close', 'moon', 'Sign off and close the day', 'closeDay']);
  const show = list.filter(([id]) => !dismissed.includes(id)).slice(0, 3);
  if (!show.length) return null;
  return (
    <section className="alerts" aria-label="To do now">
      {show.map(([id, ic, text, sheet]) => (
        <div className="alert" key={id}>
          <button className="alert-main" onClick={() => open(sheet)}><IconTile name={ic} size="sm" /><span>{text}</span><span className="chev" aria-hidden="true">›</span></button>
          <button className="alert-x" onClick={() => { addDismissed(k, id); force((n) => n + 1); }} aria-label={`Hide: ${text}`}>×</button>
        </div>
      ))}
    </section>
  );
}

// In-app nudges on Home. The same blocks open in a sheet when you tap a push notification.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { sleepHours } from '../lib/dates.js';
import { Check, Field, fmt } from './ui.jsx';

const DK = (k) => `dh.dismiss.${k}`;
const getDismissed = (k) => { try { return JSON.parse(localStorage.getItem(DK(k))) || []; } catch { return []; } };
const addDismissed = (k, id) => { try { localStorage.setItem(DK(k), JSON.stringify([...getDismissed(k), id])); } catch { /* ignore */ } };

export function routineTasks(S, c) {
  return c.scored.filter((s) => s.task.type === 'checklist' && S.lists.find((l) => l.id === s.task.list_id)?.kind === 'routine');
}

export function SleepBlock({ k, onDone }) {
  const { A, calc } = useStore();
  const log = calc(k).log;
  const [bed, setBed] = useState(log.bed_time?.slice(0, 5) || '23:00');
  const [wake, setWake] = useState(log.wake_time?.slice(0, 5) || '06:45');
  const h = sleepHours(bed, wake);
  return (
    <form onSubmit={async (e) => { e.preventDefault(); await A.saveDay(k, { bed_time: bed, wake_time: wake, sleep_hours: h }); onDone?.(); }}>
      <div className="two">
        <Field label="Went to bed" id="nbed"><input id="nbed" type="time" value={bed} onChange={(e) => setBed(e.target.value)} required /></Field>
        <Field label="Woke up" id="nwake"><input id="nwake" type="time" value={wake} onChange={(e) => setWake(e.target.value)} required /></Field>
      </div>
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
      <Field label="Weight (kg)" id="nw"><input id="nw" type="number" inputMode="decimal" step="0.1" min="30" max="250" value={w} onChange={(e) => setW(e.target.value)} required /></Field>
      <button className="btn sm">Save</button>
    </form>
  );
}

export function WaterBlock({ k, onDone }) {
  const { A, calc, S } = useStore();
  const c = calc(k);
  const [total, setTotal] = useState('');
  return (
    <>
      <p className="hint">So far: <b>{(c.water / 1000).toFixed(2)} L</b> of {S.targets.water / 1000} L</p>
      <div className="chips">
        {[250, 500, 750].map((ml) => <button key={ml} className="chip" onClick={() => A.addWater(k, ml)}>+ {ml} ml</button>)}
        <button className="chip" onClick={() => A.addWater(k, -250)}>Undo 250</button>
      </div>
      <form className="inline" onSubmit={async (e) => { e.preventDefault(); await A.saveDay(k, { water_ml: Math.round(Number(total) * 1000) }); setTotal(''); onDone?.(); }}>
        <Field label="Or set today's total (L)" id="nwt"><input id="nwt" type="number" inputMode="decimal" step="0.05" min="0" max="10" value={total} onChange={(e) => setTotal(e.target.value)} required /></Field>
        <button className="btn sm ghost">Set total</button>
      </form>
    </>
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
        <div className="qp-h">{task.name}</div>
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

export function CloseBlock({ k, onDone }) {
  const { A, calc, S } = useStore();
  const c = calc(k);
  return (
    <>
      <p className="hint">Eaten {fmt(c.eaten)} kcal and {fmt(c.protein)} g protein. Burned {fmt(c.burned)} kcal. If that's everything, close the day to lock in a {fmt(c.deficit)} kcal deficit (target {S.targets.deficit}).</p>
      <button className="btn" onClick={async () => { if (await A.closeDay(k)) onDone?.(); }}>Close the day</button>
    </>
  );
}

/** Which nudges to show on Home right now. */
function dueNudges(S, c, hour) {
  const t = S.targets, out = [];
  const rts = routineTasks(S, c);
  if (hour >= 5 && hour < 14 && !c.log.sleep_hours) out.push(['sleep', 'Good morning. When did you sleep and wake up?']);
  if (hour >= 5 && hour < 12 && c.weight == null) out.push(['weight', 'Morning weigh-in']);
  if (hour >= 8 && rts.some((r) => r.credit < 0.999)) out.push(['routine', 'Is your morning routine done?']);
  const pace = t.water * Math.min(1, Math.max(0, (hour - 7) / 14));
  if (hour >= 11 && c.water < pace) out.push(['water', `Water check: ${(c.water / 1000).toFixed(2)} L so far`]);
  if (hour >= 21 && !c.closed) out.push(['close', 'Ready to close the day?']);
  return out;
}

export default function NudgeCards({ k }) {
  const { S, calc, track } = useStore();
  const [, force] = useState(0);
  const c = calc(k);
  const dismissed = getDismissed(k);
  const list = dueNudges(S, c, new Date().getHours()).filter(([id]) => !dismissed.includes(id)).slice(0, 2);
  if (!list.length) return null;
  const Block = { sleep: SleepBlock, weight: WeightBlock, routine: RoutineBlock, water: WaterBlock, close: CloseBlock };
  return list.map(([id, title]) => {
    const B = Block[id];
    return (
      <section key={id} className="card nudge">
        <div className="row-h"><h3>{title}</h3>
          <button className="x" onClick={() => { addDismissed(k, id); track('nudge_dismissed', { id }); force((n) => n + 1); }}>Later</button></div>
        <B k={k} />
      </section>
    );
  });
}

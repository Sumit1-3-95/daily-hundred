// One task in the day plan. Tapping it does the obvious thing:
// tick it, open its steps, or open the log it depends on (water, food, workout, sleep, sign-off).
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { taskName } from '../lib/calc.js';
import { Check, fmt, progState } from './ui.jsx';
import { IconTile } from './Icons.jsx';

const AUTO_ICON = { workout: 'dumbbell', protein: 'bolt', water: 'water', sleep: 'moon', closed: 'flag', deficit: 'target', calories: 'calories', burn: 'fire' };
export const AUTO_SHEET = { water: 'water', protein: 'logFood', calories: 'logFood', workout: 'logWorkout', burn: 'logWorkout', sleep: 'sleep', closed: 'closeDay', deficit: 'closeDay' };

export const taskIcon = (task) => task.icon || AUTO_ICON[task.auto_key]
  || (task.type === 'checklist' ? 'sun' : /read|book/i.test(task.name) ? 'book' : 'check');

export function autoMeta(task, c, t) {
  return ({
    workout: c.rest ? 'Rest day' : `${fmt(c.wMin)} of ${t.workoutMin} min`,
    protein: `${fmt(c.protein)} of ${t.protein} g`,
    water: `${(c.water / 1000).toFixed(2)} of ${t.water / 1000} L`,
    sleep: c.sleep ? `${c.sleep} of ${t.sleep} h` : 'Log your wake-up time',
    closed: c.closed ? 'Day closed' : 'Tonight: log meals and sign off',
    deficit: c.closed ? `${fmt(c.deficit)} of ${t.deficit} kcal` : `${fmt(c.shownD)} kcal projected · counts at sign-off`,
    calories: `${fmt(c.eaten)} of ${fmt(t.kcal)} kcal${c.closed ? '' : ' · counts at sign-off'}`,
    burn: `${fmt(c.active)} of ${t.activeKcal} active kcal`,
  })[task.auto_key];
}

/** Small ring that fills with the task's progress; shows the points it's worth. */
function PointsRing({ credit, weight }) {
  const r = 14, C = 2 * Math.PI * r, done = credit >= 0.999;
  return (
    <span className={`pring${done ? ' done' : ''}`} aria-label={done ? 'Done' : `${Math.round(credit * 100)}% · worth ${weight} points`}>
      <svg viewBox="0 0 36 36" width="36" height="36">
        <circle cx="18" cy="18" r={r} className="pr-trk" />
        {credit > 0.001 && <circle cx="18" cy="18" r={r} className="pr-arc" strokeDasharray={`${(Math.min(1, credit) * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 18 18)" />}
      </svg>
      <span className="pr-txt">{done ? <Check /> : `+${weight}`}</span>
    </span>
  );
}

export default function TaskRow({ k, c, task, credit, manage, onEdit, defaultExpand = false }) {
  const { S, A, open } = useStore();
  const [expand, setExpand] = useState(defaultExpand);
  const tl = c.d.tlogs[task.id] || {};
  const done = credit >= 0.999;
  const t = S.targets;
  const name = taskName(task, t);
  const items = task.type === 'checklist' ? S.items.filter((i) => i.list_id === task.list_id) : [];
  const step = task.target >= 50 ? 10 : task.target >= 10 ? 5 : 1;
  const setNum = (v) => A.setTaskLog(k, task, { value: Math.max(0, v) });

  let meta = '';
  if (task.type === 'number') meta = `${tl.value || 0} of ${task.target} ${task.unit || ''}`;
  else if (task.type === 'checklist') meta = `${(tl.items || []).filter((id) => items.some((i) => i.id === id)).length} of ${items.length} steps`;
  else if (task.type === 'auto') meta = autoMeta(task, c, t);
  else meta = done ? 'Done' : 'Tap to tick off';

  const act = () => {
    if (manage) return onEdit(task);
    if (task.type === 'check') return A.setTaskLog(k, task, { done: !tl.done });
    if (task.type === 'number' && /read|book|page/i.test(task.name)) return open('books');
    if (task.type === 'checklist' || task.type === 'number') return setExpand((x) => !x);
    const sheet = AUTO_SHEET[task.auto_key];
    if (sheet) open(sheet);
  };

  return (
    <div className={`trow${done ? ' done' : ''}`}>
      <button className="tmain" onClick={act} aria-expanded={task.type === 'checklist' || task.type === 'number' ? expand : undefined}>
        <IconTile name={taskIcon(task)} size="sm" tone={done ? 'teal' : undefined} />
        <span className="t-body">
          <span className="t-name">{name}</span>
          <span className="t-meta">{meta}</span>
          <span className={`tbar ${progState(credit)}`}><i style={{ width: `${credit * 100}%` }} /></span>
        </span>
        {manage ? <span className="link">Edit</span> : <PointsRing credit={credit} weight={task.weight} />}
      </button>
      {expand && task.type === 'checklist' && (
        <div className="subitems">
          {items.map((i) => {
            const on = (tl.items || []).includes(i.id);
            return (
              <button key={i.id} className={`subitem${on ? ' on' : ''}`} onClick={() => A.toggleChecklistItem(k, task, i.id)} aria-pressed={on}>
                <span className="box"><Check /></span><span>{i.text}</span>
              </button>
            );
          })}
          {!items.length && <span className="sub">This list is empty. Add steps in Lists.</span>}
        </div>
      )}
      {expand && task.type === 'number' && (
        <div className="subitems num-edit">
          <div className="stepper">
            <button onClick={() => setNum((Number(tl.value) || 0) - step)} aria-label={`Minus ${step}`}>−</button>
            <span className="v">{tl.value || 0}</span>
            <button onClick={() => setNum((Number(tl.value) || 0) + step)} aria-label={`Plus ${step}`}>+</button>
          </div>
          <button className="btn sm" onClick={() => { setNum(task.target); setExpand(false); }}>All {task.target} done</button>
        </div>
      )}
    </div>
  );
}

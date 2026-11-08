import { useState } from 'react';
import { useStore } from '../store.jsx';
import { taskName } from '../lib/calc.js';
import { Check, fmt } from './ui.jsx';

function autoMeta(task, c, t) {
  return ({
    workout: `${c.wMin} / ${t.workoutMin} min from your workouts`,
    protein: `${fmt(c.protein)} / ${t.protein} g from your food log`,
    water: `${(c.water / 1000).toFixed(2)} / ${t.water / 1000} L logged`,
    sleep: c.sleep ? `${c.sleep} h logged` : 'Not logged yet',
    closed: c.closed ? 'Closed' : 'Close the day on Home tonight',
    deficit: c.closed ? `${fmt(c.deficit)} / ${t.deficit} kcal` : 'Counts once the day is closed',
  })[task.auto_key];
}

export default function TaskRow({ k, c, task, credit, manage, onEdit }) {
  const { S, A } = useStore();
  const [openList, setOpenList] = useState(false);
  const tl = c.d.tlogs[task.id] || {};
  const done = credit >= 0.999;
  const t = S.targets;
  const items = task.type === 'checklist' ? S.items.filter((i) => i.list_id === task.list_id) : [];
  const name = taskName(task, t);

  let ctrl, meta = '', right = null;
  if (task.type === 'check') {
    ctrl = <button className="chk" onClick={() => A.setTaskLog(k, task, { done: !tl.done })} aria-label={`Mark ${name} ${done ? 'not done' : 'done'}`}><Check /></button>;
  } else if (task.type === 'number') {
    ctrl = <span className="chk auto" aria-hidden="true"><Check /></span>;
    meta = `${tl.value || 0} / ${task.target} ${task.unit || ''}`;
    const step = task.target >= 50 ? 10 : task.target >= 10 ? 5 : 1;
    const set = (v) => A.setTaskLog(k, task, { value: Math.max(0, v) });
    right = (
      <div className="stepper">
        <button onClick={() => set((Number(tl.value) || 0) - step)} aria-label={`Minus ${step}`}>−</button>
        <span className="v">{tl.value || 0}</span>
        <button onClick={() => set((Number(tl.value) || 0) + step)} aria-label={`Plus ${step}`}>+</button>
      </div>
    );
  } else if (task.type === 'checklist') {
    const got = (tl.items || []).filter((id) => items.some((i) => i.id === id)).length;
    ctrl = <button className="chk" onClick={() => setOpenList((o) => !o)} aria-label={`Show ${name} steps`}><Check /></button>;
    meta = `${got} of ${items.length} steps`;
    right = <button className="expand" onClick={() => setOpenList((o) => !o)} aria-expanded={openList}>{openList ? 'Hide' : 'Steps'}</button>;
  } else {
    ctrl = <span className="chk auto" aria-hidden="true"><Check /></span>;
    meta = autoMeta(task, c, t);
    right = <span className="pill">auto</span>;
  }
  if (manage) right = <button className="link" onClick={() => onEdit(task)}>Edit</button>;

  return (
    <>
      <div className={`task${done ? ' done' : ''}`}>
        {ctrl}
        <div className="t-body">
          <div className="t-name">{name}{task.weight > 1 && <span className="weight-tag">×{task.weight}</span>}</div>
          {meta && <div className="t-meta">{meta}</div>}
        </div>
        {right}
      </div>
      {task.type === 'checklist' && openList && (
        <div className="subitems">
          {items.map((i) => {
            const on = (tl.items || []).includes(i.id);
            return (
              <button key={i.id} className={`subitem${on ? ' on' : ''}`} onClick={() => A.toggleChecklistItem(k, task, i.id)} aria-pressed={on}>
                <span className="box"><Check /></span><span>{i.text}</span>
              </button>
            );
          })}
          {!items.length && <span className="sub">This list is empty. Add steps in the Lists tab.</span>}
        </div>
      )}
    </>
  );
}

// Habits: recurring habit cards and one-time to-dos (laundry, chores) that roll over until done.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Check, progState } from './ui.jsx';
import { Icon, IconTile } from './Icons.jsx';
import { AUTO_SHEET, autoMeta, taskIcon } from './TaskRow.jsx';
import { taskName } from '../lib/calc.js';
import { DOW, parse } from '../lib/dates.js';

export const isReading = (t) => t.type === 'number' && /read|book|page/i.test(t.name);
const TONES = ['violet', 'teal', 'amber', 'blue', 'pink', 'green', 'orange'];
const toneFor = (t) => TONES[[...t.id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % TONES.length];

/** Tap to do it: ticks a habit, or opens its steps / counter / log. */
export function useTaskAct(k) {
  const { calc, A, open } = useStore();
  return (task) => {
    const tl = calc(k).d.tlogs[task.id] || {};
    if (task.type === 'check' || task.type === 'todo') return A.setTaskLog(k, task, { done: !tl.done });
    if (isReading(task)) return open('books');
    if (task.type === 'checklist' || task.type === 'number') return open('taskOne', { id: task.id });
    const sheet = AUTO_SHEET[task.auto_key];
    if (sheet) open(sheet);
  };
}

export function HabitCard({ k, task, credit, onEdit }) {
  const { S, calc } = useStore();
  const act = useTaskAct(k);
  const c = calc(k), tl = c.d.tlogs[task.id] || {};
  const done = credit >= 0.999, tone = toneFor(task);
  const its = task.type === 'checklist' ? S.items.filter((i) => i.list_id === task.list_id) : [];
  const meta = task.type === 'number' ? `${tl.value || 0} of ${task.target} ${task.unit || ''}`
    : task.type === 'checklist' ? `${Math.round(credit * its.length)} of ${its.length} steps`
    : task.type === 'auto' ? autoMeta(task, c, S.targets) : done ? 'Done' : 'Tap when done';
  return (
    <button className={`hcard t-${tone}${done ? ' done' : credit > 0 ? ' part' : ''}`} onClick={() => (onEdit ? onEdit(task) : act(task))}>
      <span className="hc-top">
        {task.image_url ? <img className="thumb md" src={task.image_url} alt="" /> : <span className="hc-ic"><Icon name={taskIcon(task)} size={22} /></span>}
        <span className="hc-pts">{done ? <span className="hc-ok"><Check /></span> : `+${task.weight}`}</span>
      </span>
      <span className="hc-n">{taskName(task, S.targets)}</span>
      <span className="hc-m">{onEdit ? 'Edit' : meta}</span>
      <span className={`hc-bar ${progState(credit)}`}><i style={{ width: `${credit * 100}%` }} /></span>
    </button>
  );
}

export function TodoRow({ k, task, credit, manage }) {
  const { A, S } = useStore();
  const act = useTaskAct(k);
  const done = credit >= 0.999;
  const from = task.carried_from && S.tasks.find((t) => t.id === task.carried_from);
  const fromDay = from?.on_day ? DOW[parse(from.on_day).getDay()] : null;
  return (
    <div className={`todo${done ? ' done' : ''}`}>
      <button className="td-main" onClick={() => act(task)} aria-pressed={done}>
        <span className="td-box"><Check /></span>
        <span className="td-n">{task.name}</span>
        {fromDay && !done && <span className="td-carry">from {fromDay}</span>}
        <span className="td-pts">+{task.weight}</span>
      </button>
      {manage && <button className="del" onClick={() => A.archiveTask(task.id)} aria-label={`Delete ${task.name}`}>×</button>}
    </div>
  );
}

export function TodoAdd({ k }) {
  const { A } = useStore();
  const [text, setText] = useState('');
  const [w, setW] = useState(1);
  return (
    <form className="todo-add" onSubmit={async (e) => { e.preventDefault(); const v = text.trim(); if (!v) return; setText(''); await A.addTodo(v, w, k); }}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a to-do: laundry, groceries…" aria-label="New to-do" />
      <div className="ta-row">
        <div className="ta-pts" role="group" aria-label="Points">{[1, 2, 3].map((n) => (
          <button type="button" key={n} aria-pressed={w === n} onClick={() => setW(n)}>+{n}</button>))}</div>
        <button className="btn sm" disabled={!text.trim()}>Add</button>
      </div>
    </form>
  );
}

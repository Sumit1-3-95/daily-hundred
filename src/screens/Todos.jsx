// To-do tab: one-time tasks, kept out of the day score. Add fast, tick, move between days.
import { useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { Check } from '../components/ui.jsx';
import { Icon } from '../components/Icons.jsx';
import { addDays, key, parse, short } from '../lib/dates.js';

const WHEN = [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['someday', 'Someday']];

export function useTodos() {
  const { S, today } = useStore();
  const tomorrow = key(addDays(parse(today), 1));
  const all = S.tasks.filter((t) => t.type === 'todo' && !t.archived && !S.tasks.some((x) => x.carried_from === t.id));
  const isDone = (t) => !!(t.on_day && S.days[t.on_day]?.tlogs[t.id]?.done);
  const open = all.filter((t) => !isDone(t)).sort((a, b) => a.sort - b.sort);
  return {
    tomorrow,
    today: open.filter((t) => t.on_day && t.on_day <= today),
    tmrw: open.filter((t) => t.on_day === tomorrow),
    later: open.filter((t) => t.on_day && t.on_day > tomorrow).sort((a, b) => a.on_day.localeCompare(b.on_day)),
    someday: open.filter((t) => !t.on_day),
    done: all.filter((t) => isDone(t) && t.on_day >= key(addDays(parse(today), -6))).sort((a, b) => b.on_day.localeCompare(a.on_day)),
    doneToday: all.filter((t) => isDone(t) && t.on_day === today).length,
  };
}

export function TodoQuickAdd({ autoFocus, onAdded }) {
  const { A, today } = useStore();
  const [text, setText] = useState('');
  const [when, setWhen] = useState('today');
  const input = useRef(null);
  const day = when === 'today' ? today : when === 'tomorrow' ? key(addDays(parse(today), 1)) : null;
  const submit = async (e) => {
    e.preventDefault();
    const v = text.trim(); if (!v) return;
    setText(''); input.current?.focus();
    await A.addTodo(v, 1, day);
    onAdded?.();
  };
  return (
    <form className="td-add" onSubmit={submit}>
      <div className="td-in">
        <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task…" aria-label="New task" autoFocus={autoFocus} enterKeyHint="done" />
        <button className="td-go" disabled={!text.trim()} aria-label="Add task"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg></button>
      </div>
      <div className="td-when" role="group" aria-label="When">
        {WHEN.map(([id, l]) => <button type="button" key={id} aria-pressed={when === id} onClick={() => setWhen(id)}>{l}</button>)}
      </div>
    </form>
  );
}

function Row({ t, done }) {
  const { A, today } = useStore();
  const [menu, setMenu] = useState(false);
  const [edit, setEdit] = useState(false);
  const [pop, setPop] = useState(false);
  const tomorrow = key(addDays(parse(today), 1));
  const late = t.on_day && t.on_day < today;
  const tick = async () => { if (!done) { setPop(true); setTimeout(() => setPop(false), 600); } await A.toggleTodo(t); };
  const move = (d) => { setMenu(false); A.updateTodo(t.id, { on_day: d }); };
  return (
    <div className={`td-row${done ? ' done' : ''}${pop ? ' pop' : ''}`}>
      <div className="td-line">
        <button className="td-tick" onClick={tick} aria-pressed={done} aria-label={done ? `Undo ${t.name}` : `Done: ${t.name}`}><Check /></button>
        {edit ? (
          <form className="td-edit" onSubmit={(e) => { e.preventDefault(); const v = e.currentTarget.elements.n.value.trim(); if (v) A.updateTodo(t.id, { name: v }); setEdit(false); }}>
            <input name="n" defaultValue={t.name} autoFocus onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== t.name) A.updateTodo(t.id, { name: v }); setEdit(false); }} aria-label="Task name" />
          </form>
        ) : (
          <button className="td-name" onClick={() => !done && setEdit(true)}>
            <span>{t.name}</span>
            {late && !done && <small className="late">from {short(t.on_day)}</small>}
            {t.on_day && t.on_day > tomorrow && <small>{short(t.on_day)}</small>}
          </button>
        )}
        {!done && <button className={`td-more${menu ? ' on' : ''}`} onClick={() => setMenu((m) => !m)} aria-label={`Move or delete ${t.name}`} aria-expanded={menu}>
          <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="5" cy="12" r="1.8" fill="currentColor" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /><circle cx="19" cy="12" r="1.8" fill="currentColor" /></svg></button>}
      </div>
      {menu && (
        <div className="td-menu">
          {(!t.on_day || t.on_day !== today) && <button onClick={() => move(today)}>Today</button>}
          {t.on_day !== tomorrow && <button onClick={() => move(tomorrow)}>Tomorrow</button>}
          <label className="td-date">Pick day<input type="date" min={today} onChange={(e) => e.target.value && move(e.target.value)} aria-label="Pick a day" /></label>
          {t.on_day && <button onClick={() => move(null)}>Someday</button>}
          <button className="del" onClick={() => { setMenu(false); A.archiveTask(t.id); }}>Delete</button>
        </div>
      )}
    </div>
  );
}

function Group({ title, items, done, empty, collapsible }) {
  const [shut, setShut] = useState(!!collapsible);
  if (!items.length && !empty) return null;
  return (
    <section className={`card td-group${done ? ' is-done' : ''}`}>
      <button className="td-gh" onClick={() => collapsible && setShut((s) => !s)} aria-expanded={!shut}>
        <h3>{title}</h3><span className="pct">{items.length}</span>
        {collapsible && <svg className={`chev${shut ? '' : ' up'}`} viewBox="0 0 24 24" width="16" height="16"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>}
      </button>
      {!shut && (items.length ? items.map((t) => <Row key={t.id} t={t} done={done} />) : <p className="hint">{empty}</p>)}
    </section>
  );
}

export default function Todos() {
  const g = useTodos();
  const total = g.today.length + g.doneToday;
  const p = total ? g.doneToday / total : 0;
  return (
    <>
      <section className="card td-hero">
        <div className="td-prog">
          <div><b>{g.doneToday}</b><span> of {total} done today</span></div>
          <span className="td-bar"><i style={{ width: `${p * 100}%` }} /></span>
        </div>
        <TodoQuickAdd />
      </section>
      <Group title="Today" items={g.today} empty={total ? 'All clear for today. Nice.' : 'Nothing for today. Add something above.'} />
      <Group title="Tomorrow" items={g.tmrw} />
      <Group title="Coming up" items={g.later} />
      <Group title="Someday" items={g.someday} />
      <Group title="Done" items={g.done} done collapsible />
      <p className="hint td-foot"><Icon name="check" size={13} /> Unfinished tasks move to the next day on their own. They don't affect your habit score.</p>
    </>
  );
}

export function TodoAddSheet() {
  const { close } = useStore();
  return <><h2>New task</h2><TodoQuickAdd autoFocus onAdded={close} /></>;
}

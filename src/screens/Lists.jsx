// Lists tab: your library (foods, workouts, tasks) and your own lists, all as small cards.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Check, fmt } from '../components/ui.jsx';
import { Icon, IconTile, iconForWorkout } from '../components/Icons.jsx';
import PhotoField from '../components/PhotoField.jsx';
import { taskIcon } from '../components/TaskRow.jsx';
import { taskName } from '../lib/calc.js';
import { Cover } from '../sheets/Books.jsx';
import { DOW, MEALS } from '../lib/dates.js';

const Ring = ({ p, size = 34 }) => {
  const r = 13, C = 2 * Math.PI * r, f = Math.max(0, Math.min(1, p || 0));
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" className="lring">
      <circle cx="15" cy="15" r={r} className="lr-trk" />
      {f > 0 && <circle cx="15" cy="15" r={r} className="lr-arc" strokeDasharray={`${(f * C).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 15 15)" />}
    </svg>
  );
};
const Thumb = ({ src, icon, size = 'md' }) => (src ? <img className={`thumb ${size}`} src={src} alt="" loading="lazy" /> : <IconTile name={icon} size={size === 'md' ? 'lg' : 'sm'} />);

export default function Lists() {
  const [view, setView] = useState(null);
  const back = () => setView(null);
  if (view === 'foods') return <Foods onBack={back} />;
  if (view === 'workouts') return <Workouts onBack={back} />;
  if (view === 'tasks') return <Tasks onBack={back} />;
  if (view) return <ListDetail id={view} onBack={back} />;
  return <Overview open={setView} />;
}

function Overview({ open: go }) {
  const { S, today, calc, open } = useStore();
  const foods = S.foods.filter((f) => !f.archived), wts = S.wtypes.filter((w) => !w.archived), tasks = S.tasks.filter((t) => !t.archived);
  const c = calc(today);
  const stack = (arr) => (
    <span className="lib-stack">{arr.slice(0, 3).map((x, i) => <span key={i} style={{ zIndex: 3 - i }}><Thumb src={x.src} icon={x.icon} size="sm" /></span>)}</span>
  );
  const listP = (l) => {
    const its = S.items.filter((i) => i.list_id === l.id);
    if (!its.length) return { p: 0, label: 'Empty' };
    if (l.kind === 'routine') {
      const task = S.tasks.find((t) => !t.archived && t.list_id === l.id);
      const got = task ? (c.d.tlogs[task.id]?.items || []).filter((id) => its.some((i) => i.id === id)).length : 0;
      return { p: got / its.length, label: `${got}/${its.length} today` };
    }
    const done = its.filter((i) => i.checked).length;
    return { p: done / its.length, label: `${done}/${its.length}` };
  };
  return (
    <>
      <div className="lib">
        <button className="lib-card t-orange" onClick={() => go('foods')}>
          {stack(foods.map((f) => ({ src: f.image_url, icon: f.icon || 'bowl' })))}<b>{foods.length}</b><span>Foods</span></button>
        <button className="lib-card t-teal" onClick={() => go('workouts')}>
          {stack(wts.map((w) => ({ src: w.image_url, icon: iconForWorkout(w.area) })))}<b>{wts.length}</b><span>Workouts</span></button>
        <button className="lib-card t-amber" onClick={() => open('books')}>
          <span className="lib-stack">{(S.books || []).slice(0, 3).map((b) => <span key={b.id}><Cover book={b} size="xs" /></span>)}</span><b>{(S.books || []).length}</b><span>Books</span></button>
        <button className="lib-card t-violet" onClick={() => go('tasks')}>
          {stack(tasks.map((t) => ({ src: t.image_url, icon: taskIcon(t) })))}<b>{tasks.length}</b><span>Tasks</span></button>
      </div>
      <h2 className="sec-h">Lists</h2>
      <div className="lgrid">
        {S.lists.map((l) => {
          const { p, label } = listP(l);
          return (
            <button key={l.id} className={`lcard2 ${l.kind}`} onClick={() => go(l.id)}>
              <span className="lc2-top">{l.image_url ? <img className="thumb md" src={l.image_url} alt="" /> : <IconTile name={l.icon || (l.kind === 'routine' ? 'sun' : 'list')} />}
                <span className="lc2-ring"><Ring p={p} />{p >= 0.999 && <span className="lc2-ok"><Check /></span>}</span></span>
              <span className="lc2-t">{l.title}</span>
              <span className="lc2-m">{l.kind === 'routine' ? 'Routine · ' : ''}{label}</span>
            </button>
          );
        })}
        <button className="lcard2 add" onClick={() => open('list')}><Icon name="list" size={22} /><span>New list</span></button>
      </div>
    </>
  );
}

function Head({ title, onBack, action }) {
  return <div className="lhead"><button className="back" onClick={onBack} aria-label="Back">‹</button><h2>{title}</h2>{action}</div>;
}

function Foods({ onBack }) {
  const { S, open } = useStore();
  const [f, setF] = useState('all');
  const list = S.foods.filter((x) => !x.archived && (f === 'all' || (f === 'quick' ? x.quick : (!x.meals?.length || x.meals.includes(f)))));
  return (
    <>
      <Head title="Foods" onBack={onBack} action={<button className="link" onClick={() => open('foodView')}>Card view</button>} />
      <div className="chips scroll">{[['all', 'All'], ['quick', '★ Quick'], ...MEALS.map((m) => [m, m])].map(([k, l]) => (
        <button key={k} className={`chip${f === k ? ' on' : ''}`} onClick={() => setF(k)}>{l}</button>))}</div>
      <div className="libgrid">
        <button className="libitem add" onClick={() => open('foodEdit', { meal: MEALS.includes(f) ? f : undefined })}><span>+</span>New food</button>
        {list.map((x) => (
          <button key={x.id} className="libitem" onClick={() => open('foodEdit', { id: x.id })}>
            <span className="li-img"><Thumb src={x.image_url} icon={x.icon || 'bowl'} />{x.quick && <span className="li-star">★</span>}</span>
            <span className="li-n">{x.name}</span><span className="li-m">{fmt(x.kcal)} kcal · {x.protein} g</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Workouts({ onBack }) {
  const { S, open } = useStore();
  return (
    <>
      <Head title="Workouts" onBack={onBack} />
      <div className="libgrid">
        <button className="libitem add" onClick={() => open('workoutEdit')}><span>+</span>New workout</button>
        {S.wtypes.filter((w) => !w.archived).map((w) => (
          <button key={w.id} className="libitem" onClick={() => open('workoutEdit', { id: w.id })}>
            <span className="li-img"><Thumb src={w.image_url} icon={iconForWorkout(w.area)} /></span>
            <span className="li-n">{w.name}</span><span className="li-m">{w.area} · {w.kcal_per_min}/min</span>
          </button>
        ))}
      </div>
    </>
  );
}

function Tasks({ onBack }) {
  const { S, open } = useStore();
  const days = (d) => (d.length === 7 ? 'Daily' : d.length === 6 && !d.includes(0) ? 'Mon–Sat' : d.map((i) => DOW[i][0]).join(''));
  return (
    <>
      <Head title="Tasks" onBack={onBack} />
      <div className="libgrid">
        <button className="libitem add" onClick={() => open('task')}><span>+</span>New task</button>
        {S.tasks.filter((t) => !t.archived).sort((a, b) => a.sort - b.sort).map((t) => (
          <button key={t.id} className={`libitem${t.type === 'avoid' ? ' avoid' : ''}`} onClick={() => open('task', { task: t })}>
            <span className="li-img"><Thumb src={t.image_url} icon={taskIcon(t)} /><span className="li-star pts">{t.type === 'avoid' ? '−' : '+'}{t.weight}</span></span>
            <span className="li-n">{taskName(t, S.targets)}</span><span className="li-m">{t.type === 'avoid' ? 'Detractor' : days(t.days)}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function ListDetail({ id, onBack }) {
  const { S, A, open } = useStore();
  const list = S.lists.find((l) => l.id === id);
  const [text, setText] = useState('');
  const [sure, setSure] = useState(false);
  if (!list) return <Head title="List" onBack={onBack} />;
  const items = S.items.filter((i) => i.list_id === id).sort((a, b) => a.sort - b.sort);
  const routine = list.kind === 'routine';
  const usedBy = S.tasks.find((t) => !t.archived && t.list_id === id);
  const done = items.filter((i) => i.checked).length;
  return (
    <>
      <Head title={list.title} onBack={onBack} action={<button className="link" onClick={() => open('list', { list })}>Rename</button>} />
      <section className="card list-hero">
        <PhotoField value={list.image_url} onChange={(url) => A.updateList(id, { image_url: url })} icon={list.icon || (routine ? 'sun' : 'list')} kind="list" />
        <div>
          <b>{routine ? items.length : `${done}/${items.length}`}</b>
          <span className="sub">{routine ? (usedBy ? `steps · daily task "${usedBy.name}"` : 'steps') : 'ticked'}</span>
          {!routine && items.length > 0 && <div className="mbar r1"><i style={{ width: `${(done / items.length) * 100}%` }} /></div>}
        </div>
      </section>
      <div className="items">
        {items.map((i) => (
          <div key={i.id} className={`item${!routine && i.checked ? ' on' : ''}`}>
            {!routine && <button className="ibox" onClick={() => A.updateItem(i, { checked: !i.checked })} aria-pressed={i.checked} aria-label={`Tick ${i.text}`}><Check /></button>}
            <input type="text" defaultValue={i.text} aria-label="Item"
              onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== i.text) A.updateItem(i, { text: v }); }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
            <button className="del" onClick={() => A.deleteItem(i.id)} aria-label={`Delete ${i.text}`}>×</button>
          </div>
        ))}
        <form className="item add" onSubmit={async (e) => { e.preventDefault(); const v = text.trim(); if (!v) return; setText(''); await A.addItem(id, v); }}>
          <span className="ibox plus">+</span>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add item" aria-label="Add item" />
        </form>
      </div>
      <div className="btn-row">
        {!routine && done > 0 && <button className="btn ghost sm" onClick={() => A.uncheckAll(id)}>Untick all</button>}
        {routine && !usedBy && <button className="btn ghost sm" onClick={() => open('task', { preset: { type: 'checklist', list_id: id, name: list.title } })}>Make it a daily task</button>}
        {sure ? <button className="btn sm danger" onClick={async () => { await A.deleteList(id); onBack(); }}>Tap again to delete</button>
          : <button className="btn ghost sm" onClick={() => setSure(true)}>Delete list</button>}
      </div>
    </>
  );
}

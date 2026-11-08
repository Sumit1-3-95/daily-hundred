import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Check } from '../components/ui.jsx';

export default function Lists() {
  const { S, open } = useStore();
  const [sel, setSel] = useState(null);
  const list = S.lists.find((l) => l.id === sel);
  if (list) return <ListDetail list={list} onBack={() => setSel(null)} />;
  const group = (kind) => S.lists.filter((l) => l.kind === kind);
  const Card = (l) => {
    const its = S.items.filter((i) => i.list_id === l.id);
    const done = its.filter((i) => i.checked).length;
    const usedBy = S.tasks.filter((t) => !t.archived && t.list_id === l.id).map((t) => t.name);
    return (
      <button key={l.id} className="list-card" onClick={() => setSel(l.id)}>
        <div><div className="nm">{l.title}</div>
          <div className="mt">{its.length} item{its.length === 1 ? '' : 's'}{l.kind === 'note' && its.length ? ` · ${done} ticked` : ''}{usedBy.length ? ` · daily task: ${usedBy.join(', ')}` : ''}</div></div>
        <span className="sub">›</span>
      </button>
    );
  };
  return (
    <>
      <section className="card"><div className="row-h"><h3>Routines</h3><span className="sub">steps you tick off as a daily task</span></div>
        <div className="lists-grid">{group('routine').map(Card)}{!group('routine').length && <div className="empty">No routines yet.</div>}</div></section>
      <section className="card"><div className="row-h"><h3>Lists and notes</h3><span className="sub">packing, groceries, reminders</span></div>
        <div className="lists-grid">{group('note').map(Card)}{!group('note').length && <div className="empty">No lists yet.</div>}</div></section>
      <button className="btn" onClick={() => open('list')}>New list</button>
    </>
  );
}

function ListDetail({ list, onBack }) {
  const { S, A, open } = useStore();
  const [text, setText] = useState('');
  const items = S.items.filter((i) => i.list_id === list.id).sort((a, b) => a.sort - b.sort);
  const routine = list.kind === 'routine';
  const usedBy = S.tasks.filter((t) => !t.archived && t.list_id === list.id);
  return (
    <>
      <button className="back" onClick={onBack}>‹ All lists</button>
      <section className="card">
        <div className="row-h"><h3>{list.title}</h3><button className="link" onClick={() => open('list', { list })}>Rename</button></div>
        {routine && <p className="hint">{usedBy.length
          ? `Ticked each day through the "${usedBy[0].name}" task. Edits here change tomorrow's steps too.`
          : 'Not linked to a daily task yet.'}</p>}
        <div className="list">
          {items.map((i) => (
            <div key={i.id} className={`item-row${!routine && i.checked ? ' on' : ''}`}>
              {!routine && (
                <button className={`subitem${i.checked ? ' on' : ''}`} style={{ width: 'auto', padding: 0 }} onClick={() => A.updateItem(i, { checked: !i.checked })} aria-pressed={i.checked} aria-label={`Tick ${i.text}`}>
                  <span className="box"><Check /></span></button>
              )}
              <input type="text" id={`it-${i.id}`} defaultValue={i.text} aria-label="Item text"
                onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== i.text) A.updateItem(i, { text: v }); }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
              <button className="del" onClick={() => A.deleteItem(i.id)} aria-label={`Delete ${i.text}`}>✕</button>
            </div>
          ))}
          {!items.length && <div className="empty">No items yet.</div>}
        </div>
        <form className="inline" onSubmit={async (e) => { e.preventDefault(); const v = text.trim(); if (!v) return; setText(''); await A.addItem(list.id, v); }}>
          <div className="field"><label htmlFor="newItem">Add item</label>
            <input id="newItem" value={text} onChange={(e) => setText(e.target.value)} placeholder={routine ? 'e.g. 10 push-ups' : 'e.g. Phone charger'} /></div>
          <button className="btn sm">Add</button>
        </form>
        <div className="btn-row">
          {!routine && items.some((i) => i.checked) && <button className="btn ghost sm" onClick={() => A.uncheckAll(list.id)}>Untick all</button>}
          {routine && !usedBy.length && <button className="btn ghost sm" onClick={() => open('task', { preset: { type: 'checklist', list_id: list.id, name: list.title } })}>Make it a daily task</button>}
          <DeleteList list={list} onDone={onBack} />
        </div>
      </section>
    </>
  );
}

function DeleteList({ list, onDone }) {
  const { A } = useStore();
  const [sure, setSure] = useState(false);
  return sure
    ? <button className="btn sm" style={{ background: 'var(--bad)' }} onClick={async () => { await A.deleteList(list.id); onDone(); }}>Tap again to delete</button>
    : <button className="btn ghost sm" onClick={() => setSure(true)}>Delete list</button>;
}

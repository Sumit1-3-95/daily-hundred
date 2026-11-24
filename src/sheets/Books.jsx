// Reading: a shelf of books (reading now, up next, read), each with a reading journal.
// Logging a session adds the pages to the book and to today's Read habit.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import PhotoField from '../components/PhotoField.jsx';
import { Field, MBar, fmt } from '../components/ui.jsx';
import { lastN, parse, short } from '../lib/dates.js';

const SHADES = [['#2D3A8C', '#F4C95D'], ['#7A2E3A', '#F6E7D7'], ['#1F5F55', '#F2D6A2'], ['#3C3C3C', '#E9C46A'], ['#5B3E8C', '#F1E3FF'], ['#8C4A1F', '#FFE8CC']];
const shade = (t = '') => SHADES[[...t].reduce((a, c) => a + c.charCodeAt(0), 0) % SHADES.length];

/** The book's cover photo, or a simple typographic cover in its own colours. */
export function Cover({ book, size = 'md' }) {
  if (book.cover_url) return <img className={`cover ${size}`} src={book.cover_url} alt="" loading="lazy" />;
  const [bg, fg] = shade(book.title);
  return (
    <span className={`cover ${size} gen`} style={{ background: bg, color: fg }} aria-hidden="true">
      <span className="cv-t">{book.title}</span>
      {book.author && <span className="cv-a">{book.author.split('&')[0].trim()}</span>}
    </span>
  );
}

const pct = (b) => (b.total_pages ? Math.min(1, (b.pages_read || 0) / b.total_pages) : 0);

export default function BooksSheet({ id: id0 }) {
  const [view, setView] = useState(id0 || null);
  if (view === 'new') return <BookForm onDone={(b) => setView(b?.id || null)} />;
  if (view?.startsWith?.('edit:')) return <BookForm id={view.slice(5)} onDone={() => setView(view.slice(5))} />;
  if (view) return <BookDetail id={view} onBack={() => setView(null)} onEdit={() => setView(`edit:${view}`)} />;
  return <Shelf open={setView} />;
}

function Shelf({ open }) {
  const { S, today } = useStore();
  if (S.books === null) return (
    <><h2>Reading</h2><div className="empty">Books need one database update. Run <b>0009_books.sql</b> in Supabase, then reopen the app.</div></>
  );
  const books = S.books || [];
  const reading = books.filter((b) => b.status === 'reading');
  const next = books.filter((b) => b.status === 'next');
  const read = books.filter((b) => b.status === 'read');
  const week = new Set(lastN(7, parse(today)));
  const pagesWeek = S.bookNotes.filter((n) => week.has(n.day)).reduce((a, n) => a + n.pages, 0);
  return (
    <>
      <h2>Reading</h2>
      <div className="rd-stats">
        <div><b>{fmt(pagesWeek)}</b><span>pages this week</span></div>
        <div><b>{read.length}</b><span>books read</span></div>
        <div><b>{reading.length}</b><span>reading now</span></div>
      </div>
      {reading.map((b) => (
        <button key={b.id} className="now-card" onClick={() => open(b.id)}>
          <Cover book={b} size="lg" />
          <span className="nc-b">
            <span className="eyebrow">Reading now</span>
            <span className="nc-t">{b.title}</span>
            <span className="nc-a">{b.author}</span>
            <MBar v={pct(b)} />
            <span className="nc-p"><b>{b.pages_read}</b> of {b.total_pages} pages · {Math.round(pct(b) * 100)}%</span>
            <span className="btn sm nc-btn">Log reading</span>
          </span>
        </button>
      ))}
      {!reading.length && <div className="empty">Nothing on the go. Start one from Up next.</div>}
      {next.length > 0 && <>
        <div className="qp-h">Up next</div>
        <div className="shelf">{next.map((b) => (
          <button key={b.id} className="sbook" onClick={() => open(b.id)}><Cover book={b} /><span className="sb-t">{b.title}</span></button>
        ))}</div>
      </>}
      {read.length > 0 && <>
        <div className="qp-h">Read</div>
        <div className="shelf grid">{read.map((b) => (
          <button key={b.id} className="sbook done" onClick={() => open(b.id)}><Cover book={b} /><span className="sb-t">{b.title}</span></button>
        ))}</div>
      </>}
      <button className="btn ghost" onClick={() => open('new')}>+ Add a book</button>
    </>
  );
}

function BookDetail({ id, onBack, onEdit }) {
  const { S, A } = useStore();
  const b = (S.books || []).find((x) => x.id === id);
  const [pages, setPages] = useState('');
  const [note, setNote] = useState('');
  if (!b) return <button className="back" onClick={onBack}>‹ Shelf</button>;
  const notes = S.bookNotes.filter((n) => n.book_id === id);
  return (
    <>
      <div className="lhead"><button className="back" onClick={onBack} aria-label="Back to shelf">‹</button><h2>{b.title}</h2></div>
      <div className="bk-top">
        <button className="bk-cover" onClick={onEdit} aria-label="Change cover"><Cover book={b} size="xl" /><span className="pf-badge">Change</span></button>
        <div className="bk-b">
          <span className="nc-a">{b.author}</span>
          <div className="bk-pct">{Math.round(pct(b) * 100)}<small>%</small></div>
          <MBar v={pct(b)} />
          <span className="nc-p">{b.pages_read} of {b.total_pages} pages{b.total_pages > b.pages_read ? ` · ${b.total_pages - b.pages_read} to go` : ''}</span>
          <PageFix b={b} />
          <button className="btn ghost sm bk-edit" onClick={onEdit}>Edit book · cover, pages, status</button>
          <div className="seg3" role="group" aria-label="Status">
            {[['reading', 'Reading'], ['next', 'Next'], ['read', 'Read']].map(([k, l]) => (
              <button key={k} aria-pressed={b.status === k} onClick={() => A.saveBook({ id, status: k, ...(k === 'read' ? { pages_read: b.total_pages || b.pages_read } : {}) })}>{l}</button>
            ))}
          </div>
        </div>
      </div>
      {b.status !== 'read' && (
        <form className="log-read" onSubmit={async (e) => { e.preventDefault(); if (!Number(pages) && !note.trim()) return; await A.logReading(b, pages, note); setPages(''); setNote(''); }}>
          <div className="row-h"><h3>Today's reading</h3><span className="sub">adds to your Read habit</span></div>
          <div className="chips">{[10, 20, 30, 50].map((n) => (
            <button type="button" key={n} className={`chip${Number(pages) === n ? ' on' : ''}`} onClick={() => setPages(String(n))}>{n} pages</button>
          ))}<input className="pg-in" type="number" inputMode="numeric" min="0" value={pages} onChange={(e) => setPages(e.target.value)} placeholder="pages" aria-label="Pages read" /></div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="A thought, a quote, what stuck with you…" rows={3} aria-label="Reading note" />
          <button className="btn">Save session</button>
        </form>
      )}
      <h3>Journal</h3>
      {notes.length ? <div className="journal">{notes.map((n) => (
        <div key={n.id} className="jn">
          <div className="jn-h"><span>{short(n.day)}</span>{n.pages > 0 && <span className="qtag inl">+{n.pages} pages</span>}
            <button className="del" onClick={() => A.deleteNote(n.id)} aria-label="Delete note">×</button></div>
          {n.note && <p>{n.note}</p>}
        </div>
      ))}</div> : <p className="hint">Your notes from each reading session will collect here.</p>}
    </>
  );
}

/** Find a cover online (Open Library) or paste an image link. */
function CoverFinder({ title, author, value, onPick }) {
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const find = async () => {
    const t = document.getElementById('bkT')?.value?.trim() || title, a = document.getElementById('bkA')?.value?.trim() || author;
    if (!t) return setRes([]);
    setBusy(true);
    try {
      const u = `https://openlibrary.org/search.json?limit=12&fields=cover_i,title&title=${encodeURIComponent(t)}${a ? `&author=${encodeURIComponent(a.split('&')[0].trim())}` : ''}`;
      const j = await (await fetch(u)).json();
      setRes([...new Set((j.docs || []).map((d) => d.cover_i).filter(Boolean))].slice(0, 8).map((id) => `https://covers.openlibrary.org/b/id/${id}-M.jpg`));
    } catch { setRes([]); } finally { setBusy(false); }
  };
  return (
    <div className="field cover-find"><span className="lb">Cover</span>
      <div className="btn-row">
        <button type="button" className="btn ghost sm" onClick={find} disabled={busy}>{busy ? 'Searching…' : 'Find cover online'}</button>
        {value && <button type="button" className="link" onClick={() => onPick(null)}>Use plain cover</button>}
      </div>
      {res && (res.length ? <div className="cf-grid">{res.map((u) => (
        <button type="button" key={u} aria-pressed={value === u} onClick={() => onPick(u)}><img src={u} alt="" loading="lazy" /></button>
      ))}</div> : <p className="hint">No covers found. Upload a photo of the cover, or paste a link below.</p>)}
      <div className="cf-link"><input type="url" inputMode="url" autoCapitalize="off" value={link} onChange={(e) => setLink(e.target.value)} placeholder="…or paste an image link" aria-label="Cover image link" />
        {link.trim() && <button type="button" className="btn sm" onClick={() => { onPick(link.trim()); setLink(''); }}>Use</button>}</div>
    </div>
  );
}

/** Set the page you're on, any time — also for a book marked read by mistake. */
function PageFix({ b }) {
  const { A, toast } = useStore();
  const [v, setV] = useState(String(b.pages_read || 0));
  const n = Math.max(0, Math.min(b.total_pages || Infinity, Number(v) || 0));
  const changed = n !== (b.pages_read || 0);
  return (
    <form className="pg-fix" onSubmit={async (e) => {
      e.preventDefault(); if (!changed) return;
      const status = b.total_pages && n >= b.total_pages ? 'read' : b.status === 'read' ? 'reading' : b.status;
      await A.saveBook({ id: b.id, pages_read: n, status, ...(status !== 'read' ? { finished_on: null } : {}) });
      toast(status === 'reading' && b.status === 'read' ? 'Back to reading' : 'Pages updated');
    }}>
      <label htmlFor={`pf-${b.id}`}>On page</label>
      <input id={`pf-${b.id}`} type="number" inputMode="numeric" min="0" max={b.total_pages || undefined} value={v} onChange={(e) => setV(e.target.value)} />
      {changed && <button className="btn sm">Save</button>}
    </form>
  );
}

function BookForm({ id, onDone }) {
  const { S, A, toast } = useStore();
  const b0 = id ? (S.books || []).find((x) => x.id === id) : null;
  const [cover, setCover] = useState(b0?.cover_url || null);
  const [status, setStatus] = useState(b0?.status || 'next');
  const [total, setTotal] = useState(String(b0?.total_pages || ''));
  const [read, setRead] = useState(String(b0?.pages_read || 0));
  const [sure, setSure] = useState(false);
  return (
    <>
      <h2>{b0 ? 'Edit book' : 'Add a book'}</h2>
      <form onSubmit={async (e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        const tot = Number(total) || 0;
        const pr = Math.min(tot || Infinity, Number(read) || 0);
        // pages decide: fewer than the total means not finished yet, even if it was marked read
        const st = status === 'read' && tot && pr < tot ? 'reading' : status;
        const row = { ...(b0 ? { id: b0.id } : {}), title: fd.get('title').trim(), author: fd.get('author').trim() || null, total_pages: tot,
          pages_read: pr, status: st, cover_url: cover, ...(st !== 'read' ? { finished_on: null } : {}) };
        const saved = await A.saveBook(row); toast('Saved'); onDone(saved);
      }}>
        <div className="edit-top">
          <PhotoField value={cover} onChange={setCover} icon="book" kind="book" />
          <div className="edit-fields">
            <Field label="Title" id="bkT"><input id="bkT" name="title" required defaultValue={b0?.title || ''} /></Field>
            <Field label="Author" id="bkA"><input id="bkA" name="author" defaultValue={b0?.author || ''} /></Field>
          </div>
        </div>
        <CoverFinder title={b0?.title} author={b0?.author} value={cover} onPick={setCover} />
        <div className="two">
          <Field label="Total pages" id="bkP"><input id="bkP" name="total" type="number" inputMode="numeric" min="0" value={total} onChange={(e) => setTotal(e.target.value)} /></Field>
          <Field label="Pages read" id="bkR"><input id="bkR" name="read" type="number" inputMode="numeric" min="0" value={read} onChange={(e) => setRead(e.target.value)} /></Field>
        </div>
        <div className="seg3" role="group" aria-label="Status">
          {[['reading', 'Reading'], ['next', 'Up next'], ['read', 'Read']].map(([k, l]) => (
            <button type="button" key={k} aria-pressed={status === k} onClick={() => { setStatus(k); if (k === 'read' && total) setRead(total); }}>{l}</button>))}
        </div>
        <button className="btn">{b0 ? 'Save' : 'Add book'}</button>
      </form>
      {b0 && (sure
        ? <button className="btn danger" onClick={async () => { await A.deleteBook(b0.id); onDone(null); }}>Tap again to remove</button>
        : <button className="btn ghost" onClick={() => setSure(true)}>Remove book</button>)}
    </>
  );
}

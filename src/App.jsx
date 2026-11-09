import { useEffect, useState } from 'react';
import { configured, supabase } from './lib/supabase.js';
import { StoreProvider, useStore } from './store.jsx';
import { Login, NotConfigured } from './screens/Auth.jsx';
import Home from './screens/Home.jsx';
import Health from './screens/Health.jsx';
import Today from './screens/Today.jsx';
import Lists from './screens/Lists.jsx';
import { SHEETS } from './sheets/index.jsx';
import { weightTrend } from './sheets/WeightPage.jsx';
import { Sheet, Toast } from './components/ui.jsx';

const TABS = [
  ['home', 'Home', <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /></>],
  ['health', 'Health', <path d="M3 12h4l2-5 4 10 2-5h6" />],
  ['today', 'Today', <><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>],
  ['lists', 'Lists', <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></>],
];
const NUDGE_SHEET = { sleep: 'sleep', weight: 'weight', water: 'water', routine: 'routine', close: 'closeDay' };

/** Latest weight with its 7-day change: green going down, amber flat, red going up. Opens the weight page. */
function WeightChip() {
  const { S, open } = useStore();
  const tr = weightTrend(S, 7);
  return (
    <button className={`wchip ${tr?.status || 'flat'}`} onClick={() => open('weightPage')} aria-label="Weight details">
      <b>{tr ? tr.now.toFixed(1) : '—'}<small> kg</small></b>
      {tr?.delta != null && <span>{tr.delta > 0 ? '▲' : '▼'} {Math.abs(tr.delta).toFixed(1)}</span>}
    </button>
  );
}

function Shell() {
  const { S, status, sheet, open, track } = useStore();
  const [tab, setTab] = useState(() => { try { return localStorage.getItem('dh.tab') || 'home'; } catch { return 'home'; } });
  const go = (t) => { setTab(t); try { localStorage.setItem('dh.tab', t); } catch { /* ignore */ } window.scrollTo(0, 0); };

  // a tapped push notification opens /?nudge=<kind>
  useEffect(() => {
    if (status !== 'ready') return;
    const p = new URLSearchParams(window.location.search).get('nudge');
    if (p && NUDGE_SHEET[p]) { go('home'); open(NUDGE_SHEET[p]); track('nudge_opened', { kind: p }); }
    if (p) window.history.replaceState(null, '', '/');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === 'loading') return <div className="spinner">Loading your data…</div>;
  if (status !== 'ready') return <div className="center"><div className="auth"><h1>Something went wrong</h1><p className="err">{status}</p>
    <button className="btn" onClick={() => window.location.reload()}>Try again</button></div></div>;

  const hello = S.profile.name ? `Hi ${S.profile.name.split(' ')[0].replace(/^./, (c) => c.toUpperCase())}` : 'Hi';
  const title = { home: hello, health: 'Health', today: 'Today', lists: 'Lists' }[tab];
  const Body = { home: Home, health: Health, today: Today, lists: Lists }[tab];
  const SheetBody = sheet && SHEETS[sheet.name];
  return (
    <>
      <div className="app">
        <header className="top">
          <div><div className="date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</div><h1>{title}</h1></div>
          <div className="top-r">
            {tab === 'home' && <WeightChip />}
            <button className="avatar" onClick={() => open('settings')} aria-label="Settings">{(S.profile.name || 'S')[0].toUpperCase()}</button>
          </div>
        </header>
        <main><Body goTab={go} /></main>
      </div>
      <button className="fab" onClick={() => open('quick')} aria-label="Quick add">+</button>
      <nav className="tabs" aria-label="Main"><div className="tabs-in">
        {TABS.map(([id, l, icon]) => (
          <button key={id} className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => go(id)}>
            <svg viewBox="0 0 24 24">{icon}</svg>{l}</button>
        ))}
      </div></nav>
      {SheetBody && <Sheet><SheetBody {...sheet.props} /></Sheet>}
      <Toast />
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (!configured) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!configured) return <NotConfigured />;
  if (session === undefined) return <div className="spinner">Loading…</div>;
  if (!session) return <Login />;
  return (
    <StoreProvider session={session}>
      <Shell />
    </StoreProvider>
  );
}

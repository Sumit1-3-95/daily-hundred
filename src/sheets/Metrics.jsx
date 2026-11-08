import { useState } from 'react';
import { useStore } from '../store.jsx';
import { IconTile } from '../components/Icons.jsx';
import { DEFAULT_FOCUS, DEFAULT_HOME, METRICS } from '../lib/metrics.js';

export default function MetricsSheet() {
  const { S, A, today, close, toast } = useStore();
  const prefs = S.profile.prefs || {};
  const cur = { ...DEFAULT_FOCUS, start: today, ...(prefs.focus || {}) };
  const [focus, setFocus] = useState(cur.metric);
  const [days, setDays] = useState(cur.days);
  const [pins, setPins] = useState(prefs.home_metrics || DEFAULT_HOME);
  const toggle = (m) => setPins((p) => (p.includes(m) ? p.filter((x) => x !== m) : p.length >= 6 ? p : [...p, m]));
  const t = S.targets;
  return (
    <>
      <h2>What to focus on</h2>
      <div className="field"><span className="lb">Focus habit (one at a time)</span>
        <div className="mgrid">{Object.entries(METRICS).map(([m, M]) => (
          <button key={m} className="mopt" aria-pressed={focus === m} onClick={() => setFocus(m)}>
            <IconTile name={M.icon} size="sm" /><span>{M.label}</span><small>{M.goal(t)}</small>
          </button>
        ))}</div></div>
      <div className="field"><span className="lb">For how many days</span>
        <div className="period" role="group" style={{ width: '100%' }}>
          {[7, 14, 21].map((d) => <button key={d} aria-pressed={days === d} onClick={() => setDays(d)}>{d} days</button>)}
        </div></div>
      <div className="field"><span className="lb">Numbers on Home ({pins.length} of 6)</span>
        <div className="mgrid">{Object.entries(METRICS).map(([m, M]) => (
          <button key={m} className="mopt" aria-pressed={pins.includes(m)} onClick={() => toggle(m)}>
            <IconTile name={M.icon} size="sm" /><span>{M.label}</span>
          </button>
        ))}</div></div>
      <button className="btn" onClick={async () => {
        const changed = focus !== cur.metric || days !== cur.days;
        await A.savePrefs({ home_metrics: pins, focus: { metric: focus, days, start: changed ? today : cur.start } });
        toast(changed ? `New focus: ${METRICS[focus].label} for ${days} days` : 'Saved'); close();
      }}>Save</button>
      <p className="hint">Changing the focus habit or its length starts a new streak from today.</p>
    </>
  );
}

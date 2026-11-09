// Weight: current number, change, goal progress, trend chart and recent entries.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { LineChart } from '../components/Charts.jsx';
import { WeightBlock } from '../components/Nudges.jsx';
import { lastN, parse, short } from '../lib/dates.js';

/** Weight entries newest first: [{ k, w }] */
export function weights(S) {
  return Object.keys(S.days).sort().reverse().map((k) => ({ k, w: S.days[k].log?.weight })).filter((x) => x.w != null).map((x) => ({ ...x, w: Number(x.w) }));
}
/** Change over ~n days and whether that's on track (losing at least 0.1 kg a week). */
export function weightTrend(S, n = 7) {
  const ws = weights(S);
  if (!ws.length) return null;
  const now = ws[0];
  const cutoff = parse(now.k); cutoff.setDate(cutoff.getDate() - n);
  const then = ws.find((x) => parse(x.k) <= cutoff) || ws[ws.length - 1];
  const delta = then && then.k !== now.k ? now.w - then.w : null;
  const perWeek = delta != null ? (delta / Math.max(1, (parse(now.k) - parse(then.k)) / 864e5)) * 7 : null;
  const status = perWeek == null ? 'flat' : perWeek <= -0.1 ? 'good' : perWeek <= 0.1 ? 'flat' : 'bad';
  return { now: now.w, k: now.k, delta, status };
}

export default function WeightPage() {
  const { S, today, calc } = useStore();
  const [n, setN] = useState(30);
  const t = S.targets;
  const tr = weightTrend(S, 7), tr30 = weightTrend(S, 30);
  const ws = weights(S);
  const lost = tr ? t.startWeight - tr.now : 0, need = t.startWeight - t.goalWeight;
  const pts = lastN(n, parse(today)).map((k) => ({ label: short(k), v: calc(k).weight }));
  const label = { good: 'On track', flat: 'Holding steady', bad: 'Going up' };
  return (
    <>
      <h2>Weight</h2>
      {tr ? (
        <div className="w-head">
          <div><b>{tr.now.toFixed(1)}</b><small> kg</small><div className="sub">{short(tr.k)}</div></div>
          <div className={`w-delta ${tr.status}`}>{tr.delta != null ? `${tr.delta > 0 ? '▲' : '▼'} ${Math.abs(tr.delta).toFixed(1)} kg` : '—'}<small>7 days · {label[tr.status]}</small></div>
          <div className={`w-delta ${tr30?.status || 'flat'}`}>{tr30?.delta != null ? `${tr30.delta > 0 ? '▲' : '▼'} ${Math.abs(tr30.delta).toFixed(1)} kg` : '—'}<small>30 days</small></div>
        </div>
      ) : <p className="hint">No weight logged yet.</p>}
      <div className="field"><span className="lb">Goal {t.goalWeight} kg · {Math.max(0, lost).toFixed(1)} of {need.toFixed(1)} kg lost</span>
        <div className="goalbar"><i style={{ width: `${Math.max(0, Math.min(1, lost / need)) * 100}%` }} /></div></div>
      <div className="row-h"><h3>Trend</h3><div className="period" role="group" aria-label="Period">
        {[30, 90].map((d) => <button key={d} aria-pressed={n === d} onClick={() => setN(d)}>{d}d</button>)}</div></div>
      <LineChart pts={pts} aria={`Weight over ${n} days`} goal={t.goalWeight} />
      <h3>Log today</h3>
      <div className="w-log"><WeightBlock k={today} /></div>
      <h3>Recent</h3>
      <div className="list">{ws.slice(0, 10).map((x, i) => {
        const prev = ws[i + 1];
        return (
          <div className="li" key={x.k}><div className="grow"><div className="nm">{x.w.toFixed(1)} kg</div><div className="mt">{parse(x.k).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div></div>
            {prev && <span className={`w-d ${x.w < prev.w ? 'good' : x.w > prev.w ? 'bad' : ''}`}>{x.w - prev.w > 0 ? '+' : ''}{(x.w - prev.w).toFixed(1)}</span>}</div>
        );
      })}</div>
    </>
  );
}

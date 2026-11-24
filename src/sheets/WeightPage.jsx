// Weight: current number, change, goal progress, trend chart and recent entries.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { WeightChart } from '../components/Charts.jsx';
import { addDays, key, lastN, parse, short } from '../lib/dates.js';

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

const dayTitle = (k) => parse(k).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** Quick entry: starts at your last weight, nudge with − / + and save. Works for today or any past day. */
function WeightEntry({ k, setK }) {
  const { S, A, today, calc, toast } = useStore();
  const last = weights(S)[0]?.w;
  const cur = calc(k).weight;
  const [w, setW] = useState(cur ?? last ?? 75);
  const [prevK, setPrevK] = useState(k);
  if (prevK !== k) { setPrevK(k); setW(cur ?? last ?? 75); }
  const nudge = (d) => setW((x) => Math.round((Number(x) + d) * 10) / 10);
  const yest = key(addDays(parse(today), -1));
  return (
    <div className="wentry">
      <div className="we-days" role="group" aria-label="Day">
        <button aria-pressed={k === today} onClick={() => setK(today)}>Today</button>
        <button aria-pressed={k === yest} onClick={() => setK(yest)}>Yesterday</button>
        <label className={k !== today && k !== yest ? 'on' : ''}>
          <span>{k !== today && k !== yest ? short(k) : 'Pick day'}</span>
          <input type="date" max={today} value={k} onChange={(e) => e.target.value && setK(e.target.value)} aria-label="Pick a day" />
        </label>
      </div>
      <div className="we-row">
        <button type="button" className="we-b" onClick={() => nudge(-0.5)} aria-label="0.5 kg less">−½</button>
        <button type="button" className="we-b" onClick={() => nudge(-0.1)} aria-label="0.1 kg less">−</button>
        <label className="we-n"><input type="number" inputMode="decimal" step="0.1" min="30" max="250" value={w} onChange={(e) => setW(e.target.value)} aria-label="Weight in kg" /><small>kg</small></label>
        <button type="button" className="we-b" onClick={() => nudge(0.1)} aria-label="0.1 kg more">+</button>
        <button type="button" className="we-b" onClick={() => nudge(0.5)} aria-label="0.5 kg more">+½</button>
      </div>
      <button className="btn" onClick={async () => {
        const v = Math.round(Number(w) * 10) / 10;
        if (!(v >= 30 && v <= 250)) return toast('Enter a weight between 30 and 250 kg');
        await A.saveDay(k, { weight: v }); toast(`Saved ${v.toFixed(1)} kg for ${k === today ? 'today' : short(k)}`);
      }}>{cur != null ? 'Update' : 'Save'} {k === today ? "today's" : short(k)} weight</button>
    </div>
  );
}

export default function WeightPage() {
  const { S, A, today, calc } = useStore();
  const [n, setN] = useState(30);
  const [k, setK] = useState(today);
  const t = S.targets;
  const tr = weightTrend(S, 7), tr30 = weightTrend(S, 30);
  const ws = weights(S);
  const lost = tr ? t.startWeight - tr.now : 0, need = t.startWeight - t.goalWeight;
  const pts = lastN(n, parse(today)).map((d) => ({ label: parse(d).getDate(), title: dayTitle(d), v: calc(d).weight }));
  const avg7 = (() => { const v = lastN(7, parse(today)).map((d) => calc(d).weight).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; })();
  const label = { good: 'on track', flat: 'steady', bad: 'going up' };
  const chg = (x) => (x?.delta != null ? `${x.delta > 0 ? '+' : '−'}${Math.abs(x.delta).toFixed(1)}` : '—');
  return (
    <>
      <h2>Weight</h2>
      <WeightEntry k={k} setK={setK} />
      {tr && <div className="wstats">
        <div><span>Latest</span><b>{tr.now.toFixed(1)}</b><small>{short(tr.k)}</small></div>
        <div className={tr.status}><span>7 days</span><b>{chg(tr)}</b><small>{label[tr.status]}</small></div>
        <div className={tr30?.status}><span>30 days</span><b>{chg(tr30)}</b><small>kg</small></div>
        <div><span>7-day avg</span><b>{avg7 != null ? avg7.toFixed(1) : '—'}</b><small>kg</small></div>
      </div>}
      <section className="w-chart">
        <div className="row-h"><h3>Every day</h3><div className="period" role="group" aria-label="Period">
          {[14, 30, 90].map((d) => <button key={d} aria-pressed={n === d} onClick={() => setN(d)}>{d}d</button>)}</div></div>
        <WeightChart pts={pts} goal={t.goalWeight} />
      </section>
      <div className="field"><span className="lb">Goal {t.goalWeight} kg · {Math.max(0, lost).toFixed(1)} of {need.toFixed(1)} kg lost{tr ? ` · ${Math.max(0, tr.now - t.goalWeight).toFixed(1)} to go` : ''}</span>
        <div className="goalbar"><i style={{ width: `${Math.max(0, Math.min(1, lost / need)) * 100}%` }} /></div></div>
      <h3>Weigh-ins</h3>
      <div className="list">{ws.slice(0, 14).map((x, i) => {
        const prev = ws[i + 1];
        return (
          <div className="li" key={x.k}>
            <button className="grow wl-btn" onClick={() => setK(x.k)} aria-label={`Edit ${dayTitle(x.k)}`}>
              <span className="nm">{x.w.toFixed(1)} kg</span><span className="mt">{dayTitle(x.k)}</span></button>
            {prev && <span className={`w-d ${x.w < prev.w ? 'good' : x.w > prev.w ? 'bad' : ''}`}>{x.w - prev.w > 0 ? '+' : ''}{(x.w - prev.w).toFixed(1)}</span>}
            <button className="del" onClick={() => A.saveDay(x.k, { weight: null })} aria-label={`Delete ${dayTitle(x.k)} weight`}>×</button>
          </div>
        );
      })}{!ws.length && <div className="empty">No weigh-ins yet.</div>}</div>
      <p className="hint">Tap a weigh-in to change it. Weight from Apple Health fills in by itself.</p>
    </>
  );
}

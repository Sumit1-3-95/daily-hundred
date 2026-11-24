import { useState } from 'react';
const fmt = (n) => Math.round(n).toLocaleString('en-IN');

export function LineChart({ pts, color = 'var(--r2)', aria = 'Trend', goal }) {
  const W = 320, H = 150, pl = 34, pr = 34, pt = 12, pb = 22;
  const vs = pts.map((p) => p.v).filter((v) => v != null);
  if (vs.length < 2) return <div className="empty">Log at least two days to see the trend.</div>;
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (goal != null && goal >= lo - 1.2 && goal <= hi + 1.2) { lo = Math.min(lo, goal); hi = Math.max(hi, goal); }
  const pad = Math.max((hi - lo) * 0.18, 0.3), mn = lo - pad, mx = hi + pad;
  const x = (i) => pl + (i * (W - pl - pr)) / Math.max(1, pts.length - 1);
  const y = (v) => pt + ((mx - v) * (H - pt - pb)) / (mx - mn);
  const P = pts.map((p, i) => (p.v == null ? null : [x(i), y(p.v)])).filter(Boolean);
  const path = P.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${P[P.length - 1][0].toFixed(1)} ${H - pb} L${P[0][0].toFixed(1)} ${H - pb} Z`;
  const last = P[P.length - 1];
  const xi = [0, Math.floor((pts.length - 1) / 2), pts.length - 1];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
      {[lo, (lo + hi) / 2, hi].map((v, i) => (
        <g key={i}><line className="grid" x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} />
          <text x={pl - 6} y={y(v) + 3} textAnchor="end">{v.toFixed(1)}</text></g>
      ))}
      {goal != null && goal >= mn && goal <= mx && <line className="goal" x1={pl} x2={W - pr} y1={y(goal)} y2={y(goal)} />}
      <path d={area} fill={color} opacity=".1" />
      <path className="ln" d={path} stroke={color} />
      <circle cx={last[0]} cy={last[1]} r="4" fill={color} />
      <text className="end-lbl" x={last[0] + 7} y={last[1] + 4}>{vs[vs.length - 1].toFixed(1)}</text>
      {xi.map((i) => <text key={i} x={x(i)} y={H - 6} textAnchor="middle">{pts[i].label}</text>)}
    </svg>
  );
}

export function BarChart({ rows, target, color = 'var(--r2)', aria = 'Bars' }) {
  const W = 320, H = 150, pl = 34, pr = 8, pt = 12, pb = 22;
  const vs = rows.map((r) => r.v);
  let lo = Math.min(0, ...vs), hi = Math.max(target || 0, ...vs, 1);
  hi *= 1.08; if (lo < 0) lo *= 1.12;
  const y = (v) => pt + ((hi - v) * (H - pt - pb)) / (hi - lo);
  const bw = (W - pl - pr) / rows.length;
  const mxv = Math.max(...vs), mnv = Math.min(...vs);
  const every = Math.ceil(rows.length / 7);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
      <line className="grid" x1={pl} x2={W - pr} y1={y(0)} y2={y(0)} />
      <text x={pl - 6} y={y(0) + 3} textAnchor="end">0</text>
      {target ? <><line className="goal" x1={pl} x2={W - pr} y1={y(target)} y2={y(target)} />
        <text x={pl - 6} y={y(target) + 3} textAnchor="end">{fmt(target)}</text></> : null}
      {mxv > (target || 0) * 1.15 && <text x={pl - 6} y={y(mxv) + 3} textAnchor="end">{fmt(mxv)}</text>}
      {lo < 0 && <text x={pl - 6} y={y(mnv) + 3} textAnchor="end">{fmt(mnv)}</text>}
      {rows.map((r, i) => {
        const bx = pl + i * bw + bw * 0.18, w = bw * 0.64, y1 = y(Math.max(0, r.v)), y2 = y(Math.min(0, r.v));
        const hit = target ? r.v >= target : false;
        return (
          <g key={i}>
            <rect x={bx.toFixed(1)} y={y1.toFixed(1)} width={w.toFixed(1)} height={Math.max(1, y2 - y1).toFixed(1)} rx="3"
              fill={r.v < 0 ? 'var(--bad)' : color} opacity={r.dim ? 0.35 : hit ? 1 : 0.7} />
            {(i % every === 0 || i === rows.length - 1) &&
              <text x={(bx + w / 2).toFixed(1)} y={H - 6} textAnchor="middle">{r.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- daily charts with tap-to-read ----------

const rolling = (vals, n = 7) => vals.map((_, i) => {
  const w = vals.slice(Math.max(0, i - n + 1), i + 1).filter((v) => v != null);
  return w.length ? w.reduce((a, b) => a + b, 0) / w.length : null;
});
const tickEvery = (len) => (len <= 8 ? 1 : len <= 16 ? 2 : len <= 31 ? 5 : 14);

/** Line between consecutive points (gaps skipped). */
const pathOf = (P) => P.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

/**
 * Bars for each day plus an optional line on its own scale.
 * rows: [{ label, title, bar, line }]  ·  bars with null are "no data".
 */
export function ComboChart({ rows, target, barColor = 'var(--r3)', lineColor = 'var(--r2)', barUnit = '', lineUnit = '', lineName, barName, avgLine, aria }) {
  const [sel, setSel] = useState(null);
  const W = 320, H = 160, pl = 30, pr = lineName ? 30 : 8, pt = 14, pb = 20;
  const bars = rows.map((r) => r.bar), lines = rows.map((r) => r.line);
  const avg = avgLine ? rolling(bars) : null;
  const bhi = Math.max(1, target || 0, ...bars.filter((v) => v != null)) * 1.1;
  const lhi = Math.max(1, ...lines.filter((v) => v != null)) * 1.1;
  const yb = (v) => pt + ((bhi - v) * (H - pt - pb)) / bhi;
  const yl = (v) => pt + ((lhi - v) * (H - pt - pb)) / lhi;
  const bw = (W - pl - pr) / rows.length;
  const cx = (i) => pl + i * bw + bw / 2;
  const every = tickEvery(rows.length);
  const LP = lineName ? rows.map((r, i) => (r.line == null ? null : [cx(i), yl(r.line)])).filter(Boolean) : [];
  const AP = avg ? avg.map((v, i) => (v == null ? null : [cx(i), yb(v)])).filter(Boolean) : [];
  const s = sel != null ? rows[sel] : null;
  return (
    <div className="dchart">
      <div className="dc-read">{s
        ? <><b>{s.title}</b>{barName && <span><i style={{ background: barColor }} />{s.bar != null ? `${Math.round(s.bar)}${barUnit}` : '—'} {barName}</span>}
          {lineName && <span><i className="ln" style={{ background: lineColor }} />{s.line != null ? `${Math.round(s.line)}${lineUnit}` : '—'} {lineName}</span>}</>
        : <span className="sub">Tap a day to see its numbers</span>}</div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
        <line className="grid" x1={pl} x2={W - pr} y1={yb(0)} y2={yb(0)} />
        <text x={pl - 5} y={yb(0) + 3} textAnchor="end">0</text>
        <text x={pl - 5} y={yb(bhi / 1.1) + 3} textAnchor="end">{fmt(bhi / 1.1)}</text>
        {lineName && <text x={W - pr + 5} y={yl(lhi / 1.1) + 3} style={{ fill: lineColor }}>{fmt(lhi / 1.1)}</text>}
        {target ? <><line className="goal" x1={pl} x2={W - pr} y1={yb(target)} y2={yb(target)} /><text x={pl - 5} y={yb(target) + 3} textAnchor="end" className="tg">{fmt(target)}</text></> : null}
        {rows.map((r, i) => {
          const w = Math.max(2, bw * 0.62), x = cx(i) - w / 2, v = r.bar || 0;
          return (
            <g key={i}>
              {r.bar != null && <rect x={x.toFixed(1)} y={yb(v).toFixed(1)} width={w.toFixed(1)} height={Math.max(1, yb(0) - yb(v)).toFixed(1)} rx={Math.min(3, w / 3)}
                fill={barColor} opacity={sel === i ? 1 : target && v >= target ? 0.95 : 0.6} />}
              {(i % every === 0 || i === rows.length - 1) && <text x={cx(i).toFixed(1)} y={H - 5} textAnchor="middle">{r.label}</text>}
              <rect x={(cx(i) - bw / 2).toFixed(1)} y="0" width={bw.toFixed(1)} height={H} fill="transparent" onClick={() => setSel(sel === i ? null : i)} />
            </g>
          );
        })}
        {AP.length > 1 && <path className="ln avg" d={pathOf(AP)} stroke={barColor} />}
        {LP.length > 1 && <path className="ln" d={pathOf(LP)} stroke={lineColor} pointerEvents="none" />}
        {LP.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={rows.length > 31 ? 1.5 : 2.6} fill={lineColor} pointerEvents="none" />)}
        {sel != null && <line x1={cx(sel)} x2={cx(sel)} y1={pt} y2={H - pb} stroke="var(--ink)" strokeOpacity=".25" pointerEvents="none" />}
      </svg>
    </div>
  );
}

/** Weight per day: a dot for every weigh-in, a 7-day average line, the goal. Tap a day to read it. */
export function WeightChart({ pts, goal }) {
  const [sel, setSel] = useState(null);
  const W = 320, H = 170, pl = 32, pr = 10, pt = 18, pb = 20;
  const vs = pts.map((p) => p.v).filter((v) => v != null);
  if (!vs.length) return <div className="empty">No weigh-ins in this period yet.</div>;
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (goal != null && goal >= lo - 1.5) lo = Math.min(lo, goal);
  const pad = Math.max((hi - lo) * 0.15, 0.4), mn = lo - pad, mx = hi + pad;
  const step = (W - pl - pr) / pts.length;
  const cx = (i) => pl + i * step + step / 2;
  const y = (v) => pt + ((mx - v) * (H - pt - pb)) / (mx - mn);
  const P = pts.map((p, i) => (p.v == null ? null : [cx(i), y(p.v), p.v, i])).filter(Boolean);
  const avg = rolling(pts.map((p) => p.v)).map((v, i) => (v == null || i < 2 ? null : [cx(i), y(v)])).filter(Boolean);
  const every = tickEvery(pts.length);
  const ticks = [lo, (lo + hi) / 2, hi];
  const showVals = P.length <= 12;
  const s = sel != null ? pts[sel] : null;
  return (
    <div className="dchart">
      <div className="dc-read">{s ? <><b>{s.title}</b><span>{s.v != null ? `${s.v.toFixed(1)} kg` : 'no weigh-in'}</span></>
        : <span className="sub"><i className="dot" /> weigh-in <i className="ln" /> 7-day average · tap a day</span>}</div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weight each day">
        {ticks.map((v, i) => <g key={i}><line className="grid" x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} /><text x={pl - 5} y={y(v) + 3} textAnchor="end">{v.toFixed(1)}</text></g>)}
        {goal != null && goal >= mn && <><line className="goal" x1={pl} x2={W - pr} y1={y(goal)} y2={y(goal)} /><text x={W - pr} y={y(goal) - 4} textAnchor="end" className="tg">goal {goal}</text></>}
        {avg.length > 1 && <path className="ln avg" d={pathOf(avg)} stroke="var(--r1)" />}
        {P.length > 1 && <path className="ln thin" d={pathOf(P)} stroke="var(--r2)" />}
        {P.map(([x, yy, v, i]) => <g key={i}>
          <circle cx={x} cy={yy} r={sel === i ? 5 : pts.length > 45 ? 2.2 : 3.4} fill="var(--surface)" stroke="var(--r2)" strokeWidth="2" />
          {showVals && <text x={x} y={yy - 7} textAnchor="middle" className="val">{v.toFixed(1)}</text>}
        </g>)}
        {pts.map((p, i) => <g key={i}>
          {(i % every === 0 || i === pts.length - 1) && <text x={cx(i)} y={H - 5} textAnchor="middle">{p.label}</text>}
          <rect x={cx(i) - step / 2} y="0" width={step} height={H} fill="transparent" onClick={() => setSel(sel === i ? null : i)} />
        </g>)}
        {sel != null && <line x1={cx(sel)} x2={cx(sel)} y1={pt} y2={H - pb} stroke="var(--ink)" strokeOpacity=".25" pointerEvents="none" />}
      </svg>
    </div>
  );
}

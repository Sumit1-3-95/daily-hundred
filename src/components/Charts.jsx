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

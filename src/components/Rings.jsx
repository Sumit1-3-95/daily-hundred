const pct = (v) => `${Math.round(v * 100)}%`;

function Rings({ c, size, sw, radii, label }) {
  const cx = size / 2;
  const parts = [['r1', c.ringT], ['r2', c.ringD], ['r3', c.ringW]];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img"
      aria-label={label ?? `Tasks ${pct(c.ringT)}, deficit ${pct(c.ringD)}, workout ${pct(c.ringW)}`}>
      {parts.map(([cl, v], i) => {
        const r = radii[i], C = 2 * Math.PI * r;
        return (
          <g key={cl}>
            <circle className={`trk ${cl}`} cx={cx} cy={cx} r={r} strokeWidth={sw} />
            {v > 0.001 && (
              <circle className={`arc ${cl}`} cx={cx} cy={cx} r={r} strokeWidth={sw}
                strokeDasharray={`${(v * C).toFixed(2)} ${C.toFixed(2)}`} transform={`rotate(-90 ${cx} ${cx})`}
                opacity={cl === 'r2' && c.open ? 0.55 : 1} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
export const BigRings = ({ c }) => <Rings c={c} size={200} sw={17} radii={[88, 67, 46]} />;
export const MiniRings = ({ c }) => <Rings c={c} size={40} sw={4.2} radii={[17.5, 12.5, 7.5]} />;

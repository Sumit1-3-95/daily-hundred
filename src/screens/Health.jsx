import { useState } from 'react';
import { useStore } from '../store.jsx';
import { BarChart, LineChart } from '../components/Charts.jsx';
import { MBar, fmt } from '../components/ui.jsx';
import { periodStats } from '../lib/calc.js';
import { DOW, MEALS, addDays, key, lastN, parse, short } from '../lib/dates.js';
import FoodPicker from '../components/FoodPicker.jsx';
import { IconTile, iconForWorkout } from '../components/Icons.jsx';

const SUBS = [['overview', 'Overview'], ['food', 'Food'], ['workout', 'Workout'], ['body', 'Body']];

export default function Health() {
  const [sub, setSub] = useState(() => { try { return localStorage.getItem('dh.sub') || 'overview'; } catch { return 'overview'; } });
  const pick = (s) => { setSub(s); try { localStorage.setItem('dh.sub', s); } catch { /* ignore */ } };
  const View = { overview: Overview, food: Food, workout: Workout, body: Body }[sub];
  return (
    <>
      <div className="seg" role="group" aria-label="Health sections">
        {SUBS.map(([id, l]) => <button key={id} aria-pressed={sub === id} onClick={() => pick(id)}>{l}</button>)}
      </div>
      <View />
    </>
  );
}

// ---------- Overview: numbers first ----------
function Delta({ cur, prev, better = 'up', unit = '', dec = 0 }) {
  if (cur == null || prev == null) return <span className="dl flat">no earlier data</span>;
  const d = cur - prev;
  if (Math.abs(d) < Math.pow(10, -dec) / 2) return <span className="dl flat">same as before</span>;
  const good = better === 'up' ? d > 0 : d < 0;
  return <span className={`dl ${good ? 'good' : 'bad'}`}>{d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(dec)}{unit} vs previous</span>;
}

function Overview() {
  const { S, today, calc } = useStore();
  const [n, setN] = useState(7);
  const t = S.targets;
  const P = periodStats(S, n, today, today);
  const Q = periodStats(S, n, key(addDays(parse(today), -n)), today);
  const wchg = P.weightStart != null && P.weightEnd != null ? P.weightEnd - P.weightStart : null;
  const fatKg = P.deficitTotal / 7700;
  const TI = { 'Avg day score': 'check', 'Avg deficit': 'target', 'Fat burned (est.)': 'fire', 'Weight change': 'scale', 'Avg eaten': 'calories',
    'Avg protein': 'bolt', Workout: 'dumbbell', 'Avg sleep': 'moon', 'Avg water': 'water', 'Avg steps': 'steps' };
  const Tile = ({ l, v, s, d }) => <div className="tile"><div className="stat-h"><IconTile name={TI[l]} size="sm" /><span>{l}</span></div><b>{v}</b>{s && <small>{s}</small>}{d}</div>;
  const k14 = lastN(14, parse(today)), cs14 = k14.map(calc);
  const k30 = lastN(30, parse(today));

  const pace = (() => {
    const w = k30.map((k) => calc(k).weight).filter((x) => x != null);
    if (w.length < 5) return null;
    const perWeek = ((w[w.length - 1] - w[0]) / 30) * 7;
    if (perWeek >= -0.05) return null;
    const weeks = (w[w.length - 1] - t.goalWeight) / -perWeek;
    return { perWeek, eta: addDays(parse(today), Math.round(weeks * 7)) };
  })();

  return (
    <>
      <section className="card">
        <div className="row-h"><h3>Your numbers</h3>
          <div className="period" role="group" aria-label="Period">
            {[7, 30, 90].map((d) => <button key={d} aria-pressed={n === d} onClick={() => setN(d)}>{d} days</button>)}
          </div></div>
        <div className="tiles">
          <Tile l="Avg day score" v={P.score != null ? `${Math.round(P.score * 100)}%` : '—'} s={`${P.perfect} perfect day${P.perfect === 1 ? '' : 's'}`}
            d={<Delta cur={P.score != null ? P.score * 100 : null} prev={Q.score != null ? Q.score * 100 : null} unit=" pts" />} />
          <Tile l="Avg deficit" v={P.deficit != null ? `${fmt(P.deficit)} kcal` : '—'} s={`${P.closedDays} of ${n} days closed · target ${t.deficit}`}
            d={<Delta cur={P.deficit} prev={Q.deficit} />} />
          <Tile l="Fat burned (est.)" v={`${fatKg.toFixed(2)} kg`} s={`${fmt(P.deficitTotal)} kcal total deficit`} />
          <Tile l="Weight change" v={wchg != null ? `${wchg > 0 ? '+' : ''}${wchg.toFixed(1)} kg` : '—'}
            s={P.weightEnd != null ? `now ${P.weightEnd.toFixed(1)} kg` : 'log your weight'} />
          <Tile l="Avg eaten" v={P.kcal != null ? `${fmt(P.kcal)} kcal` : '—'} s={`target ${fmt(t.kcal)} · ${P.loggedDays} days logged`}
            d={<Delta cur={P.kcal} prev={Q.kcal} better="down" />} />
          <Tile l="Avg protein" v={P.protein != null ? `${fmt(P.protein)} g` : '—'} s={`target hit ${P.proteinHit} of ${P.loggedDays} days`}
            d={<Delta cur={P.protein} prev={Q.protein} unit=" g" />} />
          <Tile l="Workout" v={`${fmt(P.workoutMin)} min`} s={`${P.sessions} sessions · ${fmt(P.activeKcal)} active kcal`}
            d={<Delta cur={P.workoutMin} prev={Q.workoutMin} unit=" min" />} />
          <Tile l="Avg sleep" v={P.sleep != null ? `${P.sleep.toFixed(1)} h` : '—'} s={`target ${t.sleep} h`}
            d={<Delta cur={P.sleep} prev={Q.sleep} unit=" h" dec={1} />} />
          <Tile l="Avg water" v={P.water != null ? `${(P.water / 1000).toFixed(2)} L` : '—'} s={`target ${t.water / 1000} L`}
            d={<Delta cur={P.water != null ? P.water / 1000 : null} prev={Q.water != null ? Q.water / 1000 : null} unit=" L" dec={2} />} />
          <Tile l="Avg steps" v={P.steps != null ? fmt(P.steps) : '—'} s="from Apple Health" d={<Delta cur={P.steps} prev={Q.steps} />} />
        </div>
        {pace && <p className="hint">Losing {Math.abs(pace.perWeek).toFixed(2)} kg a week over the last 30 days. At this pace you reach {t.goalWeight} kg around {pace.eta.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}.</p>}
      </section>
      <section className="card"><div className="row-h"><h3>Weight</h3><span className="sub">kg · 30 days</span></div>
        <LineChart pts={k30.map((k) => ({ label: short(k), v: calc(k).weight }))} aria="Weight over 30 days" goal={t.goalWeight} /></section>
      <section className="card"><div className="row-h"><h3>Day score</h3><span className="sub">% · 14 days</span></div>
        <BarChart rows={cs14.map((c, i) => ({ label: parse(k14[i]).getDate(), v: Math.round(c.score * 100), dim: !c.hasData }))} target={100} color="var(--r1)" aria="Daily score" /></section>
      <section className="card"><div className="row-h"><h3>Calorie deficit</h3><span className="sub">kcal · 14 days</span></div>
        <BarChart rows={cs14.map((c, i) => ({ label: parse(k14[i]).getDate(), v: Math.round(c.d.food.length ? c.shownD : 0), dim: !c.closed }))} target={t.deficit} aria="Daily deficit" />
        <div className="legend-inline"><span><i style={{ background: 'var(--r2)' }} />closed day</span><span><i style={{ background: 'var(--r2)', opacity: 0.35 }} />not closed</span><span><i style={{ background: 'var(--bad)' }} />surplus</span></div></section>
      <section className="card"><div className="row-h"><h3>Protein</h3><span className="sub">g · 14 days</span></div>
        <BarChart rows={cs14.map((c, i) => ({ label: parse(k14[i]).getDate(), v: Math.round(c.protein) }))} target={t.protein} color="var(--r3)" aria="Daily protein" /></section>
    </>
  );
}

// ---------- Food ----------
function Food() {
  const { S, today, calc, A } = useStore();
  const c = calc(today);
  const live = S.foods.filter((f) => !f.archived);
  return (
    <>
      <section className="card"><h3>Add food</h3><FoodPicker k={today} /></section>
      <section className="card"><h3>Today's log</h3><div className="list">
        {!c.d.food.length && <div className="empty">Nothing logged yet today.</div>}
        {MEALS.map((m) => {
          const rows = c.d.food.filter((f) => f.meal === m);
          if (!rows.length) return null;
          return (
            <div key={m}><div className="meal-h">{m}</div>
              {rows.map((f) => {
                const x = S.foodsById[f.food_id] || { name: 'Deleted item', serving: '', kcal: 0, protein: 0 };
                return (
                  <div className="li" key={f.id}><IconTile name={x.icon || 'bowl'} size="sm" />
                    <div className="grow"><div className="nm">{x.name}</div>
                      <div className="mt">{Number(f.qty)} × {x.serving} · {fmt(x.protein * f.qty)} g protein</div></div>
                    <div className="stepper">
                      <button onClick={() => A.setFoodQty(today, f, Number(f.qty) - 1)} aria-label="Less">−</button>
                      <span className="v">{fmt(x.kcal * f.qty)}</span>
                      <button onClick={() => A.setFoodQty(today, f, Number(f.qty) + 1)} aria-label="More">+</button>
                    </div></div>
                );
              })}</div>
          );
        })}</div></section>
      <section className="card"><div className="row-h"><h3>Your foods</h3><span className="sub">tick to show in quick picks</span></div>
        <div className="list">{live.map((f) => (
          <div className="li" key={f.id}><IconTile name={f.icon || 'bowl'} size="sm" />
            <div className="grow"><div className="nm">{f.name}</div><div className="mt">{f.serving} · {fmt(f.kcal)} kcal · {f.protein} g</div></div>
            <input type="checkbox" id={`q-${f.id}`} checked={!!f.quick} onChange={(e) => A.updateFood(f.id, { quick: e.target.checked })} aria-label={`Show ${f.name} in quick picks`} />
          </div>
        ))}</div></section>
    </>
  );
}

// ---------- Workout ----------
function Workout() {
  const { S, today, calc, A, open } = useStore();
  const t = S.targets, c = calc(today);
  const T = parse(today);
  const mon = addDays(T, -((T.getDay() + 6) % 7));
  const wk = Array.from({ length: 7 }, (_, i) => key(addDays(mon, i)));
  const rows = wk.map((k) => ({ label: DOW[parse(k).getDay()].slice(0, 2), v: k > today ? 0 : Math.round(calc(k).wMin), dim: k > today }));
  const total = rows.reduce((a, r) => a + r.v, 0);
  const areas = {};
  lastN(14, T).forEach((k) => (S.days[k]?.workouts || []).forEach((w) => { areas[w.area] = (areas[w.area] || 0) + Number(w.minutes); }));
  const amax = Math.max(1, ...Object.values(areas));
  const src = { apple_watch: 'Apple Watch', cult: 'Cult app', manual: 'Manual' };
  return (
    <>
      <section className="card"><div className="row-h"><h3>Today</h3><span className="sub">{c.d.workouts.length} session{c.d.workouts.length === 1 ? '' : 's'}</span></div>
        <div className="list">{c.d.workouts.length ? c.d.workouts.map((w) => (
          <div className="li" key={w.id}><IconTile name={iconForWorkout(w.area)} size="sm" /><div className="grow"><div className="nm">{w.name}</div><div className="mt">{w.area} · {src[w.source]}</div></div>
            <div className="rt">{fmt(w.minutes)} min<small>{fmt(w.kcal)} kcal</small></div>
            <button className="del" onClick={() => A.deleteWorkout(today, w)} aria-label={`Remove ${w.name}`}>✕</button></div>
        )) : <div className="empty">No workout logged yet. Apple Watch workouts arrive when your Shortcut runs.</div>}</div>
        <div className="btn-row">
          <button className="btn sm" onClick={() => open('logWorkout')}>Log workout</button>
          <button className="btn ghost sm" onClick={() => open('newWorkout')}>New workout type</button>
        </div></section>
      <section className="card"><div className="row-h"><h3>This week</h3><span className="sub">{total} of {t.workoutMin * 6} min</span></div>
        <BarChart rows={rows} target={t.workoutMin} color="var(--r3)" aria="Workout minutes this week" /></section>
      <section className="card"><div className="row-h"><h3>Areas trained</h3><span className="sub">minutes · 14 days</span></div>
        {Object.keys(areas).length ? Object.entries(areas).sort((a, b) => b[1] - a[1]).map(([a, m]) => (
          <div className="hbar" key={a}><span>{a}</span><div className="tr"><i style={{ width: `${(m / amax) * 100}%` }} /></div><b>{fmt(m)}</b></div>
        )) : <div className="empty">No workouts in the last 14 days.</div>}</section>
      <section className="card"><h3>Workout types</h3><div className="list">{S.wtypes.map((w) => (
        <div className="li" key={w.id}><IconTile name={iconForWorkout(w.area)} size="sm" /><div className="grow"><div className="nm">{w.name}</div><div className="mt">{w.area}</div></div>
          <div className="rt">{w.kcal_per_min}<small>kcal / min</small></div></div>
      ))}</div></section>
    </>
  );
}

// ---------- Body ----------
function Body() {
  const { S, open } = useStore();
  const b = S.scans[S.scans.length - 1], prev = S.scans.length > 1 ? S.scans[S.scans.length - 2] : null;
  if (!b) return (
    <section className="card"><h3>Body scans</h3>
      <div className="empty">No body scan yet. Add your InBody numbers to track body fat, muscle and visceral fat.</div>
      <button className="btn" onClick={() => open('measure')}>Add measurement</button></section>
  );
  const st = (v, ok, warn) => (v <= ok ? 'good' : v <= warn ? 'warn' : 'bad');
  const delta = (f, dec = 1) => prev && b[f] != null && prev[f] != null
    ? <small>{b[f] - prev[f] > 0 ? '+' : ''}{(b[f] - prev[f]).toFixed(dec)} since {short(prev.date)}</small> : null;
  const M = ({ l, v, pill, cls, f, dec }) => <div className="metric"><span>{l}</span><b>{v}</b><span className={`pill ${cls}`}>{pill}</span>{f && delta(f, dec)}</div>;
  const sg = b.seg || {};
  const Cell = ({ area, l, v, lim }) => v == null ? <div style={{ gridArea: area }} className="ok">{l}<b>—</b></div>
    : <div style={{ gridArea: area }} className={v > lim ? 'over' : 'ok'}>{l}<b>{v} kg</b>{v > lim ? 'Over' : 'Normal'}</div>;
  return (
    <>
      <section className="card"><div className="row-h"><h3>Latest body scan</h3><span className="sub">{short(b.date)}{b.source ? ` · ${b.source}` : ''}</span></div>
        <div className="metrics">
          <M l="Body fat" v={`${b.pbf}%`} pill={b.pbf > 20 ? 'Over · aim 20%' : 'Healthy'} cls={st(b.pbf, 20, 24)} f="pbf" />
          <M l="Fat mass" v={`${b.fat_mass} kg`} pill={b.fat_mass > 15.8 ? 'Over · aim < 15.8' : 'Normal'} cls={b.fat_mass > 15.8 ? 'warn' : 'good'} f="fat_mass" />
          <M l="Muscle (SMM)" v={`${b.smm} kg`} pill={b.smm >= 29 ? 'Normal' : 'Low'} cls={b.smm >= 29 ? 'good' : 'warn'} f="smm" />
          <M l="Visceral fat" v={`Level ${b.visceral}`} pill={b.visceral < 10 ? 'Under 10' : '10 or more'} cls={st(b.visceral, 9, 12)} f="visceral" dec={0} />
          <M l="Waist-hip" v={b.whr} pill={b.whr > 0.9 ? 'High · aim < 0.90' : 'Healthy'} cls={st(b.whr, 0.9, 0.95)} f="whr" dec={2} />
          <M l="Weight" v={`${b.weight} kg`} pill={b.score ? `InBody score ${b.score}` : 'Scan'} cls="" f="weight" />
        </div>
        <p className="hint">Next scan due around {short(key(addDays(parse(b.date), 28)))}. Test in the morning, before eating.</p>
        <button className="btn sm ghost" onClick={() => open('measure')}>Add measurement</button></section>
      <section className="card"><div className="row-h"><h3>Where the fat sits</h3><span className="sub">segmental fat</span></div>
        <div className="seg-body">
          <Cell area="la" l="Left arm" v={sg.la} lim={1.0} /><Cell area="tr" l="Trunk" v={sg.tr} lim={8.5} />
          <Cell area="ra" l="Right arm" v={sg.ra} lim={1.0} /><Cell area="ll" l="Left leg" v={sg.ll} lim={3.0} /><Cell area="rl" l="Right leg" v={sg.rl} lim={3.0} />
        </div></section>
      <section className="card"><h3>Scan history</h3><div className="tbl-wrap"><table>
        <thead><tr><th>Date</th><th>Weight</th><th>Fat %</th><th>SMM</th><th>Visceral</th><th>WHR</th><th>Trunk</th></tr></thead>
        <tbody>{[...S.scans].reverse().map((x) => (
          <tr key={x.id}><td>{short(x.date)}</td><td>{x.weight}</td><td>{x.pbf}</td><td>{x.smm}</td><td>{x.visceral}</td><td>{x.whr}</td><td>{x.seg?.tr ?? '—'}</td></tr>
        ))}</tbody></table></div></section>
      <BloodCard />
    </>
  );
}

function BloodCard() {
  const { S, open } = useStore();
  const byName = {};
  S.blood.forEach((r) => { (byName[r.name] ||= []).push(r); });
  return (
    <section className="card"><div className="row-h"><h3>Blood tests</h3><button className="link" onClick={() => open('blood')}>Add result</button></div>
      {S.blood.length ? <div className="list">{Object.entries(byName).map(([name, rs]) => {
        const last = rs[rs.length - 1], prev = rs[rs.length - 2];
        return (
          <div className="li" key={name}><div className="grow"><div className="nm">{name}</div>
            <div className="mt">{short(last.date)}{prev ? ` · was ${prev.value} on ${short(prev.date)}` : ''}</div></div>
            <div className="rt">{last.value} {last.unit}</div></div>
        );
      })}</div> : <div className="empty">No results yet. Add values like HbA1c, vitamin D, B12 or your lipid profile.</div>}
    </section>
  );
}

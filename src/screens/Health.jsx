import { useState } from 'react';
import { useStore } from '../store.jsx';
import { BarChart, LineChart } from '../components/Charts.jsx';
import { MBar, fmt } from '../components/ui.jsx';
import { periodStats } from '../lib/calc.js';
import { METRICS } from '../lib/metrics.js';
import { DOW, MEALS, addDays, key, lastN, parse, short } from '../lib/dates.js';
import FoodPicker from '../components/FoodPicker.jsx';
import { PlanCalendar, PlanCard } from '../components/Plan.jsx';
import { FoodThumb } from '../components/TodayCards.jsx';
import { Icon, IconTile, iconForWorkout } from '../components/Icons.jsx';

const SUBS = [['overview', 'Overview'], ['food', 'Food'], ['workout', 'Workout'], ['body', 'Body']];
const SRC = { apple_watch: 'Apple Watch', cult: 'Cult', manual: 'Manual' };

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

// ---------- Overview: one summary, one habits list, two charts ----------
function Delta({ cur, prev, better = 'up', unit = '', dec = 0 }) {
  if (cur == null || prev == null) return null;
  const d = cur - prev;
  if (Math.abs(d) < Math.pow(10, -dec) / 2) return null;
  const good = better === 'up' ? d > 0 : d < 0;
  return <span className={`dl ${good ? 'good' : 'bad'}`}>{d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(dec)}{unit}</span>;
}

function Overview() {
  const { S, today, calc } = useStore();
  const [n, setN] = useState(7);
  const t = S.targets;
  const P = periodStats(S, n, today, today);
  const Q = periodStats(S, n, key(addDays(parse(today), -n)), today);
  const keys = lastN(n, parse(today));
  const cs = keys.map(calc).filter((c) => c.hasData);
  const wchg = P.weightStart != null && P.weightEnd != null ? P.weightEnd - P.weightStart : null;
  const k14 = lastN(14, parse(today)), cs14 = k14.map(calc);
  const k30 = lastN(30, parse(today));
  const pace = (() => {
    const w = k30.map((k) => calc(k).weight).filter((x) => x != null);
    if (w.length < 5) return null;
    const perWeek = ((w[w.length - 1] - w[0]) / 30) * 7;
    if (perWeek >= -0.05) return null;
    return { perWeek, eta: addDays(parse(today), Math.round(((w[w.length - 1] - t.goalWeight) / -perWeek) * 7)) };
  })();
  const habits = [
    ['protein', P.protein != null ? `${fmt(P.protein)} g` : '—'],
    ['water', P.water != null ? `${(P.water / 1000).toFixed(1)} L` : '—'],
    ['sleep', P.sleep != null ? `${P.sleep.toFixed(1)} h` : '—'],
    ['eaten', P.kcal != null ? `${fmt(P.kcal)} kcal` : '—'],
    ['steps', P.steps != null ? fmt(P.steps) : '—'],
  ].filter(([m]) => m !== 'steps' || P.steps != null);

  return (
    <>
      <section className="card">
        <div className="row-h"><h3>Summary</h3>
          <div className="period" role="group" aria-label="Period">
            {[7, 30, 90].map((d) => <button key={d} aria-pressed={n === d} onClick={() => setN(d)}>{d}d</button>)}
          </div></div>
        <div className="ov-hero">
          <div><b>{P.score != null ? `${Math.round(P.score * 100)}%` : '—'}</b><span>avg day score</span>
            <Delta cur={P.score != null ? P.score * 100 : null} prev={Q.score != null ? Q.score * 100 : null} unit=" pts" /></div>
          <div><b>{P.perfect}</b><span>perfect day{P.perfect === 1 ? '' : 's'}</span></div>
          <div><b>{wchg != null ? `${wchg > 0 ? '+' : ''}${wchg.toFixed(1)}` : '—'}</b><span>kg change</span></div>
        </div>
        <div className="ov-tiles">
          <div className="tile"><div className="stat-h"><IconTile name="target" size="sm" /><span>Deficit</span></div>
            <b>{P.deficit != null ? fmt(P.deficit) : '—'}</b><small>avg kcal on {P.closedDays} closed days</small>
            <small>≈ {(P.deficitTotal / 7700).toFixed(2)} kg fat burned</small></div>
          <div className="tile"><div className="stat-h"><IconTile name="dumbbell" size="sm" /><span>Workout</span></div>
            <b>{fmt(P.workoutMin)} min</b><small>{P.sessions} sessions · {fmt(P.activeKcal)} active kcal</small>
            <Delta cur={P.workoutMin} prev={Q.workoutMin} unit=" min" /></div>
        </div>
      </section>

      <section className="card"><div className="row-h"><h3>Habits</h3><span className="sub">average · days on target</span></div>
        <div className="habits">{habits.map(([m, val]) => {
          const M = METRICS[m];
          const hit = cs.filter((c) => M.hit(c, t)).length;
          return (
            <div className="habit" key={m}>
              <IconTile name={M.icon} size="sm" />
              <div className="grow"><div className="nm">{M.label} <span className="sub">{val}</span></div>
                <div className="hdots">{keys.slice(-Math.min(n, 14)).map((k) => { const c = calc(k);
                  return <i key={k} className={!c.hasData ? 'na' : M.hit(c, t) ? 'on' : ''} />; })}</div></div>
              <div className="rt">{hit}<small>of {cs.length}</small></div>
            </div>
          );
        })}</div>
        <p className="hint">Dots show the last {Math.min(n, 14)} days. Calories count as on target when a closed day stays under {fmt(t.kcal)} kcal.</p>
      </section>

      <section className="card"><div className="row-h"><h3>Weight</h3><span className="sub">kg · 30 days</span></div>
        <LineChart pts={k30.map((k) => ({ label: short(k), v: calc(k).weight }))} aria="Weight over 30 days" goal={t.goalWeight} />
        {pace && <p className="hint">Losing {Math.abs(pace.perWeek).toFixed(2)} kg a week. At this pace you reach {t.goalWeight} kg around {pace.eta.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}.</p>}</section>

      <section className="card"><div className="row-h"><h3>Day score</h3><span className="sub">% · 14 days</span></div>
        <BarChart rows={cs14.map((c, i) => ({ label: parse(k14[i]).getDate(), v: Math.round(c.score * 100), dim: !c.hasData }))} target={100} color="var(--r1)" aria="Daily score" /></section>
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
      <section className="card"><div className="row-h"><h3>Today's log</h3><span className="sub">{fmt(c.eaten)} kcal · {fmt(c.protein)} g protein</span></div>
        {!c.d.food.length && <div className="empty">Nothing logged yet today.</div>}
        {MEALS.map((m) => {
          const rows = c.d.food.filter((f) => f.meal === m);
          if (!rows.length) return null;
          return (
            <div key={m}><div className="meal-h">{m}</div>
              <div className="logcards">{rows.map((f) => {
                const x = S.foodsById[f.food_id] || { name: 'Deleted item', serving: '', kcal: 0, protein: 0 };
                return (
                  <div className={`lcard${f.is_default ? ' dflt' : ''}`} key={f.id}>
                    <span className="sc-img"><FoodThumb f={x} />{Number(f.qty) > 1 && <span className="qtag">×{Number(f.qty)}</span>}</span>
                    <div className="lc-b"><span className="lc-n">{x.name}{f.is_default && <span className="dtag">default</span>}</span>
                      <span className="lc-k">{fmt(x.kcal * f.qty)} <small>kcal · {fmt(x.protein * f.qty)} g</small></span></div>
                    <div className="stepper">
                      <button onClick={() => A.setFoodQty(today, f, Number(f.qty) - 1)} aria-label={`One less ${x.name}`}>−</button>
                      <button onClick={() => A.setFoodQty(today, f, Number(f.qty) + 1)} aria-label={`One more ${x.name}`}>+</button>
                    </div>
                  </div>
                );
              })}</div></div>
          );
        })}</section>
    </>
  );
}

// ---------- Workout: 7-day cards, today's cards, areas ----------
function WorkoutCard({ w, onDelete }) {
  return (
    <div className="wcard">
      <IconTile name={iconForWorkout(w.area)} />
      <div className="wc-name">{w.name}</div>
      <div className="wc-nums"><span><b>{fmt(w.minutes)}</b> min</span><span><b>{fmt(w.kcal)}</b> kcal</span></div>
      <div className="wc-meta">{w.area} · {SRC[w.source]}</div>
      {onDelete && <button className="wc-x" onClick={onDelete} aria-label={`Remove ${w.name}`}>×</button>}
    </div>
  );
}

function Workout() {
  const { S, today, calc, A, open } = useStore();
  const t = S.targets;
  const T = parse(today);
  const week = lastN(7, T);
  const [sel, setSel] = useState(today);
  const wk = week.map((k) => ({ k, c: calc(k), ws: S.days[k]?.workouts || [] }));
  const totMin = wk.reduce((a, x) => a + x.c.wMin, 0);
  const totKcal = wk.reduce((a, x) => a + x.ws.reduce((b, w) => b + Number(w.kcal), 0), 0);
  const sessions = wk.reduce((a, x) => a + x.ws.length, 0);
  const selDay = wk.find((x) => x.k === sel) || wk[wk.length - 1];
  const areas = {};
  lastN(14, T).forEach((k) => (S.days[k]?.workouts || []).forEach((w) => { areas[w.area] = (areas[w.area] || 0) + Number(w.minutes); }));
  const amax = Math.max(1, ...Object.values(areas));
  return (
    <>
      <PlanCard k={today} />
      <PlanCalendar />
      <section className="card">
        <div className="row-h"><h3>Last 7 days</h3><span className="sub">{fmt(totMin)} min · {sessions} sessions</span></div>
        <div className="wdays">{wk.map(({ k, c, ws }) => {
          const kcal = ws.reduce((a, w) => a + Number(w.kcal), 0);
          return (
            <button key={k} className={`wday${ws.length ? ' on' : ''}${sel === k ? ' sel' : ''}`} onClick={() => setSel(k)} aria-pressed={sel === k}>
              <span className="wd-d">{k === today ? 'Today' : DOW[parse(k).getDay()].slice(0, 3)}</span>
              {ws.length ? <Icon name={iconForWorkout(ws[0].area)} size={18} /> : <span className="wd-rest">{c.rest ? 'rest' : '·'}</span>}
              <span className="wd-k">{ws.length ? fmt(kcal) : ''}</span>
            </button>
          );
        })}</div>
        <MBar v={totMin / (t.workoutMin * 6)} cls="r3" />
        <p className="hint">{fmt(totKcal)} kcal from workouts this week · target {t.workoutMin * 6} min</p>
        <div className="wsel">
          <div className="row-h"><h3>{selDay.k === today ? 'Today' : parse(selDay.k).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</h3>
            <button className="link" onClick={() => open('day', { k: selDay.k })}>Full day</button></div>
          {selDay.ws.length
            ? <div className="wgrid">{selDay.ws.map((w) => <WorkoutCard key={w.id} w={w} onDelete={selDay.k === today ? () => A.deleteWorkout(today, w) : undefined} />)}</div>
            : <div className="empty">{selDay.c.rest ? 'Rest day.' : 'No workout logged.'}</div>}
          {selDay.k === today && <button className="btn" onClick={() => open('logWorkout')}>+ Log a workout</button>}
        </div>
      </section>
      <section className="card"><div className="row-h"><h3>Areas trained</h3><span className="sub">min · 14 days</span></div>
        {Object.keys(areas).length ? <div className="areas">{Object.entries(areas).sort((a, b) => b[1] - a[1]).map(([a, m]) => (
          <div className="area" key={a}><IconTile name={iconForWorkout(a)} size="sm" /><span className="grow">{a}</span>
            <span className="tr"><i style={{ width: `${(m / amax) * 100}%` }} /></span><b>{fmt(m)}</b></div>
        ))}</div> : <div className="empty">No workouts in the last 14 days.</div>}</section>
    </>
  );
}

// ---------- Body ----------
/** A friendly figure coloured by where the fat sits (InBody segmental fat). */
function FatFigure({ seg }) {
  const lim = { la: 1.0, ra: 1.0, tr: 8.5, ll: 3.0, rl: 3.0 };
  const cls = (s) => (seg[s] == null ? 'na' : seg[s] > lim[s] ? 'over' : 'ok');
  const v = (s) => (seg[s] == null ? '–' : seg[s]);
  return (
    <svg className="figure" viewBox="0 0 220 250" role="img" aria-label="Body fat by segment">
      <g className="fig-head"><circle cx="110" cy="30" r="20" /><circle cx="103" cy="27" r="2" className="eye" /><circle cx="117" cy="27" r="2" className="eye" />
        <path d="M103 36q7 5 14 0" className="smile" /></g>
      <rect className={`seg ${cls('la')}`} x="44" y="62" width="24" height="88" rx="12" transform="rotate(10 56 66)" />
      <rect className={`seg ${cls('ra')}`} x="152" y="62" width="24" height="88" rx="12" transform="rotate(-10 164 66)" />
      <rect className={`seg ${cls('tr')}`} x="74" y="56" width="72" height="96" rx="26" />
      <rect className={`seg ${cls('ll')}`} x="78" y="150" width="28" height="92" rx="14" />
      <rect className={`seg ${cls('rl')}`} x="114" y="150" width="28" height="92" rx="14" />
      <text x="110" y="100" className="fig-v">{v('tr')}</text><text x="110" y="116" className="fig-l">trunk</text>
      <text x="48" y="112" className="fig-v sm">{v('la')}</text><text x="172" y="112" className="fig-v sm">{v('ra')}</text>
      <text x="92" y="200" className="fig-v sm">{v('ll')}</text><text x="128" y="200" className="fig-v sm">{v('rl')}</text>
      <text x="22" y="246" className="fig-l">Left</text><text x="198" y="246" className="fig-l">Right</text>
    </svg>
  );
}

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
  const over = ['la', 'ra', 'tr', 'll', 'rl'].filter((s) => sg[s] != null && sg[s] > { la: 1, ra: 1, tr: 8.5, ll: 3, rl: 3 }[s]);
  return (
    <>
      <section className="card"><div className="row-h"><h3>Latest body scan</h3><span className="sub">{short(b.date)}</span></div>
        <div className="metrics">
          <M l="Body fat" v={`${b.pbf}%`} pill={b.pbf > 20 ? 'Over · aim 20%' : 'Healthy'} cls={st(b.pbf, 20, 24)} f="pbf" />
          <M l="Muscle (SMM)" v={`${b.smm} kg`} pill={b.smm >= 29 ? 'Normal' : 'Low'} cls={b.smm >= 29 ? 'good' : 'warn'} f="smm" />
          <M l="Visceral fat" v={`Level ${b.visceral}`} pill={b.visceral < 10 ? 'Under 10' : '10 or more'} cls={st(b.visceral, 9, 12)} f="visceral" dec={0} />
          <M l="Waist-hip" v={b.whr} pill={b.whr > 0.9 ? 'High · aim < 0.90' : 'Healthy'} cls={st(b.whr, 0.9, 0.95)} f="whr" dec={2} />
        </div>
        <p className="hint">{b.weight} kg · fat mass {b.fat_mass} kg{b.score ? ` · InBody score ${b.score}` : ''}. Next scan around {short(key(addDays(parse(b.date), 28)))}.</p>
        <button className="btn sm ghost" onClick={() => open('measure')}>Add measurement</button></section>
      <section className="card"><div className="row-h"><h3>Where the fat sits</h3><span className="sub">kg of fat</span></div>
        <div className="fig-wrap"><FatFigure seg={sg} />
          <div className="fig-key"><span><i className="over" />Over</span><span><i className="ok" />Normal</span></div></div>
        <p className="hint">{over.includes('tr') ? 'Most of the extra fat is around your middle. Trunk fat and waist-hip ratio are the numbers to watch.' : over.length ? 'Some segments are over the normal range.' : 'All segments are in the normal range.'}</p></section>
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

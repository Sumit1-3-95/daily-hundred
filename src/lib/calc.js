// Pure calculations: day totals, weighted task score, rings, period stats.
// No React or Supabase here, so it can be unit-tested with `npm test`.
import { addDays, key, parse } from './dates.js';

/** Which part of the day score a task belongs to. */
export const pillarOf = (t) => (t.type === 'auto'
  ? (['water', 'protein', 'calories', 'deficit'].includes(t.auto_key) ? 'intake' : ['workout', 'burn'].includes(t.auto_key) ? 'workout' : 'habits')
  : 'habits');
export const PILLARS = ['habits', 'intake', 'workout'];

const log_exercise = (d) => d.log?.exercise_min;

export const emptyDay = () => ({ log: null, food: [], workouts: [], tlogs: {} });
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export const AUTO_LABEL = {
  workout: (t) => `Workout ${t.workoutMin} min`,
  protein: (t) => `Hit ${t.protein} g protein`,
  water: (t) => `Drink ${t.water / 1000} L water`,
  sleep: (t) => `Sleep ${t.sleep} hours`,
  closed: () => 'Log all meals and close the day',
  deficit: (t) => `${t.deficit} kcal deficit`,
  calories: (t) => `Eat under ${Number(t.kcal).toLocaleString('en-IN')} kcal`,
  burn: (t) => `Burn ${t.activeKcal} active kcal`,
};
export const taskName = (task, targets) =>
  task.type === 'auto' && AUTO_LABEL[task.auto_key] ? AUTO_LABEL[task.auto_key](targets) : task.name;

/**
 * @param {object} S store: { targets, foodsById, tasks, items, days }
 * @param {string} k day key YYYY-MM-DD
 * @param {string} today today's key (open-day projection only applies to today)
 */
export function calcDay(S, k, today) {
  const d = S.days[k] || emptyDay();
  const t = S.targets;
  const log = d.log || {};
  const dow = parse(k).getDay();

  let eaten = 0, protein = 0;
  for (const f of d.food) {
    const x = S.foodsById[f.food_id];
    if (!x) continue;
    eaten += x.kcal * f.qty;
    protein += x.protein * f.qty;
  }
  // workout time: logged workouts, or Apple Watch exercise minutes if those are higher (no double counting)
  const loggedMin = d.workouts.reduce((a, w) => a + Number(w.minutes), 0);
  const watchMin = Number(log_exercise(d)) || 0;
  const wMin = Math.max(loggedMin, watchMin);
  const wKcal = d.workouts.reduce((a, w) => a + Number(w.kcal), 0);
  const active = Math.max(Number(log.active_kcal) || 0, wKcal);
  const burned = t.bmr + active;
  const deficit = burned - eaten;
  const closed = !!log.closed, rest = !!log.rest;
  const open = !closed && k === today;
  const proj = burned - Math.max(eaten, t.kcal);
  const shownD = open ? proj : deficit;
  const left = burned - t.deficit - eaten;
  const water = log.water_ml || 0, sleep = Number(log.sleep_hours) || 0;

  const list = S.tasks
    .filter((x) => !x.archived && x.type !== 'avoid' && (x.type === 'todo' ? x.on_day === k : x.days.includes(dow)) && !(rest && x.auto_key === 'workout'))
    .sort((a, b) => a.sort - b.sort);

  const credit = (x) => {
    const tl = d.tlogs[x.id] || {};
    switch (x.type) {
      case 'check': case 'todo': return tl.done ? 1 : 0;
      case 'number': return x.target ? clamp((Number(tl.value) || 0) / x.target) : (tl.done ? 1 : 0);
      case 'checklist': {
        const its = S.items.filter((i) => i.list_id === x.list_id);
        if (!its.length) return tl.done ? 1 : 0;
        const got = (tl.items || []).filter((id) => its.some((i) => i.id === id)).length;
        return got / its.length;
      }
      case 'auto':
        return ({
          workout: clamp(wMin / t.workoutMin),
          protein: clamp(protein / t.protein),
          water: clamp(water / t.water),
          sleep: clamp(sleep / t.sleep),
          closed: closed ? 1 : 0,
          deficit: closed ? clamp(Math.max(0, deficit) / t.deficit) : 0,
          // under the calorie target, judged once the day is closed
          calories: closed ? (eaten <= t.kcal ? 1 : clamp(t.kcal / eaten)) : 0,
          burn: clamp(active / (t.activeKcal || 400)),
        })[x.auto_key] ?? 0;
      default: return 0;
    }
  };
  const scored = list.map((x) => ({ task: x, credit: credit(x), pillar: pillarOf(x) }));
  const pillars = Object.fromEntries(PILLARS.map((p) => {
    const its = scored.filter((s) => s.pillar === p);
    const max = its.reduce((a, s) => a + s.task.weight, 0), got = its.reduce((a, s) => a + s.task.weight * s.credit, 0);
    return [p, { pts: got, max, score: max ? got / max : null, done: its.filter((s) => s.credit >= 0.999).length, total: its.length }];
  }));
  const maxPts = scored.reduce((a, s) => a + s.task.weight, 0);
  // things to avoid (alcohol, smoking): each one logged takes its weight off the points
  const avoids = S.tasks.filter((x) => !x.archived && x.type === 'avoid' && x.days.includes(dow))
    .map((task) => ({ task, count: Number(d.tlogs[task.id]?.value) || 0 }));
  const penalty = avoids.reduce((a, x) => a + x.task.weight * x.count, 0);
  const earned = scored.reduce((a, s) => a + s.task.weight * s.credit, 0);
  const pts = Math.max(0, earned - penalty);
  const score = maxPts ? pts / maxPts : 0;
  const done = scored.filter((s) => s.credit >= 0.999).length;

  return {
    d, log, eaten, protein, wMin, wKcal, active, burned, deficit, closed, rest, open, proj, shownD, left,
    water, sleep, weight: log.weight != null ? Number(log.weight) : null, steps: log.steps ?? null, watchMin, loggedMin,
    scored, score, pts, maxPts, done, total: list.length, avoids, penalty, pillars,
    hasData: !!(d.log || d.food.length || d.workouts.length || Object.keys(d.tlogs).length),
    // rings: habits, intake, workout
    ringT: pillars.habits.score ?? 0,
    ringD: pillars.intake.score ?? 0,
    ringW: rest ? 1 : (pillars.workout.score ?? clamp(wMin / t.workoutMin)),
  };
}

/** Perfect-day streak ending today (or yesterday if today isn't 100% yet). */
export function streak(S, today) {
  let n = 0;
  const base = parse(today);
  const startsToday = calcDay(S, today, today).score >= 0.999;
  for (let i = startsToday ? 0 : 1; i < 400; i++) {
    const k = key(addDays(base, -i));
    const c = calcDay(S, k, today);
    if (c.hasData && c.score >= 0.999) n++; else break;
  }
  return n;
}

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

/** Numbers for the Health overview over the `n` days ending at `end` (inclusive). */
export function periodStats(S, n, endKey, today) {
  const end = parse(endKey);
  const keys = Array.from({ length: n }, (_, i) => key(addDays(end, i - n + 1)));
  const cs = keys.map((k) => calcDay(S, k, today));
  const logged = cs.filter((c) => c.d.food.length);
  const closed = cs.filter((c) => c.closed);
  const withData = cs.filter((c) => c.hasData);
  const weights = cs.map((c) => c.weight).filter((w) => w != null);
  const sleeps = cs.map((c) => c.sleep).filter((v) => v > 0);
  const steps = cs.map((c) => c.steps).filter((v) => v != null);
  return {
    days: n,
    kcal: avg(logged.map((c) => c.eaten)),
    protein: avg(logged.map((c) => c.protein)),
    proteinHit: logged.filter((c) => c.protein >= S.targets.protein).length,
    loggedDays: logged.length,
    deficit: avg(closed.map((c) => c.deficit)),
    deficitTotal: closed.reduce((a, c) => a + c.deficit, 0),
    closedDays: closed.length,
    workoutMin: cs.reduce((a, c) => a + c.wMin, 0),
    sessions: cs.reduce((a, c) => a + c.d.workouts.length, 0),
    activeKcal: cs.reduce((a, c) => a + c.active, 0),
    sleep: avg(sleeps),
    water: avg(withData.map((c) => c.water)),
    steps: avg(steps),
    score: avg(withData.map((c) => c.score)),
    perfect: withData.filter((c) => c.score >= 0.999).length,
    weightStart: weights.length ? weights[0] : null,
    weightEnd: weights.length ? weights[weights.length - 1] : null,
  };
}

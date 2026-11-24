// Turns whatever arrives into { days: { 'YYYY-MM-DD': {steps, active_kcal, …} }, workouts: [...] }.
// Two senders are supported:
//  1. Our iOS Shortcut: flat JSON { date, steps, active_kcal, exercise_min, weight, sleep_hours, workouts? }
//  2. The Health Auto Export app (REST API automation, JSON):
//     { data: { metrics: [{ name: 'step_count', units, data: [{ date, qty }] }], workouts: [{ id, name, start, end, duration, activeEnergyBurned: { qty, units } }] } }
//     Health Auto Export reads Apple Health's own daily totals, so iPhone + Watch steps are not double counted.
import { num } from '../_shared/util.ts';

type Obj = Record<string, unknown>;
export type DayVals = { steps?: number; active_kcal?: number; exercise_min?: number; weight?: number; sleep_hours?: number; bed_time?: string; wake_time?: string };
export type Wk = { id?: string; day: string; name: string; minutes: number; kcal: number; start: string | null };

/** A list of samples (array, or text with one value per line) → their sum; a single value → itself. */
const parts = (v: unknown): unknown[] => (Array.isArray(v) ? v : typeof v === 'string' && /\n/.test(v) ? v.split(/\n+/) : [v]);
export const total = (v: unknown) => { const ns = parts(v).map(num).filter((n): n is number => n !== undefined); return ns.length ? ns.reduce((a, b) => a + b, 0) : undefined; };
export const first = (v: unknown) => parts(v).map(num).find((n) => n !== undefined);

const dayOf = (s: unknown) => (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : undefined);
/** "2026-11-13 07:05:00 +0530" → Date */
const toDate = (s: unknown) => {
  if (typeof s !== 'string') return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)\s*([+-]\d{2}):?(\d{2})?$/);
  const d = new Date(m ? `${m[1]}T${m[2]}${m[3]}:${m[4] || '00'}` : s);
  return Number.isNaN(d.getTime()) ? null : d;
};
const kcalOf = (q: unknown): number | undefined => {
  if (q == null) return undefined;
  if (Array.isArray(q)) { const t = q.reduce((a: number, x) => a + (kcalOf(x) || 0), 0); return t || undefined; }
  if (typeof q === 'object') {
    const o = q as Obj, v = num(o.qty);
    return v === undefined ? undefined : /kj/i.test(String(o.units || '')) ? v / 4.184 : v;
  }
  return num(q);
};

export function isHAE(body: Obj) {
  const d = body.data as Obj | undefined;
  return !!d && typeof d === 'object' && (Array.isArray(d.metrics) || Array.isArray(d.workouts));
}

export function parseHAE(body: Obj) {
  const data = body.data as Obj;
  const days: Record<string, DayVals> = {};
  const at = (k: string) => (days[k] ||= {});
  const add = (k: string, f: keyof DayVals, v: number) => { const r = at(k) as Record<string, number>; r[f] = (r[f] || 0) + v; };
  for (const m of (data.metrics as Obj[] | undefined) || []) {
    const name = String(m.name || ''), units = String(m.units || '');
    for (const p of (m.data as Obj[] | undefined) || []) {
      const k = dayOf(p.date); if (!k) continue;
      const q = num(p.qty);
      if (name === 'step_count' && q !== undefined) add(k, 'steps', q);
      else if (name === 'active_energy' && q !== undefined) add(k, 'active_kcal', /kj/i.test(units) ? q / 4.184 : q);
      else if (name === 'apple_exercise_time' && q !== undefined) add(k, 'exercise_min', q);
      else if ((name === 'weight_body_mass' || name === 'body_mass') && q !== undefined) at(k).weight = /lb/i.test(units) ? q * 0.4536 : q;
      else if (name === 'sleep_analysis') {
        const h = num(p.totalSleep) ?? num(p.asleep) ?? q;
        if (h !== undefined) add(k, 'sleep_hours', h);
        const s = toDate(p.sleepStart), e = toDate(p.sleepEnd);
        if (typeof p.sleepStart === 'string' && s) at(k).bed_time = p.sleepStart.slice(11, 16);
        if (typeof p.sleepEnd === 'string' && e) at(k).wake_time = p.sleepEnd.slice(11, 16);
      }
    }
  }
  const workouts: Wk[] = [];
  for (const w of (data.workouts as Obj[] | undefined) || []) {
    const k = dayOf(w.start); if (!k) continue;
    const s = toDate(w.start), e = toDate(w.end);
    let minutes = s && e ? (e.getTime() - s.getTime()) / 60000 : undefined;
    if (!minutes) { const d = num(w.duration); minutes = d === undefined ? 0 : d > 300 ? d / 60 : d; }  // seconds (new) or minutes (old)
    const kcal = kcalOf(w.activeEnergyBurned) ?? kcalOf(w.activeEnergy) ?? kcalOf(w.totalEnergyBurned) ?? 0;
    workouts.push({ id: w.id ? String(w.id) : undefined, day: k, name: String(w.name || 'Workout').trim(), minutes: Math.round(minutes), kcal: Math.round(kcal), start: typeof w.start === 'string' ? w.start : null });
  }
  return { days, workouts };
}

export function parseShortcut(body: Obj, day: string) {
  const v: DayVals = {};
  const w = first(body.weight), a = total(body.active_kcal), s = total(body.steps), sl = total(body.sleep_hours);
  const ex = total(body.exercise_min ?? body.exercise_minutes);
  if (ex !== undefined) v.exercise_min = ex;
  if (w !== undefined) v.weight = w;
  if (a !== undefined) v.active_kcal = a;
  if (s !== undefined) v.steps = s;
  if (sl !== undefined) v.sleep_hours = sl;
  if (typeof body.bed_time === 'string') v.bed_time = body.bed_time.slice(0, 5);
  if (typeof body.wake_time === 'string') v.wake_time = body.wake_time.slice(0, 5);
  const list = Array.isArray(body.workouts) ? body.workouts as Obj[] : [];
  const workouts: Wk[] = list.map((wk) => ({
    id: wk.id ? String(wk.id) : undefined, day, name: String(wk.name || 'Workout').trim(),
    minutes: Math.round(num(wk.minutes) ?? ((num(wk.duration_s) ?? 0) / 60)), kcal: Math.round(num(wk.kcal) ?? 0),
    start: typeof wk.start === 'string' ? wk.start : null,
  }));
  return { days: { [day]: v }, workouts };
}

/** Columns for day_logs. Empty Health values arrive as 0: never let them overwrite a real number. */
export function toRow(v: DayVals) {
  const row: Record<string, unknown> = {};
  if (v.exercise_min !== undefined) row.exercise_min = Math.round(v.exercise_min);
  if (v.weight !== undefined && v.weight >= 20) row.weight = Math.round(v.weight * 10) / 10;
  if (v.active_kcal !== undefined && v.active_kcal > 0) row.active_kcal = Math.round(v.active_kcal);
  if (v.steps !== undefined) row.steps = Math.round(v.steps);
  if (v.sleep_hours !== undefined && v.sleep_hours > 0) row.sleep_hours = Math.round(v.sleep_hours * 10) / 10;
  if (v.bed_time) row.bed_time = v.bed_time;
  if (v.wake_time) row.wake_time = v.wake_time;
  return row;
}

export const AREA_GUESS: [RegExp, string][] = [
  [/badminton|cricket|tennis|squash|pickle|football|soccer|basket|volley|hockey|golf|table/i, 'Sport'],
  [/walk|hik/i, 'Cardio'], [/run|cycl|elliptic|row|stair|hiit|cardio|swim|jump/i, 'Cardio'],
  [/yoga|pilates|flexib|stretch|cooldown|mind/i, 'Mobility'], [/core|abs/i, 'Core'],
  [/strength|weight|functional|cross|kickbox|box/i, 'Full body'],
];
/** Match an Apple Watch workout name to one of your workout types ("Badminton" → Badminton). */
export function matchType<T extends { name: string }>(name: string, types: T[]) {
  const n = name.toLowerCase();
  return types.find((t) => t.name.toLowerCase() === n)
    || types.find((t) => n.includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(n));
}

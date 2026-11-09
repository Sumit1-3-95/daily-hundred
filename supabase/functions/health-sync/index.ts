// Receives Apple Health data from an iOS Shortcut.
// POST /functions/v1/health-sync
// Header: Authorization: Bearer <personal token from Settings>
// Body (all fields optional):
// {
//   "date": "2026-11-08",
//   "weight": 76.9, "active_kcal": 512, "steps": 9120, "exercise_min": 48,
//   "sleep_hours": 7.2, "bed_time": "23:40", "wake_time": "06:55",
//   "workouts": [{ "id": "...", "name": "Traditional Strength Training", "minutes": 52, "kcal": 380, "start": "2026-11-08T07:05:00+05:30" }]
// }
import { admin, cors, json, localNow, num, sha256 } from '../_shared/util.ts';

const AREA_GUESS: [RegExp, string][] = [
  [/walk|hik/i, 'Cardio'], [/run|cycl|elliptic|row|stair|hiit|cardio|swim/i, 'Cardio'],
  [/yoga|pilates|flexib|stretch|cooldown/i, 'Mobility'], [/core|abs/i, 'Core'],
  [/strength|weight|functional|cross/i, 'Full body'],
];

/** A list of samples (array, or text with one value per line) → their sum; a single value → itself. */
const parts = (v: unknown): unknown[] => (Array.isArray(v) ? v : typeof v === 'string' && /\n/.test(v) ? v.split(/\n+/) : [v]);
const total = (v: unknown) => { const ns = parts(v).map(num).filter((n): n is number => n !== undefined); return ns.length ? ns.reduce((a, b) => a + b, 0) : undefined; };
const first = (v: unknown) => parts(v).map(num).find((n) => n !== undefined);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);

  // token from the Authorization header, or from ?token=… in the address (simpler to set up in Shortcuts)
  const token = ((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    || new URL(req.url).searchParams.get('token') || '').replace(/\s+/g, '').replace(/^Bearer/i, '');
  if (!token) return json({ error: 'Missing token' }, 401);

  const db = admin();
  const { data: tok } = await db.from('api_tokens').select('id,user_id').eq('token_hash', await sha256(token)).maybeSingle();
  if (!tok) return json({ error: 'Invalid token. Create a new one in Settings.' }, 401);
  const user_id = tok.user_id as string;

  // Accept JSON, form data or key=value text; Shortcuts sends different shapes depending on setup.
  const raw = await req.text();
  let body: Record<string, unknown> = {};
  try { body = raw.trim() ? JSON.parse(raw) : {}; } catch {
    try { body = Object.fromEntries(new URLSearchParams(raw)); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) body = {};

  const { data: prof } = await db.from('profiles').select('tz').eq('id', user_id).single();
  const day = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(body.date)
    ? body.date.slice(0, 10) : localNow(prof?.tz || 'Asia/Kolkata').date;

  // Only send the columns we actually received, so a partial sync never wipes other values.
  const row: Record<string, unknown> = { user_id, day, updated_at: new Date().toISOString() };
  const w = first(body.weight), a = total(body.active_kcal), s = total(body.steps), sl = total(body.sleep_hours);
  const ex = total(body.exercise_min ?? body.exercise_minutes);
  if (ex !== undefined) row.exercise_min = Math.round(ex);
  // an empty Health value arrives as 0: never let it overwrite a real number
  if (w !== undefined && w >= 20) row.weight = Math.round(w * 10) / 10;
  if (a !== undefined && a > 0) row.active_kcal = Math.round(a);
  if (s !== undefined) row.steps = Math.round(s);
  if (sl !== undefined) row.sleep_hours = Math.round(sl * 10) / 10;
  if (typeof body.bed_time === 'string') row.bed_time = body.bed_time.slice(0, 5);
  if (typeof body.wake_time === 'string') row.wake_time = body.wake_time.slice(0, 5);

  let { error: dErr } = await db.from('day_logs').upsert(row, { onConflict: 'user_id,day' });
  if (dErr && /exercise_min/.test(dErr.message)) {   // column not added yet: save the rest
    delete row.exercise_min;
    ({ error: dErr } = await db.from('day_logs').upsert(row, { onConflict: 'user_id,day' }));
  }
  if (dErr) return json({ error: dErr.message }, 500);

  let saved = 0;
  const list = Array.isArray(body.workouts) ? body.workouts as Record<string, unknown>[] : [];
  if (list.length) {
    const { data: types } = await db.from('workout_types').select('id,name,area').eq('user_id', user_id);
    const rows = list.map((wk) => {
      const name = String(wk.name || 'Workout').trim();
      const match = (types || []).find((t) => t.name.toLowerCase() === name.toLowerCase());
      const area = match?.area || AREA_GUESS.find(([re]) => re.test(name))?.[1] || 'Other';
      const start = typeof wk.start === 'string' ? wk.start : null;
      return {
        user_id, day, name, area, type_id: match?.id ?? null,
        // minutes, or seconds if the Shortcut sends the raw duration
        minutes: Math.round(num(wk.minutes) ?? ((num(wk.duration_s) ?? 0) / 60)),
        kcal: Math.round(num(wk.kcal) ?? 0),
        source: 'apple_watch',
        started_at: start,
        external_id: String(wk.id || `${day}|${start || ''}|${name}`),
      };
    }).filter((r) => r.minutes > 0);
    if (rows.length) {
      const { error } = await db.from('workouts').upsert(rows, { onConflict: 'user_id,external_id' });
      if (error) return json({ error: error.message }, 500);
      saved = rows.length;
    }
  }

  await db.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', tok.id);
  await db.from('events').insert({ user_id, name: 'health_sync', props: { day, saved: Object.keys(row).filter((k) => !['user_id', 'day', 'updated_at'].includes(k)), workouts: saved, raw: raw.slice(0, 600) } });
  return json({ ok: true, day, saved: Object.keys(row).filter((k) => !['user_id', 'day', 'updated_at'].includes(k)), workouts: saved });
});

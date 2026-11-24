// Receives Apple Health data, from our iOS Shortcut or from the Health Auto Export app.
// POST /functions/v1/health-sync?token=<personal token from Settings>   (or header Authorization: Bearer <token>)
// Shortcut body (all optional): { "date", "weight", "active_kcal", "steps", "exercise_min", "sleep_hours", "sleep_score", "bed_time", "wake_time", "workouts": [...] }
// Health Auto Export body: { "data": { "metrics": [...], "workouts": [...] } }  (see parse.ts)
// Every value replaces the stored one for that day (never adds), so syncing twice is safe.
import { admin, cors, json, localNow, sha256 } from '../_shared/util.ts';
import { AREA_GUESS, isHAE, matchType, parseHAE, parseShortcut, toRow } from './parse.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);

  const token = ((req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    || new URL(req.url).searchParams.get('token') || '').replace(/\s+/g, '').replace(/^Bearer/i, '');
  if (!token) return json({ error: 'Missing token' }, 401);

  const db = admin();
  const { data: tok } = await db.from('api_tokens').select('id,user_id').eq('token_hash', await sha256(token)).maybeSingle();
  if (!tok) return json({ error: 'Invalid token. Create a new one in Settings.' }, 401);
  const user_id = tok.user_id as string;

  const raw = await req.text();
  let body: Record<string, unknown> = {};
  try { body = raw.trim() ? JSON.parse(raw) : {}; } catch {
    try { body = Object.fromEntries(new URLSearchParams(raw)); } catch { body = {}; }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) body = {};

  const { data: prof } = await db.from('profiles').select('tz').eq('id', user_id).single();
  const today = localNow(prof?.tz || 'Asia/Kolkata').date;
  const hae = isHAE(body);
  const day0 = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(body.date) ? body.date.slice(0, 10) : today;
  const parsed = hae ? parseHAE(body) : parseShortcut(body, day0);

  const savedDays: Record<string, string[]> = {};
  for (const [day, vals] of Object.entries(parsed.days)) {
    const cols = toRow(vals);
    if (!Object.keys(cols).length) continue;
    const row = { user_id, day, updated_at: new Date().toISOString(), ...cols };
    let { error } = await db.from('day_logs').upsert(row, { onConflict: 'user_id,day' });
    for (const col of ['exercise_min', 'sleep_score']) {   // column not added yet: save the rest
      if (error && error.message.includes(col)) {
        delete (row as Record<string, unknown>)[col];
        ({ error } = await db.from('day_logs').upsert(row, { onConflict: 'user_id,day' }));
      }
    }
    if (error) return json({ error: error.message }, 500);
    savedDays[day] = Object.keys(cols);
  }

  let saved = 0;
  const list = parsed.workouts.filter((w) => w.minutes > 0);
  if (list.length) {
    const { data: types } = await db.from('workout_types').select('id,name,area').eq('user_id', user_id).eq('archived', false);
    const rows = list.map((wk) => {
      const match = matchType(wk.name, types || []);
      return {
        user_id, day: wk.day, name: wk.name, type_id: match?.id ?? null,
        area: match?.area || AREA_GUESS.find(([re]) => re.test(wk.name))?.[1] || 'Other',
        minutes: wk.minutes, kcal: wk.kcal, source: 'apple_watch', started_at: wk.start,
        external_id: wk.id || `${wk.day}|${wk.start || ''}|${wk.name}`,
      };
    });
    const { error } = await db.from('workouts').upsert(rows, { onConflict: 'user_id,external_id' });
    if (error) return json({ error: error.message }, 500);
    saved = rows.length;
  }

  await db.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', tok.id);
  const out = { ok: true, from: hae ? 'health_auto_export' : 'shortcut', days: savedDays, workouts: saved };
  await db.from('events').insert({ user_id, name: 'health_sync', props: { ...out, raw: raw.slice(0, 600) } });
  return json(out);
});

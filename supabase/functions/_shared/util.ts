import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Local date (YYYY-MM-DD), time (HH:MM) and weekday (0=Sun) in a time zone. */
export function localNow(tz: string, d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
    }).formatToParts(d).map((x) => [x.type, x.value]),
  );
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  const hour = p.hour === '24' ? '00' : p.hour;
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${hour}:${p.minute}`, dow };
}

/** Number from whatever Shortcuts sends: 8123, "8,123", "8,123 steps", "76,9" (decimal comma), "52 min". */
export const num = (v: unknown) => {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  let s = String(v).trim().replace(/[^0-9.,\-]/g, '');
  if (/^-?\d{1,3}(,\d{2,3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');   // thousands separators (8,123 or 1,23,456)
  else s = s.replace(',', '.');                                               // decimal comma
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

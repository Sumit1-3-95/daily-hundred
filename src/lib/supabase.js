import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = Boolean(url && anon);

export const supabase = configured
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

/** Fetch every row of a query, 1000 at a time (Supabase caps a single response at 1000 rows). */
export async function fetchAll(build) {
  let out = [], from = 0;
  for (;;) {
    const { data, error } = await build().range(from, from + 999);
    if (error) throw error;
    out = out.concat(data);
    if (data.length < 1000) return out;
    from += 1000;
  }
}

// Sends web-push nudges. Called every 10 minutes by pg_cron (see supabase/cron.sql).
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com), CRON_SECRET
import webpush from 'npm:web-push@3.6.7';
import { admin, cors, json, localNow } from '../_shared/util.ts';

const WINDOW_MIN = 60; // send a nudge up to 60 min after its time if it was missed

const toMin = (t: string) => { const [h, m] = t.slice(0, 5).split(':').map(Number); return h * 60 + m; };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return json({ error: 'Forbidden' }, 403);

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com',
    Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!,
  );
  const db = admin();

  const { data: subs } = await db.from('push_subscriptions').select('*');
  if (!subs?.length) return json({ ok: true, sent: 0 });
  const users = [...new Set(subs.map((s) => s.user_id))];

  const [{ data: nudges }, { data: profiles }] = await Promise.all([
    db.from('nudges').select('*').eq('enabled', true).in('user_id', users),
    db.from('profiles').select('id,tz,targets').in('id', users),
  ]);

  let sent = 0;
  for (const p of profiles || []) {
    const now = localNow(p.tz || 'Asia/Kolkata');
    const nowMin = toMin(now.time);
    const due = (nudges || []).filter((n) => n.user_id === p.id && n.days.includes(now.dow) &&
      nowMin >= toMin(n.at_time) && nowMin - toMin(n.at_time) <= WINDOW_MIN);
    if (!due.length) continue;

    const { data: already } = await db.from('nudge_sends').select('nudge_id').eq('day', now.date).in('nudge_id', due.map((n) => n.id));
    const pending = due.filter((n) => !(already || []).some((a) => a.nudge_id === n.id));
    if (!pending.length) continue;

    const { data: log } = await db.from('day_logs').select('*').eq('user_id', p.id).eq('day', now.date).maybeSingle();
    const t = p.targets || {};

    for (const n of pending) {
      let msg: { title: string; body: string; url: string } | null = null;
      if (n.kind === 'sleep' && log?.sleep_hours == null && log?.wake_time == null)
        msg = { title: 'Good morning ☀️', body: 'What time did you wake up?', url: '/?nudge=sleep' };
      if (n.kind === 'weight' && log?.weight == null)
        msg = { title: 'Morning weigh-in', body: 'Step on the scale before breakfast and log it.', url: '/?nudge=weight' };
      if (n.kind === 'water') {
        const ml = log?.water_ml || 0, target = t.water || 3000;
        if (ml < target) msg = { title: 'Water check', body: `${(ml / 1000).toFixed(2)} of ${target / 1000} L so far. Log what you've had.`, url: '/?nudge=water' };
      }
      if (n.kind === 'routine') {
        const { data: rt } = await db.from('tasks').select('id, lists!inner(kind)').eq('user_id', p.id)
          .eq('type', 'checklist').eq('archived', false).eq('lists.kind', 'routine');
        const ids = (rt || []).map((r) => r.id);
        if (ids.length) {
          const { data: tl } = await db.from('task_logs').select('task_id,done').eq('user_id', p.id).eq('day', now.date).in('task_id', ids);
          const doneCount = (tl || []).filter((x) => x.done).length;
          if (doneCount < ids.length) msg = { title: 'Morning routine', body: 'Have you finished your morning routine? Tick it off.', url: '/?nudge=routine' };
        }
      }
      if (n.kind === 'close_day' && !log?.closed)
        msg = { title: 'Time to sign off', body: 'Log any meals left, note your bedtime and close the day.', url: '/?nudge=close' };

      await db.from('nudge_sends').insert({ nudge_id: n.id, day: now.date });
      if (!msg) continue;

      for (const s of subs.filter((x) => x.user_id === p.id)) {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ ...msg, tag: n.kind }));
          sent++;
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('id', s.id);
        }
      }
    }
  }
  return json({ ok: true, sent });
});

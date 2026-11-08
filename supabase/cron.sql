-- Schedules the push-nudge sender every 10 minutes.
-- 1) Database > Extensions: enable pg_cron and pg_net.
-- 2) Replace <PROJECT_REF> and <CRON_SECRET> (the same value you set with `supabase secrets set CRON_SECRET=...`).
-- 3) Run this in the SQL editor.

select cron.schedule(
  'send-nudges',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-nudges',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
    body := '{}'::jsonb
  );
  $$
);

-- To stop it later:  select cron.unschedule('send-nudges');

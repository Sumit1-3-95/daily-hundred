# Daily Hundred

A personal health and habit PWA: daily rings (tasks, deficit, workout), a weighted day score to chase to 100%, food and workout logging, body scans, routines and lists, nudges, and Apple Health sync.

Stack: Vite + React (PWA) on Vercel, Supabase for auth, database, edge functions and the nudge schedule.

## Try it without Supabase

```bash
npm install
npm run demo        # http://localhost:5173, sample data, nothing is saved
```

Choose any PIN. The demo keeps everything in memory.

## 1. Supabase

1. Create a project. In **SQL editor**, run `supabase/migrations/0001_init.sql`.
2. **Authentication → Email templates → Magic link**: add the code so the email contains both link and code:
   `<p>Your code: {{ .Token }}</p><p><a href="{{ .ConfirmationURL }}">Or tap to sign in</a></p>`
3. **Authentication → URL configuration**: set Site URL to your Vercel URL (for example `https://daily-hundred.vercel.app`) and add `http://localhost:5173` to Redirect URLs.
4. Invite-only (recommended): in the SQL editor
   `insert into allowed_emails values ('you@gmail.com'), ('wife@gmail.com'), ('friend@gmail.com');`
   While `allowed_emails` is empty, anyone with the link can sign up.

Every new account gets default foods, workout types, tasks, a Morning routine, a sample packing list and nudges (see `handle_new_user` in the migration). Every table has Row Level Security, so each person only sees their own data.

## 2. Edge functions and nudges

```bash
npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

npx web-push generate-vapid-keys          # keep both keys
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@gmail.com CRON_SECRET=any-long-random-string

supabase functions deploy health-sync --no-verify-jwt
supabase functions deploy send-nudges --no-verify-jwt
```

Then enable the **pg_cron** and **pg_net** extensions (Database → Extensions), fill in `supabase/cron.sql` and run it. It calls `send-nudges` every 10 minutes. A nudge only goes out if that thing isn't logged yet.

## 3. Vercel

1. Push this folder to a GitHub repo and import it in Vercel (framework preset: Vite).
2. Environment variables:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Supabase → Project Settings → API)
   - `VITE_VAPID_PUBLIC_KEY` (the public key from step 2)
3. Deploy. For local development copy `.env.example` to `.env` and run `npm run dev`.

## 4. On the iPhone

1. Open the Vercel URL in Safari → Share → **Add to Home Screen**. Open it from the Home Screen icon.
2. Sign in with your email code, choose a PIN.
3. Settings (the round button, top right) → **Nudges** → **Turn on notifications**. Push only works from the Home Screen app (iOS 16.4+).

## 5. Apple Health sync (Shortcuts)

In the app: Settings → **Health sync** → **Create a sync token**. Copy it.

In the Shortcuts app, create a shortcut called "Daily Hundred sync":

1. **Find Health Samples**: Weight, start date is today, sort latest first, limit 1.
2. **Find Health Samples**: Active Energy, start date is today → **Calculate Statistics** (Sum).
3. **Find Health Samples**: Steps, start date is today → **Calculate Statistics** (Sum).
4. **Find Health Samples**: Sleep Analysis, start date in the last 1 day, value is Asleep → **Calculate Statistics** (Sum of duration, in hours).
5. Optional, for the workout ring: **Find Health Samples**: Workouts, start date is today → **Repeat with each**: build a Dictionary with `name` (workout type), `minutes` (duration in minutes), `kcal` (active energy), `start` (start date) and add it to a list variable `workouts`.
6. **Get Contents of URL**
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/health-sync`
   - Method: POST
   - Headers: `Authorization` = `Bearer YOUR_TOKEN`, `Content-Type` = `application/json`
   - Request body (JSON): `weight`, `active_kcal`, `steps`, `sleep_hours`, `workouts` from the steps above.

Then **Automation → Personal → Time of Day**: run at 09:00 (sleep and weight) and 22:00 (the day's activity), set to **Run Immediately**. Re-running is safe: workouts are de-duplicated and missing fields are left untouched.

Without step 5, active energy still counts towards the deficit; log workout minutes from the Cult app with the + button.

## How the numbers work

- **Deficit** = resting burn (from InBody) + active calories − food eaten. Until you close the day it shows a projection that assumes you will eat your planned calories.
- **Day score** = points earned ÷ points possible. Each task has a weight (×1, ×2, ×3, ×5). Number targets, checklists and automatic tasks earn partial points (12 of 25 pages = half the points).
- **Rest day** removes the workout task and fills the workout ring.
- **Fat burned (est.)** = total deficit on closed days ÷ 7,700 kcal per kg.

## Tracking

Usage events go to the `events` table (`app_open`, `food_logged`, `meal_repeated`, `workout_logged`, `water_logged`, `task_updated`, `perfect_day`, `day_closed`, `nudge_opened`, `nudge_dismissed`, `health_sync`, …). Example:

```sql
select name, count(*) from events where created_at > now() - interval '30 days' group by 1 order by 2 desc;
```

## Project layout

```
src/lib/calc.js        day totals, weighted score, period stats (unit tested: npm test)
src/store.jsx          loads data from Supabase, all write actions
src/screens/           Home, Health (Overview/Food/Workout/Body), Today, Lists, Auth
src/sheets/            quick add, forms, settings
src/components/        rings, charts, task row, nudges
src/sw.js              offline cache, push notifications
supabase/              schema, edge functions, cron
mock/                  in-memory Supabase for `npm run demo`
```

## Next ideas

- Claude: upload an InBody or blood report photo and fill the numbers; describe a meal in words and log it; plan tomorrow's tasks.
- Productivity tab (deep work, focus blocks).

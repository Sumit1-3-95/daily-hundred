-- Apple Watch exercise minutes (the green ring), sent by the Shortcut.
-- Workout time for a day = the larger of logged workouts and this.
alter table public.day_logs add column if not exists exercise_min int;

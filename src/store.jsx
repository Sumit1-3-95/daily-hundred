// App data store. Loads everything for the signed-in user once, keeps it in memory,
// and writes every change to Supabase. Small, frequent actions (ticks, water, quantities)
// update the screen first and roll back if the save fails.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { fetchAll, supabase } from './lib/supabase.js';
import { addDays, key, todayKey } from './lib/dates.js';
import { calcDay, emptyDay } from './lib/calc.js';

const DEFAULT_TARGETS = { bmr: 1605, deficit: 500, workoutMin: 45, protein: 100, kcal: 2000, water: 3000, sleep: 8, activeKcal: 400, steps: 8000, goalWeight: 71.5, startWeight: 77.1 };
const HISTORY_DAYS = 120;

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ session, children }) {
  const uid = session.user.id;
  const ref = useRef(null);
  const [, setTick] = useState(0);
  const [status, setStatus] = useState('loading');
  const [toastMsg, setToastMsg] = useState('');
  const [sheet, setSheet] = useState(null);
  const [today, setToday] = useState(todayKey());
  const toastTimer = useRef();

  const render = () => setTick((t) => t + 1);
  const commit = (fn) => { fn(ref.current); render(); };
  const toast = useCallback((m) => {
    setToastMsg(m); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);
  const track = (name, props = {}) => { supabase.from('events').insert({ user_id: uid, name, props }).then(() => {}); };

  // roll over to the new day while the app stays open
  useEffect(() => { const i = setInterval(() => setToday(todayKey()), 60000); return () => clearInterval(i); }, []);

  async function load() {
    const since = key(addDays(new Date(), -HISTORY_DAYS));
    const own = (t) => () => supabase.from(t).select('*').eq('user_id', uid);
    const ranged = (t, col = 'day') => () => supabase.from(t).select('*').eq('user_id', uid).gte(col, since).order(col);
    const [profile, foods, wtypes, tasks, lists, items, nudges, dayLogs, foodLogs, workouts, taskLogs, scans, blood] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle().then((r) => { if (r.error) throw r.error; return r.data; }),
      fetchAll(own('foods')), fetchAll(own('workout_types')), fetchAll(own('tasks')), fetchAll(own('lists')),
      fetchAll(own('list_items')), fetchAll(own('nudges')),
      fetchAll(ranged('day_logs')), fetchAll(ranged('food_logs')), fetchAll(ranged('workouts')), fetchAll(ranged('task_logs')),
      fetchAll(() => supabase.from('body_scans').select('*').eq('user_id', uid).order('date')),
      fetchAll(() => supabase.from('blood_results').select('*').eq('user_id', uid).order('date')),
    ]);
    const S = {
      uid, profile: profile || { id: uid, name: '' },
      targets: { ...DEFAULT_TARGETS, ...(profile?.targets || {}) },
      foods, foodsById: Object.fromEntries(foods.map((f) => [f.id, f])),
      wtypes, tasks, lists: lists.sort((a, b) => a.sort - b.sort), items: items.sort((a, b) => a.sort - b.sort),
      nudges: nudges.sort((a, b) => a.at_time.localeCompare(b.at_time)), scans, blood, days: {},
    };
    const day = (k) => (S.days[k] ||= emptyDay());
    dayLogs.forEach((r) => { day(r.day).log = r; });
    foodLogs.forEach((r) => day(r.day).food.push(r));
    workouts.forEach((r) => day(r.day).workouts.push(r));
    taskLogs.forEach((r) => { day(r.day).tlogs[r.task_id] = r; });
    ref.current = S;
  }

  useEffect(() => {
    load().then(() => { setStatus('ready'); track('app_open'); })
      .catch((e) => { console.error(e); setStatus(e.message || 'Could not load your data'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // ---------- helpers ----------
  const day = (k) => (ref.current.days[k] ||= emptyDay());
  async function q(p) {
    const { data, error } = await p;
    if (error) { toast(`Not saved: ${error.message}`); throw error; }
    return data;
  }
  const cheer = (k, before) => {
    const after = calcDay(ref.current, k, today).score;
    if (before < 0.999 && after >= 0.999) { toast('100%. Perfect day!'); track('perfect_day', { day: k }); }
  };
  const scoreOf = (k) => calcDay(ref.current, k, today).score;

  // ---------- actions ----------
  const A = {
    reload: async () => { await load(); render(); },

    saveDay: async (k, patch) => {
      const d = day(k), prev = d.log, before = scoreOf(k);
      commit(() => { d.log = { water_ml: 0, closed: false, rest: false, ...(prev || {}), user_id: uid, day: k, ...patch }; });
      try {
        const row = await q(supabase.from('day_logs').upsert({ user_id: uid, day: k, ...patch, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,day' }).select().single());
        commit(() => { d.log = row; });
        cheer(k, before);
      } catch { commit(() => { d.log = prev; }); }
    },
    addWater: (k, ml) => {
      const cur = day(k).log?.water_ml || 0;
      track('water_logged', { ml });
      return A.saveDay(k, { water_ml: Math.max(0, cur + ml) });
    },
    closeDay: async (k) => {
      if (!day(k).food.length) { toast('Log at least one meal before closing the day'); return false; }
      await A.saveDay(k, { closed: true });
      const c = calcDay(ref.current, k, today);
      toast(`Day closed. Deficit: ${Math.round(c.deficit).toLocaleString('en-IN')} kcal`);
      track('day_closed', { deficit: Math.round(c.deficit) });
      return true;
    },

    logFood: async (k, foodId, meal, qty = 1) => {
      const d = day(k), before = scoreOf(k);
      const same = d.food.find((f) => f.food_id === foodId && f.meal === meal);
      track('food_logged', { meal });
      if (same) return A.setFoodQty(k, same, Number(same.qty) + qty);
      const row = await q(supabase.from('food_logs').insert({ user_id: uid, day: k, food_id: foodId, meal, qty }).select().single());
      commit(() => d.food.push(row));
      cheer(k, before);
    },
    setFoodQty: async (k, row, qty) => {
      const d = day(k), prevQty = row.qty;
      if (qty <= 0) {
        commit(() => { d.food = d.food.filter((f) => f.id !== row.id); });
        try { await q(supabase.from('food_logs').delete().eq('id', row.id)); } catch { commit(() => d.food.push(row)); }
        return;
      }
      commit(() => { row.qty = qty; });
      try { await q(supabase.from('food_logs').update({ qty }).eq('id', row.id)); } catch { commit(() => { row.qty = prevQty; }); }
    },
    repeatMeal: async (fromK, meal, toK) => {
      const src = day(fromK).food.filter((f) => f.meal === meal);
      for (const f of src) await A.logFood(toK, f.food_id, meal, Number(f.qty));
      track('meal_repeated', { meal });
      toast(`Added yesterday's ${meal.toLowerCase()}`);
    },
    /** Take one serving of a food off today's log (newest entry first, preferring the given meal). */
    removeOneFood: (k, foodId, meal) => {
      const rows = day(k).food.filter((f) => f.food_id === foodId);
      const row = rows.filter((f) => f.meal === meal).pop() || rows.pop();
      if (row) return A.setFoodQty(k, row, Number(row.qty) - 1);
    },
    createFood: async (f) => {
      const row = await q(supabase.from('foods').insert({ user_id: uid, ...f }).select().single());
      commit((S) => { S.foods.push(row); S.foodsById[row.id] = row; });
      track('food_created');
      return row;
    },

    logWorkout: async (k, w) => {
      const before = scoreOf(k);
      const row = await q(supabase.from('workouts').insert({ user_id: uid, day: k, ...w }).select().single());
      commit(() => day(k).workouts.push(row));
      track('workout_logged', { source: w.source, minutes: w.minutes });
      cheer(k, before);
    },
    deleteWorkout: async (k, row) => {
      await q(supabase.from('workouts').delete().eq('id', row.id));
      commit(() => { day(k).workouts = day(k).workouts.filter((w) => w.id !== row.id); });
    },
    createWorkoutType: async (w) => {
      const row = await q(supabase.from('workout_types').insert({ user_id: uid, ...w }).select().single());
      commit((S) => S.wtypes.push(row));
      return row;
    },

    setTaskLog: async (k, task, patch) => {
      const d = day(k), prev = d.tlogs[task.id], before = scoreOf(k);
      const next = { done: false, value: null, items: [], ...(prev || {}), ...patch };
      if (task.type === 'number') next.done = (Number(next.value) || 0) >= (task.target || 1);
      if (task.type === 'checklist') {
        const its = ref.current.items.filter((i) => i.list_id === task.list_id);
        next.done = its.length > 0 && its.every((i) => next.items.includes(i.id));
      }
      commit(() => { d.tlogs[task.id] = { ...next, user_id: uid, day: k, task_id: task.id }; });
      try {
        const row = await q(supabase.from('task_logs').upsert({
          user_id: uid, day: k, task_id: task.id, done: next.done, value: next.value, items: next.items, updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,day,task_id' }).select().single());
        commit(() => { d.tlogs[task.id] = row; });
        track('task_updated', { type: task.type, done: next.done });
        cheer(k, before);
      } catch { commit(() => { if (prev) d.tlogs[task.id] = prev; else delete d.tlogs[task.id]; }); }
    },
    toggleChecklistItem: (k, task, itemId) => {
      const cur = day(k).tlogs[task.id]?.items || [];
      return A.setTaskLog(k, task, { items: cur.includes(itemId) ? cur.filter((x) => x !== itemId) : [...cur, itemId] });
    },
    saveTask: async (t) => {
      if (t.id) {
        const { id, ...rest } = t;
        const row = await q(supabase.from('tasks').update(rest).eq('id', id).select().single());
        commit((S) => { S.tasks = S.tasks.map((x) => (x.id === id ? row : x)); });
        return row;
      }
      const sort = Math.max(0, ...ref.current.tasks.map((x) => x.sort)) + 1;
      const row = await q(supabase.from('tasks').insert({ user_id: uid, sort, ...t }).select().single());
      commit((S) => S.tasks.push(row));
      track('task_created', { type: t.type, weight: t.weight });
      return row;
    },
    archiveTask: async (id) => {
      await q(supabase.from('tasks').update({ archived: true }).eq('id', id));
      commit((S) => { S.tasks = S.tasks.map((x) => (x.id === id ? { ...x, archived: true } : x)); });
    },

    createList: async ({ title, kind }) => {
      const sort = Math.max(0, ...ref.current.lists.map((x) => x.sort)) + 1;
      const row = await q(supabase.from('lists').insert({ user_id: uid, title, kind, sort }).select().single());
      commit((S) => S.lists.push(row));
      track('list_created', { kind });
      return row;
    },
    updateList: async (id, patch) => {
      const row = await q(supabase.from('lists').update(patch).eq('id', id).select().single());
      commit((S) => { S.lists = S.lists.map((x) => (x.id === id ? row : x)); });
    },
    deleteList: async (id) => {
      await q(supabase.from('lists').delete().eq('id', id));
      commit((S) => { S.lists = S.lists.filter((x) => x.id !== id); S.items = S.items.filter((i) => i.list_id !== id); });
    },
    addItem: async (listId, text) => {
      const sort = Math.max(0, ...ref.current.items.filter((i) => i.list_id === listId).map((i) => i.sort)) + 1;
      const row = await q(supabase.from('list_items').insert({ user_id: uid, list_id: listId, text, sort }).select().single());
      commit((S) => S.items.push(row));
      track('list_item_added');
    },
    updateItem: async (item, patch) => {
      const prev = { ...item };
      commit(() => Object.assign(item, patch));
      try { await q(supabase.from('list_items').update(patch).eq('id', item.id)); } catch { commit(() => Object.assign(item, prev)); }
    },
    deleteItem: async (id) => {
      await q(supabase.from('list_items').delete().eq('id', id));
      commit((S) => { S.items = S.items.filter((i) => i.id !== id); });
    },
    uncheckAll: async (listId) => {
      await q(supabase.from('list_items').update({ checked: false }).eq('list_id', listId));
      commit((S) => S.items.forEach((i) => { if (i.list_id === listId) i.checked = false; }));
    },

    addScan: async (s) => {
      const row = await q(supabase.from('body_scans').insert({ user_id: uid, ...s }).select().single());
      commit((S) => { S.scans.push(row); S.scans.sort((a, b) => a.date.localeCompare(b.date)); });
      track('body_scan_added');
    },
    addBlood: async (b) => {
      const row = await q(supabase.from('blood_results').insert({ user_id: uid, ...b }).select().single());
      commit((S) => { S.blood.push(row); S.blood.sort((a, b2) => a.date.localeCompare(b2.date)); });
    },

    saveProfile: async (patch) => {
      const row = await q(supabase.from('profiles').update(patch).eq('id', uid).select().single());
      commit((S) => { S.profile = row; S.targets = { ...DEFAULT_TARGETS, ...(row.targets || {}) }; });
    },
    savePrefs: (patch) => A.saveProfile({ prefs: { ...(ref.current.profile.prefs || {}), ...patch } }),
    updateFood: async (id, patch) => {
      const row = await q(supabase.from('foods').update(patch).eq('id', id).select().single());
      commit((S) => { S.foods = S.foods.map((x) => (x.id === id ? row : x)); S.foodsById[id] = row; });
    },
    saveNudge: async (n) => {
      if (n.id) {
        const { id, ...rest } = n;
        const row = await q(supabase.from('nudges').update(rest).eq('id', id).select().single());
        commit((S) => { S.nudges = S.nudges.map((x) => (x.id === id ? row : x)); });
      } else {
        const row = await q(supabase.from('nudges').insert({ user_id: uid, ...n }).select().single());
        commit((S) => { S.nudges.push(row); S.nudges.sort((a, b) => a.at_time.localeCompare(b.at_time)); });
      }
    },
    deleteNudge: async (id) => {
      await q(supabase.from('nudges').delete().eq('id', id));
      commit((S) => { S.nudges = S.nudges.filter((x) => x.id !== id); });
    },
    savePushSub: async (sub) => {
      await q(supabase.from('push_subscriptions').upsert({ user_id: uid, ...sub }, { onConflict: 'endpoint' }));
      track('push_enabled');
    },
    createToken: async () => {
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const token = 'dh_' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
      const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))]
        .map((b) => b.toString(16).padStart(2, '0')).join('');
      await q(supabase.from('api_tokens').insert({ user_id: uid, token_hash: h, label: 'Apple Health Shortcut' }));
      track('token_created');
      return token;
    },
    signOut: async () => { await supabase.auth.signOut(); },
  };

  const value = useMemo(() => ({}), []);
  Object.assign(value, {
    S: ref.current, status, today, toast, toastMsg, track, A,
    sheet, open: (name, props = {}) => setSheet({ name, props }), close: () => setSheet(null),
    calc: (k) => calcDay(ref.current, k, today),
  });
  return <Ctx.Provider value={{ ...value }}>{children}</Ctx.Provider>;
}

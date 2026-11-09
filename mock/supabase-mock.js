// In-memory stand-in for @supabase/supabase-js, used by `npm run demo`.
// Lets you click through the app with sample data, without a Supabase project.
import PLAN from './plan.json';
const UID = '00000000-0000-0000-0000-000000000001';
const uuid = () => crypto.randomUUID();
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function rng(s) { return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function seed() {
  const db = { profiles: [], foods: [], food_logs: [], workout_types: [], workouts: [], day_logs: [], lists: [], list_items: [], tasks: [], task_logs: [],
    body_scans: [], blood_results: [], nudges: [], push_subscriptions: [], api_tokens: [], events: [], plan_days: [] };
  const u = { user_id: UID };
  db.profiles.push({ id: UID, name: 'Sumit', tz: 'Asia/Kolkata', prefs: { home_metrics: ['water', 'protein', 'eaten', 'burned', 'weight', 'sleep'], focus: { metric: 'water', days: 7, start: key(addDays(new Date(), -3)) } }, targets: { activeKcal: 400, steps: 8000, bmr: 1605, deficit: 500, workoutMin: 45, protein: 100, kcal: 2000, water: 3000, sleep: 8, goalWeight: 71.5, startWeight: 77.1 } });
  const F = [
    ['poha', 'Poha', '1 plate', 250, 5, 'bowl', ['Breakfast'], 'poha'], ['coffee', 'Coffee', '1 cup with milk', 70, 3, 'chai', ['Breakfast', 'Snack'], 'coffee'],
    ['shake', 'Protein shake', '1 scoop whey in water', 130, 25, 'shake', ['Breakfast', 'Snack'], 'shake'], ['chai', 'Masala chai', '1 cup with sugar', 90, 3, 'chai', ['Breakfast', 'Snack'], 'chai'],
    ['bar', 'Protein bar', '1 bar (60 g)', 210, 20, 'bolt', ['Snack'], 'proteinbar'], ['csalad', 'Chicken salad', '1 bowl', 350, 35, 'salad', ['Lunch', 'Dinner'], 'chickensalad'],
    ['csub', 'Chicken sandwich (Sub)', '6-inch', 400, 28, 'sandwich', ['Lunch', 'Dinner', 'Snack'], 'chickensandwich'], ['psub', 'Paneer sandwich (Sub)', '6-inch', 380, 16, 'sandwich', ['Lunch', 'Dinner', 'Snack'], 'sandwich'],
    ['thali', 'Roti sabzi curd', '2 roti + sabzi + curd', 380, 14, 'thali', ['Lunch', 'Dinner'], 'thali'], ['dalchawal', 'Dal chawal curd', 'dal + rice + curd', 440, 18, 'dalchawal', ['Lunch', 'Dinner'], 'dalchawal'],
    ['paneer', 'Paneer salad', '100 g paneer + veggies', 330, 20, 'paneer', ['Lunch', 'Dinner'], 'paneersalad'], ['soya', 'Soya dish', '1 katori', 250, 25, 'soya', ['Lunch', 'Dinner'], 'soya'],
    ['tikki', 'Aloo tikki salad', '2 tikki + salad', 350, 7, 'tikki', ['Breakfast', 'Snack'], 'tikki'], ['daliya', 'Daliya', '1 bowl', 220, 7, 'daliya', ['Breakfast'], 'daliya'],
    ['sweet', 'Indian sweet', '1 piece', 150, 2, 'sweet', ['Lunch', 'Snack', 'Dinner'], 'sweet']];
  const fid = {};
  F.forEach(([k, name, serving, kcal, protein, icon, meals, img]) => { const id = uuid(); fid[k] = id; db.foods.push({ id, ...u, name, serving, kcal, protein, quick: true, icon, meals, image_url: `/food/${img}.svg`, archived: false }); });
  const W = [['Cult Strength', 'Full body', 7], ['Cult HRX', 'Full body', 9], ['Leg day', 'Lower body', 7], ['Outdoor walk', 'Cardio', 5]];
  const wt = W.map(([name, area, kpm]) => { const r = { id: uuid(), ...u, name, area, kcal_per_min: kpm }; db.workout_types.push(r); return r; });
  const routine = { id: uuid(), ...u, title: 'Morning routine', kind: 'routine', sort: 0 };
  const packing = { id: uuid(), ...u, title: 'Jaipur packing', kind: 'note', sort: 1 };
  db.lists.push(routine, packing);
  ['500 ml water', '10 min stretching', 'Supplements', 'Plan the day', 'No phone for 30 min'].forEach((text, i) => db.list_items.push({ id: uuid(), ...u, list_id: routine.id, text, checked: false, sort: i }));
  ['Chargers', 'Gym clothes', 'Whey sachets', 'Toiletries'].forEach((text, i) => db.list_items.push({ id: uuid(), ...u, list_id: packing.id, text, checked: i === 0, sort: i }));
  const ALL = [0, 1, 2, 3, 4, 5, 6];
  const T = [
    { name: 'Morning routine', type: 'checklist', list_id: routine.id, weight: 2 },
    { name: 'Workout', type: 'auto', auto_key: 'workout', weight: 3, days: [1, 2, 3, 4, 5, 6] },
    { name: 'Protein', type: 'auto', auto_key: 'protein', weight: 2 },
    { name: 'Water', type: 'auto', auto_key: 'water', weight: 2 },
    { name: 'Active burn', type: 'auto', auto_key: 'burn', weight: 1 },
    { name: 'Calories', type: 'auto', auto_key: 'calories', weight: 1 },
    { name: 'Deficit', type: 'auto', auto_key: 'deficit', weight: 2 },
    { name: 'Read', type: 'number', target: 25, unit: 'pages', weight: 1, icon: 'book' },
    { name: 'Sleep target', type: 'auto', auto_key: 'sleep', weight: 1 },
    { name: 'Log all meals and close the day', type: 'auto', auto_key: 'closed', weight: 1 },
  ].map((t, i) => ({ id: uuid(), ...u, days: ALL, auto_key: null, target: null, unit: null, list_id: null, archived: false, sort: i, ...t }));
  db.tasks.push(...T);
  const AV = [{ id: uuid(), ...u, name: 'Alcohol', type: 'avoid', weight: 3, unit: 'drinks', icon: 'drink', days: ALL, sort: 90, archived: false },
    { id: uuid(), ...u, name: 'Smoking', type: 'avoid', weight: 3, unit: 'cigarettes', icon: 'smoke', days: ALL, sort: 91, archived: false }];
  db.tasks.push(...AV);
  const yk = key(addDays(new Date(), -1));
  db.tasks.push({ id: uuid(), ...u, name: 'Laundry: fold and put away', type: 'todo', weight: 2, on_day: yk, days: ALL, sort: 95, archived: false, icon: 'check' },
    { id: uuid(), ...u, name: 'Pay electricity bill', type: 'todo', weight: 1, on_day: key(new Date()), days: ALL, sort: 96, archived: false, icon: 'check' });
  db.plan_days = PLAN.map((r) => ({ ...r, user_id: UID, checked: [], status: 'planned' }));
  [['sleep', '07:30:00'], ['weight', '08:00:00'], ['routine', '09:30:00'], ['water', '12:00:00'], ['water', '16:00:00'], ['close_day', '21:30:00']]
    .forEach(([kind, at_time]) => db.nudges.push({ id: uuid(), ...u, kind, at_time, enabled: true, days: ALL }));
  db.body_scans.push({ id: uuid(), ...u, date: '2026-11-04', source: 'InBody 260 at Cult', weight: 77.1, pbf: 25.8, fat_mass: 19.9, smm: 32.3, visceral: 8, whr: 0.96, bmr: 1605, score: 71, seg: { la: 1.2, ra: 1.1, tr: 11.0, ll: 2.7, rl: 2.7 } });

  const r = rng(11), pick = (a) => a[Math.floor(r() * a.length)];
  const now = new Date();
  for (let i = 40; i >= 1; i--) {
    const d = addDays(now, -i), k = key(d), good = r() < 0.3;
    const add = (f, qty, meal) => db.food_logs.push({ id: uuid(), ...u, day: k, food_id: fid[f], qty, meal });
    add('coffee', 2, 'Breakfast'); add(pick(['poha', 'daliya']), 1, 'Breakfast'); if (good || r() < 0.6) add('shake', 1, 'Breakfast');
    add(pick(['csalad', 'thali', 'dalchawal']), 1, 'Lunch'); add('chai', 1, 'Snack'); if (r() < 0.6) add('bar', 1, 'Snack');
    add(pick(['csub', 'psub', 'paneer', 'soya']), 1, 'Dinner'); if (r() < 0.25) add('sweet', 1, 'Dinner');
    let wk = 0;
    if (d.getDay() !== 0 && (good || r() < 0.8)) { const w = pick(wt.slice(0, 3)), m = 40 + Math.floor(r() * 20); wk = Math.round(m * w.kcal_per_min);
      db.workouts.push({ id: uuid(), ...u, day: k, type_id: w.id, name: w.name, area: w.area, minutes: m, kcal: wk, source: pick(['apple_watch', 'cult']) }); }
    db.day_logs.push({ ...u, day: k, water_ml: good ? 3200 : 2000 + Math.floor(r() * 12) * 100, sleep_hours: good ? 8.1 : +(6.2 + r() * 2).toFixed(1),
      weight: +(78.2 - (40 - i) * 0.03 + (r() - 0.5) * 0.35).toFixed(1), active_kcal: wk + 150 + Math.floor(r() * 150), steps: 6000 + Math.floor(r() * 5000),
      closed: good || r() < 0.85, rest: d.getDay() === 0, bed_time: null, wake_time: null });
    const ri = db.list_items.filter((x) => x.list_id === routine.id).map((x) => x.id);
    const got = good ? ri : ri.filter(() => r() < 0.7);
    db.task_logs.push({ ...u, day: k, task_id: T[0].id, done: got.length === ri.length, value: null, items: got });
    db.task_logs.push({ ...u, day: k, task_id: T[7].id, done: good, value: good ? 25 : Math.floor(r() * 30), items: [] });
  }
  const k = key(now);
  db.food_logs.push({ id: uuid(), ...u, day: k, food_id: fid.poha, qty: 1, meal: 'Breakfast', is_default: true }, { id: uuid(), ...u, day: k, food_id: fid.coffee, qty: 2, meal: 'Breakfast', is_default: true }, { id: uuid(), ...u, day: k, food_id: fid.csalad, qty: 1, meal: 'Lunch' });
  db.day_logs.push({ ...u, day: k, autofilled: ['Breakfast'], water_ml: 1250, sleep_hours: null, weight: null, active_kcal: 220, steps: 3100, closed: false, rest: false });
  return db;
}

const DB = seed();
const PK = { plan_days: ['user_id', 'day'], day_logs: ['user_id', 'day'], task_logs: ['user_id', 'day', 'task_id'], push_subscriptions: ['endpoint'], profiles: ['id'] };

class Q {
  constructor(t) { this.t = t; this.f = []; this.op = 'select'; this.payload = null; this.one = null; this.rng = null; this.ord = null; this.ret = false; this.conf = null; }
  select() { if (this.op !== 'select') this.ret = true; return this; }
  eq(c, v) { this.f.push((r) => r[c] === v); return this; }
  gte(c, v) { this.f.push((r) => r[c] >= v); return this; }
  in(c, v) { this.f.push((r) => v.includes(r[c])); return this; }
  order(c) { this.ord = c; return this; }
  range(a, b) { this.rng = [a, b]; return this; }
  single() { this.one = 'single'; return this; }
  maybeSingle() { this.one = 'maybe'; return this; }
  insert(p) { this.op = 'insert'; this.payload = p; return this; }
  update(p) { this.op = 'update'; this.payload = p; return this; }
  upsert(p, o) { this.op = 'upsert'; this.payload = p; this.conf = o?.onConflict?.split(','); return this; }
  delete() { this.op = 'delete'; return this; }
  then(res, rej) { return Promise.resolve().then(() => this.run()).then(res, rej); }
  run() {
    const T = (DB[this.t] ||= []);
    const match = (r) => this.f.every((fn) => fn(r));
    let rows;
    if (this.op === 'select') {
      rows = T.filter(match);
      if (this.ord) rows = [...rows].sort((a, b) => String(a[this.ord]).localeCompare(String(b[this.ord])));
      if (this.rng) rows = rows.slice(this.rng[0], this.rng[1] + 1);
    } else if (this.op === 'insert') {
      rows = [].concat(this.payload).map((p) => { const r = { id: uuid(), created_at: new Date().toISOString(), ...p }; T.push(r); return r; });
    } else if (this.op === 'update') {
      rows = T.filter(match); rows.forEach((r) => Object.assign(r, this.payload));
    } else if (this.op === 'upsert') {
      const cols = this.conf || PK[this.t] || ['id'];
      rows = [].concat(this.payload).map((p) => {
        const ex = T.find((r) => cols.every((c) => r[c] === p[c]));
        if (ex) return Object.assign(ex, p);
        const r = { id: uuid(), ...p }; T.push(r); return r;
      });
    } else if (this.op === 'delete') {
      rows = T.filter(match); DB[this.t] = T.filter((r) => !match(r));
    }
    rows = rows.map((r) => JSON.parse(JSON.stringify(r)));
    if (this.one) return { data: rows[0] ?? null, error: this.one === 'single' && !rows.length ? { message: 'not found' } : null };
    return { data: this.op === 'select' || this.ret ? rows : null, error: null };
  }
}

const session = { user: { id: UID, email: 'demo@example.com' }, access_token: 'demo' };
const BLOBS = {};
const storage = { from: () => ({
  upload: async (path, blob) => { BLOBS[path] = URL.createObjectURL(blob); return { data: { path }, error: null }; },
  getPublicUrl: (path) => ({ data: { publicUrl: BLOBS[path] || '' } }),
}) };
export function createClient() {
  return {
    from: (t) => new Q(t),
    storage,
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }),
      signInWithOtp: async () => ({ error: null }),
      verifyOtp: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { session }, error: null }),
      signUp: async () => ({ data: { session }, error: null }),
      updateUser: async () => ({ data: {}, error: null }),
    },
  };
}

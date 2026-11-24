import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcDay, habitStreaks, periodStats, streak } from './calc.js';
import { addDays, key, parse } from './dates.js';
import { sleepHours } from './dates.js';

const targets = { bmr: 1605, deficit: 500, workoutMin: 45, protein: 125, kcal: 2000, water: 3000, sleep: 8 };
const ALL = [0, 1, 2, 3, 4, 5, 6];
const base = () => ({
  targets,
  foodsById: { roti: { kcal: 85, protein: 3 }, whey: { kcal: 120, protein: 24 } },
  items: [{ id: 'i1', list_id: 'L' }, { id: 'i2', list_id: 'L' }],
  tasks: [
    { id: 'a', type: 'check', weight: 1, days: ALL, sort: 0 },
    { id: 'b', type: 'number', target: 20, weight: 1, days: ALL, sort: 1 },
    { id: 'c', type: 'checklist', list_id: 'L', weight: 2, days: ALL, sort: 2 },
    { id: 'w', type: 'auto', auto_key: 'workout', weight: 4, days: ALL, sort: 3 },
  ],
  days: {},
});

test('weighted score with partial credit', () => {
  const S = base();
  S.days['2026-11-08'] = {
    log: { water_ml: 0 }, food: [], workouts: [{ minutes: 45, kcal: 300 }],
    tlogs: { a: { done: true }, b: { value: 10 }, c: { items: ['i1'] } },
  };
  const c = calcDay(S, '2026-11-08', '2026-11-08');
  // a=1*1, b=0.5*1, c=0.5*2, w=1*4 -> 6.5 / 8
  assert.equal(c.maxPts, 8);
  assert.equal(c.pts, 6.5);
  assert.equal(c.done, 2);
});

test('rest day removes workout task and fills workout ring', () => {
  const S = base();
  S.days['2026-11-08'] = { log: { rest: true }, food: [], workouts: [], tlogs: {} };
  const c = calcDay(S, '2026-11-08', '2026-11-08');
  assert.equal(c.total, 3);
  assert.equal(c.ringW, 1);
});

test('open day projects deficit against planned intake; closed uses actual', () => {
  const S = base();
  S.days['2026-11-08'] = { log: { active_kcal: 400 }, food: [{ food_id: 'roti', qty: 4 }], workouts: [], tlogs: {} };
  let c = calcDay(S, '2026-11-08', '2026-11-08');
  assert.equal(c.burned, 2005);
  assert.equal(c.shownD, 5);          // 2005 - max(340, 2000)
  assert.equal(c.left, 2005 - 500 - 340);
  S.days['2026-11-08'].log.closed = true;
  c = calcDay(S, '2026-11-08', '2026-11-08');
  assert.equal(c.shownD, 2005 - 340);
});

test('streak counts consecutive perfect days', () => {
  const S = base();
  S.tasks = [{ id: 'a', type: 'check', weight: 1, days: ALL, sort: 0 }];
  for (const k of ['2026-11-05', '2026-11-06', '2026-11-07'])
    S.days[k] = { log: {}, food: [], workouts: [], tlogs: { a: { done: true } } };
  assert.equal(streak(S, '2026-11-08'), 3);
  S.days['2026-11-08'] = { log: {}, food: [], workouts: [], tlogs: { a: { done: true } } };
  assert.equal(streak(S, '2026-11-08'), 4);
});

test('period stats', () => {
  const S = base();
  S.days['2026-11-07'] = { log: { weight: 77.4, closed: true }, food: [{ food_id: 'whey', qty: 5 }], workouts: [], tlogs: {} };
  S.days['2026-11-08'] = { log: { weight: 77.0 }, food: [{ food_id: 'roti', qty: 10 }], workouts: [], tlogs: {} };
  const p = periodStats(S, 7, '2026-11-08', '2026-11-08');
  assert.equal(p.loggedDays, 2);
  assert.equal(p.protein, (120 + 30) / 2);
  assert.equal(p.closedDays, 1);
  assert.equal(p.deficit, 1605 - 600);
  assert.equal(p.weightEnd - p.weightStart < 0, true);
});

test('sleep hours across midnight', () => {
  assert.equal(sleepHours('23:30', '07:00'), 7.5);
  assert.equal(sleepHours('01:00', '07:15'), 6.3);
});

test('calories and deficit are shown but not scored; burn is scored', () => {
  const S = base();
  S.targets = { ...targets, activeKcal: 400 };
  S.tasks = [
    { id: 'c', type: 'auto', auto_key: 'calories', weight: 1, days: ALL, sort: 0 },
    { id: 'd', type: 'auto', auto_key: 'deficit', weight: 2, days: ALL, sort: 1 },
    { id: 'b', type: 'auto', auto_key: 'burn', weight: 1, days: ALL, sort: 2 },
  ];
  S.days['2026-11-08'] = { log: { active_kcal: 200, closed: true }, food: [{ food_id: 'roti', qty: 10 }], workouts: [], tlogs: {} };
  const c = calcDay(S, '2026-11-08', '2026-11-08');
  assert.equal(c.scored.length, 1);
  assert.equal(c.scored[0].task.id, 'b');
  assert.equal(c.scored[0].credit, 0.5);    // 200 of 400 active kcal
  assert.equal(c.eaten, 850);               // calories still worked out
  assert.equal(c.score, 0.5);
});

test('avoid tasks take points off', () => {
  const S = base();
  S.tasks = [
    { id: 'a', type: 'check', weight: 4, days: ALL, sort: 0 },
    { id: 'x', type: 'avoid', weight: 3, days: ALL, sort: 1 },
  ];
  S.days['2026-11-08'] = { log: {}, food: [], workouts: [], tlogs: { a: { done: true }, x: { value: 1 } } };
  const c = calcDay(S, '2026-11-08', '2026-11-08');
  assert.equal(c.maxPts, 4);
  assert.equal(c.pts, 1);
  assert.equal(c.total, 1);
  S.days['2026-11-08'].tlogs.x.value = 3;
  assert.equal(calcDay(S, '2026-11-08', '2026-11-08').pts, 0);
});

test('to-dos are not part of the score', () => {
  const S = base();
  S.tasks = [
    { id: 'w', type: 'auto', auto_key: 'water', weight: 2, days: ALL, sort: 0 },
    { id: 'r', type: 'check', weight: 1, days: ALL, sort: 1 },
    { id: 'l', type: 'todo', weight: 2, days: ALL, on_day: '2026-11-08', sort: 2 },
  ];
  S.days['2026-11-08'] = { log: { water_ml: 1500 }, food: [], workouts: [], tlogs: { l: { done: true }, r: { done: true } } };
  const c = calcDay(S, '2026-11-08', '2026-11-08');
  assert.equal(c.total, 2);
  assert.equal(c.pillars.intake.score, 0.5);
  assert.equal(c.score, 2 / 3);
});

test('protein mode: regular meals assumed, only add-ons logged', () => {
  const S = base();
  S.targets = { ...targets, protein: 100, proteinBase: 40, proteinSince: '2026-11-08' };
  S.foodsById.shake = { kcal: 130, protein: 25 };
  S.tasks = [{ id: 'p', type: 'auto', auto_key: 'protein', weight: 1, days: ALL, sort: 0 }];
  S.days['2026-11-08'] = { log: null, food: [{ food_id: 'shake', qty: 1 }, { food_id: 'roti', qty: 4, is_default: true }], workouts: [], tlogs: {} };
  const c = calcDay(S, '2026-11-08', '2026-11-08');
  assert.equal(c.proteinExtra, 25);
  assert.equal(c.protein, 65);
  assert.equal(c.scored[0].credit, 25 / 60);
  S.days['2026-11-07'] = { log: null, food: [{ food_id: 'shake', qty: 2 }], workouts: [], tlogs: {} };
  assert.equal(calcDay(S, '2026-11-07', '2026-11-08').protein, 50);   // before the switch: logged food only
});

test('habit streaks: 7 then 21, medal every 21 days, unfinished today does not break', () => {
  const S = base();
  S.tasks = [{ id: 'r', type: 'check', weight: 1, days: ALL, sort: 0 }];
  for (let i = 0; i < 23; i++) {
    const k = key(addDays(parse('2026-11-30'), -i - 1));
    S.days[k] = { log: null, food: [], workouts: [], tlogs: { r: { done: true } } };
  }
  S.days['2026-11-30'] = { log: null, food: [], workouts: [], tlogs: {} };
  const st = habitStreaks(S, '2026-11-30').r;
  assert.equal(st.run, 23);
  assert.equal(st.medals, 1);
  assert.equal(st.goal, 42);
  assert.equal(st.doneToday, false);
});

test('watch exercise minutes count without double counting', () => {
  const S = base();
  S.days['2026-11-08'] = { log: { exercise_min: 50 }, food: [], workouts: [{ minutes: 45, kcal: 300 }], tlogs: {} };
  assert.equal(calcDay(S, '2026-11-08', '2026-11-08').wMin, 50);
  S.days['2026-11-08'].log.exercise_min = 20;
  assert.equal(calcDay(S, '2026-11-08', '2026-11-08').wMin, 45);
});

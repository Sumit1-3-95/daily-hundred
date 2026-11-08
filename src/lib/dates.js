export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayKey = () => key(new Date());
export const lastN = (n, end = new Date()) => Array.from({ length: n }, (_, i) => key(addDays(end, i - n + 1)));
export const short = (k) => { const d = parse(k); return `${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })}`; };
export const mealNow = (h = new Date().getHours()) => (h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 18 ? 'Snack' : 'Dinner');
export const MEALS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

/** Hours between bed time and wake time (HH:MM), crossing midnight if needed. */
export function sleepHours(bed, wake) {
  if (!bed || !wake) return null;
  const [bh, bm] = bed.split(':').map(Number), [wh, wm] = wake.split(':').map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

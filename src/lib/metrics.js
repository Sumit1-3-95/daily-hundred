// Metrics you can pin on Home and pick as your focus habit.
const f0 = (n) => Math.round(n ?? 0).toLocaleString('en-IN');

export const METRICS = {
  water: { label: 'Water', icon: 'water', value: (c) => `${(c.water / 1000).toFixed(2)} L`, sub: (c, t) => `of ${t.water / 1000} L`,
    p: (c, t) => c.water / t.water, hit: (c, t) => c.water >= t.water, goal: (t) => `Drink ${t.water / 1000} L a day` },
  protein: { label: 'Protein', icon: 'bolt', value: (c) => `${f0(c.protein)} g`, sub: (c, t) => `of ${t.protein} g`,
    p: (c, t) => c.protein / t.protein, hit: (c, t) => c.protein >= t.protein, goal: (t) => `Eat ${t.protein} g protein a day` },
  eaten: { label: 'Eaten', icon: 'calories', value: (c) => f0(c.eaten), sub: (c, t) => `of ${f0(t.kcal)} kcal`,
    p: (c, t) => c.eaten / t.kcal, hit: (c, t) => c.closed && c.eaten <= t.kcal, goal: (t) => `Stay under ${f0(t.kcal)} kcal` },
  burned: { label: 'Burned', icon: 'fire', value: (c) => f0(c.burned), sub: (c, t) => `${t.bmr} rest + ${f0(c.active)} active`,
    p: (c, t) => c.active / (t.activeKcal || 400), hit: (c, t) => c.active >= (t.activeKcal || 400), goal: (t) => `Burn ${t.activeKcal} active kcal` },
  deficit: { label: 'Deficit', icon: 'target', value: (c) => f0(c.shownD), sub: (c, t) => `${c.open ? 'projected · ' : ''}target ${t.deficit}`,
    p: (c, t) => c.shownD / t.deficit, hit: (c, t) => c.closed && c.deficit >= t.deficit, goal: (t) => `${t.deficit} kcal deficit` },
  workout: { label: 'Workout', icon: 'dumbbell', value: (c) => (c.rest ? 'Rest' : `${f0(c.wMin)} min`), sub: (c, t) => `of ${t.workoutMin} min`,
    p: (c, t) => (c.rest ? 1 : c.wMin / t.workoutMin), hit: (c, t) => c.rest || c.wMin >= t.workoutMin, goal: (t) => `Work out ${t.workoutMin} min` },
  weight: { label: 'Weight', icon: 'scale', value: (c) => (c.weight != null ? `${c.weight.toFixed(1)}` : '—'), sub: () => 'kg',
    p: () => null, hit: (c) => c.weight != null, goal: () => 'Weigh in every morning' },
  sleep: { label: 'Sleep', icon: 'moon', value: (c) => `${c.sleep || 0} h`, sub: (c, t) => `of ${t.sleep} h`,
    p: (c, t) => c.sleep / t.sleep, hit: (c, t) => c.sleep >= t.sleep, goal: (t) => `Sleep ${t.sleep} hours` },
  steps: { label: 'Steps', icon: 'steps', value: (c) => (c.steps != null ? f0(c.steps) : '—'), sub: (c, t) => `of ${f0(t.steps || 8000)}`,
    p: (c, t) => (c.steps || 0) / (t.steps || 8000), hit: (c, t) => (c.steps || 0) >= (t.steps || 8000), goal: (t) => `Walk ${f0(t.steps || 8000)} steps` },
};
export const DEFAULT_HOME = ['water', 'protein', 'eaten', 'burned', 'deficit', 'sleep'];
export const DEFAULT_FOCUS = { metric: 'water', days: 7 };

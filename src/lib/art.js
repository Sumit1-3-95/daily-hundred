// Pictures for tiles: metrics on At a glance, and habits (unless a habit has its own photo).
// light, outlined icons on solid pastel backgrounds (scripts/make-glance-art.py)
export const METRIC_ART = Object.fromEntries(['water', 'protein', 'eaten', 'burned', 'deficit', 'workout', 'sleep', 'steps', 'weight']
  .map((m) => [m, `/art/g-${m}.svg`]));
/** Placeholder pictures you can pick for a habit or task. */
export const TASK_ART = ['routine', 'read', 'write', 'meditate', 'laundry', 'plant', 'supplements', 'todo', 'sleep', 'closeday', 'workout', 'water']
  .map((n) => `/art/${n}.svg`);

const BY_AUTO = { water: 'water', protein: 'protein', workout: 'workout', burn: 'burned', calories: 'eaten', deficit: 'deficit', sleep: 'sleep', closed: 'closeday', steps: 'steps' };
const BY_NAME = [[/job|appl|resume|cv\b/i, 'jobs'], [/read|book|page/i, 'read'], [/writ|journal|diary/i, 'write'], [/laundry|wash|cloth/i, 'laundry'], [/meditat|breath|mind/i, 'meditate'],
  [/supplement|vitamin|pill/i, 'supplements'], [/plant|garden/i, 'plant'], [/morning|routine|wake/i, 'routine'], [/night|sleep|bed/i, 'closeday']];

export function habitArt(task) {
  if (task.image_url) return task.image_url;
  if (task.type === 'auto' && BY_AUTO[task.auto_key]) return `/art/${BY_AUTO[task.auto_key]}.svg`;
  if (task.type === 'checklist') return '/art/routine.svg';
  const hit = BY_NAME.find(([re]) => re.test(task.name || ''));
  if (hit) return `/art/${hit[1]}.svg`;
  return task.type === 'todo' ? '/art/todo.svg' : '/art/plant.svg';
}

/** Stick-figure pictures (scripts/make-exercise-art.py) for workouts and plan activities. */
export const EX = (n) => `/ex/${n}.svg`;
const WORKOUT_ART = [[/badminton|tennis|squash|pickle/i, 'badminton'], [/cricket/i, 'cricket'], [/swim/i, 'swim'], [/cycl|bike|spin/i, 'bike'],
  [/incline/i, 'incline'], [/run|jog|treadmill|hrx|hiit/i, 'jog'], [/walk|hike|steps/i, 'walk'], [/yoga/i, 'tree'], [/stretch|mobil|pilates/i, 'hamstring'],
  [/core|abs|plank/i, 'plank'], [/lower|leg|squat/i, 'squat'], [/upper|chest|press|arm/i, 'press'], [/dance|zumba|burn|class|boxing/i, 'class'],
  [/circuit|functional|cross|kettle/i, 'kb-swing'], [/strength|gym|weight/i, 'deadlift']];
const AREA_ART = { Cardio: 'jog', Mobility: 'hamstring', Core: 'plank', 'Lower body': 'squat', 'Upper body': 'press', 'Full body': 'kb-swing', Sport: 'badminton' };
export function workoutArt(w = {}) {
  if (w.image_url) return w.image_url;
  const hit = WORKOUT_ART.find(([re]) => re.test(w.name || ''));
  return EX(hit ? hit[1] : AREA_ART[w.area] || 'jumping-jack');
}

// The + button: one tap on an icon opens that log's quick picks.
import { useStore } from '../store.jsx';
import { IconTile } from '../components/Icons.jsx';

const ITEMS = [
  ['water', 'water', 'Water'], ['logFood', 'thali', 'Food'], ['logWorkout', 'dumbbell', 'Workout'], ['weight', 'scale', 'Weight'],
  ['sleep', 'sun', 'Wake-up'], ['avoid', 'drink', 'Detractors'], ['task', 'check', 'Task'], ['closeDay', 'moon', 'Sign off'],
];

export default function QuickAdd() {
  const { open } = useStore();
  return (
    <>
      <h2>Add</h2>
      <div className="icon-grid">
        {ITEMS.map(([s, ic, l]) => (
          <button key={s} onClick={() => open(s)}><IconTile name={ic} size="lg" /><span className="ig-l">{l}</span></button>
        ))}
      </div>
    </>
  );
}

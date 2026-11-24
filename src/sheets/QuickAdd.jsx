// The + button: one tap on an icon opens that log's quick picks.
import { useStore } from '../store.jsx';
import { IconTile } from '../components/Icons.jsx';

const ITEMS = [
  ['logFood', 'shake', 'Protein'], ['water', 'water', 'Water'], ['logWorkout', 'dumbbell', 'Workout'], ['books', 'book', 'Reading'],
  ['todoAdd', 'list', 'To-do'], ['weightPage', 'scale', 'Weight'], ['task', 'check', 'New habit'], ['avoid', 'drink', 'Detractors'],
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

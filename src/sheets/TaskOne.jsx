import { useStore } from '../store.jsx';
import TaskRow from '../components/TaskRow.jsx';
import { taskName } from '../lib/calc.js';

/** One task opened from a Home card: shows its steps or counter. */
export default function TaskOne({ id }) {
  const { S, today, calc } = useStore();
  const c = calc(today);
  const s = c.scored.find((x) => x.task.id === id);
  if (!s) return <p className="hint">This task isn't scheduled today.</p>;
  return (
    <>
      <h2>{taskName(s.task, S.targets)}</h2>
      <div className="tlist"><TaskRow k={today} c={c} task={s.task} credit={s.credit} defaultExpand /></div>
    </>
  );
}

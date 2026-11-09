// "Avoid" habits (alcohol, smoking). Each one logged takes points off the day.
import { useStore } from '../store.jsx';
import { IconTile } from './Icons.jsx';

export function AvoidCards({ k, compact }) {
  const { calc, A } = useStore();
  const c = calc(k);
  if (!c.avoids.length) return null;
  const set = (task, v) => A.setTaskLog(k, task, { value: Math.max(0, v) });
  return (
    <div className={`avoids${compact ? ' compact' : ''}`}>
      {c.avoids.map(({ task, count }) => (
        <div key={task.id} className={`avoid${count ? ' hit' : ''}`}>
          <IconTile name={task.icon || 'drink'} size="sm" tone={count ? 'pink' : 'slate'} />
          <div className="av-b"><span className="av-n">{task.name}</span>
            <span className="av-m">{count ? `${count} ${task.unit || ''} · −${count * task.weight} pts` : `None today · −${task.weight} pts each`}</span></div>
          <div className="stepper">
            <button onClick={() => set(task, count - 1)} disabled={!count} aria-label={`One less ${task.name}`}>−</button>
            <button onClick={() => set(task, count + 1)} aria-label={`Log one ${task.name}`}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AvoidSheet() {
  const { today } = useStore();
  return <><h2>Things to avoid</h2><AvoidCards k={today} /><p className="hint">Logging one takes its points off today's score. Change the points under Today → Edit.</p></>;
}

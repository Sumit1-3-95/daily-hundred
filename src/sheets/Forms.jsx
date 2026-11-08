import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Field, fmt } from '../components/ui.jsx';
import { CloseBlock, RoutineBlock, WakeBlock, WaterBlock, WeightBlock } from '../components/Nudges.jsx';
import FoodPicker from '../components/FoodPicker.jsx';
import { FOOD_ICONS, IconTile } from '../components/Icons.jsx';
import { DOW, mealNow } from '../lib/dates.js';
import { AUTO_LABEL } from '../lib/calc.js';

const AREAS = ['Full body', 'Upper body', 'Lower body', 'Core', 'Cardio', 'Mobility', 'Other'];
const n = (v) => (v === '' || v == null ? null : Number(v));

export function LogFood() {
  const { today } = useStore();
  return <><h2>Log food</h2><FoodPicker k={today} /></>;
}

export function NewFood({ name = '' }) {
  const { today, A, close, toast } = useStore();
  const [icon, setIcon] = useState('bowl');
  return (
    <>
      <h2>New food item</h2>
      <form onSubmit={async (e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        const row = await A.createFood({ name: fd.get('name').trim(), serving: fd.get('serving').trim(), kcal: Number(fd.get('kcal')),
          protein: Number(fd.get('protein')), carbs: n(fd.get('carbs')), fat: n(fd.get('fat')), icon, quick: !!fd.get('quick') });
        if (fd.get('log')) await A.logFood(today, row.id, mealNow());
        toast(`Saved ${row.name}`); close();
      }}>
        <Field label="Name" id="nfName"><input id="nfName" name="name" required defaultValue={name} placeholder="e.g. Rajma chawal" /></Field>
        <Field label="One serving is" id="nfServ"><input id="nfServ" name="serving" required placeholder="e.g. 1 plate, 2 roti + sabzi, 1 piece" /></Field>
        <div className="two">
          <Field label="Calories (kcal)" id="nfK"><input id="nfK" name="kcal" type="number" inputMode="decimal" min="0" required /></Field>
          <Field label="Protein (g)" id="nfP"><input id="nfP" name="protein" type="number" inputMode="decimal" min="0" step="0.1" required /></Field>
        </div>
        <div className="two">
          <Field label="Carbs (g, optional)" id="nfC"><input id="nfC" name="carbs" type="number" min="0" step="0.1" /></Field>
          <Field label="Fat (g, optional)" id="nfF"><input id="nfF" name="fat" type="number" min="0" step="0.1" /></Field>
        </div>
        <div className="field"><span className="lb">Picture</span>
          <div className="iconpick">{FOOD_ICONS.map((ic) => (
            <button type="button" key={ic} aria-pressed={icon === ic} onClick={() => setIcon(ic)} aria-label={ic}><IconTile name={ic} size="sm" /></button>
          ))}</div></div>
        <label className="toggle" htmlFor="nfQuick"><span>Show in quick picks</span><input id="nfQuick" name="quick" type="checkbox" defaultChecked /></label>
        <label className="toggle" htmlFor="nfLog"><span>Also log 1 serving now</span><input id="nfLog" name="log" type="checkbox" defaultChecked /></label>
        <button className="btn">Save food item</button>
      </form>
    </>
  );
}

export function LogWorkout() {
  const { S, today, A, open, close, toast } = useStore();
  const [typeId, setType] = useState(S.wtypes[0]?.id || '');
  const [min, setMin] = useState(45);
  const w = S.wtypes.find((x) => x.id === typeId);
  const est = Math.round((Number(min) || 0) * (w?.kcal_per_min || 6));
  return (
    <>
      <h2>Log workout</h2>
      <form onSubmit={async (e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        await A.logWorkout(today, { type_id: w?.id ?? null, name: w?.name || 'Workout', area: w?.area || 'Other',
          minutes: Number(min), kcal: n(fd.get('kcal')) ?? est, source: fd.get('src') });
        toast(`Logged ${w?.name || 'workout'}`); close();
      }}>
        <Field label="Workout" id="lwT"><select id="lwT" value={typeId} onChange={(e) => setType(e.target.value)}>
          {S.wtypes.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.area}</option>)}</select></Field>
        <div className="two">
          <Field label="Minutes" id="lwM"><input id="lwM" type="number" inputMode="numeric" min="1" required value={min} onChange={(e) => setMin(e.target.value)} /></Field>
          <Field label="Calories burned" id="lwK"><input id="lwK" name="kcal" type="number" inputMode="numeric" min="0" placeholder={String(est)} /></Field>
        </div>
        <Field label="Source" id="lwS"><select id="lwS" name="src" defaultValue="cult">
          <option value="cult">Cult app</option><option value="apple_watch">Apple Watch</option><option value="manual">Manual</option></select></Field>
        <p className="hint">Leave calories empty to estimate from the workout type. Copy the exact number from the Cult app when you have it.</p>
        <button className="btn">Save workout</button>
      </form>
      <button className="btn ghost" onClick={() => open('newWorkout')}>Add a new workout type</button>
    </>
  );
}

export function NewWorkout() {
  const { A, close, toast } = useStore();
  return (
    <>
      <h2>New workout type</h2>
      <form onSubmit={async (e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        await A.createWorkoutType({ name: fd.get('name').trim(), area: fd.get('area'), kcal_per_min: Number(fd.get('kpm')) });
        toast('Workout type saved'); close();
      }}>
        <Field label="Name" id="nwN"><input id="nwN" name="name" required placeholder="e.g. Cult Boxing" /></Field>
        <div className="two">
          <Field label="Area" id="nwA"><select id="nwA" name="area">{AREAS.map((a) => <option key={a}>{a}</option>)}</select></Field>
          <Field label="kcal per minute" id="nwK"><input id="nwK" name="kpm" type="number" step="0.5" min="1" required defaultValue="7" /></Field>
        </div>
        <button className="btn">Save workout type</button>
      </form>
    </>
  );
}

export const Water = () => { const { today } = useStore(); return <><h2>Water</h2><WaterBlock k={today} /></>; };
export const Weight = () => { const { today, close } = useStore(); return <><h2>Today's weight</h2><WeightBlock k={today} onDone={close} /></>; };
export const Sleep = () => { const { today, close } = useStore(); return <><h2>Good morning</h2><WakeBlock k={today} onDone={close} /></>; };
export const Routine = () => { const { today } = useStore(); return <><h2>Morning routine</h2><RoutineBlock k={today} /></>; };
export const CloseDay = () => { const { today, close } = useStore(); return <><h2>Sign off for today</h2><CloseBlock k={today} onDone={close} /></>; };

export function TaskForm({ task, preset }) {
  const { S, A, close, toast } = useStore();
  const t0 = task || { name: '', type: 'check', weight: 1, days: [0, 1, 2, 3, 4, 5, 6], ...(preset || {}) };
  const [type, setType] = useState(t0.type);
  const [sure, setSure] = useState(false);
  const routines = S.lists;
  return (
    <>
      <h2>{task ? 'Edit task' : 'New task or goal'}</h2>
      <form onSubmit={async (e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        const days = fd.getAll('d').map(Number);
        if (!days.length) { toast('Pick at least one day'); return; }
        const autoKey = type === 'auto' ? fd.get('auto') : null;
        const row = {
          ...(task ? { id: task.id } : {}), type, days, weight: Number(fd.get('weight')),
          name: type === 'auto' ? (fd.get('name') || '').trim() || AUTO_LABEL[autoKey](S.targets) : fd.get('name').trim(),
          auto_key: autoKey,
          target: type === 'number' ? Number(fd.get('target')) || 1 : null,
          unit: type === 'number' ? (fd.get('unit') || '').trim() : null,
          list_id: type === 'checklist' ? fd.get('list') : null,
        };
        await A.saveTask(row); toast(task ? 'Task updated' : 'Task added'); close();
      }}>
        <Field label="Type" id="tT"><select id="tT" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="check">Tick when done</option>
          <option value="number">Number target (pages, minutes, steps)</option>
          <option value="checklist">Checklist from a list (e.g. morning routine)</option>
          <option value="auto">Automatic from my data</option>
        </select></Field>
        {type !== 'auto' && <Field label="Task" id="tN"><input id="tN" name="name" required defaultValue={t0.name} placeholder="e.g. Read, 10 min meditation, no phone after 11" /></Field>}
        {type === 'number' && <div className="two">
          <Field label="Target" id="tG"><input id="tG" name="target" type="number" min="1" required defaultValue={t0.target || 25} /></Field>
          <Field label="Unit" id="tU"><input id="tU" name="unit" defaultValue={t0.unit || ''} placeholder="pages" /></Field></div>}
        {type === 'checklist' && (routines.length
          ? <Field label="List" id="tL"><select id="tL" name="list" defaultValue={t0.list_id || routines[0].id}>{routines.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
          : <p className="hint">Create a list in the Lists tab first.</p>)}
        {type === 'auto' && <Field label="Completes when" id="tA"><select id="tA" name="auto" defaultValue={t0.auto_key || 'protein'}>
          {Object.entries(AUTO_LABEL).map(([k2, f]) => <option key={k2} value={k2}>{f(S.targets)}</option>)}</select></Field>}
        <div className="field"><span className="lb">Points in the day score</span>
          <div className="weights">{[1, 2, 3, 5].map((w) => (
            <label key={w}><input type="radio" name="weight" value={w} defaultChecked={(t0.weight || 1) === w} /><span>×{w}</span></label>
          ))}</div>
          <p className="hint">×1 for small habits, ×3 or ×5 for the ones that matter most.</p></div>
        <div className="field"><span className="lb">Repeat on</span>
          <div className="days">{[1, 2, 3, 4, 5, 6, 0].map((i) => (
            <label key={i}><input type="checkbox" name="d" value={i} defaultChecked={t0.days.includes(i)} /><span>{DOW[i].slice(0, 2)}</span></label>
          ))}</div></div>
        <button className="btn">{task ? 'Save changes' : 'Add task'}</button>
      </form>
      {task && (sure
        ? <button className="btn" style={{ background: 'var(--bad)' }} onClick={async () => { await A.archiveTask(task.id); toast('Task removed'); close(); }}>Tap again to remove this task</button>
        : <button className="btn ghost" onClick={() => setSure(true)}>Remove task</button>)}
    </>
  );
}

export function ListForm({ list }) {
  const { A, close, toast } = useStore();
  return (
    <>
      <h2>{list ? 'Rename list' : 'New list'}</h2>
      <form onSubmit={async (e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        if (list) await A.updateList(list.id, { title: fd.get('title').trim() });
        else await A.createList({ title: fd.get('title').trim(), kind: fd.get('kind') });
        toast(list ? 'List renamed' : 'List created'); close();
      }}>
        <Field label="Title" id="lT"><input id="lT" name="title" required defaultValue={list?.title || ''} placeholder="e.g. Jaipur packing" /></Field>
        {!list && <Field label="Kind" id="lK"><select id="lK" name="kind" defaultValue="note">
          <option value="note">List or note (packing, groceries)</option>
          <option value="routine">Routine (ticked daily as a task)</option></select></Field>}
        <button className="btn">{list ? 'Save' : 'Create list'}</button>
      </form>
    </>
  );
}

export function Measure() {
  const { S, today, A, close, toast } = useStore();
  const b = S.scans[S.scans.length - 1] || {};
  const F = ({ id, name, l, v, st }) => <Field label={l} id={id}><input id={id} name={name} type="number" step={st} defaultValue={v ?? ''} /></Field>;
  return (
    <>
      <h2>Add measurement</h2>
      <form onSubmit={async (e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        await A.addScan({ date: fd.get('date'), source: fd.get('source') || null, weight: n(fd.get('weight')), pbf: n(fd.get('pbf')),
          fat_mass: n(fd.get('fat_mass')), smm: n(fd.get('smm')), visceral: n(fd.get('visceral')), whr: n(fd.get('whr')),
          bmr: n(fd.get('bmr')), score: n(fd.get('score')),
          seg: { la: n(fd.get('la')), ra: n(fd.get('ra')), tr: n(fd.get('tr')), ll: n(fd.get('ll')), rl: n(fd.get('rl')) } });
        toast('Measurement saved'); close();
      }}>
        <div className="two">
          <Field label="Date" id="mD"><input id="mD" name="date" type="date" defaultValue={today} required /></Field>
          <Field label="Where" id="mSrc"><input id="mSrc" name="source" defaultValue={b.source || 'InBody at Cult'} /></Field></div>
        <div className="two"><F id="mW" name="weight" l="Weight (kg)" v={b.weight} st="0.1" /><F id="mP" name="pbf" l="Body fat %" v={b.pbf} st="0.1" /></div>
        <div className="two"><F id="mF" name="fat_mass" l="Fat mass (kg)" v={b.fat_mass} st="0.1" /><F id="mS" name="smm" l="Muscle SMM (kg)" v={b.smm} st="0.1" /></div>
        <div className="two"><F id="mV" name="visceral" l="Visceral level" v={b.visceral} st="1" /><F id="mR" name="whr" l="Waist-hip ratio" v={b.whr} st="0.01" /></div>
        <div className="two"><F id="mB" name="bmr" l="BMR (kcal)" v={b.bmr} st="1" /><F id="mSc" name="score" l="InBody score" v={b.score} st="1" /></div>
        <div className="qp-h">Segmental fat (kg)</div>
        <div className="two"><F id="mLa" name="la" l="Left arm" v={b.seg?.la} st="0.1" /><F id="mRa" name="ra" l="Right arm" v={b.seg?.ra} st="0.1" /></div>
        <div className="two"><F id="mTr" name="tr" l="Trunk" v={b.seg?.tr} st="0.1" /><F id="mLl" name="ll" l="Left leg" v={b.seg?.ll} st="0.1" /></div>
        <div className="two"><F id="mRl" name="rl" l="Right leg" v={b.seg?.rl} st="0.1" /><div /></div>
        <p className="hint">Prefilled with your last scan. Change what's different and save.</p>
        <button className="btn">Save measurement</button>
      </form>
    </>
  );
}

export function Blood() {
  const { today, A, close, toast } = useStore();
  return (
    <>
      <h2>Blood test result</h2>
      <form onSubmit={async (e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        await A.addBlood({ name: fd.get('name').trim(), value: Number(fd.get('value')), unit: fd.get('unit').trim() || null, date: fd.get('date') });
        toast('Result saved'); close();
      }}>
        <Field label="Test" id="bN"><input id="bN" name="name" required list="bList" placeholder="e.g. Vitamin D" />
          <datalist id="bList">{['HbA1c', 'Fasting glucose', 'Vitamin D', 'Vitamin B12', 'Total cholesterol', 'LDL', 'HDL', 'Triglycerides', 'TSH', 'Haemoglobin', 'Uric acid'].map((x) => <option key={x} value={x} />)}</datalist></Field>
        <div className="two">
          <Field label="Value" id="bV"><input id="bV" name="value" type="number" step="any" required inputMode="decimal" /></Field>
          <Field label="Unit" id="bU"><input id="bU" name="unit" placeholder="ng/mL" /></Field></div>
        <Field label="Date" id="bD"><input id="bD" name="date" type="date" defaultValue={today} required /></Field>
        <button className="btn">Save result</button>
      </form>
    </>
  );
}

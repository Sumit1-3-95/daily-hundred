// Edit sheets for the library: a food, a workout type, and how food cards look.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import PhotoField from '../components/PhotoField.jsx';
import { FOOD_ICONS, IconTile } from '../components/Icons.jsx';
import { Field } from '../components/ui.jsx';
import { MEALS, mealNow } from '../lib/dates.js';

const AREAS = ['Full body', 'Upper body', 'Lower body', 'Core', 'Cardio', 'Mobility', 'Other'];
export const DEFAULT_VIEW = { size: 'm', kcal: true, protein: true, photo: true };
export const foodView = (S) => ({ ...DEFAULT_VIEW, ...(S.profile.prefs?.food_view || {}) });

/** Create or edit a food: photo, name, serving, calories, protein, meals, quick pick. */
export function FoodEdit({ id, name: name0 = '', meal, category: cat0 }) {
  const { S, today, A, close, toast } = useStore();
  const f0 = id ? S.foodsById[id] : null;
  const [img, setImg] = useState(f0?.image_url || null);
  const [icon, setIcon] = useState(f0?.icon || 'bowl');
  const [meals, setMeals] = useState(f0?.meals?.length ? f0.meals : [meal || mealNow()]);
  const [quick, setQuick] = useState(f0 ? !!f0.quick : true);
  const [cat, setCat] = useState(f0 ? f0.category || '' : cat0 || '');
  const [sure, setSure] = useState(false);
  const tog = (m) => setMeals((x) => (x.includes(m) ? x.filter((y) => y !== m) : [...x, m]));
  return (
    <>
      <h2>{f0 ? 'Edit food' : 'New food'}</h2>
      <form onSubmit={async (e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        const row = { name: fd.get('name').trim(), serving: fd.get('serving').trim(), kcal: Number(fd.get('kcal')), protein: Number(fd.get('protein')), meals, quick, icon, image_url: img, category: cat || null };
        if (f0) { await A.updateFood(f0.id, row); toast('Saved'); }
        else { const r = await A.createFood(row); if (fd.get('log')) await A.logFood(today, r.id, meals[0] || mealNow()); toast(`Added ${r.name}`); }
        close();
      }}>
        <div className="edit-top">
          <PhotoField value={img} onChange={setImg} icon={icon} kind="food" />
          <div className="edit-fields">
            <Field label="Name" id="feN"><input id="feN" name="name" required defaultValue={f0?.name || name0} /></Field>
            <Field label="Serving" id="feS"><input id="feS" name="serving" required defaultValue={f0?.serving || ''} placeholder="1 plate" /></Field>
          </div>
        </div>
        <div className="two">
          <Field label="Calories" id="feK"><input id="feK" name="kcal" type="number" inputMode="decimal" min="0" required defaultValue={f0?.kcal ?? ''} /></Field>
          <Field label="Protein (g)" id="feP"><input id="feP" name="protein" type="number" inputMode="decimal" min="0" step="0.1" required defaultValue={f0?.protein ?? ''} /></Field>
        </div>
        <div className="chips" role="group" aria-label="Meals">{MEALS.map((m) => (
          <button type="button" key={m} className={`chip${meals.includes(m) ? ' on' : ''}`} aria-pressed={meals.includes(m)} onClick={() => tog(m)}>{m}</button>
        ))}</div>
        <div className="seg3" role="group" aria-label="Type">
          {[['', 'Meal'], ['drink', 'Drink'], ['street', 'Street food']].map(([k, l]) => (
            <button type="button" key={k || 'meal'} aria-pressed={cat === k} onClick={() => setCat(k)}>{l}</button>))}
        </div>
        <label className="toggle" htmlFor="feQ"><span>Quick pick</span><input id="feQ" type="checkbox" checked={quick} onChange={(e) => setQuick(e.target.checked)} /></label>
        {!img && <div className="iconpick">{FOOD_ICONS.map((ic) => (
          <button type="button" key={ic} aria-pressed={icon === ic} onClick={() => setIcon(ic)} aria-label={ic}><IconTile name={ic} size="sm" /></button>
        ))}</div>}
        {!f0 && <label className="toggle" htmlFor="feL"><span>Log 1 now</span><input id="feL" name="log" type="checkbox" defaultChecked /></label>}
        <button className="btn">{f0 ? 'Save' : 'Add food'}</button>
      </form>
      {f0 && (sure
        ? <button className="btn danger" onClick={async () => { await A.updateFood(f0.id, { archived: true }); toast('Removed'); close(); }}>Tap again to remove</button>
        : <button className="btn ghost" onClick={() => setSure(true)}>Remove food</button>)}
    </>
  );
}

export function WorkoutEdit({ id }) {
  const { S, A, close, toast } = useStore();
  const w0 = id ? S.wtypes.find((w) => w.id === id) : null;
  const [img, setImg] = useState(w0?.image_url || null);
  const [sure, setSure] = useState(false);
  return (
    <>
      <h2>{w0 ? 'Edit workout' : 'New workout'}</h2>
      <form onSubmit={async (e) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget);
        const row = { name: fd.get('name').trim(), area: fd.get('area'), kcal_per_min: Number(fd.get('kpm')), image_url: img };
        if (w0) await A.updateWorkoutType(w0.id, row); else await A.createWorkoutType(row);
        toast('Saved'); close();
      }}>
        <div className="edit-top">
          <PhotoField value={img} onChange={setImg} icon="dumbbell" kind="workout" />
          <div className="edit-fields">
            <Field label="Name" id="weN"><input id="weN" name="name" required defaultValue={w0?.name || ''} placeholder="Cult Boxing" /></Field>
            <Field label="Area" id="weA"><select id="weA" name="area" defaultValue={w0?.area || 'Full body'}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></Field>
          </div>
        </div>
        <Field label="Calories per minute" id="weK"><input id="weK" name="kpm" type="number" step="0.5" min="1" required defaultValue={w0?.kcal_per_min ?? 7} /></Field>
        <button className="btn">Save</button>
      </form>
      {w0 && (sure
        ? <button className="btn danger" onClick={async () => { await A.updateWorkoutType(w0.id, { archived: true }); toast('Removed'); close(); }}>Tap again to remove</button>
        : <button className="btn ghost" onClick={() => setSure(true)}>Remove workout</button>)}
    </>
  );
}

/** How food cards look: size and which numbers show. */
export function FoodViewSheet() {
  const { S, A, close } = useStore();
  const [v, setV] = useState(foodView(S));
  const set = (k, val) => setV((x) => ({ ...x, [k]: val }));
  return (
    <>
      <h2>Food cards</h2>
      <div className="field"><span className="lb">Size</span>
        <div className="period" style={{ width: '100%' }}>{[['s', 'Small'], ['m', 'Medium'], ['l', 'Large']].map(([k, l]) => (
          <button key={k} aria-pressed={v.size === k} onClick={() => set('size', k)}>{l}</button>))}</div></div>
      {[['photo', 'Photo'], ['kcal', 'Calories'], ['protein', 'Protein']].map(([k, l]) => (
        <label key={k} className="toggle" htmlFor={`fv-${k}`}><span>{l}</span><input id={`fv-${k}`} type="checkbox" checked={v[k]} onChange={(e) => set(k, e.target.checked)} /></label>
      ))}
      <button className="btn" onClick={async () => { await A.savePrefs({ food_view: v }); close(); }}>Save</button>
    </>
  );
}

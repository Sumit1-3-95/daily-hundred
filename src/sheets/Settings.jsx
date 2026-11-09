import { useEffect, useState } from 'react';
import { useStore } from '../store.jsx';
import { Field, fmt } from '../components/ui.jsx';
import { IconTile } from '../components/Icons.jsx';
import { MEALS } from '../lib/dates.js';
import { MEAL_DUE, mealPlan } from '../lib/mealplan.js';
import { pushSupport, subscribePush } from '../lib/push.js';
import { supabase } from '../lib/supabase.js';

const NUDGE_LABEL = { sleep: 'Wake-up time (morning)', weight: 'Morning weight', routine: 'Morning routine', water: 'Water check', close_day: 'Sign off and bedtime (night)' };
const TARGETS = [
  ['deficit', 'Daily deficit (kcal)', '10'], ['workoutMin', 'Workout (min / day)', '5'], ['kcal', 'Calories to eat (kcal)', '10'],
  ['protein', 'Protein (g)', '1'], ['water', 'Water (ml)', '250'], ['sleep', 'Sleep (hours)', '0.5'],
  ['activeKcal', 'Active burn (kcal)', '10'], ['steps', 'Steps', '500'],
  ['bmr', 'Resting burn (kcal)', '1'], ['startWeight', 'Start weight (kg)', '0.1'], ['goalWeight', 'Goal weight (kg)', '0.1'],
];

export default function Settings() {
  const [tab, setTab] = useState('targets');
  return (
    <>
      <h2>Settings</h2>
      <div className="seg" role="group" aria-label="Settings sections">
        {[['targets', 'Targets'], ['meals', 'Meals'], ['nudges', 'Nudges'], ['health', 'Sync'], ['account', 'Account']].map(([id, l]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{l}</button>
        ))}
      </div>
      {tab === 'targets' && <Targets />}
      {tab === 'meals' && <MealPlan />}
      {tab === 'nudges' && <Nudges />}
      {tab === 'health' && <HealthSync />}
      {tab === 'account' && <Account />}
    </>
  );
}

function Targets() {
  const { S, A, toast } = useStore();
  return (
    <form onSubmit={async (e) => {
      e.preventDefault(); const fd = new FormData(e.currentTarget);
      const targets = { ...S.targets };
      TARGETS.forEach(([k]) => { targets[k] = Number(fd.get(k)); });
      await A.saveProfile({ name: fd.get('name').trim(), targets });
      toast('Targets saved');
    }}>
      <Field label="Your name" id="sName"><input id="sName" name="name" defaultValue={S.profile.name || ''} /></Field>
      {Array.from({ length: Math.ceil(TARGETS.length / 2) }, (_, i) => (
        <div className="two" key={i}>{TARGETS.slice(i * 2, i * 2 + 2).map(([k, l, st]) => (
          <Field key={k} label={l} id={`s_${k}`}><input id={`s_${k}`} name={k} type="number" step={st} defaultValue={S.targets[k]} required /></Field>
        ))}</div>
      ))}
      <p className="hint">Deficit = resting burn + active calories − food eaten. Take resting burn from your latest InBody report.</p>
      <button className="btn">Save targets</button>
    </form>
  );
}

function Nudges() {
  const { S, A, toast } = useStore();
  const sup = pushSupport();
  const [perm, setPerm] = useState(sup.ok ? sup.permission : 'unsupported');
  const [kind, setKind] = useState('water');
  const [time, setTime] = useState('15:00');
  return (
    <>
      <div className="card" style={{ boxShadow: 'none' }}>
        <h3>Push notifications</h3>
        {!sup.ok ? <p className="hint">{sup.reason}</p> : perm === 'granted'
          ? <p className="hint">On for this device. Nudges also show as cards on Home.</p>
          : <button className="btn" onClick={async () => {
              try { await A.savePushSub(await subscribePush()); setPerm('granted'); toast('Notifications on'); }
              catch (e) { toast(e.message); setPerm(Notification.permission); }
            }}>Turn on notifications</button>}
        {sup.ok && perm === 'granted' && <button className="btn ghost sm" onClick={async () => {
          try { await A.savePushSub(await subscribePush()); toast('This device is registered again'); } catch (e) { toast(e.message); }
        }}>Re-register this device</button>}
      </div>
      <div className="list">
        {S.nudges.map((nd) => (
          <div className="nudge-row" key={nd.id}>
            <input type="checkbox" id={`ne-${nd.id}`} checked={nd.enabled} onChange={(e) => A.saveNudge({ id: nd.id, enabled: e.target.checked })} aria-label={`Turn ${NUDGE_LABEL[nd.kind]} on or off`} />
            <label className="grow" htmlFor={`ne-${nd.id}`}>{NUDGE_LABEL[nd.kind]}</label>
            <input type="time" id={`nt-${nd.id}`} defaultValue={nd.at_time.slice(0, 5)} aria-label="Time"
              onBlur={(e) => e.target.value && e.target.value !== nd.at_time.slice(0, 5) && A.saveNudge({ id: nd.id, at_time: e.target.value })} />
            <button className="del" onClick={() => A.deleteNudge(nd.id)} aria-label="Delete nudge">✕</button>
          </div>
        ))}
      </div>
      <form className="inline" onSubmit={async (e) => { e.preventDefault(); await A.saveNudge({ kind, at_time: time }); toast('Nudge added'); }}>
        <Field label="New nudge" id="nk"><select id="nk" value={kind} onChange={(e) => setKind(e.target.value)}>
          {Object.entries(NUDGE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Time" id="ntm"><input id="ntm" type="time" value={time} onChange={(e) => setTime(e.target.value)} required /></Field>
        <button className="btn sm">Add</button>
      </form>
      <p className="hint">A nudge is only sent if that thing isn't logged yet. Water nudges stop once you reach your target.</p>
    </>
  );
}

export const SHORTCUT_NAME = 'Daily 100 Sync';
export const runShortcut = () => { window.location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}`; };

function HealthSync() {
  const { A, toast } = useStore();
  const [token, setToken] = useState('');
  const [last, setLast] = useState(undefined);
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-sync`;
  const copy = async (txt) => { try { await navigator.clipboard.writeText(txt); toast('Copied'); } catch { toast('Select the text and copy it'); } };
  useEffect(() => {
    supabase.from('api_tokens').select('last_used_at').order('last_used_at', { ascending: false, nullsFirst: false }).limit(1)
      .then(({ data }) => setLast(data?.[0]?.last_used_at || null));
  }, []);
  return (
    <>
      <div className="sync-card">
        <IconTile name="steps" />
        <div className="grow"><b>Apple Health</b>
          <span className="sub">{last === undefined ? '…' : last ? `Last sync ${new Date(last).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'Not synced yet'}</span></div>
        <button className="btn sm" onClick={runShortcut}>Sync now</button>
      </div>
      <p className="hint">Runs the "{SHORTCUT_NAME}" Shortcut, which sends steps, active calories, exercise minutes and weight here.</p>
      <Field label="1 · Address for the Shortcut" id="hsUrl"><div className="code" id="hsUrl" onClick={() => copy(url)}>{url}</div></Field>
      {token ? (
        <>
          <div className="field"><span className="lb">2 · Your token (shown once)</span><div className="code">{token}</div></div>
          <button className="btn" onClick={() => copy(`Bearer ${token}`)}>Copy "Bearer token"</button>
        </>
      ) : <button className="btn ghost" onClick={async () => setToken(await A.createToken())}>2 · Create a sync token</button>}
    </>
  );
}

function Account() {
  const { S, A, toast } = useStore();
  const [pin, setPin] = useState('');
  return (
    <>
      <p className="hint">Signed in as {S.profile.name || 'you'}.</p>
      <form className="inline" onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.updateUser({ password: pin });
        if (error) toast(error.message); else { toast('Login PIN changed'); setPin(''); }
      }}>
        <div className="field"><label htmlFor="npin">New 6-digit login PIN</label>
          <input id="npin" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} /></div>
        <button className="btn sm" disabled={!/^\d{6}$/.test(pin)}>Save</button>
      </form>
      <button className="btn ghost" onClick={() => A.signOut()}>Sign out</button>
      <p className="hint">Daily Hundred v0.2</p>
    </>
  );
}

/** Default meals: logged for you when the meal time passes and nothing was logged. */
function MealPlan() {
  const { S, A, toast } = useStore();
  const [plan, setPlan] = useState(() => JSON.parse(JSON.stringify(mealPlan(S))));
  const live = S.foods.filter((f) => !f.archived);
  const upd = (m, items) => setPlan((p) => ({ ...p, [m]: items }));
  const hh = (h) => `${Math.floor(h)}:${h % 1 ? '30' : '00'}`;
  return (
    <>
      <p className="hint">If a meal's time passes and you haven't logged it, these are logged for you and marked "default". Change them any time in Food.</p>
      {MEALS.map((m) => {
        const items = plan[m] || [];
        const kcal = items.reduce((a, x) => a + (S.foodsById[x.food_id]?.kcal || 0) * x.qty, 0);
        return (
          <div key={m} className="mp">
            <div className="row-h"><h3>{m}</h3><span className="sub">after {hh(MEAL_DUE[m])} · {fmt(kcal)} kcal</span></div>
            {items.map((x, i) => {
              const f = S.foodsById[x.food_id];
              if (!f) return null;
              return (
                <div className="li" key={x.food_id}>
                  {f.image_url ? <img className="thumb" src={f.image_url} alt="" /> : <IconTile name={f.icon || 'bowl'} size="sm" />}
                  <div className="grow"><div className="nm">{f.name}</div><div className="mt">{fmt(f.kcal * x.qty)} kcal</div></div>
                  <div className="stepper">
                    <button onClick={() => upd(m, x.qty <= 1 ? items.filter((_, j) => j !== i) : items.map((y, j) => (j === i ? { ...y, qty: y.qty - 1 } : y)))} aria-label="Less">−</button>
                    <span className="v">{x.qty}</span>
                    <button onClick={() => upd(m, items.map((y, j) => (j === i ? { ...y, qty: y.qty + 1 } : y)))} aria-label="More">+</button>
                  </div>
                </div>
              );
            })}
            <select aria-label={`Add to ${m}`} value="" onChange={(e) => e.target.value && upd(m, [...items, { food_id: e.target.value, qty: 1 }])}>
              <option value="">+ Add a food</option>
              {live.filter((f) => !items.some((x) => x.food_id === f.id)).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        );
      })}
      <button className="btn" onClick={async () => { await A.savePrefs({ meal_plan: plan }); toast('Default meals saved'); }}>Save default meals</button>
    </>
  );
}

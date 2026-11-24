// Protein, simply: regular meals are assumed (Settings → Targets), you only add the extras.
// Tap a card to add one serving; − takes one off.
import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Icon, IconTile } from '../components/Icons.jsx';
import { MBar, fmt } from '../components/ui.jsx';
import { mealNow } from '../lib/dates.js';

const BOOST = /protein|whey|egg|paneer|soya|chicken|tofu|greek|sprout|fish|tuna|milk/i;
export const isBoost = (f) => f.category === 'protein' || (f.category !== 'street' && f.protein >= 15 && BOOST.test(f.name));

export function ProteinPicker({ k: k0 }) {
  const { S, A, today, calc, open } = useStore();
  const k = k0 || today;
  const [more, setMore] = useState(false);
  const [qy, setQ] = useState('');
  const c = calc(k), t = S.targets;
  const live = S.foods.filter((f) => !f.archived);
  const boosts = live.filter(isBoost).sort((a, b) => b.protein - a.protein);
  const others = live.filter((f) => !isBoost(f) && (!qy.trim() || f.name.toLowerCase().includes(qy.trim().toLowerCase())))
    .sort((a, b) => b.protein - a.protein);
  const count = (id) => c.d.food.filter((f) => f.food_id === id && !f.is_default).reduce((a, f) => a + Number(f.qty), 0);
  const add = (f) => A.logFood(k, f.id, mealNow());
  const left = Math.max(0, c.pExtraTarget - c.proteinExtra);

  return (
    <div className="pp">
      <div className="pp-head">
        <div className="pp-big"><b>{fmt(c.protein)}</b><span>/ {t.protein} g today</span></div>
        <MBar v={c.protein / t.protein} />
        {c.pMode ? (
          <div className="pp-split">
            <span><i className="base" />Regular meals ~{fmt(c.pBase)} g</span>
            <span><i className="extra" />Added {fmt(c.proteinExtra)} / {fmt(c.pExtraTarget)} g</span>
          </div>
        ) : <p className="hint">Log everything you eat, or set "Protein from regular meals" in Settings to only log the extras.</p>}
        <p className="pp-msg">{left > 0 ? `${fmt(left)} g to go. A shake is 25 g.` : 'Protein done for today.'}</p>
      </div>

      <div className="fgrid sz-m pp-grid">{boosts.map((f) => {
        const n = count(f.id);
        return (
          <div key={f.id} className={`fcard${n ? ' on' : ''}`}>
            <button className="fmain" onClick={() => add(f)} aria-label={`Add ${f.name}`}>
              <span className={`fimg${f.image_url ? ' photo' : ''}`}>{f.image_url ? <img src={f.image_url} alt="" loading="lazy" /> : <IconTile name={f.icon || 'bowl'} size="lg" />}</span>
              <span className="fname">{f.name}</span>
              <span className="fnum pp-g">+{fmt(f.protein)} g</span>
            </button>
            {n > 0 && <><span className="fcount">×{n}</span>
              <button className="fminus" onClick={() => A.removeOneFood(k, f.id, mealNow())} aria-label={`Remove one ${f.name}`}>−</button></>}
          </div>
        );
      })}
        <button className="tile2 add pp-new" onClick={() => open('foodEdit', { category: 'protein' })}><span>+</span>New</button>
      </div>

      <button className="btn ghost sm" onClick={() => setMore((m) => !m)} aria-expanded={more}>{more ? 'Hide other foods' : 'Something else'}</button>
      {more && <>
        <input className="search" value={qy} onChange={(e) => setQ(e.target.value)} placeholder="Search foods" aria-label="Search foods" />
        <div className="list">{others.slice(0, 30).map((f) => (
          <div className="li" key={f.id}><IconTile name={f.icon || 'bowl'} size="sm" />
            <div className="grow"><div className="nm">{f.name}{count(f.id) ? <span className="qtag inl">×{count(f.id)}</span> : null}</div>
              <div className="mt">{f.serving} · {fmt(f.protein)} g protein</div></div>
            <button className="add1" onClick={() => add(f)} aria-label={`Add ${f.name}`}>+</button>
          </div>
        ))}</div>
      </>}
      {c.pMode && <button className="link pp-set" onClick={() => open('settings')}><Icon name="target" size={14} /> Change the regular-meal estimate</button>}
    </div>
  );
}

export default function ProteinSheet(props) {
  return <><h2>Protein</h2><ProteinPicker {...props} /></>;
}

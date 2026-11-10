// One card shape used across the app: a small vertical tile.
// Picture (or icon) is the identity, the number sits top-left, the label at the bottom.
import { useState } from 'react';
import { Icon } from './Icons.jsx';
import { progState } from './ui.jsx';

export function Tile({ img, icon = 'check', tone = 'slate', num, label, sub, p, badge, onClick, className = '', dim, light }) {
  const st = p == null ? '' : progState(p);
  return (
    <button className={`tile2 t-${tone} ${st}${img ? (light ? ' light-img' : ' has-img') : ''}${dim ? ' dim' : ''} ${className}`} onClick={onClick}>
      <span className="tl-media">{img ? <img src={img} alt="" loading="lazy" /> : <Icon name={icon} size={26} />}</span>
      {num != null && <span className="tl-num">{num}</span>}
      {badge != null && <span className="tl-badge">{badge}</span>}
      <span className="tl-foot">
        <span className="tl-l">{label}</span>
        {sub && <span className="tl-s">{sub}</span>}
      </span>
      {p != null && <span className={`tl-bar ${st}`}><i style={{ width: `${Math.max(0, Math.min(1, p)) * 100}%` }} /></span>}
    </button>
  );
}

export const TileGrid = ({ children, cols = 4 }) => <div className={`tgrid2 c${cols}`}>{children}</div>;

/** A Home section that folds open/closed; remembers your choice on this device. */
export function Sec({ id, title, icon, badge, right, summary, defaultOpen = true, className = '', children }) {
  const [open, setOpen] = useState(() => { try { const v = localStorage.getItem(`dh.sec.${id}`); return v === null ? defaultOpen : v === '1'; } catch { return defaultOpen; } });
  const toggle = () => setOpen((o) => { try { localStorage.setItem(`dh.sec.${id}`, o ? '0' : '1'); } catch { /* ignore */ } return !o; });
  return (
    <section className={`card sec2 ${open ? 'open' : 'shut'} ${className}`}>
      <div className="s2-h">
        <button className="s2-t" onClick={toggle} aria-expanded={open}>
          {icon && <Icon name={icon} size={16} />}<span>{title}</span>{badge}
          <svg className="chev" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {right}
      </div>
      {open ? children : summary ? <div className="s2-sum" onClick={toggle}>{summary}</div> : null}
    </section>
  );
}

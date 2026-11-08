import { useEffect, useRef } from 'react';
import { useStore } from '../store.jsx';

export const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const fmt = (n) => Math.round(n ?? 0).toLocaleString('en-IN');
export const clampPct = (v) => `${Math.max(0, Math.min(1, v || 0)) * 100}%`;

export function MBar({ v, cls = '' }) {
  return <div className={`mbar ${cls}`}><i style={{ width: clampPct(v) }} /></div>;
}

export function Field({ label, id, children }) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}</div>;
}

/** Bottom sheet: close with the ✕, by tapping outside, by swiping down, or with Escape. */
export function Sheet({ children }) {
  const { close } = useStore();
  const panel = useRef(null);
  const startY = useRef(null);
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', h);
    document.documentElement.classList.add('noscroll');
    return () => { document.removeEventListener('keydown', h); document.documentElement.classList.remove('noscroll'); };
  }, [close]);
  const onStart = (e) => { startY.current = panel.current.scrollTop <= 0 ? e.touches[0].clientY : null; };
  const onMove = (e) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) panel.current.style.transform = `translateY(${dy}px)`;
  };
  const onEnd = (e) => {
    if (startY.current == null) return;
    const dy = e.changedTouches[0].clientY - startY.current;
    startY.current = null;
    if (dy > 90) close(); else panel.current.style.transform = '';
  };
  return (
    <div className="sheet">
      <div className="scrim" onClick={close} />
      <div className="panel" ref={panel} role="dialog" aria-modal="true" onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
        <div className="grab" />
        <button className="sheet-x" onClick={close} aria-label="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        {children}
      </div>
    </div>
  );
}

export function Toast() {
  const { toastMsg } = useStore();
  return toastMsg ? <div className="toast" role="status">{toastMsg}</div> : null;
}

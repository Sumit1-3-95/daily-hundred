import { useEffect } from 'react';
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

export function Sheet({ children }) {
  const { close } = useStore();
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [close]);
  return (
    <div className="sheet">
      <div className="scrim" onClick={close} />
      <div className="panel" role="dialog" aria-modal="true"><div className="grab" />{children}</div>
    </div>
  );
}

export function Toast() {
  const { toastMsg } = useStore();
  return toastMsg ? <div className="toast" role="status">{toastMsg}</div> : null;
}

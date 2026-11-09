// Pick a photo from the phone (camera or library). Shows a preview; uploads on pick.
import { useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { IconTile } from './Icons.jsx';

export default function PhotoField({ value, onChange, icon = 'bowl', kind }) {
  const { A } = useStore();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="photo-field">
      <button type="button" className="pf-img" onClick={() => input.current?.click()} aria-label="Choose a photo">
        {value ? <img src={value} alt="" /> : <IconTile name={icon} size="lg" />}
        <span className="pf-badge">{busy ? '…' : value ? 'Change' : 'Add photo'}</span>
      </button>
      {value && <button type="button" className="link" onClick={() => onChange(null)}>Remove photo</button>}
      <input ref={input} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]; e.target.value = '';
        if (!f) return;
        setBusy(true);
        try { onChange(await A.uploadPhoto(f, kind)); } catch { /* toast shown */ } finally { setBusy(false); }
      }} />
    </div>
  );
}

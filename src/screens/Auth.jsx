import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { checkPin, clearPin, setPin } from '../lib/pin.js';

const Logo = () => (
  <svg className="logo" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="17" fill="none" stroke="var(--r1)" strokeWidth="4.5" />
    <circle cx="20" cy="20" r="11" fill="none" stroke="var(--r2)" strokeWidth="4.5" />
    <circle cx="20" cy="20" r="5" fill="none" stroke="var(--r3)" strokeWidth="4.5" />
  </svg>
);

export function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const send = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) setErr(error.message.includes('invited') ? 'This email has not been invited yet.' : error.message);
    else setStep('code');
  };
  const verify = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) setErr('That code did not work. Check the latest email or send a new code.');
  };
  return (
    <div className="center"><div className="auth">
      <Logo />
      <h1>Daily Hundred</h1>
      {step === 'email' ? (
        <form onSubmit={send}>
          <p className="hint">Sign in with your email once on this device. After that you unlock with a PIN.</p>
          <div className="field"><label htmlFor="em">Email</label>
            <input id="em" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p className="hint">We sent a 6-digit code to <b>{email}</b>. You can also tap the link in that email.</p>
          <div className="field"><label htmlFor="cd">Code</label>
            <input id="cd" inputMode="numeric" autoComplete="one-time-code" maxLength={10} required value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <button className="btn" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
          <button type="button" className="btn ghost" onClick={() => { setStep('email'); setCode(''); }}>Use a different email</button>
        </form>
      )}
      {err && <p className="err">{err}</p>}
    </div></div>
  );
}

function Keypad({ value, onChange, len = 4, extra }) {
  const press = (d) => value.length < len && onChange(value + d);
  return (
    <>
      <div className="pin-dots" aria-label={`${value.length} of ${len} digits entered`}>
        {Array.from({ length: len }, (_, i) => <i key={i} className={i < value.length ? 'on' : ''} />)}
      </div>
      <div className="keypad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => <button key={d} onClick={() => press(String(d))}>{d}</button>)}
        {extra || <span />}
        <button onClick={() => press('0')}>0</button>
        <button className="txt" onClick={() => onChange(value.slice(0, -1))} aria-label="Delete digit">Delete</button>
      </div>
    </>
  );
}

export function SetPin({ uid, onDone }) {
  const [first, setFirst] = useState(null);
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const change = async (nv) => {
    setV(nv); setErr('');
    if (nv.length < 4) return;
    if (first == null) { setFirst(nv); setV(''); return; }
    if (nv !== first) { setErr('PINs did not match. Try again.'); setFirst(null); setV(''); return; }
    await setPin(uid, nv); onDone();
  };
  return (
    <div className="center"><div className="auth">
      <Logo />
      <h1>{first == null ? 'Choose a PIN' : 'Enter it again'}</h1>
      <p className="hint">A 4-digit PIN unlocks the app on this device.</p>
      <Keypad value={v} onChange={change} />
      {err && <p className="err">{err}</p>}
    </div></div>
  );
}

export function PinLock({ uid, onUnlock }) {
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const change = async (nv) => {
    setV(nv); setErr('');
    if (nv.length < 4) return;
    const r = await checkPin(uid, nv);
    if (r.ok) { onUnlock(); return; }
    setV('');
    if (r.fails >= 5) { clearPin(); await supabase.auth.signOut(); return; }
    setErr(`Wrong PIN. ${5 - r.fails} tries left before you need to sign in with email again.`);
  };
  return (
    <div className="lock"><div className="center"><div className="auth">
      <Logo />
      <h1>Welcome back</h1>
      <Keypad value={v} onChange={change}
        extra={<button className="txt" onClick={async () => { clearPin(); await supabase.auth.signOut(); }}>Forgot</button>} />
      {err && <p className="err">{err}</p>}
    </div></div></div>
  );
}

export function NotConfigured() {
  return (
    <div className="center"><div className="auth">
      <Logo /><h1>Almost there</h1>
      <p className="hint">Add <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> to a <b>.env</b> file (or to Vercel's environment variables), then restart. See the README.</p>
    </div></div>
  );
}

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
  const [mode, setMode] = useState('pin'); // pin | new | code
  const [email, setEmail] = useState('');
  const [pin, setPinV] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async (fn) => { setBusy(true); setErr(''); try { await fn(); } catch (e) { setErr(e.message); } setBusy(false); };
  const pinOk = /^\d{6}$/.test(pin);

  const signIn = (e) => { e.preventDefault(); run(async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pin });
    if (error) throw new Error(error.message.includes('Invalid') ? 'Email or PIN is wrong.' : error.message);
  }); };
  const signUp = (e) => { e.preventDefault(); run(async () => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pin });
    if (error) throw new Error(error.message.includes('invited') ? 'This email has not been invited yet.' : error.message);
    if (!data.session) throw new Error('Account created. Turn off "Confirm email" in Supabase to sign in without an email.');
  }); };
  const sendCode = (e) => { e.preventDefault(); run(async () => {
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false, emailRedirectTo: window.location.origin } });
    if (error) throw error; setSent(true);
  }); };
  const verify = (e) => { e.preventDefault(); run(async () => {
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
    if (error) throw error;
  }); };

  const emailField = <div className="field"><label htmlFor="em">Email</label>
    <input id="em" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>;
  const pinField = <div className="field"><label htmlFor="pn">{mode === 'new' ? 'Choose a 6-digit PIN' : '6-digit PIN'}</label>
    <input id="pn" type="password" inputMode="numeric" autoComplete={mode === 'new' ? 'new-password' : 'current-password'} maxLength={6} required
      value={pin} onChange={(e) => setPinV(e.target.value.replace(/\D/g, ''))} /></div>;

  return (
    <div className="center"><div className="auth">
      <Logo />
      <h1>Daily Hundred</h1>
      {mode === 'pin' && <form onSubmit={signIn}>
        {emailField}{pinField}
        <button className="btn" disabled={busy || !pinOk}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" className="btn ghost" onClick={() => { setMode('new'); setErr(''); }}>First time here? Create your account</button>
        <button type="button" className="link" onClick={() => { setMode('code'); setErr(''); }}>Forgot PIN? Sign in with an email code</button>
      </form>}
      {mode === 'new' && <form onSubmit={signUp}>
        <p className="hint">Use the email you were invited with.</p>
        {emailField}{pinField}
        <button className="btn" disabled={busy || !pinOk}>{busy ? 'Creating…' : 'Create account'}</button>
        <button type="button" className="link" onClick={() => setMode('pin')}>I already have an account</button>
      </form>}
      {mode === 'code' && (!sent
        ? <form onSubmit={sendCode}>{emailField}<button className="btn" disabled={busy}>Email me a code</button>
            <button type="button" className="link" onClick={() => setMode('pin')}>Back to PIN sign-in</button></form>
        : <form onSubmit={verify}>
            <p className="hint">Enter the code sent to <b>{email}</b>. Then set a new PIN in Settings → Account.</p>
            <div className="field"><label htmlFor="cd">Code</label>
              <input id="cd" inputMode="numeric" autoComplete="one-time-code" maxLength={10} required value={code} onChange={(e) => setCode(e.target.value)} /></div>
            <button className="btn" disabled={busy}>Sign in</button></form>)}
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

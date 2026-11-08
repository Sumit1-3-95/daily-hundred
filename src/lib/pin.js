// Device PIN: a quick unlock on top of the real Supabase session.
// The PIN never leaves the device; only a salted SHA-256 hash is kept in localStorage.
const K = 'dh.pin';
const LOCK_AFTER_MS = 5 * 60 * 1000;

const read = () => { try { return JSON.parse(localStorage.getItem(K)); } catch { return null; } };
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
async function hash(salt, pin) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`)));
}

export const hasPin = (uid) => read()?.uid === uid;
export async function setPin(uid, pin) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  try { localStorage.setItem(K, JSON.stringify({ uid, salt, hash: await hash(salt, pin), fails: 0 })); } catch { /* storage blocked */ }
}
export async function checkPin(uid, pin) {
  const p = read();
  if (!p || p.uid !== uid) return { ok: false, fails: 0 };
  const ok = (await hash(p.salt, pin)) === p.hash;
  p.fails = ok ? 0 : (p.fails || 0) + 1;
  try { localStorage.setItem(K, JSON.stringify(p)); } catch { /* ignore */ }
  return { ok, fails: p.fails };
}
export const clearPin = () => { try { localStorage.removeItem(K); } catch { /* ignore */ } };

let hiddenAt = 0;
/** Calls onLock when the app comes back after being in the background for 5+ minutes. */
export function watchLock(onLock) {
  const h = () => {
    if (document.visibilityState === 'hidden') hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt > LOCK_AFTER_MS) onLock();
  };
  document.addEventListener('visibilitychange', h);
  return () => document.removeEventListener('visibilitychange', h);
}

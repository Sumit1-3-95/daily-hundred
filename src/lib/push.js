const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function b64ToBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function pushSupport() {
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { ok: false, reason: ios && !standalone
      ? 'On iPhone, add the app to your Home Screen first (Share → Add to Home Screen), then open it from there.'
      : 'This browser does not support push notifications.' };
  }
  if (!VAPID) return { ok: false, reason: 'Push is not configured yet (VITE_VAPID_PUBLIC_KEY is missing).' };
  return { ok: true, permission: Notification.permission };
}

export async function subscribePush() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications were not allowed. You can turn them on in iPhone Settings → Notifications.');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID) }));
  const j = sub.toJSON();
  return { endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent.slice(0, 200) };
}

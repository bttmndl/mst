// Tiny id helper (avoids pulling nanoid into the client bundle).
export function uid(len = 10) {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += a[(Math.random() * a.length) | 0];
  return s;
}

export function normalizeRoom(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

// Best-effort device label from the user-agent. Real devices don't expose
// a clean model name to the web, so this is a friendly approximation.
export function detectDevice() {
  const ua = navigator.userAgent;
  let platform = 'Device';
  if (/iPhone/.test(ua)) platform = 'iPhone';
  else if (/iPad/.test(ua)) platform = 'iPad';
  else if (/Pixel/.test(ua)) platform = 'Pixel';
  else if (/SM-|Samsung/.test(ua)) platform = 'Galaxy';
  else if (/Android/.test(ua)) platform = 'Android';
  else if (/Macintosh/.test(ua)) platform = 'Mac';
  else if (/Windows/.test(ua)) platform = 'Windows';
  else if (/Linux/.test(ua)) platform = 'Linux';

  const emoji = /iPhone|iPad|Pixel|Galaxy|Android/.test(ua) ? '📱' : '💻';
  return { platform, emoji, name: platform };
}

// Battery Level (Battery Status API — Chromium only; resolves null elsewhere).
export async function readBattery() {
  try {
    if (navigator.getBattery) {
      const b = await navigator.getBattery();
      return Math.round(b.level * 100);
    }
  } catch {
    /* unsupported */
  }
  return null;
}

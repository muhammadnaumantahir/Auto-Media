// Some platforms (YouTube, so far) split credentials into two levels:
//   - App-level: one Google Cloud OAuth Client ID/Secret, configured once,
//     shared by every user.
//   - Per-user: each user's own refresh token + channel ID (see
//     saveConnector in firestore.js).
// This file stores the app-level half, keyed by platform id, in its own
// localStorage slot so it's clearly separate from any one user's data.

const KEY = 'automedia_platform_apps_v1';
const event = 'automedia:platform-apps-changed';

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(event));
}

export function getPlatformApp(platformId) {
  return read()[platformId] || null;
}

export async function savePlatformApp(platformId, fields) {
  const data = read();
  data[platformId] = { ...fields, updatedAt: new Date().toISOString() };
  write(data);
  return data[platformId];
}

export function watchPlatformApp(platformId, callback) {
  const emit = () => callback(read()[platformId] || null);
  emit();
  window.addEventListener(event, emit);
  window.addEventListener('storage', emit);
  return () => {
    window.removeEventListener(event, emit);
    window.removeEventListener('storage', emit);
  };
}

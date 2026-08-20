const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Everything the app needs to run (Google service account, master sheet id,
// platform API credentials) lives here instead of environment variables, so
// it can all be entered from the Settings page in the UI.
//
// NOTE: this file lives on local disk. On platforms with an ephemeral
// filesystem (e.g. Railway without a mounted Volume), it will be wiped on
// every redeploy — attach a persistent Volume at DATA_DIR to survive that.

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'app-settings.json');

const ALGORITHM = 'aes-256-cbc';
const PLATFORM_KEYS = ['youtube', 'facebook', 'snapchat', 'tiktok'];

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    const initial = {
      // Generated once and stored locally so secrets below can be encrypted
      // at rest without requiring an env var to bootstrap.
      encryptionKey: crypto.randomBytes(32).toString('hex').slice(0, 32),
      googleServiceAccountEmail: '',
      googleServiceAccountPrivateKey: '', // encrypted
      masterSheetId: '',
      platformCredentials: {}, // { youtube: { clientId, clientSecret (encrypted) }, ... }
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(initial, null, 2));
  }
}

function readRaw() {
  ensureFile();
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
}

function writeRaw(data) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

function encrypt(text, key) {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'utf8'), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(payload, key) {
  if (!payload) return '';
  const [ivHex, dataHex] = String(payload).split(':');
  if (!ivHex || !dataHex) return '';
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, 'utf8'), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Full settings, secrets decrypted. Only for internal server-side use. */
function getSettings() {
  const raw = readRaw();
  const platformCredentials = {};
  for (const [platform, creds] of Object.entries(raw.platformCredentials || {})) {
    platformCredentials[platform] = {
      clientId: creds.clientId || '',
      clientSecret: decrypt(creds.clientSecret, raw.encryptionKey),
    };
  }
  return {
    googleServiceAccountEmail: raw.googleServiceAccountEmail || '',
    googleServiceAccountPrivateKey: decrypt(raw.googleServiceAccountPrivateKey, raw.encryptionKey),
    masterSheetId: raw.masterSheetId || '',
    platformCredentials,
  };
}

/** Safe-for-frontend view: never returns raw secrets, just whether they're set. */
function getPublicSettings() {
  const s = getSettings();
  const platforms = {};
  for (const key of PLATFORM_KEYS) {
    const creds = s.platformCredentials[key] || {};
    platforms[key] = {
      clientId: creds.clientId || '',
      hasClientSecret: Boolean(creds.clientSecret),
    };
  }
  return {
    googleServiceAccountEmail: s.googleServiceAccountEmail,
    hasGoogleServiceAccountKey: Boolean(s.googleServiceAccountPrivateKey),
    masterSheetId: s.masterSheetId,
    platformCredentials: platforms,
    isGoogleConfigured: Boolean(
      s.googleServiceAccountEmail && s.googleServiceAccountPrivateKey && s.masterSheetId
    ),
  };
}

/**
 * Updates settings. Pass only the fields you want to change.
 * updates.platformCredentials, if present, is a partial map merged per-platform.
 */
function updateSettings(updates) {
  const raw = readRaw();

  if (updates.googleServiceAccountEmail !== undefined) {
    raw.googleServiceAccountEmail = updates.googleServiceAccountEmail;
  }
  if (updates.googleServiceAccountPrivateKey !== undefined && updates.googleServiceAccountPrivateKey) {
    raw.googleServiceAccountPrivateKey = encrypt(
      updates.googleServiceAccountPrivateKey.replace(/\\n/g, '\n'),
      raw.encryptionKey
    );
  }
  if (updates.masterSheetId !== undefined) {
    raw.masterSheetId = updates.masterSheetId;
  }
  if (updates.platformCredentials) {
    raw.platformCredentials = raw.platformCredentials || {};
    for (const [platform, creds] of Object.entries(updates.platformCredentials)) {
      if (!PLATFORM_KEYS.includes(platform)) continue;
      const existing = raw.platformCredentials[platform] || {};
      raw.platformCredentials[platform] = {
        clientId: creds.clientId !== undefined ? creds.clientId : existing.clientId || '',
        clientSecret:
          creds.clientSecret !== undefined && creds.clientSecret
            ? encrypt(creds.clientSecret, raw.encryptionKey)
            : existing.clientSecret || '',
      };
    }
  }

  writeRaw(raw);
  return getPublicSettings();
}

/** Internal: exposes the auto-generated key so crypto.js can reuse it. */
function _getEncryptionKey() {
  return readRaw().encryptionKey;
}

module.exports = {
  getSettings,
  getPublicSettings,
  updateSettings,
  PLATFORM_KEYS,
  _getEncryptionKey,
};

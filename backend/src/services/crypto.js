const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

// Falls back to the same auto-generated key used by settingsStore.js so
// nothing here requires a manually-set env var. TOKEN_ENCRYPTION_KEY still
// works if you prefer to set it explicitly.
function getKey() {
  const envKey = process.env.TOKEN_ENCRYPTION_KEY || '';
  if (envKey) {
    if (envKey.length !== 32) {
      throw new Error('TOKEN_ENCRYPTION_KEY must be exactly 32 characters');
    }
    return Buffer.from(envKey, 'utf8');
  }

  // Lazy require to avoid a require-cycle at module load time.
  const settingsStore = require('./settingsStore');
  const key = settingsStore._getEncryptionKey();
  return Buffer.from(key, 'utf8');
}

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(payload) {
  if (!payload) return '';
  const [ivHex, dataHex] = payload.split(':');
  if (!ivHex || !dataHex) return '';
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };

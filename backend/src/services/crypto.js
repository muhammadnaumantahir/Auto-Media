const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

function getKey() {
  const key = process.env.TOKEN_ENCRYPTION_KEY || '';
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be exactly 32 characters');
  }
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

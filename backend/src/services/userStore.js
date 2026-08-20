const { v4: uuidv4 } = require('uuid');
const { loadSheet } = require('../config/googleSheetsClient');
const { encrypt, decrypt } = require('./crypto');

const SHEET_TITLE = 'Users';

// Columns in the master "Users" sheet. platform_tokens and video_sheet
// config are stored as JSON strings (tokens encrypted before stringifying).
const HEADERS = [
  'id',
  'email',
  'password_hash',
  'google_id',
  'first_name',
  'last_name',
  'video_sheet_id',
  'video_sheet_url',
  'column_mapping', // JSON: { videoLink, title, description, status, platforms }
  'platform_tokens', // JSON: { youtube: {access,refresh}, facebook: {...}, ... } (values encrypted)
  'created_at',
];

async function getUsersSheet() {
  const doc = await loadSheet(process.env.MASTER_SHEET_ID);
  let sheet = doc.sheetsByTitle[SHEET_TITLE];
  if (!sheet) {
    sheet = await doc.addSheet({ title: SHEET_TITLE, headerValues: HEADERS });
  }
  return sheet;
}

function rowToUser(row) {
  if (!row) return null;
  let columnMapping = {};
  let platformTokensRaw = {};
  try {
    columnMapping = row.get('column_mapping') ? JSON.parse(row.get('column_mapping')) : {};
  } catch (_) {}
  try {
    platformTokensRaw = row.get('platform_tokens') ? JSON.parse(row.get('platform_tokens')) : {};
  } catch (_) {}

  // Decrypt each stored platform's tokens for in-memory use
  const platformTokens = {};
  for (const [platform, tokens] of Object.entries(platformTokensRaw)) {
    platformTokens[platform] = {
      accessToken: decrypt(tokens.accessToken),
      refreshToken: decrypt(tokens.refreshToken),
      accountName: tokens.accountName || '',
    };
  }

  return {
    id: row.get('id'),
    email: row.get('email'),
    passwordHash: row.get('password_hash'),
    googleId: row.get('google_id'),
    firstName: row.get('first_name'),
    lastName: row.get('last_name'),
    videoSheetId: row.get('video_sheet_id'),
    videoSheetUrl: row.get('video_sheet_url'),
    columnMapping,
    platformTokens,
    createdAt: row.get('created_at'),
    _row: row, // keep reference for updates
  };
}

async function findByEmail(email) {
  const sheet = await getUsersSheet();
  const rows = await sheet.getRows();
  const row = rows.find((r) => (r.get('email') || '').toLowerCase() === email.toLowerCase());
  return rowToUser(row);
}

async function findById(id) {
  const sheet = await getUsersSheet();
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('id') === id);
  return rowToUser(row);
}

async function findByGoogleId(googleId) {
  const sheet = await getUsersSheet();
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('google_id') === googleId);
  return rowToUser(row);
}

async function createUser({ email, passwordHash, googleId, firstName, lastName }) {
  const sheet = await getUsersSheet();
  const id = uuidv4();
  await sheet.addRow({
    id,
    email,
    password_hash: passwordHash || '',
    google_id: googleId || '',
    first_name: firstName || '',
    last_name: lastName || '',
    video_sheet_id: '',
    video_sheet_url: '',
    column_mapping: '{}',
    platform_tokens: '{}',
    created_at: new Date().toISOString(),
  });
  return findById(id);
}

/**
 * Updates arbitrary fields on a user's row. Pass plain values for simple
 * fields, or `columnMapping` (object) / `platformTokens` (object, plain
 * tokens - will be encrypted here) for the JSON columns.
 */
async function updateUser(id, updates) {
  const sheet = await getUsersSheet();
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('id') === id);
  if (!row) throw new Error('User not found');

  if (updates.videoSheetId !== undefined) row.set('video_sheet_id', updates.videoSheetId);
  if (updates.videoSheetUrl !== undefined) row.set('video_sheet_url', updates.videoSheetUrl);
  if (updates.columnMapping !== undefined) {
    row.set('column_mapping', JSON.stringify(updates.columnMapping));
  }
  if (updates.platformTokens !== undefined) {
    const encrypted = {};
    for (const [platform, tokens] of Object.entries(updates.platformTokens)) {
      encrypted[platform] = {
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
        accountName: tokens.accountName || '',
      };
    }
    row.set('platform_tokens', JSON.stringify(encrypted));
  }

  await row.save();
  return findById(id);
}

module.exports = { findByEmail, findById, findByGoogleId, createUser, updateUser };

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const settingsStore = require('../services/settingsStore');

/**
 * Returns an authenticated JWT client for the Google service account.
 * This same identity is used to read/write the master Users sheet and,
 * once a user shares their own video sheet with it, that sheet too.
 *
 * Credentials are read from the Settings page (settingsStore) first,
 * falling back to env vars for anyone who prefers configuring it that way.
 */
function getServiceAccountAuth() {
  const settings = settingsStore.getSettings();
  const email = settings.googleServiceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (
    settings.googleServiceAccountPrivateKey ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    ''
  ).replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error(
      'Google Sheets is not configured yet. Go to Settings in the app and add your service account email and private key.'
    );
  }

  return new JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

/**
 * Loads a Google Sheet document by ID, ready for reading/writing rows.
 */
async function loadSheet(sheetId) {
  const auth = getServiceAccountAuth();
  const doc = new GoogleSpreadsheet(sheetId, auth);
  await doc.loadInfo();
  return doc;
}

module.exports = { getServiceAccountAuth, loadSheet };

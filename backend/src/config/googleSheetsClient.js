const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

/**
 * Returns an authenticated JWT client for the Google service account.
 * This same identity is used to read/write the master Users sheet and,
 * once a user shares their own video sheet with it, that sheet too.
 */
function getServiceAccountAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error(
      'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in .env'
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

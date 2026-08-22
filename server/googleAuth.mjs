import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';

// Signs a JWT and exchanges it for an access token using a Google service
// account (email + private key from server/.env). Used only for Sheets
// read/write — YouTube uploads use each user's own refresh token instead
// (see youtube.mjs), since a service account can't post as someone's
// channel.
let cached = null; // { token, expiresAt }

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function signJwt({ email, privateKey }) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = base64url(signer.sign(privateKey));
  return `${header}.${payload}.${signature}`;
}

export async function getSheetsAccessToken() {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;

  if (!privateKey && keyFile) {
    const json = JSON.parse(readFileSync(keyFile, 'utf8'));
    privateKey = json.private_key;
  }
  if (!email || !privateKey) {
    throw new Error(
      'Sheet reading/writing needs GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (or GOOGLE_SERVICE_ACCOUNT_KEY_FILE) in server/.env'
    );
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  const assertion = signJwt({ email, privateKey });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.error_description || data.error || 'Could not authenticate the service account.'
    );
  }

  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cached.token;
}

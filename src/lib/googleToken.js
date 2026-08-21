// Turns a long-lived refresh token into a fresh ~1-hour access token.
// Called right before each upload, so we never store an access token that
// could go stale.
export async function getGoogleAccessToken({ clientId, clientSecret, refreshToken }) {
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Client ID, Client secret, or refresh token.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data.error_description ||
        data.error ||
        'Google rejected the refresh token — it may have been revoked. Generate a new one in OAuth Playground.'
    );
  }
  return data.access_token;
}

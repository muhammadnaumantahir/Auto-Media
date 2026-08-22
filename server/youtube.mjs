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

export async function uploadVideoToYoutube({ accessToken, buffer, contentType, title, description, tags }) {
  const metadata = {
    snippet: {
      title: (title || 'Untitled').slice(0, 100),
      description: description || '',
      tags: (tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    },
    status: { privacyStatus: 'public' },
  };

  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': contentType || 'video/*',
        'X-Upload-Content-Length': String(buffer.length),
      },
      body: JSON.stringify(metadata),
    }
  );
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'YouTube rejected the upload request.');
  }

  const uploadUrl = initRes.headers.get('location');
  if (!uploadUrl) throw new Error('YouTube did not return an upload session URL.');

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType || 'video/*' },
    body: buffer,
  });
  const result = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(result.error?.message || 'The video upload failed partway through.');
  }

  return { videoId: result.id, url: `https://www.youtube.com/watch?v=${result.id}` };
}

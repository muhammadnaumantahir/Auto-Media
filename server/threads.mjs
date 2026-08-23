// Threads' API is a separate Meta product from Instagram's Graph API
// (different host, different token/scope), but the same fundamental
// constraint applies: it fetches the video itself from a URL rather than
// accepting uploaded bytes, so this can't post from the local video
// folder either - see instagram.mjs for the same tradeoff in more detail.

async function createContainer({ threadsUserId, accessToken, videoUrl, text }) {
  const url = `https://graph.threads.net/v1.0/${threadsUserId}/threads`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      media_type: 'VIDEO',
      video_url: videoUrl,
      text: text || '',
      access_token: accessToken,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Threads rejected the video container.');
  }
  return data.id;
}

async function waitForContainer({ creationId, accessToken, attempts = 20, delayMs = 5000 }) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(
      `https://graph.threads.net/v1.0/${creationId}?fields=status,error_message&access_token=${accessToken}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Could not check Threads processing status.');
    if (data.status === 'FINISHED') return;
    if (data.status === 'ERROR') {
      throw new Error(
        data.error_message ||
          'Threads failed to process the video - if this is a Google Drive link, the file may be too large for Threads to fetch directly.'
      );
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error('Threads is still processing the video after waiting — try again shortly.');
}

async function publishContainer({ threadsUserId, accessToken, creationId }) {
  const url = `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: creationId, access_token: accessToken }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Threads rejected publishing the container.');
  }
  return data.id;
}

async function getPermalink({ mediaId, accessToken }) {
  const res = await fetch(
    `https://graph.threads.net/v1.0/${mediaId}?fields=permalink&access_token=${accessToken}`
  );
  const data = await res.json().catch(() => ({}));
  return res.ok ? data.permalink : null;
}

export async function postVideoToThreads({ threadsUserId, accessToken, videoUrl, text }) {
  if (!threadsUserId || !accessToken) {
    throw new Error('Threads needs a Threads User ID and an access token.');
  }
  if (!videoUrl) {
    throw new Error('Threads needs a public video URL for this row.');
  }

  const creationId = await createContainer({ threadsUserId, accessToken, videoUrl, text });
  await waitForContainer({ creationId, accessToken });
  const mediaId = await publishContainer({ threadsUserId, accessToken, creationId });
  const permalink = await getPermalink({ mediaId, accessToken });

  return { url: permalink || null, mediaId };
}

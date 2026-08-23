import { oauth1Header } from './oauth1.mjs';

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB, within X's recommended range

function authHeader({ method, url, params, creds }) {
  return oauth1Header({
    method,
    url,
    params,
    consumerKey: creds.apiKey,
    consumerSecret: creds.apiSecret,
    token: creds.accessToken,
    tokenSecret: creds.accessTokenSecret,
  });
}

async function initUpload({ creds, totalBytes }) {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  const params = { command: 'INIT', total_bytes: String(totalBytes), media_type: 'video/mp4', media_category: 'tweet_video' };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader({ method: 'POST', url, params, creds }),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0]?.message || 'X rejected the upload (INIT).');
  return data.media_id_string;
}

async function appendChunk({ creds, mediaId, chunk, segmentIndex }) {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  // Per OAuth 1.0a with multipart bodies, only the non-file fields are
  // part of the signature - the binary chunk itself is never included.
  const signedParams = { command: 'APPEND', media_id: mediaId, segment_index: String(segmentIndex) };

  const form = new FormData();
  Object.entries(signedParams).forEach(([k, v]) => form.append(k, v));
  form.append('media', new Blob([chunk]), 'chunk');

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authHeader({ method: 'POST', url, params: signedParams, creds }) },
    body: form,
  });
  if (res.status !== 204 && !res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.errors?.[0]?.message || `X rejected chunk ${segmentIndex}.`);
  }
}

async function finalizeUpload({ creds, mediaId }) {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  const params = { command: 'FINALIZE', media_id: mediaId };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader({ method: 'POST', url, params, creds }),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0]?.message || 'X rejected the upload (FINALIZE).');
  return data;
}

async function waitForProcessing({ creds, mediaId, attempts = 20 }) {
  for (let i = 0; i < attempts; i++) {
    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    const params = { command: 'STATUS', media_id: mediaId };
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${url}?${query}`, {
      headers: { Authorization: authHeader({ method: 'GET', url, params, creds }) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.message || 'Could not check X processing status.');

    const info = data.processing_info;
    if (!info || info.state === 'succeeded') return;
    if (info.state === 'failed') throw new Error(info.error?.message || 'X failed to process the video.');
    await new Promise((r) => setTimeout(r, (info.check_after_secs || 3) * 1000));
  }
  throw new Error('X is still processing the video after waiting — try again shortly.');
}

async function createTweet({ creds, mediaId, text }) {
  const url = 'https://api.x.com/2/tweets';
  // A JSON body has no OAuth-signed params of its own - only the URL
  // itself is part of the signature here.
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: authHeader({ method: 'POST', url, params: {}, creds }),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: (text || '').slice(0, 280), media: { media_ids: [mediaId] } }),
  });
  const data = await res.json();
  if (!res.ok || data.errors) {
    throw new Error(data.errors?.[0]?.message || data.detail || 'X rejected the tweet.');
  }
  return data.data;
}

export async function postVideoToX({ apiKey, apiSecret, accessToken, accessTokenSecret, buffer, text }) {
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error('X needs an API key, API secret, access token, and access token secret.');
  }
  const creds = { apiKey, apiSecret, accessToken, accessTokenSecret };

  const mediaId = await initUpload({ creds, totalBytes: buffer.length });

  for (let offset = 0, segment = 0; offset < buffer.length; offset += CHUNK_SIZE, segment++) {
    await appendChunk({ creds, mediaId, chunk: buffer.subarray(offset, offset + CHUNK_SIZE), segmentIndex: segment });
  }

  const finalized = await finalizeUpload({ creds, mediaId });
  if (finalized.processing_info) {
    await waitForProcessing({ creds, mediaId });
  }

  const tweet = await createTweet({ creds, mediaId, text });
  return { url: `https://x.com/i/status/${tweet.id}`, tweetId: tweet.id };
}

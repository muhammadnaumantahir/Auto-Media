// Portable video source adapter.
// Browser-safe sources (direct URLs / Google Drive) are fetched directly.
// Sources that browsers cannot fetch because of CORS (e.g. YouTube) are
// delegated to a configurable server endpoint. The endpoint can be a local
// Node service, a Cloudflare Pages Function, or any compatible HTTPS service.

function extractDriveId(url) {
  const patterns = [/\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function driveDownloadUrl(fileId, confirmToken) {
  const base = `https://drive.google.com/uc?export=download&id=${fileId}`;
  return confirmToken ? `${base}&confirm=${confirmToken}` : base;
}

export function isYouTubeUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be' || host.endsWith('.youtu.be');
  } catch {
    return false;
  }
}

function configuredProxyUrl() {
  // Explicit VITE_VIDEO_PROXY_URL wins. Otherwise use the same-origin API,
  // which is ideal for Cloudflare Pages Functions and other edge hosts.
  return (import.meta.env.VITE_VIDEO_PROXY_URL || '/api/video').replace(/\/$/, '');
}

async function fetchViaVideoProxy(videoUrl) {
  const proxyUrl = configuredProxyUrl();
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: videoUrl }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = '';
    try { message = JSON.parse(text).error || ''; } catch { /* plain text */ }
    throw new Error(message || `Video server returned HTTP ${res.status}.`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (!data.url) throw new Error(data.error || 'Video server did not return a video URL.');
    const direct = await fetch(data.url);
    if (!direct.ok) throw new Error(`Could not download the resolved video (HTTP ${direct.status}).`);
    const blob = await direct.blob();
    if (blob.type.includes('text/html')) throw new Error('The video server returned a web page instead of a video.');
    return blob;
  }

  const blob = await res.blob();
  if (blob.type.includes('text/html')) throw new Error('The video server returned a web page instead of a video.');
  return blob;
}

/**
 * Fetches a video as a Blob.
 *
 * YouTube is deliberately sent to a server adapter because browsers cannot
 * fetch youtube.com pages/video bytes cross-origin. This keeps the same React
 * app deployable on localhost, Cloudflare Pages, Vercel, etc.
 */
export async function fetchVideoBlob(videoUrl) {
  if (!videoUrl) throw new Error('This row has no video link.');

  if (isYouTubeUrl(videoUrl)) {
    return fetchViaVideoProxy(videoUrl);
  }

  const driveId = extractDriveId(videoUrl);
  const targetUrl = driveId ? driveDownloadUrl(driveId) : videoUrl;

  let res = await fetch(targetUrl);
  let blob = await res.blob();

  if (driveId && blob.type.includes('text/html')) {
    const text = await blob.text();
    const confirmMatch = text.match(/confirm=([0-9A-Za-z_-]+)/);
    if (confirmMatch) {
      res = await fetch(driveDownloadUrl(driveId, confirmMatch[1]));
      blob = await res.blob();
    }
  }

  if (!res.ok || blob.type.includes('text/html')) {
    throw new Error(
      'Could not download the video. Make sure it is shared as "Anyone with the link", or use a direct video URL instead of a Google Drive link.'
    );
  }

  return blob;
}

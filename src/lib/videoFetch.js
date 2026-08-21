// Video links from a sheet are usually either a direct video URL or a
// Google Drive "share" link. This normalizes the latter into a direct
// download link and fetches the bytes either way.

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

/**
 * Fetches a video as a Blob from either a direct URL or a Google Drive
 * share link. Throws a descriptive error if the file isn't reachable —
 * most commonly because it isn't shared as "Anyone with the link" or is
 * large enough that Drive shows a virus-scan warning page instead of the
 * file (we make one attempt to work around that, but very large files may
 * still need to be hosted somewhere with a plain direct-download URL).
 */
export async function fetchVideoBlob(videoUrl) {
  if (!videoUrl) throw new Error('This row has no video link.');

  const driveId = extractDriveId(videoUrl);
  const targetUrl = driveId ? driveDownloadUrl(driveId) : videoUrl;

  let res = await fetch(targetUrl);
  let blob = await res.blob();

  // Drive shows an HTML "can't scan this file for viruses" page for large
  // files instead of the video itself. Try to pull the confirm token out
  // of that page and retry once.
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

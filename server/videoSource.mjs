import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

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

async function fetchFromUrl(url) {
  const driveId = extractDriveId(url);
  const targetUrl = driveId ? driveDownloadUrl(driveId) : url;

  let res = await fetch(targetUrl);
  let contentType = res.headers.get('content-type') || '';
  let buffer = Buffer.from(await res.arrayBuffer());

  // Drive shows an HTML "can't scan for viruses" page for large files
  // instead of the file itself. Try to pull the confirm token out of that
  // page and retry once.
  if (driveId && contentType.includes('text/html')) {
    const text = buffer.toString('utf8');
    const confirmMatch = text.match(/confirm=([0-9A-Za-z_-]+)/);
    if (confirmMatch) {
      res = await fetch(driveDownloadUrl(driveId, confirmMatch[1]));
      contentType = res.headers.get('content-type') || '';
      buffer = Buffer.from(await res.arrayBuffer());
    }
  }

  if (!res.ok || contentType.includes('text/html')) {
    throw new Error(
      'Could not download the video. Make sure it is shared as "Anyone with the link", or use a direct video URL instead.'
    );
  }

  return { buffer, contentType: contentType.startsWith('video/') ? contentType : 'video/mp4' };
}

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v'];

/**
 * Finds a file in `localFolder` whose name matches `stem` (the value from
 * the sheet's video column), regardless of extension or exact case — so
 * a sheet cell of "clip1" matches a local "Clip1.mp4", "clip1.mov", etc.
 * If the sheet cell already includes an extension, that exact name is
 * tried first.
 */
async function findLocalFile(localFolder, stem) {
  const entries = await readdir(localFolder, { withFileTypes: true }).catch((err) => {
    throw new Error(`Could not read local video folder "${localFolder}": ${err.message}`);
  });
  const files = entries.filter((e) => e.isFile()).map((e) => e.name);

  const exact = files.find((f) => f.toLowerCase() === stem.toLowerCase());
  if (exact) return exact;

  const stemLower = path.parse(stem).name.toLowerCase();
  const byStem = files.find(
    (f) => VIDEO_EXTENSIONS.includes(path.extname(f).toLowerCase()) && path.parse(f).name.toLowerCase() === stemLower
  );
  if (byStem) return byStem;

  throw new Error(
    `No video named "${stem}" (or matching filename) found in ${localFolder}. Files there: ${files.slice(0, 10).join(', ') || '(none)'}`
  );
}

function looksLikeUrl(value) {
  return /^https?:\/\//i.test(value);
}

/**
 * Resolves a sheet row's video cell into raw bytes.
 *   - Starts with http(s):// → fetched directly (a Google Drive share
 *     link is detected and handled automatically)
 *   - Anything else → treated as a filename to find inside `localFolder`
 *     (matched by exact name first, then by name ignoring extension)
 */
export async function resolveVideo(videoCell, localFolder) {
  const value = (videoCell || '').trim();
  if (!value) throw new Error('This row has no video value.');

  if (looksLikeUrl(value)) {
    return fetchFromUrl(value);
  }

  if (!localFolder) {
    throw new Error(
      `"${value}" isn't a URL and no local video folder is configured on the Sheet page.`
    );
  }

  const matchedName = await findLocalFile(localFolder, value);
  const fullPath = path.join(localFolder, matchedName);
  const buffer = await readFile(fullPath);
  return { buffer, contentType: 'video/mp4' };
}

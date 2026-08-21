import { fetchSheetRows, isReadyRow } from './sheetRows';
import { fetchVideoBlob } from './videoFetch';
import { getGoogleAccessToken } from './googleToken';
import { uploadVideoToYoutube } from './youtubeUpload';
import { getPlatformApp } from './platformApps';

/**
 * Posts a single row to YouTube. Everything needed lives in `connector`
 * (per-user: refreshToken, channelId) plus the shared app credentials
 * (clientId, clientSecret) saved once for the whole platform.
 */
async function postRowToYoutube(row, connector) {
  const app = getPlatformApp('youtube');
  if (!app?.clientId || !app?.clientSecret) {
    throw new Error('YouTube app credentials (Client ID/Secret) are not configured yet.');
  }
  if (!connector?.refreshToken) {
    throw new Error('This user has no YouTube refresh token saved.');
  }

  const accessToken = await getGoogleAccessToken({
    clientId: app.clientId,
    clientSecret: app.clientSecret,
    refreshToken: connector.refreshToken,
  });

  const videoBlob = await fetchVideoBlob(row.video);

  return uploadVideoToYoutube({
    accessToken,
    videoBlob,
    title: row.title,
    description: row.description,
    tags: row.tags,
  });
}

// Only YouTube actually posts anywhere right now. Other platforms are
// listed so results are honest about what did and didn't happen, instead
// of silently skipping them.
const POSTERS = {
  youtube: postRowToYoutube,
};

/**
 * Runs one posting pass for a user: reads their sheet's "ready" rows and
 * attempts to post each to every platform listed in that row's platforms
 * cell (comma-separated) that the user has connected.
 *
 * Does NOT write status back into the Google Sheet yet — the API key used
 * to read the sheet is read-only. Results are returned so the caller can
 * show what happened; the person still needs to update the sheet's status
 * column by hand for now.
 */
export async function runPostingForUser({ sheet, connectors }) {
  if (!sheet?.sheetUrl || !sheet?.tabName) {
    throw new Error('Connect a sheet first.');
  }

  const rows = await fetchSheetRows({
    sheetUrl: sheet.sheetUrl,
    tabName: sheet.tabName,
    mapping: sheet.mapping,
  });
  const readyRows = rows.filter(isReadyRow);

  if (readyRows.length === 0) {
    return { processed: 0, results: [] };
  }

  const connectorMap = Object.fromEntries(connectors.map((c) => [c.platform, c]));
  const results = [];

  for (const row of readyRows) {
    const platforms = (row.platforms || '')
      .split(',')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);

    for (const platform of platforms) {
      const poster = POSTERS[platform];
      const entry = { sheetRow: row.sheetRow, title: row.title, platform };

      if (!poster) {
        results.push({ ...entry, ok: false, error: 'Posting to this platform isn\'t built yet.' });
        continue;
      }
      if (!connectorMap[platform]) {
        results.push({ ...entry, ok: false, error: 'Not connected for this user.' });
        continue;
      }

      try {
        const posted = await poster(row, connectorMap[platform]);
        results.push({ ...entry, ok: true, url: posted.url });
      } catch (err) {
        results.push({ ...entry, ok: false, error: err.message });
      }
    }
  }

  return { processed: readyRows.length, results };
}

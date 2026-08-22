import { readSheetRows, writeStatus, isReadyRow } from './sheets.mjs';
import { resolveVideo } from './videoSource.mjs';
import { getGoogleAccessToken, uploadVideoToYoutube } from './youtube.mjs';
import { recordPlatformResult } from './results.mjs';

async function postRowToYoutube(row, connector, app, localFolder) {
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

  const { buffer, contentType } = await resolveVideo(row.video, localFolder);

  return uploadVideoToYoutube({
    accessToken,
    buffer,
    contentType,
    title: row.title,
    description: row.description,
    tags: row.tags,
  });
}

// Only YouTube actually posts anywhere right now. Other platforms are
// listed so results are honest about what did and didn't happen.
const POSTERS = { youtube: postRowToYoutube };

function resolveBatchSize(batchSize, totalReady) {
  if (batchSize === 'all') return totalReady;
  const n = Number(batchSize);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Runs one posting pass: find every "ready" row, take the requested batch
 * size of them (default 1), and process them ONE AT A TIME — post to
 * every connected platform listed in that row's platforms column, record
 * each platform's result separately, then write the row's overall status
 * back to the sheet before moving to the next row. This ordering matters:
 * writing status before continuing is what stops the same video from
 * being posted twice on the next run.
 */
export async function runPosting({ sheet, connectors, app, batchSize = '1' }) {
  if (!sheet?.sheetUrl || !sheet?.tabName) throw new Error('Connect a sheet first.');

  const { headerRow, rows } = await readSheetRows({
    sheetUrl: sheet.sheetUrl,
    tabName: sheet.tabName,
    mapping: sheet.mapping,
  });
  const readyRows = rows.filter(isReadyRow);
  const take = resolveBatchSize(batchSize, readyRows.length);
  const queue = readyRows.slice(0, take);

  if (queue.length === 0) return { processed: 0, results: [] };

  const connectorMap = Object.fromEntries(connectors.map((c) => [c.platform, c]));
  const results = [];

  for (const row of queue) {
    const platforms = (row.platforms || '')
      .split(',')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);

    const rowResults = [];

    for (const platform of platforms) {
      const poster = POSTERS[platform];
      const entry = { sheetRow: row.sheetRow, title: row.title, platform };

      if (!poster) {
        rowResults.push({ ...entry, ok: false, error: "Posting to this platform isn't built yet." });
        continue;
      }
      if (!connectorMap[platform]) {
        rowResults.push({ ...entry, ok: false, error: 'Not connected for this user.' });
        continue;
      }

      try {
        const posted = await poster(row, connectorMap[platform], app?.[platform], sheet.localFolder);
        rowResults.push({ ...entry, ok: true, url: posted.url });
      } catch (err) {
        rowResults.push({ ...entry, ok: false, error: err.message });
      }

      await recordPlatformResult({
        sheetUrl: sheet.sheetUrl,
        sheetRow: row.sheetRow,
        title: row.title,
        platform,
        ok: rowResults[rowResults.length - 1].ok,
        url: rowResults[rowResults.length - 1].url,
        error: rowResults[rowResults.length - 1].error,
      });
    }

    // Overall sheet status: "posted" only if every requested platform
    // succeeded; otherwise a short failure summary naming what failed.
    const failed = rowResults.filter((r) => !r.ok);
    const overallStatus =
      failed.length === 0 ? 'posted' : `failed: ${failed.map((f) => f.platform).join(', ')}`;

    await writeStatus({
      sheetUrl: sheet.sheetUrl,
      tabName: sheet.tabName,
      sheetRow: row.sheetRow,
      headerRow,
      statusColumn: sheet.mapping.status,
      value: overallStatus,
    });

    results.push(...rowResults);
  }

  return { processed: queue.length, results };
}

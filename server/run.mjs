import { readSheetRows, writeStatus, isReadyRow } from './sheets.mjs';
import { resolveVideo } from './videoSource.mjs';
import { getGoogleAccessToken, uploadVideoToYoutube } from './youtube.mjs';
import { postVideoToTelegram } from './telegram.mjs';
import { postVideoToDiscord } from './discord.mjs';
import { postVideoToFacebook } from './facebook.mjs';
import { postVideoToLinkedIn } from './linkedin.mjs';
import { recordPlatformResult } from './results.mjs';
import { createJob, updateJob, classifyError } from './jobs.mjs';

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

async function postRowToTelegram(row, connector, app, localFolder) {
  if (!connector?.botToken || !connector?.chatId) {
    throw new Error('Telegram needs a bot token and chat ID saved for this user.');
  }
  const { buffer } = await resolveVideo(row.video, localFolder);
  return postVideoToTelegram({
    botToken: connector.botToken,
    chatId: connector.chatId,
    buffer,
    filename: 'video.mp4',
    caption: [row.title, row.description].filter(Boolean).join('\n\n'),
  });
}

async function postRowToDiscord(row, connector, app, localFolder) {
  if (!connector?.webhookUrl) {
    throw new Error('Discord needs a webhook URL saved for this user.');
  }
  const { buffer } = await resolveVideo(row.video, localFolder);
  return postVideoToDiscord({
    webhookUrl: connector.webhookUrl,
    buffer,
    filename: 'video.mp4',
    content: row.title || '',
  });
}

async function postRowToFacebook(row, connector, app, localFolder) {
  if (!connector?.pageId || !connector?.pageAccessToken) {
    throw new Error('Facebook needs a Page ID and Page access token saved for this user.');
  }
  const { buffer } = await resolveVideo(row.video, localFolder);
  return postVideoToFacebook({
    pageId: connector.pageId,
    pageAccessToken: connector.pageAccessToken,
    buffer,
    filename: 'video.mp4',
    title: row.title,
    description: row.description,
  });
}

async function postRowToLinkedin(row, connector, app, localFolder) {
  if (!connector?.accessToken || !connector?.authorUrn) {
    throw new Error('LinkedIn needs an access token and author URN saved for this user.');
  }
  const { buffer } = await resolveVideo(row.video, localFolder);
  return postVideoToLinkedIn({
    accessToken: connector.accessToken,
    authorUrn: connector.authorUrn,
    buffer,
    title: row.title,
    description: row.description,
  });
}

// Real posters. Platforms not listed here show "not built yet" in
// results rather than silently pretending to succeed.
const POSTERS = {
  youtube: postRowToYoutube,
  telegram: postRowToTelegram,
  discord: postRowToDiscord,
  facebook: postRowToFacebook,
  linkedin: postRowToLinkedin,
};

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
export async function runPosting({ sheet, connectors, app, batchSize = '1', maxAttempts = 3 }) {
  if (!sheet?.sheetUrl || !sheet?.tabName) throw new Error('Connect a sheet first.');

  const { headerRow, rows } = await readSheetRows({
    sheetUrl: sheet.sheetUrl,
    tabName: sheet.tabName,
    mapping: sheet.mapping,
  });
  const readyRows = rows.filter(isReadyRow);
  const take = resolveBatchSize(batchSize, readyRows.length);
  const queue = readyRows.slice(0, take);
  if (queue.length === 0) return { processed: 0, results: [], jobs: [] };

  const connectorMap = Object.fromEntries((connectors || []).map((c) => [c.platform, c]));
  const results = [];
  const jobs = [];

  for (const row of queue) {
    const job = await createJob({
      type: 'publish',
      sheetUrl: sheet.sheetUrl,
      tabName: sheet.tabName,
      sheetRow: row.sheetRow,
      title: row.title,
      status: 'processing',
      maxAttempts: Math.max(1, Number(maxAttempts) || 3)
    });
    jobs.push(job);
    const platforms = (row.platforms || '').split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
    const rowResults = [];

    await writeStatus({sheetUrl: sheet.sheetUrl, tabName: sheet.tabName, sheetRow: row.sheetRow,
      headerRow, statusColumn: sheet.mapping.status, value: 'publishing'});

    for (const platform of platforms) {
      const poster = POSTERS[platform];
      const entry = { sheetRow: row.sheetRow, title: row.title, platform };
      let attempt = 0, finalResult = null;

      while (attempt < job.maxAttempts) {
        attempt++;
        await updateJob(job.id, { attempt, currentPlatform: platform, status: 'uploading' });
        try {
          if (!poster) throw new Error("Posting to this platform isn't built yet.");
          if (!connectorMap[platform]) throw new Error('Not connected for this user.');
          const posted = await poster(row, connectorMap[platform], app?.[platform], sheet.localFolder);
          finalResult = { ...entry, ok: true, url: posted.url, attempts: attempt };
          break;
        } catch (err) {
          const policy = classifyError(err);
          finalResult = { ...entry, ok: false, error: err.message, attempts: attempt, retryable: policy.retryable, retryReason: policy.reason };
          if (!policy.retryable || attempt >= job.maxAttempts) break;
          await updateJob(job.id, { status: 'retry_wait', retryReason: policy.reason, nextAttemptAt: new Date(Date.now() + (policy.delayMs || 2000) * attempt).toISOString() });
          await new Promise(r => setTimeout(r, Math.min((policy.delayMs || 2000) * attempt, 60000)));
        }
      }

      rowResults.push(finalResult);
      await recordPlatformResult({
        sheetUrl: sheet.sheetUrl, sheetRow: row.sheetRow, title: row.title, platform,
        ok: finalResult.ok, url: finalResult.url, error: finalResult.error
      });
    }

    const failed = rowResults.filter((r) => !r.ok);
    const overallStatus = failed.length === 0 ? 'posted' : `failed: ${failed.map((f) => f.platform).join(', ')}`;
    await writeStatus({sheetUrl: sheet.sheetUrl, tabName: sheet.tabName, sheetRow: row.sheetRow,
      headerRow, statusColumn: sheet.mapping.status, value: overallStatus});

    const finalJob = await updateJob(job.id, {
      status: failed.length ? 'failed' : 'completed',
      finishedAt: new Date().toISOString(),
      platformResults: rowResults,
      error: failed.length ? failed.map(x => `${x.platform}: ${x.error}`).join('; ') : null
    });
    results.push(...rowResults);
    jobs[jobs.length - 1] = finalJob;
  }
  return { processed: queue.length, results, jobs };
}

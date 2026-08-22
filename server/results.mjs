import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const dataDir = path.resolve('server/data');
const resultsPath = path.join(dataDir, 'results.json');

async function ensureFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(resultsPath, 'utf8');
  } catch {
    await writeFile(resultsPath, '{}');
  }
}

async function readAll() {
  await ensureFile();
  return JSON.parse(await readFile(resultsPath, 'utf8'));
}

async function writeAll(data) {
  await ensureFile();
  await writeFile(resultsPath, JSON.stringify(data, null, 2));
}

/**
 * Records one platform's outcome for one sheet row, keyed by
 * "<sheetUrl>::<sheetRow>" so results survive across runs and don't
 * collide between different users' sheets. The sheet itself only ever
 * gets one overall status - this is where the per-platform detail lives.
 */
export async function recordPlatformResult({ sheetUrl, sheetRow, title, platform, ok, url, error }) {
  const all = await readAll();
  const key = `${sheetUrl}::${sheetRow}`;
  if (!all[key]) all[key] = { title, sheetRow, platforms: {} };
  all[key].platforms[platform] = {
    ok,
    url: url || null,
    error: error || null,
    postedAt: new Date().toISOString(),
  };
  await writeAll(all);
}

export async function getResultsForSheet(sheetUrl) {
  const all = await readAll();
  const prefix = `${sheetUrl}::`;
  return Object.entries(all)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value);
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { getHeaderRow } from './sheets.mjs';
import { getGoogleAccessToken } from './youtube.mjs';
import { runPosting } from './run.mjs';
import { getResultsForSheet } from './results.mjs';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Sheet column headers, for the mapping UI on the Sheet page.
app.post('/api/sheet/preview', async (req, res) => {
  try {
    const { sheetUrl, tabName } = req.body;
    if (!sheetUrl || !tabName) return res.status(400).json({ error: 'sheetUrl and tabName are required' });
    const headers = await getHeaderRow({ sheetUrl, tabName });
    if (!headers.length) return res.status(400).json({ error: 'No headers found in row 1.' });
    res.json({ headers });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// A real connectivity check for YouTube: actually tries to refresh the
// token, rather than just checking whether the fields are non-empty.
app.post('/api/youtube/test', async (req, res) => {
  try {
    const { clientId, clientSecret, refreshToken } = req.body;
    await getGoogleAccessToken({ clientId, clientSecret, refreshToken });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// The main posting run: find ready rows, post up to `batchSize` of them
// one at a time, write status back into the sheet after each.
app.post('/api/run', async (req, res) => {
  try {
    const { sheet, connectors, app: platformApps, batchSize } = req.body;
    const result = await runPosting({ sheet, connectors, app: platformApps, batchSize });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Per-platform result history for a sheet, kept separate from the
// sheet's own single status column.
app.get('/api/results', async (req, res) => {
  try {
    const { sheetUrl } = req.query;
    if (!sheetUrl) return res.status(400).json({ error: 'sheetUrl is required' });
    res.json({ results: await getResultsForSheet(sheetUrl) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Serve the built frontend too, so `npm run build && npm run server` is
// the whole app on one port with nothing else to deploy.
const distDir = path.resolve('dist');
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Auto Media server running at http://localhost:${port}`);
});

const BASE = import.meta.env.VITE_SERVER_URL || 'http://localhost:8787';

async function call(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.error ||
        `The local server didn't respond (is it running? "npm run server" starts it on port 8787).`
    );
  }
  return data;
}

export function previewSheet({ sheetUrl, tabName }) {
  return call('/api/sheet/preview', { method: 'POST', body: JSON.stringify({ sheetUrl, tabName }) });
}

export function testYoutubeConnection({ clientId, clientSecret, refreshToken }) {
  return call('/api/youtube/test', {
    method: 'POST',
    body: JSON.stringify({ clientId, clientSecret, refreshToken }),
  });
}

export function runPosting({ sheet, connectors, app, batchSize }) {
  return call('/api/run', {
    method: 'POST',
    body: JSON.stringify({ sheet, connectors, app, batchSize }),
  });
}

export function getResults(sheetUrl) {
  return call(`/api/results?sheetUrl=${encodeURIComponent(sheetUrl)}`);
}

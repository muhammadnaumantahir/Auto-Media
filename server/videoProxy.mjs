// Optional local YouTube resolver for development/self-hosting.
// Requires yt-dlp installed and available on PATH.
// Run: node server/videoProxy.mjs
// Then set VITE_VIDEO_PROXY_URL=http://localhost:8787/api/video

import http from 'node:http';
import { spawn } from 'node:child_process';

const port = Number(process.env.PORT || 8787);

function send(res, status, data, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100_000) req.destroy(new Error('Request too large.'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function isYouTubeUrl(value) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be' || host.endsWith('.youtu.be');
  } catch { return false; }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    });
    return res.end();
  }

  if (req.method !== 'POST' || req.url !== '/api/video') {
    return send(res, 404, { error: 'Not found.' });
  }

  try {
    const body = JSON.parse(await readBody(req));
    const url = String(body?.url || '').trim();
    if (!isYouTubeUrl(url)) return send(res, 400, { error: 'A valid YouTube URL is required.' });

    // yt-dlp writes the media bytes to stdout. The browser receives the stream
    // directly, avoiding a second download and keeping memory usage low.
    const child = spawn(process.env.YTDLP_BIN || 'yt-dlp', [
      '--no-playlist',
      '--no-warnings',
      '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b',
      '--merge-output-format', 'mp4',
      '-o', '-',
      url,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });

    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-store',
      'Transfer-Encoding': 'chunked',
    });
    child.stdout.pipe(res);

    child.on('error', err => {
      if (!res.headersSent) send(res, 500, { error: `Could not start yt-dlp: ${err.message}` });
      else res.destroy(err);
    });
    child.on('close', code => {
      if (code !== 0) res.destroy(new Error(stderr.slice(-1000) || `yt-dlp exited with ${code}`));
    });
  } catch (error) {
    if (!res.headersSent) send(res, 400, { error: error?.message || 'Invalid request.' });
    else res.destroy(error);
  }
});

server.listen(port, () => {
  console.log(`Video resolver listening on http://localhost:${port}/api/video`);
});

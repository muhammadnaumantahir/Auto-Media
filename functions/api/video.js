// Cloudflare Pages Function /api/video
//
// This endpoint intentionally does not try to run yt-dlp: Cloudflare Workers
// do not provide a general-purpose native process runtime. Instead configure
// VIDEO_RESOLVER_URL to a trusted resolver service that accepts
// POST {"url":"..."} and returns either:
//   {"url":"https://...direct-video-url..."}
// or the video bytes directly.

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const url = String(body?.url || '').trim();
    if (!url) return json({ error: 'Missing video URL.' }, 400);

    let parsed;
    try { parsed = new URL(url); } catch { return json({ error: 'Invalid video URL.' }, 400); }

    const host = parsed.hostname.toLowerCase();
    const isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be' || host.endsWith('.youtu.be');
    if (!isYouTube) return json({ error: 'This endpoint is intended for YouTube URLs.' }, 400);

    if (!env.VIDEO_RESOLVER_URL) {
      return json({
        error: 'YouTube server processing is not configured on this Cloudflare deployment. Set VIDEO_RESOLVER_URL to your video resolver service.'
      }, 501);
    }

    const headers = { 'Content-Type': 'application/json' };
    if (env.VIDEO_RESOLVER_TOKEN) headers.Authorization = `Bearer ${env.VIDEO_RESOLVER_TOKEN}`;

    const resolver = await fetch(env.VIDEO_RESOLVER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });

    const contentType = resolver.headers.get('content-type') || '';
    if (!resolver.ok) {
      const text = await resolver.text().catch(() => '');
      return json({ error: `Resolver failed with HTTP ${resolver.status}${text ? `: ${text.slice(0, 300)}` : ''}` }, 502);
    }

    if (contentType.includes('application/json')) {
      const data = await resolver.json();
      if (!data?.url) return json({ error: 'Resolver did not return a direct video URL.' }, 502);
      return json({ url: data.url });
    }

    return new Response(resolver.body, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'video/mp4',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return json({ error: error?.message || 'Video server error.' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

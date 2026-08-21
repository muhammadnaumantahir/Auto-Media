// Uploads a video to YouTube via the resumable upload protocol:
// 1) POST metadata to get a session URL back in the Location header
// 2) PUT the video bytes to that session URL
// The uploaded-to channel is whichever channel the refresh token was
// authorized for — YouTube's API has no separate "channelId" upload param.

export async function uploadVideoToYoutube({
  accessToken,
  videoBlob,
  title,
  description,
  tags,
}) {
  const metadata = {
    snippet: {
      title: (title || 'Untitled').slice(0, 100),
      description: description || '',
      tags: (tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    },
    status: {
      privacyStatus: 'public',
    },
  };

  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': videoBlob.type || 'video/*',
        'X-Upload-Content-Length': String(videoBlob.size),
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'YouTube rejected the upload request.');
  }

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) {
    throw new Error('YouTube did not return an upload session URL.');
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': videoBlob.type || 'video/*' },
    body: videoBlob,
  });

  const result = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(result.error?.message || 'The video upload failed partway through.');
  }

  return {
    videoId: result.id,
    url: `https://www.youtube.com/watch?v=${result.id}`,
  };
}

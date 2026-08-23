// TikTok's Content Posting API works before your app passes audit, but
// with a hard restriction: unaudited apps can only publish with
// privacy_level SELF_ONLY (visible just to the posting account). Going
// public requires TikTok/ByteDance's own app-audit approval - no code
// here can bypass that, so this defaults to SELF_ONLY and says so
// plainly rather than silently posting something more public than the
// account is actually allowed to.

async function initUpload({ accessToken, videoSize, title }) {
  const res = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: (title || 'Untitled').slice(0, 150),
        privacy_level: 'SELF_ONLY',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1,
      },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error?.code !== 'ok') {
    throw new Error(data.error?.message || 'TikTok rejected the upload request.');
  }
  return data.data; // { publish_id, upload_url }
}

async function uploadBytes({ uploadUrl, buffer }) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Range': `bytes 0-${buffer.length - 1}/${buffer.length}`,
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error('TikTok rejected the video upload.');
  }
}

async function waitForPublish({ accessToken, publishId, attempts = 20, delayMs = 5000 }) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Could not check TikTok publish status.');

    const status = data.data?.status;
    if (status === 'PUBLISH_COMPLETE') return;
    if (status === 'FAILED') {
      throw new Error(data.data?.fail_reason || 'TikTok failed to publish the video.');
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error('TikTok is still processing the video after waiting — try again shortly.');
}

export async function postVideoToTikTok({ accessToken, buffer, title }) {
  if (!accessToken) {
    throw new Error('TikTok needs an access token with the video.publish scope.');
  }

  const { publish_id: publishId, upload_url: uploadUrl } = await initUpload({
    accessToken,
    videoSize: buffer.length,
    title,
  });
  await uploadBytes({ uploadUrl, buffer });
  await waitForPublish({ accessToken, publishId });

  // TikTok's API doesn't hand back a public permalink for SELF_ONLY
  // posts (there isn't a public one to give) - the account owner can
  // find it in their own TikTok app under their profile.
  return {
    url: null,
    publishId,
    note: 'Posted as private (SELF_ONLY) — visible only in your own TikTok app until the app passes audit for public posting.',
  };
}

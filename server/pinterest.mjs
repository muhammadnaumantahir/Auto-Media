// Pinterest's v5 API is register → upload → poll → create pin. Unlike
// Instagram/Threads, it accepts direct file bytes (a presigned upload,
// not a URL it fetches itself), so this works with local-folder videos.

async function registerMediaUpload({ accessToken }) {
  const res = await fetch('https://api.pinterest.com/v5/media', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ media_type: 'video' }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Pinterest rejected the media registration.');
  }
  return data; // { media_id, upload_url, upload_parameters, status }
}

async function uploadBytes({ uploadUrl, uploadParameters, buffer, filename }) {
  const form = new FormData();
  // S3-style presigned POST: every returned parameter must be a form
  // field, added BEFORE the file field, in the order Pinterest sent them.
  Object.entries(uploadParameters || {}).forEach(([key, value]) => {
    form.append(key, value);
  });
  form.append('file', new Blob([buffer]), filename || 'video.mp4');

  const res = await fetch(uploadUrl, { method: 'POST', body: form });
  if (!res.ok) {
    throw new Error('Pinterest rejected the video upload.');
  }
}

async function pollUntilReady({ accessToken, mediaId, attempts = 20, delayMs = 3000 }) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`https://api.pinterest.com/v5/media/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Could not check Pinterest processing status.');
    if (data.status === 'succeeded') return;
    if (data.status === 'failed') throw new Error('Pinterest failed to process the video.');
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error('Pinterest is still processing the video after waiting — try again shortly.');
}

async function createPin({ accessToken, boardId, mediaId, title, description, link }) {
  const res = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      board_id: boardId,
      media_source: { source_type: 'video_id', media_id: mediaId },
      title: (title || 'Untitled').slice(0, 100),
      description: description || '',
      ...(link ? { link } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Pinterest rejected the pin.');
  }
  return data;
}

export async function postVideoToPinterest({
  accessToken,
  boardId,
  buffer,
  filename,
  title,
  description,
  link,
}) {
  if (!accessToken || !boardId) {
    throw new Error('Pinterest needs an access token and a board ID.');
  }

  const { media_id: mediaId, upload_url: uploadUrl, upload_parameters: uploadParameters } =
    await registerMediaUpload({ accessToken });
  await uploadBytes({ uploadUrl, uploadParameters, buffer, filename });
  await pollUntilReady({ accessToken, mediaId });
  const pin = await createPin({ accessToken, boardId, mediaId, title, description, link });

  return { url: pin.id ? `https://www.pinterest.com/pin/${pin.id}/` : null, pinId: pin.id };
}

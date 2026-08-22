// Discord webhooks need no app review - creating one is a channel setting.
// Note the real platform limit: webhooks can attach files up to 25MB on
// a boosted server, 8MB otherwise. Larger videos will fail here with
// Discord's own error, which is surfaced as-is.
export async function postVideoToDiscord({ webhookUrl, buffer, filename, content }) {
  if (!webhookUrl) throw new Error('Discord needs a webhook URL.');

  const form = new FormData();
  form.append('payload_json', JSON.stringify({ content: content || '' }));
  form.append('files[0]', new Blob([buffer]), filename || 'video.mp4');

  const res = await fetch(`${webhookUrl}?wait=true`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data.message ||
        'Discord rejected the video — it may be over the 8MB (or 25MB boosted) attachment limit.'
    );
  }

  const attachment = data.attachments?.[0];
  return { url: attachment?.url || null, messageId: data.id };
}

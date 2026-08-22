// Telegram Bot API needs no app review - a bot token from @BotFather
// works immediately. sendVideo takes multipart/form-data.
export async function postVideoToTelegram({ botToken, chatId, buffer, filename, caption }) {
  if (!botToken || !chatId) {
    throw new Error('Telegram needs a bot token and a chat ID.');
  }

  const form = new FormData();
  form.append('chat_id', chatId);
  if (caption) form.append('caption', caption.slice(0, 1024));
  form.append('video', new Blob([buffer]), filename || 'video.mp4');

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.description || 'Telegram rejected the video.');
  }

  const messageId = data.result.message_id;
  // Public t.me links only resolve for channels with a public @username;
  // private groups/channels don't have a browsable URL, so fall back to
  // just confirming the message id in that case.
  const chatUsername = data.result.chat?.username;
  const url = chatUsername ? `https://t.me/${chatUsername}/${messageId}` : null;

  return { url, messageId };
}

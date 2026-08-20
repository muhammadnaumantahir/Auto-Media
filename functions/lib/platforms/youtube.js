const { google } = require("googleapis");
const axios = require("axios");

/**
 * Uploads a video to YouTube by streaming it straight from its source URL.
 * Needs a Google Cloud OAuth client (Desktop or Web type) with the
 * YouTube Data API v3 enabled, and a refresh token obtained once via the
 * OAuth consent screen for the target channel (see functions/README.md).
 */
async function publishToYouTube(connector, { videoUrl, title, description }) {
  const oauth2Client = new google.auth.OAuth2(connector.clientId, connector.clientSecret);
  oauth2Client.setCredentials({ refresh_token: connector.refreshToken });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  const videoStream = await axios.get(videoUrl, { responseType: "stream" });

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: title || "Untitled",
        description: description || "",
      },
      status: {
        privacyStatus: "public",
      },
    },
    media: {
      body: videoStream.data,
    },
  });

  return { ok: true, postId: res.data.id, url: `https://youtu.be/${res.data.id}` };
}

module.exports = { publishToYouTube };

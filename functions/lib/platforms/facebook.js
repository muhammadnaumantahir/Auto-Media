const axios = require("axios");

const GRAPH = "https://graph-video.facebook.com/v19.0";

/**
 * Posts a video to a Facebook Page by handing Graph API a public URL —
 * Facebook's servers fetch the file themselves, so nothing is downloaded
 * or re-uploaded here. Requires a Page access token with pages_manage_posts.
 */
async function publishToFacebook(connector, { videoUrl, description }) {
  const { pageId, pageAccessToken } = connector;

  const res = await axios.post(`${GRAPH}/${pageId}/videos`, null, {
    params: {
      file_url: videoUrl,
      description: description || "",
      access_token: pageAccessToken,
    },
  });

  return { ok: true, postId: res.data.id };
}

module.exports = { publishToFacebook };

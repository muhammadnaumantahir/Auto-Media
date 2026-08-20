const axios = require("axios");

const GRAPH = "https://graph.facebook.com/v19.0";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Publishes a Reel from a public video URL. Requires an Instagram
 * business/creator account linked to a Facebook Page, and a long-lived
 * Graph API access token with instagram_content_publish permission.
 */
async function publishToInstagram(connector, { videoUrl, caption }) {
  const { igUserId, accessToken } = connector;

  // Step 1: create the media container.
  const create = await axios.post(`${GRAPH}/${igUserId}/media`, null, {
    params: {
      media_type: "REELS",
      video_url: videoUrl,
      caption: caption || "",
      access_token: accessToken,
    },
  });
  const creationId = create.data.id;

  // Step 2: poll until Instagram has finished processing the video.
  let status = "IN_PROGRESS";
  let attempts = 0;
  while (status === "IN_PROGRESS" && attempts < 20) {
    await sleep(5000);
    const check = await axios.get(`${GRAPH}/${creationId}`, {
      params: { fields: "status_code", access_token: accessToken },
    });
    status = check.data.status_code;
    attempts += 1;
  }
  if (status !== "FINISHED") {
    throw new Error(`Instagram container never finished processing (last status: ${status})`);
  }

  // Step 3: publish the container.
  const publish = await axios.post(`${GRAPH}/${igUserId}/media_publish`, null, {
    params: { creation_id: creationId, access_token: accessToken },
  });

  return { ok: true, postId: publish.data.id };
}

module.exports = { publishToInstagram };

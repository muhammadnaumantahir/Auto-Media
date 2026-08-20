const axios = require("axios");

const BASE = "https://open.tiktokapis.com/v2";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Publishes via TikTok's Content Posting API using PULL_FROM_URL, so
 * TikTok's own servers fetch the video rather than us uploading bytes.
 *
 * Two things to set up before this works, per TikTok's current docs:
 *  1. The video URL's domain must be verified in the TikTok Developer
 *     Portal (a meta tag or DNS record) — an unverified host is rejected
 *     with "url_ownership_unverified".
 *  2. Until your TikTok app passes their Content Posting audit, every
 *     direct post is forced to SELF_ONLY (visible only to the poster) —
 *     that's expected, not a bug, while you're testing.
 */
async function publishToTikTok(connector, { videoUrl, title }) {
  const { accessToken } = connector;
  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  const init = await axios.post(
    `${BASE}/post/publish/video/init/`,
    {
      post_info: {
        title: title || "",
        privacy_level: "SELF_ONLY",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    },
    { headers }
  );

  const publishId = init.data.data.publish_id;

  let status = "PROCESSING_UPLOAD";
  let attempts = 0;
  while (["PROCESSING_UPLOAD", "PROCESSING_DOWNLOAD"].includes(status) && attempts < 20) {
    await sleep(5000);
    const check = await axios.post(
      `${BASE}/post/publish/status/fetch/`,
      { publish_id: publishId },
      { headers }
    );
    status = check.data.data.status;
    attempts += 1;
  }

  if (status !== "PUBLISH_COMPLETE") {
    throw new Error(`TikTok publish did not complete (last status: ${status})`);
  }

  return { ok: true, postId: publishId };
}

module.exports = { publishToTikTok };

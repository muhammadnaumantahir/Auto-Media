const { publishToYouTube } = require("./platforms/youtube");
const { publishToInstagram } = require("./platforms/instagram");
const { publishToFacebook } = require("./platforms/facebook");
const { publishToTikTok } = require("./platforms/tiktok");
const { publishToSnapchat } = require("./platforms/snapchat");

const PUBLISHERS = {
  youtube: publishToYouTube,
  instagram: publishToInstagram,
  facebook: publishToFacebook,
  tiktok: publishToTikTok,
  snapchat: publishToSnapchat,
};

/**
 * Publishes one video row to one connected platform.
 * Always resolves — never throws — so one platform failing doesn't stop
 * the others. Returns { platform, ok, postId? , error? }.
 */
async function publishToPlatform(platform, connector, videoInfo) {
  const publisher = PUBLISHERS[platform];
  if (!publisher) {
    return { platform, ok: false, error: `No publisher registered for "${platform}"` };
  }
  try {
    const result = await publisher(connector, videoInfo);
    return { platform, ok: true, ...result };
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message || String(err);
    return { platform, ok: false, error: message };
  }
}

module.exports = { publishToPlatform };

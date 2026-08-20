/**
 * Snapchat is the one platform NOT wired up to actually post yet, on
 * purpose rather than by oversight.
 *
 * Unlike YouTube/Instagram/Facebook/TikTok, Snapchat's official posting
 * API (Public Profile content publishing, part of their Marketing/Ads
 * API surface) requires a Business Account, an OAuth app created in Ads
 * Manager, and a separate allowlist approval from Snap before any app —
 * not just this one — can post to a profile programmatically. There's no
 * self-serve "just call the endpoint" path the way there is for the other
 * four.
 *
 * To wire this up for real once you have that access:
 *   1. Apply for API access at https://businesshelp.snapchat.com (Business
 *      Account → Ads Manager → API access).
 *   2. Once approved, follow Snap's Public Profile publishing docs for the
 *      media upload + Story/Spotlight/Saved Story creation flow.
 *   3. Replace this function with the real calls, matching the pattern of
 *      lib/platforms/tiktok.js.
 *
 * Until then this throws a clear error so a "ready" row shows an honest
 * status in the sheet instead of silently doing nothing.
 */
async function publishToSnapchat() {
  throw new Error(
    "Snapchat posting isn't wired up yet — it needs Snap's separate Business/Ads Manager API allowlist approval first. See functions/lib/platforms/snapchat.js for details."
  );
}

module.exports = { publishToSnapchat };

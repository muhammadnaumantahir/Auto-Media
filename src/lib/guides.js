export const GUIDES = {
  youtube: {
    breadcrumb: ["Google Cloud Console", "APIs & Services", "Credentials", "OAuth Playground"],
    intro:
      "YouTube needs a Google Cloud OAuth client plus a one-time refresh token for the channel that will post.",
    steps: [
      {
        title: "Create or select a Google Cloud project",
        body: "Use one project for the whole setup — it's what the OAuth client and the enabled API both live under.",
        links: [{ label: "Open Cloud Console", url: "https://console.cloud.google.com/projectcreate" }],
      },
      {
        title: "Enable the YouTube Data API v3",
        body: "APIs & Services → Library → search “YouTube Data API v3” → Enable.",
        links: [{ label: "Open API Library", url: "https://console.cloud.google.com/apis/library/youtube.googleapis.com" }],
      },
      {
        title: "Configure the OAuth consent screen",
        body: "APIs & Services → OAuth consent screen → choose External → fill in app name and support email → add the scope .../auth/youtube.upload. If the app stays in “Testing” mode, add the channel owner's Google account under Test users.",
        links: [{ label: "Open consent screen setup", url: "https://console.cloud.google.com/apis/credentials/consent" }],
      },
      {
        title: "Create an OAuth client ID",
        body: "APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type “Desktop app”. Copy the two values it shows you.",
        fields: ["clientId", "clientSecret"],
        links: [{ label: "Open Credentials", url: "https://console.cloud.google.com/apis/credentials" }],
      },
      {
        title: "Generate a refresh token",
        body: "Open OAuth Playground → gear icon (top right) → check “Use your own OAuth credentials” → paste your Client ID and secret → in Step 1, find YouTube Data API v3 and select scope .../auth/youtube.upload → Authorize, signing in as the channel owner → in Step 2, click “Exchange authorization code for tokens” → copy the Refresh token shown.",
        fields: ["refreshToken"],
        links: [{ label: "Open OAuth Playground", url: "https://developers.google.com/oauthplayground" }],
      },
      {
        title: "Find the channel ID",
        body: "YouTube Studio → Settings → Channel → Advanced settings shows it, or open the channel page and copy the ID from the URL after /channel/.",
        fields: ["channelId"],
        links: [{ label: "Open YouTube Studio", url: "https://studio.youtube.com" }],
      },
    ],
  },

  instagram: {
    breadcrumb: ["Meta for Developers", "Create App", "Instagram Product", "Graph API Explorer"],
    intro:
      "Instagram posting goes through Meta's Graph API, and needs the target account to be a Business or Creator account linked to a Facebook Page.",
    steps: [
      {
        title: "Create a Meta developer app",
        body: "developers.facebook.com/apps → Create App → choose type “Business”.",
        links: [{ label: "Open Meta for Developers", url: "https://developers.facebook.com/apps" }],
      },
      {
        title: "Add the Instagram product",
        body: "Inside the app dashboard: Add Product → find Instagram → Set up.",
      },
      {
        title: "Link the Instagram account to a Facebook Page",
        body: "The Instagram account must be Business or Creator type, linked to a Page (Instagram app → Settings → Account → Linked accounts).",
      },
      {
        title: "Find the Instagram business account ID",
        body: "In Graph API Explorer: run GET /me/accounts to find the Page ID, then GET /{page-id}?fields=instagram_business_account to get the IG user ID.",
        fields: ["igUserId"],
        links: [{ label: "Open Graph API Explorer", url: "https://developers.facebook.com/tools/explorer" }],
      },
      {
        title: "Generate a long-lived access token",
        body: "In Graph API Explorer, request permissions instagram_basic, instagram_content_publish, and pages_show_list, generate a token, then exchange it for a long-lived one so it doesn't expire in an hour.",
        fields: ["accessToken"],
        links: [{ label: "Long-lived token guide", url: "https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived" }],
      },
    ],
  },

  facebook: {
    breadcrumb: ["Meta for Developers", "Graph API Explorer", "Page Access Token"],
    intro: "Facebook uses the same Meta app as Instagram — no need to create a second one.",
    steps: [
      {
        title: "Get a Page access token",
        body: "In Graph API Explorer, switch the “User or Page” dropdown to your Page → request pages_manage_posts and pages_read_engagement → Generate Access Token.",
        fields: ["pageAccessToken"],
        links: [{ label: "Open Graph API Explorer", url: "https://developers.facebook.com/tools/explorer" }],
      },
      {
        title: "Make it long-lived",
        body: "Exchange your user token for a long-lived one first — a Page token generated from a long-lived user token doesn't expire.",
        links: [{ label: "Long-lived token guide", url: "https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived" }],
      },
      {
        title: "Find the Page ID",
        body: "It's on the Page's About tab, or in the result of GET /me/accounts in Graph API Explorer.",
        fields: ["pageId"],
      },
    ],
  },

  tiktok: {
    breadcrumb: ["TikTok Developers", "Content Posting API", "Domain Verification", "Login Kit"],
    intro:
      "TikTok's Content Posting API can pull a video directly from its URL — but the hosting domain has to be verified first, and posts stay private until your app is audited.",
    steps: [
      {
        title: "Register a developer account and create an app",
        links: [{ label: "Open TikTok Developers", url: "https://developers.tiktok.com/apps" }],
      },
      {
        title: "Add the Content Posting API product",
        body: "In the app dashboard, add Content Posting API and fill in the required app details.",
      },
      {
        title: "Verify your video-hosting domain",
        body: "App dashboard → Domain verification → add the meta tag or DNS TXT record TikTok gives you, for the domain your video links live on. Skipping this makes every post fail with url_ownership_unverified.",
        links: [{ label: "Domain verification docs", url: "https://developers.tiktok.com/doc/getting-started-domain-verification" }],
      },
      {
        title: "Copy the client key and secret",
        body: "Shown right on the app dashboard.",
        fields: ["clientKey", "clientSecret"],
      },
      {
        title: "Get an access token",
        body: "Run TikTok's OAuth login flow once for the account that will post. Until your app passes TikTok's Content Posting audit, every post is forced to SELF_ONLY (private) — that's expected, not a bug.",
        fields: ["accessToken"],
        links: [{ label: "Login Kit docs", url: "https://developers.tiktok.com/doc/login-kit-web" }],
      },
    ],
  },

  snapchat: {
    breadcrumb: ["Snapchat Business Help", "Ads Manager", "API Access Application"],
    intro:
      "Unlike the other four, Snapchat's posting API isn't self-serve — it needs a separate allowlist approval from Snap before any app, including this one, can call it.",
    steps: [
      {
        title: "Apply for API access",
        body: "Through Business Help → Ads Manager → API access. There's no self-serve path the way there is for the other platforms — Snap reviews and approves each request.",
        links: [{ label: "Open Snapchat Business Help", url: "https://businesshelp.snapchat.com/" }],
      },
      {
        title: "Wait for approval, then wire it up",
        body: "Once approved, follow Snap's Public Profile / Marketing API docs for the media upload and publishing flow, and replace the stub in functions/lib/platforms/snapchat.js with the real calls.",
      },
    ],
  },
};

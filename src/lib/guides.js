export const GUIDES = {
  youtube: {
    breadcrumb: ["Google Cloud Console", "APIs & Services", "Credentials", "OAuth Playground"],
    intro:
      "Steps 1–4 are one-time setup, shared by every user (paste those into the \"YouTube app credentials\" card at the top of Connectors). Steps 5–6 are per user — each channel gets its own refresh token and goes in that user's own YouTube card below.",
    steps: [
      {
        title: "Create or select a Google Cloud project",
        body: "Use one project for the whole setup — it's what the OAuth client and the enabled API both live under. One-time, shared by all users.",
        links: [{ label: "Open Cloud Console", url: "https://console.cloud.google.com/projectcreate" }],
      },
      {
        title: "Enable the YouTube Data API v3",
        body: "APIs & Services → Library → search “YouTube Data API v3” → Enable. One-time, shared by all users.",
        links: [{ label: "Open API Library", url: "https://console.cloud.google.com/apis/library/youtube.googleapis.com" }],
      },
      {
        title: "Configure the OAuth consent screen",
        body: "APIs & Services → OAuth consent screen → choose External → fill in app name and support email → add the scope .../auth/youtube.upload. If the app stays in “Testing” mode, add each channel owner's Google account under Test users — do this for every channel/user you plan to add.",
        links: [{ label: "Open consent screen setup", url: "https://console.cloud.google.com/apis/credentials/consent" }],
      },
      {
        title: "Create an OAuth client ID",
        body: "APIs & Services → Credentials → Create Credentials → OAuth client ID → Application type “Desktop app”. Copy the two values it shows you into the shared YouTube app credentials card — one-time, not per user.",
        fields: ["clientId", "clientSecret"],
        links: [{ label: "Open Credentials", url: "https://console.cloud.google.com/apis/credentials" }],
      },
      {
        title: "Generate a refresh token for this channel",
        body: "Open OAuth Playground → gear icon (top right) → check “Use your own OAuth credentials” → paste the shared Client ID and secret → in Step 1, find YouTube Data API v3 and select scope .../auth/youtube.upload → Authorize, signing in as this specific channel's owner → in Step 2, click “Exchange authorization code for tokens” → copy the Refresh token shown. Repeat this step once per user/channel you add.",
        fields: ["refreshToken"],
        links: [{ label: "Open OAuth Playground", url: "https://developers.google.com/oauthplayground" }],
      },
      {
        title: "Find this channel's ID",
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

  telegram: {
    breadcrumb: ["@BotFather", "Telegram Bot API"],
    intro:
      "The only platform here with zero review process — a bot token works the moment @BotFather gives it to you.",
    steps: [
      {
        title: "Create a bot",
        body: "Message @BotFather on Telegram, send /newbot, and follow the prompts. It replies with your bot token — copy it.",
        fields: ["botToken"],
        links: [{ label: "Open @BotFather", url: "https://t.me/BotFather" }],
      },
      {
        title: "Add the bot to your channel or group",
        body: "Open your channel/group → Administrators → Add Admin → search for your bot's username → give it permission to post messages.",
      },
      {
        title: "Find the chat ID",
        body: "For a public channel, the chat ID is just @yourchannelname. For a private channel or group, send any message in it, then visit https://api.telegram.org/bot<token>/getUpdates in a browser and read the numeric chat id from the response.",
        fields: ["chatId"],
      },
    ],
  },

  discord: {
    breadcrumb: ["Channel Settings", "Integrations", "Webhooks"],
    intro:
      "No bot, no developer app, no review — a webhook is a per-channel setting. Note: Discord caps webhook attachments at 8MB (25MB on a boosted server), so this works best for short clips.",
    steps: [
      {
        title: "Create a webhook",
        body: "In Discord, open the target channel's Settings → Integrations → Webhooks → New Webhook. Name it, then click Copy Webhook URL.",
        fields: ["webhookUrl"],
      },
      {
        title: "That's it",
        body: "Paste the webhook URL into the Discord card below and save — there's no separate account or token to manage.",
      },
    ],
  },

  linkedin: {
    breadcrumb: ["LinkedIn Developers", "My Apps", "OAuth 2.0 tools"],
    intro:
      "LinkedIn needs a member access token with the w_member_social scope. Getting one requires creating a LinkedIn app and completing its OAuth flow once - this file assumes you already have that token, the same way Facebook's card takes a pasted token rather than doing OAuth in-app.",
    steps: [
      {
        title: "Create a LinkedIn app",
        body: "Go to LinkedIn Developers → Create app, attach it to a Company Page you administer (LinkedIn requires this even for posting as yourself), and request the “Share on LinkedIn” product.",
        links: [{ label: "Open LinkedIn Developers", url: "https://www.linkedin.com/developers/apps" }],
      },
      {
        title: "Get an access token with w_member_social",
        body: "Under your app's Auth tab, run the OAuth 2.0 flow (or use LinkedIn's token generator tool) requesting the w_member_social scope, and copy the resulting access token.",
        fields: ["accessToken"],
      },
      {
        title: "Find your author URN",
        body: "Call GET https://api.linkedin.com/v2/me with that token — the \"id\" field in the response goes into urn:li:person:<id>.",
        fields: ["authorUrn"],
      },
    ],
  },

  pinterest: {
    breadcrumb: ["Pinterest Developers", "My Apps", "Trial access"],
    intro:
      "Pinterest's API accepts the video file directly (a presigned upload), so this is one of the few non-YouTube platforms that also works with your local video folder, not just URLs.",
    steps: [
      {
        title: "Create a Pinterest app",
        body: "Go to Pinterest Developers → create an app, and request Trial Access for the scopes pins:write and boards:read — trial access works immediately for your own account without a review wait.",
        links: [{ label: "Open Pinterest Developers", url: "https://developers.pinterest.com/apps/" }],
      },
      {
        title: "Get an access token",
        body: "Complete the OAuth flow for your app (Pinterest's docs include a quick-start using their own OAuth tool) and copy the resulting access token.",
        fields: ["accessToken"],
      },
      {
        title: "Find the board ID",
        body: "Open the board on pinterest.com and copy the number from its URL, or call GET https://api.pinterest.com/v5/boards with your token and read the \"id\" field.",
        fields: ["boardId"],
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
        body: "Once approved, follow Snap's Public Profile / Marketing API docs for the media upload and publishing flow, and add the real calls to src/lib/runPosting.js alongside the YouTube poster.",
      },
    ],
  },
};

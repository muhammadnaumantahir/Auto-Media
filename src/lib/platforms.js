export const PLATFORMS = [
  {
    id: "youtube",
    name: "YouTube",
    short: "YT",
    color: "#FF3B30",
    description: "Upload as a channel video",
    fields: [
      { key: "clientId", label: "OAuth client ID", placeholder: "xxxx.apps.googleusercontent.com" },
      { key: "clientSecret", label: "OAuth client secret", placeholder: "GOCSPX-…", secret: true },
      { key: "refreshToken", label: "Refresh token", placeholder: "1//0g…", secret: true },
      { key: "channelId", label: "Channel ID", placeholder: "UCxxxxxxxx" },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    short: "IG",
    color: "#E1306C",
    description: "Publish as a Reel",
    fields: [
      { key: "accessToken", label: "Graph API access token", placeholder: "EAAG…", secret: true },
      { key: "igUserId", label: "Instagram business user ID", placeholder: "17841…" },
    ],
  },
  {
    id: "facebook",
    name: "Facebook",
    short: "FB",
    color: "#3B82F6",
    description: "Post to a Page",
    fields: [
      { key: "pageAccessToken", label: "Page access token", placeholder: "EAAG…", secret: true },
      { key: "pageId", label: "Page ID", placeholder: "1234567890" },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    short: "TT",
    color: "#E9ECF5",
    description: "Publish via Content Posting API",
    fields: [
      { key: "clientKey", label: "Client key", placeholder: "aw…" },
      { key: "clientSecret", label: "Client secret", placeholder: "…", secret: true },
      { key: "accessToken", label: "Access token", placeholder: "act.…", secret: true },
    ],
  },
  {
    id: "snapchat",
    name: "Snapchat",
    short: "SC",
    color: "#F5A623",
    description: "Publish via Marketing/Creative API",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "…" },
      { key: "clientSecret", label: "Client secret", placeholder: "…", secret: true },
      { key: "accessToken", label: "Access token", placeholder: "…", secret: true },
    ],
  },
];

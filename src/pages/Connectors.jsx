import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { saveConnector, removeConnector, watchConnectors } from "../lib/firestore";
import PlatformCard from "../components/PlatformCard";

const PLATFORMS = [
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

export default function Connectors() {
  const { activeUser } = useApp();
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    if (!activeUser) return;
    const unsub = watchConnectors(activeUser.id, setSaved);
    return unsub;
  }, [activeUser]);

  if (!activeUser) {
    return <p className="text-muted text-sm">Add a user first, then come back to this step.</p>;
  }

  const savedMap = Object.fromEntries(saved.map((s) => [s.id, s]));

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <p className="label">Step 03 · {activeUser.name}</p>
        <h1 className="font-display text-2xl font-semibold">Add platform connectors</h1>
        <p className="text-muted text-sm mt-1">
          Paste each platform's API credentials. Keys are written straight to this user's
          document in Firestore, scoped to their account only.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        {PLATFORMS.map((p) => (
          <PlatformCard
            key={p.id}
            platform={p}
            saved={savedMap[p.id]}
            onSave={(id, values) => saveConnector(activeUser.id, id, values)}
            onRemove={(id) => removeConnector(activeUser.id, id)}
          />
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { saveSheetConfig, watchSheetConfig } from "../lib/firestore";
import { googleSheetsApiKey } from "../firebaseConfig";

const REQUIRED_FIELDS = [
  { key: "videoName", label: "Video name column" },
  { key: "videoLink", label: "Video link column" },
  { key: "status", label: "Status column" },
];

function extractSheetId(input) {
  const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input.trim();
}

export default function SheetSetup() {
  const { activeUser } = useApp();
  const [sheetUrl, setSheetUrl] = useState("");
  const [tabName, setTabName] = useState("Sheet1");
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ videoName: "", videoLink: "", status: "" });
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    if (!activeUser) return;
    const unsub = watchSheetConfig(activeUser.id, (cfg) => {
      setExisting(cfg);
      if (cfg) {
        setSheetUrl(cfg.sheetUrl || "");
        setTabName(cfg.tabName || "Sheet1");
        setHeaders(cfg.headers || []);
        setMapping(cfg.mapping || { videoName: "", videoLink: "", status: "" });
      }
    });
    return unsub;
  }, [activeUser]);

  async function handleFetchHeaders() {
    setError("");
    if (!sheetUrl.trim()) {
      setError("Paste a Google Sheet link or ID first.");
      return;
    }
    const sheetId = extractSheetId(sheetUrl);
    setFetching(true);
    try {
      const range = `${tabName}!1:1`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
        range
      )}?key=${googleSheetsApiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Could not read the sheet.");
      const row = data.values?.[0] || [];
      if (row.length === 0) throw new Error("The first row looks empty — add headers to row 1.");
      setHeaders(row);
    } catch (err) {
      setError(
        err.message +
          " Make sure the sheet is shared as \"Anyone with the link – Viewer\" and your Sheets API key is set in src/firebaseConfig.js."
      );
    } finally {
      setFetching(false);
    }
  }

  async function handleSave() {
    if (!activeUser) return;
    setSaving(true);
    setError("");
    try {
      await saveSheetConfig(activeUser.id, {
        sheetUrl,
        sheetId: extractSheetId(sheetUrl),
        tabName,
        headers,
        mapping,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!activeUser) {
    return <p className="text-muted text-sm">Add a user first, then come back to this step.</p>;
  }

  const mappingComplete = REQUIRED_FIELDS.every((f) => mapping[f.key]);

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <p className="label">Step 02 · {activeUser.name}</p>
        <h1 className="font-display text-2xl font-semibold">Connect the Google Sheet</h1>
        <p className="text-muted text-sm mt-1">
          Point Relay at the sheet that lists videos to post, then match its columns to what
          Relay expects: video name, video link, and status.
        </p>
      </header>

      <div className="card p-6 grid gap-4 mb-6">
        <div className="grid sm:grid-cols-[1fr,160px] gap-4">
          <div>
            <span className="label">Sheet URL or ID</span>
            <input
              className="input font-mono text-xs"
              placeholder="https://docs.google.com/spreadsheets/d/…"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
          </div>
          <div>
            <span className="label">Tab name</span>
            <input className="input" value={tabName} onChange={(e) => setTabName(e.target.value)} />
          </div>
        </div>
        <div>
          <button className="btn-ghost" onClick={handleFetchHeaders} disabled={fetching}>
            {fetching ? "Reading columns…" : "Read column headers"}
          </button>
        </div>
        {error && <p className="text-rose text-xs whitespace-pre-line">{error}</p>}
      </div>

      {headers.length > 0 && (
        <div className="card p-6 grid gap-4 mb-6">
          <p className="label">Match columns</p>
          {REQUIRED_FIELDS.map((f) => (
            <div key={f.key} className="grid sm:grid-cols-[200px,1fr] items-center gap-3">
              <span className="text-sm text-ivory">{f.label}</span>
              <select
                className="input text-sm"
                value={mapping[f.key]}
                onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
              >
                <option value="">Select a sheet column…</option>
                {headers.map((h, i) => (
                  <option key={i} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          className="btn-primary"
          disabled={!mappingComplete || saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save sheet connection"}
        </button>
        {existing && <span className="text-teal text-xs font-mono">● saved</span>}
      </div>
    </div>
  );
}

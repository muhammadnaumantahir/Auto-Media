import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { watchSheetConfig, watchConnectors } from "../lib/firestore";
import { runPosting } from "../lib/serverApi";
import { getPlatformApp } from "../lib/platformApps";
import { useToast } from "../context/ToastContext";
import PipelineHero from "../components/PipelineHero";

const BATCH_OPTIONS = [
  ["1", "Post 1"],
  ["5", "Post 5"],
  ["10", "Post 10"],
  ["all", "Post all ready"],
];

export default function Dashboard() {
  const { activeUser } = useApp();
  const toast = useToast();
  const [sheet, setSheet] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [batchSize, setBatchSize] = useState("1");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState("");

  useEffect(() => {
    if (!activeUser) return;
    const u1 = watchSheetConfig(activeUser.id, setSheet);
    const u2 = watchConnectors(activeUser.id, setConnectors);
    return () => {
      u1();
      u2();
    };
  }, [activeUser]);

  async function handleRunNow() {
    setRunning(true);
    setRunError("");
    setRunResult(null);
    try {
      const res = await runPosting({
        sheet,
        connectors,
        app: { youtube: getPlatformApp("youtube") },
        batchSize,
      });
      setRunResult(res);
      if (res.processed === 0) {
        toast.info('No rows with status "ready" were found.');
      } else {
        const ok = res.results.filter((r) => r.ok).length;
        const failed = res.results.length - ok;
        if (failed === 0) toast.success(`Posted ${ok}/${res.results.length} successfully.`);
        else toast.error(`Posted ${ok}/${res.results.length} — ${failed} failed. See details below.`);
      }
    } catch (err) {
      const message = err.message || "The posting run failed.";
      setRunError(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  if (!activeUser) {
    return <p className="text-muted text-sm">Add a user first, then come back to this step.</p>;
  }

  const sheetReady = !!sheet;
  const platformsReady = connectors.length > 0;
  const setupComplete = sheetReady && platformsReady;

  return (
    <div className="max-w-4xl">
      <header className="mb-6 animate-fade-up">
        <p className="label">Step 04 · {activeUser.name}</p>
        <h1 className="font-display text-2xl font-semibold">Overview</h1>
        <p className="text-muted text-sm mt-1">
          Finds ready rows one at a time — posts, records the result, marks the row's status, then
          moves to the next — so nothing gets posted twice.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6 animate-fade-up" style={{ animationDelay: "20ms" }}>
        <a
          href="#/sheet"
          className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
            sheetReady
              ? "border-teal/40 text-teal bg-teal/10"
              : "border-rose/40 text-rose bg-rose/10 hover:bg-rose/20"
          }`}
        >
          {sheetReady ? "● Sheet connected" : "○ Connect a sheet →"}
        </a>
        <a
          href="#/connectors"
          className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
            platformsReady
              ? "border-teal/40 text-teal bg-teal/10"
              : "border-rose/40 text-rose bg-rose/10 hover:bg-rose/20"
          }`}
        >
          {platformsReady
            ? `● ${connectors.length} platform${connectors.length === 1 ? "" : "s"} connected`
            : "○ Connect a platform →"}
        </a>
      </div>

      {!setupComplete && (
        <div className="card p-4 mb-6 border-dashed text-xs text-muted">
          Finish the steps above before posting — {!sheetReady && "connect a sheet"}
          {!sheetReady && !platformsReady && " and "}
          {!platformsReady && "connect at least one platform"}.
        </div>
      )}

      <div className="card p-5 mb-6 flex flex-wrap items-center justify-between gap-4 animate-fade-up" style={{ animationDelay: "40ms" }}>
        <div>
          <p className="label mb-1">Batch size</p>
          <div className="flex gap-1.5">
            {BATCH_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setBatchSize(value)}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors ${
                  batchSize === value
                    ? "border-violet bg-violet/15 text-ivory"
                    : "border-border text-muted hover:border-violet/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn-primary whitespace-nowrap"
          onClick={handleRunNow}
          disabled={running || !setupComplete}
          title={!setupComplete ? "Finish setup above before you can post" : undefined}
        >
          {running ? "Posting…" : "Post ready video(s) now"}
        </button>
      </div>

      {runError && <div className="card p-4 mb-6 border-rose/40 text-rose text-xs">{runError}</div>}
      {runResult && (
        <div className="card p-4 mb-6 text-xs">
          <p className="label mb-2">Last run · {runResult.processed} row(s) processed</p>
          {runResult.processed === 0 ? (
            <p className="text-muted">No rows with status "ready" were found.</p>
          ) : (
            <div className="grid gap-2">
              {runResult.results.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span className="text-ivory truncate">
                    {r.title || `Row ${r.sheetRow}`} <span className="text-muted">· {r.platform}</span>
                  </span>
                  {r.ok ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-teal font-mono shrink-0">
                      posted ↗
                    </a>
                  ) : (
                    <span className="text-rose font-mono shrink-0">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-8 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <PipelineHero />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="card p-5">
          <p className="label mb-3">Sheet connection</p>
          {sheet ? (
            <div className="grid gap-1.5 text-sm">
              <p>
                <span className="text-muted">Tab:</span> <span className="font-mono text-xs">{sheet.tabName}</span>
              </p>
              <p>
                <span className="text-muted">Video column:</span>{" "}
                <span className="font-mono text-xs text-teal">{sheet.mapping?.video || "—"}</span>
              </p>
              <p>
                <span className="text-muted">Local video folder:</span>{" "}
                <span className="font-mono text-xs text-teal">{sheet.localFolder || "— (URLs only)"}</span>
              </p>
              <p>
                <span className="text-muted">Platforms column:</span>{" "}
                <span className="font-mono text-xs text-teal">{sheet.mapping?.platforms || "—"}</span>
              </p>
              <p>
                <span className="text-muted">Status column:</span>{" "}
                <span className="font-mono text-xs text-teal">{sheet.mapping?.status || "—"}</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted">Not connected yet — see Step 02.</p>
          )}
        </div>

        <div className="card p-5">
          <p className="label mb-3">
            Connected platforms ({connectors.length}/{(activeUser.enabledPlatforms || []).length || 0} selected)
          </p>
          {(activeUser.enabledPlatforms || []).length === 0 ? (
            <p className="text-xs text-muted">No platforms selected yet — see Step 03.</p>
          ) : connectors.length === 0 ? (
            <p className="text-xs text-muted">Platforms selected, but no keys saved yet — see Step 03.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {connectors.map((c) => (
                <span key={c.id} className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-teal/40 text-teal bg-teal/10">
                  ● {c.platform}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 mt-4 border-dashed">
        <p className="text-xs text-muted">
          <span className="text-ivory font-medium">How posting works:</span> pick a batch size,
          click "Post ready video(s) now" — the server finds rows with status "ready", posts them
          one at a time to the platforms listed in each row's platforms column, records each
          platform's result, and writes the row's overall status back into the sheet before moving
          to the next row. Only YouTube actually posts right now — other platforms show "not built
          yet" until added. Requires the local server (<code className="font-mono">npm run server</code>)
          to be running.
        </p>
      </div>
    </div>
  );
}

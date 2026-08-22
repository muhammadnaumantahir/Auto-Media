import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { watchSheetConfig, watchConnectors } from "../lib/firestore";
import { runPostingForUser } from "../lib/runPosting";
import { useToast } from "../context/ToastContext";
import PipelineHero from "../components/PipelineHero";

export default function Dashboard() {
  const { activeUser } = useApp();
  const toast = useToast();
  const [sheet, setSheet] = useState(null);
  const [connectors, setConnectors] = useState([]);
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
      const res = await runPostingForUser({ sheet, connectors });
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
      <header className="mb-6 flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <p className="label">Step 04 · {activeUser.name}</p>
          <h1 className="font-display text-2xl font-semibold">Overview</h1>
          <p className="text-muted text-sm mt-1">
            One row on the sheet becomes one queued post, fanned out to every connected platform.
          </p>
        </div>
        <button
          className="btn-ghost whitespace-nowrap"
          onClick={handleRunNow}
          disabled={running || !setupComplete}
          title={!setupComplete ? "Finish setup below before you can post" : undefined}
        >
          {running ? "Posting…" : "Post ready rows now"}
        </button>
      </header>

      <div
        className="flex flex-wrap gap-2 mb-6 animate-fade-up"
        style={{ animationDelay: "20ms" }}
      >
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

      {runError && (
        <div className="card p-4 mb-6 border-rose/40 text-rose text-xs">{runError}</div>
      )}
      {runResult && (
        <div className="card p-4 mb-6 text-xs">
          <p className="label mb-2">Last run</p>
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
                <span className="text-muted">Tab:</span>{" "}
                <span className="font-mono text-xs">{sheet.tabName}</span>
              </p>
              <p>
                <span className="text-muted">Video column:</span>{" "}
                <span className="font-mono text-xs text-teal">{sheet.mapping?.video || "—"}</span>
              </p>
              <p>
                <span className="text-muted">Title column:</span>{" "}
                <span className="font-mono text-xs text-teal">{sheet.mapping?.title || "—"}</span>
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
                <span
                  key={c.id}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-teal/40 text-teal bg-teal/10"
                >
                  ● {c.platform}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 mt-4 border-dashed">
        <p className="text-xs text-muted">
          <span className="text-ivory font-medium">How posting works:</span> click "Post ready
          rows now" to read every row where the status column reads exactly "ready", upload each
          to the platforms listed in its platforms column, and show the result here. Only YouTube
          actually posts right now — other platforms will show "not built yet" until added. This
          doesn't run automatically or write the result back into your sheet yet — update each
          row's status by hand for now.
        </p>
      </div>
    </div>
  );
}

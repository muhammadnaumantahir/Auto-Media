import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { useApp } from "../context/AppContext";
import { watchSheetConfig, watchConnectors } from "../lib/firestore";
import { functions } from "../firebase";
import PipelineHero from "../components/PipelineHero";

export default function Dashboard() {
  const { activeUser } = useApp();
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
      const runPostingNow = httpsCallable(functions, "runPostingNow");
      const res = await runPostingNow({ userId: activeUser.id });
      setRunResult(res.data);
    } catch (err) {
      setRunError(err.message || "The posting job failed to run.");
    } finally {
      setRunning(false);
    }
  }

  if (!activeUser) {
    return <p className="text-muted text-sm">Add a user first, then come back to this step.</p>;
  }

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
        <button className="btn-ghost whitespace-nowrap" onClick={handleRunNow} disabled={running}>
          {running ? "Running…" : "Run posting job now"}
        </button>
      </header>

      {runError && (
        <div className="card p-4 mb-6 border-rose/40 text-rose text-xs">{runError}</div>
      )}
      {runResult && (
        <div className="card p-4 mb-6 text-xs">
          <p className="label mb-2">Last run</p>
          {runResult.skipped ? (
            <p className="text-muted">Skipped: {runResult.skipped}</p>
          ) : (
            <p className="text-muted">
              Processed {runResult.processed} ready row{runResult.processed === 1 ? "" : "s"}.
            </p>
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
                <span className="text-muted">Video name:</span>{" "}
                <span className="font-mono text-xs text-teal">{sheet.mapping?.videoName}</span>
              </p>
              <p>
                <span className="text-muted">Video link:</span>{" "}
                <span className="font-mono text-xs text-teal">{sheet.mapping?.videoLink}</span>
              </p>
              <p>
                <span className="text-muted">Status:</span>{" "}
                <span className="font-mono text-xs text-teal">{sheet.mapping?.status}</span>
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
          <span className="text-ivory font-medium">How posting works:</span> every 15 minutes
          (or on demand above), the posting job reads rows where status = "ready" from this
          user's sheet, publishes to each selected & connected platform, then writes "posted"
          (or the error) back.
        </p>
      </div>
    </div>
  );
}

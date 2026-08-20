import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function DebugPanel() {
  const { watcherError, clearWatcherError } = useApp();
  const [expanded, setExpanded] = useState(true);

  if (!watcherError) return null;

  const message = watcherError?.message || String(watcherError);
  const stack = watcherError?.stack || null;

  return (
    <div className="fixed right-4 bottom-4 z-50 w-96 max-w-full">
      <div className="card p-3 border-rose/40 bg-rose/6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-ivory font-medium">Firestore watcher error</p>
            <p className="text-xs text-muted mt-1">{message}</p>
          </div>
          <div className="flex items-start gap-2">
            <button
              className="btn-ghost text-xs"
              onClick={() => setExpanded((s) => !s)}
              aria-expanded={expanded}
            >
              {expanded ? "Hide" : "Show"}
            </button>
            <button
              className="btn-primary text-xs"
              onClick={() => {
                clearWatcherError();
              }}
            >
              Dismiss
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3">
            <pre className="text-xs font-mono text-muted whitespace-pre-wrap">{stack || message}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

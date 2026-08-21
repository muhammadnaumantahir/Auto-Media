import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { saveConnector, removeConnector, watchConnectors, setEnabledPlatforms } from "../lib/firestore";
import { PLATFORMS } from "../lib/platforms";
import PlatformCard from "../components/PlatformCard";
import PlatformPicker from "../components/PlatformPicker";
import AppCredentialsCard from "../components/AppCredentialsCard";

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
  const selected = activeUser.enabledPlatforms || [];

  function handleToggle(platformId) {
    const next = selected.includes(platformId)
      ? selected.filter((id) => id !== platformId)
      : [...selected, platformId];
    setEnabledPlatforms(activeUser.id, next);
  }

  const selectedPlatforms = PLATFORMS.filter((p) => selected.includes(p.id));

  return (
    <div className="max-w-5xl">
      <header className="mb-8 animate-fade-up">
        <p className="label">Step 03 · {activeUser.name}</p>
        <h1 className="font-display text-2xl font-semibold">Choose platforms &amp; add keys</h1>
        <p className="text-muted text-sm mt-1">
          Tap the platforms {activeUser.name.split(" ")[0]} actually posts to — only those show a
          form below, and only those get used when the posting job runs.
        </p>
      </header>

      <div className="card p-6 mb-8 animate-fade-up" style={{ animationDelay: "40ms" }}>
        <PlatformPicker selected={selected} onToggle={handleToggle} />
      </div>

      {selectedPlatforms.length === 0 ? (
        <div className="card p-10 text-center animate-fade-up" style={{ animationDelay: "80ms" }}>
          <p className="text-sm text-ivory font-medium mb-1">No platforms selected yet</p>
          <p className="text-xs text-muted">Pick at least one above to configure its account keys.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {selectedPlatforms.map((p, i) => (
            <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${80 + i * 40}ms` }}>
              {p.appFields && <AppCredentialsCard platform={p} />}
              <PlatformCard
                platform={p}
                saved={savedMap[p.id]}
                onSave={(id, values) => saveConnector(activeUser.id, id, values)}
                onRemove={(id) => removeConnector(activeUser.id, id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

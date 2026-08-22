import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { testYoutubeConnection } from "../lib/serverApi";
import { getPlatformApp } from "../lib/platformApps";

export default function PlatformCard({ platform, saved, onSave, onRemove }) {
  const [values, setValues] = useState(() => {
    const initial = {};
    platform.fields.forEach((f) => {
      initial[f.key] = saved?.[f.key] || "";
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const toast = useToast();

  // `saved` often arrives a tick after this component first mounts (it's
  // read via an async watcher), so the useState initializer above can run
  // before real data exists. Re-sync whenever a fresh `saved` value shows
  // up so the fields don't stay stuck blank until the card happens to
  // remount.
  useEffect(() => {
    const next = {};
    platform.fields.forEach((f) => {
      next[f.key] = saved?.[f.key] || "";
    });
    setValues(next);
  }, [saved, platform.fields]);

  const isConnected = !!saved;
  const allFilled = platform.fields.every((f) => values[f.key]?.trim());

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(platform.id, values);
      toast.success(`${platform.name} connected.`);
    } catch (err) {
      toast.error(err.message || `Could not save ${platform.name}.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    try {
      await onRemove(platform.id);
      toast.success(`${platform.name} disconnected.`);
    } catch (err) {
      toast.error(err.message || `Could not disconnect ${platform.name}.`);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      if (platform.id === "youtube") {
        const app = getPlatformApp("youtube");
        await testYoutubeConnection({
          clientId: app?.clientId,
          clientSecret: app?.clientSecret,
          refreshToken: values.refreshToken,
        });
        toast.success("YouTube connection works — token refreshed successfully.");
      }
    } catch (err) {
      toast.error(err.message || "Connection test failed.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm"
            style={{ background: `${platform.color}1A`, color: platform.color }}
          >
            {platform.short}
          </div>
          <div>
            <p className="font-display font-semibold text-sm">{platform.name}</p>
            <p className="text-[11px] text-muted">{platform.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`text-[10px] font-mono px-2 py-1 rounded-full border ${
              isConnected
                ? "border-teal/40 text-teal bg-teal/10"
                : "border-border text-muted"
            }`}
          >
            {isConnected ? "● connected" : "○ not connected"}
          </span>
          <Link
            to={`/guides?platform=${platform.id}`}
            className="text-[10px] text-muted hover:text-violet transition-colors"
          >
            Setup guide ↗
          </Link>
        </div>
      </div>

      <div className="grid gap-3">
        {platform.fields.map((f) => {
          const id = `${platform.id}-${f.key}`;
          return (
            <div key={f.key}>
              <label htmlFor={id} className="label">
                {f.label}
              </label>
              <input
                id={id}
                name={f.key}
                aria-label={f.label}
                autoComplete="off"
                type={f.secret ? "password" : "text"}
                className="input font-mono text-xs"
                placeholder={f.placeholder}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          className="btn-primary flex-1 disabled:cursor-not-allowed"
          disabled={!allFilled || saving}
          onClick={handleSave}
          aria-disabled={!allFilled || saving}
        >
          {saving ? (
            <span aria-live="polite">Saving…</span>
          ) : isConnected ? (
            "Update keys"
          ) : (
            "Save & connect"
          )}
        </button>
        {isConnected && (
          <button className="btn-ghost" onClick={handleRemove}>
            Disconnect
          </button>
        )}
        {platform.id === "youtube" && isConnected && (
          <button className="btn-ghost" onClick={handleTest} disabled={testing}>
            {testing ? "Testing…" : "Test connection"}
          </button>
        )}
      </div>
    </div>
  );
}

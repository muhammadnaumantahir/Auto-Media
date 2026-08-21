import { useEffect, useState } from 'react';
import { getPlatformApp, savePlatformApp, watchPlatformApp } from '../lib/platformApps';
import { useToast } from '../context/ToastContext';

export default function AppCredentialsCard({ platform }) {
  const [values, setValues] = useState(() => {
    const initial = {};
    platform.appFields.forEach((f) => {
      initial[f.key] = getPlatformApp(platform.id)?.[f.key] || '';
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!getPlatformApp(platform.id));
  const toast = useToast();

  useEffect(() => watchPlatformApp(platform.id, (app) => setSaved(!!app)), [platform.id]);

  async function handleSave() {
    setSaving(true);
    try {
      await savePlatformApp(platform.id, values);
      toast.success(`${platform.name} app credentials saved.`);
    } catch (err) {
      toast.error(err.message || 'Could not save app credentials.');
    } finally {
      setSaving(false);
    }
  }

  const allFilled = platform.appFields.every((f) => values[f.key]?.trim());

  return (
    <div className="card p-5 mb-6 border-violet/30">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-semibold text-sm">{platform.name} app credentials</p>
          <p className="text-[11px] text-muted mt-0.5">
            Configured once — shared by every user you add. Each user then only needs their own
            refresh token and channel below.
          </p>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-1 rounded-full border whitespace-nowrap ${
            saved ? 'border-teal/40 text-teal bg-teal/10' : 'border-border text-muted'
          }`}
        >
          {saved ? '● configured' : '○ not configured'}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {platform.appFields.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            <input
              type={f.secret ? 'password' : 'text'}
              className="input font-mono text-xs"
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <button
        className="btn-primary mt-4"
        disabled={!allFilled || saving}
        onClick={handleSave}
      >
        {saving ? 'Saving…' : 'Save app credentials'}
      </button>
    </div>
  );
}

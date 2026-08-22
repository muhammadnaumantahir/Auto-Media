import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { saveSheetConfig, watchSheetConfig } from '../lib/firestore';
import { previewSheet } from '../lib/serverApi';
import { useToast } from '../context/ToastContext';

const FIELDS = [
  ['video', 'Video (URL or local filename)', 'required'],
  ['title', 'Title', 'required'],
  ['description', 'Description / caption'],
  ['tags', 'Tags / hashtags'],
  ['thumbnail', 'Thumbnail URL'],
  ['schedule', 'Schedule date/time'],
  ['platforms', 'Platforms'],
  ['status', 'Status', 'required'],
  ['destinationUrl', 'Destination URL'],
];

export default function SheetSetup() {
  const { activeUser } = useApp();
  const toast = useToast();
  const [cfg, setCfg] = useState({
    sheetUrl: '',
    tabName: 'Sheet1',
    localFolder: '',
    headers: [],
    mapping: {},
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => activeUser && watchSheetConfig(activeUser.id, (x) => x && setCfg((c) => ({ ...c, ...x }))), [activeUser]);

  if (!activeUser) return <p className="text-muted">Create a profile first.</p>;

  async function handlePreview() {
    setBusy(true);
    setMsg('');
    try {
      const { headers } = await previewSheet({ sheetUrl: cfg.sheetUrl, tabName: cfg.tabName });
      const auto = { ...cfg.mapping };
      FIELDS.forEach(([k, label]) => {
        if (!auto[k]) {
          const hit = headers.find(
            (h) =>
              h.toLowerCase().replace(/[_\s-]/g, '').includes(k.toLowerCase().replace(/[_\s-]/g, '')) ||
              h.toLowerCase().includes(label.split(' ')[0].toLowerCase())
          );
          if (hit) auto[k] = hit;
        }
      });
      setCfg((c) => ({ ...c, headers, mapping: auto }));
      setMsg('Headers loaded. Review the automatic matches.');
      toast.success(`Loaded ${headers.length} columns from the sheet.`);
    } catch (err) {
      setMsg(err.message);
      toast.error(err.message || 'Could not read the sheet.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveMapping() {
    setBusy(true);
    try {
      await saveSheetConfig(activeUser.id, cfg);
      setMsg('Saved successfully.');
      toast.success('Sheet mapping saved.');
    } catch (err) {
      setMsg(err.message || 'Could not save.');
      toast.error(err.message || 'Could not save the sheet mapping.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <p className="label">Content source</p>
        <h1 className="font-display text-3xl font-semibold">Sheet & video source</h1>
        <p className="text-muted mt-2">
          Auto-Media remembers this setup for {activeUser.name}. It reads and writes this sheet
          through your local server, so it can mark rows "posted" automatically.
        </p>
      </header>

      <div className="card p-6 grid gap-4">
        <div className="grid md:grid-cols-[1fr,180px] gap-4">
          <input
            className="input"
            placeholder="Google Sheet URL or ID"
            value={cfg.sheetUrl || ''}
            onChange={(e) => setCfg({ ...cfg, sheetUrl: e.target.value })}
          />
          <input
            className="input"
            placeholder="Tab name"
            value={cfg.tabName || 'Sheet1'}
            onChange={(e) => setCfg({ ...cfg, tabName: e.target.value })}
          />
        </div>

        <div>
          <label className="label block mb-1.5">Local video folder (optional)</label>
          <input
            className="input font-mono text-xs"
            placeholder={'e.g. D:\\AutoMedia\\Videos or /Users/you/Videos'}
            value={cfg.localFolder || ''}
            onChange={(e) => setCfg({ ...cfg, localFolder: e.target.value })}
          />
          <p className="text-[11px] text-muted mt-1.5">
            When a row's video cell isn't a URL, the server looks for a file with that name (any
            extension) in this folder — so the sheet just needs "clip1" and the folder can hold
            "clip1.mp4". Leave blank to always require a URL or Google Drive link instead.
          </p>
        </div>

        <div>
          <button className="btn-primary" onClick={handlePreview} disabled={busy || !cfg.sheetUrl}>
            {busy ? 'Reading…' : 'Read & auto-detect columns'}
          </button>
          {msg && <span className="ml-3 text-xs text-muted">{msg}</span>}
        </div>
      </div>

      {cfg.headers?.length > 0 && (
        <>
          <div className="card p-6 mt-6">
            <div className="flex justify-between">
              <h2 className="font-semibold">Map your columns</h2>
              <span className="text-xs text-muted">{cfg.headers.length} columns found</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-5">
              {FIELDS.map(([k, l, r]) => (
                <label key={k}>
                  <span className="label">
                    {l} {r && <b className="text-rose">*</b>}
                  </span>
                  <select
                    className="input"
                    value={cfg.mapping?.[k] || ''}
                    onChange={(e) => setCfg({ ...cfg, mapping: { ...cfg.mapping, [k]: e.target.value } })}
                  >
                    <option value="">Not mapped</option>
                    {cfg.headers.map((h) => (
                      <option key={h}>{h}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="card p-6 mt-6 border-dashed">
            <p className="text-sm text-muted">
              <span className="text-ivory font-medium">How the status column works:</span> a row is
              only posted when this column reads exactly "ready". After posting, the server writes
              "posted" (or "failed: &lt;platform&gt;") back here automatically — you never need to
              edit it by hand.
            </p>
          </div>

          <button className="btn-primary mt-6" onClick={handleSaveMapping} disabled={busy}>
            {busy ? 'Saving…' : 'Save mapping'}
          </button>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../lib/api';

const PLATFORMS = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'snapchat', label: 'Snapchat' },
  { key: 'tiktok', label: 'TikTok' },
];

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Google form state
  const [email, setEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [savingGoogle, setSavingGoogle] = useState(false);
  const [testing, setTesting] = useState(false);

  // Platform credentials form state
  const [platformForm, setPlatformForm] = useState({});
  const [savingPlatform, setSavingPlatform] = useState('');

  const load = () => {
    api
      .get('/settings')
      .then(({ data }) => {
        setSettings(data.settings);
        setEmail(data.settings.googleServiceAccountEmail || '');
        setSheetUrl(data.settings.masterSheetId || '');
        const pf = {};
        for (const p of PLATFORMS) {
          pf[p.key] = { clientId: data.settings.platformCredentials?.[p.key]?.clientId || '', clientSecret: '' };
        }
        setPlatformForm(pf);
      })
      .catch((err) => setError(err.response?.data?.error || 'Could not load settings'));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveGoogle = async (e) => {
    e.preventDefault();
    setError('');
    setTestResult(null);
    setSavingGoogle(true);
    try {
      const { data } = await api.put('/settings', {
        googleServiceAccountEmail: email,
        googleServiceAccountPrivateKey: privateKey || undefined,
        masterSheetUrl: sheetUrl,
      });
      setSettings(data.settings);
      setPrivateKey('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save settings');
    } finally {
      setSavingGoogle(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await api.post('/settings/test');
      setTestResult({ ok: true, message: `Connected — found sheet "${data.sheetTitle}"` });
    } catch (err) {
      setTestResult({ ok: false, message: err.response?.data?.error || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSavePlatform = async (key) => {
    setSavingPlatform(key);
    setError('');
    try {
      const { data } = await api.put('/settings', {
        platformCredentials: {
          [key]: {
            clientId: platformForm[key]?.clientId || '',
            clientSecret: platformForm[key]?.clientSecret || undefined,
          },
        },
      });
      setSettings(data.settings);
      setPlatformForm((f) => ({ ...f, [key]: { ...f[key], clientSecret: '' } }));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save platform credentials');
    } finally {
      setSavingPlatform('');
    }
  };

  if (!settings && !error) return <p>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Setup</span>
        <h1>Settings</h1>
        <p>Configure Auto Media here — no environment variables needed.</p>
      </div>

      {error && <div className="error-text">{error}</div>}

      {/* --- Google Sheets --- */}
      <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>Google Sheets connection</h3>
        <p style={{ marginBottom: 16 }}>
          Create a Google service account, then paste its details here. This account is used to
          read your master Users list and every user's video sheet.
        </p>

        {settings?.isGoogleConfigured && (
          <div style={{ marginBottom: 16 }}>
            <span className="status-chip posted">Configured</span>
          </div>
        )}

        <form onSubmit={handleSaveGoogle}>
          <div className="field">
            <label htmlFor="gEmail">Service account email</label>
            <input
              id="gEmail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@project-id.iam.gserviceaccount.com"
            />
          </div>
          <div className="field">
            <label htmlFor="gKey">
              Private key {settings?.hasGoogleServiceAccountKey && '(already saved — leave blank to keep it)'}
            </label>
            <textarea
              id="gKey"
              rows={5}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
            />
          </div>
          <div className="field">
            <label htmlFor="sheetUrl">Master Google Sheet URL (or ID)</label>
            <input
              id="sheetUrl"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
            />
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
              Create a blank sheet, then share it as Editor with the service account email above.
            </p>
          </div>

          <button className="btn btn-primary" type="submit" disabled={savingGoogle} style={{ marginRight: 8 }}>
            {savingGoogle ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTest}
            disabled={testing || !settings?.isGoogleConfigured}
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
        </form>

        {testResult && (
          <p style={{ marginTop: 12, color: testResult.ok ? 'var(--success, green)' : 'var(--danger, crimson)' }}>
            {testResult.message}
          </p>
        )}
      </div>

      {/* --- Platform credentials --- */}
      <div className="card" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 4 }}>Platform API credentials</h3>
        <p style={{ marginBottom: 16 }}>
          Add each platform's developer app credentials here. These are shared across all users;
          each user still connects their own account separately when posting is wired up.
        </p>

        {PLATFORMS.map((p) => {
          const saved = settings?.platformCredentials?.[p.key];
          return (
            <div key={p.key} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border, #eee)' }}>
              <strong>{p.label}</strong>
              {saved?.hasClientSecret && (
                <span className="status-chip posted" style={{ marginLeft: 8 }}>
                  Configured
                </span>
              )}
              <div className="field" style={{ marginTop: 8 }}>
                <label>Client ID</label>
                <input
                  value={platformForm[p.key]?.clientId || ''}
                  onChange={(e) =>
                    setPlatformForm((f) => ({ ...f, [p.key]: { ...f[p.key], clientId: e.target.value } }))
                  }
                />
              </div>
              <div className="field">
                <label>Client secret {saved?.hasClientSecret && '(leave blank to keep it)'}</label>
                <input
                  type="password"
                  value={platformForm[p.key]?.clientSecret || ''}
                  onChange={(e) =>
                    setPlatformForm((f) => ({ ...f, [p.key]: { ...f[p.key], clientSecret: e.target.value } }))
                  }
                />
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => handleSavePlatform(p.key)}
                disabled={savingPlatform === p.key}
              >
                {savingPlatform === p.key ? 'Saving…' : `Save ${p.label}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

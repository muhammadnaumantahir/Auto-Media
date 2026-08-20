import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';

const FIELDS = [
  { key: 'videoLink', label: 'Video link column', required: true },
  { key: 'title', label: 'Title column', required: true },
  { key: 'description', label: 'Description column', required: false },
  { key: 'status', label: 'Status column', required: true },
  { key: 'platforms', label: 'Platforms column', required: true },
];

const ALL_PLATFORMS = [
  { key: 'youtube', label: 'YouTube' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'snapchat', label: 'Snapchat' },
  { key: 'tiktok', label: 'TikTok' },
];

export default function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  // Sheet linking state
  const [sheetUrl, setSheetUrl] = useState('');
  const [headers, setHeaders] = useState(null);
  const [mapping, setMapping] = useState({});
  const [sheetLoading, setSheetLoading] = useState(false);

  // Platforms state
  const [platforms, setPlatforms] = useState([]);
  const [platformsSaving, setPlatformsSaving] = useState(false);

  const loadUser = () => {
    api
      .get(`/users/${id}`)
      .then(({ data }) => {
        setUser(data.user);
        setPlatforms(data.user.enabledPlatforms || []);
        setSheetUrl(data.user.videoSheetUrl || '');
      })
      .catch((err) => setError(err.response?.data?.error || 'Could not load user'));
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePreview = async (e) => {
    e.preventDefault();
    setError('');
    setSheetLoading(true);
    try {
      const { data } = await api.post(`/users/${id}/sheet/preview`, { sheetUrl });
      setHeaders(data.headers);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not read that sheet. Double-check the link and sharing settings.'
      );
    } finally {
      setSheetLoading(false);
    }
  };

  const handleLinkSheet = async () => {
    setError('');
    setSheetLoading(true);
    try {
      const { data } = await api.post(`/users/${id}/sheet`, { sheetUrl, columnMapping: mapping });
      setUser(data.user);
      setHeaders(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not link this sheet. Try again.');
    } finally {
      setSheetLoading(false);
    }
  };

  const handleUnlinkSheet = async () => {
    setSheetLoading(true);
    try {
      const { data } = await api.delete(`/users/${id}/sheet`);
      setUser(data.user);
      setSheetUrl('');
      setHeaders(null);
      setMapping({});
    } finally {
      setSheetLoading(false);
    }
  };

  const togglePlatform = (key) => {
    setPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const savePlatforms = async () => {
    setPlatformsSaving(true);
    setError('');
    try {
      const { data } = await api.put(`/users/${id}/platforms`, { platforms });
      setUser(data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save platforms');
    } finally {
      setPlatformsSaving(false);
    }
  };

  const requiredFilled = FIELDS.filter((f) => f.required).every((f) => mapping[f.key]);

  if (!user && !error) return <p>Loading…</p>;
  if (!user) return <div className="error-text">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <Link to="/" className="muted-link">
          ← All users
        </Link>
        <span className="eyebrow">User</span>
        <h1>
          {user.firstName} {user.lastName}
        </h1>
        {user.email && <p>{user.email}</p>}
      </div>

      {error && <div className="error-text">{error}</div>}

      {/* --- Video sheet --- */}
      <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Video sheet</h3>

        {user.videoSheetUrl && !headers && (
          <>
            <p style={{ marginBottom: 16, wordBreak: 'break-all' }}>{user.videoSheetUrl}</p>
            <button className="btn btn-secondary" onClick={handleUnlinkSheet} disabled={sheetLoading}>
              {sheetLoading ? 'Unlinking…' : 'Unlink sheet'}
            </button>
          </>
        )}

        {(!user.videoSheetUrl || headers) && (
          <>
            <p style={{ marginBottom: 16 }}>
              Paste the URL of this user's Google Sheet. Make sure it's shared as <strong>Editor</strong>{' '}
              with the service account email from your Auto Media setup.
            </p>
            <form onSubmit={handlePreview}>
              <div className="field">
                <label htmlFor="sheetUrl">Google Sheet URL</label>
                <input
                  id="sheetUrl"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  required
                />
              </div>
              {!headers && (
                <button type="submit" className="btn btn-primary" disabled={sheetLoading}>
                  {sheetLoading ? 'Reading sheet…' : 'Read columns'}
                </button>
              )}
            </form>

            {headers && (
              <div style={{ marginTop: 24 }}>
                <p style={{ marginBottom: 16 }}>
                  Found {headers.length} columns. Map the ones Auto Media needs:
                </p>
                <div className="mapping-grid">
                  {FIELDS.map((f) => (
                    <div className="field" key={f.key}>
                      <label>
                        {f.label}
                        {!f.required && ' (optional)'}
                      </label>
                      <select
                        value={mapping[f.key] || ''}
                        onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                      >
                        <option value="">Select column…</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-primary"
                  disabled={!requiredFilled || sheetLoading}
                  onClick={handleLinkSheet}
                  style={{ marginTop: 8, marginRight: 8 }}
                >
                  {sheetLoading ? 'Saving…' : 'Link sheet'}
                </button>
                <button className="btn btn-secondary" onClick={() => setHeaders(null)} style={{ marginTop: 8 }}>
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- Platforms --- */}
      <div className="card" style={{ maxWidth: 640 }}>
        <h3 style={{ marginBottom: 4 }}>Posting platforms</h3>
        <p style={{ marginBottom: 16 }}>
          Choose which platforms this user's videos should be published to. You can connect each
          platform's account later.
        </p>
        <div className="platform-chips" style={{ marginBottom: 16, gap: 10 }}>
          {ALL_PLATFORMS.map((p) => {
            const active = platforms.includes(p.key);
            return (
              <button
                key={p.key}
                type="button"
                className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => togglePlatform(p.key)}
              >
                {active ? '✓ ' : ''}
                {p.label}
              </button>
            );
          })}
        </div>
        <button className="btn btn-primary" onClick={savePlatforms} disabled={platformsSaving}>
          {platformsSaving ? 'Saving…' : 'Save platforms'}
        </button>
      </div>
    </div>
  );
}

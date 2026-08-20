import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';

const FIELDS = [
  { key: 'videoLink', label: 'Video link column', required: true },
  { key: 'title', label: 'Title column', required: true },
  { key: 'description', label: 'Description column', required: false },
  { key: 'status', label: 'Status column', required: true },
  { key: 'platforms', label: 'Platforms column', required: true },
];

export default function ConnectSheet() {
  const [sheetUrl, setSheetUrl] = useState('');
  const [headers, setHeaders] = useState(null);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { reloadUser } = useAuth();
  const navigate = useNavigate();

  const handlePreview = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/sheets/preview', { sheetUrl });
      setHeaders(data.headers);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Could not read that sheet. Double-check the link and sharing settings.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/sheets/connect', { sheetUrl, columnMapping: mapping });
      await reloadUser();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save this sheet. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const requiredFilled = FIELDS.filter((f) => f.required).every((f) => mapping[f.key]);

  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Setup</span>
        <h1>Connect your video sheet</h1>
        <p>Auto Media reads videos from your own Google Sheet and writes status back into it.</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="step-list">
          <div className="step-item">
            <span className="step-index">01</span>
            <div className="step-body">
              <strong>Share your sheet</strong>
              <p>
                Open your video sheet in Google Sheets and share it, as <strong>Editor</strong>,
                with the service account email shown in your Auto Media setup (ask whoever
                deployed the app if you don't have it).
              </p>
            </div>
          </div>
          <div className="step-item">
            <span className="step-index">02</span>
            <div className="step-body">
              <strong>Paste the link</strong>
              <p>Paste the sheet's URL below and we'll read its column headers.</p>
            </div>
          </div>
          <div className="step-item">
            <span className="step-index">03</span>
            <div className="step-body">
              <strong>Map your columns</strong>
              <p>Tell us which column holds each piece of information.</p>
            </div>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Reading sheet…' : 'Read columns'}
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
              disabled={!requiredFilled || loading}
              onClick={handleConnect}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Saving…' : 'Connect sheet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

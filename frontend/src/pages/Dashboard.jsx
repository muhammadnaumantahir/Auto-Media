import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';

function rowLabel(index) {
  // Mimics spreadsheet row references: A2, A3, ... (row 1 is the header)
  return `A${index + 2}`;
}

function statusClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'posted') return 'posted';
  if (s === 'pending' || s === 'processing') return 'pending';
  if (s === 'failed') return 'failed';
  return 'draft';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.videoSheetUrl) {
      setLoading(false);
      return;
    }
    api
      .get('/videos')
      .then(({ data }) => setVideos(data.videos))
      .catch((err) => setError(err.response?.data?.error || 'Could not load videos'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user?.videoSheetUrl) {
    return (
      <div>
        <div className="page-header">
          <span className="eyebrow">Dashboard</span>
          <h1>Welcome to Auto Media</h1>
        </div>
        <div className="empty-state">
          <h3>No sheet connected yet</h3>
          <p>Connect your Google Sheet to start seeing your videos and their posting status.</p>
          <Link to="/connect-sheet" className="btn btn-primary">
            Connect your sheet
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Dashboard</span>
        <h1>Your videos</h1>
        <p>Read live from your connected sheet.</p>
      </div>

      {error && <div className="error-text">{error}</div>}

      {loading && <p>Loading…</p>}

      {!loading && videos && videos.length === 0 && (
        <div className="empty-state">
          <h3>No rows yet</h3>
          <p>Add a video link to your sheet and it will show up here.</p>
        </div>
      )}

      {!loading && videos && videos.length > 0 && (
        <div className="sheet-table-wrap">
          <table className="sheet-table">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Status</th>
                <th>Platforms</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.rowIndex}>
                  <td className="cell-ref">{rowLabel(v.rowIndex)}</td>
                  <td>{v.title || <span style={{ color: 'var(--muted)' }}>Untitled</span>}</td>
                  <td>
                    <span className={`status-chip ${statusClass(v.status)}`}>
                      {v.status || 'draft'}
                    </span>
                  </td>
                  <td>
                    <div className="platform-chips">
                      {(v.platforms || '')
                        .split(',')
                        .map((p) => p.trim())
                        .filter(Boolean)
                        .map((p) => (
                          <span className="platform-chip" key={p}>
                            {p}
                          </span>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

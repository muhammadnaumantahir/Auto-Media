import { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { user, reloadUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.post('/sheets/disconnect');
      await reloadUser();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Settings</span>
        <h1>Account</h1>
      </div>

      <div className="card" style={{ maxWidth: 520, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Profile</h3>
        <p>
          {user?.firstName} {user?.lastName}
        </p>
        <p>{user?.email}</p>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <h3 style={{ marginBottom: 12 }}>Video sheet</h3>
        {user?.videoSheetUrl ? (
          <>
            <p style={{ marginBottom: 16, wordBreak: 'break-all' }}>{user.videoSheetUrl}</p>
            <button className="btn btn-secondary" onClick={handleDisconnect} disabled={loading}>
              {loading ? 'Disconnecting…' : 'Disconnect sheet'}
            </button>
          </>
        ) : (
          <p>No sheet connected.</p>
        )}
      </div>
    </div>
  );
}

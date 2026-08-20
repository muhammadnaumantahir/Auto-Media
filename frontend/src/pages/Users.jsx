import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Users() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = () => {
    api
      .get('/users')
      .then(({ data }) => setUsers(data.users))
      .catch((err) => setError(err.response?.data?.error || 'Could not load users'));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/users', { firstName, lastName, email: email || undefined });
      setFirstName('');
      setLastName('');
      setEmail('');
      setShowForm(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add user');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this user? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove user');
    }
  };

  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Auto Media</span>
        <h1>Users</h1>
        <p>Add a user, link their video sheet, then choose where their videos get posted.</p>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add user'}
        </button>
      </div>

      {showForm && (
        <form className="card" style={{ maxWidth: 480, marginBottom: 24 }} onSubmit={handleAddUser}>
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name (optional)</label>
            <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">Email (optional)</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="for your own reference"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Adding…' : 'Add user'}
          </button>
        </form>
      )}

      {users === null && !error && <p>Loading…</p>}

      {users && users.length === 0 && (
        <div className="empty-state">
          <h3>No users yet</h3>
          <p>Add your first user to link their Google Sheet and choose posting platforms.</p>
        </div>
      )}

      {users && users.length > 0 && (
        <div className="sheet-table-wrap">
          <table className="sheet-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Sheet</th>
                <th>Platforms</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link to={`/users/${u.id}`}>
                      {u.firstName} {u.lastName}
                    </Link>
                    {u.email && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</div>
                    )}
                  </td>
                  <td>
                    <span className={`status-chip ${u.videoSheetUrl ? 'posted' : 'draft'}`}>
                      {u.videoSheetUrl ? 'Linked' : 'Not linked'}
                    </span>
                  </td>
                  <td>
                    <div className="platform-chips">
                      {(u.enabledPlatforms || []).length === 0 && (
                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>None</span>
                      )}
                      {(u.enabledPlatforms || []).map((p) => (
                        <span className="platform-chip" key={p}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Link to={`/users/${u.id}`} className="btn btn-secondary" style={{ marginRight: 8 }}>
                      Manage
                    </Link>
                    <button className="btn btn-secondary" onClick={() => handleRemove(u.id)}>
                      Remove
                    </button>
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

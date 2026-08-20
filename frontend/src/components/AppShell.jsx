import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AM</span>
          Auto Media
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/connect-sheet"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            Video sheet
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            Settings
          </NavLink>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <p style={{ fontSize: 13, marginBottom: 8 }}>{user?.email}</p>
          <button className="btn btn-secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

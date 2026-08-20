import { NavLink, Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AM</span>
          Auto Media
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            Users
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            Settings
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

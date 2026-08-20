import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";

const steps = [
  { n: "01", to: "/", label: "Users", desc: "Add & manage" },
  { n: "02", to: "/sheet", label: "Sheet", desc: "Connect & map" },
  { n: "03", to: "/connectors", label: "Connectors", desc: "Platform keys" },
  { n: "04", to: "/dashboard", label: "Dashboard", desc: "Overview" },
];

export default function Sidebar() {
  const { users, activeUserId, setActiveUserId, activeUser } = useApp();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface/60 flex flex-col h-full">
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-teal flex items-center justify-center">
            <span className="font-display font-bold text-ink text-sm">R</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">Relay</span>
        </div>
        <p className="text-muted text-xs mt-1.5 font-mono">sheet &rarr; queue &rarr; platforms</p>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {steps.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            end={s.to === "/"}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive ? "bg-raised border border-border" : "hover:bg-raised/60"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`font-mono text-[11px] w-7 h-7 rounded-md flex items-center justify-center border ${
                    isActive
                      ? "border-violet text-violet bg-violet/10"
                      : "border-border text-muted"
                  }`}
                >
                  {s.n}
                </span>
                <span>
                  <span className={`block text-sm font-medium ${isActive ? "text-ivory" : "text-muted group-hover:text-ivory"}`}>
                    {s.label}
                  </span>
                  <span className="block text-[11px] text-muted">{s.desc}</span>
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <span className="label">Active user</span>
        {users.length === 0 ? (
          <p className="text-xs text-muted">No users yet</p>
        ) : (
          <select
            className="input text-sm"
            value={activeUserId || ""}
            onChange={(e) => setActiveUserId(e.target.value)}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
        {activeUser && (
          <p className="text-[11px] text-muted mt-2 truncate">{activeUser.email}</p>
        )}
      </div>
    </aside>
  );
}

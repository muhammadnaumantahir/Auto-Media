import { useState } from "react";
import { useApp } from "../context/AppContext";
import { createUser, deleteUser } from "../lib/firestore";
import { initials, avatarColor } from "../lib/avatar";
import { useToast } from "../context/ToastContext";

export default function Users() {
  const { users, loadingUsers, activeUserId, setActiveUserId } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Name and email are both required.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createUser({ name: name.trim(), email: email.trim() });
      setActiveUserId(result.id);
      if (result.exists) {
        setError("This user already exists — the existing profile is now active.");
      } else {
        toast.success(`${result.name} added.`);
      }
      setName("");
      setEmail("");
    } catch (err) {
      setError(err.message || "Could not save this user. Check your Firebase config.");
      toast.error(err.message || "Could not save this user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Remove ${user.name}? This deletes their sheet and connector setup too.`)) return;
    try {
      await deleteUser(user.id);
      toast.success(`${user.name} removed.`);
    } catch (err) {
      toast.error(err.message || "Could not remove this user.");
    }
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-8 animate-fade-up">
        <p className="label">Step 01</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Your workspace</h1>
        <p className="text-muted text-sm mt-1">
          Create or select a profile. Everything is saved in Firebase and restored automatically after refresh.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="card p-6 md:p-8 grid gap-5 mb-10 animate-fade-up" style={{ animationDelay: "40ms" }}>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <span className="label">Full name</span>
            <input
              className="input"
              placeholder="Amelia Ruiz"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <span className="label">Email</span>
            <input
              className="input"
              placeholder="amelia@studio.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-amber text-xs rounded-lg border border-amber/20 bg-amber/5 px-3 py-2">{error}</p>}
        <div>
          <button className="btn-primary" disabled={submitting}>
            {submitting ? "Adding…" : "Add user"}
          </button>
        </div>
      </form>

      <p className="label mb-3">All users</p>
      {loadingUsers ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : users.length === 0 ? (
        <div className="card p-10 text-center animate-fade-up">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-violet/10 border border-violet/30 flex items-center justify-center mb-3">
            <span className="text-violet text-lg">＋</span>
          </div>
          <p className="text-sm text-ivory font-medium mb-1">No users yet</p>
          <p className="text-xs text-muted">Add the first one above to start the setup flow.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {users.map((u, i) => {
            const color = avatarColor(u.name);
            const isActive = u.id === activeUserId;
            const platformCount = (u.enabledPlatforms || []).length;
            return (
              <div
                key={u.id}
                className={`card p-4 flex items-center justify-between transition-all animate-fade-up ${
                  isActive ? "border-violet/50 shadow-glow" : "hover:border-muted"
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-display font-semibold text-sm"
                    style={{ background: color.bg, color: color.fg }}
                  >
                    {initials(u.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{u.name}</p>
                    <p className="text-muted text-xs truncate">{u.email}</p>
                    <div className="flex gap-1.5 mt-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          u.sheetConnected
                            ? "border-teal/40 text-teal bg-teal/10"
                            : "border-border text-muted"
                        }`}
                      >
                        sheet {u.sheetConnected ? "linked" : "unlinked"}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border text-muted">
                        {platformCount} platform{platformCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0 pl-2">
                  <button
                    className={isActive ? "text-xs text-teal font-medium" : "btn-ghost text-xs"}
                    onClick={() => setActiveUserId(u.id)}
                  >
                    {isActive ? "● Active" : "Set active"}
                  </button>
                  <button
                    className="text-xs text-rose hover:underline"
                    onClick={() => handleDelete(u)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted mt-8">
        Backups, cloud sync and the scheduler are on the <a href="#/operations" className="text-teal hover:underline">Operations</a> page.
      </p>
    </div>
  );
}

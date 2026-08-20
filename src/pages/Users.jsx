import { useState } from "react";
import { useApp } from "../context/AppContext";
import { createUser, deleteUser } from "../lib/firestore";

export default function Users() {
  const { users, loadingUsers, setActiveUserId } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Name and email are both required.");
      return;
    }
    setSubmitting(true);
    try {
      const ref = await createUser({ name: name.trim(), email: email.trim() });
      setActiveUserId(ref.id);
      setName("");
      setEmail("");
    } catch (err) {
      setError(err.message || "Could not save this user. Check your Firebase config.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-8">
        <p className="label">Step 01</p>
        <h1 className="font-display text-2xl font-semibold">Add a user</h1>
        <p className="text-muted text-sm mt-1">
          Each user gets their own spreadsheet connection and their own set of platform keys —
          nothing is shared between accounts.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="card p-6 grid gap-4 mb-10">
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
        {error && <p className="text-rose text-xs">{error}</p>}
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
        <div className="card p-6 text-center text-muted text-sm">
          No users yet. Add the first one above to start the setup flow.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {users.map((u) => (
            <div key={u.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{u.name}</p>
                <p className="text-muted text-xs">{u.email}</p>
                <div className="flex gap-2 mt-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      u.sheetConnected
                        ? "border-teal/40 text-teal bg-teal/10"
                        : "border-border text-muted"
                    }`}
                  >
                    sheet {u.sheetConnected ? "linked" : "unlinked"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="btn-ghost text-xs" onClick={() => setActiveUserId(u.id)}>
                  Set active
                </button>
                <button
                  className="text-xs text-rose hover:underline"
                  onClick={() => deleteUser(u.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

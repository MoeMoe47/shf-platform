// src/pages/curriculum/LiveSessionManage.jsx
//
// Phase 2A Secure Live Learning — minimal instructor/admin session
// management (create / list / cancel), backed by the real
// apps/shs-api /live-learning/* routes. Deliberately small — this is not
// a redesign of src/pages/AdminZoom.jsx (Phase 1's real access-approval
// UI, left unchanged) and not a Curriculum Studio; it only exposes the
// session-lifecycle capability the audit's Objective 20 asked for.
import React from "react";
import { Link } from "react-router-dom";
import { listLiveSessions, createLiveSession, cancelLiveSession } from "@/lib/liveLearning/api.js";
import { useUser } from "@/context/UserContext.jsx";

function toDatetimeLocalValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function LiveSessionManage() {
  const { role } = useUser();
  const [sessions, setSessions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [form, setForm] = React.useState({
    title: "",
    lessonId: "",
    startsAtLocal: toDatetimeLocalValue(new Date(Date.now() + 15 * 60_000)),
    durationMinutes: 30,
    provider: "mock",
  });
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState(null);

  const refresh = React.useCallback(() => {
    setLoading(true);
    listLiveSessions(role)
      .then(({ items }) => { setSessions(items || []); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [role]);

  React.useEffect(() => { refresh(); }, [refresh]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createLiveSession(role, {
        title: form.title,
        lessonId: form.lessonId || undefined,
        startsAt: new Date(form.startsAtLocal).toISOString(),
        durationMinutes: Number(form.durationMinutes),
        provider: form.provider,
      });
      setForm((f) => ({ ...f, title: "", lessonId: "" }));
      refresh();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleCancel(id) {
    try {
      await cancelLiveSession(role, id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      <div className="card card--pad">
        <h1 className="h1" style={{ margin: 0 }}>Manage Live Sessions</h1>
        <p className="subtle" style={{ marginTop: 6 }}>
          Real, server-backed session creation/cancellation. Only reachable
          for roles with the <code>liveLearning.create</code> permission —
          the backend enforces this regardless of what this page shows.
        </p>
        <p className="subtle" style={{ marginTop: 6 }}>
          <Link to="/curriculum/live-sessions">← Back to Live Sessions</Link>
        </p>
      </div>

      <form className="card card--pad" onSubmit={handleCreate}>
        <strong>Create a session</strong>
        <div style={{ display: "grid", gap: 8, marginTop: 8, maxWidth: 420 }}>
          <label>
            <div className="subtle">Title</div>
            <input className="sh-input" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label>
            <div className="subtle">Lesson ID (optional — links to curriculum)</div>
            <input className="sh-input" value={form.lessonId} onChange={(e) => setForm((f) => ({ ...f, lessonId: e.target.value }))} placeholder="e.g. student.asl-01" />
          </label>
          <label>
            <div className="subtle">Starts at</div>
            <input className="sh-input" type="datetime-local" required value={form.startsAtLocal} onChange={(e) => setForm((f) => ({ ...f, startsAtLocal: e.target.value }))} />
          </label>
          <label>
            <div className="subtle">Duration (minutes)</div>
            <input className="sh-input" type="number" min={5} max={480} required value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
          </label>
          <label>
            <div className="subtle">Provider</div>
            <select className="sh-input" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}>
              <option value="mock">mock (safe test provider)</option>
              <option value="zoom">zoom (requires configured credentials)</option>
            </select>
          </label>
          <button className="sh-btn" type="submit" disabled={creating}>{creating ? "Creating…" : "Create session"}</button>
          {createError && <p className="subtle" style={{ color: "#b91c1c" }}>{createError}</p>}
        </div>
      </form>

      <div className="card card--pad">
        <strong>Sessions</strong>
        {loading ? (
          <p className="subtle" style={{ marginTop: 8 }}>Loading…</p>
        ) : error ? (
          <p className="subtle" style={{ marginTop: 8 }}>{error}</p>
        ) : sessions.length === 0 ? (
          <p className="subtle" style={{ marginTop: 8 }}>No sessions yet.</p>
        ) : (
          <table className="table" style={{ marginTop: 8, width: "100%" }}>
            <thead><tr><th style={{ textAlign: "left" }}>Title</th><th>Starts</th><th>Status</th><th>Provider</th><th></th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.title}</td>
                  <td>{new Date(s.startsAt).toLocaleString()}</td>
                  <td>{s.status}</td>
                  <td>{s.provider}</td>
                  <td>
                    {s.status !== "cancelled" && (
                      <button className="sh-btn is-ghost" onClick={() => handleCancel(s.id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

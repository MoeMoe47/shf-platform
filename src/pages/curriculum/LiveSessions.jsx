// src/pages/curriculum/LiveSessions.jsx
//
// Phase 1 (SHF Curriculum Infrastructure Audit §28-30) reconnected the
// real, existing request/approval flow (src/utils/zoomAccess.js) and
// ZoomCard.jsx to a reachable route, with no real meeting provider
// connected. Phase 2A (Secure Live Learning Infrastructure) adds a real,
// server-authorized session list + join flow below it, via
// src/lib/liveLearning/api.js -> apps/shs-api's /live-learning/* routes.
//
// IMPORTANT: the original zoomAccess.js request/approval section above is
// left completely unchanged and is explicitly DISPLAY/CACHE ONLY now — it
// no longer represents real meeting authorization (it never actually
// granted one; Phase 1 never enabled a real join). The new "Upcoming Live
// Sessions" section below is the real, server-authorized path: every join
// decision comes from the backend, and localStorage state has no bearing
// on it.
import React from "react";
import { Link } from "react-router-dom";
import ZoomCard from "@/components/ZoomCard.jsx";
import { requestZoomAccess, hasZoomAccess } from "@/utils/zoomAccess.js";
import { useUser } from "@/context/UserContext.jsx";
import { listLiveSessions, requestJoin } from "@/lib/liveLearning/api.js";

function statusLabel(status) {
  return { draft: "Draft", scheduled: "Scheduled", open: "Open", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled", expired: "Expired" }[status] || status;
}

function LiveSessionRow({ session, role }) {
  const [result, setResult] = React.useState(null);
  const [pending, setPending] = React.useState(false);

  async function handleJoin() {
    setPending(true);
    setResult(null);
    try {
      const decision = await requestJoin(role, session.id);
      setResult(decision);
    } catch (err) {
      setResult({ allowed: false, reason: err.message });
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="card" style={{ padding: 12, marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div>
          <strong>{session.title}</strong>
          <div className="subtle" style={{ fontSize: 12 }}>
            {new Date(session.startsAt).toLocaleString()} · {statusLabel(session.status)} · provider: {session.provider}
          </div>
        </div>
        <button className="sh-btn" onClick={handleJoin} disabled={pending || session.status === "cancelled" || session.status === "completed" || session.status === "expired"}>
          {pending ? "Requesting…" : "Request secure join"}
        </button>
      </div>
      {result && (
        <p className="subtle" style={{ marginTop: 8, fontSize: 13 }}>
          {result.allowed ? (
            <>
              ✅ Authorized by the server.{" "}
              {session.provider === "mock" ? (
                <a href={result.launchUrl} target="_blank" rel="noopener noreferrer">
                  Open mock session (test only, not a real meeting)
                </a>
              ) : (
                <span>Real provider launch is not enabled in this environment.</span>
              )}
            </>
          ) : (
            <>❌ Not authorized: {result.reason}</>
          )}
        </p>
      )}
    </li>
  );
}

export default function LiveSessions() {
  const { email, role } = useUser();
  const userId = email || "local-student";
  const [approved, setApproved] = React.useState(() => hasZoomAccess(userId));
  const [requested, setRequested] = React.useState(false);

  const [sessions, setSessions] = React.useState([]);
  const [loadError, setLoadError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e || !e.key || e.key.includes("zoom:")) setApproved(hasZoomAccess(userId));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    listLiveSessions(role)
      .then(({ items }) => { if (alive) { setSessions(items || []); setLoadError(null); } })
      .catch((err) => { if (alive) setLoadError(err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [role]);

  function handleRequest() {
    requestZoomAccess({ userId, name: userId });
    setRequested(true);
  }

  return (
    <div className="stack">
      <div className="card card--pad">
        <h1 className="h1" style={{ margin: 0 }}>Live Sessions</h1>
        <p className="subtle" style={{ marginTop: 6 }}>
          This is the Live Learning UI. Session join decisions below are
          made by the real Live Learning backend — no local browser state
          can grant access to a real meeting.
        </p>
      </div>

      <div className="card card--pad">
        <strong>Your access (legacy display)</strong>
        <p className="subtle" style={{ marginTop: 6 }}>
          {approved
            ? "Approved — you can check in below."
            : requested
              ? "Request sent — waiting on instructor/admin approval."
              : "You have not requested access yet."}
        </p>
        {!approved && (
          <button className="sh-btn" onClick={handleRequest} disabled={requested}>
            {requested ? "Request sent" : "Request access"}
          </button>
        )}
      </div>

      <ZoomCard />

      <div className="card card--pad">
        <strong>Upcoming Live Sessions</strong>
        {loading ? (
          <p className="subtle" style={{ marginTop: 8 }}>Loading…</p>
        ) : loadError ? (
          <p className="subtle" style={{ marginTop: 8 }}>
            Live Learning backend is unavailable ({loadError}). Start it with{" "}
            <code>cd apps/shs-api && npm run dev</code>.
          </p>
        ) : sessions.length === 0 ? (
          <p className="subtle" style={{ marginTop: 8 }}>No live sessions scheduled yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
            {sessions.map((s) => (
              <LiveSessionRow key={s.id} session={s} role={role} />
            ))}
          </ul>
        )}
      </div>

      <p className="subtle">
        <Link to="/curriculum/live-sessions/admin">Instructor / Admin: manage access →</Link>
        {" · "}
        <Link to="/curriculum/live-sessions/manage">Instructor / Admin: manage sessions →</Link>
      </p>
    </div>
  );
}

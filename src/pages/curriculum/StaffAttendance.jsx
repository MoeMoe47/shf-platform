import React from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { confirmAttendance, getLiveSession, listJoinEvents } from "@/lib/liveLearning/api.js";
import "@/styles/curriculum-operations.css";

export default function StaffAttendance() {
  const { sessionId } = useParams();
  const { role } = useUser();
  const [state, setState] = React.useState({ status: "loading", session: null, items: [], error: "" });

  const load = React.useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const [sessionResult, eventsResult] = await Promise.all([
        getLiveSession(role, sessionId),
        listJoinEvents(role, sessionId),
      ]);
      setState({ status: "ready", session: sessionResult, items: eventsResult.items || [], error: "" });
    } catch (error) {
      setState({ status: "error", session: null, items: [], error: error instanceof Error ? error.message : "Attendance is unavailable." });
    }
  }, [role, sessionId]);

  React.useEffect(() => { load(); }, [load]);

  async function confirm(joinEventId) {
    try {
      await confirmAttendance(role, joinEventId);
      await load();
    } catch (error) {
      setState((current) => ({ ...current, error: error instanceof Error ? error.message : "Attendance confirmation failed." }));
    }
  }

  if (state.status === "loading") return <main className="ops-page"><p className="ops-status" role="status">Loading attendance…</p></main>;
  if (state.status === "error" && !state.session) return <main className="ops-page"><div className="ops-error" role="alert"><strong>Attendance unavailable</strong><span>{state.error}</span><button type="button" onClick={load}>Retry</button></div></main>;

  return <main className="ops-page">
    <header className="ops-header"><div><p className="ops-eyebrow">Live Learning</p><h1>Attendance</h1><p>{state.session?.title || sessionId}</p></div><Link className="ops-secondary" to="/curriculum/instructor/operations">Back to workspace</Link></header>
    <section className="ops-panel" aria-labelledby="attendance-heading">
      <div className="ops-panel-head"><h2 id="attendance-heading">Session attendance</h2><span>{state.items.length} learners</span></div>
      {state.error && <p role="alert">{state.error}</p>}
      {state.items.length === 0 ? <p className="ops-empty">No attendance opportunities are available.</p> : <div className="ops-table-wrap"><table><thead><tr><th scope="col">Learner</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody>{state.items.map((item) => <tr key={item.join_event_id}><td>{item.user_id}</td><td>{item.attendance_status || item.status || "PENDING"}</td><td>{["attended", "completed"].includes(item.attendance_status) ? "Confirmed" : <button type="button" className="ops-primary" onClick={() => confirm(item.join_event_id)}>Confirm attendance</button>}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}

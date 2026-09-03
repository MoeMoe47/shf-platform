import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { getStudioReviewerQueue } from "@/lib/studio/api.js";

export default function StudioReviewerQueue() {
  const { role } = useUser();
  const [state, setState] = React.useState({ status: "loading", items: [], error: null });
  const load = React.useCallback(() => {
    setState({ status: "loading", items: [], error: null });
    getStudioReviewerQueue(role).then((data) => setState({ status: "ready", items: data?.items || [], error: null }))
      .catch((error) => setState({ status: "error", items: [], error }));
  }, [role]);
  React.useEffect(() => load(), [load]);

  return <main className="ops-page" aria-labelledby="reviewer-queue-heading">
    <header className="ops-header"><div><p className="ops-eyebrow">Studio Review</p><h1 id="reviewer-queue-heading">Needs Review</h1><p>Work assigned to you by the institutional routing engine.</p></div><button type="button" className="ops-secondary" onClick={load}>Refresh</button></header>
    {state.status === "loading" && <p className="ops-status" role="status">Loading review queue…</p>}
    {state.status === "error" && <div className="ops-error" role="alert"><strong>Review queue unavailable</strong><span>We could not load assigned work. Please try again.</span><button type="button" onClick={load}>Retry</button></div>}
    {state.status === "ready" && <section className="ops-panel" aria-labelledby="assigned-reviews-heading"><div className="ops-panel-head"><h2 id="assigned-reviews-heading">Assigned reviews</h2><span>{state.items.length}</span></div>{state.items.length ? <div className="ops-list">{state.items.map((item) => <div className="ops-row" key={item.assignmentId}><div><strong>{item.projectTitle || "Studio project"}</strong><span>{item.projectType} · {item.reviewStatus} · Revision {item.workspaceRevision}</span><small>{item.assignmentIdContext ? `Assignment ${item.assignmentIdContext}` : item.cohortId ? `Cohort ${item.cohortId}` : "Student project"}{item.programId ? ` · Program ${item.programId}` : ""}</small></div><Link className="ops-secondary" to={`/studio/review/${encodeURIComponent(item.projectId)}/${encodeURIComponent(item.submissionId)}`}>Review Work</Link></div>)}</div> : <p className="ops-empty">No work is waiting for your review.</p>}</section>}
  </main>;
}

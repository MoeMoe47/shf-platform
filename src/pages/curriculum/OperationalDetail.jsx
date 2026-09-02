import React from "react";
import { useParams, Link } from "react-router-dom";
import { fetchAssignmentOperationalDetail, fetchLearnerOperationalDetail } from "@/shared/operations/operationsClient.js";
import "@/styles/curriculum-operations.css";

function DetailList({ title, items, label }) {
  return <section className="ops-panel"><div className="ops-panel-head"><h2>{title}</h2><span>{items.length}</span></div>{items.length ? <div className="ops-list">{items.slice(0, 50).map((item, index) => <div className="ops-row" key={item.id || item.assignment_id || item.truth_fact_id || item.submission_id || index}><div><strong>{label(item)}</strong><span>{item.status || item.fact_type || item.source_type || "Canonical record"}</span></div><span>{item.occurred_at || item.created_at || item.due_at || "NO_DATA"}</span></div>)}</div> : <p className="ops-empty">No canonical records available.</p>}</section>;
}

export default function OperationalDetail({ kind }) {
  const params = useParams();
  const [state, setState] = React.useState({ status: "loading", data: null, error: "" });
  const load = React.useCallback(async () => {
    setState({ status: "loading", data: null, error: "" });
    try { const data = kind === "learner" ? await fetchLearnerOperationalDetail(params.learnerId) : await fetchAssignmentOperationalDetail(params.assignmentId); setState({ status: "ready", data, error: "" }); }
    catch (error) { setState({ status: "error", data: null, error: error instanceof Error ? error.message : "Unable to load detail." }); }
  }, [kind, params.assignmentId, params.learnerId]);
  React.useEffect(() => { load(); }, [load]);
  if (state.status === "loading") return <main className="ops-page"><p className="ops-status">Loading detail…</p></main>;
  if (state.status === "error") return <main className="ops-page"><div className="ops-error" role="alert"><strong>Detail unavailable</strong><span>{state.error}</span><button type="button" onClick={load}>Retry</button></div></main>;
  const data = state.data;
  if (kind === "learner") return <main className="ops-page"><header className="ops-header"><div><p className="ops-eyebrow">Learner detail</p><h1>{data.learner.full_name}</h1><p>{data.learner.email}</p></div><Link className="ops-secondary" to="/curriculum/instructor/operations">Back to workspace</Link></header><div className="ops-grid"><DetailList title="Assignments" items={data.assignments} label={(x) => x.title} /><DetailList title="Progress facts" items={data.truthFacts} label={(x) => x.fact_type} /><DetailList title="Evidence" items={data.evidence} label={(x) => x.source_type} /><DetailList title="Projects" items={data.projects} label={(x) => x.title} /><DetailList title="Attendance" items={data.attendance} label={(x) => x.title} /></div></main>;
  const assignment = data.assignment;
  return <main className="ops-page"><header className="ops-header"><div><p className="ops-eyebrow">Assignment detail</p><h1>{assignment.title}</h1><p>{assignment.assignment_type} · Due {new Date(assignment.due_at).toLocaleDateString()} · {assignment.status}</p></div><Link className="ops-secondary" to="/curriculum/instructor/operations">Back to workspace</Link></header><div className="ops-grid"><section className="ops-panel"><h2>Canonical scope</h2><dl><dt>Organization</dt><dd>{assignment.organization_id}</dd><dt>Cohort</dt><dd>{assignment.cohort_name || "Organization"}</dd><dt>Release</dt><dd>{assignment.curriculum_release_id || "NOT_AVAILABLE"}</dd><dt>Completion Policy</dt><dd>{assignment.completion_policy_id || "NOT_AVAILABLE"}</dd></dl></section><DetailList title="Targets" items={data.targets} label={(x) => x.full_name || x.target_type} /><DetailList title="Canonical activity" items={data.truthFacts} label={(x) => x.fact_type} /></div></main>;
}

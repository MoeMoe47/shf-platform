import React from "react";
import { Link } from "react-router-dom";
import { fetchOperationalOverview } from "@/shared/operations/operationsClient.js";
import { fetchCurriculumLearningProgressReport } from "@/shared/reporting/curriculumReportingClient.js";
import { useUser } from "@/context/UserContext.jsx";
import "@/styles/curriculum-operations.css";

function Metric({ label, value }) {
  return <div className="ops-metric"><span>{label}</span><strong>{value == null ? "NO_DATA" : value}</strong></div>;
}

function Empty({ children }) {
  return <p className="ops-empty">{children}</p>;
}

export default function InstructorOperations() {
  const { role } = useUser();
  const [state, setState] = React.useState({ status: "loading", data: null, error: "" });

  const load = React.useCallback(async () => {
    setState({ status: "loading", data: null, error: "" });
    try {
      const [overview, report] = await Promise.allSettled([fetchOperationalOverview({ role }), fetchCurriculumLearningProgressReport({ role })]);
      if (overview.status === "rejected") throw overview.reason;
      setState({ status: "ready", data: { ...overview.value, report: report.status === "fulfilled" ? report.value : null }, error: "" });
    } catch (error) {
      setState({ status: "error", data: null, error: error instanceof Error ? error.message : "Unable to load operational workspace." });
    }
  }, [role]);

  React.useEffect(() => { load(); }, [load]);

  if (state.status === "loading") return <main className="ops-page" aria-busy="true"><p className="ops-status">Loading operational workspace…</p></main>;
  if (state.status === "error") return <main className="ops-page"><div className="ops-error" role="alert"><strong>Operational workspace unavailable</strong><span>{state.error}</span><button type="button" onClick={load}>Retry</button></div></main>;

  const data = state.data || {};
  const summary = data.summary || {};
  const cohorts = data.cohorts || [];
  const roster = data.roster || [];
  const assignments = data.assignments || [];
  const reviews = data.reviewQueue || [];
  const sessions = data.liveSessions || [];
  const reportMetrics = data.report?.metric_results || [];

  return (
    <main className="ops-page">
      <header className="ops-header">
        <div><p className="ops-eyebrow">Instructor + Admin</p><h1>Operational Workspace</h1><p>Review assigned learning and act on canonical learner state.</p></div>
        <div><button type="button" className="ops-secondary" onClick={load}>Refresh</button> <Link className="ops-secondary" to="/studio/reviewer-queue">Review queue</Link></div>
      </header>

      <section className="ops-metrics" aria-label="Operational summary">
        <Metric label="Cohorts" value={summary.cohort_count} /><Metric label="Active learners" value={summary.learner_count} />
        <Metric label="Active assignments" value={summary.active_assignment_count} /><Metric label="Needs review" value={summary.review_count} /><Metric label="Upcoming live" value={summary.upcoming_live_count} />
      </section>
      <section className="ops-panel ops-report-panel"><div className="ops-panel-head"><h2>Learning report</h2><span>{data.report?.freshness?.calculated_at ? `Calculated ${new Date(data.report.freshness.calculated_at).toLocaleString()}` : "NO_DATA"}</span></div>{reportMetrics.length ? <div className="ops-list">{reportMetrics.map((metric) => <div className="ops-row" key={metric.metric_id}><div><strong>{metric.name || metric.metric_id}</strong><span>{metric.status} · {metric.unit || "value"}</span></div><b>{metric.value == null ? "NO_DATA" : metric.value}</b></div>)}</div> : <Empty>No reporting data available yet.</Empty>}</section>

      <div className="ops-grid">
        <section className="ops-panel ops-panel--wide"><div className="ops-panel-head"><h2>Cohort progress</h2><Link to="/curriculum/asl/assignments">Assignments</Link></div>{cohorts.length ? <div className="ops-list">{cohorts.map((cohort) => <div className="ops-row" key={cohort.cohort_id}><div><strong>{cohort.name}</strong><span>{cohort.status} · Program {cohort.program_id}</span></div><b>{cohort.learner_count} learners</b></div>)}</div> : <Empty>No learners enrolled.</Empty>}</section>
        <section className="ops-panel"><div className="ops-panel-head"><h2>Needs attention</h2><span>{reviews.length}</span></div>{reviews.length ? <div className="ops-list">{reviews.map((item) => <div className="ops-row" key={`${item.review_type}:${item.source_id}`}><div><Link to={item.review_type === "EVIDENCE_REVIEW" ? `/curriculum/instructor/prove/${encodeURIComponent(item.source_id)}` : `/curriculum/instructor/operations/reviews/project/${encodeURIComponent(item.source_id)}`}><strong>{item.title}</strong></Link><span>{item.review_type} · {item.status}</span></div><span>{item.learner_user_id}</span></div>)}</div> : <Empty>No reviews awaiting action.</Empty>}</section>
        <section className="ops-panel"><div className="ops-panel-head"><h2>Upcoming live</h2><Link to="/curriculum/live-sessions">Live Sessions</Link></div>{sessions.length ? <div className="ops-list">{sessions.map((session) => <div className="ops-row" key={session.live_session_id}><div><strong>{session.title}</strong><span>{new Date(session.starts_at).toLocaleString()} · {session.status}</span></div><Link to={`/curriculum/instructor/operations/live/${encodeURIComponent(session.live_session_id)}/attendance`}>Attendance</Link></div>)}</div> : <Empty>No live sessions scheduled.</Empty>}</section>
        <section className="ops-panel ops-panel--wide"><div className="ops-panel-head"><h2>Learner roster</h2><Link to="/curriculum/instructor">Instructor Guide</Link></div>{roster.length ? <div className="ops-table-wrap"><table><thead><tr><th>Learner</th><th>Cohort</th><th>Status</th><th>Lessons completed</th><th>Last activity</th></tr></thead><tbody>{roster.map((learner) => <tr key={learner.enrollment_id}><td><Link to={`/curriculum/instructor/operations/learners/${encodeURIComponent(learner.learner_user_id)}`}>{learner.full_name}</Link><small>{learner.email}</small></td><td>{learner.cohort_name || "Organization"}</td><td>{learner.status}</td><td>{learner.lessons_completed}</td><td>{learner.last_activity_at ? new Date(learner.last_activity_at).toLocaleDateString() : "NO_DATA"}</td></tr>)}</tbody></table></div> : <Empty>No learners enrolled.</Empty>}</section>
        <section className="ops-panel"><div className="ops-panel-head"><h2>Active assignments</h2><Link to="/curriculum/asl/assignments">View</Link></div>{assignments.length ? <div className="ops-list">{assignments.slice(0, 8).map((item) => <div className="ops-row" key={item.assignment_id}><div><Link to={`/curriculum/instructor/operations/assignments/${encodeURIComponent(item.assignment_id)}`}><strong>{item.title}</strong></Link><span>{item.assignment_type} · Due {new Date(item.due_at).toLocaleDateString()}</span></div><span>{item.cohort_name || "Organization"}</span></div>)}</div> : <Empty>No assignments yet.</Empty>}</section>
      </div>
    </main>
  );
}

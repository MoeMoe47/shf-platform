import React from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { fetchCourseOperationalDetail } from "@/shared/operations/operationsClient.js";
import { fetchCurriculumLearningProgressReport } from "@/shared/reporting/curriculumReportingClient.js";
import "@/styles/curriculum-operations.css";

const TABS = ["Overview", "Assignments", "Learners", "Lessons", "Live", "Reviews", "Reports"];

function Metric({ label, value, status }) {
  return <div className="ops-metric"><span>{label}</span><strong>{status === "NO_DATA" || value == null ? "NO_DATA" : value}</strong></div>;
}

export default function StaffCourseWorkspace() {
  const { courseId } = useParams();
  const { role } = useUser();
  const [tab, setTab] = React.useState("Overview");
  const [state, setState] = React.useState({ status: "loading", data: null, report: null, error: "" });
  const load = React.useCallback(async () => {
    setState({ status: "loading", data: null, report: null, error: "" });
    try {
      const [courseResult, reportResult] = await Promise.allSettled([fetchCourseOperationalDetail(courseId, { role }), fetchCurriculumLearningProgressReport({ role })]);
      if (courseResult.status === "rejected") throw courseResult.reason;
      setState({ status: "ready", data: courseResult.value, report: reportResult.status === "fulfilled" ? reportResult.value : null, error: "" });
    } catch (error) {
      setState({ status: "error", data: null, report: null, error: error instanceof Error ? error.message : "Unable to load course workspace." });
    }
  }, [courseId, role]);
  React.useEffect(() => { load(); }, [load]);
  if (state.status === "loading") return <main className="ops-page" aria-busy="true"><p className="ops-status">Loading course workspace…</p></main>;
  if (state.status === "error") return <main className="ops-page"><div className="ops-error" role="alert"><strong>Course workspace unavailable</strong><span>{state.error}</span><button type="button" onClick={load}>Retry</button></div></main>;

  const { data, report } = state;
  const progress = data.progress || {};
  const metrics = report?.metric_results || [];
  return <main className="ops-page">
    <header className="ops-header"><div><p className="ops-eyebrow">Staff Course Workspace</p><h1>{data.course.title}</h1><p>{data.course.short_description || "Canonical course operations and learner progress."}</p></div><button type="button" className="ops-secondary" onClick={load}>Refresh</button></header>
    <nav className="ops-tabs" aria-label="Course workspace tabs">{TABS.map((item) => <button type="button" key={item} className={tab === item ? "is-active" : ""} aria-pressed={tab === item} onClick={() => setTab(item)}>{item}</button>)}</nav>
    <section className="ops-metrics" aria-label="Course summary"><Metric label="Release" value={data.release ? `v${data.release.version_number}` : null} /><Metric label="Enrolled learners" value={data.learnerCount} /><Metric label="Course progress" value={progress.value == null ? null : `${progress.value}%`} status={progress.status} /><Metric label="Pending reviews" value={data.reviewCount} /><Metric label="Learning report" value={metrics.length ? metrics[0].value : null} status={metrics.length ? metrics[0].status : "NO_DATA"} /></section>
    {(tab === "Overview" || tab === "Reports") && <section className="ops-panel"><div className="ops-panel-head"><h2>{tab === "Reports" ? "Canonical learning progress report" : "Course overview"}</h2><span>{report?.freshness?.calculated_at ? `Calculated ${new Date(report.freshness.calculated_at).toLocaleString()}` : "NO_DATA"}</span></div><p className="ops-muted">Scope: organization · course {data.scope.courseId}. Release binding: {data.release?.release_id || "NO_DATA"}.</p>{metrics.length ? <div className="ops-list">{metrics.map((metric) => <div className="ops-row" key={metric.metric_id}><div><strong>{metric.name || metric.metric_id}</strong><span>{metric.status} · {metric.unit || "value"}</span></div><b>{metric.value == null ? "NO_DATA" : metric.value}</b></div>)}</div> : <p className="ops-empty">No reporting data available yet.</p>}</section>}
    {(tab === "Overview" || tab === "Assignments") && <section className="ops-panel"><div className="ops-panel-head"><h2>Assignments</h2><span>{data.assignments.length}</span></div>{data.assignments.length ? <div className="ops-list">{data.assignments.map((item) => <div className="ops-row" key={item.assignment_id}><div><Link to={`/curriculum/admin/operations/assignments/${encodeURIComponent(item.assignment_id)}`}><strong>{item.title}</strong></Link><span>{item.assignment_type} · Release {item.curriculum_release_id || "NO_DATA"}</span></div><span>{item.due_at ? new Date(item.due_at).toLocaleDateString() : "No due date"}</span></div>)}</div> : <p className="ops-empty">No assignments yet.</p>}</section>}
    {(tab === "Overview" || tab === "Live") && <section className="ops-panel"><div className="ops-panel-head"><h2>Live sessions</h2><Link to="/curriculum/live-sessions">Open Live</Link></div>{data.liveSessions.length ? <div className="ops-list">{data.liveSessions.map((item) => <div className="ops-row" key={item.live_session_id}><div><strong>{item.title}</strong><span>{item.status}</span></div><span>{new Date(item.starts_at).toLocaleString()}</span></div>)}</div> : <p className="ops-empty">No live sessions scheduled.</p>}</section>}
    {(tab === "Learners" || tab === "Lessons" || tab === "Reviews") && <section className="ops-panel"><div className="ops-panel-head"><h2>{tab}</h2></div><p className="ops-empty">No additional records are available for this course.</p></section>}
  </main>;
}

import React from "react";
import { getCurrentStudioQa, runStudioQa } from "@/lib/studio/api.js";

const statusLabels = { NOT_CHECKED: "Not checked yet", STALE: "Project changed — check again", PASSED: "Looks good", FAILED: "Needs changes", ERROR: "Check could not finish" };

export default function StudioProjectCheck({ role, projectId, workspace }) {
  const [state, setState] = React.useState({ loading: true, checking: false, error: null, data: null });
  React.useEffect(() => { let active = true; getCurrentStudioQa(role, projectId).then((data) => active && setState({ loading: false, checking: false, error: null, data })).catch((error) => active && setState({ loading: false, checking: false, error, data: null })); return () => { active = false; }; }, [role, projectId]);
  const stale = state.data?.run && state.data.run.workspaceRevision !== workspace.revision;
  const status = stale ? "STALE" : state.data?.status || "NOT_CHECKED";
  async function check() {
    setState((current) => ({ ...current, checking: true, error: null }));
    try { const data = await runStudioQa(role, projectId); setState({ loading: false, checking: false, error: null, data: { projectId, workspaceRevision: data.workspaceRevision, status: data.status, run: data } }); }
    catch (error) { setState((current) => ({ ...current, checking: false, error })); }
  }
  const run = state.data?.run;
  return <section className="studio-panel studio-qaPanel" aria-labelledby="studio-check-heading">
    <div className="studio-sectionHeading"><div><p className="studio-eyebrow">Project check</p><h2 id="studio-check-heading">Check My Project</h2></div><span>{state.checking ? "Checking your saved work…" : statusLabels[status]}</span></div>
    {state.loading ? <p className="studio-muted" role="status">Loading your latest check…</p> : <>
      <p className="studio-qaSummary" role="status">{status === "PASSED" && run ? `${run.summary.pass} checks passed${run.summary.warn ? `, ${run.summary.warn} to review` : ""}.` : status === "FAILED" && run ? `${run.summary.fail} thing${run.summary.fail === 1 ? "" : "s"} need${run.summary.fail === 1 ? "s" : ""} attention.` : statusLabels[status]}</p>
      {run?.findings?.length ? <ul className="studio-qaFindings">{run.findings.filter((item) => item.status !== "PASS").map((item) => <li key={item.checkId}><strong>{item.title}</strong><span>{item.message} {item.studentGuidance}</span></li>)}</ul> : null}
      {state.error && <p className="studio-error" role="alert">Your project could not be checked. Your saved work is safe. Please try again.</p>}
      <button className="studio-primaryButton" type="button" onClick={check} disabled={state.checking}>{state.checking ? "Checking…" : status === "PASSED" ? "Check again" : "Check My Project"}</button>
    </>}
  </section>;
}

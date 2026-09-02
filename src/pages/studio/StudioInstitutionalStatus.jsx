import React from "react";
import { getStudioInstitutionalStatus, projectStudioEvidence } from "@/lib/studio/api.js";

export default function StudioInstitutionalStatus({ role, projectId }) {
  const [state, setState] = React.useState({ loading: true, working: false, error: null, data: null });
  const load = React.useCallback(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    getStudioInstitutionalStatus(role, projectId).then((data) => active && setState({ loading: false, working: false, error: null, data })).catch((error) => active && setState({ loading: false, working: false, error, data: null }));
    return () => { active = false; };
  }, [role, projectId]);
  React.useEffect(load, [load]);
  React.useEffect(() => {
    const refresh = (event) => { if (event.detail?.projectId === projectId) load(); };
    window.addEventListener("studio:delivery-finalized", refresh);
    window.addEventListener("studio:workspace-updated", refresh);
    return () => { window.removeEventListener("studio:delivery-finalized", refresh); window.removeEventListener("studio:workspace-updated", refresh); };
  }, [load, projectId]);
  async function prepareEvidence() {
    setState((current) => ({ ...current, working: true, error: null }));
    try { await projectStudioEvidence(role, projectId); load(); } catch (error) { setState((current) => ({ ...current, working: false, error })); }
  }
  if (state.loading) return <section className="studio-panel" aria-labelledby="studio-proof-heading"><h2 id="studio-proof-heading">What You Proved</h2><p className="studio-muted" role="status">Loading project proof status…</p></section>;
  if (state.error) return <section className="studio-panel" aria-labelledby="studio-proof-heading"><h2 id="studio-proof-heading">What You Proved</h2><p className="studio-error" role="alert">Project proof status is unavailable right now. Your finalized work is still safe.</p></section>;
  const data = state.data || {};
  const evidence = data.evidence || [];
  const outcomes = data.whatYouProved || [];
  return <section className="studio-panel" aria-labelledby="studio-proof-heading">
    <div className="studio-sectionHeading"><div><p className="studio-eyebrow">Institutional progress</p><h2 id="studio-proof-heading">What You Proved</h2></div><span>{data.delivery ? "Finalized work" : "Not available yet"}</span></div>
    {!data.delivery ? <p className="studio-muted">Finish review and finalization before this project can enter the Evidence process.</p> : evidence.length ? <><p className="studio-muted">Your finalized project has been sent through the Evidence process. Evidence is separate from completion.</p>{data.delivery.isCurrent === false && <p className="studio-warning" role="alert">Evidence applies to an earlier version of this project. Check, review, and finalize newer work before it can produce new Evidence.</p>}<ul className="studio-list">{evidence.map((item) => <li key={item.evidenceId}>{item.isCurrent === false ? "Evidence is from an earlier version" : item.status === "REVIEWED" ? "Evidence verified" : "Evidence is being processed"}</li>)}</ul>{outcomes.length > 0 && <><h3>Verified outcomes</h3><ul className="studio-list">{outcomes.map((item) => <li key={item.competencyId}>{item.title}</li>)}</ul></>}</> : <><p className="studio-muted">Your finalized work is eligible for institutional Evidence processing when the assignment has an approved Evidence mapping.</p><button className="studio-secondaryButton" type="button" onClick={prepareEvidence} disabled={state.working}>{state.working ? "Preparing…" : "Prepare Evidence"}</button></>}
    {data.portfolio?.available ? <p className="studio-muted">Portfolio status: {data.portfolio.status}</p> : <p className="studio-muted">Portfolio connection is not available for this project yet.</p>}
    {data.completion && <p className="studio-muted" role="status">Assignment progress: {data.completion.eligible ? "This Studio requirement is satisfied." : data.completion.reason}</p>}
  </section>;
}

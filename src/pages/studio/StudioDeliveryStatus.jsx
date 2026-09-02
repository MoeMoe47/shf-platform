import React from "react";
import { getCurrentStudioDelivery, finalizeStudioProject } from "@/lib/studio/api.js";

export default function StudioDeliveryStatus({ role, projectId, workspace }) {
  const [state, setState] = React.useState({ loading: true, finalizing: false, error: null, data: null });
  React.useEffect(() => { let active = true; getCurrentStudioDelivery(role, projectId).then((data) => active && setState({ loading: false, finalizing: false, error: null, data })).catch((error) => active && setState({ loading: false, finalizing: false, error, data: null })); return () => { active = false; }; }, [role, projectId]);
  async function finalize(event) {
    event.preventDefault();
    setState((current) => ({ ...current, finalizing: true, error: null }));
    try { const data = await finalizeStudioProject(role, projectId); setState({ loading: false, finalizing: false, error: null, data: { ...state.data, status: data.status, eligible: false, record: data } }); window.dispatchEvent(new CustomEvent("studio:delivery-finalized", { detail: { projectId } })); }
    catch (error) { setState((current) => ({ ...current, finalizing: false, error })); }
  }
  if (state.loading) return <section className="studio-panel" aria-labelledby="studio-delivery-heading"><h2 id="studio-delivery-heading">Ready to Finish</h2><p className="studio-muted" role="status">Loading finalization status…</p></section>;
  const record = state.data?.record;
  const stale = record && Number(record.workspaceRevision) !== Number(workspace?.revision);
  return <section className="studio-panel studio-deliveryPanel" aria-labelledby="studio-delivery-heading"><div className="studio-sectionHeading"><div><p className="studio-eyebrow">Final version</p><h2 id="studio-delivery-heading">Ready to Finish</h2></div><span>{stale ? "Earlier version" : record?.status === "FINALIZED" ? "Finalized" : "Not ready"}</span></div>{stale ? <p className="studio-reviewNotice" role="status">Your current work changed after finalization. The finalized version remains revision {record.workspaceRevision}.</p> : record?.status === "FINALIZED" ? <p className="studio-muted">Your approved revision {record.workspaceRevision} is finalized. This does not publish, deliver, or create evidence.</p> : <><p className="studio-muted">Finalization locks the exact approved version for this project. It does not publish or complete your project.</p>{state.data?.eligible ? <form onSubmit={finalize}><button className="studio-primaryButton" type="submit" disabled={state.finalizing}>{state.finalizing ? "Finalizing…" : "Finalize Project"}</button></form> : <p className="studio-muted">Complete current QA and human review before finalizing this version.</p>}</>}{state.error && <p className="studio-error" role="alert">This project could not be finalized. Your saved work is safe. Please try again.</p>}</section>;
}

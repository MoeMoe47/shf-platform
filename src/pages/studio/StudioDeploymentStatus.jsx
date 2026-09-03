import React from "react";
import { createWebsiteDeployment, getCurrentStudioDelivery, listWebsiteDeployments, retryWebsiteDeployment } from "@/lib/studio/api.js";

const STATUS_COPY = {
  REQUESTED: "Preparing your test deployment",
  QUEUED: "Waiting to deploy",
  DEPLOYING: "Publishing your test version",
  LIVE: "Test Deployment Live",
  FAILED: "Publish Failed",
  SUPERSEDED: "Earlier Published Version",
  UNPUBLISHED: "No Longer Published",
};

function revisionOf(item) { return Number(item?.workspaceRevision || 0); }

function currentDeployment(items, delivery) {
  if (!delivery?.deliveryRecordId) return null;
  return items.find((item) => item.deliveryRecordId === delivery.deliveryRecordId) || null;
}

function statusLabel(status) { return STATUS_COPY[status] || "Deployment status unavailable"; }

export default function StudioDeploymentStatus({ role, projectId, projectType }) {
  const [state, setState] = React.useState({ loading: true, working: false, error: null, operation: null, errorDeploymentId: null, delivery: null, deployments: [] });

  const load = React.useCallback(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null, operation: null, errorDeploymentId: null }));
    Promise.all([getCurrentStudioDelivery(role, projectId), listWebsiteDeployments(role, projectId)])
      .then(([delivery, history]) => active && setState({ loading: false, working: false, error: null, operation: null, errorDeploymentId: null, delivery, deployments: history?.items || [] }))
      .catch((error) => active && setState((current) => ({ ...current, loading: false, working: false, error, operation: "load" })));
    return () => { active = false; };
  }, [role, projectId]);

  React.useEffect(load, [load]);
  React.useEffect(() => {
    const refresh = (event) => { if (!event.detail?.projectId || event.detail.projectId === projectId) load(); };
    window.addEventListener("studio:delivery-finalized", refresh);
    window.addEventListener("studio:workspace-updated", refresh);
    return () => { window.removeEventListener("studio:delivery-finalized", refresh); window.removeEventListener("studio:workspace-updated", refresh); };
  }, [load, projectId]);

  async function publish() {
    if (!state.delivery?.record?.deliveryRecordId) return;
    setState((current) => ({ ...current, working: true, error: null }));
    try { await createWebsiteDeployment(role, state.delivery.record.deliveryRecordId); await load(); }
    catch (error) { setState((current) => ({ ...current, working: false, error, operation: "publish" })); }
  }

  async function retry(deploymentId) {
    setState((current) => ({ ...current, working: deploymentId, error: null }));
    try { await retryWebsiteDeployment(role, deploymentId); await load(); }
    catch (error) { setState((current) => ({ ...current, working: false, error, operation: "retry", errorDeploymentId: deploymentId })); }
  }

  if (projectType !== "WEBSITE") return null;
  if (state.loading) return <section className="studio-panel studio-deploymentPanel" aria-labelledby="studio-deployment-heading"><h2 id="studio-deployment-heading">Website Publishing</h2><p className="studio-muted" role="status">Loading deployment status…</p></section>;
  if (state.error) return <section className="studio-panel studio-deploymentPanel" aria-labelledby="studio-deployment-heading"><h2 id="studio-deployment-heading">Website Publishing</h2><p className="studio-error" role="alert">{state.operation === "publish" ? "Publish Failed. Your finalized Studio work is safe." : state.operation === "retry" ? "Retry failed. Your finalized Studio work is safe." : "Deployment status is unavailable. Your finalized Studio work is safe."}</p><button className="studio-secondaryButton" type="button" onClick={state.operation === "retry" ? () => retry(state.errorDeploymentId) : state.operation === "publish" ? publish : load}>{state.operation === "load" ? "Try again" : "Try Again"}</button></section>;

  const delivery = state.delivery?.record;
  const deployment = currentDeployment(state.deployments, delivery);
  const latestRevision = state.deployments.reduce((latest, item) => Math.max(latest, revisionOf(item)), 0);
  const currentFinalized = state.delivery?.status === "FINALIZED" && delivery?.status === "FINALIZED";
  const hasNewerFinalized = Boolean(currentFinalized && state.deployments.length > 0 && revisionOf(delivery) > latestRevision);
  const ready = currentFinalized && !deployment;
  const notReadyMessage = state.delivery?.status === "STALE" ? "Your current work changed after the last finalized version. Check and finish the newer version before publishing it." : state.delivery?.status === "NOT_READY" ? "Finish Check My Project, review, and finalization before publishing." : "Complete Check My Project, review, and finalization before publishing.";

  return <section className="studio-panel studio-deploymentPanel" aria-labelledby="studio-deployment-heading">
    <div className="studio-sectionHeading"><div><p className="studio-eyebrow">Website publishing</p><h2 id="studio-deployment-heading">Publish a Test Version</h2></div><span>{deployment ? statusLabel(deployment.status) : ready ? "Ready to Publish" : "Not ready"}</span></div>
    <p className="studio-muted">Finalized means this version is approved and finished in Studio. Publishing is a separate, explicit action.</p>
    <div className="studio-deploymentNotice" role="note"><strong>Studio Test Deployment</strong><span>This sends the finalized version to a private test environment. Public website hosting is not connected yet.</span></div>
    {!currentFinalized ? <p className="studio-muted">{notReadyMessage}</p> : deployment?.status === "FAILED" ? <><p className="studio-error" role="alert">Publish failed. Your finalized version is unchanged.</p><button className="studio-primaryButton" type="button" onClick={() => retry(deployment.deploymentId)} disabled={Boolean(state.working)}>{state.working === deployment.deploymentId ? "Trying again…" : "Try Again"}</button></> : deployment?.status === "LIVE" ? <div className="studio-deploymentLive" role="status"><strong>Test Deployment Live</strong><span>Published revision {deployment.workspaceRevision} in the Studio test environment.</span><span>Public hosting: Not connected</span></div> : ready || hasNewerFinalized ? <><p className="studio-muted">{hasNewerFinalized ? `A newer finalized version, revision ${revisionOf(delivery)}, is ready to publish.` : `Revision ${revisionOf(delivery)} is ready to publish.`}</p><button className="studio-primaryButton" type="button" onClick={publish} disabled={Boolean(state.working)}>{state.working ? "Publishing…" : hasNewerFinalized ? "Publish New Version" : "Publish"}</button></> : <p className="studio-muted" role="status">{statusLabel(deployment?.status)}</p>}
    {state.deployments.length > 0 && <div className="studio-deploymentHistory" aria-labelledby="studio-deployment-history-heading"><h3 id="studio-deployment-history-heading">Deployment history</h3><ul className="studio-list">{state.deployments.map((item) => <li key={item.deploymentId}><span>{statusLabel(item.status)} · Revision {item.workspaceRevision} · Test environment</span><time dateTime={item.requestedAt}>{item.requestedAt ? new Date(item.requestedAt).toLocaleDateString() : "Date unavailable"}</time></li>)}</ul></div>}
    {state.error && <p className="studio-error" role="alert">We could not update the deployment. No false success was recorded. Please try again.</p>}
  </section>;
}

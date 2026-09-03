import React from "react";
import { createAgentPackage, listAgentPackages, createRegistrySubmission, listRegistrySubmissions, retryRegistrySubmission } from "@/lib/studio/api.js";

export default function StudioAgentPackageStatus({ role, projectId, projectType }) {
  const [state, setState] = React.useState({ loading: true, working: false, error: null, items: [], submissions: [] });
  const load = React.useCallback(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    listAgentPackages(role, projectId).then(async (result) => {
      const items = result?.items || [];
      const latest = items[0];
      const submissionGroups = await Promise.all(items.map(async (item) => ({ package: item, submissions: (await listRegistrySubmissions(role, item.packageId))?.items || [] })));
      const submissions = submissionGroups.flatMap(({ package: packageItem, submissions: packageSubmissions }) => packageSubmissions.map((item) => ({ ...item, packageVersion: item.packageVersion || packageItem.packageVersion })));
      if (active) setState({ loading: false, working: false, error: null, items, submissions });
    }).catch((error) => active && setState((current) => ({ ...current, loading: false, error })));
    return () => { active = false; };
  }, [role, projectId]);
  React.useEffect(load, [load]);
  if (projectType !== "AI_AGENT") return null;
  if (state.loading) return <section className="studio-panel" aria-labelledby="agent-package-heading"><h2 id="agent-package-heading">Agent Package</h2><p className="studio-muted" role="status">Loading package status…</p></section>;
  const latest = state.items[0];
  async function generate() {
    setState((current) => ({ ...current, working: true, error: null }));
    try { await createAgentPackage(role, projectId); await load(); } catch (error) { setState((current) => ({ ...current, working: false, error })); }
  }
  async function submit() {
    setState((current) => ({ ...current, working: true, error: null }));
    try { await createRegistrySubmission(role, latest.packageId); await load(); } catch (error) { setState((current) => ({ ...current, working: false, error })); }
  }
  async function retry() {
    setState((current) => ({ ...current, working: true, error: null }));
    try { await retryRegistrySubmission(role, submission.submissionId); await load(); } catch (error) { setState((current) => ({ ...current, working: false, error })); }
  }
  const submission = state.submissions[0];
  const statusLabel = (status) => status === "ACCEPTED" ? "Accepted by Test Registry" : status === "CHANGES_REQUIRED" ? "Changes Requested" : status === "REJECTED" ? "Rejected by Test Registry" : status === "FAILED" ? "Submission Failed" : status === "UNDER_REVIEW" ? "Under Review" : "Submitted to Registry";
  return <section className="studio-panel" aria-labelledby="agent-package-heading">
    <div className="studio-sectionHeading"><div><p className="studio-eyebrow">Governed Agent Package</p><h2 id="agent-package-heading">Prepare Agent Package</h2></div><span>{latest?.status === "VALID" ? "Ready for Registry" : latest?.status === "INVALID" ? "Needs Changes" : "Not generated"}</span></div>
    <p className="studio-muted">This creates a versioned definition from your exact finalized Agent revision. It does not submit to the Registry or run the Agent.</p>
    {state.error && <p className="studio-error" role="alert">The Agent Package could not be prepared. Your finalized Studio work is unchanged. Try again.</p>}
    {latest?.status === "VALID" ? <p className="studio-deploymentNotice" role="status"><strong>Agent Package Ready</strong><span>Standard validation passed. Ready for Registry submission is a preparation state only.</span></p> : latest?.status === "INVALID" ? <p className="studio-error" role="alert">This package needs changes before Registry preparation. Create a corrected Studio revision; the finalized revision was not changed.</p> : <button className="studio-primaryButton" type="button" onClick={generate} disabled={state.working}>{state.working ? "Preparing…" : "Prepare Agent Package"}</button>}
    {latest && <p className="studio-muted">Package version {latest.packageVersion} · Standard validation {latest.validation?.status || latest.status}</p>}
    {latest?.status === "VALID" && <div className="studio-subsection" aria-labelledby="registry-status-heading"><h3 id="registry-status-heading">Registry</h3>{submission ? <><p className={submission.status === "FAILED" ? "studio-error" : "studio-deploymentNotice"} role={submission.status === "FAILED" ? "alert" : "status"}><strong>{statusLabel(submission.status)}</strong><span>{submission.status === "FAILED" ? "The test Registry did not accept the request. Your package and Studio work are unchanged." : "This local test Registry result is not production approval or runtime authorization."}</span></p>{submission.status === "FAILED" && <button className="studio-primaryButton" type="button" onClick={retry} disabled={state.working}>{state.working ? "Retrying…" : "Retry Registry Submission"}</button>}</> : <><p className="studio-muted">Your validated package is ready for an explicit Registry submission.</p><button className="studio-primaryButton" type="button" onClick={submit} disabled={state.working}>{state.working ? "Submitting…" : "Submit to Registry"}</button></>}</div>}
    {latest?.status === "VALID" && <section className="studio-subsection" aria-labelledby="registry-history-heading"><h3 id="registry-history-heading">Registry History</h3>{state.submissions.length ? <ol className="studio-historyList">{state.submissions.map((item) => <li key={item.submissionId}><strong>Package v{item.packageVersion} · {statusLabel(item.status)}</strong><span>{item.failureMessage || (item.status === "CHANGES_REQUIRED" ? "Revise the Agent in Studio and prepare a new package." : item.status === "REJECTED" ? "The test Registry rejected this submission; your Studio work is unchanged." : item.status === "FAILED" ? "The test Registry request failed; your package and Studio work are unchanged." : "Registry status recorded from the durable submission history.")}</span>{item.submittedAt && <time dateTime={item.submittedAt}>{new Date(item.submittedAt).toLocaleString()}</time>}</li>)}</ol> : <p className="studio-muted" role="status">No Registry submissions yet.</p>}</section>}
  </section>;
}

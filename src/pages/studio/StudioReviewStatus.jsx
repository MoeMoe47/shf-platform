import React from "react";
import { getCurrentStudioReview, submitStudioReview } from "@/lib/studio/api.js";

const labels = { SUBMITTED: "Submitted", CHANGES_REQUESTED: "Changes requested", APPROVED: "Approved" };

export default function StudioReviewStatus({ role, projectId, workspace }) {
  const [state, setState] = React.useState({ loading: true, submitting: false, error: null, data: null });
  const load = React.useCallback(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));
    getCurrentStudioReview(role, projectId).then((data) => active && setState({ loading: false, submitting: false, error: null, data })).catch((error) => active && setState({ loading: false, submitting: false, error, data: null }));
    return () => { active = false; };
  }, [role, projectId]);
  React.useEffect(() => load(), [load]);

  const submission = state.data?.submission;
  const stale = Boolean(submission && submission.workspaceRevision !== workspace.revision);
  async function submit(event) {
    event.preventDefault();
    setState((current) => ({ ...current, submitting: true, error: null }));
    try { const data = await submitStudioReview(role, projectId); setState((current) => ({ ...current, loading: false, submitting: false, data: { ...current.data, submission: data }, error: null })); }
    catch (error) { setState((current) => ({ ...current, submitting: false, error })); }
  }
  return <section className="studio-panel studio-reviewPanel" aria-labelledby="studio-review-heading">
    <div className="studio-sectionHeading"><div><p className="studio-eyebrow">Human review</p><h2 id="studio-review-heading">Submit for Review</h2></div><span>{stale ? "Previous review applies to an earlier version" : submission ? labels[submission.status] : "Not submitted"}</span></div>
    {state.loading ? <p className="studio-muted" role="status">Loading review status…</p> : <>
      {stale && <p className="studio-reviewNotice" role="status">Your project has newer edits. Check and submit the updated version for review.</p>}
      {submission?.decision?.feedback && <div className="studio-reviewFeedback"><h3>Feedback from your reviewer</h3><p>{submission.decision.feedback}</p></div>}
      {state.error && <p className="studio-error" role="alert">We could not update your review status. Your saved work is safe. Please try again.</p>}
      {!submission || stale || submission.status === "CHANGES_REQUESTED" ? <form onSubmit={submit}><p className="studio-muted">Submit the current checked version when you are ready for a reviewer.</p><button className="studio-primaryButton" type="submit" disabled={state.submitting || !workspace.revision}>{state.submitting ? "Submitting…" : "Submit for Review"}</button></form> : <p className="studio-muted">This review is attached to workspace revision {submission.workspaceRevision}.</p>}
    </>}
  </section>;
}

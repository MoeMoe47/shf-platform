import React from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { decideStudioReview, getStudioReviewSubmission } from "@/lib/studio/api.js";

export default function StudioReviewSubmission() {
  const { role } = useUser();
  const { projectId, submissionId } = useParams();
  const [state, setState] = React.useState({ loading: true, error: null, data: null, saving: false, done: false });
  const [feedback, setFeedback] = React.useState("");
  React.useEffect(() => { let active = true; getStudioReviewSubmission(role, projectId, submissionId).then((data) => active && setState({ loading: false, error: null, data, saving: false, done: false })).catch((error) => active && setState({ loading: false, error, data: null, saving: false, done: false })); return () => { active = false; }; }, [role, projectId, submissionId]);
  async function decide(decision) {
    setState((current) => ({ ...current, saving: true, error: null }));
    try { await decideStudioReview(role, projectId, submissionId, { decision, feedback }); setState((current) => ({ ...current, saving: false, done: true })); }
    catch (error) { setState((current) => ({ ...current, saving: false, error })); }
  }
  if (state.loading) return <div className="studio-page"><p role="status" className="studio-muted">Loading submitted work…</p></div>;
  if (state.error || !state.data) return <div className="studio-page studio-page--narrow"><Link className="studio-backLink" to="/studio">← Back to Studio</Link><p className="studio-error" role="alert">This submission is not available for review.</p></div>;
  const { submission, work, qaRun, currentWorkspaceRevision } = state.data;
  const website = submission.projectType === "WEBSITE";
  const page = website ? work?.pages?.[0] : null;
  return <div className="studio-page studio-page--narrow"><Link className="studio-backLink" to={`/studio/projects/${encodeURIComponent(projectId)}`}>← Back to My Project</Link><header className="studio-projectHeader"><div><p className="studio-eyebrow">Reviewer view</p><h1 className="ld-h1">Submitted work</h1><p className="studio-muted">Revision {submission.workspaceRevision} · {website ? "Website" : "AI Agent"}</p></div><span className="studio-status">{submission.status}</span></header><div className="studio-builderNotice" role="note"><strong>You are reviewing the submitted revision.</strong><span>{currentWorkspaceRevision > submission.workspaceRevision ? "The student has made newer edits after this submission." : "This snapshot is immutable and separate from current work."}</span></div><section className="studio-panel" aria-labelledby="submitted-work-heading"><h2 id="submitted-work-heading">Submitted work</h2>{website ? <><h3>Page title</h3><p>{page?.title || "No title saved"}</p><h3>Page content</h3><p className="studio-reviewText">{page?.content || "No content saved"}</p></> : <><h3>Agent name</h3><p>{work?.name || "No name saved"}</p><h3>Instructions</h3><p className="studio-reviewText">{work?.instructions || "No instructions saved"}</p></>}<h3>Automated check</h3><p>{qaRun?.status || "Unavailable"} for revision {submission.workspaceRevision}</p></section>{!state.done && !submission.decision && <section className="studio-panel" aria-labelledby="decision-heading"><h2 id="decision-heading">Record review decision</h2><label className="studio-field"><span>Feedback for student</span><textarea rows="6" maxLength="10000" value={feedback} onChange={(event) => setFeedback(event.target.value)} /></label>{state.error && <p className="studio-error" role="alert">The decision could not be saved. Please try again.</p>}<div className="studio-builderActions"><button className="studio-secondaryButton" type="button" disabled={state.saving} onClick={() => decide("CHANGES_REQUESTED")}>Request Changes</button><button className="studio-primaryButton" type="button" disabled={state.saving} onClick={() => decide("APPROVED")}>Approve</button></div></section>}{(state.done || submission.decision) && <p className="studio-reviewNotice" role="status">Review decision recorded. It does not deliver, complete, or create evidence for this project.</p>}</div>;
}

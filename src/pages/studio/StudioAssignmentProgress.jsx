import React from "react";
import { Link, useParams } from "react-router-dom";
import { useUser } from "@/context/UserContext.jsx";
import { getStudioAssignmentProgress } from "@/lib/studio/api.js";

const stateLabels = {
  NOT_STARTED: "Not started",
  STARTED: "Started",
  BUILDING: "Building",
  READY_FOR_REVIEW: "Ready for review",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  FINALIZED: "Finalized",
};

function completionLabel(row) {
  if (row.assignmentComplete === true) return "Assignment complete";
  if (row.studioRequirementSatisfied) return "Studio requirement complete; other work remains";
  return "Studio requirement not complete";
}

export default function StudioAssignmentProgress() {
  const { role } = useUser();
  const { assignmentId } = useParams();
  const [state, setState] = React.useState({ loading: true, error: null, data: null });
  const load = React.useCallback(() => {
    let active = true;
    setState({ loading: true, error: null, data: null });
    getStudioAssignmentProgress(role, assignmentId).then((data) => active && setState({ loading: false, error: null, data })).catch((error) => active && setState({ loading: false, error, data: null }));
    return () => { active = false; };
  }, [role, assignmentId]);
  React.useEffect(() => load(), [load]);
  if (state.loading) return <main className="studio-page"><p className="studio-muted" role="status">Loading assignment progress…</p></main>;
  if (state.error || !state.data) return <main className="studio-page"><Link className="studio-backLink" to="/curriculum/instructor/operations">Back to instructor workspace</Link><p className="studio-error" role="alert">Assignment progress is unavailable.</p></main>;
  const { assignment, studioRequirement, learners } = state.data;
  return <main className="studio-page studio-assignmentProgress"><Link className="studio-backLink" to={`/curriculum/instructor/operations/assignments/${encodeURIComponent(assignment.id)}`}>Back to assignment</Link><header className="studio-pageHeader"><p className="studio-eyebrow">Assignment progress</p><h1 className="ld-h1">{assignment.title}</h1><p className="studio-lede">Studio progress is derived from learner projects, QA, review, delivery, and completion-policy facts.</p></header><section className="studio-panel" aria-labelledby="studio-requirement-heading"><h2 id="studio-requirement-heading">Studio requirement</h2><p>{studioRequirement ? `Required${studioRequirement.projectType ? ` · ${studioRequirement.projectType}` : ""}` : "No Studio project requirement is configured."}</p></section><section className="studio-progressRoster" aria-labelledby="studio-roster-heading"><div className="studio-sectionHeading"><h2 id="studio-roster-heading">Learners</h2><span>{learners.length}</span></div>{learners.length ? <div className="studio-progressList">{learners.map((row) => <article className="studio-progressRow" key={row.learner.id}><div><h3>{row.learner.name || row.learner.id}</h3><p>{row.learner.email}</p></div><div><strong>{stateLabels[row.state] || row.state}</strong><span>{completionLabel(row)}</span></div>{row.project ? <Link className="studio-textLink" to={`/studio/projects/${encodeURIComponent(row.project.id)}`}>Open project</Link> : null}{row.reviewUrl ? <Link className="studio-primaryButton" to={row.reviewUrl}>Review submission</Link> : null}</article>)}</div> : <p className="studio-muted">No eligible learners are assigned.</p>}</section></main>;
}

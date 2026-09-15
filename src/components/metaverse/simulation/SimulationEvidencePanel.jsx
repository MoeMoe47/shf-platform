import React from "react";

// MET-13 §5/§6 — this panel exists specifically so no simulation ever
// silently implies verified skill, a credential, course completion,
// career eligibility, job readiness, or civic authority from a raw
// completion.
export default function SimulationEvidencePanel({ evidenceBoundary, artifacts, onSubmitArtifact, artifactRequired }) {
  if (!evidenceBoundary) return null;
  return (
    <aside className="met-activity__boundary met-simulation__evidence" role="note" aria-label="Evidence and assessment boundary">
      <strong>What this simulation can and cannot do:</strong>
      <p>
        Assessment boundary: <strong>{evidenceBoundary.assessmentBoundary?.replace(/_/g, " ")}</strong>.{" "}
        {evidenceBoundary.notes}
      </p>
      <ul className="met-simulation__evidence-list">
        <li>Verified skill: {evidenceBoundary.isVerifiedSkill ? "yes" : "no — never from this runtime"}</li>
        <li>Credential: {evidenceBoundary.isCredential ? "yes" : "no"}</li>
        <li>Course completion: {evidenceBoundary.isCourseCompletion ? "yes" : "no"}</li>
        <li>Career eligibility: {evidenceBoundary.isCareerEligibility ? "yes" : "no"}</li>
        <li>Civic authority: {evidenceBoundary.isCivicAuthority ? "yes" : "no"}</li>
      </ul>
      {artifactRequired ? (
        <div className="met-simulation__artifact-form">
          <p>This simulation requires at least one submitted artifact before it can be completed.</p>
          <button type="button" onClick={onSubmitArtifact}>
            {artifacts?.length ? "Submit another artifact" : "Submit artifact"}
          </button>
          <p>{artifacts?.length ? `${artifacts.length} artifact(s) submitted.` : "No artifact submitted yet."}</p>
        </div>
      ) : null}
    </aside>
  );
}

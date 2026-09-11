// EvidenceVerificationSnapshot.jsx — "Evidence Verification Snapshot"
// panel with a real path to explanation. Locked UX principle: never
// show a verification status without a way to see why — "Why this
// status?" expands a local explanation panel in place, same pattern
// as Outcome Detail's OutcomeVerificationPanel.jsx and Agency Detail's
// AgencyAssuranceSnapshot.jsx. DEMO / FRAME DATA (see
// ../../evidenceSummaryMockData.js).
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function EvidenceVerificationSnapshot({ evidence }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="cse-card cse-evs-snapshot" aria-labelledby="cse-evs-snapshot-heading">
      <h3 id="cse-evs-snapshot-heading" className="cse-evs-snapshot__heading">
        Evidence Verification Snapshot
      </h3>

      <ul className="cse-evs-snapshot__list">
        {evidence.verificationSnapshot.checks.map((check) => (
          <li key={check.key} className="cse-evs-snapshot__item">
            <span className="cse-evs-snapshot__icon" aria-hidden="true">
              <ExplorerIcon name={check.state === "verified" ? "shieldCheck" : "infoCircle"} />
            </span>
            <span className="cse-evs-snapshot__label">{check.label}</span>
            <StatusBadge state={check.state}>{check.note || undefined}</StatusBadge>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="cse-evs-snapshot__action"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="cse-evs-snapshot-explanation"
      >
        Why this status?
        <ExplorerIcon name={expanded ? "chevronDown" : "arrowRight"} />
      </button>

      {expanded ? (
        <p id="cse-evs-snapshot-explanation" className="cse-evs-snapshot__explanation">
          {evidence.verificationSnapshot.explanation}
        </p>
      ) : null}
    </section>
  );
}

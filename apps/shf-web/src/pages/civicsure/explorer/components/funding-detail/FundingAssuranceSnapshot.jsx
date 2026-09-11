// FundingAssuranceSnapshot.jsx — "Funding Assurance Snapshot" panel
// with a real path to explanation. Locked UX principle: never show
// assurance results without a way to see why — "Why these results?"
// expands a local explanation panel in place (real local state, no
// backend), rather than a full modal, since this page already has a
// separate "About this data" drawer for source/methodology info.
// DEMO / FRAME DATA (see ../../fundingDetailMockData.js).
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function FundingAssuranceSnapshot({ funding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="cse-card cse-fnd-assurance" aria-labelledby="cse-fnd-assurance-heading">
      <h3 id="cse-fnd-assurance-heading" className="cse-fnd-assurance__heading">
        Funding Assurance Snapshot
      </h3>

      <ul className="cse-fnd-assurance__list">
        {funding.assurance.checks.map((check) => (
          <li key={check.key} className="cse-fnd-assurance__item">
            <span className="cse-fnd-assurance__icon" aria-hidden="true">
              <ExplorerIcon name={check.state === "verified" ? "shieldCheck" : "infoCircle"} />
            </span>
            <span className="cse-fnd-assurance__label">{check.label}</span>
            <StatusBadge state={check.state}>{check.note || undefined}</StatusBadge>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="cse-fnd-assurance__action"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="cse-fnd-assurance-explanation"
      >
        Why these results?
        <ExplorerIcon name={expanded ? "chevronDown" : "arrowRight"} />
      </button>

      {expanded ? (
        <p id="cse-fnd-assurance-explanation" className="cse-fnd-assurance__explanation">
          {funding.assurance.explanation}
        </p>
      ) : null}
    </section>
  );
}

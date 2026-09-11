// AgencyAssuranceSnapshot.jsx — "Agency Assurance Snapshot" panel
// with a real path to explanation. Locked UX principle: never show
// assurance results without a way to see why — "Why these results?"
// expands a local explanation panel in place, same pattern as Funding
// Detail's FundingAssuranceSnapshot.jsx. DEMO / FRAME DATA (see
// ../../agencyDetailMockData.js).
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function AgencyAssuranceSnapshot({ agency }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="cse-card cse-agy-assurance" aria-labelledby="cse-agy-assurance-heading">
      <h3 id="cse-agy-assurance-heading" className="cse-agy-assurance__heading">
        Agency Assurance Snapshot
      </h3>

      <ul className="cse-agy-assurance__list">
        {agency.assurance.checks.map((check) => (
          <li key={check.key} className="cse-agy-assurance__item">
            <span className="cse-agy-assurance__icon" aria-hidden="true">
              <ExplorerIcon name={check.state === "verified" ? "shieldCheck" : "infoCircle"} />
            </span>
            <span className="cse-agy-assurance__label">{check.label}</span>
            <StatusBadge state={check.state}>{check.note || undefined}</StatusBadge>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="cse-agy-assurance__action"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="cse-agy-assurance-explanation"
      >
        Why these results?
        <ExplorerIcon name={expanded ? "chevronDown" : "arrowRight"} />
      </button>

      {expanded ? (
        <p id="cse-agy-assurance-explanation" className="cse-agy-assurance__explanation">
          {agency.assurance.explanation}
        </p>
      ) : null}
    </section>
  );
}

// OutcomeVerificationPanel.jsx — "Why is this outcome Verified?"
// panel with a real path to explanation. Locked UX principle: never
// show a verification status without a way to see why — "View
// verification details" expands a local explanation panel in place,
// same pattern as Agency Detail's AgencyAssuranceSnapshot.jsx and
// Funding Detail's FundingAssuranceSnapshot.jsx. DEMO / FRAME DATA
// (see ../../outcomeDetailMockData.js).
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function OutcomeVerificationPanel({ outcome }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="cse-card cse-otc-verification" aria-labelledby="cse-otc-verification-heading">
      <h3 id="cse-otc-verification-heading" className="cse-otc-verification__heading">
        Why is this outcome Verified?
      </h3>

      <ul className="cse-otc-verification__list">
        {outcome.verification.checks.map((check) => (
          <li key={check.key} className="cse-otc-verification__item">
            <span className="cse-otc-verification__icon" aria-hidden="true">
              <ExplorerIcon name={check.state === "verified" ? "shieldCheck" : "infoCircle"} />
            </span>
            <span className="cse-otc-verification__label">{check.label}</span>
            <StatusBadge state={check.state}>{check.note || undefined}</StatusBadge>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="cse-otc-verification__action"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="cse-otc-verification-explanation"
      >
        View verification details
        <ExplorerIcon name={expanded ? "chevronDown" : "arrowRight"} />
      </button>

      {expanded ? (
        <p id="cse-otc-verification-explanation" className="cse-otc-verification__explanation">
          {outcome.verification.explanation}
        </p>
      ) : null}
    </section>
  );
}

// CountyAssuranceSnapshot.jsx — "County Assurance Snapshot" checklist
// with a real path to explanation. Locked UX principle (see task
// brief): never show assurance results without a way to see why —
// "Why these results?" performs a real local tab switch to Evidence
// (whose Data Quality Notices explain the flagged items here), same
// idea as Program Detail's "Why this status?" checklist and Provider
// Detail's "View compliance details" action. DEMO / FRAME DATA (see
// ../../countyDetailMockData.js).
import React from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import StatusBadge from "../StatusBadge.jsx";

export default function CountyAssuranceSnapshot({ county, onNavigateTab }) {
  return (
    <section className="cse-card cse-cty-assurance" aria-labelledby="cse-cty-assurance-heading">
      <h3 id="cse-cty-assurance-heading" className="cse-cty-assurance__heading">
        County Assurance Snapshot
      </h3>

      <ul className="cse-cty-assurance__list">
        {county.assurance.checks.map((check) => (
          <li key={check.key} className="cse-cty-assurance__item">
            <span className="cse-cty-assurance__icon" aria-hidden="true">
              <ExplorerIcon name={check.state === "verified" ? "shieldCheck" : "infoCircle"} />
            </span>
            <span className="cse-cty-assurance__label">{check.label}</span>
            <StatusBadge state={check.state}>{check.note || undefined}</StatusBadge>
          </li>
        ))}
      </ul>

      <button type="button" className="cse-cty-assurance__action" onClick={() => onNavigateTab("evidence")}>
        Why these results?
        <ExplorerIcon name="arrowRight" />
      </button>
    </section>
  );
}

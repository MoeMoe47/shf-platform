// FundingReconciliationPanel.jsx — small reconciliation summary
// beneath the Money Flow lineage, with a real local "How these totals
// relate" expand action (same lightweight expand-in-place pattern as
// FundingAssuranceSnapshot's "Why these results?"). DEMO / FRAME DATA
// (see ../../fundingDetailMockData.js).
import React, { useState } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function FundingReconciliationPanel({ reconciliation }) {
  const [expanded, setExpanded] = useState(false);

  const rows = [
    { key: "authorized", label: "Authorized", value: reconciliation.authorized },
    { key: "awarded", label: "Awarded", value: reconciliation.awarded },
    { key: "allocated", label: "Allocated to programs", value: reconciliation.allocatedToPrograms },
    { key: "contracts", label: "Provider contracts", value: reconciliation.providerContracts },
    { key: "expended", label: "Expended", value: reconciliation.expended },
    { key: "unreconciled", label: "Unreconciled", value: reconciliation.unreconciled, tone: "amber" },
  ];

  return (
    <section className="cse-card cse-fnd-reconciliation" aria-labelledby="cse-fnd-reconciliation-heading">
      <h3 id="cse-fnd-reconciliation-heading" className="cse-fnd-reconciliation__heading">
        Reconciliation Summary
      </h3>

      <ul className="cse-fnd-reconciliation__list">
        {rows.map((r) => (
          <li key={r.key} className={r.tone ? `cse-fnd-reconciliation__row--${r.tone}` : undefined}>
            <span>{r.label}</span>
            <strong>{r.value}</strong>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="cse-fnd-reconciliation__action"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="cse-fnd-reconciliation-explanation"
      >
        <ExplorerIcon name="infoCircle" />
        How these totals relate
      </button>

      {expanded ? (
        <p id="cse-fnd-reconciliation-explanation" className="cse-fnd-reconciliation__explanation">
          {reconciliation.explanation}
        </p>
      ) : null}
    </section>
  );
}

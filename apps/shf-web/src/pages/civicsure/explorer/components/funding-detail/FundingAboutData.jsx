// FundingAboutData.jsx — accessible "About this data" drawer.
// Mirrors the accessibility pattern already proven in Provider/County/
// Geography's About Data drawers (role="dialog", aria-modal, focus
// moved to the close button on open, Escape closes, overlay click
// closes) — a fresh, page-scoped implementation, same precedent as
// the rest of this suite. Adds Funding Authority and Reconciliation
// Status fields specific to this page's brief. DEMO / FRAME DATA (see
// ../../fundingDetailMockData.js).
import React, { useEffect, useRef } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function FundingAboutData({ funding, open, onClose }) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const { aboutData } = funding;
  const fields = [
    { label: "Source authority", value: aboutData.sourceAuthority },
    { label: "Funding authority", value: aboutData.fundingAuthority },
    { label: "Reporting period", value: aboutData.reportingPeriod },
    { label: "Last financial update", value: aboutData.lastFinancialUpdate },
    { label: "Last CivicSure evaluation", value: aboutData.evaluationDate },
    { label: "Evidence coverage", value: aboutData.evidenceCoverage },
    { label: "Reconciliation status", value: aboutData.reconciliationStatus },
    { label: "Known limitations", value: aboutData.limitations },
    { label: "Methodology", value: aboutData.methodology },
    { label: "Data dictionary", value: aboutData.dataDictionary },
  ];

  return (
    <div className="cse-fnd-drawer-overlay" onClick={onClose}>
      <div
        className="cse-fnd-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cse-fnd-drawer-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cse-fnd-drawer__head">
          <h2 id="cse-fnd-drawer-heading">About This Data</h2>
          <button type="button" className="cse-fnd-drawer__close" onClick={onClose} ref={closeButtonRef} aria-label="Close about this data panel">
            <ExplorerIcon name="close" />
          </button>
        </div>

        <dl className="cse-fnd-drawer__list">
          {fields.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

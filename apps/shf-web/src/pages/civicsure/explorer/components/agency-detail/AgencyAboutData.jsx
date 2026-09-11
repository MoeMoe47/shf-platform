// AgencyAboutData.jsx — accessible "About this data" drawer. Mirrors
// the accessibility pattern already proven throughout this suite
// (role="dialog", aria-modal, focus moved to the close button on
// open, Escape closes, overlay click closes) — a fresh, page-scoped
// implementation, same precedent as every other detail page. Adds
// Agency Authority and Reconciliation Status fields specific to this
// page's brief. DEMO / FRAME DATA (see ../../agencyDetailMockData.js).
import React, { useEffect, useRef } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function AgencyAboutData({ agency, open, onClose }) {
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

  const { aboutData } = agency;
  const fields = [
    { label: "Source authority", value: aboutData.sourceAuthority },
    { label: "Agency authority", value: aboutData.agencyAuthority },
    { label: "Reporting period", value: aboutData.reportingPeriod },
    { label: "Last source update", value: aboutData.lastSourceUpdate },
    { label: "CivicSure evaluation date", value: aboutData.evaluationDate },
    { label: "Evidence coverage", value: aboutData.evidenceCoverage },
    { label: "Reconciliation status", value: aboutData.reconciliationStatus },
    { label: "Known limitations", value: aboutData.limitations },
    { label: "Methodology", value: aboutData.methodology },
    { label: "Data dictionary", value: aboutData.dataDictionary },
  ];

  return (
    <div className="cse-agy-drawer-overlay" onClick={onClose}>
      <div
        className="cse-agy-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cse-agy-drawer-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cse-agy-drawer__head">
          <h2 id="cse-agy-drawer-heading">About This Data</h2>
          <button type="button" className="cse-agy-drawer__close" onClick={onClose} ref={closeButtonRef} aria-label="Close about this data panel">
            <ExplorerIcon name="close" />
          </button>
        </div>

        <dl className="cse-agy-drawer__list">
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

// OutcomeAboutData.jsx — accessible "About this data" drawer. Mirrors
// the accessibility pattern already proven throughout this suite
// (role="dialog", aria-modal, focus moved to the close button on
// open, Escape closes, overlay click closes) — a fresh, page-scoped
// implementation, same precedent as every other detail page. DEMO /
// FRAME DATA (see ../../outcomeDetailMockData.js).
import React, { useEffect, useRef } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function OutcomeAboutData({ outcome, open, onClose }) {
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

  const { aboutData } = outcome;
  const fields = [
    { label: "Outcome authority", value: aboutData.outcomeAuthority },
    { label: "Source authority", value: aboutData.sourceAuthority },
    { label: "Reporting period", value: aboutData.reportingPeriod },
    { label: "Methodology name/version", value: aboutData.methodologyNameVersion },
    { label: "Last source update", value: aboutData.lastSourceUpdate },
    { label: "CivicSure evaluation date", value: aboutData.evaluationDate },
    { label: "Evidence coverage", value: aboutData.evidenceCoverage },
    { label: "Known limitations", value: aboutData.limitations },
    { label: "Calculation rule", value: aboutData.calculationRule },
    { label: "Data dictionary", value: aboutData.dataDictionary },
  ];

  return (
    <div className="cse-otc-drawer-overlay" onClick={onClose}>
      <div
        className="cse-otc-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cse-otc-drawer-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cse-otc-drawer__head">
          <h2 id="cse-otc-drawer-heading">About This Data</h2>
          <button type="button" className="cse-otc-drawer__close" onClick={onClose} ref={closeButtonRef} aria-label="Close about this data panel">
            <ExplorerIcon name="close" />
          </button>
        </div>

        <dl className="cse-otc-drawer__list">
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

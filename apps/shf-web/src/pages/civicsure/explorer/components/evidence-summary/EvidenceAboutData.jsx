// EvidenceAboutData.jsx — accessible "About this data" drawer.
// Mirrors the accessibility pattern already proven throughout this
// suite (role="dialog", aria-modal, focus moved to the close button
// on open, Escape closes, overlay click closes) — a fresh, page-
// scoped implementation, same precedent as every other detail page.
// DEMO / FRAME DATA (see ../../evidenceSummaryMockData.js).
import React, { useEffect, useRef } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function EvidenceAboutData({ evidence, open, onClose }) {
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

  const { aboutData } = evidence;
  const fields = [
    { label: "Evidence authority", value: aboutData.evidenceAuthority },
    { label: "Source authority", value: aboutData.sourceAuthority },
    { label: "Reporting period", value: aboutData.reportingPeriod },
    { label: "Verification decision date", value: aboutData.decisionDate },
    { label: "Methodology name/version", value: aboutData.methodologyNameVersion },
    { label: "Evidence coverage", value: aboutData.evidenceCoverage },
    { label: "Public availability rule", value: aboutData.publicAvailabilityRule },
    { label: "Known limitations", value: aboutData.limitations },
    { label: "Last review date", value: aboutData.lastReviewDate },
    { label: "Data dictionary", value: aboutData.dataDictionary },
  ];

  return (
    <div className="cse-evs-drawer-overlay" onClick={onClose}>
      <div
        className="cse-evs-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cse-evs-drawer-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cse-evs-drawer__head">
          <h2 id="cse-evs-drawer-heading">About This Data</h2>
          <button type="button" className="cse-evs-drawer__close" onClick={onClose} ref={closeButtonRef} aria-label="Close about this data panel">
            <ExplorerIcon name="close" />
          </button>
        </div>

        <dl className="cse-evs-drawer__list">
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

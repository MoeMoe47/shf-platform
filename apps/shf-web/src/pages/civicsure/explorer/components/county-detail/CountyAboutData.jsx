// CountyAboutData.jsx — accessible "About this data" drawer. Mirrors
// the accessibility pattern already built for Provider Detail's
// ProviderAboutData.jsx (role="dialog", aria-modal, focus moved to
// the close button on open, Escape closes, overlay click closes) —
// a fresh, county-scoped implementation rather than a cross-page
// import, since each page owns its own drawer markup/CSS, same
// precedent as the rest of this page's layout. Adds a Data Dictionary
// field beyond Provider Detail's version, per this page's brief.
// DEMO / FRAME DATA (see ../../countyDetailMockData.js).
import React, { useEffect, useRef } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function CountyAboutData({ county, open, onClose }) {
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

  const { aboutData } = county;
  const fields = [
    { label: "Source authority", value: aboutData.sourceAuthority },
    { label: "Reporting period", value: aboutData.reportingPeriod },
    { label: "Last source update", value: aboutData.lastSourceUpdate },
    { label: "CivicSure evaluation date", value: aboutData.evaluationDate },
    { label: "Evidence coverage", value: aboutData.evidenceCoverage },
    { label: "Limitations", value: aboutData.limitations },
    { label: "Methodology", value: aboutData.methodology },
    { label: "Data dictionary", value: aboutData.dataDictionary },
  ];

  return (
    <div className="cse-cty-drawer-overlay" onClick={onClose}>
      <div
        className="cse-cty-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cse-cty-drawer-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cse-cty-drawer__head">
          <h2 id="cse-cty-drawer-heading">About This Data</h2>
          <button type="button" className="cse-cty-drawer__close" onClick={onClose} ref={closeButtonRef} aria-label="Close about this data panel">
            <ExplorerIcon name="close" />
          </button>
        </div>

        <dl className="cse-cty-drawer__list">
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

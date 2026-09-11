// CompareAboutPanel.jsx — accessible drawer combining "About
// Comparison" (the comparability principles) and "About This Data"
// (source/methodology/limitations fields) into one panel, since both
// are reached from the same header action and splitting them into two
// separate drawers would add a click without adding clarity. Mirrors
// the accessibility pattern already proven throughout this suite
// (role="dialog", aria-modal, focus moved to the close button on
// open, Escape closes, overlay click closes). DEMO / FRAME DATA (see
// ../../compareViewMockData.js).
import React, { useEffect, useRef } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { ABOUT_COMPARISON_POINTS, ABOUT_DATA_FIELDS } from "../../compareViewMockData.js";

export default function CompareAboutPanel({ open, onClose }) {
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

  const dataFields = [
    { label: "Source authority", value: ABOUT_DATA_FIELDS.sourceAuthority },
    { label: "Reporting period", value: ABOUT_DATA_FIELDS.reportingPeriod },
    { label: "Methodology versions", value: ABOUT_DATA_FIELDS.methodologyVersions },
    { label: "Last source update", value: ABOUT_DATA_FIELDS.lastSourceUpdate },
    { label: "CivicSure evaluation date", value: ABOUT_DATA_FIELDS.evaluationDate },
    { label: "Evidence coverage", value: ABOUT_DATA_FIELDS.evidenceCoverage },
    { label: "Known limitations", value: ABOUT_DATA_FIELDS.limitations },
    { label: "Data dictionary", value: ABOUT_DATA_FIELDS.dataDictionary },
  ];

  return (
    <div className="cse-cmp-drawer-overlay" onClick={onClose}>
      <div
        className="cse-cmp-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cse-cmp-drawer-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cse-cmp-drawer__head">
          <h2 id="cse-cmp-drawer-heading">About Comparison</h2>
          <button type="button" className="cse-cmp-drawer__close" onClick={onClose} ref={closeButtonRef} aria-label="Close about comparison panel">
            <ExplorerIcon name="close" />
          </button>
        </div>

        <ul className="cse-cmp-drawer__points">
          {ABOUT_COMPARISON_POINTS.map((point, i) => (
            <li key={i}>
              <ExplorerIcon name="infoCircle" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <h3 className="cse-cmp-drawer__subheading">About This Data</h3>
        <dl className="cse-cmp-drawer__list">
          {dataFields.map((f) => (
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

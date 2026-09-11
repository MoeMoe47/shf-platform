// GeographyAboutData.jsx — accessible "About this data" drawer.
// Mirrors the accessibility pattern already proven in Provider
// Detail's ProviderAboutData.jsx and County Detail's
// CountyAboutData.jsx (role="dialog", aria-modal, focus moved to the
// close button on open, Escape closes, overlay click closes) — a
// fresh implementation rather than a cross-page import, same
// precedent as those two. Adds a Geographic Coverage field specific
// to this page's brief. DEMO / FRAME DATA (see
// ../../geographyExplorerMockData.js).
import React, { useEffect, useRef } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { GEO_ABOUT_DATA } from "../../geographyExplorerMockData.js";

export default function GeographyAboutData({ open, onClose }) {
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

  const fields = [
    { label: "Source authority", value: GEO_ABOUT_DATA.sourceAuthority },
    { label: "Geographic coverage", value: GEO_ABOUT_DATA.geographicCoverage },
    { label: "Reporting period", value: GEO_ABOUT_DATA.reportingPeriod },
    { label: "Last source update", value: GEO_ABOUT_DATA.lastSourceUpdate },
    { label: "CivicSure evaluation date", value: GEO_ABOUT_DATA.evaluationDate },
    { label: "Evidence coverage", value: GEO_ABOUT_DATA.evidenceCoverage },
    { label: "Limitations", value: GEO_ABOUT_DATA.limitations },
    { label: "Methodology", value: GEO_ABOUT_DATA.methodology },
    { label: "Data dictionary", value: GEO_ABOUT_DATA.dataDictionary },
  ];

  return (
    <div className="cse-geo-drawer-overlay" onClick={onClose}>
      <div
        className="cse-geo-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cse-geo-drawer-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cse-geo-drawer__head">
          <h2 id="cse-geo-drawer-heading">About This Data</h2>
          <button type="button" className="cse-geo-drawer__close" onClick={onClose} ref={closeButtonRef} aria-label="Close about this data panel">
            <ExplorerIcon name="close" />
          </button>
        </div>

        <dl className="cse-geo-drawer__list">
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

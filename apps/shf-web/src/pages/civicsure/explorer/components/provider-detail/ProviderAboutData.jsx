// ProviderAboutData.jsx — accessible "About this data" drawer.
// Real local interaction: open/close state lives in
// CivicSureProviderDetailPage.jsx. Implements the minimum a modal
// drawer needs to be usable with a keyboard/screen reader: role and
// aria-modal on the panel, a labelled heading, Escape to close, focus
// moved to the close button on open, and an overlay click that also
// closes. DEMO / FRAME DATA (see ../../providerDetailMockData.js).
import React, { useEffect, useRef } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";

export default function ProviderAboutData({ provider, open, onClose }) {
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

  const { aboutData } = provider;
  const fields = [
    { label: "Source authority", value: aboutData.sourceAuthority },
    { label: "Reporting period", value: aboutData.reportingPeriod },
    { label: "Last source update", value: aboutData.lastSourceUpdate },
    { label: "CivicSure evaluation date", value: aboutData.evaluationDate },
    { label: "Evidence coverage", value: aboutData.evidenceCoverage },
    { label: "Limitations", value: aboutData.limitations },
    { label: "Methodology", value: aboutData.methodology },
  ];

  return (
    <div className="cse-pvd-drawer-overlay" onClick={onClose}>
      <div
        className="cse-pvd-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cse-pvd-drawer-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cse-pvd-drawer__head">
          <h2 id="cse-pvd-drawer-heading">About This Data</h2>
          <button type="button" className="cse-pvd-drawer__close" onClick={onClose} ref={closeButtonRef} aria-label="Close about this data panel">
            <ExplorerIcon name="close" />
          </button>
        </div>

        <dl className="cse-pvd-drawer__list">
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

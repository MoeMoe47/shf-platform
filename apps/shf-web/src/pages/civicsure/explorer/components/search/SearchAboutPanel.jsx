// SearchAboutPanel.jsx — accessible drawer combining "About Search"
// (public search scope and limitations) and "About This Data" (source/
// methodology/limitations fields) into one panel, the same combined-
// drawer precedent Compare View established (CompareAboutPanel.jsx).
// Mirrors the accessibility pattern already proven throughout this
// suite (role="dialog", aria-modal, focus moved to the close button on
// open, Escape closes, overlay click closes). DEMO / FRAME DATA (see
// ../../searchResultsMockData.js).
import React, { useEffect, useRef } from "react";
import { ExplorerIcon } from "../../explorerIcons.jsx";
import { ABOUT_SEARCH_POINTS, ABOUT_DATA_FIELDS } from "../../searchResultsMockData.js";

export default function SearchAboutPanel({ open, onClose }) {
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
    { label: "Public search scope", value: ABOUT_DATA_FIELDS.scope },
    { label: "Data sources", value: ABOUT_DATA_FIELDS.dataSources },
    { label: "Reporting periods", value: ABOUT_DATA_FIELDS.reportingPeriods },
    { label: "Last demo update", value: ABOUT_DATA_FIELDS.lastDemoUpdate },
    { label: "Known limitations", value: ABOUT_DATA_FIELDS.limitations },
    { label: "Methodology", value: ABOUT_DATA_FIELDS.methodology },
    { label: "Data dictionary", value: ABOUT_DATA_FIELDS.dataDictionary },
  ];

  return (
    <div className="cse-srch-drawer-overlay" onClick={onClose}>
      <div
        className="cse-srch-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cse-srch-drawer-heading"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cse-srch-drawer__head">
          <h2 id="cse-srch-drawer-heading">About Search</h2>
          <button type="button" className="cse-srch-drawer__close" onClick={onClose} ref={closeButtonRef} aria-label="Close about search panel">
            <ExplorerIcon name="close" />
          </button>
        </div>

        <ul className="cse-srch-drawer__points">
          {ABOUT_SEARCH_POINTS.map((point, i) => (
            <li key={i}>
              <ExplorerIcon name="infoCircle" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <h3 className="cse-srch-drawer__subheading">About This Data</h3>
        <dl className="cse-srch-drawer__list">
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

import React from "react";

export default function ShsReportBrandingPanel({ brandMode = "shs-premium", onChange }) {
  return (
    <section className="shs-report-panel">
      <div className="shs-report-panel__header">
        <p>Branding</p>
        <h2>Report Branding Settings</h2>
        <span>Client white-label reports still carry the Powered by Silicon Heartland OS badge.</span>
      </div>
      <div className="shs-report-choice-row">
        {[
          ["shs-premium", "SHS Premium Mode", "Silicon Heartland OS branding, premium header/footer artwork, data mode badges."],
          ["client-white-label", "Client White-Label Mode", "Client-facing brand mode with Silicon Heartland OS powered-by attribution."],
        ].map(([value, title, text]) => (
          <button
            key={value}
            type="button"
            className={brandMode === value ? "is-active" : ""}
            onClick={() => onChange?.(value)}
          >
            <strong>{title}</strong>
            <span>{text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

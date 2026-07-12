import React from "react";

export default function ExecutiveSafetyPanel({ safety, scanResult, onSafetyScan }) {
  return (
    <section className="ecc-panel ecc-span-5">
      <div className="ecc-panel-heading"><p>Safety and Boundaries</p><h2>Dangerous flags remain false</h2></div>
      <p>{safety.safety_statement}</p>
      <p className="ecc-boundary">Direct Connect remains direct-source proof only. The Command Center cannot mark public-approved or mutate SHF Impact Data.</p>
      <button type="button" onClick={onSafetyScan}>Run Local Safety Scan</button>
      <div className="ecc-flag-grid">
        {Object.entries(safety.dangerous_flags).map(([flag, enabled]) => <span key={flag}>{flag}: {String(enabled)}</span>)}
      </div>
      {scanResult && <strong>Safety scan: {scanResult.safety_status}</strong>}
    </section>
  );
}

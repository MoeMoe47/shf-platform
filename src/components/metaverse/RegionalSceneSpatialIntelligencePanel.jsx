import React, { useState } from "react";

const ACCESSIBILITY_CONTRACT = Object.freeze({
  activationRole: "button",
  keyboardOperable: true,
  resultRole: "status",
  live: "polite",
  requiresColor: false,
  requiresMotion: false,
  visibleFocus: true,
  states: Object.freeze(["loading", "empty", "failure", "result"]),
  deterministicText: true,
  reducedMotionSafe: true,
  pointerOnly: false,
  accessibleName: "Spatial Intelligence",
});

export function getRegionalSceneSpatialIntelligenceAccessibilityContract() {
  return ACCESSIBILITY_CONTRACT;
}

function EvidenceSummary({ evidenceSummary }) {
  if (!Array.isArray(evidenceSummary) || evidenceSummary.length === 0) return null;
  return (
    <p className="met-regional-spatial-intelligence__detail">
      Evidence: {evidenceSummary.map((item) => item.sourceAuthority || item.sourceRecordId).filter(Boolean).join(", ")}
    </p>
  );
}

export default function RegionalSceneSpatialIntelligencePanel({ client }) {
  const [result, setResult] = useState(() => client?.getInspectionResult?.() || null);
  const state = result ? (result.status === "FAILED" ? "failure" : "result") : "empty";

  const activate = () => {
    const next = client?.activateInspection?.();
    setResult(next?.ok ? next : null);
  };

  return (
    <section className="met-regional-spatial-intelligence" role="region" aria-label="Spatial Intelligence" data-regional-spatial-intelligence="true">
      <h2>Spatial Intelligence</h2>
      <button type="button" onClick={activate} aria-label="Run Spatial Intelligence inspection">
        Inspect Oil Rig geometry
      </button>
      <div className="met-regional-spatial-intelligence__status" role="status" aria-live="polite" aria-atomic="true">
        {state === "empty" ? <p>No Spatial Intelligence fixture is available.</p> : null}
        {state === "failure" ? <p>Spatial Intelligence inspection unavailable.</p> : null}
        {state === "result" ? (
          <div>
            <p><strong>Relationship:</strong> {result.relationship}</p>
            <p><strong>Result:</strong> {String(result.value)}</p>
            <p><strong>Coordinate space:</strong> {result.coordinateSpace}</p>
            {result.freshnessState ? <p><strong>Freshness:</strong> {result.freshnessState}</p> : null}
            <EvidenceSummary evidenceSummary={result.evidenceSummary} />
            {Array.isArray(result.limitations) && result.limitations.length ? <p className="met-regional-spatial-intelligence__detail">Limitations: {result.limitations.join("; ")}</p> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

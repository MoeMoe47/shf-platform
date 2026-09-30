import React from "react";

import { sanitizeCommandCenterSpatialView } from "../../system/spatial/commandCenter/index.js";

export const SPATIAL_COMMAND_CENTER_UI_PRIVACY_CONTRACT = Object.freeze({
  rendersSanitizedOutputsOnly: true,
  consumesWave8BPrivacyBoundary: true,
  directlyReadsDomainInternals: false,
  exposesGeometryHashInNormalUi: false,
  broadensDevOnlyInspection: false,
  rendersArbitraryBackendErrors: false,
});

export const SPATIAL_COMMAND_CENTER_UI_PROHIBITED_RENDER_FIELDS = Object.freeze([
  "rawSourceRecord",
  "rawProvenance",
  "evidenceReferences",
  "hiddenIds",
  "restrictedSourceIdentifiers",
  "approvalMetadata",
  "reviewerIdentity",
  "authoringMetadata",
  "filesystemPaths",
  "internalDiagnostics",
  "authorizationObjects",
  "policyObjects",
]);

export const SPATIAL_COMMAND_CENTER_UI_SAFE_STATE_TEXT = Object.freeze({
  unknown: "Unknown",
  unavailable: "Unavailable",
  unqualified: "Unqualified",
  noTransformAvailable: "No coordinate transform available",
  intelligenceUnavailable: "Spatial Intelligence unavailable",
});

const panelStyle = {
  borderLeft: "1px solid #e2e8f0",
  padding: 20,
  background: "#ffffff",
  minWidth: 260,
};

const sectionStyle = {
  borderTop: "1px solid #e2e8f0",
  marginTop: 16,
  paddingTop: 16,
};

export default function SpatialContextPanel({ workspace, spatialView, selectionSnapshot }) {
  const safeView = sanitizeCommandCenterSpatialView(spatialView || {});
  const selectedFeature = selectionSnapshot?.activeSelection;

  return (
    <aside aria-label="Command Center contextual panel" style={panelStyle}>
      <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Context</h2>
      <section style={sectionStyle} aria-label="Workspace summary">
        <p style={{ margin: 0, color: "#475569" }}>Workspace</p>
        <strong>{workspace?.label || SPATIAL_COMMAND_CENTER_UI_SAFE_STATE_TEXT.unknown}</strong>
        <p style={{ margin: "8px 0 0", color: "#334155" }}>
          {workspace?.coordinateSpace || SPATIAL_COMMAND_CENTER_UI_SAFE_STATE_TEXT.unavailable}
        </p>
      </section>
      <section style={sectionStyle} aria-label="Selection status" aria-live="polite">
        <p style={{ margin: 0, color: "#475569" }}>Selected feature</p>
        {selectedFeature ? (
          <strong>{selectedFeature.featureId}</strong>
        ) : (
          <span>No presentation selection</span>
        )}
      </section>
      <section style={sectionStyle} aria-label="Safe limitations">
        <p style={{ margin: 0, color: "#475569" }}>Limitations</p>
        <ul style={{ paddingLeft: 18, margin: "8px 0 0" }}>
          <li>{SPATIAL_COMMAND_CENTER_UI_SAFE_STATE_TEXT.noTransformAvailable}</li>
          {!workspace?.intelligenceAvailable ? (
            <li>{SPATIAL_COMMAND_CENTER_UI_SAFE_STATE_TEXT.intelligenceUnavailable}</li>
          ) : null}
          {(safeView.limitations || []).map((limitation) => (
            <li key={limitation.id || limitation.label}>{limitation.label || limitation}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

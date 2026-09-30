import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_UI_PRIVACY_CONTRACT,
  SPATIAL_COMMAND_CENTER_UI_PROHIBITED_RENDER_FIELDS,
  SPATIAL_COMMAND_CENTER_UI_SAFE_STATE_TEXT,
} from "../src/components/spatial-command-center/SpatialContextPanel.jsx";

test("W8D-PRIVACY-01 freezes sanitized-output-only rendering", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_UI_PRIVACY_CONTRACT, {
    rendersSanitizedOutputsOnly: true,
    consumesWave8BPrivacyBoundary: true,
    directlyReadsDomainInternals: false,
    exposesGeometryHashInNormalUi: false,
    broadensDevOnlyInspection: false,
    rendersArbitraryBackendErrors: false,
  });
});

test("W8D-PRIVACY-02 prohibits raw and restricted fields in UI rendering", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_UI_PROHIBITED_RENDER_FIELDS, [
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
});

test("W8D-PRIVACY-03 represents unknown unavailable and unqualified states safely", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_UI_SAFE_STATE_TEXT, {
    unknown: "Unknown",
    unavailable: "Unavailable",
    unqualified: "Unqualified",
    noTransformAvailable: "No coordinate transform available",
    intelligenceUnavailable: "Spatial Intelligence unavailable",
  });
});

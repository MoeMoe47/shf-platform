import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_EVIDENCE_PRESENTATION_CONTRACT,
  SPATIAL_COMMAND_CENTER_FRESHNESS_CONTRACT,
  SPATIAL_COMMAND_CENTER_TEMPORAL_PRESENTATION_CONTRACT,
} from "../src/system/spatial/commandCenter/intelligenceViewModel.js";

test("W8E-ETF-01 freezes evidence as sanitized reference-only presentation", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_EVIDENCE_PRESENTATION_CONTRACT, {
    evidenceReferencesRemainReferenceOnly: true,
    consumesWave7EvidenceSanitization: true,
    mayDisplayEvidenceAvailableState: true,
    mayDisplaySanitizedSourceAuthorityLabel: true,
    mayDisplayBoundedEvidenceCount: true,
    displaysRawEvidenceReferences: false,
    displaysRawSourceObjects: false,
    displaysFilesystemPaths: false,
    displaysInternalProvenanceBlobs: false,
    displaysBackendDiagnostics: false,
  });
});

test("W8E-ETF-02 freezes temporal ownership and safe summary fields", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_TEMPORAL_PRESENTATION_CONTRACT, {
    safeFields: [
      "observedAt",
      "effectiveFrom",
      "effectiveTo",
      "retrievedAt",
      "projectedAt",
      "supersededAt",
    ],
    projectedAtAuthority: "SPATIAL",
    sourceTimestampAuthority: "SOURCE_OR_EVIDENCE",
    unknownTimestampsRemainUnknown: true,
    missingTimestampsRemainNull: true,
    rewritesTimestampOwnership: false,
  });
});

test("W8E-ETF-03 freezes freshness vocabulary without qualification or publication meaning", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_FRESHNESS_CONTRACT, {
    states: ["CURRENT", "STALE", "EXPIRED", "HISTORICAL", "UNKNOWN"],
    disallowedStates: ["LIVE", "REAL_TIME", "VERIFIED_CURRENT", "HEALTHY"],
    freshnessIsQualification: false,
    freshnessIsPublication: false,
    freshnessIsEvidenceStrength: false,
  });
});

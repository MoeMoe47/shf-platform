import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_INTELLIGENCE_ACCESSIBILITY_CONTRACT,
  SPATIAL_COMMAND_CENTER_INTELLIGENCE_AUTHORITY_CONTRACT,
  SPATIAL_COMMAND_CENTER_INTELLIGENCE_PRIVACY_CONTRACT,
} from "../src/components/spatial-command-center/SpatialIntelligencePanel.jsx";

test("W8E-PRIV-01 freezes sanitized intelligence rendering and restricted-state privacy", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_INTELLIGENCE_PRIVACY_CONTRACT, {
    consumesSanitizedIntelligenceOnly: true,
    hiddenRestrictedRemainGeneric: true,
    notPublishedRemainsSuppressed: true,
    rendersRawFeatureIdsWhenRestricted: false,
    rendersRawEvidenceReferences: false,
    rendersRawGeometry: false,
    rendersRawProvenance: false,
    rendersSourceRecords: false,
    rendersApprovalMetadata: false,
    rendersReviewerIdentities: false,
    rendersFilesystemPaths: false,
    rendersInternalDiagnostics: false,
    rendersPolicyObjects: false,
    rendersAuthorizationObjects: false,
  });
});

test("W8E-PRIV-02 freezes Command Center intelligence as presentation-only with no new authorities", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_INTELLIGENCE_AUTHORITY_CONTRACT, {
    evidenceAuthority: false,
    reasoningAuthority: false,
    sourceAuthority: false,
    domainAuthority: false,
    policyAuthority: false,
    metricAuthority: false,
    publicationAuthority: false,
    authorizationAuthority: false,
    transformAuthority: false,
  });
});

test("W8E-PRIV-03 freezes accessible intelligence semantics", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_INTELLIGENCE_ACCESSIBILITY_CONTRACT, {
    intelligenceStatusTextEquivalent: true,
    relationshipResultUnderstandableWithoutColor: true,
    freshnessUnderstandableWithoutColor: true,
    temporalSummarySemanticText: true,
    evidenceSummaryAccessibleLabel: true,
    limitationTextReadableByScreenReader: true,
    unsupportedResultRepresentedExplicitly: true,
    noHoverOnlyIntelligenceMeaning: true,
  });
});

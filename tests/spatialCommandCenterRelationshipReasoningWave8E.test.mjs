import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_RELATIONSHIP_REASONING_CONTRACT,
  SPATIAL_COMMAND_CENTER_WAVE8E_OIL_RIG_REFERENCE_CASE,
} from "../src/system/spatial/commandCenter/intelligenceViewModel.js";

test("W8E-REL-01 freezes the canonical Oil Rig governed intelligence reference case", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_WAVE8E_OIL_RIG_REFERENCE_CASE, {
    qualifiedClientId: "metaverse-regional-scene-oil-rig",
    left: "Oil Rig polygon",
    operation: "CONTAINS",
    right: "scene-local point [50, 50]",
    coordinateSpace: "metaverse.regional-scene",
    reasoningClass: "GEOMETRIC_FACT",
    result: true,
  });
});

test("W8E-REL-02 freezes relationship and reasoning boundaries from Wave 7", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_RELATIONSHIP_REASONING_CONTRACT, {
    consumesReasoningModule: "src/system/spatial/intelligence/reasoning.js",
    allowedReasoningClasses: ["GEOMETRIC_FACT", "PRESENTATION_DERIVATION"],
    disallowedReasoningClasses: ["DOMAIN_FACT", "POLICY_DECISION", "METRIC_TRUTH"],
    relationshipVocabulary: [
      "CONTAINS",
      "WITHIN",
      "INTERSECTS",
      "OVERLAPS",
      "TOUCHES",
      "ADJACENT_TO",
      "DISJOINT",
      "SAME_LOCATION",
    ],
    adjacentToState: "UNSUPPORTED_IN_V1",
    sameCoordinateSpaceOnly: true,
    derivesCrossSpaceRelationships: false,
    createsTransforms: false,
    duplicatesReasoningLogic: false,
  });
});

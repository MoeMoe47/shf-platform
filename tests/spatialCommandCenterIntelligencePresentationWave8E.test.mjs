import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_INTELLIGENCE_PRESENTATION_CATEGORIES,
  SPATIAL_COMMAND_CENTER_INTELLIGENCE_PRESENTATION_CONTRACT,
} from "../src/components/spatial-command-center/SpatialIntelligencePanel.jsx";

test("W8E-PRESENT-01 freezes the narrow Oil Rig intelligence presentation categories", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_INTELLIGENCE_PRESENTATION_CATEGORIES, [
    "Intelligence Availability",
    "Relationship Result",
    "Freshness",
    "Temporal Context",
    "Evidence Summary",
    "Limitations",
  ]);
});

test("W8E-PRESENT-02 freezes Wave 7 governed output consumption without UI reasoning duplication", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_INTELLIGENCE_PRESENTATION_CONTRACT, {
    workspaceScope: "metaverse-regional-scene-oil-rig",
    consumesWave7GovernedIntelligenceOutput: true,
    consumesCommandCenterIntelligenceViewModel: true,
    duplicatesGeometryTopologyLogicInUi: false,
    recomputesContainmentInReact: false,
    displaysArbitraryCharts: false,
    displaysFakeScores: false,
    redesignsCommandCenter: false,
  });
});

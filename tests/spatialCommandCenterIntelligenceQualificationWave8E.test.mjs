import assert from "node:assert/strict";
import test from "node:test";

import {
  SPATIAL_COMMAND_CENTER_INTELLIGENCE_QUALIFICATION,
  SPATIAL_COMMAND_CENTER_INTELLIGENCE_UI_ELIGIBILITY,
} from "../src/system/spatial/commandCenter/intelligenceViewModel.js";

test("W8E-QUAL-01 freezes Oil Rig as the only intelligence-qualified Command Center workspace", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_INTELLIGENCE_QUALIFICATION, [
    {
      qualifiedClientId: "iep-ohio-county-map",
      label: "IEP Ohio County Map",
      coordinateSpace: "real-world.county-geojson",
      spatialQualified: true,
      intelligenceQualified: false,
    },
    {
      qualifiedClientId: "metaverse-quick-map",
      label: "Metaverse Quick Map",
      coordinateSpace: "metaverse.quick-map",
      spatialQualified: true,
      intelligenceQualified: false,
    },
    {
      qualifiedClientId: "metaverse-regional-scene-oil-rig",
      label: "Metaverse Regional Scene - Oil Rig",
      coordinateSpace: "metaverse.regional-scene",
      spatialQualified: true,
      intelligenceQualified: true,
    },
  ]);
});

test("W8E-QUAL-02 freezes non-qualified workspace intelligence states as safe text only", () => {
  assert.deepEqual(SPATIAL_COMMAND_CENTER_INTELLIGENCE_UI_ELIGIBILITY, {
    iepNoIntelligenceUi: true,
    quickMapNoIntelligenceUi: true,
    oilRigIntelligencePanelAllowed: true,
    notQualifiedText: "Spatial Intelligence not qualified for this workspace.",
    promotesDeferredClients: false,
    broadensIntelligenceQualification: false,
  });
});

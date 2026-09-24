import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getDestinationRoadAccess,
  getDestinationScene,
  getDestinationSpatialRelationship,
  getDestinationWaterAccess,
  getMasterCityLocation,
  getQuickMapLocation,
  METAVERSE_DESTINATION_RELATIONSHIPS,
  validateMetaverseDestinationRelationships,
} from "../src/system/metaverse/metaverseDestinationRelationshipRegistry.js";
import { METAVERSE_ROAD_TRACES } from "../src/system/metaverse/metaverseRoadTraceRegistry.js";
import { METAVERSE_RIVER_FLOW_PATHS } from "../src/system/metaverse/metaverseRiverFlowRegistry.js";
import { REGIONAL_ROUTE_SEQUENCE } from "../src/system/metaverse/regionalSceneRegistry.js";
import { MINIMAP_LOCATION_REGISTRY } from "../src/system/metaverse/metaverseMiniMapRegistry.js";

test("every canonical destination has a preserved master-city facility relationship", () => {
  assert.equal(METAVERSE_DESTINATION_RELATIONSHIPS.length, 36);
  assert.deepEqual(validateMetaverseDestinationRelationships(), []);
  const career = getDestinationSpatialRelationship("career-center");
  assert.equal(career.masterCity.facilityId, "career-center");
  assert.deepEqual(career.masterCity.position, { x: 34, y: 50 });
  assert.equal(career.districtId, "career-education-district");
});

test("legacy aliases resolve through canonical relationships", () => {
  assert.deepEqual(getMasterCityLocation("park"), { facilityId: "park", position: { x: 62, y: 54 } });
  assert.equal(getDestinationScene("public-works").facilitySceneId, null);
  assert.equal(getDestinationSpatialRelationship("unknown-place"), null);
  assert.deepEqual(getDestinationRoadAccess("unknown-place"), []);
  assert.deepEqual(getDestinationWaterAccess("unknown-place"), []);
});

test("Quick Map infrastructure remains provisional and destination-unbound", () => {
  const infrastructure = MINIMAP_LOCATION_REGISTRY.filter((location) => location.category === "INFRASTRUCTURE");
  assert.equal(infrastructure.length, 6);
  assert.equal(infrastructure.every((location) => location.destinationId === null && location.markerClassification === "PROVISIONAL_INFRASTRUCTURE"), true);
  assert.equal(getQuickMapLocation("career-center"), null);
});

test("scene relationships preserve production, reference-only, and missing distinctions", () => {
  assert.deepEqual(getDestinationScene("main-data-center").backgroundAsset.status, "PRODUCTION");
  assert.deepEqual(getDestinationScene("arcade-hub").backgroundAsset.status, "REFERENCE_ONLY");
  assert.deepEqual(getDestinationScene("city-hall").backgroundAsset.status, "MISSING");
  assert.equal(getDestinationScene("main-data-center").facilitySceneId, "main-data-center");
  assert.equal(getDestinationScene("career-center").facilitySceneId, null);
});

test("road, water, Sky Bridge, and venue references remain empty until verified", () => {
  for (const relationship of METAVERSE_DESTINATION_RELATIONSHIPS) {
    assert.deepEqual(relationship.roadAccessRefs, []);
    assert.deepEqual(relationship.waterAccessRefs, []);
    assert.deepEqual(relationship.skyBridgeStopRefs, []);
    assert.deepEqual(relationship.venueRefs, []);
  }
});

test("relationship validation rejects duplicate and unknown references", () => {
  const source = METAVERSE_DESTINATION_RELATIONSHIPS[0];
  const invalid = [
    { ...source, destinationId: "not-a-destination" },
    { ...source, destinationId: "career-center", roadAccessRefs: ["not-a-road"], waterAccessRefs: ["not-water"], skyBridgeStopRefs: ["future-stop"], venueRefs: ["future-venue"] },
    { ...source, destinationId: "career-center" },
  ];
  const errors = validateMetaverseDestinationRelationships(invalid);
  assert.ok(errors.some((error) => error.includes("unknown destinationId")));
  assert.ok(errors.some((error) => error.includes("duplicate relationship ownership")));
  assert.ok(errors.some((error) => error.includes("unknown road access reference")));
  assert.ok(errors.some((error) => error.includes("unknown water access reference")));
  assert.ok(errors.some((error) => error.includes("Sky Bridge registry is not available")));
  assert.ok(errors.some((error) => error.includes("Venue registry is not available")));
});

test("existing mobility and regional identities remain unchanged", () => {
  assert.ok(METAVERSE_ROAD_TRACES.some((path) => path.id === "FREEWAY_01"));
  assert.ok(METAVERSE_RIVER_FLOW_PATHS.some((path) => path.id === "MAIN_FLOW_01"));
  assert.deepEqual(REGIONAL_ROUTE_SEQUENCE.map((scene) => scene.id), [
    "oil-rig", "open-sea", "shipping-corridor", "harbor-in-distance", "harbor-approach", "container-yard", "freight-highway", "farms", "woods", "river", "bridge", "mountain-region", "final-approach", "gateway", "silicon-heartland-city",
  ]);
  const trafficRoutes = JSON.parse(readFileSync(new URL("../src/system/metaverse/traffic/metaverseTrafficRoutes.json", import.meta.url), "utf8"));
  assert.deepEqual(trafficRoutes.routes.map((route) => route.id), ["route-1-1-mu6436lq", "bridge1w-2-mu64aurl", "route-3-1-mu64szug", "nriverbendrde-2-mu65kw15", "nriverbendrde-3-mu66tbp0"]);
});

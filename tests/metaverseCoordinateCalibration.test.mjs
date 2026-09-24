import assert from "node:assert/strict";
import test from "node:test";

import {
  DESTINATION_COORDINATE_STATUSES,
  MASTER_CITY_COORDINATE_SPACE,
  METAVERSE_DESTINATION_RELATIONSHIPS,
  getMasterCityProjection,
  validateMetaverseDestinationRelationships,
} from "../src/system/metaverse/metaverseDestinationRelationshipRegistry.js";
import {
  MINIMAP_COORDINATE_STATUSES,
  MINIMAP_LOCATION_REGISTRY,
  QUICK_MAP_COORDINATE_SPACE,
  formatMiniMapCalibrationMapping,
  isNormalizedQuickMapCoordinate,
  validateMiniMapCanonicalReferences,
} from "../src/system/metaverse/metaverseMiniMapRegistry.js";

test("coordinate spaces are explicit and independent", () => {
  assert.deepEqual(MASTER_CITY_COORDINATE_SPACE, {
    id: "master-city",
    units: "normalized-percent",
    minX: 0,
    maxX: 100,
    minY: 0,
    maxY: 100,
  });
  assert.deepEqual(QUICK_MAP_COORDINATE_SPACE, {
    id: "quick-map",
    units: "normalized-percent",
    minX: 0,
    maxX: 100,
    minY: 0,
    maxY: 100,
    sourceWidth: 1448,
    sourceHeight: 1086,
  });
  assert.notEqual(MASTER_CITY_COORDINATE_SPACE.id, QUICK_MAP_COORDINATE_SPACE.id);
});

test("master-city projections retain existing bounded coordinates and explicit status", () => {
  assert.deepEqual(validateMetaverseDestinationRelationships(), []);
  for (const relationship of METAVERSE_DESTINATION_RELATIONSHIPS) {
    const projection = getMasterCityProjection(relationship.destinationId);
    assert.equal(projection.coordinateSpaceId, "master-city");
    assert.equal(projection.status, "VERIFIED");
    assert.ok(isNormalizedQuickMapCoordinate(projection.position.x, projection.position.y));
  }
});

test("Quick Map district mappings remain explicitly unmapped when the generic art cannot verify identity", () => {
  const districts = MINIMAP_LOCATION_REGISTRY.filter((location) => location.category === "DISTRICT");
  assert.equal(districts.length, 9);
  assert.ok(districts.every((location) => location.status === "UNMAPPED" && location.x === null && location.y === null));
  assert.ok(districts.every((location) => location.coordinateSpaceId === "quick-map"));
});

test("provisional infrastructure keeps valid Quick Map coordinates without claiming canonical identity", () => {
  const infrastructure = MINIMAP_LOCATION_REGISTRY.filter((location) => location.category === "INFRASTRUCTURE");
  assert.equal(infrastructure.length, 6);
  assert.ok(infrastructure.every((location) => location.status === "PROVISIONAL"));
  assert.ok(infrastructure.every((location) => location.destinationId === null));
  assert.ok(infrastructure.every((location) => isNormalizedQuickMapCoordinate(location.x, location.y)));
  assert.deepEqual(validateMiniMapCanonicalReferences(), []);
});

test("coordinate validation and calibration export are bounded and explicit", () => {
  assert.deepEqual(DESTINATION_COORDINATE_STATUSES, MINIMAP_COORDINATE_STATUSES);
  assert.equal(isNormalizedQuickMapCoordinate(0, 100), true);
  assert.equal(isNormalizedQuickMapCoordinate(-0.1, 50), false);
  assert.equal(isNormalizedQuickMapCoordinate(50, Number.NaN), false);
  assert.equal(formatMiniMapCalibrationMapping({ targetId: "civic-district", x: 12.3, y: 45.6 }), 'civic-district: { coordinateSpaceId: "quick-map", x: 12.3, y: 45.6, status: "CALIBRATED" }');
  assert.equal(formatMiniMapCalibrationMapping({ targetId: "civic-district", x: 101, y: 45.6 }), null);
});

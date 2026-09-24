import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CONFIRMED_DISTRICT_QUICK_MAP_MAPPINGS,
  MINIMAP_LOCATION_REGISTRY,
  createDistrictCalibrationCandidate,
  getCanonicalDistrictCalibrationRecords,
  getDistrictQuickMapLocation,
  validateConfirmedDistrictQuickMapMappings,
} from "../src/system/metaverse/metaverseMiniMapRegistry.js";
import { METAVERSE_DESTINATION_RELATIONSHIPS } from "../src/system/metaverse/metaverseDestinationRelationshipRegistry.js";

const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("owner review inventory contains exactly the nine canonical districts", () => {
  const records = getCanonicalDistrictCalibrationRecords();
  assert.equal(records.length, 9);
  assert.deepEqual(records.map((record) => record.districtId).sort(), [
    "civic-district", "career-education-district", "public-realm", "data-center-district",
    "technology-innovation-district", "learning-arcade-district", "treasury-commerce-district",
    "community-district", "student-life-district",
  ].sort());
});

test("unmapped districts are valid and have no production Quick Map positions", () => {
  assert.ok(getCanonicalDistrictCalibrationRecords().every((record) => record.status === "UNMAPPED" && record.quickMap === null));
  assert.equal(CONFIRMED_DISTRICT_QUICK_MAP_MAPPINGS.length, 0);
});

test("candidate calibration is bounded review state and does not mutate production registry", () => {
  const before = JSON.stringify(CONFIRMED_DISTRICT_QUICK_MAP_MAPPINGS);
  const candidate = createDistrictCalibrationCandidate({ districtId: "civic-district", x: 12.3, y: 45.6 });
  assert.deepEqual(candidate, {
    districtId: "civic-district",
    quickMap: { coordinateSpaceId: "quick-map", position: { x: 12.3, y: 45.6 }, status: "CALIBRATED" },
    reviewStatus: "CANDIDATE",
  });
  assert.equal(JSON.stringify(CONFIRMED_DISTRICT_QUICK_MAP_MAPPINGS), before);
  assert.equal(getDistrictQuickMapLocation("civic-district"), null);
});

test("confirmed mappings require canonical district IDs, VERIFIED status, and bounded coordinates", () => {
  const valid = [{ districtId: "civic-district", quickMap: { coordinateSpaceId: "quick-map", position: { x: 12.3, y: 45.6 }, status: "VERIFIED" } }];
  assert.deepEqual(validateConfirmedDistrictQuickMapMappings(valid), []);
  assert.ok(validateConfirmedDistrictQuickMapMappings([{ districtId: "civic-district", quickMap: { coordinateSpaceId: "quick-map", position: { x: 101, y: 45.6 }, status: "VERIFIED" } }]).some((error) => error.includes("invalid confirmed coordinates")));
  assert.ok(validateConfirmedDistrictQuickMapMappings([{ districtId: "not-a-district", quickMap: { coordinateSpaceId: "quick-map", position: { x: 12.3, y: 45.6 }, status: "VERIFIED" } }]).some((error) => error.includes("unknown district ID")));
  assert.ok(validateConfirmedDistrictQuickMapMappings([{ districtId: "civic-district", quickMap: { coordinateSpaceId: "quick-map", position: { x: 12.3, y: 45.6 }, status: "CALIBRATED" } }]).some((error) => error.includes("must be VERIFIED")));
});

test("duplicate district mappings and destination substitution are rejected", () => {
  const duplicate = [
    { districtId: "civic-district", quickMap: { coordinateSpaceId: "quick-map", position: { x: 12, y: 45 }, status: "VERIFIED" } },
    { districtId: "civic-district", quickMap: { coordinateSpaceId: "quick-map", position: { x: 13, y: 46 }, status: "VERIFIED" } },
  ];
  assert.ok(validateConfirmedDistrictQuickMapMappings(duplicate).some((error) => error.includes("duplicate district mapping")));
  assert.ok(validateConfirmedDistrictQuickMapMappings([{ districtId: "civic-district", destinationId: "city-hall", quickMap: { coordinateSpaceId: "quick-map", position: { x: 12, y: 45 }, status: "VERIFIED" } }]).some((error) => error.includes("destination ID cannot replace district ID")));
});

test("provisional infrastructure remains independent and destination-level pins remain deferred", () => {
  assert.ok(MINIMAP_LOCATION_REGISTRY.filter((location) => location.category === "INFRASTRUCTURE").every((location) => location.destinationId === null && location.status === "PROVISIONAL"));
  assert.ok(METAVERSE_DESTINATION_RELATIONSHIPS.every((relationship) => relationship.quickMap === null && relationship.quickMapStatus === "UNMAPPED"));
});

test("Quick Map consumes confirmed district mappings only and calibration remains mobile-safe", () => {
  assert.equal(getDistrictQuickMapLocation("civic-district"), null);
  assert.match(miniMapSource, /data-calibration-mode="true"/);
  assert.match(miniMapSource, /Confirm candidate/);
  assert.match(miniMapSource, /Review controls are temporary and never mutate the source registry/);
  assert.match(cssSource, /\.met-citymap__calibration-actions/);
});

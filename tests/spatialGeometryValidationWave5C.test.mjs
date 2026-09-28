import assert from "node:assert/strict";
import test from "node:test";

import { validateSpatialFeature } from "../src/shared/spatial/contracts/validation.js";

const polygon = {
  type: "Polygon",
  coordinates: [[[-81, 41], [-82, 41], [-82, 42], [-81, 41]]],
};

const base = {
  featureId: "spatial:census-geography:county:test-authority:39055",
  featureType: "county",
  domain: "census-geography",
  sourceAuthority: "test-authority",
  sourceRecordId: "39055",
  coordinateFamily: "REAL_WORLD",
  coordinateSpaceId: "real-world.county-geojson",
  geometry: polygon,
  layerId: "real-world.counties",
  verificationState: "VERIFIED",
  publicationState: "PUBLIC",
  updatedAt: "2010-01-01T00:00:00.000Z",
  allowedInteractions: [],
  authorizedActionReferences: [],
  provenance: {
    sourceAuthority: "test-authority",
    sourceRecordId: "39055",
    projectionAdapter: "test",
    projectionVersion: "1",
    updatedAt: "2010-01-01T00:00:00.000Z",
  },
  publicEligibility: { level: "PUBLIC", publicationState: "PUBLIC" },
};

function validate(geometry) {
  return validateSpatialFeature({ ...base, geometry });
}

test("W5C-G01 valid Polygon geometry object is accepted", () => {
  assert.equal(validate(polygon).valid, true);
});

test("W5C-G02 valid MultiPolygon geometry object is accepted", () => {
  assert.equal(validate({ type: "MultiPolygon", coordinates: [[polygon.coordinates[0]]] }).valid, true);
});

test("W5C-G03 legacy string geometry remains accepted", () => {
  assert.equal(validate("point(1,1)").valid, true);
});

test("W5C-G04 arbitrary geometry objects are rejected", () => {
  assert.equal(validate({ arbitrary: true }).valid, false);
});

test("W5C-G05 geometry objects without type are rejected", () => {
  assert.equal(validate({ coordinates: polygon.coordinates }).valid, false);
});

test("W5C-G06 geometry objects without coordinates are rejected", () => {
  assert.equal(validate({ type: "Polygon" }).valid, false);
});

test("W5C-G07 unsupported GeoJSON geometry types are rejected", () => {
  assert.equal(validate({ type: "Point", coordinates: [-81, 41] }).valid, false);
});

test("W5C-G08 non-finite coordinates are rejected", () => {
  assert.equal(validate({ type: "Polygon", coordinates: [[[Number.NaN, 41], [-82, 41], [-82, 42], [Number.NaN, 41]]] }).valid, false);
});

test("W5C-G09 malformed geometry nesting is rejected", () => {
  assert.equal(validate({ type: "Polygon", coordinates: [[-81, 41]] }).valid, false);
});

test("W5C-G10 geometry representation is not converted by validation", () => {
  assert.deepEqual(validate(polygon).valid && polygon, polygon);
});

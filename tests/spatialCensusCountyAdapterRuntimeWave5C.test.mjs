import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { defaultCoordinateSpaceRegistry } from "../src/shared/spatial/registries/defaultCoordinateSpaces.js";
import { createDefaultSpatialLayerRegistry } from "../src/shared/spatial/registries/defaultLayers.js";
import { createCensusCountyGeometryAdapter } from "../src/system/spatial/adapters/censusCountyGeometryAdapter.js";
import { createProjectionAdapterRegistry, createSpatialProjectionPipeline } from "../src/system/spatial/projection/index.js";

const CENSUS_ASSET = new URL("../public/assets/maps/ohio-counties.geojson", import.meta.url);
const collection = JSON.parse(readFileSync(CENSUS_ASSET, "utf8"));

function sourceRecord(overrides = {}) {
  const feature = collection.features.find((entry) => entry.id === "39055");
  return {
    ...feature,
    domain: "census-geography",
    featureType: "county",
    sourceAuthority: "us-census-bureau-2010-cartographic-boundary",
    sourceRecordId: "39055",
    coordinateFamily: "REAL_WORLD",
    coordinateSpaceId: "real-world.county-geojson",
    provenance: {
      publisher: "U.S. Census Bureau, Geography Division",
      dataset: "2010 Cartographic Boundary File, State-County",
      vintage: "2010",
      scale: "1:20,000,000",
      localSourcePath: "public/assets/maps/ohio-counties.geojson",
      officialSourceUrl: "https://www2.census.gov/geo/tiger/GENZ2010/gz_2010_us_050_00_20m.zip",
      attribution: "U.S. Census Bureau",
      sourceAuthority: "us-census-bureau-2010-cartographic-boundary",
      projectionAdapter: "census-county-geometry",
      projectionVersion: "1",
      updatedAt: "2010-01-01T00:00:00.000Z",
    },
    ...overrides,
  };
}

function runtime() {
  const adapterRegistry = createProjectionAdapterRegistry();
  const registration = adapterRegistry.register(createCensusCountyGeometryAdapter());
  assert.equal(registration.ok, true);
  const layerRegistry = createDefaultSpatialLayerRegistry({ coordinateRegistry: defaultCoordinateSpaceRegistry });
  return createSpatialProjectionPipeline({
    adapterRegistry,
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry,
    clock: () => new Date("2026-09-28T12:00:00.000Z"),
  });
}

test("CCA-R01 registers under the canonical census-geography::county key and projects", () => {
  const pipeline = runtime();
  const result = pipeline.project(sourceRecord(), { viewer: { grantedLevels: ["PUBLIC"] } });
  assert.equal(result.status, "PROJECTED");
  assert.equal(result.feature.domain, "census-geography");
  assert.equal(result.feature.sourceRecordId, "39055");
  assert.equal(result.feature.featureId, "spatial:census-geography:county:us-census-bureau-2010-cartographic-boundary:39055");
});

test("CCA-R02 preserves provenance through the client allowlist without leaking qualification metadata", () => {
  const pipeline = runtime();
  const internal = pipeline.project(sourceRecord(), { viewer: { grantedLevels: ["PUBLIC"] } });
  const client = pipeline.toClient(internal);
  assert.equal(client.status, "PROJECTED");
  assert.equal(client.feature.provenance.sourceAuthority, "us-census-bureau-2010-cartographic-boundary");
  assert.equal(client.feature.provenance.publisher, undefined);
  assert.equal(client.feature.provenance.officialSourceUrl, undefined);
});

test("CCA-R03 public geometry does not publish an attached private IEP record", () => {
  const pipeline = runtime();
  const result = pipeline.project(sourceRecord({ attachedIepRecord: { publicApproved: false, privateValue: "do not publish" } }), { viewer: { grantedLevels: ["PUBLIC"] } });
  assert.equal(result.status, "PROJECTED");
  assert.equal(result.feature.attachedIepRecord, undefined);
  assert.equal(result.feature.publicationState, "PUBLIC");
});

test("CCA-R04 projection preserves the source geometry and coordinate contract", () => {
  const input = sourceRecord();
  const pipeline = runtime();
  const result = pipeline.project(input, { viewer: { grantedLevels: ["PUBLIC"] } });
  assert.deepEqual(result.feature.geometry, input.geometry);
  assert.equal(result.feature.coordinateFamily, "REAL_WORLD");
  assert.equal(result.feature.coordinateSpaceId, "real-world.county-geojson");
});

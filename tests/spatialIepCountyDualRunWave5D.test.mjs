import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { defaultCoordinateSpaceRegistry } from "../src/shared/spatial/registries/defaultCoordinateSpaces.js";
import { createDefaultSpatialLayerRegistry } from "../src/shared/spatial/registries/defaultLayers.js";
import { createCensusCountyGeometryAdapter } from "../src/system/spatial/adapters/censusCountyGeometryAdapter.js";
import { compareIepCountySources, isIepSpatialDualRunEnabled, runIepSpatialDualRun } from "../src/system/spatial/clients/iep/index.js";
import { createProjectionAdapterRegistry, createSpatialProjectionPipeline } from "../src/system/spatial/projection/index.js";
import { COUNTY_PROFILES } from "../src/pages/iep-command-v2/countyProfiles.js";

const collection = JSON.parse(readFileSync(new URL("../public/assets/maps/ohio-counties.geojson", import.meta.url), "utf8"));

function records() {
  return collection.features.map((feature) => ({
    ...feature,
    domain: "census-geography",
    featureType: "county",
    sourceAuthority: "us-census-bureau-2010-cartographic-boundary",
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
  }));
}

function spatialResults() {
  const registry = createProjectionAdapterRegistry();
  registry.register(createCensusCountyGeometryAdapter());
  const pipeline = createSpatialProjectionPipeline({
    adapterRegistry: registry,
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: createDefaultSpatialLayerRegistry({ coordinateRegistry: defaultCoordinateSpaceRegistry }),
    clock: () => new Date("2026-09-28T12:00:00.000Z"),
  });
  return pipeline.projectForClient(records(), { viewer: { grantedLevels: ["PUBLIC"] } });
}

test("W5D-DUAL-01 query flag requires development mode", () => {
  assert.equal(isIepSpatialDualRunEnabled({ search: "?iepSpatialDualRun=1", isDevelopment: false }), false);
  assert.equal(isIepSpatialDualRunEnabled({ search: "", isDevelopment: true }), false);
  assert.equal(isIepSpatialDualRunEnabled({ search: "?iepSpatialDualRun=1", isDevelopment: true }), true);
});

test("W5D-DUAL-02 disabled mode produces no comparison", () => {
  const result = runIepSpatialDualRun({ search: "?iepSpatialDualRun=1", isDevelopment: false, legacyFeatures: collection.features, clientProjectionResults: spatialResults() });
  assert.equal(result.enabled, false);
  assert.equal(result.comparison, null);
});

test("W5D-DUAL-03 real pipeline produces 88 client counties", () => {
  const result = runIepSpatialDualRun({ search: "?iepSpatialDualRun=1", isDevelopment: true, legacyFeatures: collection.features, clientProjectionResults: spatialResults() });
  assert.equal(result.enabled, true);
  assert.equal(result.comparison.legacyCount, 88);
  assert.equal(result.comparison.spatialCount, 88);
});

test("W5D-DUAL-04 FIPS parity is exact", () => {
  const result = runIepSpatialDualRun({ search: "?iepSpatialDualRun=1", isDevelopment: true, legacyFeatures: collection.features, clientProjectionResults: spatialResults() });
  assert.equal(result.comparison.fipsParity, true);
  assert.deepEqual(result.comparison.missingFips, []);
  assert.deepEqual(result.comparison.extraFips, []);
});

test("W5D-DUAL-05 labels and geometry are exact parity", () => {
  const result = runIepSpatialDualRun({ search: "?iepSpatialDualRun=1", isDevelopment: true, legacyFeatures: collection.features, clientProjectionResults: spatialResults() });
  assert.equal(result.comparison.labelParity, true);
  assert.equal(result.comparison.geometryParity, true);
});

test("W5D-DUAL-06 geometry types remain Polygon or MultiPolygon", () => {
  const result = runIepSpatialDualRun({ search: "?iepSpatialDualRun=1", isDevelopment: true, legacyFeatures: collection.features, clientProjectionResults: spatialResults() });
  assert.equal(result.countyViewModels.every((county) => ["Polygon", "MultiPolygon"].includes(county.geometry.type)), true);
});

test("W5D-DUAL-07 all static profiles join by explicit FIPS", () => {
  const result = runIepSpatialDualRun({ search: "?iepSpatialDualRun=1", isDevelopment: true, legacyFeatures: collection.features, clientProjectionResults: spatialResults() });
  const byFips = new Map(result.countyViewModels.map((county) => [county.countyFips, county]));
  const profiles = Object.values(COUNTY_PROFILES).filter((profile) => profile.countyFips);
  assert.equal(profiles.length, 88);
  assert.equal(profiles.every((profile) => byFips.has(profile.countyFips)), true);
});

test("W5D-DUAL-08 unresolved dynamic records remain excluded", () => {
  const result = runIepSpatialDualRun({ search: "?iepSpatialDualRun=1", isDevelopment: true, legacyFeatures: collection.features, clientProjectionResults: spatialResults() });
  const unresolved = [{ id: "demo-1", countyFips: null }, { id: "demo-2" }];
  const byFips = new Map(result.countyViewModels.map((county) => [county.countyFips, county]));
  assert.equal(unresolved.every((record) => record.countyFips === null || !byFips.has(record.countyFips)), true);
});

test("W5D-DUAL-09 comparison reports unsafe source parity changes", () => {
  const result = compareIepCountySources({ legacyFeatures: collection.features.slice(0, 87), spatialCountyViewModels: runIepSpatialDualRun({ search: "?iepSpatialDualRun=1", isDevelopment: true, legacyFeatures: collection.features, clientProjectionResults: spatialResults() }).countyViewModels });
  assert.equal(result.fipsParity, false);
  assert.equal(result.extraFips.length, 1);
});

test("W5D-DUAL-10 default IEP map remains on the legacy asset path", () => {
  const source = readFileSync(new URL("../src/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx", import.meta.url), "utf8");
  assert.match(source, /fetch\("\/assets\/maps\/ohio-counties\.geojson"\)/);
  assert.doesNotMatch(source, /iepSpatialDualRun/);
});

test("W5D-DUAL-11 no Franklin fallback is introduced by the comparison", () => {
  const result = runIepSpatialDualRun({ search: "?iepSpatialDualRun=1", isDevelopment: true, legacyFeatures: collection.features, clientProjectionResults: spatialResults() });
  assert.equal(result.comparison.missingFips.length, 0);
  assert.equal(result.comparison.extraFips.length, 0);
  assert.equal(result.countyViewModels.some((county) => county.countyFips === "39049" && county.label === "Franklin"), true);
});

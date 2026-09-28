import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { COORDINATE_FAMILIES } from "../src/shared/spatial/index.js";

const ADAPTER_ENTRY = new URL("../src/system/spatial/adapters/censusCountyGeometryAdapter.js", import.meta.url);
const CENSUS_ASSET = new URL("../public/assets/maps/ohio-counties.geojson", import.meta.url);
const EXPECTED_MISSING_ADAPTER = "EXPECTED_MISSING_ADAPTER";

const census = JSON.parse(readFileSync(CENSUS_ASSET, "utf8"));
const originalAssetHash = createHash("sha256").update(readFileSync(CENSUS_ASSET)).digest("hex");

async function loadCensusAdapter() {
  if (!existsSync(ADAPTER_ENTRY)) {
    throw new Error(`${EXPECTED_MISSING_ADAPTER}: ${ADAPTER_ENTRY.pathname}`);
  }
  return import(ADAPTER_ENTRY.href);
}

function featureFor(fips = "39055") {
  return census.features.find((feature) => feature.id === fips || feature.properties?.GEO_ID?.endsWith(fips));
}

function qualifiedRecord(overrides = {}) {
  const feature = featureFor(overrides.fips || "39055");
  return {
    type: "Feature",
    ...feature,
    ...overrides,
    properties: { ...feature.properties, ...overrides.properties },
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
      ...overrides.provenance,
    },
  };
}

function firstRing(feature = featureFor()) {
  return feature.geometry.type === "Polygon" ? feature.geometry.coordinates[0] : feature.geometry.coordinates[0][0];
}

test("CCA-01 exposes the canonical factory and seven Wave 3 methods", async () => {
  const module = await loadCensusAdapter();
  assert.equal(typeof module.createCensusCountyGeometryAdapter, "function");
  const adapter = module.createCensusCountyGeometryAdapter();
  for (const method of ["getDomain", "getSourceAuthority", "getSupportedFeatureTypes", "getSupportedCoordinateSpaces", "getProjectionVersion", "canProject", "project"]) {
    assert.equal(typeof adapter[method], "function", method);
  }
});

test("CCA-02 recognizes all 88 qualified Census records", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const adapter = createCensusCountyGeometryAdapter();
  const recognized = census.features.filter((feature) => adapter.canProject(qualifiedRecord({ ...feature, properties: feature.properties })));
  assert.equal(recognized.length, 88);
});

test("CCA-03 accepts unique complete five-digit Ohio FIPS identities", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const adapter = createCensusCountyGeometryAdapter();
  const ids = census.features.map((feature) => adapter.project(qualifiedRecord({ ...feature, properties: feature.properties })).sourceRecordId);
  assert.equal(new Set(ids).size, 88);
  assert.ok(ids.every((id) => /^39\d{3}$/.test(id)));
});

test("CCA-04 requires GEO_ID, STATE, and COUNTY consistency", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const adapter = createCensusCountyGeometryAdapter();
  assert.throws(() => adapter.project(qualifiedRecord({ properties: { COUNTY: "999" } })));
});

test("CCA-05 rejects a non-Ohio state prefix", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  assert.equal(createCensusCountyGeometryAdapter().canProject(qualifiedRecord({ properties: { STATE: "42" } })), false);
});

test("CCA-06 rejects an unknown FIPS", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  assert.equal(createCensusCountyGeometryAdapter().canProject(qualifiedRecord({ id: "39999", properties: { GEO_ID: "0500000US39999", STATE: "39", COUNTY: "999" } })), false);
});

test("CCA-07 does not treat county name alone as identity", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const record = qualifiedRecord({ id: undefined, properties: { GEO_ID: undefined, STATE: undefined, COUNTY: undefined } });
  assert.equal(createCensusCountyGeometryAdapter().canProject(record), false);
});

test("CCA-08 retains qualified Census provenance metadata", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const feature = createCensusCountyGeometryAdapter().project(qualifiedRecord());
  assert.equal(feature.provenance.publisher, "U.S. Census Bureau, Geography Division");
  assert.equal(feature.provenance.vintage, "2010");
  assert.equal(feature.provenance.scale, "1:20,000,000");
  assert.equal(feature.provenance.officialSourceUrl.includes("census.gov"), true);
});

test("CCA-09 rejects missing provenance", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  assert.throws(() => createCensusCountyGeometryAdapter().project({ ...qualifiedRecord(), provenance: undefined }));
});

test("CCA-10 preserves and validates projection version", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const feature = createCensusCountyGeometryAdapter().project(qualifiedRecord());
  assert.equal(feature.provenance.projectionVersion, "1");
});

test("CCA-11 accepts Polygon geometry without rewriting it", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const input = qualifiedRecord();
  const output = createCensusCountyGeometryAdapter().project(input);
  assert.deepEqual(output.geometry, input.geometry);
  assert.equal(output.geometry.type, "Polygon");
});

test("CCA-12 accepts MultiPolygon geometry without rewriting it", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const input = qualifiedRecord({ geometry: { type: "MultiPolygon", coordinates: [[firstRing()]] } });
  const output = createCensusCountyGeometryAdapter().project(input);
  assert.equal(output.geometry.type, "MultiPolygon");
});

test("CCA-13 rejects null or malformed geometry", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const adapter = createCensusCountyGeometryAdapter();
  assert.equal(adapter.canProject(qualifiedRecord({ geometry: null })), false);
  assert.equal(adapter.canProject(qualifiedRecord({ geometry: { type: "Polygon", coordinates: [] } })), false);
});

test("CCA-14 rejects unsupported geometry types", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  assert.equal(createCensusCountyGeometryAdapter().canProject(qualifiedRecord({ geometry: { type: "Point", coordinates: [-81, 41] } })), false);
});

test("CCA-15 rejects non-finite and out-of-bounds coordinates", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const adapter = createCensusCountyGeometryAdapter();
  assert.equal(adapter.canProject(qualifiedRecord({ geometry: { type: "Polygon", coordinates: [[[Number.NaN, 41], [-81, 41], [-81, 42], [Number.NaN, 41]]] } })), false);
  assert.equal(adapter.canProject(qualifiedRecord({ geometry: { type: "Polygon", coordinates: [[[181, 41], [-81, 41], [-81, 42], [181, 41]]] } })), false);
});

test("CCA-16 does not mutate source records or geometry", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const input = structuredClone(qualifiedRecord());
  const before = structuredClone(input);
  createCensusCountyGeometryAdapter().project(input);
  assert.deepEqual(input, before);
});

test("CCA-17 accepts REAL_WORLD county GeoJSON coordinates", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const output = createCensusCountyGeometryAdapter().project(qualifiedRecord());
  assert.equal(output.coordinateFamily, COORDINATE_FAMILIES.REAL_WORLD);
  assert.equal(output.coordinateSpaceId, "real-world.county-geojson");
});

test("CCA-18 rejects METAVERSE, wrong-space, and family-mismatch input", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const adapter = createCensusCountyGeometryAdapter();
  assert.equal(adapter.canProject(qualifiedRecord({ coordinateFamily: "METAVERSE" })), false);
  assert.equal(adapter.canProject(qualifiedRecord({ coordinateSpaceId: "metaverse.quick-map" })), false);
  assert.equal(adapter.canProject(qualifiedRecord({ coordinateFamily: "METAVERSE", coordinateSpaceId: "metaverse.quick-map" })), false);
});

test("CCA-19 exposes no transform or calibration behavior", async () => {
  const module = await loadCensusAdapter();
  assert.equal(module.transformCoordinates, undefined);
  assert.equal(module.calibrateCoordinateSpace, undefined);
});

test("CCA-20 keeps public base geometry separate from private attached IEP data", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const output = createCensusCountyGeometryAdapter().project(qualifiedRecord({ attachedIepRecord: { publicApproved: false, secret: "private" } }));
  assert.equal(output.attachedIepRecord, undefined);
  assert.equal(output.publicationState, "PUBLIC");
});

test("CCA-21 rejects unknown counties without a default", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const adapter = createCensusCountyGeometryAdapter();
  const unknown = qualifiedRecord({ id: "39999", properties: { GEO_ID: "0500000US39999", STATE: "39", COUNTY: "999" } });
  assert.equal(adapter.canProject(unknown), false);
  assert.throws(() => adapter.project(unknown));
});

test("CCA-22 has no entityToCounty or Franklin fallback dependency", async () => {
  const module = await loadCensusAdapter();
  assert.equal(module.entityToCounty, undefined);
  assert.equal(module.FRANKLIN_COUNTY_FALLBACK, undefined);
});

test("CCA-23 rejects text-only county labels", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const record = qualifiedRecord({ id: undefined, properties: { GEO_ID: undefined, STATE: undefined, COUNTY: undefined, NAME: "Franklin" } });
  assert.equal(createCensusCountyGeometryAdapter().canProject(record), false);
});

test("CCA-24 output excludes ODOT, IEP, and UI-only fields", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  const output = createCensusCountyGeometryAdapter().project(qualifiedRecord({ properties: { ODOT_DISTRICT: 1, POP_2020: 100, COUNTY_SEAT: "Example" }, privateIepData: "private" }));
  assert.equal(output.ODOT_DISTRICT, undefined);
  assert.equal(output.POP_2020, undefined);
  assert.equal(output.COUNTY_SEAT, undefined);
  assert.equal(output.privateIepData, undefined);
});

test("CCA-25 leaves the governed Census asset unchanged", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  createCensusCountyGeometryAdapter().project(qualifiedRecord());
  const afterHash = createHash("sha256").update(readFileSync(CENSUS_ASSET)).digest("hex");
  assert.equal(afterHash, originalAssetHash);
});

test("CCA-26 preserves current IEP map behavior as an external client boundary", async () => {
  const { createCensusCountyGeometryAdapter } = await loadCensusAdapter();
  assert.equal(typeof createCensusCountyGeometryAdapter, "function");
  assert.equal(existsSync(new URL("../src/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/geo/ohio-counties.geojson", import.meta.url)), true);
});

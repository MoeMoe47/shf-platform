import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { defaultCoordinateSpaceRegistry } from "../src/shared/spatial/registries/defaultCoordinateSpaces.js";
import { createDefaultSpatialLayerRegistry } from "../src/shared/spatial/registries/defaultLayers.js";
import { createCensusCountyGeometryAdapter } from "../src/system/spatial/adapters/censusCountyGeometryAdapter.js";
import { createIepCountyClientAdapter } from "../src/system/spatial/clients/iep/index.js";
import { createProjectionAdapterRegistry, createSpatialProjectionPipeline } from "../src/system/spatial/projection/index.js";

const asset = JSON.parse(readFileSync(new URL("../public/assets/maps/ohio-counties.geojson", import.meta.url), "utf8"));

function sourceRecords() {
  return asset.features.map((feature) => ({
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

function clientResults() {
  const registry = createProjectionAdapterRegistry();
  assert.equal(registry.register(createCensusCountyGeometryAdapter()).ok, true);
  const pipeline = createSpatialProjectionPipeline({
    adapterRegistry: registry,
    coordinateRegistry: defaultCoordinateSpaceRegistry,
    layerRegistry: createDefaultSpatialLayerRegistry({ coordinateRegistry: defaultCoordinateSpaceRegistry }),
    clock: () => new Date("2026-09-28T12:00:00.000Z"),
  });
  return pipeline.projectForClient(sourceRecords(), { viewer: { grantedLevels: ["PUBLIC"] } });
}

const results = clientResults();
const adapter = createIepCountyClientAdapter();

test("W5D-CLIENT-01 accepts valid projected county results", () => {
  const models = adapter.toCountyViewModels(results);
  assert.equal(models.length, 88);
  assert.equal(models.every((model) => /^39\d{3}$/.test(model.countyFips)), true);
});

test("W5D-CLIENT-02 rejects wrong domain", () => {
  const input = structuredClone(results);
  input[0].feature.domain = "metaverse";
  assert.throws(() => adapter.toCountyViewModels(input), /census-geography/);
});

test("W5D-CLIENT-03 rejects wrong feature type", () => {
  const input = structuredClone(results);
  input[0].feature.featureType = "location";
  assert.throws(() => adapter.toCountyViewModels(input), /county results/);
});

test("W5D-CLIENT-04 rejects wrong coordinate family", () => {
  const input = structuredClone(results);
  input[0].feature.coordinateFamily = "METAVERSE";
  assert.throws(() => adapter.toCountyViewModels(input), /real-world/);
});

test("W5D-CLIENT-05 rejects wrong coordinate space", () => {
  const input = structuredClone(results);
  input[0].feature.coordinateSpaceId = "metaverse.quick-map";
  assert.throws(() => adapter.toCountyViewModels(input), /real-world/);
});

test("W5D-CLIENT-06 preserves county FIPS", () => {
  assert.equal(adapter.toCountyViewModels(results).find((model) => model.label === "Clermont").countyFips, "39025");
});

test("W5D-CLIENT-07 preserves the safe county label", () => {
  assert.equal(adapter.toCountyViewModels(results).find((county) => county.countyFips === "39055").label, "Geauga");
});

test("W5D-CLIENT-08 preserves Polygon geometry", () => {
  const model = adapter.toCountyViewModels(results).find((county) => county.countyFips === "39055");
  assert.equal(["Polygon", "MultiPolygon"].includes(model.geometry.type), true);
});

test("W5D-CLIENT-09 preserves MultiPolygon geometry when supplied", () => {
  const input = structuredClone(results);
  const model = input.find((result) => result.feature.geometry.type === "MultiPolygon");
  assert.ok(model);
  assert.equal(adapter.toCountyViewModels([model])[0].geometry.type, "MultiPolygon");
});

test("W5D-CLIENT-10 does not mutate geometry", () => {
  const before = structuredClone(results[0].feature.geometry);
  adapter.toCountyViewModels([results[0]]);
  assert.deepEqual(results[0].feature.geometry, before);
});

test("W5D-CLIENT-11 omits suppressed results", () => {
  const input = structuredClone(results);
  input[0].status = "SUPPRESSED";
  assert.deepEqual(adapter.toCountyViewModels([input[0]]), []);
});

test("W5D-CLIENT-12 omits invalid results", () => {
  const input = structuredClone(results);
  input[0].status = "INVALID";
  assert.deepEqual(adapter.toCountyViewModels([input[0]]), []);
});

test("W5D-CLIENT-13 omits hidden restricted results", () => {
  assert.deepEqual(adapter.toCountyViewModels([{ kind: "CLIENT", status: "RESTRICTED" }]), []);
});

test("W5D-CLIENT-14 does not leak private attached IEP data", () => {
  const model = adapter.toCountyViewModels(results)[0];
  assert.equal("attachedIepRecord" in model, false);
  assert.equal("provenance" in model, false);
});

test("W5D-CLIENT-15 null IEP county identity does not join", () => {
  const model = adapter.toCountyViewModels(results)[0];
  assert.equal(adapter.joinDomainRecord({ countyFips: null }, model), null);
});

test("W5D-CLIENT-16 exact FIPS joins the correct county", () => {
  const model = adapter.toCountyViewModels(results).find((county) => county.countyFips === "39055");
  assert.equal(adapter.joinDomainRecord({ countyFips: "39055" }, model), model);
});

test("W5D-CLIENT-17 county name alone does not join", () => {
  const model = adapter.toCountyViewModels(results)[0];
  assert.equal(adapter.joinDomainRecord({ countyName: "Adams" }, model), null);
});

test("W5D-CLIENT-18 client module has no entityToCounty dependency", () => {
  const adapterSource = readFileSync(new URL("../src/system/spatial/clients/iep/IepCountyClientAdapter.js", import.meta.url), "utf8");
  const viewModelSource = readFileSync(new URL("../src/system/spatial/clients/iep/countyViewModel.js", import.meta.url), "utf8");
  const dualRunSource = readFileSync(new URL("../src/system/spatial/clients/iep/dualRun.js", import.meta.url), "utf8");
  assert.doesNotMatch(adapterSource, /entityToCounty|Franklin/);
  assert.doesNotMatch(viewModelSource, /entityToCounty|Franklin/);
  assert.doesNotMatch(dualRunSource, /entityToCounty|Franklin/);
});

test("W5D-CLIENT-19 client output has no Franklin fallback", () => {
  const model = adapter.toCountyViewModels(results).find((county) => county.label === "Adams");
  assert.equal(model.countyFips, "39001");
});

test("W5D-CLIENT-20 client does not navigate", () => {
  const model = adapter.toCountyViewModels(results)[0];
  assert.equal("navigate" in model, false);
  assert.equal("destinationId" in model, false);
  assert.equal("route" in model, false);
});

test("W5D-CLIENT-21 selection remains presentation-only", () => {
  const model = adapter.toCountyViewModels(results)[0];
  assert.equal(model.interaction.selectable, true);
  assert.equal("domainState" in model, false);
  assert.equal("action" in model, false);
});

test("W5D-CLIENT-22 output is allowlisted", () => {
  const model = adapter.toCountyViewModels(results)[0];
  assert.deepEqual(Object.keys(model).sort(), ["accessibility", "countyFips", "geometry", "id", "interaction", "label", "presentation"]);
});

test("W5D-CLIENT-23 does not expose ODOT attributes", () => {
  const model = adapter.toCountyViewModels(results)[0];
  assert.equal("ODOT_DISTRICT" in model, false);
  assert.equal("population" in model, false);
});

test("W5D-CLIENT-24 does not leak raw internal provenance", () => {
  const model = adapter.toCountyViewModels(results)[0];
  assert.equal("sourceAuthority" in model, false);
  assert.equal("officialSourceUrl" in model, false);
  assert.equal("resultRef" in model, false);
});

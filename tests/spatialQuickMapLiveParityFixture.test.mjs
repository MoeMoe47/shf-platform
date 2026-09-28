import assert from "node:assert/strict";
import test from "node:test";

import {
  QUICK_MAP_FIXTURE_AUTHORITY,
  QUICK_MAP_PARITY_FIXTURE_RECORDS,
  createQuickMapParityFixtureRuntime,
} from "../src/system/spatial/fixtures/quickMapParityFixture.js";

test("Wave 4E fixture uses the production pipeline and client adapter", () => {
  const runtime = createQuickMapParityFixtureRuntime();
  assert.equal(QUICK_MAP_FIXTURE_AUTHORITY, "test.spatial.quick-map-fixture");
  assert.equal(runtime.records.length, 4);
  assert.deepEqual(runtime.clientResults.map((result) => result.status), ["PROJECTED", "STALE", "UNAVAILABLE"]);
  assert.deepEqual(runtime.markerModels.map((marker) => marker.label), [
    "Spatial Fixture Normal",
    "Spatial Fixture Stale",
    "Spatial Fixture Unavailable",
  ]);
  assert.equal(runtime.markerModels.every((marker) => marker.interaction.selectionContext.coordinateSpaceId === "metaverse.quick-map"), true);
  assert.equal(runtime.markerModels.some((marker) => marker.label === "Spatial Fixture Hidden"), false);
});

test("Wave 4E fixture keeps hidden identity out of client output", () => {
  const runtime = createQuickMapParityFixtureRuntime();
  const output = JSON.stringify(runtime.markerModels);
  assert.equal(output.includes("fixture-hidden"), false);
  assert.equal(output.includes("quick-map-parity-fixture"), false);
  assert.equal(QUICK_MAP_PARITY_FIXTURE_RECORDS.length, 4);
});

test("Wave 4E fixture source is explicitly development-gated at the city route", async () => {
  const source = await import("node:fs/promises").then((fs) => fs.readFile("src/pages/metaverse/MetaverseCityPage.jsx", "utf8"));
  assert.match(source, /import\.meta\.env\.DEV/);
  assert.match(source, /spatialFixture/);
  assert.match(source, /createQuickMapParityFixtureRuntime/);
});

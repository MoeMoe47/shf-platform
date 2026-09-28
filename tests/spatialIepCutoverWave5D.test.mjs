import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createHash } from "node:crypto";
import { projectIepCountyViewModels, isIepSpatialRollbackEnabled } from "../src/system/spatial/clients/iep/dualRun.js";

const pageSource = readFileSync(new URL("../src/pages/iep-command-v2/IEPCommandCenterV2.jsx", import.meta.url), "utf8");
const mapSource = readFileSync(new URL("../src/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../src/system/spatial/clients/iep/countyViewModel.js", import.meta.url), "utf8");
const censusPath = new URL("../public/assets/maps/ohio-counties.geojson", import.meta.url);
const odotPath = new URL("../public/geo/ohio-counties.geojson", import.meta.url);
const census = JSON.parse(readFileSync(censusPath, "utf8"));

function hash(url) {
  return createHash("sha256").update(readFileSync(url)).digest("hex");
}

test("CUT-01 default IEP preparation invokes the Spatial view-model path", () => {
  assert.match(pageSource, /createIepCountyClientAdapter\(\)\.toCountyViewModels\(clientProjectionResults\)/);
  assert.match(pageSource, /countyViewModels=\{mapSource === "spatial"/);
});

test("CUT-02 Census adapter is reached through the existing projection helper", () => {
  const source = readFileSync(new URL("../src/system/spatial/clients/iep/dualRun.js", import.meta.url), "utf8");
  assert.match(source, /createCensusCountyGeometryAdapter/);
  assert.match(source, /createSpatialProjectionPipeline/);
});

test("CUT-03 IEP client adapter is reached after projection", () => {
  assert.match(readFileSync(new URL("../src/system/spatial/clients/iep/dualRun.js", import.meta.url), "utf8"), /createIepCountyClientAdapter\(\)\.toCountyViewModels/);
});

test("CUT-04 produces all 88 counties", () => {
  assert.equal(projectIepCountyViewModels(census.features).length, 88);
});

test("CUT-05 preserves all qualified FIPS identities", () => {
  const fips = projectIepCountyViewModels(census.features).map((county) => county.countyFips);
  assert.equal(new Set(fips).size, 88);
  assert.ok(fips.every((value) => /^39\d{3}$/.test(value)));
});

test("CUT-06 preserves geometry", () => {
  const models = projectIepCountyViewModels(census.features);
  const source = census.features.find((feature) => feature.properties.GEO_ID.endsWith("39049"));
  assert.deepEqual(models.find((county) => county.countyFips === "39049").geometry, source.geometry);
});

test("CUT-07 preserves labels", () => {
  const models = projectIepCountyViewModels(census.features);
  assert.equal(models.find((county) => county.countyFips === "39049").label, "Franklin");
});

test("CUT-08 renderer accepts Spatial county view models", () => {
  assert.match(mapSource, /countyViewModels = null/);
  assert.match(mapSource, /countyViewModels\.map/);
  assert.match(mapSource, /data-iep-map-source/);
});

test("CUT-09 legacy direct loading remains available only through a null model input", () => {
  assert.match(mapSource, /if \(Array\.isArray\(countyViewModels\)\)/);
  assert.match(mapSource, /fetch\("\/assets\/maps\/ohio-counties\.geojson"\)/);
});

test("CUT-10 rollback requires both development mode and explicit activation", () => {
  assert.equal(isIepSpatialRollbackEnabled({ search: "?iepLegacyMap=1", isDevelopment: true }), true);
  assert.equal(isIepSpatialRollbackEnabled({ search: "?iepLegacyMap=1", isDevelopment: false }), false);
  assert.equal(isIepSpatialRollbackEnabled({ search: "", isDevelopment: true }), false);
});

test("CUT-11 rollback selects the legacy source explicitly", () => {
  assert.match(pageSource, /setMapSource\("legacy"\)/);
  assert.match(pageSource, /isIepSpatialRollbackEnabled/);
});

test("CUT-12 Spatial preparation has no silent legacy fallback", () => {
  assert.match(pageSource, /setMapSource\("spatial-error"\)/);
  assert.match(pageSource, /Spatial county preparation unavailable/);
});

test("CUT-13 unresolved identities remain excluded by the client join contract", () => {
  assert.match(clientSource, /isQualifiedOhioCountyFips\(record\.countyFips\)/);
  assert.match(clientSource, /return null/);
});

test("CUT-14 canonical IEP path has no entityToCounty or Franklin fallback", () => {
  assert.doesNotMatch(pageSource, /entityToCounty|Franklin fallback/);
  assert.doesNotMatch(clientSource, /entityToCounty|Franklin fallback/);
});

test("CUT-15 publication remains outside county geometry preparation", () => {
  assert.doesNotMatch(pageSource, /publicApproved\s*=/);
  assert.doesNotMatch(clientSource, /publicApproved\s*=/);
});

test("CUT-16 selection remains owned by the existing IEP state", () => {
  assert.match(pageSource, /setActiveCountyState\(name\)/);
  assert.match(pageSource, /OhioCountyOfficialMapV2/);
});

test("CUT-17 navigation remains owned by IEP", () => {
  assert.match(pageSource, /onOpenDetail=\{\(\) => navigate/);
  assert.doesNotMatch(clientSource, /navigate|window\.location|history/);
});

test("CUT-18 ODOT data is not consumed by the cutover path", () => {
  assert.doesNotMatch(pageSource, /public\/geo\/ohio-counties/);
  assert.doesNotMatch(clientSource, /ODOT|POP_2020|COUNTY_SEAT/);
});

test("CUT-19 Census asset remains byte-stable", () => {
  assert.equal(hash(censusPath), "40c161c8b142b71e26f049e97c6644c9aaf0cbb1f2326ca2cfe365b3c288484f");
});

test("CUT-20 ODOT asset remains byte-stable", () => {
  assert.equal(hash(odotPath), "d562c4a4e424b6bceba03b35750a1846a6ed643c04437b28f631c9f0f485bf43");
});

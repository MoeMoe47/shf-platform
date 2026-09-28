import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx", import.meta.url), "utf8");
const geojson = JSON.parse(readFileSync(new URL("../public/assets/maps/ohio-counties.geojson", import.meta.url), "utf8"));

test("W5B IEP county map loads local geometry", () => {
  assert.match(source, /fetch\("\/assets\/maps\/ohio-counties\.geojson"\)/);
  assert.ok(Array.isArray(geojson.features));
  assert.ok(geojson.features.length > 0);
});

test("W5B IEP county geometry has explicit identifiers and names", () => {
  const feature = geojson.features[0];
  assert.ok(feature.id || feature.properties?.GEO_ID || feature.properties?.COUNTY);
  assert.ok(feature.properties?.NAME || feature.properties?.name || feature.properties?.county);
});

test("W5B IEP map derives rendering geometry from GeoJSON features", () => {
  assert.match(source, /geoCentroid\(feature\)/);
  assert.match(source, /geoPath\(projection\)/);
  assert.match(source, /geojson\.features/);
});

test("W5B IEP map handles missing geometry visibly", () => {
  assert.match(source, /Failed to load Ohio GeoJSON/);
  assert.match(source, /if \(!geojson\?\.features\?\.length\)/);
});

test("W5B IEP county lookup does not use entity-to-county fallback", () => {
  assert.doesNotMatch(source, /entityToCounty/);
  assert.match(source, /properties\?\.(NAME|name|county|COUNTY)/);
});

test("W5B IEP geometry remains outside the Spatial production registry", () => {
  assert.doesNotMatch(source, /createProjectionAdapterRegistry|SpatialFeature|sourceAuthority/);
});

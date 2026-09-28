import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/pages/exchange/unified-truth/components/SHSOperationalMapboxMap.jsx", import.meta.url), "utf8");

test("W5B Exchange map reads the public Mapbox token configuration", () => {
  assert.match(source, /import\.meta\.env\.VITE_MAPBOX_TOKEN/);
});

test("W5B Exchange map has an explicit missing-token fallback", () => {
  assert.match(source, /Mapbox token needed/);
  assert.match(source, /Add VITE_MAPBOX_TOKEN/);
});

test("W5B Exchange map does not invent a token in source", () => {
  assert.doesNotMatch(source, /pk\.[A-Za-z0-9_-]{20,}/);
});

test("W5B Exchange map records the remote county GeoJSON dependency", () => {
  assert.match(source, /raw\.githubusercontent\.com\/plotly\/datasets/);
  assert.match(source, /geojson-counties-fips\.json/);
});

test("W5B Exchange map creates Mapbox only after configuration is present", () => {
  assert.match(source, /if \(!MAPBOX_TOKEN[\s\S]{0,180}return;/);
  assert.match(source, /new mapboxgl\.Map/);
});

test("W5B Exchange map remains a client implementation, not a Spatial authority", () => {
  assert.doesNotMatch(source, /createProjectionAdapterRegistry|sourceAuthority\s*=/);
});

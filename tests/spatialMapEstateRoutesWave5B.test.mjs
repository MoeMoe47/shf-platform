import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const registry = readFileSync(new URL("../src/system/metaverse/metaverseMiniMapRegistry.js", import.meta.url), "utf8");
const regional = readFileSync(new URL("../src/system/metaverse/regionalSceneRegistry.js", import.meta.url), "utf8");
const city = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const foundationRoutes = readFileSync(new URL("../src/router/FoundationRoutes.jsx", import.meta.url), "utf8");
const exchangeRoutes = readFileSync(new URL("../src/routes/exchangeRoutes.jsx", import.meta.url), "utf8");

test("W5B route inventory preserves the Quick Map city mount", () => {
  assert.match(city, /MetaverseMiniMap/);
  assert.match(registry, /MINIMAP_LOCATION_REGISTRY/);
  assert.ok(existsSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url)));
});

test("W5B route inventory preserves the 15-stop regional context", () => {
  assert.match(regional, /REGIONAL_ROUTE_SEQUENCE/);
  assert.match(regional, /silicon-heartland-city/);
  assert.match(regional, /REGIONAL_SCENE_DESTINATION_REFS/);
});

test("W5B Foundation impact route is declared without changing publication policy", () => {
  assert.match(foundationRoutes, /path="impact"/);
  assert.match(foundationRoutes, /SHFImpactCommandCenter/);
});

test("W5B Exchange route inventory contains unified-truth map wiring", () => {
  assert.match(exchangeRoutes, /UnifiedTruthMapRoute|unified-truth/);
});

test("W5B map components exist for the estate registry", () => {
  for (const path of [
    "../src/pages/exchange/unified-truth/components/SHSOperationalMapboxMap.jsx",
    "../src/pages/iep-command-v2/OhioCountyOfficialMapV2.jsx",
    "../src/pages/shf-command/components/SHFImpactOhioMap.jsx",
  ]) assert.ok(existsSync(new URL(path, import.meta.url)), path);
});

test("W5B route declarations are not treated as source authority", () => {
  assert.doesNotMatch(city, /sourceAuthority\s*:/);
  assert.doesNotMatch(registry, /sourceAuthority\s*:/);
});

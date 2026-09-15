import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  METAVERSE_ACTIVITY_PLACEHOLDERS,
  METAVERSE_DISTRICTS,
  METAVERSE_FACILITIES,
  METAVERSE_NAVIGATION_MODEL_META,
  findProductionEnvironmentAsset,
  getActivitiesForFacility,
  getBreadcrumbs,
  isReferenceOnlyAssetPath,
} from "../src/system/metaverse/metaverseNavigationModel.js";
import {
  METAVERSE_UNLOCK_PROJECTION_META,
  canEnterMetaverseResource,
  resolveMetaverseUiUnlock,
} from "../src/system/metaverse/metaverseUnlockProjection.js";
import { METAVERSE_PRODUCTION_BACKGROUND_SET } from "../src/system/metaverse/metaverseVisualAssets.js";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const indexEntry = readFileSync(new URL("../src/entries/index.main.jsx", import.meta.url), "utf8");
const universeEntry = readFileSync(new URL("../src/entries/universe.main.jsx", import.meta.url), "utf8");

test("city renders canonical 9 districts", () => {
  assert.equal(METAVERSE_DISTRICTS.length, 9);
  assert.deepEqual(METAVERSE_DISTRICTS.map((district) => district.label), [
    "Civic",
    "Career & Education",
    "Data Center",
    "Learning Arcade",
    "Treasury & Commerce",
    "Technology & Innovation",
    "Community",
    "Student Life",
    "Public Realm",
  ]);
});

test("markers derive from canonical registry projection config", () => {
  assert.equal(METAVERSE_NAVIGATION_MODEL_META.duplicatesCanonicalRegistry, false);
  assert.equal(METAVERSE_NAVIGATION_MODEL_META.authorizationAuthority, false);
  assert.equal(METAVERSE_FACILITIES.length, 36);
  assert.equal(new Set(METAVERSE_FACILITIES.map((facility) => facility.id)).size, 36);
});

test("city background derives from MET-2A asset registry", () => {
  const asset = findProductionEnvironmentAsset({ cameraLevel: "CITY_OVERVIEW", districtId: null, facilityId: null });
  assert.equal(asset.assetId, "met-city-master-overview");
  assert.equal(asset.productionBackground, true);
});

test("district selection transitions to district level", () => {
  assert.match(pageSource, /setLevel\("DISTRICT_VIEW"\)/);
  assert.match(pageSource, /selectDistrict/);
});

test("facility selection transitions to facility level", () => {
  assert.match(pageSource, /setLevel\("FACILITY_VIEW"\)/);
  assert.match(pageSource, /selectFacility/);
});

test("camera state cannot grant unlock", () => {
  const decision = resolveMetaverseUiUnlock({ id: "data-center-district", type: "DISTRICT" }, { cameraGranted: true, fixtureEnabled: true });
  assert.equal(decision.decision, "RESTRICTED");
  assert.equal(METAVERSE_NAVIGATION_MODEL_META.cameraGrantsAccess, false);
});

test("unavailable resource cannot be entered by direct UI activation", () => {
  const decision = resolveMetaverseUiUnlock({ id: "data-center-safety-simulation", type: "ACTIVITY" }, { fixtureEnabled: true });
  assert.equal(decision.decision, "LOCKED");
  assert.equal(canEnterMetaverseResource(decision), false);
});

test("accessible navigator uses same resource/access model", () => {
  assert.match(pageSource, /<MetaverseLocationNavigator/);
  assert.match(pageSource, /getUnlock=\{getUnlock\}/);
});

test("locked state exposes explanation", () => {
  const decision = resolveMetaverseUiUnlock({ id: "data-center-safety-simulation", type: "ACTIVITY" }, { fixtureEnabled: true });
  assert.match(decision.reason_text, /Lesson 4|prerequisite/);
});

test("supported next action renders only when provided", () => {
  const locked = resolveMetaverseUiUnlock({ id: "data-center-safety-simulation", type: "ACTIVITY" }, { fixtureEnabled: true });
  const available = resolveMetaverseUiUnlock({ id: "park", type: "FACILITY" }, { fixtureEnabled: true });
  assert.ok(locked.next_action);
  assert.equal(available.next_action, null);
  assert.match(readFileSync(new URL("../src/components/metaverse/MetaverseContextPanel.jsx", import.meta.url), "utf8"), /unlock\?\.next_action/);
});

test("breadcrumbs preserve hierarchy", () => {
  assert.deepEqual(
    getBreadcrumbs({ level: "FACILITY_VIEW", districtId: "data-center-district", facilityId: "data-center-training-lab" }).map((crumb) => crumb.label),
    ["Silicon Heartland", "Data Center", "Data Center Training Lab"],
  );
});

test("breadcrumbs cannot bypass authorization", () => {
  assert.match(pageSource, /selectDistrict\(district\)/);
  assert.match(pageSource, /selectFacility\(facility\)/);
});

test("reference-only image cannot become production environment", () => {
  for (const asset of METAVERSE_PRODUCTION_BACKGROUND_SET) assert.equal(isReferenceOnlyAssetPath(asset.targetPath), false);
  assert.equal(isReferenceOnlyAssetPath("public/assets/arcade/eco-city-hero.jpg"), true);
});

test("reduced-motion mode avoids long animated transition", () => {
  const css = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
  assert.match(css, /data-reduced-motion="true"/);
  assert.match(css, /transition-duration:\s*80ms/);
});

test("keyboard activation works", () => {
  const hotspotSource = readFileSync(new URL("../src/components/metaverse/MetaverseHotspot.jsx", import.meta.url), "utf8");
  assert.match(hotspotSource, /<button/);
  assert.match(pageSource, /addEventListener\("keydown"/);
});

test("no fake online users are rendered", () => {
  assert.doesNotMatch(pageSource, /student-\d|online users|fake online/i);
});

test("no fake presence counts are rendered", () => {
  assert.doesNotMatch(pageSource, /\d+\s+online/i);
  assert.match(pageSource, /No live presence rendered/);
});

test("mobile navigator path exists", () => {
  const css = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
  assert.match(css, /@media \(max-width:\s*620px\)/);
  assert.match(css, /bottom-sheet|border-radius:\s*8px 8px 0 0/);
});

test("all production district image references resolve", () => {
  const districtAssets = METAVERSE_PRODUCTION_BACKGROUND_SET.filter((asset) => asset.cameraLevel === "DISTRICT_VIEW");
  assert.equal(districtAssets.length, 9);
  for (const asset of districtAssets) assert.ok(existsSync(asset.targetPath), asset.targetPath);
});

test("production route does not rely on query-param authorization", () => {
  assert.equal(METAVERSE_UNLOCK_PROJECTION_META.queryParamsMayGrantUnlock, false);
  assert.match(pageSource, /queryGranted/);
});

test("activity placeholder requires authorized entry", () => {
  assert.equal(getActivitiesForFacility("main-data-center").some((activity) => activity.id === "data-center-safety-simulation"), true);
  assert.match(pageSource, /ACTIVITY_SIMULATION_VIEW/);
  assert.match(pageSource, /canEnterMetaverseResource\(unlock\)/);
});

test("Universe remains separate from metaverse", () => {
  assert.match(universeEntry, /UniverseApp/);
  assert.match(indexEntry, /routePath === "\/metaverse"/);
  assert.doesNotMatch(universeEntry, /MetaverseCityPage/);
});

test("no duplicate city registry", () => {
  assert.equal(METAVERSE_NAVIGATION_MODEL_META.duplicatesCanonicalRegistry, false);
});

test("no duplicate unlock authority", () => {
  assert.equal(METAVERSE_UNLOCK_PROJECTION_META.duplicatesUnlockAuthority, false);
  assert.equal(METAVERSE_UNLOCK_PROJECTION_META.clientMayGrantUnlock, false);
});

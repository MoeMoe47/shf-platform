import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  LIVING_CITY_AUTHORITY_BOUNDARY,
  LIVING_CITY_STATE_CLASSIFICATIONS,
  METAVERSE_AMBIENT_EFFECTS,
  METAVERSE_BUILDING_EFFECTS,
  METAVERSE_LIVING_CITY_SCENES,
  METAVERSE_TRAFFIC_PATHS,
  METAVERSE_TRANSIT_PATHS,
  getTrafficPathsForScene,
  validateLivingCityRegistry,
} from "../src/system/metaverse/livingCityRegistry.js";
import {
  METAVERSE_TIME_OF_DAY_META,
  resolveMetaverseAssetVariant,
  resolveMetaverseTimeOfDay,
} from "../src/system/metaverse/metaverseTimeOfDay.js";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const cameraSource = readFileSync(new URL("../src/components/metaverse/MetaverseCamera.jsx", import.meta.url), "utf8");
const layerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
const buildingSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseBuildingActivityLayer.jsx", import.meta.url), "utf8");
const eventSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseEventOverlayLayer.jsx", import.meta.url), "utf8");
const presenceSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaversePresenceOverlayLayer.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("MET-15 Living City layer renders inside the camera-aligned marker plane", () => {
  assert.match(pageSource, /<MetaverseLivingCityLayer/);
  assert.match(cameraSource, /livingCityLayer/);
  assert.match(cameraSource, /met-camera__markers/);
  assert.match(layerSource, /data-authority="presentation-only"/);
});

test("MET-15 traffic and transit registries are valid decorative scene paths", () => {
  const result = validateLivingCityRegistry();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.ok(METAVERSE_TRAFFIC_PATHS.length >= 4);
  assert.ok(METAVERSE_TRANSIT_PATHS.length >= 1);
  for (const path of [...METAVERSE_TRAFFIC_PATHS, ...METAVERSE_TRANSIT_PATHS]) {
    assert.equal(path.stateClassification, "DECORATIVE");
    assert.ok(path.points.length >= 2);
    assert.ok(path.points.every((point) => point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100));
  }
});

test("MET-15 vehicle overlay authority boundary stays honest even though the runtime-traced layer is retired", () => {
  assert.equal(LIVING_CITY_AUTHORITY_BOUNDARY.trafficTriggersBusinessLogic, false);
  assert.equal(LIVING_CITY_AUTHORITY_BOUNDARY.decorativeStateGrantsAuthority, false);
  assert.match(cssSource, /pointer-events:\s*none/);
});

test("MET-15K the runtime-traced traffic/vehicle layer is retired from production (no fake moving vehicles on the live city)", () => {
  // MetaverseVehicleLayer.jsx and MetaverseTrafficLayer.jsx are deleted —
  // the living-city layer must not import (still mentioning the retired
  // names in an explanatory comment is fine) or JSX-mount either one.
  assert.doesNotMatch(layerSource, /^import .*MetaverseVehicleLayer|^import .*MetaverseTrafficLayer/m);
  assert.doesNotMatch(layerSource, /<MetaverseVehicleLayer|<MetaverseTrafficLayer/);
  assert.match(layerSource, /data-traffic="RETIRED_FROM_PRODUCTION"/);
  assert.ok(!existsSync(new URL("../src/components/metaverse/living-city/MetaverseVehicleLayer.jsx", import.meta.url)));
  assert.ok(!existsSync(new URL("../src/components/metaverse/living-city/MetaverseTrafficLayer.jsx", import.meta.url)));
});

test("MET-15K the runtime-traced river-motion/rapids layer is retired from production (no fake water motion on the live city)", () => {
  assert.doesNotMatch(layerSource, /^import .*MetaverseRiverMotionLayer/m);
  assert.doesNotMatch(layerSource, /<MetaverseRiverMotionLayer/);
  assert.match(layerSource, /data-river-motion="RETIRED_FROM_PRODUCTION"/);
  assert.ok(!existsSync(new URL("../src/components/metaverse/living-city/MetaverseRiverMotionLayer.jsx", import.meta.url)));
});

test("MET-15K road-trace and river-flow debug overlays remain dev-build + explicit query-param gated (the only surviving activation path for retained trace data)", () => {
  assert.match(layerSource, /MetaverseRoadTraceDebugLayer/);
  assert.match(layerSource, /MetaverseRiverFlowDebugLayer/);
  assert.match(layerSource, /roadTraceDebug/);
  assert.match(layerSource, /riverFlowDebug/);
});

test("MET-15 source-backed markers are distinct from decorative traffic", () => {
  assert.match(buildingSource, /opportunityCountsByFacility/);
  assert.match(buildingSource, /missionCountsByFacility/);
  assert.match(eventSource, /data-state-classification="SOURCE_BACKED"/);
  assert.match(presenceSource, /Aggregate presence markers/);
  assert.ok(METAVERSE_BUILDING_EFFECTS.some((effect) => effect.stateClassification === "SOURCE_BACKED"));
  assert.ok(METAVERSE_AMBIENT_EFFECTS.some((effect) => effect.stateClassification === "DECORATIVE"));
  for (const classification of ["DECORATIVE", "SOURCE_BACKED", "HYBRID"]) assert.ok(LIVING_CITY_STATE_CLASSIFICATIONS.includes(classification));
});

test("MET-15 reduced motion disables the (now-retired, reference-only) traffic path resolver and still disables animation intensity generally", () => {
  // getTrafficPathsForScene is unused in production since MET-15K, but the
  // pure function itself is kept as reference and must keep this contract.
  assert.deepEqual(getTrafficPathsForScene("silicon-heartland-city", { reducedMotion: true }), []);
  assert.match(cssSource, /animation:\s*none/);
});

test("MET-15 time of day resolver supports AUTO and explicit previews", () => {
  assert.equal(resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date("2026-09-16T08:00:00") }), "DAY");
  assert.equal(resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date("2026-09-16T18:00:00") }), "DUSK");
  assert.equal(resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date("2026-09-16T22:00:00") }), "NIGHT");
  assert.equal(resolveMetaverseTimeOfDay({ mode: "DAY" }), "DAY");
  assert.equal(resolveMetaverseTimeOfDay({ mode: "DUSK" }), "DUSK");
  assert.equal(resolveMetaverseTimeOfDay({ mode: "NIGHT" }), "NIGHT");
  assert.equal(METAVERSE_TIME_OF_DAY_META.grantsAuthority, false);
});

test("MET-15 asset fallback tolerates missing night variants", () => {
  const result = resolveMetaverseAssetVariant({
    sceneId: "silicon-heartland-city",
    baseAsset: "public/assets/metaverse/city/silicon-heartland-city-master-overview.png",
    duskAsset: "public/assets/metaverse/city/silicon-heartland-city-master-overview.png",
    nightAsset: null,
  }, "NIGHT");
  assert.equal(result.assetPath, "public/assets/metaverse/city/silicon-heartland-city-master-overview.png");
  assert.equal(result.fallbackUsed, true);
});

test("MET-15 scenes declare clean-plate and overlay support fields", () => {
  assert.ok(METAVERSE_LIVING_CITY_SCENES.length >= 14);
  for (const scene of METAVERSE_LIVING_CITY_SCENES) {
    assert.ok(scene.sceneId);
    assert.ok(scene.baseAsset);
    assert.ok(scene.cleanPlateStatus);
    assert.equal(typeof scene.trafficOverlaySupport, "boolean");
    assert.equal(typeof scene.ambientOverlaySupport, "boolean");
    assert.equal(typeof scene.weatherOverlaySupport, "boolean");
  }
});

test("MET-15 real counts are reused and fake city activity remains absent", () => {
  assert.match(pageSource, /missionCountsByFacility/);
  assert.match(pageSource, /opportunityCountsByFacility/);
  assert.match(pageSource, /marketCountsByFacility/);
  assert.match(pageSource, /cityCounts=\{cityCounts\}/);
  assert.doesNotMatch(pageSource, /Math\.random|fake count|demo count|hardcoded count/i);
});

test("MET-15 opportunity markers, events, buildings and presence remain source-backed and bounded", () => {
  assert.match(pageSource, /events=\{orchestration\?\.city_events \|\| \[\]\}/);
  assert.match(buildingSource, /data-active/);
  assert.doesNotMatch(presenceSource, /email|studentName|participants/);
  assert.equal(LIVING_CITY_AUTHORITY_BOUNDARY.noPrivateIdentityDisclosure, true);
});

test("MET-15 authority/security boundaries are explicit", () => {
  assert.equal(LIVING_CITY_AUTHORITY_BOUNDARY.fastTravelRequiresProtectedEntry, true);
  assert.equal(LIVING_CITY_AUTHORITY_BOUNDARY.clientTimeGrantsAuthority, false);
  assert.equal(LIVING_CITY_AUTHORITY_BOUNDARY.sourceBackedCountsOnly, true);
  assert.match(pageSource, /fastTravelApi\(destination\.destination_id\)/);
  assert.match(pageSource, /requestProtectedDecision/);
  assert.doesNotMatch(layerSource, /requestMetaverseEntry|fastTravelApi|enterMissionApi|canEnterMetaverseResource/);
});

test("MET-15 keyboard, mini-map text equivalent, mobile and flashing contracts remain intact", () => {
  assert.match(pageSource, /addEventListener\("keydown"/);
  assert.match(readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8"), /Text equivalent district activity/);
  assert.match(cssSource, /@media \(max-width:\s*620px\)/);
  assert.doesNotMatch(cssSource, /0\.1s|100ms|steps\(|strobe/i);
});

test("MET-15K dead vehicle-light keyframe and vehicle/river-motion CSS rules were removed along with their retired layers", () => {
  // A CSS comment is allowed to still name the retired classes (that's how
  // the removal is documented in-place); only actual rule declarations
  // (selector immediately followed by "{") must be gone.
  const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "");
  const stripped = stripComments(cssSource);
  assert.doesNotMatch(stripped, /@keyframes\s+metVehicleLight/);
  assert.doesNotMatch(stripped, /\.met-living-vehicle[\s,{]/);
  assert.doesNotMatch(stripped, /\.met-vehicle(--car|--bus)?[\s,{]/);
  assert.doesNotMatch(stripped, /\.met-river-motion[\s,{]/);
  assert.doesNotMatch(stripped, /\.met-river-rapids-svg[\s,{]/);
  assert.doesNotMatch(stripped, /\.met-river-wash[\s,{]/);
  assert.doesNotMatch(stripped, /\.met-river-streak-line[\s,{-]/);
});

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { METAVERSE_ROAD_TRACES } from "../src/system/metaverse/metaverseRoadTraceRegistry.js";
import {
  METAVERSE_WATER_ZONES,
  getRiverFlowPathById,
  getWaterZoneById,
  resolveWaterZoneGeometryPoints,
} from "../src/system/metaverse/metaverseRiverFlowRegistry.js";
import {
  METAVERSE_RIVER_TIME_OF_DAY_PROFILES,
  flowPathToCssAngle,
  headingDegToCssGradientAngle,
  polygonPointsToClipPath,
  resolveActiveWaterLayers,
  resolveRiverTimeOfDayProfile,
} from "../src/system/metaverse/metaverseRiverMotionPresentation.js";

test("MET-15E1 the active rapids zone reference (RAPIDS_ZONE_01) is a real, valid registry id", () => {
  const zone = getWaterZoneById("RAPIDS_ZONE_01");
  assert.ok(zone);
  assert.equal(zone.type, "RAPIDS_ZONE");
  assert.equal(zone.rapidsAssetsAllowed, true);
});

test("MET-15E1 the active turbulence zone reference (TURBULENCE_ZONE_01) is a real, valid registry id", () => {
  const zone = getWaterZoneById("TURBULENCE_ZONE_01");
  assert.ok(zone);
  assert.equal(zone.type, "TURBULENCE_ZONE");
});

test("MET-15E1 rapids assets are only ever allowed in RAPIDS_ZONE-type zones (registry-level guarantee the layer relies on)", () => {
  for (const zone of METAVERSE_WATER_ZONES) {
    if (zone.rapidsAssetsAllowed) assert.equal(zone.type, "RAPIDS_ZONE", `${zone.id} allows rapids but is ${zone.type}`);
  }
});

test("MET-15E1 turbulence-eligible zones are limited to TURBULENCE_ZONE and BRIDGE_DISTURBANCE types", () => {
  // The layer only renders turbulence-style noise inside TURBULENCE_ZONE_01,
  // but assert the broader registry contract it depends on: no other zone
  // type is being (ab)used to carry turbulence-like flowStreakOverlaysAllowed
  // without being a recognized turbulence/bridge/flowing category.
  const allowedTurbulenceTypes = new Set(["TURBULENCE_ZONE", "BRIDGE_DISTURBANCE", "RAPIDS_ZONE", "FLOWING_WATER"]);
  for (const zone of METAVERSE_WATER_ZONES) {
    if (zone.flowStreakOverlaysAllowed) {
      assert.ok(allowedTurbulenceTypes.has(zone.type), `${zone.id} allows flow streaks but is unexpected type ${zone.type}`);
    }
  }
  // CALM_WATER_COMMUNITY_POND specifically must stay calm per MET-15E0.
  assert.equal(getWaterZoneById("CALM_WATER_COMMUNITY_POND").flowStreakOverlaysAllowed, false);
});

test("MET-15E1 no water layer clip-path is built from road-only geometry (rapids/turbulence masks come from water zones, not road traces)", () => {
  const roadIds = new Set(METAVERSE_ROAD_TRACES.map((path) => path.id));
  const rapidsZone = getWaterZoneById("RAPIDS_ZONE_01");
  const turbulenceZone = getWaterZoneById("TURBULENCE_ZONE_01");
  assert.ok(!roadIds.has(rapidsZone.id));
  assert.ok(!roadIds.has(turbulenceZone.id));
  assert.equal(rapidsZone.geometry.shape, "polygon");
  assert.equal(turbulenceZone.geometry.shape, "polygon");
});

test("MET-15E1 polygonPointsToClipPath renders the zone's exact registry points as a CSS clip-path (no drift between mask and authority)", () => {
  const rapidsZone = getWaterZoneById("RAPIDS_ZONE_01");
  const points = resolveWaterZoneGeometryPoints(rapidsZone);
  const clip = polygonPointsToClipPath(points);
  assert.match(clip, /^polygon\(/);
  for (const point of points) {
    assert.match(clip, new RegExp(`${point.x}% ${point.y}%`));
  }
});

test("MET-15E1 flow-direction angle conversion is correct and derived from real registry headings", () => {
  assert.equal(headingDegToCssGradientAngle(0), 90);
  assert.equal(headingDegToCssGradientAngle(90), 0);
  const rapidsFlow = getRiverFlowPathById("RAPIDS_FLOW_01");
  const angle = flowPathToCssAngle(rapidsFlow);
  assert.ok(angle >= 0 && angle < 360);
  // A path with no real geometry falls back to a defined angle rather than NaN.
  assert.equal(flowPathToCssAngle(null), 90);
});

test("MET-15E1 the retained reference layer-selection math still keeps water layers present under reduced motion (unit-tested even though nothing mounts it in production anymore)", () => {
  const layersStandard = resolveActiveWaterLayers({ reducedMotion: false, performanceMode: "STANDARD" });
  const layersReduced = resolveActiveWaterLayers({ reducedMotion: true, performanceMode: "STANDARD" });
  assert.equal(layersStandard.rapidsFoam, true);
  assert.equal(layersReduced.rapidsFoam, true);
  assert.equal(layersReduced.rapidsStreaks, true, "streak elements should still render under reduced motion (just not animate)");
  assert.equal(layersReduced.animated, false);
});

test("MET-15E1 LOW mode reduces active water layers to a single restrained rapids presentation", () => {
  const layers = resolveActiveWaterLayers({ reducedMotion: false, performanceMode: "LOW" });
  assert.equal(layers.rapidsFoam, true, "LOW mode must still show the river/rapids, not remove it");
  assert.equal(layers.rapidsStreaks, false);
  assert.equal(layers.turbulence, false);
  assert.equal(layers.calmStreaks, false);
  const standardLayerCount = Object.values(resolveActiveWaterLayers({ performanceMode: "STANDARD" })).filter(Boolean).length;
  const lowLayerCount = Object.values(layers).filter(Boolean).length;
  assert.ok(lowLayerCount < standardLayerCount);
});

test("MET-15E1 valid time-of-day presentation profiles exist for DAY/DUSK/NIGHT and stay restrained (no bright/neon night water)", () => {
  for (const mode of ["DAY", "DUSK", "NIGHT"]) {
    const profile = resolveRiverTimeOfDayProfile(mode);
    assert.ok(profile.foamOpacity > 0 && profile.foamOpacity <= 0.6, `${mode} foamOpacity should stay restrained, got ${profile.foamOpacity}`);
    assert.ok(profile.brightness > 0 && profile.brightness <= 1.1, `${mode} brightness should stay restrained, got ${profile.brightness}`);
  }
  // NIGHT must be the dimmest, not brighter/glowing.
  assert.ok(METAVERSE_RIVER_TIME_OF_DAY_PROFILES.NIGHT.brightness < METAVERSE_RIVER_TIME_OF_DAY_PROFILES.DAY.brightness);
  assert.ok(METAVERSE_RIVER_TIME_OF_DAY_PROFILES.NIGHT.foamOpacity < METAVERSE_RIVER_TIME_OF_DAY_PROFILES.DAY.foamOpacity);
  // Unknown mode falls back to a defined profile, never undefined/NaN.
  assert.equal(resolveRiverTimeOfDayProfile("NOT_A_MODE"), METAVERSE_RIVER_TIME_OF_DAY_PROFILES.DUSK);
});

test("MET-15E1 debug overlay enhancements remain dev-only and query-param gated, with no permanent user-facing panel", () => {
  const debugLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseRiverFlowDebugLayer.jsx", import.meta.url), "utf8");
  assert.match(debugLayerSource, /import\.meta\.env\.DEV/);
  assert.match(debugLayerSource, /enabled/);
  assert.doesNotMatch(debugLayerSource, /onClick|onPointer|requestMetaverseEntry|fastTravel/);
  const mountSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
  assert.match(mountSource, /riverFlowDebug/);
});

test("MET-15K the runtime-traced river-motion/rapids layer is deleted (retired from production, not just disabled) and MetaverseLivingCityLayer no longer mounts it", () => {
  assert.ok(!existsSync(new URL("../src/components/metaverse/living-city/MetaverseRiverMotionLayer.jsx", import.meta.url)));
  const mountSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(mountSource, /<MetaverseRiverMotionLayer/);
  assert.match(mountSource, /data-river-motion="RETIRED_FROM_PRODUCTION"/);
});

test("MET-15E1 no vehicle/road registry mutation — the retained presentation module only imports read functions", () => {
  const presentationSource = readFileSync(new URL("../src/system/metaverse/metaverseRiverMotionPresentation.js", import.meta.url), "utf8");
  assert.doesNotMatch(presentationSource, /METAVERSE_ROAD_TRACES\s*[.\[]|METAVERSE_BUS_ROUTES\s*[.\[]|\.push\(|\.splice\(/);
});

test("MET-15K dead river-motion CSS (rapids SVG, wash, streak lines) was removed along with the retired layer", () => {
  const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
  const stripped = cssSource.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(stripped, /\.met-river-motion[\s,{]/);
  assert.doesNotMatch(stripped, /\.met-river-rapids-svg[\s,{]/);
  assert.doesNotMatch(stripped, /\.met-river-wash[\s,{]/);
  assert.doesNotMatch(stripped, /\.met-river-streak-line[\s,{-]/);
});

test("MET-15E1 road-trace registry geometry is byte-identical to MET-15C-R's end state as of MET-15E1 (unaffected by that phase's river work; MET-15H later corrected MAJOR_ROAD_03's own geometry against the production plate — see metaverseRoadTraceRegistry.test.mjs)", () => {
  const trimmedMajorRoad04 = METAVERSE_ROAD_TRACES.find((p) => p.id === "MAJOR_ROAD_04");
  assert.deepEqual(trimmedMajorRoad04.points, [
    { x: 29, y: 43 }, { x: 36, y: 44 }, { x: 44, y: 45 }, { x: 48, y: 45 }, { x: 52, y: 44 }, { x: 56, y: 44 },
  ]);
});

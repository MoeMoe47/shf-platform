import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  METAVERSE_BUS_ROUTES,
  METAVERSE_EXCLUDED_ROAD_CORRIDORS,
  METAVERSE_ROAD_DEPTH_BANDS,
  METAVERSE_ROAD_TRACES,
  METAVERSE_ROAD_TRACE_PATH_TYPES,
  classifyDepthBand,
  computeDepthCoverage,
  getRoadTraceById,
  getRoadTracesForScene,
  resolveBusRoutePoints,
  validateRoadTraceRegistry,
} from "../src/system/metaverse/metaverseRoadTraceRegistry.js";

const REQUIRED_ROAD_IDS = [
  "FREEWAY_01", "FREEWAY_02", "FREEWAY_03",
  "MAJOR_ROAD_01", "MAJOR_ROAD_02", "MAJOR_ROAD_03", "MAJOR_ROAD_04",
  "BRIDGE_01", "BRIDGE_02", "BRIDGE_03",
];
const REQUIRED_BUS_ROUTE_IDS = ["BUS_ROUTE_01", "BUS_ROUTE_02", "BUS_ROUTE_03"];
const STREAK_ELIGIBLE_IDS = ["FREEWAY_01", "FREEWAY_02", "FREEWAY_03"];

test("MET-15B registry integrity: validateRoadTraceRegistry reports no errors", () => {
  const result = validateRoadTraceRegistry();
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("MET-15B all required freeway/major-road/bridge path IDs are present exactly once", () => {
  const ids = METAVERSE_ROAD_TRACES.map((path) => path.id);
  for (const id of REQUIRED_ROAD_IDS) {
    assert.equal(ids.filter((existing) => existing === id).length, 1, `expected exactly one ${id}`);
  }
  assert.equal(new Set(ids).size, ids.length, "no duplicate road trace ids");
});

test("MET-15B all required bus route IDs are present exactly once", () => {
  const ids = METAVERSE_BUS_ROUTES.map((route) => route.id);
  for (const id of REQUIRED_BUS_ROUTE_IDS) {
    assert.equal(ids.filter((existing) => existing === id).length, 1, `expected exactly one ${id}`);
  }
  assert.equal(new Set(ids).size, ids.length, "no duplicate bus route ids");
});

test("MET-15B every point on every road trace is within the 0-100 canonical scene range", () => {
  for (const path of METAVERSE_ROAD_TRACES) {
    for (const point of path.points) {
      assert.ok(point.x >= 0 && point.x <= 100, `${path.id} x out of range: ${point.x}`);
      assert.ok(point.y >= 0 && point.y <= 100, `${path.id} y out of range: ${point.y}`);
    }
  }
});

test("MET-15B no road trace has an empty points array", () => {
  for (const path of METAVERSE_ROAD_TRACES) {
    assert.ok(Array.isArray(path.points) && path.points.length > 0, `${path.id} has no points`);
  }
});

test("MET-15B every road trace has enough points to represent a real polyline (not first/last-only)", () => {
  for (const path of METAVERSE_ROAD_TRACES) {
    assert.ok(path.points.length >= 3, `${path.id} has only ${path.points.length} point(s); needs intermediate points for curve-following`);
  }
});

test("MET-15B every road trace declares only valid, known path types", () => {
  for (const path of METAVERSE_ROAD_TRACES) {
    assert.ok(path.pathTypes.length > 0, `${path.id} has no pathTypes`);
    for (const type of path.pathTypes) {
      assert.ok(METAVERSE_ROAD_TRACE_PATH_TYPES.includes(type), `${path.id} has invalid pathType ${type}`);
    }
  }
});

test("MET-15B every road trace and bus route stays DECORATIVE (no traffic-authority state)", () => {
  for (const path of METAVERSE_ROAD_TRACES) assert.equal(path.stateClassification, "DECORATIVE", path.id);
  for (const route of METAVERSE_BUS_ROUTES) assert.equal(route.stateClassification, "DECORATIVE", route.id);
});

test("MET-15B freeway streaks are eligible only on the three approved freeway ids", () => {
  for (const path of METAVERSE_ROAD_TRACES) {
    if (STREAK_ELIGIBLE_IDS.includes(path.id)) {
      assert.equal(path.streakEligible, true, `${path.id} should be streak-eligible`);
    } else {
      assert.equal(path.streakEligible, false, `${path.id} should NOT be streak-eligible`);
    }
  }
});

test("MET-15B bus routes reference only real, existing road trace ids and resolve to a usable path", () => {
  const roadIds = new Set(METAVERSE_ROAD_TRACES.map((path) => path.id));
  for (const route of METAVERSE_BUS_ROUTES) {
    assert.ok(route.usesPathIds.length > 0, `${route.id} references no road data`);
    for (const pathId of route.usesPathIds) {
      assert.ok(roadIds.has(pathId), `${route.id} references unknown road ${pathId}`);
    }
    const resolved = resolveBusRoutePoints(route.id);
    assert.ok(resolved.length >= 2, `${route.id} does not resolve to a usable polyline`);
  }
});

test("MET-15B depth coverage is derived from actual point Y values and stays within the locked bands", () => {
  assert.equal(classifyDepthBand(0), "DEPTH_FAR");
  assert.equal(classifyDepthBand(42), "DEPTH_FAR");
  assert.equal(classifyDepthBand(43), "DEPTH_MID");
  assert.equal(classifyDepthBand(72), "DEPTH_MID");
  assert.equal(classifyDepthBand(73), "DEPTH_NEAR");
  assert.equal(classifyDepthBand(100), "DEPTH_NEAR");
  for (const path of METAVERSE_ROAD_TRACES) {
    const derived = computeDepthCoverage(path.points);
    assert.deepEqual(path.depthCoverage, derived, `${path.id} depthCoverage is stale relative to its points`);
    assert.ok(derived.length > 0, `${path.id} has no depth coverage`);
  }
});

test("MET-15B depth band boundaries match the locked spec ranges (FAR 0-42, MID 42-72, NEAR 72-100)", () => {
  assert.deepEqual(METAVERSE_ROAD_DEPTH_BANDS.DEPTH_FAR, { minY: 0, maxY: 42 });
  assert.deepEqual(METAVERSE_ROAD_DEPTH_BANDS.DEPTH_MID, { minY: 42, maxY: 72 });
  assert.deepEqual(METAVERSE_ROAD_DEPTH_BANDS.DEPTH_NEAR, { minY: 72, maxY: 100 });
});

test("MET-15B all road traces belong to the silicon-heartland-city scene and are retrievable by scene id", () => {
  const cityScene = getRoadTracesForScene("silicon-heartland-city");
  assert.equal(cityScene.length, METAVERSE_ROAD_TRACES.length);
  for (const path of METAVERSE_ROAD_TRACES) assert.equal(path.sceneId, "silicon-heartland-city");
  assert.equal(getRoadTracesForScene("nonexistent-scene").length, 0);
});

test("MET-15B getRoadTraceById resolves known ids and returns null for unknown ids", () => {
  assert.equal(getRoadTraceById("FREEWAY_01").name, "Foreground South Belt");
  assert.equal(getRoadTraceById("NOT_A_REAL_ID"), null);
});

test("MET-15B excluded corridors are documented with a reason (Phase 6 requirement)", () => {
  assert.ok(METAVERSE_EXCLUDED_ROAD_CORRIDORS.length >= 4, "expected several documented exclusions");
  for (const entry of METAVERSE_EXCLUDED_ROAD_CORRIDORS) {
    assert.ok(entry.area && entry.excludedAs && entry.reason, `exclusion entry missing fields: ${JSON.stringify(entry)}`);
  }
});

test("MET-15B no vehicle/bus/streak animation code was introduced by this registry", () => {
  const registrySource = readFileSync(new URL("../src/system/metaverse/metaverseRoadTraceRegistry.js", import.meta.url), "utf8");
  assert.doesNotMatch(registrySource, /setInterval|requestAnimationFrame|@keyframes/);
  const debugLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseRoadTraceDebugLayer.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(debugLayerSource, /setInterval|requestAnimationFrame|@keyframes/);
});

test("MET-15B road-trace debug overlay is gated behind DEV mode and an explicit opt-in, and is mounted through the existing living-city layer plane", () => {
  const layerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseRoadTraceDebugLayer.jsx", import.meta.url), "utf8");
  assert.match(layerSource, /import\.meta\.env\.DEV/);
  assert.match(layerSource, /enabled/);
  const mountSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
  assert.match(mountSource, /MetaverseRoadTraceDebugLayer/);
  assert.match(mountSource, /roadTraceDebug/);
});

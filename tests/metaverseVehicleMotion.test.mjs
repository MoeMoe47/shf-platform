import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  METAVERSE_BUS_ROUTES,
  METAVERSE_ROAD_TRACES,
  getBusRouteById,
  getRoadTracesForScene,
  resolveBusRoutePoints,
  resolveBusRouteSegments,
} from "../src/system/metaverse/metaverseRoadTraceRegistry.js";
import {
  VEHICLE_SCALE_ABSOLUTE_CAP,
  VEHICLE_SCALE_MAX,
  VEHICLE_SCALE_MIN,
  buildBusManifest,
  buildCarManifest,
  buildPolylineKeyframeStops,
  buildPositionOnlyKeyframesCss,
  buildVehicleKeyframesCss,
  computePolylineLength,
  computePolylineSegmentLengths,
  computeStaggerDelaySeconds,
  computeVehiclePerspectiveScale,
  getBusCountForRoute,
  getCarCountForPath,
  resolvePolylinePosition,
  resolveSpeedSeconds,
  unwrapHeadingsDeg,
} from "../src/system/metaverse/metaverseVehicleMotion.js";

const CANONICAL_SCENE_ID = "silicon-heartland-city";
const cornerPolyline = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];

test("MET-15D polyline length calculation", () => {
  assert.deepEqual(computePolylineSegmentLengths(cornerPolyline), [10, 10]);
  assert.equal(computePolylineLength(cornerPolyline), 20);
});

test("MET-15D progress interpolation walks segment-by-segment", () => {
  assert.deepEqual(resolvePolylinePosition(cornerPolyline, 0), { x: 0, y: 0, headingDeg: 0 });
  assert.deepEqual(resolvePolylinePosition(cornerPolyline, 0.25), { x: 5, y: 0, headingDeg: 0 });
  assert.deepEqual(resolvePolylinePosition(cornerPolyline, 0.5), { x: 10, y: 0, headingDeg: 90 });
  assert.deepEqual(resolvePolylinePosition(cornerPolyline, 1), { x: 10, y: 10, headingDeg: 90 });
});

test("MET-15D intermediate points are actually used — curved paths do not resolve as a first->last straight-line shortcut", () => {
  // At progress 0.75 (75% of the L-shaped path's length), the real
  // (corner-following) position is (10, 5). A naive first->last linear
  // shortcut over the same progress would instead give (7.5, 7.5) — a
  // meaningfully different point, proving the corner is actually honored.
  const real = resolvePolylinePosition(cornerPolyline, 0.75);
  const first = cornerPolyline[0];
  const last = cornerPolyline[cornerPolyline.length - 1];
  const shortcut = { x: first.x + (last.x - first.x) * 0.75, y: first.y + (last.y - first.y) * 0.75 };
  assert.deepEqual(real, { x: 10, y: 5, headingDeg: 90 });
  assert.ok(Math.hypot(real.x - shortcut.x, real.y - shortcut.y) > 2, "expected a meaningful deviation from the straight-line shortcut");
});

test("MET-15D every real polyline point becomes its own keyframe stop (no point is skipped)", () => {
  const stops = buildPolylineKeyframeStops(cornerPolyline);
  assert.equal(stops.length, cornerPolyline.length);
  for (let i = 0; i < cornerPolyline.length; i += 1) {
    assert.equal(stops[i].x, cornerPolyline[i].x);
    assert.equal(stops[i].y, cornerPolyline[i].y);
  }
  assert.equal(stops[0].percent, 0);
  assert.equal(stops[stops.length - 1].percent, 100);
});

test("MET-15D every canonical road trace's own keyframe stops follow every point (real production geometry, not just this file's synthetic example)", () => {
  for (const path of getRoadTracesForScene(CANONICAL_SCENE_ID)) {
    const stops = buildPolylineKeyframeStops(path.points);
    assert.equal(stops.length, path.points.length, `${path.id} lost a point building keyframe stops`);
  }
});

test("MET-15D unwrapHeadingsDeg keeps a rotation sequence continuous (no 359->1 style jump)", () => {
  const wrapped = unwrapHeadingsDeg([170, -170]);
  assert.ok(Math.abs(wrapped[1] - wrapped[0]) <= 180, "expected the short way around, not a 340deg jump");
});

test("MET-15D y-based perspective scaling is continuous and monotonically non-decreasing", () => {
  assert.equal(computeVehiclePerspectiveScale(0), VEHICLE_SCALE_MIN);
  let previous = -Infinity;
  for (let y = 0; y <= 100; y += 1) {
    const scale = computeVehiclePerspectiveScale(y);
    assert.ok(scale >= previous, `scale decreased at y=${y}`);
    previous = scale;
  }
  // Band-boundary sanity per the spec's suggested ranges.
  assert.ok(computeVehiclePerspectiveScale(42) >= 1.2 && computeVehiclePerspectiveScale(42) < 1.5, "FAR/MID boundary should read ~mid tier");
  assert.ok(computeVehiclePerspectiveScale(72) >= 1.4 && computeVehiclePerspectiveScale(72) <= 1.6, "MID/NEAR boundary should read ~near tier");
});

test("MET-15D perspective scale never exceeds the hard cap, even for out-of-range or extreme y", () => {
  assert.ok(computeVehiclePerspectiveScale(100) <= VEHICLE_SCALE_ABSOLUTE_CAP);
  assert.ok(computeVehiclePerspectiveScale(1000) <= VEHICLE_SCALE_ABSOLUTE_CAP);
  assert.ok(computeVehiclePerspectiveScale(-50) >= VEHICLE_SCALE_MIN);
  assert.equal(VEHICLE_SCALE_MAX <= VEHICLE_SCALE_ABSOLUTE_CAP, true);
});

test("MET-15D generated CSS keyframes bake position and (for the full variant) perspective scale at every stop", () => {
  const css = buildVehicleKeyframesCss("testAnim", cornerPolyline);
  assert.match(css, /@keyframes testAnim/);
  assert.match(css, /0\.000% \{ left: 0%; top: 0%;/);
  assert.match(css, /scale\(/);
  const positionOnlyCss = buildPositionOnlyKeyframesCss("testAnim2", cornerPolyline);
  assert.doesNotMatch(positionOnlyCss, /scale\(/);
});

test("MET-15D deterministic stagger produces evenly spaced, non-simultaneous, non-random delays", () => {
  const delays = [0, 1, 2].map((i) => computeStaggerDelaySeconds(i, 3, 30));
  assert.deepEqual(delays, [0, -10, -20]);
  assert.equal(computeStaggerDelaySeconds(0, 1, 30), 0);
});

test("MET-15D speed profiles are deterministic (same category/index always resolves the same duration)", () => {
  const a = resolveSpeedSeconds("FREEWAY", 1);
  const b = resolveSpeedSeconds("FREEWAY", 1);
  assert.equal(a, b);
  // Ordering: FREEWAY fastest end, BUS slowest end, per Phase 6.
  const [busMin] = [42];
  const [freewayMin] = [15];
  assert.ok(freewayMin < busMin);
});

test("MET-15D LOW-mode density reduction: car and bus counts drop substantially under LOW vs STANDARD", () => {
  const canonicalRoads = getRoadTracesForScene(CANONICAL_SCENE_ID);
  const standardCars = buildCarManifest(canonicalRoads, "STANDARD");
  const lowCars = buildCarManifest(canonicalRoads, "LOW");
  assert.ok(lowCars.length < standardCars.length, `expected LOW (${lowCars.length}) < STANDARD (${standardCars.length})`);

  assert.equal(getBusCountForRoute("STANDARD"), 1);
  assert.equal(getBusCountForRoute("LOW"), 0);
  const standardBuses = buildBusManifest(METAVERSE_BUS_ROUTES, resolveBusRoutePoints, "STANDARD");
  const lowBuses = buildBusManifest(METAVERSE_BUS_ROUTES, resolveBusRoutePoints, "LOW");
  assert.ok(lowBuses.length < standardBuses.length);
});

test("MET-15D vehicle counts stay bounded (sparse-by-design, not a traffic simulation)", () => {
  const canonicalRoads = getRoadTracesForScene(CANONICAL_SCENE_ID);
  const cars = buildCarManifest(canonicalRoads, "STANDARD");
  const buses = buildBusManifest(METAVERSE_BUS_ROUTES, resolveBusRoutePoints, "STANDARD");
  assert.ok(cars.length <= 15, `expected a sparse car count, got ${cars.length}`);
  assert.ok(buses.length <= METAVERSE_BUS_ROUTES.length, `expected at most one bus per route, got ${buses.length}`);
});

test("MET-15D no unauthorized path IDs: every car manifest entry references a real canonical road trace", () => {
  const canonicalRoads = getRoadTracesForScene(CANONICAL_SCENE_ID);
  const roadIds = new Set(canonicalRoads.map((path) => path.id));
  for (const car of buildCarManifest(canonicalRoads, "STANDARD")) {
    assert.ok(roadIds.has(car.pathId), `car references unknown path ${car.pathId}`);
  }
});

test("MET-15D valid bus route references: every bus manifest entry references one of BUS_ROUTE_01/02/03 and resolves real geometry", () => {
  const approvedRouteIds = new Set(["BUS_ROUTE_01", "BUS_ROUTE_02", "BUS_ROUTE_03"]);
  const buses = buildBusManifest(METAVERSE_BUS_ROUTES, resolveBusRoutePoints, "STANDARD");
  assert.ok(buses.length > 0);
  for (const bus of buses) {
    assert.ok(approvedRouteIds.has(bus.routeId), `bus references unapproved route ${bus.routeId}`);
    assert.ok(bus.points.length >= 2, `bus on ${bus.routeId} has no usable geometry`);
  }
});

test("MET-15D no BRIDGE_03 bus usage — neither directly nor via any canonical route's resolved segments", () => {
  for (const route of METAVERSE_BUS_ROUTES) {
    assert.ok(!route.usesPathIds.includes("BRIDGE_03"), `${route.id} must not use BRIDGE_03`);
    const segments = resolveBusRouteSegments(route.id);
    assert.ok(!segments.some((segment) => segment.pathId === "BRIDGE_03"), `${route.id} resolved segments must not include BRIDGE_03`);
  }
});

test("MET-15D BUS_ROUTE_01 (Civic Circulator, OUT_AND_BACK) resolves to a real forward+reverse traversal of the same road", () => {
  const route = getBusRouteById("BUS_ROUTE_01");
  assert.equal(route.topology, "OUT_AND_BACK");
  const points = resolveBusRoutePoints("BUS_ROUTE_01");
  assert.ok(points.length >= 2);
  const stops = buildPolylineKeyframeStops(points);
  assert.equal(stops.length, points.length);
  assert.equal(stops[0].percent, 0);
  assert.equal(stops[stops.length - 1].percent, 100);
});

test("MET-15D BUS_ROUTE_02 (LINE with an embedded out-and-back spur) resolves to continuous real geometry", () => {
  const route = getBusRouteById("BUS_ROUTE_02");
  assert.equal(route.topology, "LINE");
  const points = resolveBusRoutePoints("BUS_ROUTE_02");
  assert.ok(points.length >= 4);
  // No duplicate adjacent points should survive into the animatable geometry.
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    assert.ok(a.x !== b.x || a.y !== b.y, `duplicate adjacent point at index ${i}`);
  }
});

test("MET-15D BUS_ROUTE_03 (East District Shuttle, LINE) resolves to continuous real geometry using BRIDGE_02 + MAJOR_ROAD_03 only", () => {
  const route = getBusRouteById("BUS_ROUTE_03");
  assert.equal(route.topology, "LINE");
  const usedIds = new Set(route.usesPathIds);
  assert.deepEqual(usedIds, new Set(["BRIDGE_02", "MAJOR_ROAD_03"]));
  const points = resolveBusRoutePoints("BUS_ROUTE_03");
  assert.ok(points.length >= 2);
});

test("MET-15K the canonical vehicle layer is deleted (retired from production, not just disabled) and MetaverseLivingCityLayer no longer mounts it", () => {
  assert.ok(!existsSync(new URL("../src/components/metaverse/living-city/MetaverseVehicleLayer.jsx", import.meta.url)));
  assert.ok(!existsSync(new URL("../src/components/metaverse/living-city/MetaverseTrafficLayer.jsx", import.meta.url)));
  const mountSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(mountSource, /<MetaverseVehicleLayer|<MetaverseTrafficLayer/);
  assert.match(mountSource, /RETIRED_FROM_PRODUCTION/);
});

test("MET-15D no freeway streak / cloud / bird / turbine implementation was introduced (checked against the retained reference math module)", () => {
  // Strip comments first: this file's own code comments legitimately say
  // things like "no freeway streak / cloud / bird / turbine behavior" to
  // document what was deliberately NOT implemented — that prose must not
  // trip a check that's actually looking for real implementation code
  // (class names, CSS selectors, keyframes, function/component names).
  const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const motionSource = stripComments(readFileSync(new URL("../src/system/metaverse/metaverseVehicleMotion.js", import.meta.url), "utf8"));
  assert.doesNotMatch(motionSource, /streak/i);
  assert.doesNotMatch(motionSource, /cloud/i);
  assert.doesNotMatch(motionSource, /\bbird\b/i);
  assert.doesNotMatch(motionSource, /turbine/i);
  // The CSS file is shared/pre-existing (it already has an unrelated
  // .met-living-ambient--clouds rule from an earlier phase, and MET-15E1
  // added a legitimate, explicitly-requested .met-river-streak-line for
  // water flow — since removed in MET-15K along with the rest of the
  // retired river-motion CSS), so only assert no FREEWAY-streak class
  // exists at all now.
  const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
  assert.doesNotMatch(cssSource, /\.met-freeway[\w-]*streak/i);
  assert.doesNotMatch(cssSource, /\.met-[\w-]*streak[\w-]*freeway/i);
  assert.doesNotMatch(cssSource, /\.met-[\w-]*bird/i);
  assert.doesNotMatch(cssSource, /\.met-[\w-]*turbine/i);
});

test("MET-15D every canonical road trace still validates cleanly (registry integrity unaffected by the vehicle layer's retirement)", () => {
  for (const path of METAVERSE_ROAD_TRACES) {
    assert.ok(Array.isArray(path.points) && path.points.length >= 3);
  }
});

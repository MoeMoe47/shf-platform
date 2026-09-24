import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  METAVERSE_BUS_ROUTES,
  METAVERSE_ROUTE_CONTINUITY_TOLERANCE,
  METAVERSE_ROUTE_TOPOLOGIES,
  getBusRouteById,
  getBusRouteContinuityReport,
  getRoadTraceById,
  resolveBusRoutePoints,
  resolveBusRouteSegments,
  validateRoadTraceRegistry,
} from "../src/system/metaverse/metaverseRoadTraceRegistry.js";

test("MET-15C-R registry integrity holds after the bus-route redesign", () => {
  const result = validateRoadTraceRegistry();
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("MET-15C-R BUS_ROUTE_01 (Civic Circulator) is fully continuous", () => {
  const report = getBusRouteContinuityReport("BUS_ROUTE_01");
  assert.equal(report.continuous, true, JSON.stringify(report.gaps));
});

test("MET-15C-R BUS_ROUTE_02 (unchanged) is fully continuous", () => {
  const report = getBusRouteContinuityReport("BUS_ROUTE_02");
  assert.equal(report.continuous, true, JSON.stringify(report.gaps));
});

test("MET-15C-R BUS_ROUTE_03 (East District Shuttle) is fully continuous", () => {
  const report = getBusRouteContinuityReport("BUS_ROUTE_03");
  assert.equal(report.continuous, true, JSON.stringify(report.gaps));
});

test("MET-15C-R all three canonical bus routes are provisional: false", () => {
  for (const route of METAVERSE_BUS_ROUTES) {
    assert.equal(route.provisional, false, `${route.id} should be provisional: false`);
  }
});

test("MET-15C-R every join on every canonical route is within METAVERSE_ROUTE_CONTINUITY_TOLERANCE", () => {
  for (const route of METAVERSE_BUS_ROUTES) {
    const report = getBusRouteContinuityReport(route.id);
    for (const gap of report.gaps) {
      assert.ok(
        gap.distance <= METAVERSE_ROUTE_CONTINUITY_TOLERANCE,
        `${route.id}: ${gap.fromPathId}(${gap.fromDirection}) -> ${gap.toPathId}(${gap.toDirection}) = ${gap.distance}`,
      );
    }
  }
});

test("MET-15C-R every canonical route declares a valid topology value", () => {
  for (const route of METAVERSE_BUS_ROUTES) {
    assert.ok(METAVERSE_ROUTE_TOPOLOGIES.includes(route.topology), `${route.id} has invalid/missing topology ${route.topology}`);
  }
  assert.equal(getBusRouteById("BUS_ROUTE_01").topology, "OUT_AND_BACK");
  assert.equal(getBusRouteById("BUS_ROUTE_02").topology, "LINE");
  assert.equal(getBusRouteById("BUS_ROUTE_03").topology, "LINE");
});

test("MET-15C-R OUT_AND_BACK resolves correctly: BUS_ROUTE_01 traverses MAJOR_ROAD_04 forward then reverse, turnaround on real road", () => {
  const segments = resolveBusRouteSegments("BUS_ROUTE_01");
  assert.equal(segments.length, 2);
  assert.equal(segments[0].pathId, "MAJOR_ROAD_04");
  assert.equal(segments[0].direction, "FORWARD");
  assert.equal(segments[1].pathId, "MAJOR_ROAD_04");
  assert.equal(segments[1].direction, "REVERSE");

  const forwardPath = getRoadTraceById("MAJOR_ROAD_04").points;
  assert.deepEqual(segments[0].points, forwardPath);
  assert.deepEqual(segments[1].points, [...forwardPath].reverse());

  // The turnaround (end of forward = start of reverse) must be the same
  // point, i.e. the route physically turns around on the road rather than
  // jumping — and that point is on the real, confirmed extent of
  // MAJOR_ROAD_04 (its own last point), not an invented location.
  const turnaround = forwardPath[forwardPath.length - 1];
  assert.deepEqual(segments[0].points[segments[0].points.length - 1], turnaround);
  assert.deepEqual(segments[1].points[0], turnaround);
});

test("MET-15C-R duplicate adjacent points are removed from every resolved canonical route", () => {
  for (const route of METAVERSE_BUS_ROUTES) {
    const points = resolveBusRoutePoints(route.id);
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      assert.ok(a.x !== b.x || a.y !== b.y, `${route.id} has a duplicate adjacent point at index ${i}`);
    }
  }
});

test("MET-15C-R no canonical route resolves to zero-length geometry", () => {
  for (const route of METAVERSE_BUS_ROUTES) {
    const points = resolveBusRoutePoints(route.id);
    assert.ok(points.length >= 2, `${route.id} resolved to ${points.length} point(s)`);
  }
});

test("MET-15C-R BRIDGE_03 remains separately and independently provisional, and is not referenced by any canonical route", () => {
  const bridge03 = getRoadTraceById("BRIDGE_03");
  assert.equal(bridge03.provisional, true);
  // MET-15H performed the re-review this flag was waiting on (DAY/DUSK/
  // NIGHT went live in MET-15G) and corrected the traced geometry.
  assert.equal(bridge03.reviewOnAssetVariantUpgrade, false);
  assert.ok(typeof bridge03.reviewReason === "string" && bridge03.reviewReason.length > 20);
  for (const route of METAVERSE_BUS_ROUTES) {
    assert.ok(!route.usesPathIds.includes("BRIDGE_03"), `${route.id} should not reference the still-provisional BRIDGE_03`);
  }
});

test("MET-15C-R MAJOR_ROAD_03 -> BRIDGE_02 join (BUS_ROUTE_03) sits on real retraced road, not the old 15.62/22.56 gaps", () => {
  const report = getBusRouteContinuityReport("BUS_ROUTE_03");
  assert.equal(report.gaps.length, 1);
  assert.ok(report.gaps[0].distance < 8, `expected a tight join, got ${report.gaps[0].distance}`);
});

test("MET-15C-R no vehicle/bus/streak animation code was introduced by the redesign", () => {
  const registrySource = readFileSync(new URL("../src/system/metaverse/metaverseRoadTraceRegistry.js", import.meta.url), "utf8");
  assert.doesNotMatch(registrySource, /setInterval|requestAnimationFrame|@keyframes/);
});

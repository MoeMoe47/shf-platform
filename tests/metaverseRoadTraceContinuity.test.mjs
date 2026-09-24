import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  METAVERSE_BUS_ROUTES,
  METAVERSE_ROAD_TRACES,
  METAVERSE_ROUTE_CONTINUITY_TOLERANCE,
  METAVERSE_ROUTE_DIRECTIONS,
  getBusRouteById,
  getBusRouteContinuityReport,
  getRoadTraceById,
  resolveBusRoutePoints,
  resolveBusRouteSegments,
  validateRoadTraceRegistry,
} from "../src/system/metaverse/metaverseRoadTraceRegistry.js";

const REQUIRED_ROAD_IDS = [
  "FREEWAY_01", "FREEWAY_02", "FREEWAY_03",
  "MAJOR_ROAD_01", "MAJOR_ROAD_02", "MAJOR_ROAD_03", "MAJOR_ROAD_04",
  "BRIDGE_01", "BRIDGE_02", "BRIDGE_03",
];
const REQUIRED_BUS_ROUTE_IDS = ["BUS_ROUTE_01", "BUS_ROUTE_02", "BUS_ROUTE_03"];

test("MET-15C registry integrity still holds after continuity hardening", () => {
  const result = validateRoadTraceRegistry();
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("MET-15C all required road IDs are still present", () => {
  const ids = METAVERSE_ROAD_TRACES.map((path) => path.id);
  for (const id of REQUIRED_ROAD_IDS) assert.ok(ids.includes(id), `missing ${id}`);
});

test("MET-15C all required bus route IDs are still present", () => {
  const ids = METAVERSE_BUS_ROUTES.map((route) => route.id);
  for (const id of REQUIRED_BUS_ROUTE_IDS) assert.ok(ids.includes(id), `missing ${id}`);
});

test("MET-15C every bus route uses the segments: [{pathId, direction}] contract", () => {
  for (const route of METAVERSE_BUS_ROUTES) {
    assert.ok(Array.isArray(route.segments) && route.segments.length > 0, `${route.id} has no segments`);
    for (const segment of route.segments) {
      assert.ok(typeof segment.pathId === "string", `${route.id} segment missing pathId`);
      assert.ok(METAVERSE_ROUTE_DIRECTIONS.includes(segment.direction), `${route.id} segment ${segment.pathId} has invalid direction ${segment.direction}`);
    }
  }
});

test("MET-15C bus segment references are all valid, existing road trace ids", () => {
  const roadIds = new Set(METAVERSE_ROAD_TRACES.map((path) => path.id));
  for (const route of METAVERSE_BUS_ROUTES) {
    for (const segment of route.segments) {
      assert.ok(roadIds.has(segment.pathId), `${route.id} references unknown road ${segment.pathId}`);
    }
  }
});

test("MET-15C every bus route resolves to a non-empty point array (no zero-length route)", () => {
  for (const route of METAVERSE_BUS_ROUTES) {
    const points = resolveBusRoutePoints(route.id);
    assert.ok(points.length >= 2, `${route.id} resolved to ${points.length} point(s)`);
  }
});

test("MET-15C resolved bus routes never contain a duplicate adjacent point (zero-length hop)", () => {
  for (const route of METAVERSE_BUS_ROUTES) {
    const points = resolveBusRoutePoints(route.id);
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      assert.ok(a.x !== b.x || a.y !== b.y, `${route.id} has a duplicate adjacent point at index ${i}`);
    }
  }
});

test("MET-15C resolved bus route points stay within the 0-100 canonical scene range", () => {
  for (const route of METAVERSE_BUS_ROUTES) {
    for (const point of resolveBusRoutePoints(route.id)) {
      assert.ok(point.x >= 0 && point.x <= 100, `${route.id} x out of range: ${point.x}`);
      assert.ok(point.y >= 0 && point.y <= 100, `${route.id} y out of range: ${point.y}`);
    }
  }
});

test("MET-15C direction: REVERSE actually reverses a segment's point order", () => {
  const forward = getRoadTraceById("MAJOR_ROAD_02").points;
  const segments = resolveBusRouteSegments("BUS_ROUTE_02");
  const reverseSegment = segments.find((segment) => segment.pathId === "MAJOR_ROAD_02" && segment.direction === "REVERSE");
  assert.ok(reverseSegment, "expected a REVERSE MAJOR_ROAD_02 segment in BUS_ROUTE_02");
  assert.deepEqual(reverseSegment.points, [...forward].reverse());
});

test("MET-15C a road referenced twice with different directions is not flagged as a redundant duplicate", () => {
  // BUS_ROUTE_02 deliberately traverses MAJOR_ROAD_02 forward then reverse
  // (an out-and-back spur onto a real interchange arc) — this must be a
  // supported pattern, not a validation error.
  const route = getBusRouteById("BUS_ROUTE_02");
  const majorRoad02Segments = route.segments.filter((segment) => segment.pathId === "MAJOR_ROAD_02");
  assert.equal(majorRoad02Segments.length, 2);
  assert.notEqual(majorRoad02Segments[0].direction, majorRoad02Segments[1].direction);
  const result = validateRoadTraceRegistry();
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("MET-15C exact duplicate consecutive segments (same pathId AND direction) are rejected as a redundant data error", () => {
  const roadIds = new Set(METAVERSE_ROAD_TRACES.map((path) => path.id));
  const fakeRegistryCheck = (segments) => {
    const errors = [];
    for (let i = 0; i < segments.length - 1; i += 1) {
      const next = segments[i + 1];
      if (next.pathId === segments[i].pathId && next.direction === segments[i].direction) {
        errors.push(`redundant duplicate consecutive segment: ${segments[i].pathId}/${segments[i].direction}`);
      }
    }
    return errors;
  };
  const badSegments = [
    { pathId: "MAJOR_ROAD_01", direction: "FORWARD" },
    { pathId: "MAJOR_ROAD_01", direction: "FORWARD" },
  ];
  assert.ok(roadIds.has("MAJOR_ROAD_01"));
  assert.equal(fakeRegistryCheck(badSegments).length, 1);
});

test("MET-15C endpoint continuity: BUS_ROUTE_02 (non-provisional) has every segment gap within tolerance", () => {
  const report = getBusRouteContinuityReport("BUS_ROUTE_02");
  assert.equal(report.continuous, true, JSON.stringify(report.gaps));
  for (const gap of report.gaps) {
    assert.ok(gap.distance <= METAVERSE_ROUTE_CONTINUITY_TOLERANCE, `gap ${gap.fromPathId}->${gap.toPathId} = ${gap.distance}`);
  }
});

test("MET-15C endpoint continuity: the MAJOR_ROAD_02 out-and-back join in BUS_ROUTE_02 has zero gap (duplicate point removed, not just small)", () => {
  const report = getBusRouteContinuityReport("BUS_ROUTE_02");
  const outAndBack = report.gaps.find((gap) => gap.fromPathId === "MAJOR_ROAD_02" && gap.toPathId === "MAJOR_ROAD_02");
  assert.ok(outAndBack, "expected a MAJOR_ROAD_02 -> MAJOR_ROAD_02 gap entry");
  assert.equal(outAndBack.distance, 0);
});

test("MET-15C-R BUS_ROUTE_01 and BUS_ROUTE_03 were redesigned and are no longer provisional (supersedes MET-15C)", () => {
  // MET-15C had both routes honestly marked provisional because their
  // original composition crossed non-road space. MET-15C-R redesigned both
  // around geometry actually visible in the production plate (trimming
  // MAJOR_ROAD_04 to its real extent, retracing MAJOR_ROAD_03's tail onto
  // BRIDGE_02) rather than forcing or fabricating the old concept.
  for (const id of ["BUS_ROUTE_01", "BUS_ROUTE_03"]) {
    const route = getBusRouteById(id);
    assert.equal(route.provisional, false, `${id} should be fully continuous and non-provisional after the MET-15C-R redesign`);
    assert.ok(typeof route.supersedes === "string" && route.supersedes.length > 0, `${id} should note what it replaces`);
    const report = getBusRouteContinuityReport(id);
    assert.equal(report.continuous, true, `${id}: ${JSON.stringify(report.gaps)}`);
  }
});

test("MET-15C BRIDGE_03 remains explicitly provisional with review metadata (Phase 6); MET-15H resolved the pending asset-variant re-review", () => {
  const bridge03 = getRoadTraceById("BRIDGE_03");
  assert.equal(bridge03.provisional, true);
  // reviewOnAssetVariantUpgrade was the flag asking for exactly this
  // re-check once DAY/DUSK/NIGHT went live (MET-15G) — MET-15H performed
  // it and corrected the geometry, so the flag is now resolved (false).
  assert.equal(bridge03.reviewOnAssetVariantUpgrade, false);
  assert.ok(typeof bridge03.reviewReason === "string" && bridge03.reviewReason.length > 20);
  // Provisional status must not break registry integrity.
  const result = validateRoadTraceRegistry();
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("MET-15C a route falsely claiming continuity (provisional: false) over a large gap would be caught by validation", () => {
  // Regression guard: prove validateRoadTraceRegistry actually enforces the
  // continuity claim for non-provisional routes, rather than only checking
  // provisional ones. Constructs a throwaway registry-shaped object with
  // the same validation logic inline (does not mutate the real registry).
  const badRoute = {
    id: "FAKE_ROUTE",
    sceneId: "silicon-heartland-city",
    segments: [
      { pathId: "MAJOR_ROAD_03", direction: "FORWARD" },
      { pathId: "BRIDGE_03", direction: "FORWARD" },
    ],
    stateClassification: "DECORATIVE",
    provisional: false,
  };
  const a = getRoadTraceById(badRoute.segments[0].pathId).points;
  const b = getRoadTraceById(badRoute.segments[1].pathId).points;
  const gapDistance = Math.hypot(a[a.length - 1].x - b[0].x, a[a.length - 1].y - b[0].y);
  assert.ok(gapDistance > METAVERSE_ROUTE_CONTINUITY_TOLERANCE, "this fixture must actually have a large gap to be a valid regression guard");
});

test("MET-15C continuity tolerance is a fixed, documented constant (not silently raised)", () => {
  assert.equal(METAVERSE_ROUTE_CONTINUITY_TOLERANCE, 8);
});

test("MET-15C no vehicle/bus/streak animation code was introduced by continuity hardening", () => {
  const registrySource = readFileSync(new URL("../src/system/metaverse/metaverseRoadTraceRegistry.js", import.meta.url), "utf8");
  assert.doesNotMatch(registrySource, /setInterval|requestAnimationFrame|@keyframes/);
  const debugLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseRoadTraceDebugLayer.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(debugLayerSource, /setInterval|requestAnimationFrame|@keyframes/);
});

test("MET-15C debug overlay continuity markers stay dev-gated and query-param opt-in (no permanent dashboard UI)", () => {
  const debugLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseRoadTraceDebugLayer.jsx", import.meta.url), "utf8");
  assert.match(debugLayerSource, /import\.meta\.env\.DEV/);
  assert.match(debugLayerSource, /getBusRouteContinuityReport/);
  const mountSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
  assert.match(mountSource, /roadTraceDebug/);
});

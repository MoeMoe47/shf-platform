// MET-16C — Dev-Only All-Routes Live Preview tests.
// Pure model functions in metaverseTrafficCorridorRuntime.js are executed
// directly (same convention as tests/metaverseTrafficCorridor.test.mjs).
// The hook and components are React/JSX, so they get static source-text
// assertions (this repo's established frontend convention).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import trafficRouteData from "../src/system/metaverse/traffic/metaverseTrafficRoutes.json" with { type: "json" };
import {
  ALL_ROUTES_REVIEW_MAX_START_DELAY_SECONDS,
  ALL_ROUTES_REVIEW_SKIP_REASONS,
  ALL_ROUTES_REVIEW_START_DELAY_STEP_SECONDS,
  ALL_ROUTES_REVIEW_VEHICLE_COUNT_PER_ROUTE,
  advanceRouteFleetVehicles,
  resolveAllRoutesReviewEligibility,
  resolveRouteStartDelaySeconds,
  resolveTrafficAllRoutesReviewEnabled,
} from "../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js";

const hookSource = readFileSync(new URL("../src/hooks/metaverse/useMetaverseTrafficAllRoutesReview.js", import.meta.url), "utf8");
const layerSource = readFileSync(new URL("../src/components/metaverse/traffic/MetaverseTrafficAllRoutesReviewLayer.jsx", import.meta.url), "utf8");
const markerSource = readFileSync(new URL("../src/components/metaverse/traffic/TrafficVehicleMarker.jsx", import.meta.url), "utf8");
const corridorLayerSource = readFileSync(new URL("../src/components/metaverse/traffic/MetaverseTrafficCorridorLayer.jsx", import.meta.url), "utf8");
const livingCityLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");

test("MET-16C review gate requires dev build AND explicit ?trafficAllRoutesReview=1, independent of the other two traffic flags", () => {
  assert.equal(resolveTrafficAllRoutesReviewEnabled({ isDev: false, search: "?trafficAllRoutesReview=1" }), false);
  assert.equal(resolveTrafficAllRoutesReviewEnabled({ isDev: true, search: "" }), false);
  assert.equal(resolveTrafficAllRoutesReviewEnabled({ isDev: true, search: "?trafficAuthor=1" }), false);
  assert.equal(resolveTrafficAllRoutesReviewEnabled({ isDev: true, search: "?trafficCorridorReview=1" }), false);
  assert.equal(resolveTrafficAllRoutesReviewEnabled({ isDev: true, search: "?trafficAllRoutesReview=1" }), true);
  assert.equal(resolveTrafficAllRoutesReviewEnabled({ isDev: true, search: "?trafficAllRoutesReview" }), true);
  assert.equal(resolveTrafficAllRoutesReviewEnabled({ isDev: true, search: "?trafficAllRoutesReview=0" }), false);
});

test("MET-16C selects every real APPROVED CAR-eligible route from the owner's actual authored data, and reports the rest as skipped with a reason", () => {
  const { selected, skipped } = resolveAllRoutesReviewEligibility(trafficRouteData.routes);
  assert.ok(selected.length >= 2, "the owner's data has at least 2 APPROVED CAR routes (Route 1, Route 3)");
  for (const route of selected) {
    assert.equal(route.status, "APPROVED");
    assert.ok(route.vehicle_classes.includes("CAR"));
  }
  const total = trafficRouteData.routes.length;
  assert.equal(selected.length + skipped.length, total, "every route must be either selected or explicitly skipped, never silently dropped");
  for (const entry of skipped) {
    assert.ok(Object.values(ALL_ROUTES_REVIEW_SKIP_REASONS).includes(entry.reason), `unexpected skip reason: ${entry.reason}`);
    assert.ok(entry.id, "a skipped entry must still identify which route it was");
  }
  // The owner's 3 SMALL_TRUCK-only routes must be skipped for NO_CAR_CLASS specifically.
  const truckSkips = skipped.filter((entry) => entry.reason === ALL_ROUTES_REVIEW_SKIP_REASONS.NO_CAR_CLASS);
  assert.ok(truckSkips.length >= 3);
});

test("MET-16C never selects a DRAFT/CALIBRATED route or a route with fewer than 2 points, with the correct skip reason each time", () => {
  const routes = [
    { id: "r-draft", name: "Draft", status: "DRAFT", vehicle_classes: ["CAR"], points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    { id: "r-truck", name: "Truck", status: "APPROVED", vehicle_classes: ["SMALL_TRUCK"], points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    { id: "r-short", name: "Short", status: "APPROVED", vehicle_classes: ["CAR"], points: [{ x: 0, y: 0 }] },
    { id: "r-good", name: "Good", status: "APPROVED", vehicle_classes: ["CAR"], points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
  ];
  const { selected, skipped } = resolveAllRoutesReviewEligibility(routes);
  assert.deepEqual(selected.map((r) => r.id), ["r-good"]);
  assert.deepEqual(
    skipped.map((s) => [s.id, s.reason]),
    [
      ["r-draft", ALL_ROUTES_REVIEW_SKIP_REASONS.NOT_APPROVED],
      ["r-truck", ALL_ROUTES_REVIEW_SKIP_REASONS.NO_CAR_CLASS],
      ["r-short", ALL_ROUTES_REVIEW_SKIP_REASONS.INSUFFICIENT_POINTS],
    ],
  );
});

test("MET-16C per-route start delay is deterministic, increases by route index, and is bounded", () => {
  assert.equal(resolveRouteStartDelaySeconds(0), 0);
  assert.equal(resolveRouteStartDelaySeconds(1), ALL_ROUTES_REVIEW_START_DELAY_STEP_SECONDS);
  assert.equal(resolveRouteStartDelaySeconds(2), ALL_ROUTES_REVIEW_START_DELAY_STEP_SECONDS * 2);
  assert.equal(resolveRouteStartDelaySeconds(100), ALL_ROUTES_REVIEW_MAX_START_DELAY_SECONDS);
  assert.equal(resolveRouteStartDelaySeconds(0), resolveRouteStartDelaySeconds(0), "must be deterministic across repeated calls");
});

function straightRoute(id, speedClass = "BOULEVARD") {
  return { id, name: id, status: "APPROVED", vehicle_classes: ["CAR"], speed_class: speedClass, points: [{ x: 0, y: 50 }, { x: 100, y: 50 }], perspective: [], occlusion_segments: [] };
}

test("MET-16C fleet engine renders nothing for a route before its start delay has elapsed, then renders it after", () => {
  const routes = [straightRoute("route-a"), straightRoute("route-b")];
  const vehicleStates = new Map();
  const previousHeadings = new Map();
  const routeElapsed = new Map();

  // route-b's delay is 1.4s (index 1); a single 0.5s tick must render
  // route-a's vehicles only.
  const firstTick = advanceRouteFleetVehicles({ routes, dtSeconds: 0.5, vehicleStates, previousHeadings, routeElapsed });
  const routeIdsInFirstTick = new Set(firstTick.map((v) => v.routeId));
  assert.ok(routeIdsInFirstTick.has("route-a"));
  assert.ok(!routeIdsInFirstTick.has("route-b"), "route-b must not spawn before its stagger delay elapses");

  // Advance past route-b's 1.4s delay.
  const secondTick = advanceRouteFleetVehicles({ routes, dtSeconds: 1.5, vehicleStates, previousHeadings, routeElapsed });
  const routeIdsInSecondTick = new Set(secondTick.map((v) => v.routeId));
  assert.ok(routeIdsInSecondTick.has("route-a"));
  assert.ok(routeIdsInSecondTick.has("route-b"), "route-b must spawn once its stagger delay has elapsed");
});

test("MET-16C fleet engine never produces duplicate vehicle keys across multiple simultaneous routes, and every vehicle appears at least once over a full cycle", () => {
  const routes = [straightRoute("route-a"), straightRoute("route-b"), straightRoute("route-c")];
  const vehicleStates = new Map();
  const previousHeadings = new Map();
  const routeElapsed = new Map();
  const seenKeys = new Set();
  // Simulate ~6 seconds of realistic small frame steps (past every route's
  // stagger delay and past any single vehicle's brief respawn pause) so no
  // one-off large dt can coincidentally land every vehicle mid-respawn at
  // the moment we sample, the way a single huge dt jump would.
  for (let i = 0; i < 120; i += 1) {
    const rendered = advanceRouteFleetVehicles({ routes, dtSeconds: 0.05, vehicleStates, previousHeadings, routeElapsed });
    const keys = rendered.map((v) => v.key);
    assert.equal(new Set(keys).size, keys.length, `no two rendered vehicles may share a key (frame ${i})`);
    keys.forEach((key) => seenKeys.add(key));
  }
  assert.equal(seenKeys.size, routes.length * ALL_ROUTES_REVIEW_VEHICLE_COUNT_PER_ROUTE, "every vehicle on every route must be observed visible at some point");
});

test("MET-16C fleet engine keeps each vehicle on its own route's geometry (never crosses to another route's line)", () => {
  const routeNorth = { id: "route-north", name: "North", status: "APPROVED", vehicle_classes: ["CAR"], speed_class: "BOULEVARD", points: [{ x: 0, y: 10 }, { x: 100, y: 10 }], perspective: [], occlusion_segments: [] };
  const routeSouth = { id: "route-south", name: "South", status: "APPROVED", vehicle_classes: ["CAR"], speed_class: "BOULEVARD", points: [{ x: 0, y: 90 }, { x: 100, y: 90 }], perspective: [], occlusion_segments: [] };
  const vehicleStates = new Map();
  const previousHeadings = new Map();
  const routeElapsed = new Map();
  advanceRouteFleetVehicles({ routes: [routeNorth, routeSouth], dtSeconds: 10, vehicleStates, previousHeadings, routeElapsed });
  const rendered = advanceRouteFleetVehicles({ routes: [routeNorth, routeSouth], dtSeconds: 0.1, vehicleStates, previousHeadings, routeElapsed });
  for (const vehicle of rendered) {
    if (vehicle.routeId === "route-north") assert.ok(Math.abs(vehicle.y - 10) < 1, `north-route vehicle drifted to y=${vehicle.y}`);
    if (vehicle.routeId === "route-south") assert.ok(Math.abs(vehicle.y - 90) < 1, `south-route vehicle drifted to y=${vehicle.y}`);
  }
});

test("MET-16C hook drives a single shared rAF loop for every route, never one loop per route, and reuses the shared fleet engine", () => {
  assert.match(hookSource, /requestAnimationFrame/);
  assert.doesNotMatch(hookSource, /setInterval/);
  assert.match(hookSource, /advanceRouteFleetVehicles/);
  // Only one requestAnimationFrame scheduling site should exist in the
  // active (non-reduced-motion) loop — i.e. no per-route loop nesting.
  const rafCallSites = hookSource.match(/requestAnimationFrame\(/g) || [];
  assert.ok(rafCallSites.length <= 2, "expected at most the initial kick-off + the in-loop reschedule call, never a per-route loop");
});

test("MET-16C hook never randomizes vehicle placement or duplicates the corridor's authoring dependency", () => {
  assert.doesNotMatch(hookSource, /Math\.random/);
  assert.doesNotMatch(hookSource, /from\s+["'][^"']*useMetaverseTrafficAuthoring/);
  assert.doesNotMatch(hookSource, /resolveTrafficAuthoringEnabled\(/);
});

test("MET-16C hook respects prefers-reduced-motion by rendering once, statically, not merely slowing down", () => {
  assert.match(hookSource, /reducedMotion/);
  assert.match(hookSource, /if \(reducedMotion\)/);
});

test("MET-16C layer reuses the exact same TrafficVehicleMarker as the single corridor — one rendering engine, not two", () => {
  assert.match(layerSource, /TrafficVehicleMarker/);
  assert.match(corridorLayerSource, /TrafficVehicleMarker/);
  assert.match(layerSource, /from ["']\.\/TrafficVehicleMarker\.jsx["']/);
  assert.match(corridorLayerSource, /from ["']\.\/TrafficVehicleMarker\.jsx["']/);
});

test("MET-16C layer renders only vehicles and its own dev-only badge, never authoring markers", () => {
  assert.doesNotMatch(layerSource, /<RouteArrow|HANDLE_COLOR|onDragHandle|onSelectHandle/);
  assert.doesNotMatch(layerSource, /from\s+["'][^"']*traffic-authoring/);
  assert.match(layerSource, /ALL ROUTES TRAFFIC REVIEW/);
});

test("MET-16C badge text and dev-only marker only exist inside the enabled-gated branch (component returns null when disabled)", () => {
  assert.match(layerSource, /if \(!enabled\) return null;/);
  assert.match(layerSource, /data-dev-only="true"/);
});

test("MET-16C is wired as its own gated layer in the always-on living-city composition, independent of the corridor gate", () => {
  assert.match(livingCityLayerSource, /MetaverseTrafficAllRoutesReviewLayer/);
  assert.match(livingCityLayerSource, /isTrafficAllRoutesReviewEnabled/);
  assert.match(livingCityLayerSource, /useMetaverseTrafficAllRoutesReview/);
  assert.match(livingCityLayerSource, /data-traffic="RETIRED_FROM_PRODUCTION"/, "the historical retired-system marker must remain untouched");
});

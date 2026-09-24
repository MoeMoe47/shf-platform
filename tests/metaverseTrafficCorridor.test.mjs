// MET-16B — First Live Traffic Corridor tests.
// Pure model functions in metaverseTrafficCorridorRuntime.js are executed
// directly (same convention as tests/metaverseTrafficLivePreview.test.mjs).
// The hook and component are React/JSX, so — following this repo's
// established frontend convention (see tests/metaverseStudentEnterprise.test.mjs)
// — they get static source-text assertions instead of a rendered-component
// harness.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import trafficRouteData from "../src/system/metaverse/traffic/metaverseTrafficRoutes.json" with { type: "json" };
import {
  resolveDeterministicSpeedVariance,
  resolveTrafficCorridorLightTreatment,
  resolveTrafficCorridorProgressPerSecond,
  resolveTrafficCorridorReviewEnabled,
  resolveTrafficCorridorScale,
  resolveTrafficCorridorVehicleAppearance,
  resolveTrafficCorridorVehicleCount,
  selectTrafficCorridorRoute,
  TRAFFIC_CORRIDOR_MAX_VEHICLE_COUNT,
  TRAFFIC_CORRIDOR_MIN_VEHICLE_COUNT,
  TRAFFIC_CORRIDOR_ROUTE_ID,
} from "../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js";
import { createVehicleState } from "../src/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";

const hookSource = readFileSync(new URL("../src/hooks/metaverse/useMetaverseTrafficCorridor.js", import.meta.url), "utf8");
const layerSource = readFileSync(new URL("../src/components/metaverse/traffic/MetaverseTrafficCorridorLayer.jsx", import.meta.url), "utf8");
const markerSource = readFileSync(new URL("../src/components/metaverse/traffic/TrafficVehicleMarker.jsx", import.meta.url), "utf8");
const livingCityLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");

test("MET-16B review gate requires dev build AND explicit ?trafficCorridorReview=1, independent of the authoring flag", () => {
  assert.equal(resolveTrafficCorridorReviewEnabled({ isDev: false, search: "?trafficCorridorReview=1" }), false);
  assert.equal(resolveTrafficCorridorReviewEnabled({ isDev: true, search: "" }), false);
  assert.equal(resolveTrafficCorridorReviewEnabled({ isDev: true, search: "?trafficAuthor=1" }), false);
  assert.equal(resolveTrafficCorridorReviewEnabled({ isDev: true, search: "?trafficCorridorReview=1" }), true);
  assert.equal(resolveTrafficCorridorReviewEnabled({ isDev: true, search: "?trafficCorridorReview" }), true);
  assert.equal(resolveTrafficCorridorReviewEnabled({ isDev: true, search: "?trafficCorridorReview=0" }), false);
});

test("MET-16B selects exactly one real, APPROVED, CAR-class route from the owner's actual authored data", () => {
  const route = selectTrafficCorridorRoute(trafficRouteData.routes);
  assert.ok(route, "the selected corridor route must exist in the real route file");
  assert.equal(route.id, TRAFFIC_CORRIDOR_ROUTE_ID);
  assert.equal(route.status, "APPROVED");
  assert.ok(route.vehicle_classes.includes("CAR"));
  assert.ok(route.points.length >= 2);
});

test("MET-16B refuses to select a route that is not APPROVED or not CAR-eligible", () => {
  const draftCar = { id: TRAFFIC_CORRIDOR_ROUTE_ID, status: "DRAFT", vehicle_classes: ["CAR"], points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };
  assert.equal(selectTrafficCorridorRoute([draftCar]), null);
  const approvedTruck = { id: TRAFFIC_CORRIDOR_ROUTE_ID, status: "APPROVED", vehicle_classes: ["SMALL_TRUCK"], points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] };
  assert.equal(selectTrafficCorridorRoute([approvedTruck]), null);
  assert.equal(selectTrafficCorridorRoute([]), null);
  assert.equal(selectTrafficCorridorRoute(undefined), null);
});

test("MET-16B vehicle count is bounded to the 2-4 range regardless of input", () => {
  assert.equal(resolveTrafficCorridorVehicleCount(0), 3, "falsy input falls back to the phase default (3), not a clamped 0");
  assert.equal(resolveTrafficCorridorVehicleCount(1), TRAFFIC_CORRIDOR_MIN_VEHICLE_COUNT);
  assert.equal(resolveTrafficCorridorVehicleCount(3), 3);
  assert.equal(resolveTrafficCorridorVehicleCount(9), TRAFFIC_CORRIDOR_MAX_VEHICLE_COUNT);
  assert.equal(resolveTrafficCorridorVehicleCount(undefined), 3);
});

test("MET-16B per-vehicle speed variance is deterministic, bounded to +/-10%, and never zero-effort random", () => {
  const first = [0, 1, 2, 3].map((slot) => resolveDeterministicSpeedVariance(slot));
  const second = [0, 1, 2, 3].map((slot) => resolveDeterministicSpeedVariance(slot));
  assert.deepEqual(first, second, "variance must be the same across repeated calls (never Math.random)");
  for (const variance of first) {
    assert.ok(variance >= -0.1 && variance <= 0.1, `variance ${variance} out of +/-10% bound`);
  }
});

test("MET-16B speed rate stays within a sane bounded range for the route's declared speed class", () => {
  const rate = resolveTrafficCorridorProgressPerSecond("BOULEVARD", 0);
  assert.ok(rate > 0 && rate < 1, "progress-per-second must be a small positive fraction, not an instant jump");
  const rateSlot1 = resolveTrafficCorridorProgressPerSecond("BOULEVARD", 1);
  assert.notEqual(rate, rateSlot1, "different slots must get slightly different (not identical) speeds");
});

test("MET-16B perspective falls back to the y-position heuristic only when the route has no authored keys, and defers to real calibration once present", () => {
  const uncalibrated = { perspective: [] };
  const result = resolveTrafficCorridorScale(uncalibrated, { y: 96, progress: 0 });
  assert.equal(result.calibrated, false);
  assert.ok(result.scale > 0 && result.scale <= 3);

  const calibrated = { perspective: [{ t: 0, scale: 1.5 }, { t: 1, scale: 0.5 }] };
  const resultCalibrated = resolveTrafficCorridorScale(calibrated, { y: 96, progress: 0 });
  assert.equal(resultCalibrated.calibrated, true);
  assert.equal(resultCalibrated.scale, 1.5);
});

test("MET-16B farther (smaller y) sections scale smaller than nearer (larger y) sections, and scaling stays subtle (not oversized)", () => {
  const route = { perspective: [] };
  const far = resolveTrafficCorridorScale(route, { y: 10, progress: 0 });
  const near = resolveTrafficCorridorScale(route, { y: 96, progress: 1 });
  assert.ok(far.scale < near.scale, "a farther (smaller y) section must render smaller than a nearer section");
  assert.ok(near.scale <= 1.2, "vehicles must not become oversized even at the nearest calibrated point");
});

test("MET-16B vehicle appearance composes real spline position + smoothed heading + occlusion, with no ping-pong across frames", () => {
  const route = {
    points: [{ x: 0, y: 50 }, { x: 50, y: 50 }, { x: 100, y: 50 }],
    perspective: [],
    occlusion_segments: [],
  };
  let state = createVehicleState(0);
  let previousHeadingDeg;
  const progressHistory = [];
  for (let i = 0; i < 10; i += 1) {
    state = { ...state, progress: Math.min(1, state.progress + 0.08) };
    const appearance = resolveTrafficCorridorVehicleAppearance({ route, vehicleState: state, previousHeadingDeg });
    assert.ok(appearance, "appearance must resolve for a visible, in-bounds vehicle state");
    progressHistory.push(appearance.progress);
    previousHeadingDeg = appearance.headingDeg;
  }
  for (let i = 1; i < progressHistory.length; i += 1) {
    assert.ok(progressHistory[i] >= progressHistory[i - 1], "progress must never move backward (no ping-pong)");
  }
});

test("MET-16B time-of-day light treatment: no glow in DAY, glow in DUSK/NIGHT, darker body only at NIGHT, and no streak/trail fields exist", () => {
  const day = resolveTrafficCorridorLightTreatment("DAY");
  assert.equal(day.headlightGlow, false);
  assert.equal(day.taillightGlow, false);
  const dusk = resolveTrafficCorridorLightTreatment("DUSK");
  assert.equal(dusk.headlightGlow, true);
  assert.equal(dusk.taillightGlow, true);
  assert.equal(dusk.bodyDarken, 0);
  const night = resolveTrafficCorridorLightTreatment("NIGHT");
  assert.equal(night.headlightGlow, true);
  assert.ok(night.bodyDarken > 0);
  for (const treatment of [day, dusk, night]) {
    assert.ok(!("streak" in treatment) && !("trail" in treatment), "no light-streak/trail fields must exist");
  }
});

test("MET-16B hook drives a single shared rAF loop, never one interval per vehicle, and is gated independently of the authoring flag", () => {
  assert.match(hookSource, /requestAnimationFrame/);
  assert.doesNotMatch(hookSource, /setInterval/);
  assert.match(hookSource, /resolveTrafficCorridorReviewEnabled|trafficCorridor/);
  assert.doesNotMatch(hookSource, /from\s+["'][^"']*useMetaverseTrafficAuthoring/, "must not import the authoring hook module");
  assert.doesNotMatch(hookSource, /resolveTrafficAuthoringEnabled\(/, "must not call the authoring gate function");
});

test("MET-16B hook enforces monotonic progress via advanceVehicleState/loop, and never randomizes spacing", () => {
  assert.match(hookSource, /advanceVehicleState/);
  // MET-16C Section 15 — deliberately irregular (not evenly-split) but
  // still fully deterministic starting offsets for the reference corridor.
  assert.match(hookSource, /TRAFFIC_CORRIDOR_REVIEW_START_OFFSETS/);
  assert.doesNotMatch(hookSource, /Math\.random/);
});

test("MET-16B hook respects prefers-reduced-motion by pausing/static rendering, not merely slowing down", () => {
  assert.match(hookSource, /reducedMotion/);
  assert.match(hookSource, /if \(reducedMotion\)/);
  assert.doesNotMatch(hookSource, /reducedMotion \? .*requestAnimationFrame/s);
});

test("MET-16B production layer renders only moving vehicles, never authoring markers (route lines, handles, arrows, ovals)", () => {
  assert.doesNotMatch(layerSource, /<RouteArrow|HANDLE_COLOR|onDragHandle|onSelectHandle/);
  assert.doesNotMatch(layerSource, /from\s+["'][^"']*traffic-authoring/, "must not import anything from the authoring component directory");
  assert.match(layerSource, /TrafficVehicleMarker/);
});

test("MET-16B production layer never uses CSS keyframe/streak trails for headlights, only a static glow circle", () => {
  assert.doesNotMatch(layerSource, /@keyframes|animation:/);
  assert.doesNotMatch(markerSource, /@keyframes|animation:/);
  assert.match(markerSource, /circle/);
});

test("MET-16B corridor is mounted inside the always-on living-city layer, gated by its own review flag, separate from the two debug layers", () => {
  assert.match(livingCityLayerSource, /MetaverseTrafficCorridorLayer/);
  assert.match(livingCityLayerSource, /isTrafficCorridorReviewEnabled/);
  assert.match(livingCityLayerSource, /data-traffic="RETIRED_FROM_PRODUCTION"/, "the historical retired-system marker for the old road-trace vehicle layer must remain untouched");
});

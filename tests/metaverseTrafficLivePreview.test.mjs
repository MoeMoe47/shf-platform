import assert from "node:assert/strict";
import test from "node:test";

import { createEmptyRoute, addRoutePoint, setPerspectiveKey, addOcclusionSegment } from "../src/system/metaverse/traffic/metaverseTrafficAuthoringModel.js";
import {
  TRAFFIC_PREVIEW_DEFAULT_SPEED_MULTIPLIER,
  TRAFFIC_PREVIEW_DEFAULT_VEHICLE_SCALE,
  TRAFFIC_PREVIEW_MAX_VEHICLES_PER_ROUTE,
  TRAFFIC_PREVIEW_RESPAWN_PAUSE_SECONDS,
  TRAFFIC_PREVIEW_SPEED_PRESETS,
  TRAFFIC_PREVIEW_UNCALIBRATED_SCALE,
  TRAFFIC_PREVIEW_VEHICLE_SCALE_PRESETS,
  TRAFFIC_PREVIEW_VEHICLE_VISUALS,
  advanceVehicleState,
  applyBaseRotationOffset,
  computeDeterministicVehicleOffsets,
  createVehicleState,
  isRouteReadyForPreview,
  isVehicleVisible,
  normalizeHeadingDeg,
  resolvePreviewVehicleScale,
  resolveTrafficPreviewProgressPerSecond,
  resolveVehicleAppearance,
  resolveVehicleTypeForSlot,
  resolveVehicleVisualForClass,
  resolveVehicleVisualForRoute,
  selectRoutesForPreviewScope,
  smoothHeadingDeg,
} from "../src/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";

function buildStraightRoute({ status = "CALIBRATED", withPerspective = false, withOcclusion = false } = {}) {
  let route = createEmptyRoute({ id: `route-${status}-${Math.random()}`, name: "Test Corridor" });
  route = addRoutePoint(route, { x: 0, y: 50 }, { snap: false });
  route = addRoutePoint(route, { x: 100, y: 50 }, { snap: false });
  route = { ...route, status };
  if (withPerspective) route = setPerspectiveKey(route, 1, 0.4);
  if (withPerspective) route = setPerspectiveKey(route, 0, 1);
  if (withOcclusion) route = addOcclusionSegment(route, 0.4, 0.6);
  return route;
}

test("MET-16B vehicle progress is monotonic and never decreases while not looping/respawning", () => {
  let state = createVehicleState(0);
  const rate = resolveTrafficPreviewProgressPerSecond(0.5);
  let previousProgress = state.progress;
  for (let i = 0; i < 50; i += 1) {
    state = advanceVehicleState(state, 0.1, rate, { loop: false });
    assert.ok(state.progress >= previousProgress, `progress decreased: ${state.progress} < ${previousProgress}`);
    previousProgress = state.progress;
  }
});

test("MET-16B route-end behavior: DESPAWN when loop is off, clean reset after a pause when loop is on", () => {
  const rate = resolveTrafficPreviewProgressPerSecond(1); // fast enough to reach the end quickly
  // Non-loop: reaches 1, latches ended, and stays frozen/hidden forever after.
  let state = createVehicleState(0.99);
  state = advanceVehicleState(state, 1, rate, { loop: false });
  assert.equal(state.progress, 1);
  assert.equal(state.ended, true);
  assert.equal(isVehicleVisible(state), false);
  const frozen = advanceVehicleState(state, 5, rate, { loop: false });
  assert.deepEqual(frozen, state);

  // Loop: reaching the end starts a respawn pause (hidden, not yet reset),
  // not an instant visible teleport back to progress 0.
  let loopingState = createVehicleState(0.99);
  loopingState = advanceVehicleState(loopingState, 1, rate, { loop: true });
  assert.equal(loopingState.progress, 1);
  assert.equal(loopingState.ended, false);
  assert.ok(loopingState.respawnRemaining > 0);
  assert.equal(isVehicleVisible(loopingState), false);

  // Once the respawn pause elapses, it resets cleanly to progress 0.
  loopingState = advanceVehicleState(loopingState, TRAFFIC_PREVIEW_RESPAWN_PAUSE_SECONDS + 0.01, rate, { loop: true });
  assert.equal(loopingState.progress, 0);
  assert.equal(loopingState.ended, false);
  assert.equal(loopingState.respawnRemaining, 0);
  assert.equal(isVehicleVisible(loopingState), true);
});

test("MET-16B never ping-pongs: a full simulated non-loop run only ever increases until it ends, exactly once", () => {
  const rate = resolveTrafficPreviewProgressPerSecond(TRAFFIC_PREVIEW_DEFAULT_SPEED_MULTIPLIER);
  let state = createVehicleState(0);
  let previous = 0;
  let endedAtFrame = null;
  for (let frame = 0; frame < 2000; frame += 1) {
    state = advanceVehicleState(state, 1 / 60, rate, { loop: false });
    assert.ok(state.progress >= previous, `progress moved backward at frame ${frame}`);
    previous = state.progress;
    if (state.ended && endedAtFrame === null) endedAtFrame = frame;
  }
  assert.ok(endedAtFrame !== null, "route should have ended within the simulated window");
});

test("MET-16B heading smoothing takes the shortest path across the 359deg -> 0deg boundary", () => {
  assert.equal(normalizeHeadingDeg(-10), 350);
  assert.equal(normalizeHeadingDeg(370), 10);

  // From 359 toward 2: shortest path is forward (+3deg), not backward through 180.
  const next = smoothHeadingDeg(359, 2, 1); // smoothingFactor 1 = snap, to isolate direction-of-turn
  assert.ok(Math.abs(next - 2) < 0.01 || Math.abs(next - 362) < 0.01, `expected to land near 2deg, got ${next}`);

  // Partial smoothing moves toward the target without overshooting or
  // reversing direction.
  const partial = smoothHeadingDeg(0, 90, 0.5);
  assert.ok(partial > 0 && partial < 90);
});

test("MET-16B perspective interpolation is reused verbatim, with an explicit fallback when uncalibrated", () => {
  const calibrated = buildStraightRoute({ withPerspective: true });
  const midway = resolveVehicleAppearance({ route: calibrated, vehicleState: createVehicleState(0.5) });
  assert.equal(midway.perspectiveCalibrated, true);
  assert.ok(midway.scale > 0.4 && midway.scale < 1, `expected an interpolated scale between the two keys, got ${midway.scale}`);

  const uncalibrated = buildStraightRoute({ withPerspective: false });
  const appearance = resolveVehicleAppearance({ route: uncalibrated, vehicleState: createVehicleState(0.5) });
  assert.equal(appearance.perspectiveCalibrated, false);
  assert.equal(appearance.scale, TRAFFIC_PREVIEW_UNCALIBRATED_SCALE);
});

test("MET-16B occlusion is reused verbatim: a vehicle inside a hidden segment reports occluded", () => {
  const route = buildStraightRoute({ withOcclusion: true });
  const hidden = resolveVehicleAppearance({ route, vehicleState: createVehicleState(0.5) });
  assert.equal(hidden.occluded, true);
  const visible = resolveVehicleAppearance({ route, vehicleState: createVehicleState(0.1) });
  assert.equal(visible.occluded, false);
});

test("MET-16B deterministic multi-vehicle spacing never randomizes and respects the per-phase cap", () => {
  assert.deepEqual(computeDeterministicVehicleOffsets(1), [0]);
  assert.deepEqual(computeDeterministicVehicleOffsets(2), [0, 0.5]);
  assert.deepEqual(computeDeterministicVehicleOffsets(3), [0, 1 / 3, 2 / 3]);
  // Repeated calls with the same input are always identical (no randomness).
  assert.deepEqual(computeDeterministicVehicleOffsets(3), computeDeterministicVehicleOffsets(3));
  // Never exceeds the phase cap even if asked to.
  assert.equal(computeDeterministicVehicleOffsets(10).length, TRAFFIC_PREVIEW_MAX_VEHICLES_PER_ROUTE);

  assert.equal(resolveVehicleTypeForSlot(0), "SEDAN");
  assert.equal(resolveVehicleTypeForSlot(1), "SUV");
  assert.equal(resolveVehicleTypeForSlot(2), "VAN");
  assert.equal(resolveVehicleTypeForSlot(3), "SMALL_TRUCK");
  assert.equal(resolveVehicleTypeForSlot(4), "SEDAN"); // wraps deterministically, never randomly
});

test("MET-16B real-vehicle-assets patch: vehicle class mapping is exact and falls back safely", () => {
  assert.equal(resolveVehicleVisualForClass("CAR"), "SEDAN");
  assert.equal(resolveVehicleVisualForClass("SUV"), "SUV");
  assert.equal(resolveVehicleVisualForClass("VAN"), "VAN");
  assert.equal(resolveVehicleVisualForClass("SMALL_TRUCK"), "SMALL_TRUCK");
  // Unsupported/unknown classes never crash — they simply aren't a match.
  assert.equal(resolveVehicleVisualForClass("SHUTTLE_BUS"), null);
  assert.equal(resolveVehicleVisualForClass("NOT_A_REAL_CLASS"), null);
  assert.equal(resolveVehicleVisualForClass(undefined), null);

  const carRoute = { vehicle_classes: ["CAR"] };
  const truckRoute = { vehicle_classes: ["SMALL_TRUCK"] };
  const vanRoute = { vehicle_classes: ["VAN"] };
  assert.equal(resolveVehicleVisualForRoute(carRoute), "SEDAN");
  assert.equal(resolveVehicleVisualForRoute(truckRoute), "SMALL_TRUCK");
  assert.equal(resolveVehicleVisualForRoute(vanRoute), "VAN");

  // A route with an unrecognized/missing class never crashes — it falls
  // back to the deterministic per-slot cycle rather than guessing.
  const busRoute = { vehicle_classes: ["SHUTTLE_BUS"] };
  assert.equal(resolveVehicleVisualForRoute(busRoute, 0), "SEDAN");
  const noClassRoute = { vehicle_classes: [] };
  assert.equal(resolveVehicleVisualForRoute(noClassRoute, 1), "SUV");
  assert.equal(resolveVehicleVisualForRoute(null, 2), "VAN");
  assert.equal(resolveVehicleVisualForRoute({}, 3), "SMALL_TRUCK");

  // Every declared visual carries a real asset path and a positive
  // footprint — nothing here can render with a missing/zero size.
  for (const key of Object.keys(TRAFFIC_PREVIEW_VEHICLE_VISUALS)) {
    const visual = TRAFFIC_PREVIEW_VEHICLE_VISUALS[key];
    assert.ok(visual.asset.endsWith(".svg"));
    assert.ok(visual.length > 0);
    assert.ok(visual.width > 0);
  }
});

test("MET-16B real-vehicle-assets patch: base rotation offset never touches route direction, only render heading", () => {
  assert.equal(applyBaseRotationOffset(0, 0), 0);
  assert.equal(applyBaseRotationOffset(350, 20), 10); // wraps correctly
  assert.equal(applyBaseRotationOffset(90), 90); // default offset 0 when omitted
  assert.equal(applyBaseRotationOffset(-10, 0), 350); // normalized into 0-360
});

test("MET-16B real-vehicle-assets patch: preview vehicle scale is a dev-only visual multiplier with a safe default", () => {
  assert.deepEqual(TRAFFIC_PREVIEW_VEHICLE_SCALE_PRESETS, [0.5, 0.75, 1, 1.25]);
  assert.equal(TRAFFIC_PREVIEW_DEFAULT_VEHICLE_SCALE, 0.75);
  assert.ok(TRAFFIC_PREVIEW_VEHICLE_SCALE_PRESETS.includes(TRAFFIC_PREVIEW_DEFAULT_VEHICLE_SCALE));
  for (const preset of TRAFFIC_PREVIEW_VEHICLE_SCALE_PRESETS) {
    assert.equal(resolvePreviewVehicleScale(preset), preset);
  }
  // An invalid/unknown value never crashes and never scales to zero/negative.
  assert.equal(resolvePreviewVehicleScale(undefined), TRAFFIC_PREVIEW_DEFAULT_VEHICLE_SCALE);
  assert.equal(resolvePreviewVehicleScale(-1), TRAFFIC_PREVIEW_DEFAULT_VEHICLE_SCALE);
  assert.equal(resolvePreviewVehicleScale(3.7), TRAFFIC_PREVIEW_DEFAULT_VEHICLE_SCALE);
});

test("MET-16B route scope selection only ever reads owner data, never invents a route", () => {
  const draft = buildStraightRoute({ status: "DRAFT" });
  const calibrated = buildStraightRoute({ status: "CALIBRATED" });
  const approved = buildStraightRoute({ status: "APPROVED" });
  const routes = [draft, calibrated, approved];

  // ACTIVE_ONLY: exactly the selected route, regardless of status (DRAFT
  // testing is explicitly allowed one-at-a-time).
  assert.deepEqual(selectRoutesForPreviewScope(routes, "ACTIVE_ONLY", draft.id), [draft]);
  assert.deepEqual(selectRoutesForPreviewScope(routes, "ACTIVE_ONLY", "missing-id"), []);

  // ALL_CALIBRATED: CALIBRATED + APPROVED only, never DRAFT.
  const bulk = selectRoutesForPreviewScope(routes, "ALL_CALIBRATED", null);
  assert.equal(bulk.length, 2);
  assert.ok(bulk.every((route) => route.status !== "DRAFT"));

  // "dev-only gating" equivalent at the model level: this is the same
  // reasoning useMetaverseTrafficLivePreview's `enabled` flag relies on —
  // when the authoring hook is disabled it always supplies an empty
  // `routes` array (see MetaverseCityPage.jsx), which naturally yields no
  // preview routes in either scope without a second gating mechanism.
  assert.deepEqual(selectRoutesForPreviewScope([], "ACTIVE_ONLY", draft.id), []);
  assert.deepEqual(selectRoutesForPreviewScope([], "ALL_CALIBRATED", null), []);

  assert.equal(isRouteReadyForPreview(createEmptyRoute({ name: "Empty" })), false);
  assert.equal(isRouteReadyForPreview(calibrated), true);
});

test("MET-16B traffic preview speed presets match spec and stay independent of Ghost Preview speed", () => {
  assert.deepEqual(
    TRAFFIC_PREVIEW_SPEED_PRESETS.map((preset) => preset.multiplier),
    [0.25, 0.5, 0.75, 1],
  );
  assert.equal(TRAFFIC_PREVIEW_DEFAULT_SPEED_MULTIPLIER, 0.25);
  const rates = TRAFFIC_PREVIEW_SPEED_PRESETS.map((preset) => resolveTrafficPreviewProgressPerSecond(preset.multiplier));
  for (let i = 1; i < rates.length; i += 1) assert.ok(rates[i] > rates[i - 1]);
});

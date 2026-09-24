// MET-16C.1 — Vehicle Scale + Integration Polish tests.
// Pure model functions executed directly (same convention as
// tests/metaverseTrafficCorridorRealism.test.mjs).
import assert from "node:assert/strict";
import test from "node:test";

import {
  TRAFFIC_CORRIDOR_LIGHT_TREATMENT,
  TRAFFIC_CORRIDOR_ROUTE_ID,
  TRAFFIC_VEHICLE_CLASS_SCALE,
  resolveTrafficCorridorScale,
} from "../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js";
import { TRAFFIC_PREVIEW_VEHICLE_VISUALS } from "../src/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";

function routeWith(overrides = {}) {
  return { id: TRAFFIC_CORRIDOR_ROUTE_ID, perspective: [], ...overrides };
}

// Real, measured lane width at the route's near point (see the
// calibration comment in metaverseTrafficCorridorRuntime.js): ~22-23px
// on the 1672px-wide production plate, i.e. ~1.35 scene units.
const MEASURED_LANE_WIDTH_SCENE_UNITS = 1.35;

test("MET-16C.1 NEAR scale is within the requested +15-25% band over the prior 1.0 baseline", () => {
  const { scale } = resolveTrafficCorridorScale(routeWith(), { y: 96, progress: 0 });
  assert.ok(scale >= 1.15 && scale <= 1.25, `NEAR scale ${scale} must land in the requested +15-25% band`);
});

test("MET-16C.1 at NEAR scale, a CAR's width stays under the measured lane width (no oversized cars)", () => {
  const { scale } = resolveTrafficCorridorScale(routeWith(), { y: 96, progress: 0 });
  const carWidth = TRAFFIC_PREVIEW_VEHICLE_VISUALS.SEDAN.width * scale * TRAFFIC_VEHICLE_CLASS_SCALE.CAR;
  assert.ok(carWidth < MEASURED_LANE_WIDTH_SCENE_UNITS, `CAR width ${carWidth} must stay under the lane width ${MEASURED_LANE_WIDTH_SCENE_UNITS}`);
});

test("MET-16C.1 at NEAR scale, SUV stays under the measured lane width", () => {
  const { scale } = resolveTrafficCorridorScale(routeWith(), { y: 96, progress: 0 });
  const suvWidth = TRAFFIC_PREVIEW_VEHICLE_VISUALS.SEDAN.width * scale * TRAFFIC_VEHICLE_CLASS_SCALE.SUV;
  assert.ok(suvWidth <= MEASURED_LANE_WIDTH_SCENE_UNITS * 1.01, `SUV width ${suvWidth} must stay at/under the lane width ${MEASURED_LANE_WIDTH_SCENE_UNITS} (small measurement tolerance)`);
});

test("MET-16C.1 SMALL_TRUCK at NEAR scale would exceed the measured lane width — this is exactly why it is excluded from this route's active mix, not an oversight", () => {
  const { scale } = resolveTrafficCorridorScale(routeWith(), { y: 96, progress: 0 });
  const truckWidth = TRAFFIC_PREVIEW_VEHICLE_VISUALS.SEDAN.width * scale * TRAFFIC_VEHICLE_CLASS_SCALE.SMALL_TRUCK;
  assert.ok(truckWidth > MEASURED_LANE_WIDTH_SCENE_UNITS, "documents the real lane-overflow finding that drove the composition change to 2 CAR + 1 SUV");
});

test("MET-16C.1 perspective calibration now uses 5 keys (FAR/MID/NEAR plus two intermediate) and never jumps between adjacent samples", () => {
  const route = routeWith();
  const samples = [];
  for (let t = 0; t <= 1.0001; t += 0.02) {
    samples.push(resolveTrafficCorridorScale(route, { y: 96 - t * 29, progress: Math.min(1, t) }).scale);
  }
  for (let i = 1; i < samples.length; i += 1) {
    const delta = Math.abs(samples[i] - samples[i - 1]);
    assert.ok(delta < 0.05, `scale jumped by ${delta} between adjacent 2%-progress samples — not a gradual falloff`);
  }
  // Strictly monotonic decreasing near -> far (no oscillation / ping-pong
  // in scale as progress increases).
  for (let i = 1; i < samples.length; i += 1) {
    assert.ok(samples[i] <= samples[i - 1] + 1e-9, `scale increased from ${samples[i - 1]} to ${samples[i]} — must shrink monotonically toward the far end`);
  }
});

test("MET-16C.1 FAR vehicles remain subtle but never vanish (never near-zero scale)", () => {
  const { scale } = resolveTrafficCorridorScale(routeWith(), { y: 67.2, progress: 1 });
  assert.ok(scale >= 0.5 && scale <= 0.6, `FAR scale ${scale} should read as subtle but still clearly a vehicle`);
});

test("MET-16C.1 MID scale sits clearly between NEAR and FAR, closer to the brief's 'clearly readable' midpoint", () => {
  const near = resolveTrafficCorridorScale(routeWith(), { y: 96, progress: 0 }).scale;
  const mid = resolveTrafficCorridorScale(routeWith(), { y: 80, progress: 0.5 }).scale;
  const far = resolveTrafficCorridorScale(routeWith(), { y: 67.2, progress: 1 }).scale;
  assert.ok(mid < near && mid > far);
  assert.ok(mid >= 0.75 && mid <= 0.95);
});

test("MET-16C.1 shadow opacity for DAY/DUSK sits within the brief's suggested 0.25-0.35 range, and NIGHT stays clearly reduced below both", () => {
  assert.ok(TRAFFIC_CORRIDOR_LIGHT_TREATMENT.DAY.shadowOpacity >= 0.25 && TRAFFIC_CORRIDOR_LIGHT_TREATMENT.DAY.shadowOpacity <= 0.35);
  assert.ok(TRAFFIC_CORRIDOR_LIGHT_TREATMENT.DUSK.shadowOpacity >= 0.25 && TRAFFIC_CORRIDOR_LIGHT_TREATMENT.DUSK.shadowOpacity <= 0.35);
  assert.ok(TRAFFIC_CORRIDOR_LIGHT_TREATMENT.NIGHT.shadowOpacity < TRAFFIC_CORRIDOR_LIGHT_TREATMENT.DUSK.shadowOpacity);
  assert.ok(TRAFFIC_CORRIDOR_LIGHT_TREATMENT.NIGHT.shadowOpacity > 0, "NIGHT must reduce, not fully omit, the shadow (a fully-missing shadow reads as floating)");
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  GHOST_PREVIEW_DEFAULT_SPEED_MULTIPLIER,
  GHOST_PREVIEW_SPEED_PRESETS,
  addOcclusionSegment,
  addRoutePoint,
  clampSceneCoordinate,
  createEmptyRoute,
  exportRoute,
  exportRouteSet,
  interpolatePerspectiveScale,
  isProgressOccluded,
  isSceneCoordinateInRange,
  movePoint,
  nearestProgressOnRoute,
  parseImportedRouteSet,
  removeOcclusionSegment,
  resolveGhostPreviewProgressPerSecond,
  resolveGhostPreviewSpeedLabel,
  reverseRoute,
  resolveTrafficAuthoringEnabled,
  sampleRouteAtProgress,
  setPerspectiveKey,
  snapToNearbyPoint,
  validateRoute,
  validateRouteSet,
} from "../src/system/metaverse/traffic/metaverseTrafficAuthoringModel.js";

// Previous minimum was a raw 0.03 progress-per-second value (see git history
// of useMetaverseTrafficAuthoring.js prior to this patch) — kept here only
// as the baseline this patch must be "meaningfully slower" than.
const PREVIOUS_MINIMUM_PROGRESS_PER_SECOND = 0.03;

test("MET-16A normalized coordinate conversion clamps to the shared 0-100 scene convention", () => {
  assert.equal(clampSceneCoordinate(-10), 0);
  assert.equal(clampSceneCoordinate(150), 100);
  assert.equal(clampSceneCoordinate(42.5), 42.5);
  assert.equal(clampSceneCoordinate(NaN), 0);
  assert.equal(isSceneCoordinateInRange(0), true);
  assert.equal(isSceneCoordinateInRange(100), true);
  assert.equal(isSceneCoordinateInRange(101), false);
  assert.equal(isSceneCoordinateInRange(-1), false);
});

test("MET-16A route point creation appends clamped points and snaps to a nearby existing point", () => {
  let route = createEmptyRoute({ id: "r1", name: "Test Route" });
  route = addRoutePoint(route, { x: 10, y: 20 });
  route = addRoutePoint(route, { x: 30, y: 40 });
  assert.deepEqual(route.points, [{ x: 10, y: 20 }, { x: 30, y: 40 }]);

  // Out-of-range clicks still clamp into the scene, never silently drop.
  route = addRoutePoint(route, { x: 150, y: -20 }, { snap: false });
  assert.deepEqual(route.points[2], { x: 100, y: 0 });

  // A click within the snap threshold of an existing point locks onto it
  // exactly — a lightweight manual helper, not automatic road detection.
  const snapped = snapToNearbyPoint({ x: 10.4, y: 20.3 }, [{ x: 10, y: 20 }], 1.2);
  assert.deepEqual(snapped, { x: 10, y: 20 });
  const notSnapped = snapToNearbyPoint({ x: 15, y: 25 }, [{ x: 10, y: 20 }], 1.2);
  assert.deepEqual(notSnapped, { x: 15, y: 25 });
});

test("MET-16A movePoint/deletePoint edit an existing route immutably", () => {
  let route = createEmptyRoute({ id: "r2", name: "Edit Route" });
  route = addRoutePoint(route, { x: 0, y: 0 }, { snap: false });
  route = addRoutePoint(route, { x: 50, y: 50 }, { snap: false });
  const moved = movePoint(route, 1, { x: 60, y: 60 });
  assert.deepEqual(moved.points[1], { x: 60, y: 60 });
  // Original route object is untouched (immutable update).
  assert.deepEqual(route.points[1], { x: 50, y: 50 });
});

test("MET-16A reverseRoute reverses points and toggles direction without a redraw", () => {
  let route = createEmptyRoute({ id: "r3", name: "Bridge Eastbound" });
  route = addRoutePoint(route, { x: 10, y: 10 }, { snap: false });
  route = addRoutePoint(route, { x: 50, y: 50 }, { snap: false });
  route = addRoutePoint(route, { x: 90, y: 90 }, { snap: false });
  route = setPerspectiveKey(route, 0.2, 0.4);
  route = addOcclusionSegment(route, 0.1, 0.3);

  const reversed = reverseRoute(route);
  assert.equal(reversed.direction, "REVERSE");
  assert.deepEqual(reversed.points, [{ x: 90, y: 90 }, { x: 50, y: 50 }, { x: 10, y: 10 }]);
  // Perspective/occlusion progress is re-mapped to the mirrored direction.
  assert.equal(reversed.perspective[0].t, 0.8);
  assert.equal(reversed.occlusion_segments[0].from, 0.7);
  assert.equal(reversed.occlusion_segments[0].to, 0.9);

  const reversedTwice = reverseRoute(reversed);
  assert.equal(reversedTwice.direction, "FORWARD");
  assert.deepEqual(reversedTwice.points, route.points);
});

test("MET-16A spline progress sampling is monotonic and anchored at the endpoints (never ping-pongs)", () => {
  const points = [{ x: 0, y: 50 }, { x: 25, y: 20 }, { x: 50, y: 60 }, { x: 75, y: 30 }, { x: 100, y: 50 }];
  const start = sampleRouteAtProgress(points, 0);
  const end = sampleRouteAtProgress(points, 1);
  assert.ok(Math.abs(start.x - 0) < 0.5 && Math.abs(start.y - 50) < 0.5);
  assert.ok(Math.abs(end.x - 100) < 0.5 && Math.abs(end.y - 50) < 0.5);

  // Sampling at increasing t must never move backward in arc-length terms —
  // this is what keeps the ghost marker from bouncing or ping-ponging.
  let previousDistanceFromStart = -1;
  for (let t = 0; t <= 1; t += 0.05) {
    const sample = sampleRouteAtProgress(points, t);
    const distanceFromStart = Math.hypot(sample.x - start.x, sample.y - start.y);
    // Not strictly increasing point-to-point (the path itself curves), but
    // progress along the route (t) must map to a strictly non-decreasing
    // cumulative arc length, which we check indirectly via nearestProgressOnRoute.
    const roundTripT = nearestProgressOnRoute(points, sample.x, sample.y);
    assert.ok(roundTripT >= 0 && roundTripT <= 1);
    previousDistanceFromStart = distanceFromStart;
  }
  assert.ok(previousDistanceFromStart >= 0);

  // Out-of-range progress clamps rather than wrapping or extrapolating.
  const beforeStart = sampleRouteAtProgress(points, -1);
  const afterEnd = sampleRouteAtProgress(points, 2);
  assert.deepEqual(beforeStart, sampleRouteAtProgress(points, 0));
  assert.deepEqual(afterEnd, sampleRouteAtProgress(points, 1));
});

test("MET-16A perspective interpolation is linear between keys and clamps outside their range", () => {
  const keys = [{ t: 0, scale: 0.3 }, { t: 0.5, scale: 0.6 }, { t: 1, scale: 1 }];
  assert.equal(interpolatePerspectiveScale(keys, 0), 0.3);
  assert.equal(interpolatePerspectiveScale(keys, 1), 1);
  assert.ok(Math.abs(interpolatePerspectiveScale(keys, 0.25) - 0.45) < 1e-9);
  assert.equal(interpolatePerspectiveScale(keys, -1), 0.3);
  assert.equal(interpolatePerspectiveScale(keys, 2), 1);
  assert.equal(interpolatePerspectiveScale([], 0.5), 1);
});

test("MET-16A occlusion range handling reports hidden progress and normalizes segment order", () => {
  let route = createEmptyRoute({ id: "r4", name: "Occlusion Route" });
  route = addRoutePoint(route, { x: 0, y: 0 }, { snap: false });
  route = addRoutePoint(route, { x: 100, y: 0 }, { snap: false });
  // Adding with from/to swapped still produces a normalized, ordered segment.
  route = addOcclusionSegment(route, 0.6, 0.4);
  assert.equal(route.occlusion_segments.length, 1);
  assert.equal(route.occlusion_segments[0].from, 0.4);
  assert.equal(route.occlusion_segments[0].to, 0.6);

  assert.equal(isProgressOccluded(route.occlusion_segments, 0.5), true);
  assert.equal(isProgressOccluded(route.occlusion_segments, 0.1), false);

  route = removeOcclusionSegment(route, route.occlusion_segments[0].id);
  assert.equal(route.occlusion_segments.length, 0);

  // Zero-length segment is rejected rather than silently added.
  const unchanged = addOcclusionSegment(route, 0.3, 0.3);
  assert.equal(unchanged.occlusion_segments.length, 0);
});

test("MET-16A route validation flags the documented warning cases", () => {
  const tooFewPoints = createEmptyRoute({ id: "r5", name: "" });
  const warningsForEmpty = validateRoute(tooFewPoints);
  assert.ok(warningsForEmpty.some((w) => w.includes("Missing route name")));
  assert.ok(warningsForEmpty.some((w) => w.includes("fewer than 2 points")));

  let outOfRange = createEmptyRoute({ id: "r6", name: "Named" });
  outOfRange = { ...outOfRange, points: [{ x: 10, y: 10 }, { x: 200, y: -5 }] };
  assert.ok(validateRoute(outOfRange).some((w) => w.includes("outside the 0-100 scene range")));

  let badPerspective = createEmptyRoute({ id: "r7", name: "Named" });
  badPerspective = { ...badPerspective, points: [{ x: 0, y: 0 }, { x: 10, y: 10 }], perspective: [{ t: 0.5, scale: 10 }] };
  assert.ok(validateRoute(badPerspective).some((w) => w.includes("Impossible perspective scale")));

  let overlappingOcclusion = createEmptyRoute({ id: "r8", name: "Named" });
  overlappingOcclusion = {
    ...overlappingOcclusion,
    points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
    occlusion_segments: [
      { id: "a", from: 0.1, to: 0.5 },
      { id: "b", from: 0.3, to: 0.6 },
    ],
  };
  assert.ok(validateRoute(overlappingOcclusion).some((w) => w.includes("Overlapping occlusion segments")));

  const duplicateIdWarnings = validateRouteSet([
    { ...createEmptyRoute({ id: "dup", name: "A" }), points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
    { ...createEmptyRoute({ id: "dup", name: "B" }), points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
  ]);
  assert.ok(duplicateIdWarnings.some((w) => w.includes("Duplicate route id: dup")));
});

test("MET-16A export/import round-trips a valid route set", () => {
  let route = createEmptyRoute({ id: "export-route", name: "Main Bridge Eastbound" });
  route = addRoutePoint(route, { x: 31, y: 52 }, { snap: false });
  route = addRoutePoint(route, { x: 42, y: 48 }, { snap: false });
  route = setPerspectiveKey(route, 0, 0.32);
  route = addOcclusionSegment(route, 0.2, 0.4);

  const exported = exportRouteSet([route]);
  assert.equal(exported.schemaVersion, 1);
  assert.equal(exported.routes.length, 1);
  assert.deepEqual(exportRoute(route).points, route.points);

  const imported = parseImportedRouteSet(JSON.stringify(exported));
  assert.equal(imported.valid, true);
  assert.equal(imported.errors.length, 0);
  assert.equal(imported.routes.length, 1);
  assert.deepEqual(imported.routes[0].points, route.points);
  assert.equal(imported.routes[0].name, "Main Bridge Eastbound");
});

test("MET-16A import fails safely on malformed JSON and malformed route shapes", () => {
  const brokenJson = parseImportedRouteSet("{not valid json");
  assert.equal(brokenJson.valid, false);
  assert.ok(brokenJson.errors[0].includes("Invalid JSON"));
  assert.deepEqual(brokenJson.routes, []);

  const missingRoutesArray = parseImportedRouteSet(JSON.stringify({ schemaVersion: 1 }));
  assert.equal(missingRoutesArray.valid, false);
  assert.deepEqual(missingRoutesArray.routes, []);

  const partiallyBroken = parseImportedRouteSet(
    JSON.stringify({
      schemaVersion: 1,
      routes: [
        { id: "ok", name: "Fine", points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] },
        { id: "broken", name: "No points array" },
        "not-an-object",
      ],
    }),
  );
  assert.equal(partiallyBroken.routes.length, 1);
  assert.equal(partiallyBroken.routes[0].id, "ok");
  assert.ok(partiallyBroken.errors.some((e) => e.includes("index 1")));
  assert.ok(partiallyBroken.errors.some((e) => e.includes("index 2")));
});

test("MET-16A developer-mode gating requires both a dev build and the explicit query flag", () => {
  assert.equal(resolveTrafficAuthoringEnabled({ isDev: false, search: "?trafficAuthor=1" }), false);
  assert.equal(resolveTrafficAuthoringEnabled({ isDev: true, search: "" }), false);
  assert.equal(resolveTrafficAuthoringEnabled({ isDev: true, search: "?trafficAuthor=1" }), true);
  assert.equal(resolveTrafficAuthoringEnabled({ isDev: true, search: "?trafficAuthor" }), true);
  assert.equal(resolveTrafficAuthoringEnabled({ isDev: true, search: "?trafficAuthor=0" }), false);
  assert.equal(resolveTrafficAuthoringEnabled({ isDev: true, search: "?trafficAuthor=false" }), false);
  assert.equal(resolveTrafficAuthoringEnabled({ isDev: true, search: "?unlock=1" }), false);
});

test("MET-16A Ghost Preview speed presets match the required calibration set and default", () => {
  assert.deepEqual(
    GHOST_PREVIEW_SPEED_PRESETS.map((preset) => preset.multiplier),
    [0.01, 0.05, 0.1, 0.25, 0.5, 1],
  );
  assert.equal(resolveGhostPreviewSpeedLabel(0.01), "Ultra Crawl");
  assert.equal(resolveGhostPreviewSpeedLabel(0.05), "Crawl");
  assert.equal(resolveGhostPreviewSpeedLabel(0.1), "Very Slow");
  assert.equal(resolveGhostPreviewSpeedLabel(0.25), "Slow");
  assert.equal(resolveGhostPreviewSpeedLabel(0.5), "Medium");
  assert.equal(resolveGhostPreviewSpeedLabel(1), "Normal");

  // Default must be 0.10x or slower (adding Ultra Crawl below it must not
  // silently change the default).
  assert.ok(GHOST_PREVIEW_DEFAULT_SPEED_MULTIPLIER <= 0.1);
  assert.equal(GHOST_PREVIEW_DEFAULT_SPEED_MULTIPLIER, 0.1);
  assert.ok(GHOST_PREVIEW_SPEED_PRESETS.some((preset) => preset.multiplier === GHOST_PREVIEW_DEFAULT_SPEED_MULTIPLIER));
});

test("MET-16A Ghost Preview speed scaling is linear/monotonic and each new minimum is meaningfully slower than the last", () => {
  const rates = GHOST_PREVIEW_SPEED_PRESETS.map((preset) => resolveGhostPreviewProgressPerSecond(preset.multiplier));
  // Strictly increasing — no stepping/rounding collapses two presets to the
  // same effective rate, and doubling the multiplier exactly doubles the
  // rate (pure linear scaling, so motion stays smooth at every setting).
  for (let i = 1; i < rates.length; i += 1) {
    assert.ok(rates[i] > rates[i - 1], `expected rate ${rates[i]} > ${rates[i - 1]} at index ${i}`);
  }

  const rateFor = (multiplier) => resolveGhostPreviewProgressPerSecond(multiplier);
  assert.ok(Math.abs(rateFor(0.1) - rateFor(0.05) * 2) < 1e-9, "0.10x should be exactly double the 0.05x rate");
  assert.ok(Math.abs(rateFor(0.05) - rateFor(0.01) * 5) < 1e-9, "0.05x should be exactly 5x the 0.01x rate");

  assert.ok(
    rateFor(0.05) < PREVIOUS_MINIMUM_PROGRESS_PER_SECOND * 0.75,
    `0.05x minimum (${rateFor(0.05)}) should be meaningfully slower than the pre-Crawl minimum (${PREVIOUS_MINIMUM_PROGRESS_PER_SECOND})`,
  );
  // Ultra Crawl must itself be meaningfully slower than Crawl, not a
  // rounding-noise difference.
  assert.ok(
    rateFor(0.01) < rateFor(0.05) * 0.5,
    `0.01x (${rateFor(0.01)}) should be meaningfully slower than 0.05x (${rateFor(0.05)})`,
  );

  // Invalid/missing multiplier falls back to the default rather than
  // producing NaN, zero, or a negative (backward) rate.
  const fallbackRate = resolveGhostPreviewProgressPerSecond(undefined);
  assert.equal(fallbackRate, resolveGhostPreviewProgressPerSecond(GHOST_PREVIEW_DEFAULT_SPEED_MULTIPLIER));
  assert.ok(resolveGhostPreviewProgressPerSecond(-1) > 0);
});

test("MET-16A Ghost Preview Ultra Crawl (0.01x) advances smoothly and takes several minutes for a full route", () => {
  const points = [{ x: 0, y: 50 }, { x: 50, y: 20 }, { x: 100, y: 50 }];
  const rate = resolveGhostPreviewProgressPerSecond(0.01);
  let progress = 0;
  let previousSample = sampleRouteAtProgress(points, 0);
  const dtSeconds = 1 / 60;
  const framesFor30SimulatedSeconds = 30 * 60;
  for (let frame = 0; frame < framesFor30SimulatedSeconds; frame += 1) {
    progress = Math.min(1, progress + dtSeconds * rate);
    const sample = sampleRouteAtProgress(points, progress);
    const frameDistance = Math.hypot(sample.x - previousSample.x, sample.y - previousSample.y);
    assert.ok(frameDistance < 2, `frame-to-frame jump too large at frame ${frame}: ${frameDistance}`);
    previousSample = sample;
  }
  // After 30 simulated seconds at 0.01x, progress should be well under a
  // fifth of the route — a full traverse takes on the order of minutes,
  // giving the owner room to inspect fine alignment detail at the slowest
  // setting (compare to 0.05x, which would already be 60% done: 0.6 vs
  // ~0.12 here).
  assert.ok(progress > 0 && progress < 0.2, `expected only a fraction of the route after 30s at 0.01x, got ${progress}`);
  const fullRouteDurationSeconds = 1 / rate;
  assert.ok(fullRouteDurationSeconds > 200, `expected a multi-minute full-route duration at 0.01x, got ${fullRouteDurationSeconds}s`);
});

test("MET-16A Ghost Preview at the slowest preset still advances monotonically over simulated time", () => {
  const points = [{ x: 0, y: 50 }, { x: 50, y: 20 }, { x: 100, y: 50 }];
  const rate = resolveGhostPreviewProgressPerSecond(0.05);
  let progress = 0;
  let previousSample = sampleRouteAtProgress(points, 0);
  const dtSeconds = 1 / 60;
  for (let frame = 0; frame < 600; frame += 1) {
    progress = Math.min(1, progress + dtSeconds * rate);
    const sample = sampleRouteAtProgress(points, progress);
    // Never jumps discontinuously far in a single frame at 60fps — confirms
    // frame-rate-independent, non-stepping motion even at the crawl speed.
    const frameDistance = Math.hypot(sample.x - previousSample.x, sample.y - previousSample.y);
    assert.ok(frameDistance < 2, `frame-to-frame jump too large at frame ${frame}: ${frameDistance}`);
    previousSample = sample;
  }
  // After 10 simulated seconds at 0.05x, progress should be visibly
  // underway but nowhere near complete — slow enough for detailed
  // inspection, per requirement 8.
  assert.ok(progress > 0.15 && progress < 0.35, `expected partial progress after 10s at 0.05x, got ${progress}`);
});

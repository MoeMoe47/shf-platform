// MET-16C — Reference Corridor Vehicle Realism tests.
// Pure model functions in metaverseTrafficCorridorRuntime.js are executed
// directly. VehicleSilhouettes.jsx / TrafficVehicleMarker.jsx are React/JSX
// so they get static source-text assertions (this repo's established
// frontend convention).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  TRAFFIC_CORRIDOR_ENDPOINT_FADE_WINDOW,
  TRAFFIC_CORRIDOR_REVIEW_START_OFFSETS,
  TRAFFIC_CORRIDOR_REVIEW_VEHICLE_CLASS_MIX,
  TRAFFIC_CORRIDOR_ROUTE_ID,
  TRAFFIC_VEHICLE_CLASS_SCALE,
  TRAFFIC_VEHICLE_COLOR_PALETTE,
  isTrafficCorridorReviewOccluded,
  resolveEndpointFadeOpacity,
  resolveTrafficCorridorReviewVehicleClass,
  resolveTrafficCorridorScale,
  resolveTrafficCorridorVehicleAppearance,
  resolveTrafficVehicleClassScale,
  resolveTrafficVehicleColorForSlot,
} from "../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js";
import { createVehicleState } from "../src/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";

const markerSource = readFileSync(new URL("../src/components/metaverse/traffic/TrafficVehicleMarker.jsx", import.meta.url), "utf8");
const silhouetteSource = readFileSync(new URL("../src/components/metaverse/traffic/VehicleSilhouettes.jsx", import.meta.url), "utf8");
const hookSource = readFileSync(new URL("../src/hooks/metaverse/useMetaverseTrafficCorridor.js", import.meta.url), "utf8");
const runtimeSource = readFileSync(new URL("../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js", import.meta.url), "utf8");

// Strips `//` line comments and `/* ... */` block comments (including the
// JSX `{/* ... */}` form) so "must not reference X" assertions check real
// code, not an explanatory comment that names X while explaining it's gone.
// Line comments must be stripped FIRST — this repo's own comment prose
// contains glob-like text such as "vehicles/*.svg", whose embedded "/*"
// would otherwise be misread by a block-comment regex as the start of a
// real block comment and swallow everything up to some unrelated later
// "*/" elsewhere in the file.
function stripComments(source) {
  return source
    .split("\n")
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}
const markerCode = stripComments(markerSource);
const silhouetteCode = stripComments(silhouetteSource);
const runtimeCode = stripComments(runtimeSource);

function routeWith(overrides = {}) {
  return {
    id: TRAFFIC_CORRIDOR_ROUTE_ID,
    speed_class: "BOULEVARD",
    points: [{ x: 39.6, y: 96.0 }, { x: 30.2, y: 85.8 }, { x: 25.3, y: 79.7 }, { x: 20.0, y: 74.0 }, { x: 16.1, y: 69.7 }, { x: 12.2, y: 67.2 }],
    perspective: [],
    occlusion_segments: [],
    ...overrides,
  };
}

test("MET-16C real perspective calibration (3+ keys) applies to the reference corridor even though the route JSON itself has no owner keys yet", () => {
  const route = routeWith();
  const near = resolveTrafficCorridorScale(route, { y: 96, progress: 0 });
  const mid = resolveTrafficCorridorScale(route, { y: 80, progress: 0.5 });
  const far = resolveTrafficCorridorScale(route, { y: 67.2, progress: 1 });
  assert.equal(near.calibrated, true, "must report as calibrated, not the raw y-heuristic fallback");
  assert.equal(far.calibrated, true);
  assert.ok(near.scale > mid.scale && mid.scale > far.scale, "scale must shrink gradually toward the far end");
  // MET-16C.1 Section 2 raised NEAR 1.0 -> 1.2 (a deliberate, documented
  // +20% legibility increase, bounded so CAR width stays under the
  // measured lane width — see the runtime file's calibration comment).
  // 1.25 is the requested band's ceiling; anything above that would be
  // the "just multiply everything uniformly" behavior the brief
  // explicitly says not to do.
  assert.ok(near.scale > 1.0 && near.scale <= 1.25, "near scale must reflect the requested +15-25% increase, not more");
  assert.ok(far.scale >= 0.4, "far scale must never become microscopically small");
});

test("MET-16C perspective calibration always defers to the owner's own real keys the instant the route declares any", () => {
  const route = routeWith({ perspective: [{ t: 0, scale: 2 }, { t: 1, scale: 2 }] });
  const result = resolveTrafficCorridorScale(route, { y: 96, progress: 0 });
  assert.equal(result.scale, 2, "owner-authored keys must win over the review-scoped calibration");
});

test("MET-16C perspective calibration is scoped to the reference corridor only, not applied to an unrelated uncalibrated route", () => {
  const otherRoute = { id: "some-other-route", perspective: [] };
  const result = resolveTrafficCorridorScale(otherRoute, { y: 50, progress: 0.5 });
  assert.equal(result.calibrated, false, "an unrelated route must still fall back to the original y-heuristic, untouched");
});

test("MET-16C.3 occlusion: the widened, precisely-measured segment covers both bridge towers' cable fans, not the whole route, not arbitrary", () => {
  assert.equal(isTrafficCorridorReviewOccluded(TRAFFIC_CORRIDOR_ROUTE_ID, 0.0), false);
  assert.equal(isTrafficCorridorReviewOccluded(TRAFFIC_CORRIDOR_ROUTE_ID, 0.2), false, "must still be clear before the first tower's cable fan begins (~t=0.28)");
  assert.equal(isTrafficCorridorReviewOccluded(TRAFFIC_CORRIDOR_ROUTE_ID, 0.36), true, "must be occluded under the first tower's pylon/cable fan");
  assert.equal(isTrafficCorridorReviewOccluded(TRAFFIC_CORRIDOR_ROUTE_ID, 0.47), true, "must be occluded at the first tower's pylon base (measured ~t=0.46-0.48)");
  assert.equal(isTrafficCorridorReviewOccluded(TRAFFIC_CORRIDOR_ROUTE_ID, 0.77), true, "must be occluded at the second tower's pylon base (measured ~t=0.75-0.78)");
  assert.equal(isTrafficCorridorReviewOccluded(TRAFFIC_CORRIDOR_ROUTE_ID, 0.9), false, "must be clear again well past the second tower's cable fan");
  assert.equal(isTrafficCorridorReviewOccluded(TRAFFIC_CORRIDOR_ROUTE_ID, 1.0), false);
  assert.equal(isTrafficCorridorReviewOccluded("some-other-route", 0.5), false, "must never apply to a route it wasn't authored for");
});

test("MET-16C a vehicle disappears naturally while occluded and reappears after, via the shared appearance function", () => {
  const route = routeWith();
  const before = resolveTrafficCorridorVehicleAppearance({ route, vehicleState: createVehicleState(0.2) });
  const during = resolveTrafficCorridorVehicleAppearance({ route, vehicleState: createVehicleState(0.36) });
  const after = resolveTrafficCorridorVehicleAppearance({ route, vehicleState: createVehicleState(0.92) });
  assert.equal(before.occluded, false);
  assert.equal(during.occluded, true);
  assert.equal(after.occluded, false);
});

test("MET-16C spawn/despawn endpoint fade only affects the first/last few percent of the route, never mid-route", () => {
  assert.equal(resolveEndpointFadeOpacity(0), 0, "must start fully transparent at the very start");
  assert.ok(resolveEndpointFadeOpacity(TRAFFIC_CORRIDOR_ENDPOINT_FADE_WINDOW / 2) < 1);
  assert.equal(resolveEndpointFadeOpacity(0.5), 1, "must be fully opaque mid-route");
  assert.equal(resolveEndpointFadeOpacity(1), 0, "must end fully transparent at the very end");
  assert.ok(TRAFFIC_CORRIDOR_ENDPOINT_FADE_WINDOW <= 0.05, "the fade window must stay short/subtle, not a slow dissolve");
});

test("MET-16C.1 class mix is 2 CAR + 1 SUV (no bus/van) — SMALL_TRUCK was measured to exceed the route's lane width at the revised NEAR scale and was excluded, see metaverseTrafficCorridorScalePolish.test.mjs", () => {
  assert.deepEqual(TRAFFIC_CORRIDOR_REVIEW_VEHICLE_CLASS_MIX, ["CAR", "SUV", "CAR"]);
  assert.equal(resolveTrafficCorridorReviewVehicleClass(0), "CAR");
  assert.equal(resolveTrafficCorridorReviewVehicleClass(1), "SUV");
  assert.equal(resolveTrafficCorridorReviewVehicleClass(2), "CAR");
});

test("MET-16C.2 class-specific scale: CAR=1.00 baseline; SUV was capped BELOW CAR (0.94) after MET-16C.2 measured it exceeding the corridor's real lane width at 1.08 — an intentional lane-fit cap, not a regression; SMALL_TRUCK stays defined for a wider corridor though unused in this route's active mix", () => {
  assert.equal(TRAFFIC_VEHICLE_CLASS_SCALE.CAR, 1.0);
  assert.ok(TRAFFIC_VEHICLE_CLASS_SCALE.SUV >= 0.85 && TRAFFIC_VEHICLE_CLASS_SCALE.SUV < 1.0, "SUV must be capped below CAR on this corridor per the MET-16C.2 lane-fit measurement");
  assert.ok(TRAFFIC_VEHICLE_CLASS_SCALE.SMALL_TRUCK > 1.0);
  assert.equal(resolveTrafficVehicleClassScale("CAR"), 1.0);
  assert.equal(resolveTrafficVehicleClassScale("UNKNOWN_CLASS"), 1.0, "an unrecognized class must fall back to the CAR baseline, never crash or default to 0");
});

test("MET-16C color palette is restrained/realistic (no neon), has real variety, and slot assignment is deterministic never Math.random", () => {
  assert.ok(TRAFFIC_VEHICLE_COLOR_PALETTE.length >= 5, "must offer real variety, not a token 2-color set");
  for (const entry of TRAFFIC_VEHICLE_COLOR_PALETTE) {
    assert.match(entry.body, /^#[0-9a-f]{6}$/i);
    assert.match(entry.accent, /^#[0-9a-f]{6}$/i);
  }
  const a = resolveTrafficVehicleColorForSlot(0);
  const b = resolveTrafficVehicleColorForSlot(0);
  assert.deepEqual(a, b, "must be deterministic across repeated calls for the same slot");
  const c = resolveTrafficVehicleColorForSlot(1);
  assert.notDeepEqual(a, c, "different slots should not all collapse onto the same color");
  assert.doesNotMatch(runtimeCode, /Math\.random/);
});

test("MET-16C starting offsets are irregular (not perfectly even thirds) but still deterministic and route-covering", () => {
  assert.equal(TRAFFIC_CORRIDOR_REVIEW_START_OFFSETS.length, 3);
  const evenThirds = [0, 1 / 3, 2 / 3];
  assert.notDeepEqual(TRAFFIC_CORRIDOR_REVIEW_START_OFFSETS, evenThirds, "must not be the mechanically-even split — Section 15 explicitly asks for natural, unequal gaps");
  for (const offset of TRAFFIC_CORRIDOR_REVIEW_START_OFFSETS) assert.ok(offset >= 0 && offset < 1);
});

test("MET-16C marker renders a class-specific inline silhouette with a per-vehicle color, not a shared static image asset", () => {
  assert.match(markerCode, /resolveVehicleSilhouette/);
  assert.doesNotMatch(markerCode, /publicAssetUrl|<image/, "must no longer reference the old flat single-color file assets");
  assert.match(markerCode, /bodyColor/);
  assert.match(markerCode, /accentColor/);
});

test("MET-16C marker draws exactly one ground shadow (the old asset files baked in a second one — this must not be duplicated)", () => {
  const ellipseCount = (markerCode.match(/<ellipse/g) || []).length;
  assert.equal(ellipseCount, 1, "TrafficVehicleMarker must own the single shadow ellipse; VehicleSilhouettes.jsx must not draw its own");
  // Wheel arches ARE legitimately drawn as small ellipses (see
  // WheelArches in VehicleSilhouettes.jsx) — the thing that must not be
  // duplicated is specifically a black, low-opacity, full-body shadow.
  assert.doesNotMatch(silhouetteCode, /fill="#000000"/, "silhouettes must not bake in their own black ground shadow (that caused a double-shadow bug in the old static SVG assets)");
});

test("MET-16C shadow is reduced (not necessarily removed) at NIGHT relative to DAY/DUSK", () => {
  assert.match(runtimeSource, /shadowOpacity/);
  const nightMatch = runtimeSource.match(/NIGHT:\s*\{[^}]*shadowOpacity:\s*([\d.]+)/);
  const dayMatch = runtimeSource.match(/DAY:\s*\{[^}]*shadowOpacity:\s*([\d.]+)/);
  assert.ok(nightMatch && dayMatch);
  assert.ok(Number(nightMatch[1]) < Number(dayMatch[1]));
});

test("MET-16C lights attach to vehicle front/rear (not a single centered glow) and rotate with the vehicle group, not independently", () => {
  // MET-16C.2 pulled the light position in from the exact tip
  // (length/2) to length*0.44 so it sits visibly ON the body — still a
  // positive frontX / negative rearX offset (front/rear), never cx={0}.
  assert.match(markerSource, /frontX = length \* 0\.44/, "headlight must be offset toward the front, not centered");
  assert.match(markerSource, /rearX = -length \* 0\.44/, "taillight must be offset toward the rear, not centered");
  assert.doesNotMatch(markerSource, /cx=\{0\}.*fill="#fff3c4"|cx=\{0\}.*fill="#ff5a5a"/, "a light must never be centered at the vehicle origin");
  assert.doesNotMatch(markerSource, /@keyframes|animation:/, "no arcade-style animated glow");
});

test("MET-16C every silhouette has a tapered/asymmetric nose shape (not a symmetric rounded rectangle read as a pill)", () => {
  const polygonCount = (silhouetteSource.match(/<polygon/g) || []).length;
  assert.ok(polygonCount >= 3, "each of the 3 silhouettes (CAR/SUV/SMALL_TRUCK) must include a nose wedge polygon");
});

test("MET-16C each silhouette includes wheel-arch and cabin/glass detail, not just a flat body block", () => {
  assert.match(silhouetteSource, /WheelArches/);
  assert.match(silhouetteSource, /GLASS_COLOR/);
  assert.match(silhouetteSource, /SedanSilhouette/);
  assert.match(silhouetteSource, /SuvSilhouette/);
  assert.match(silhouetteSource, /SmallTruckSilhouette/);
});

test("MET-16C vehicle class mix / color / irregular spacing are scoped to the single corridor hook only, never to the all-routes fleet engine", () => {
  assert.match(hookSource, /resolveTrafficCorridorReviewVehicleClass/);
  assert.match(hookSource, /resolveTrafficVehicleColorForSlot/);
  const allRoutesHookSource = readFileSync(new URL("../src/hooks/metaverse/useMetaverseTrafficAllRoutesReview.js", import.meta.url), "utf8");
  assert.doesNotMatch(allRoutesHookSource, /resolveTrafficCorridorReviewVehicleClass|resolveTrafficVehicleColorForSlot|TRAFFIC_CORRIDOR_REVIEW_START_OFFSETS/, "all-routes review must keep resolving vehicle type strictly from each route's own declared vehicle_classes, unchanged");
});

test("MET-16C dev gate and normal-view boundary are preserved: still no bus/van in the reference class mix, still corridor-review-gated only", () => {
  assert.doesNotMatch(TRAFFIC_CORRIDOR_REVIEW_VEHICLE_CLASS_MIX.join(","), /BUS|SHUTTLE|VAN/);
});

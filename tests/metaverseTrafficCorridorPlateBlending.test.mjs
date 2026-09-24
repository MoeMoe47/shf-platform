// MET-16C.2 — Vehicle Proportion + Plate Blending tests.
// Static source-text assertions for the JSX/CSS-in-JS pieces (this repo's
// established frontend convention), plus real pure-function checks where
// applicable.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  TRAFFIC_VEHICLE_CLASS_SCALE,
  resolveTrafficCorridorScale,
  TRAFFIC_CORRIDOR_ROUTE_ID,
} from "../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js";
import { TRAFFIC_PREVIEW_VEHICLE_VISUALS } from "../src/system/metaverse/traffic/metaverseTrafficLivePreviewModel.js";

const markerSource = readFileSync(new URL("../src/components/metaverse/traffic/TrafficVehicleMarker.jsx", import.meta.url), "utf8");
const silhouetteSource = readFileSync(new URL("../src/components/metaverse/traffic/VehicleSilhouettes.jsx", import.meta.url), "utf8");

// Line comments must be stripped FIRST: this repo's own comment prose
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

const LANE_WIDTH = 1.35;

test("MET-16C.2 SUV near-field width lands in the requested 85-90% lane-occupancy band", () => {
  const { scale } = resolveTrafficCorridorScale({ id: TRAFFIC_CORRIDOR_ROUTE_ID, perspective: [] }, { y: 96, progress: 0 });
  const suvWidth = TRAFFIC_PREVIEW_VEHICLE_VISUALS.SEDAN.width * scale * TRAFFIC_VEHICLE_CLASS_SCALE.SUV;
  const occupancy = suvWidth / LANE_WIDTH;
  assert.ok(occupancy >= 0.85 && occupancy <= 0.9, `SUV lane occupancy ${(occupancy * 100).toFixed(1)}% must land in 85-90%`);
});

test("MET-16C.2 CAR near-field width is unchanged from MET-16C.1 (only SUV was retuned, per the explicit 'do not reduce every class globally' instruction)", () => {
  const { scale } = resolveTrafficCorridorScale({ id: TRAFFIC_CORRIDOR_ROUTE_ID, perspective: [] }, { y: 96, progress: 0 });
  const carWidth = TRAFFIC_PREVIEW_VEHICLE_VISUALS.SEDAN.width * scale * TRAFFIC_VEHICLE_CLASS_SCALE.CAR;
  assert.equal(TRAFFIC_VEHICLE_CLASS_SCALE.CAR, 1.0);
  assert.ok(Math.abs(carWidth - 1.26) < 1e-9, `CAR width must remain exactly what MET-16C.1 set (1.26), got ${carWidth}`);
});

test("MET-16C.2 perspective calibration (FAR/MID/NEAR keys) is untouched from MET-16C.1", () => {
  const near = resolveTrafficCorridorScale({ id: TRAFFIC_CORRIDOR_ROUTE_ID, perspective: [] }, { y: 96, progress: 0 }).scale;
  const far = resolveTrafficCorridorScale({ id: TRAFFIC_CORRIDOR_ROUTE_ID, perspective: [] }, { y: 67.2, progress: 1 }).scale;
  assert.equal(near, 1.2);
  assert.equal(far, 0.55);
});

test("MET-16C.2 light glow radius is materially smaller than the MET-16C.1 baseline (width*0.26 / width*0.2)", () => {
  const headlightMatch = markerCode.match(/r=\{width \* ([\d.]+)\}\s*fill="#fff3c4"/);
  const taillightMatch = markerCode.match(/r=\{width \* ([\d.]+)\}\s*fill="#ff5a5a"/);
  assert.ok(headlightMatch && taillightMatch, "expected to find both light radius expressions");
  const headlightRadius = Number(headlightMatch[1]);
  const taillightRadius = Number(taillightMatch[1]);
  assert.ok(headlightRadius < 0.2, `headlight radius factor ${headlightRadius} must be materially below the old 0.26`);
  assert.ok(taillightRadius < 0.15, `taillight radius factor ${taillightRadius} must be materially below the old 0.2`);
});

test("MET-16C.2 lights are a single small circle each — no streak/trail/second glow layer, no CSS animation", () => {
  const circleCount = (markerCode.match(/<circle/g) || []).length;
  assert.equal(circleCount, 2, "exactly one headlight circle and one taillight circle, no extra bloom layers");
  assert.doesNotMatch(markerCode, /@keyframes|animation:|linearGradient|radialGradient/, "no streak/trail/gradient bloom effects");
});

test("MET-16C.2 plate blending: a subtle blur (within the suggested 0.15-0.35px range) is applied to the vehicle detail layer, not a noticeable blur", () => {
  const blurMatch = markerCode.match(/blur\(([\d.]+)px\)/);
  assert.ok(blurMatch, "expected a blur(...) filter on the vehicle rendering");
  const blurPx = Number(blurMatch[1]);
  assert.ok(blurPx >= 0.15 && blurPx <= 0.35, `blur ${blurPx}px must stay within the suggested subtle range`);
});

test("MET-16C.2 edge stroke opacity was reduced from the MET-16C.1 baseline (0.45) so panels no longer look cartoon-traced", () => {
  const strokeMatch = silhouetteCode.match(/BODY_STROKE = "rgba\(0,0,0,([\d.]+)\)"/);
  assert.ok(strokeMatch, "expected the BODY_STROKE constant");
  const strokeOpacity = Number(strokeMatch[1]);
  assert.ok(strokeOpacity < 0.45, `stroke opacity ${strokeOpacity} must be reduced below the MET-16C.1 value of 0.45`);
  assert.ok(strokeOpacity > 0, "a stroke must still exist for panel separation, not be removed entirely");
});

test("MET-16C.2 CAR/SUV body corner radius no longer approaches a semicircle at the tail (the root cause of the capsule read)", () => {
  // A corner radius close to half the body height renders as a
  // semicircular cap. Extract each class's <rect ... height={H} rx={R} ...
  // fill={bodyColor}> body panel and assert rx stays a small fraction of
  // height.
  const sedanBody = silhouetteCode.match(/<rect x=\{18\} y=\{32\} width=\{182\} height=\{36\} rx=\{(\d+)\}/);
  const suvBody = silhouetteCode.match(/<rect x=\{16\} y=\{22\} width=\{186\} height=\{56\} rx=\{(\d+)\}/);
  assert.ok(sedanBody, "expected the sedan body rect with the new MET-16C.2 proportions");
  assert.ok(suvBody, "expected the SUV body rect with the new MET-16C.2 proportions");
  const sedanRatio = Number(sedanBody[1]) / 36;
  const suvRatio = Number(suvBody[1]) / 56;
  assert.ok(sedanRatio <= 0.25, `sedan rx/height ratio ${sedanRatio} must be well below the ~0.5 semicircle threshold`);
  assert.ok(suvRatio <= 0.25, `SUV rx/height ratio ${suvRatio} must be well below the ~0.5 semicircle threshold`);
});

test("MET-16C.2 CAR cabin/glass area was narrowed relative to MET-16C.1 (was width=76)", () => {
  const cabinMatch = silhouetteCode.match(/<rect x=\{78\} y=\{24\} width=\{(\d+)\} height=\{52\} rx=\{8\} fill="#0f172a"/);
  assert.ok(cabinMatch, "expected the sedan cabin rect at its new position");
  assert.ok(Number(cabinMatch[1]) < 76, "cabin width must be narrower than the MET-16C.1 baseline of 76");
});

test("MET-16C.2 shadow footprint was tightened from the MET-16C.1 baseline (rx=length*0.52 / ry=width*0.5) and softened with the same blur filter", () => {
  const shadowRxMatch = markerCode.match(/rx=\{length \* ([\d.]+)\}/);
  const shadowRyMatch = markerCode.match(/ry=\{width \* ([\d.]+)\}/);
  assert.ok(shadowRxMatch && shadowRyMatch);
  assert.ok(Number(shadowRxMatch[1]) < 0.52, "shadow rx factor must be tightened below the MET-16C.1 value of 0.52");
  assert.ok(Number(shadowRyMatch[1]) < 0.5, "shadow ry factor must be tightened below the MET-16C.1 value of 0.5");
  // The shadow <ellipse> must itself carry the blur filter (not just the
  // body detail layer) so it doesn't read as a second hard-edged shape.
  const shadowBlock = markerSource.match(/<ellipse[\s\S]*?\/>/);
  assert.ok(shadowBlock && /filter/.test(shadowBlock[0]), "the shadow ellipse must include a blur filter");
});

test("MET-16C.2 occlusion still hides the whole vehicle group (body, shadow, and lights) — nothing renders separately while occluded", () => {
  assert.match(markerCode, /if \(!vehicle \|\| vehicle\.occluded\) return null;/, "an occluded vehicle must render nothing at all, not just hide the body");
});

test("MET-16C.2 SMALL_TRUCK remains disabled for this corridor's active mix (still 2 CAR + 1 SUV)", () => {
  // Re-imported directly to avoid relying on another test file's import
  // ordering.
  return import("../src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js").then((mod) => {
    assert.deepEqual(mod.TRAFFIC_CORRIDOR_REVIEW_VEHICLE_CLASS_MIX, ["CAR", "SUV", "CAR"]);
  });
});

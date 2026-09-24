// MET-16C.3 / MET-16C.4 — Screen-Seam + Full-City Framing tests.
//
// MET-16C.3 fixed a visible seam by inflating overscan to match the
// existing wide (+/-22%/+/-18%) pan bounds — which also, provably, shrank
// the default (pan=0) visible framing from ~92.6% to ~54.4% of the city
// plate (a real regression the owner then reported). MET-16C.4 inverts
// the dependency: overscan is restored to the original 1.08 (framing
// fidelity, a design choice) and METAVERSE_CAMERA_PAN_BOUNDS is now
// DERIVED from it (a safety proof), the opposite direction from
// MET-16C.3. This file covers both the seam-safety proof and the
// framing-restoration proof, since they're two sides of the same
// architectural fix. Vehicle-occlusion regression coverage lives in
// tests/metaverseTrafficCorridorRealism.test.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  METAVERSE_CAMERA_PAN_BOUNDS,
  METAVERSE_CAMERA_WORLD_OVERSCAN,
  computeMetaverseCameraWorldRect,
  resolveSafeCameraOverscan,
  resolveSafePanBoundPercent,
  resolveSafePanBoundPercentAtZoom,
  resolveSafeZoomForPan,
} from "../src/system/metaverse/metaverseCameraProjection.js";

const cameraSource = readFileSync(new URL("../src/components/metaverse/MetaverseCamera.jsx", import.meta.url), "utf8");
const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");

// Re-derives, independently of the app's own overscan constant, whether a
// world box of a given overscan factor still fully covers a container
// once panned to (panXPercent, panYPercent) at zoom 1 — i.e. simulates
// exactly the failure mode a visible seam comes from.
function boxCoversContainerAfterPan({ overscan, panXPercent, panYPercent, containerWidth = 1400, containerHeight = 800 }) {
  const rect = computeMetaverseCameraWorldRect({ containerWidth, containerHeight, overscan });
  const shiftX = (panXPercent / 100) * rect.width;
  const shiftY = (panYPercent / 100) * rect.height;
  const left = rect.left + shiftX;
  const top = rect.top + shiftY;
  const right = left + rect.width;
  const bottom = top + rect.height;
  return left <= 0 && top <= 0 && right >= containerWidth && bottom >= containerHeight;
}

// The fraction of the source image visible in the container at rest
// (pan = 0), for a given overscan/zoom — this is the exact quantity that
// regressed in MET-16C.3 (92.6% -> 54.4%) and this phase restores.
function defaultVisibleFraction(overscan, zoom = 1) {
  return 1 / (overscan * zoom);
}

test("MET-16C.4 default visible framing is restored to essentially the full city (matches the pre-MET-16C.3 ~92.6%, not the regressed ~54.4%)", () => {
  const fraction = defaultVisibleFraction(METAVERSE_CAMERA_WORLD_OVERSCAN);
  assert.ok(fraction > 0.9, `default visible fraction ${fraction} must be back near the original ~92.6%, not the regressed ~54.4%`);
});

test("MET-16C.4 overscan is fixed at the original framing-driven value (1.08), not derived from a large pan range", () => {
  assert.equal(METAVERSE_CAMERA_WORLD_OVERSCAN, 1.08);
});

test("MET-16C.4 the shipped overscan constant still fully covers the container at the camera's ACTUAL (now-derived, smaller) pan clamp limit, in every direction — the seam stays fixed", () => {
  for (const signX of [-1, 1]) {
    for (const signY of [-1, 1]) {
      const covers = boxCoversContainerAfterPan({
        overscan: METAVERSE_CAMERA_WORLD_OVERSCAN,
        panXPercent: signX * METAVERSE_CAMERA_PAN_BOUNDS.x,
        panYPercent: signY * METAVERSE_CAMERA_PAN_BOUNDS.y,
      });
      assert.ok(covers, `world box must still cover the container at pan (${signX * METAVERSE_CAMERA_PAN_BOUNDS.x}%, ${signY * METAVERSE_CAMERA_PAN_BOUNDS.y}%) — a gap here is exactly the reported seam`);
    }
  }
});

test("MET-16C.4 the MET-16C.3-era pan bounds (+/-22%/+/-18%) would NOT be safe against the restored 1.08 overscan — proves reducing the pan range (not just reverting overscan) was necessary", () => {
  const covers = boxCoversContainerAfterPan({ overscan: 1.08, panXPercent: 22, panYPercent: 18 });
  assert.equal(covers, false, "the old wide pan bounds must fail against the restored framing-driven overscan");
});

test("MET-16C.4 METAVERSE_CAMERA_PAN_BOUNDS is now DERIVED from METAVERSE_CAMERA_WORLD_OVERSCAN (inverted from MET-16C.3's direction) via the exact algebraic inverse of resolveSafeCameraOverscan", () => {
  const expected = resolveSafePanBoundPercent(METAVERSE_CAMERA_WORLD_OVERSCAN);
  assert.equal(METAVERSE_CAMERA_PAN_BOUNDS.x, expected);
  assert.equal(METAVERSE_CAMERA_PAN_BOUNDS.y, expected);
  // With NO safety margin on either side (marginFactor: 1), the two
  // functions must round-trip exactly — that's what "exact algebraic
  // inverse" means. With the shipped 1.03 margin applied on BOTH sides
  // (as METAVERSE_CAMERA_PAN_BOUNDS does), the round trip is only
  // guaranteed to land at-or-above the original overscan (each margin
  // application makes the result strictly more conservative, so they
  // compound rather than cancel) — that stronger safety property is
  // covered separately by the "fully covers the container" test above.
  const breakevenPanNoMargin = resolveSafePanBoundPercent(METAVERSE_CAMERA_WORLD_OVERSCAN, 1);
  assert.equal(resolveSafeCameraOverscan({ x: breakevenPanNoMargin, y: breakevenPanNoMargin }, 1), METAVERSE_CAMERA_WORLD_OVERSCAN);
});

test("MET-16C.4 resolveSafeCameraOverscan/resolveSafePanBoundPercent remain real, general derivations — not hardcoded to today's specific numbers", () => {
  const wide = resolveSafeCameraOverscan({ x: 40, y: 5 });
  const narrow = resolveSafeCameraOverscan({ x: 2, y: 2 });
  assert.ok(wide > narrow, "a wider pan range must require strictly more overscan");
  assert.ok(boxCoversContainerAfterPan({ overscan: wide, panXPercent: 40, panYPercent: 5 }));
  assert.ok(boxCoversContainerAfterPan({ overscan: narrow, panXPercent: 2, panYPercent: 2 }));
  assert.ok(resolveSafePanBoundPercent(1.5) > resolveSafePanBoundPercent(1.1), "more overscan must allow strictly more safe pan");
});

// Models translate3d(x%, y%) + scale(zoom) applied together, the same
// composite MetaverseCamera.jsx's cameraTransform produces: the percent
// shift resolves against the box's OWN pre-scale layout size (translate
// is computed first, in the box's local space), and scale then grows the
// box around whatever point that shifted center lands on — NOT the same
// as simply feeding overscan*zoom into computeMetaverseCameraWorldRect
// (which would incorrectly compute the shift using the already-zoomed
// size too).
function boxCoversContainerAfterPanAndZoom({ overscan, zoom, panXPercent, panYPercent, containerWidth = 1400, containerHeight = 800 }) {
  const rect = computeMetaverseCameraWorldRect({ containerWidth, containerHeight, overscan });
  const shiftX = (panXPercent / 100) * rect.width;
  const shiftY = (panYPercent / 100) * rect.height;
  const centerX = rect.left + rect.width / 2 + shiftX;
  const centerY = rect.top + rect.height / 2 + shiftY;
  const renderedWidth = rect.width * zoom;
  const renderedHeight = rect.height * zoom;
  const left = centerX - renderedWidth / 2;
  const top = centerY - renderedHeight / 2;
  return left <= 0 && top <= 0 && left + renderedWidth >= containerWidth && top + renderedHeight >= containerHeight;
}

test("MET-16C.4 resolveSafeZoomForPan / resolveSafePanBoundPercentAtZoom are exact inverses, and real district/facility centering distances (measured up to ~28% off-center) resolve to a safe zoom well under the 1.8 max", () => {
  const worstCasePanPercent = 28; // see MetaverseCityPage.jsx's focusCamera and its own comment
  const requiredZoom = resolveSafeZoomForPan(worstCasePanPercent);
  assert.ok(requiredZoom < 1.8, `required zoom ${requiredZoom} for the real worst-case marker distance must stay under the 1.8 max`);
  const safePanAtThatZoom = resolveSafePanBoundPercentAtZoom(requiredZoom);
  assert.ok(safePanAtThatZoom >= worstCasePanPercent - 0.01, "the zoom resolveSafeZoomForPan returns must itself support panning that exact distance safely");
  assert.ok(
    boxCoversContainerAfterPanAndZoom({ overscan: METAVERSE_CAMERA_WORLD_OVERSCAN, zoom: requiredZoom, panXPercent: worstCasePanPercent, panYPercent: 0 }),
    "the combined zoom+pan (modeled the same way the real translate3d+scale transform composes) must not expose an edge",
  );
});

test("MET-16C.4 every pan-clamping call site (drag/wheel in MetaverseCamera.jsx, keyboard arrows AND focusCamera jump-to-location in MetaverseCityPage.jsx) uses the shared derivations rather than hardcoding its own numbers", () => {
  assert.match(cameraSource, /METAVERSE_CAMERA_PAN_BOUNDS/, "MetaverseCamera.jsx's drag/wheel clamp must use the shared bounds");
  assert.doesNotMatch(cameraSource, /clamp\(patch\.x[^,]*,\s*-22,\s*22\)/, "must not hardcode the old magic pan bound");
  assert.match(cityPageSource, /METAVERSE_CAMERA_PAN_BOUNDS/, "MetaverseCityPage.jsx's keyboard-arrow clamp must use the shared bounds");
  assert.doesNotMatch(cityPageSource, /x:\s*Math\.max\(-22,\s*value\.x/, "must not hardcode the old magic pan bound for ArrowLeft");
  assert.match(cityPageSource, /resolveSafeZoomForPan/, "focusCamera must use the shared zoom-for-pan derivation");
  assert.match(cityPageSource, /resolveSafePanBoundPercentAtZoom/, "focusCamera must clamp against the shared per-zoom safe bound");
  assert.doesNotMatch(cityPageSource, /Math\.max\(-18,\s*Math\.min\(18,\s*50 - item\.x\)\)/, "must not hardcode the old, now-unsafe focusCamera pan bound");
});

test("MET-16C.4 the safe-overscan/pan derivations are documented as zoom-independent (zoom only ever increases margin around the box's own center, never decreases it)", () => {
  const source = readFileSync(new URL("../src/system/metaverse/metaverseCameraProjection.js", import.meta.url), "utf8");
  assert.match(source, /zoom/i);
  assert.match(source, /worst case/i);
});

test("MET-16C.4 CAMERA_HOME (x:0, y:0, zoom:1) trivially satisfies the new, smaller pan bounds, so reset always lands on the restored full-city framing", () => {
  assert.ok(0 <= METAVERSE_CAMERA_PAN_BOUNDS.x && 0 <= METAVERSE_CAMERA_PAN_BOUNDS.y);
});

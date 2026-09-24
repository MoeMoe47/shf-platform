// DAY RAPIDS MOTION V2 tests.
// Registry values are checked directly (real data). Component/CSS
// behavior is checked via static source-text assertions, same convention
// as tests/metaverseDayWaterLayer.test.mjs (no rendered-component
// harness is configured for the metaverse UI).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DAY_RAPIDS_MOTION_ZONES,
  dayRapidsMotionTravelDistancePx,
  isDayRapidsMotionOpacityRestrained,
  resolveDayRapidsMotionReviewEnabled,
} from "../src/system/metaverse/dayRapidsMotionRegistry.js";

const layerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayRapidsMotionLayer.jsx", import.meta.url), "utf8");
const livingCityLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
const dayWaterLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayWaterLayer.jsx", import.meta.url), "utf8");
const dayWaterRegistrySource = readFileSync(new URL("../src/system/metaverse/dayWaterRegistry.js", import.meta.url), "utf8");

function stripComments(source) {
  return source.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

test("DAY RAPIDS MOTION — exactly 2 zones (primary + far-right secondary), each with the same 4-sublayer shape (2 foam, 1 shimmer, 1 pulse)", () => {
  assert.equal(DAY_RAPIDS_MOTION_ZONES.length, 2);
  for (const { layers } of DAY_RAPIDS_MOTION_ZONES) {
    assert.equal(layers.length, 4);
    const kinds = layers.map((l) => l.kind).sort();
    assert.deepEqual(kinds, ["foam", "foam", "pulse", "shimmer"]);
  }
});

test("DAY RAPIDS MOTION — Zone 1 is aligned to the central rapids on the new clean Page 1 DAY plate (realigned for the PAGE 1 CLEAN BACKGROUND INSTALL phase)", () => {
  const zone1 = DAY_RAPIDS_MOTION_ZONES.find((z) => z.id === "zone_1_primary");
  assert.ok(zone1, "zone_1_primary must exist");
  assert.ok(Math.abs(zone1.zone.left - 42.8) <= 2);
  assert.ok(Math.abs(zone1.zone.top - 67.5) <= 2);
  assert.ok(zone1.zone.width <= 25 && zone1.zone.height <= 15, "zone must stay small/localized, not river-wide");
});

test("DAY RAPIDS MOTION — Zone 2 sits in the measured LOWER-RIGHT water area (corrected placement, not the distant upper-right water near the skyline), small/localized (not river-wide)", () => {
  const zone2 = DAY_RAPIDS_MOTION_ZONES.find((z) => z.id === "zone_2_far_right");
  assert.ok(zone2, "zone_2_far_right must exist");
  assert.ok(Math.abs(zone2.zone.left - 67) <= 2);
  assert.ok(Math.abs(zone2.zone.top - 78) <= 2);
  assert.ok(zone2.zone.width <= 25 && zone2.zone.height <= 15, "zone must stay small/localized, not river-wide");
  assert.ok(zone2.zone.left > 50, "zone 2 must actually sit on the right side of the scene");
  assert.ok(zone2.zone.top > 50, "zone 2 must sit in the LOWER half of the scene, not the distant upper-right horizon water");
});

test("DAY RAPIDS MOTION — every sublayer in every zone is positioned within that zone's own 0-100% bounds", () => {
  for (const { id: zoneId, layers } of DAY_RAPIDS_MOTION_ZONES) {
    for (const layer of layers) {
      assert.ok(layer.left >= 0 && layer.left <= 100, `${zoneId}/${layer.id} left ${layer.left}% must be within the zone (0-100%)`);
      assert.ok(layer.top >= 0 && layer.top <= 100, `${zoneId}/${layer.id} top ${layer.top}% must be within the zone (0-100%)`);
      assert.ok(layer.left + layer.widthPct <= 130, `${zoneId}/${layer.id} must not extend wildly past the zone's right edge`);
    }
  }
});

test("DAY RAPIDS MOTION — every sublayer opacity is restrained and blur stays subtle in both zones", () => {
  // NOTE: the "Zone 2 must never be louder than Zone 1" hierarchy is
  // TEMPORARILY suspended — the owner reported Zone 2 read as static, so
  // it now uses its own independent TEMPORARY REVIEW SETTINGS range
  // (foam up to 0.48) to prove visibility, same as Zone 1 was pushed to
  // its own max earlier. Re-apply the "always lighter" hierarchy once
  // both zones are accepted and dialed back to final values.
  for (const { layers } of DAY_RAPIDS_MOTION_ZONES) {
    for (const layer of layers) {
      assert.ok(isDayRapidsMotionOpacityRestrained(layer), `${layer.id} opacity ${layer.opacity} is not restrained`);
      assert.ok(layer.blurPx <= 0.5, `${layer.id} blur ${layer.blurPx}px must stay very subtle (no heavy blur)`);
    }
  }
});

test("DAY RAPIDS MOTION — foam/shimmer travel distance and duration stay within the proven visible-motion range in both zones", () => {
  // Zone 1 uses the original V1.1-proven range; Zone 2 uses the
  // TEMPORARY REVIEW SETTINGS range (owner: Zone 2 read as static, so it
  // was pushed stronger than Zone 1's already-accepted values).
  const RANGES = {
    zone_1_primary: { foamTravel: [18, 24], foamDuration: [3.5, 5], shimmerTravel: [10, 16.1], shimmerDuration: [5, 7] },
    zone_2_far_right: { foamTravel: [24, 32], foamDuration: [3.5, 4.5], shimmerTravel: [14, 20], shimmerDuration: [5, 6] },
  };
  for (const { id: zoneId, layers } of DAY_RAPIDS_MOTION_ZONES) {
    const range = RANGES[zoneId];
    const foamA = layers.find((l) => l.id.endsWith("foam_a"));
    const foamB = layers.find((l) => l.id.endsWith("foam_b"));
    const shimmer = layers.find((l) => l.kind === "shimmer");
    const foamTravel = dayRapidsMotionTravelDistancePx(foamA);
    assert.ok(foamTravel >= range.foamTravel[0] && foamTravel <= range.foamTravel[1], `${zoneId} foam travel ${foamTravel}px must be ${range.foamTravel[0]}-${range.foamTravel[1]}px`);
    assert.ok(foamA.driftDurationSeconds >= range.foamDuration[0] && foamA.driftDurationSeconds <= range.foamDuration[1], `${zoneId} foam duration must be ${range.foamDuration[0]}-${range.foamDuration[1]}s`);
    const shimmerTravel = dayRapidsMotionTravelDistancePx(shimmer);
    assert.ok(shimmerTravel >= range.shimmerTravel[0] && shimmerTravel <= range.shimmerTravel[1], `${zoneId} shimmer travel ${shimmerTravel}px must be ${range.shimmerTravel[0]}-${range.shimmerTravel[1]}px`);
    assert.ok(shimmer.driftDurationSeconds >= range.shimmerDuration[0] && shimmer.driftDurationSeconds <= range.shimmerDuration[1], `${zoneId} shimmer duration must be ${range.shimmerDuration[0]}-${range.shimmerDuration[1]}s`);
    // foam A/B must be identical except for phase (delay)
    assert.equal(foamA.driftDx, foamB.driftDx);
    assert.equal(foamA.driftDy, foamB.driftDy);
    assert.equal(foamA.driftDurationSeconds, foamB.driftDurationSeconds);
    assert.notEqual(foamA.driftDelaySeconds, foamB.driftDelaySeconds, "foam A/B must be phase-offset, not synchronized");
    assert.equal(foamB.driftDelaySeconds, -(foamA.driftDurationSeconds / 2), "foam B must start exactly half a cycle ahead of foam A");
  }
});

test("DAY RAPIDS MOTION — the pulse layer in every zone has no position drift, only opacity variation", () => {
  for (const { layers } of DAY_RAPIDS_MOTION_ZONES) {
    const pulse = layers.find((l) => l.kind === "pulse");
    assert.equal(pulse.driftDx, undefined);
    assert.equal(pulse.driftDy, undefined);
    assert.ok(pulse.pulseDurationSeconds >= 10, "pulse must be slow/gentle, not flashing");
  }
});

test("DAY RAPIDS MOTION — component renders nothing outside DAY mode, uses real <img> assets (never SVG/generated shapes), and never references dusk/night/traffic/fountain code", () => {
  assert.match(layerSource, /if \(timeOfDay !== "DAY"\) return null;/);
  assert.match(layerSource, /<img/, "must use real PNG assets, not generated shapes");
  assert.doesNotMatch(layerSource, /<svg/i);
  const codeOnly = stripComments(layerSource);
  assert.doesNotMatch(codeOnly, /dusk|night|fountain|traffic/i);
});

test("DAY RAPIDS MOTION — the review gate requires a dev build AND an explicit ?dayRapidsMotionReview query param, and gates both zones together", () => {
  assert.match(layerSource, /if \(!isDayRapidsMotionReviewEnabled\(\)\) return null;/);
  assert.equal(resolveDayRapidsMotionReviewEnabled({ isDev: false, search: "?dayRapidsMotionReview=1" }), false, "must require a dev build");
  assert.equal(resolveDayRapidsMotionReviewEnabled({ isDev: true, search: "" }), false, "must require the query param");
  assert.equal(resolveDayRapidsMotionReviewEnabled({ isDev: true, search: "?dayRapidsMotionReview=0" }), false);
  assert.equal(resolveDayRapidsMotionReviewEnabled({ isDev: true, search: "?dayRapidsMotionReview=1" }), true);
  assert.equal(resolveDayRapidsMotionReviewEnabled({ isDev: true, search: "?dayRapidsMotionReview" }), true, "bare param must enable it");
});

test("DAY RAPIDS MOTION — fully isolated from the deferred DAY WATER / RAPIDS system: no shared imports, no cross-references in actual code", () => {
  assert.doesNotMatch(stripComments(layerSource), /dayWaterRegistry|MetaverseDayWaterLayer/);
  assert.doesNotMatch(stripComments(dayWaterLayerSource), /dayRapidsMotionRegistry|MetaverseDayRapidsMotionLayer/, "the deferred water layer must not have been modified to reference the new one");
  assert.doesNotMatch(stripComments(dayWaterRegistrySource), /dayRapidsMotion/i, "the deferred water registry must not have been touched");
});

test("DAY RAPIDS MOTION — reduced motion keeps the composition visible but static (no animation) in every zone", () => {
  assert.match(layerSource, /reducedMotion\s*\?\s*"none"/);
});

test("DAY RAPIDS MOTION — each sublayer is two nested elements (outer static rotation, inner animated glint) so rotation and animated transform never collide on one element", () => {
  assert.match(layerSource, /className=\{`met-day-rapids-motion__\$\{layer\.kind\}`\}/);
  assert.match(layerSource, /className="met-day-rapids-motion__glint"/);
});

test("DAY RAPIDS MOTION — every zone is mounted in MetaverseLivingCityLayer.jsx before clouds, in its own dedicated slot distinct from MetaverseDayWaterLayer", () => {
  const rapidsMotionIndex = livingCityLayerSource.indexOf("<MetaverseDayRapidsMotionLayer");
  const waterIndex = livingCityLayerSource.indexOf("<MetaverseDayWaterLayer");
  const cloudIndex = livingCityLayerSource.indexOf("<MetaverseDayCloudLayer");
  assert.ok(rapidsMotionIndex > -1, "MetaverseDayRapidsMotionLayer must be mounted");
  assert.ok(waterIndex < rapidsMotionIndex, "rapids motion mounts after the deferred water layer");
  assert.ok(rapidsMotionIndex < cloudIndex, "rapids motion must mount before clouds");
  // both zones come from ONE component mount, not two separate JSX mounts
  const mountCount = (livingCityLayerSource.match(/<MetaverseDayRapidsMotionLayer/g) || []).length;
  assert.equal(mountCount, 1, "only one component mount should exist; it renders both zones internally");
});

test("DAY RAPIDS MOTION — district markers/UI are NOT part of this component tree, so it structurally cannot render above them", () => {
  assert.doesNotMatch(layerSource, /MetaverseHotspot|Sidebar|MiniMap/);
});

test("DAY RAPIDS MOTION — CSS keyframes use continuous one-directional flow (never alternate) for foam/shimmer, and alternate only for the plain-opacity pulse", () => {
  assert.match(cssSource, /@keyframes metRapidsFoamFlow \{/);
  assert.match(cssSource, /@keyframes metRapidsShimmerFlow \{/);
  assert.match(cssSource, /@keyframes metRapidsMicroPulse \{/);
  const glintBlock = cssSource.match(/\n\.met-day-rapids-motion__glint \{[\s\S]*?\}/)[0];
  assert.doesNotMatch(glintBlock, /alternate/, "the shared glint rule must not default to alternate (that was the V1 bug)");
  const pulseBlock = cssSource.match(/\.met-day-rapids-motion__pulse \.met-day-rapids-motion__glint \{[\s\S]*?\}/)[0];
  assert.match(pulseBlock, /alternate/, "only the pulse layer's plain opacity breathing should use alternate");
});

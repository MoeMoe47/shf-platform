// DAY CLOUD PLACEMENT V1 tests.
// Registry values are checked directly (real data). Component/CSS
// behavior is checked via static source-text assertions, this repo's
// established frontend convention for the metaverse UI (no rendered-
// component harness is configured).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DAY_CLOUD_COMPANION_ROLES,
  DAY_CLOUD_LOWER_CLEARANCE_LINE,
  DAY_CLOUD_ROLES,
  isDayCloudRoleWithinLowerClearance,
  resolveDayCloudCompanions,
} from "../src/system/metaverse/dayCloudRegistry.js";

const layerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayCloudLayer.jsx", import.meta.url), "utf8");
const livingCityLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

// DAY CLOUD THICKNESS TUNING V2 — modest width/opacity increases and
// stronger existing synchronized companions; left/top anchors, assets,
// motion direction, and day-only rendering remain unchanged.
const EXPECTED_ROLES = {
  far_a: { role: "FAR_SKY_CLOUD_A", left: 8, top: 10, width: 18, opacity: 0.54, direction: "ltr" },
  far_b: { role: "FAR_SKY_CLOUD_B", left: 42, top: 8, width: 21, opacity: 0.51, direction: "ltr" },
  far_c: { role: "FAR_SKY_CLOUD_C", left: 73, top: 11, width: 18, opacity: 0.53, direction: "ltr" },
  skyline_band: { role: "MAIN_SKYLINE_CLOUD_BAND", left: 6, top: 26, width: 66, opacity: 0.45, direction: "rtl" },
  city_right: { role: "SECONDARY_RIGHT_CITY_CLOUD", left: 73, top: 32, width: 28, opacity: 0.36, direction: "rtl" },
  city_left: { role: "LOWER_LEFT_CITY_PASS_CLOUD", left: 2, top: 34, width: 23, opacity: 0.28, direction: "ltr" },
};

test("DAY CLOUD — exactly the 6 owner-approved roles exist, with the exact approved placement values", () => {
  assert.equal(DAY_CLOUD_ROLES.length, 6);
  for (const cloud of DAY_CLOUD_ROLES) {
    const expected = EXPECTED_ROLES[cloud.id];
    assert.ok(expected, `unexpected cloud id: ${cloud.id}`);
    assert.equal(cloud.role, expected.role);
    assert.equal(cloud.left, expected.left);
    assert.equal(cloud.top, expected.top);
    assert.equal(cloud.width, expected.width);
    assert.equal(cloud.opacity, expected.opacity);
    assert.equal(cloud.direction, expected.direction);
    assert.ok(cloud.blurPx >= 0.5 && cloud.blurPx <= 1, `blur ${cloud.blurPx}px must be in the approved 0.5-1px range`);
  }
});

test("DAY CLOUD THICKNESS V2 — companions exist ONLY for far_b, far_c, skyline_band, with controlled width/opacity/offset targets", () => {
  const EXPECTED_COMPANIONS = {
    far_b_companion: { parentId: "far_b", width: 22, opacity: 0.2, horizontalOffsetPct: 1.8, verticalOffsetPct: 0.8 },
    far_c_companion: { parentId: "far_c", width: 19, opacity: 0.19, horizontalOffsetPct: -1.6, verticalOffsetPct: 0.7 },
    skyline_band_companion: { parentId: "skyline_band", width: 68, opacity: 0.18, horizontalOffsetPct: 1.2, verticalOffsetPct: 0.9 },
  };
  const ids = DAY_CLOUD_COMPANION_ROLES.map((c) => c.id).sort();
  assert.deepEqual(ids, ["far_b_companion", "far_c_companion", "skyline_band_companion"]);
  for (const companion of DAY_CLOUD_COMPANION_ROLES) {
    const expected = EXPECTED_COMPANIONS[companion.id];
    assert.ok(expected, `unexpected companion id: ${companion.id}`);
    assert.equal(companion.parentId, expected.parentId);
    assert.equal(companion.width, expected.width);
    assert.equal(companion.opacity, expected.opacity);
    assert.equal(companion.horizontalOffsetPct, expected.horizontalOffsetPct);
    assert.equal(companion.verticalOffsetPct, expected.verticalOffsetPct);
  }
  // No duplicates for far_a, city_left, or city_right per the brief.
  const parentIds = DAY_CLOUD_COMPANION_ROLES.map((c) => c.parentId);
  assert.ok(!parentIds.includes("far_a"));
  assert.ok(!parentIds.includes("city_left"));
  assert.ok(!parentIds.includes("city_right"));
});

test("DAY CLOUD THICKNESS V1.1 — resolveDayCloudCompanions() places each companion at its parent's left/top plus its own offset, and inherits the parent's asset/motion (never separate/random movement)", () => {
  const resolved = resolveDayCloudCompanions();
  assert.equal(resolved.length, 3);
  for (const companion of resolved) {
    const parent = DAY_CLOUD_ROLES.find((r) => r.id === companion.parentId);
    assert.ok(parent, `${companion.id} must resolve to a real parent role`);
    assert.equal(companion.asset, parent.asset, `${companion.id} must use the exact same PNG as its parent`);
    assert.ok(Math.abs(companion.left - (parent.left + companion.horizontalOffsetPct)) < 1e-9);
    assert.ok(Math.abs(companion.top - (parent.top + companion.verticalOffsetPct)) < 1e-9);
    assert.equal(companion.blurPx, parent.blurPx);
    assert.equal(companion.direction, parent.direction);
    assert.equal(companion.speedPxPerSecond, parent.speedPxPerSecond);
    assert.equal(companion.driftStartPx, parent.driftStartPx);
    assert.equal(companion.driftEndPx, parent.driftEndPx);
    assert.equal(companion.durationSeconds, parent.durationSeconds);
    assert.equal(companion.driftDelaySeconds, parent.driftDelaySeconds);
    assert.deepEqual(companion.verticalDrift, parent.verticalDrift);
  }
});

test("DAY CLOUD THICKNESS V1.1 — every companion is dimmer than its parent (never reads as an obvious duplicate cloud)", () => {
  for (const companion of DAY_CLOUD_COMPANION_ROLES) {
    const parent = DAY_CLOUD_ROLES.find((r) => r.id === companion.parentId);
    assert.ok(companion.opacity < parent.opacity, `${companion.id} (${companion.opacity}) must be dimmer than its parent ${parent.id} (${parent.opacity})`);
  }
});

test("DAY CLOUD THICKNESS V1.1 — component renders companions BEFORE primaries in DOM order (no z-index on this layer), so every companion paints behind its primary", () => {
  const companionsMapIndex = layerSource.indexOf("companions.map(");
  const primariesMapIndex = layerSource.indexOf("DAY_CLOUD_ROLES.map(");
  assert.ok(companionsMapIndex > -1, "companions must be rendered");
  assert.ok(primariesMapIndex > -1, "primaries must be rendered");
  assert.ok(companionsMapIndex < primariesMapIndex, "companions must be mounted before primaries so they paint behind them");
});

test("DAY CLOUD THICKNESS V1.1 — a companion reuses its PARENT's drift keyframe (never its own independently-timed animation)", () => {
  assert.match(layerSource, /driftKeyframeId=\{companion\.parentId\}/);
  assert.match(layerSource, /animationName:\s*animationsFrozen \? "none" : `metCloudDrift-\$\{driftKeyframeId\}`/);
});

test("DAY CLOUD — final asset filenames match the approved six exactly", () => {
  const ids = DAY_CLOUD_ROLES.map((c) => c.id).sort();
  assert.deepEqual(ids, ["city_left", "city_right", "far_a", "far_b", "far_c", "skyline_band"]);
  for (const cloud of DAY_CLOUD_ROLES) {
    assert.equal(cloud.asset, `public/assets/metaverse/clouds/day/${cloud.id}.png`);
  }
});

test("DAY CLOUD — vertical drift amplitude/duration are each within the approved 4-10px / 18-35s ranges, and no two clouds share the same duration (never synchronized)", () => {
  const durations = new Set();
  for (const cloud of DAY_CLOUD_ROLES) {
    const { amplitudePx, durationSeconds } = cloud.verticalDrift;
    assert.ok(amplitudePx >= 4 && amplitudePx <= 10, `${cloud.id} vertical amplitude ${amplitudePx}px out of range`);
    assert.ok(durationSeconds >= 18 && durationSeconds <= 35, `${cloud.id} vertical duration ${durationSeconds}s out of range`);
    assert.ok(!durations.has(durationSeconds), `${cloud.id} vertical duration ${durationSeconds}s collides with another cloud — must never be synchronized`);
    durations.add(durationSeconds);
  }
});

test("DAY CLOUD — every horizontal drift keyframe boundary is genuinely off the 0-100% visible frame (so the infinite-loop reset is never visible, satisfying 'no abrupt resets')", () => {
  const REFERENCE_WIDTH = 1400;
  for (const cloud of DAY_CLOUD_ROLES) {
    const leftPx = (cloud.left / 100) * REFERENCE_WIDTH;
    const widthPx = (cloud.width / 100) * REFERENCE_WIDTH;
    for (const offsetPx of [cloud.driftStartPx, cloud.driftEndPx]) {
      const actualLeftEdge = leftPx + offsetPx;
      const actualRightEdge = actualLeftEdge + widthPx;
      const offscreen = actualRightEdge <= 0 || actualLeftEdge >= REFERENCE_WIDTH;
      assert.ok(offscreen, `${cloud.id} is not fully offscreen at offset ${offsetPx}px (edges ${actualLeftEdge}-${actualRightEdge} vs frame 0-${REFERENCE_WIDTH})`);
    }
  }
});

test("DAY CLOUD — horizontal drift direction (ltr/rtl) matches the approved role list, and duration is consistent with the requested px/s speed against the reference width", () => {
  for (const cloud of DAY_CLOUD_ROLES) {
    const travel = Math.abs(cloud.driftEndPx - cloud.driftStartPx);
    const impliedSpeed = travel / cloud.durationSeconds;
    assert.ok(Math.abs(impliedSpeed - cloud.speedPxPerSecond) < 0.5, `${cloud.id} implied speed ${impliedSpeed.toFixed(2)}px/s must match the declared speedPxPerSecond ${cloud.speedPxPerSecond}`);
    if (cloud.direction === "ltr") assert.ok(cloud.driftEndPx > cloud.driftStartPx);
    if (cloud.direction === "rtl") assert.ok(cloud.driftEndPx < cloud.driftStartPx);
  }
});

test("DAY CLOUD VISIBILITY DIAGNOSTIC — driftDelaySeconds is a negative animation-delay that lands each cloud exactly at its approved anchor (offset 0px) at t=0, so the composition is correct immediately on page load rather than after up to ~93s of drift", () => {
  for (const cloud of DAY_CLOUD_ROLES) {
    assert.ok(typeof cloud.driftDelaySeconds === "number" && cloud.driftDelaySeconds < 0, `${cloud.id} must define a negative driftDelaySeconds`);
    const elapsedAtLoad = -cloud.driftDelaySeconds;
    const fraction = elapsedAtLoad / cloud.durationSeconds;
    const offsetAtLoad = cloud.driftStartPx + fraction * (cloud.driftEndPx - cloud.driftStartPx);
    assert.ok(Math.abs(offsetAtLoad) < 1, `${cloud.id} must sit at offset ~0px (its anchor) at t=0, got ${offsetAtLoad.toFixed(2)}px`);
  }
});

test("DAY CLOUD V1.1 — each cloud sits at a distinct fraction of its own drift cycle at t=0 (no synchronized start), and each cycle wrap (driftDelaySeconds + durationSeconds) lands back on an off-screen boundary, not mid-frame", () => {
  const REFERENCE_WIDTH = 1400;
  const cycleFractionsAtLoad = new Set();
  for (const cloud of DAY_CLOUD_ROLES) {
    const elapsedAtLoad = -cloud.driftDelaySeconds;
    const fraction = elapsedAtLoad / cloud.durationSeconds;
    assert.ok(fraction > 0 && fraction < 1, `${cloud.id} cycle fraction at load (${fraction.toFixed(3)}) must be strictly inside one cycle`);
    assert.ok(!cycleFractionsAtLoad.has(fraction), `${cloud.id} shares an identical cycle fraction with another cloud — starts would be synchronized`);
    cycleFractionsAtLoad.add(fraction);

    // The animation always completes full loops of `durationSeconds`
    // starting from the CSS from-keyframe (elapsed = -driftDelaySeconds +
    // k*durationSeconds for integer k >= 0 all land on the SAME phase, the
    // `from` keyframe, i.e. driftStartPx) — so every wrap this cloud will
    // ever make reuses the same off-screen boundary already proven fully
    // offscreen elsewhere in this file, not a new mid-frame seam.
    const leftPx = (cloud.left / 100) * REFERENCE_WIDTH;
    const widthPx = (cloud.width / 100) * REFERENCE_WIDTH;
    const wrapLeftEdge = leftPx + cloud.driftStartPx;
    const wrapRightEdge = wrapLeftEdge + widthPx;
    const wrapIsOffscreen = wrapRightEdge <= 0 || wrapLeftEdge >= REFERENCE_WIDTH;
    assert.ok(wrapIsOffscreen, `${cloud.id} wrap boundary must stay offscreen so no reset is ever visible`);
  }
});

test("DAY CLOUD — lower-scene clearance: every role's top stays at/above the 45% clearance line (no heavy coverage of bridges/traffic/river/Mini Map)", () => {
  assert.equal(DAY_CLOUD_LOWER_CLEARANCE_LINE, 45);
  for (const cloud of DAY_CLOUD_ROLES) {
    assert.ok(isDayCloudRoleWithinLowerClearance(cloud), `${cloud.id} at top:${cloud.top}% violates the lower-scene clearance line`);
  }
});

test("DAY CLOUD — component renders nothing for DUSK/NIGHT (DAY-only), and never references a Dusk/Night cloud asset path or a bus/bird/rapids asset", () => {
  assert.match(layerSource, /if \(timeOfDay !== "DAY"\) return null;/);
  assert.doesNotMatch(layerSource, /clouds\/(dusk|night)\//i, "must not reference a dusk/night cloud asset path");
  assert.doesNotMatch(layerSource, /["'/](bus|bird|rapids|fountain)/i, "must not reference a bus/bird/rapids/fountain asset");
});

test("DAY CLOUD — reduced motion omits the animation entirely rather than freezing at the (off-screen) keyframe endpoint, so clouds stay visible and static", () => {
  assert.match(layerSource, /animationsFrozen \? "none" : `metCloudDrift-/);
  assert.match(layerSource, /animationsFrozen \? "none" : "metCloudVerticalDrift"/);
  assert.match(layerSource, /const animationsFrozen = reducedMotion \|\| debugEnabled;/);
});

test("DAY CLOUD VISIBILITY DIAGNOSTIC — component applies cloud.driftDelaySeconds as the horizontal drift's animationDelay", () => {
  assert.match(layerSource, /animationDelay:\s*animationsFrozen \? undefined : `\$\{cloud\.driftDelaySeconds\}s`/);
});

test("DAY CLOUD VISIBILITY DIAGNOSTIC — ?cloudDebug=1 is query-param-gated (absent by default) and only affects opacity/blur/outline, never the registered left/top/width placement", () => {
  assert.match(layerSource, /new URLSearchParams\(window\.location\.search\)\.has\("cloudDebug"\)/);
  assert.match(layerSource, /opacity: debugEnabled \? 1 : cloud\.opacity/);
  assert.match(layerSource, /filter: debugEnabled \? "none" : `blur/);
  assert.doesNotMatch(layerSource, /debugEnabled \? .*cloud\.left|debugEnabled \? .*cloud\.top|debugEnabled \? .*cloud\.width/, "debug mode must not alter placement");
  const cssSource2 = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
  assert.match(cssSource2, /\.met-day-cloud--debug\s*\{/);
});

test("DAY CLOUD — each cloud is two nested elements (outer horizontal-drift div, inner vertical-bob img) so the two motions never fight over the same transform", () => {
  assert.match(layerSource, /className=\{debugEnabled \? "met-day-cloud met-day-cloud--debug" : "met-day-cloud"\}/);
  assert.match(layerSource, /className="met-day-cloud__image"/);
});

test("DAY CLOUD — mounted in MetaverseLivingCityLayer.jsx BEFORE ambient/weather/building/traffic (layer order: city plate -> far sky clouds -> skyline band -> right/left city -> traffic -> markers -> UI)", () => {
  const cloudIndex = livingCityLayerSource.indexOf("<MetaverseDayCloudLayer");
  const ambientIndex = livingCityLayerSource.indexOf("<MetaverseAmbientLayer");
  const trafficIndex = livingCityLayerSource.indexOf("<MetaverseTrafficCorridorLayer");
  assert.ok(cloudIndex > -1, "MetaverseDayCloudLayer must be mounted");
  assert.ok(cloudIndex < ambientIndex, "clouds must render before ambient effects");
  assert.ok(cloudIndex < trafficIndex, "clouds must render before traffic (per the required layer order)");
});

test("DAY CLOUD — district markers/UI are NOT part of this component tree at all (they mount as later siblings in MetaverseCamera.jsx), so clouds structurally cannot render above them", () => {
  assert.doesNotMatch(layerSource, /MetaverseHotspot|Sidebar|MiniMap/);
});

test("DAY CLOUD — CSS defines a distinct keyframe per cloud (not colliding with the pre-existing decorative .met-living-ambient--clouds / @keyframes metCloudDrift)", () => {
  assert.match(cssSource, /@keyframes metCloudDrift-far_a/);
  assert.match(cssSource, /@keyframes metCloudDrift-far_b/);
  assert.match(cssSource, /@keyframes metCloudDrift-far_c/);
  assert.match(cssSource, /@keyframes metCloudDrift-skyline_band/);
  assert.match(cssSource, /@keyframes metCloudDrift-city_right/);
  assert.match(cssSource, /@keyframes metCloudDrift-city_left/);
  assert.match(cssSource, /@keyframes metCloudVerticalDrift/);
  // The pre-existing bare keyframe (unrelated decorative blob) must still
  // exist, untouched.
  assert.match(cssSource, /@keyframes metCloudDrift \{/);
});

test("DAY CLOUD — horizontal drift never uses animation-direction: alternate (that would be the forbidden bounce); only the vertical bob does", () => {
  const dayCloudBlock = cssSource.match(/\.met-day-cloud \{[\s\S]*?\}/)[0];
  assert.doesNotMatch(dayCloudBlock, /alternate/);
  const imageBlock = cssSource.match(/\.met-day-cloud__image \{[\s\S]*?\}/)[0];
  assert.match(imageBlock, /alternate/, "only the vertical bob (a small, intentional oscillation) uses alternate");
});

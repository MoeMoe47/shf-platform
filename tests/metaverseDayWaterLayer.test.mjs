// DAY WATER / RAPIDS V1 tests.
// Registry values are checked directly (real data). Component/CSS
// behavior is checked via static source-text assertions, same convention
// as tests/metaverseDayBirdLayer.test.mjs (no rendered-component harness
// is configured for the metaverse UI).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DAY_WATER_CLASSIFICATIONS,
  DAY_WATER_ELEMENTS,
  DAY_WATER_ZONES,
  isDayWaterElementOpacityRestrained,
  resolveDayWaterReviewEnabled,
} from "../src/system/metaverse/dayWaterRegistry.js";

const layerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayWaterLayer.jsx", import.meta.url), "utf8");
const livingCityLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("DAY WATER — exactly one zone for V1 (prioritize one clearly visible area before adding more), classified as rapids", () => {
  assert.equal(DAY_WATER_ZONES.length, 1, "V1 should implement and prove exactly one zone before adding more");
  const zone = DAY_WATER_ZONES[0];
  assert.equal(zone.classification, DAY_WATER_CLASSIFICATIONS.RAPIDS);
});

test("DAY WATER — the zone sits over real river water in the DAY plate (measured against the cable-stayed bridge crossing), not over land/roads", () => {
  const zone = DAY_WATER_ZONES[0];
  // Measured directly against silicon-heartland-city-day.png (1672x941):
  // the turbulent patch downstream of the cable-stayed bridge piers spans
  // roughly x 325-531, y 725-838px -> left ~19%, top ~77%.
  assert.ok(Math.abs(zone.left - 19) <= 2, `zone left ${zone.left}% should be ~19% (measured against the plate)`);
  assert.ok(Math.abs(zone.top - 77) <= 2, `zone top ${zone.top}% should be ~77% (measured against the plate)`);
  assert.ok(zone.width <= 15 && zone.height <= 15, "zone must stay small/localized, not river-wide");
});

test("DAY WATER — every element sits within its zone's bounds, and every element's opacity is within the approved 0.08-0.20 range", () => {
  const zone = DAY_WATER_ZONES[0];
  for (const el of DAY_WATER_ELEMENTS) {
    assert.ok(el.left >= zone.left && el.left <= zone.left + zone.width, `${el.id} left ${el.left}% must stay inside the zone`);
    assert.ok(el.top >= zone.top && el.top <= zone.top + zone.height, `${el.id} top ${el.top}% must stay inside the zone`);
    assert.ok(isDayWaterElementOpacityRestrained(el), `${el.id} opacity ${el.opacity} must be within 0.08-0.20`);
  }
});

test("DAY WATER — streaks are thin, flecks are tiny (no giant foam patches), and no two elements are identical shapes", () => {
  const streaks = DAY_WATER_ELEMENTS.filter((e) => e.kind === "streak");
  const flecks = DAY_WATER_ELEMENTS.filter((e) => e.kind === "fleck");
  assert.ok(streaks.length >= 1, "at least one streak element expected");
  for (const s of streaks) {
    assert.ok(s.heightPct <= 0.5, `${s.id} height ${s.heightPct}% must read as a thin highlight, not a wide band`);
    assert.ok(s.widthPct <= 6, `${s.id} width ${s.widthPct}% must stay small (no giant foam patch)`);
  }
  for (const f of flecks) {
    assert.ok(f.widthPct <= 1 && f.heightPct <= 1, `${f.id} must be a tiny fleck, not a large patch`);
  }
  const shapeKeys = DAY_WATER_ELEMENTS.map((e) => `${e.widthPct}x${e.heightPct}@${e.rotationDeg}`);
  assert.equal(new Set(shapeKeys).size, shapeKeys.length, "no two elements should be identical shapes (avoid repeated identical shapes)");
});

test("DAY WATER — drift/shimmer amplitude and duration stay restrained (slow, small, not chaotic), with staggered phase offsets so the zone never pulses in sync", () => {
  const driftDelays = new Set();
  const shimmerDelays = new Set();
  for (const el of DAY_WATER_ELEMENTS) {
    assert.ok(el.driftDx <= 5 && el.driftDy <= 5, `${el.id} drift amplitude must stay small (tiny directional shimmer, not a big arc)`);
    assert.ok(el.driftDurationSeconds >= 6 && el.driftDurationSeconds <= 14, `${el.id} drift duration ${el.driftDurationSeconds}s must be within 6-14s`);
    assert.ok(el.shimmerDurationSeconds >= 6 && el.shimmerDurationSeconds <= 14, `${el.id} shimmer duration ${el.shimmerDurationSeconds}s must be within 6-14s`);
    driftDelays.add(el.driftDelaySeconds);
    shimmerDelays.add(el.shimmerDelaySeconds);
  }
  assert.ok(driftDelays.size > 1, "drift delays must be staggered, not identical (the whole zone must not pulse simultaneously)");
  assert.ok(shimmerDelays.size > 1, "shimmer delays must be staggered, not identical");
});

test("DAY WATER — component renders nothing outside DAY mode, and never references dusk/night/fountain/traffic-aware code", () => {
  assert.match(layerSource, /if \(timeOfDay !== "DAY"\) return null;/);
  const codeOnly = layerSource.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(codeOnly, /dusk|night|fountain/i, "must not reference dusk/night/fountain in V1");
});

test("DAY WATER — DEFERRED: the whole layer (both the accepted overlay proof and the streak/fleck elements) is gated behind the review flag again, so nothing renders in the normal scene", () => {
  assert.match(layerSource, /if \(!isDayWaterReviewEnabled\(\)\) return null;/, "the component must early-return the whole layer behind the review flag while deferred");
  assert.doesNotMatch(layerSource, /const reviewEnabled/, "no split-gating variable should remain now that everything shares one gate");
  // resolveDayWaterReviewEnabled itself must still exist and still work —
  // review access is preserved even though nothing renders by default.
  assert.equal(resolveDayWaterReviewEnabled({ isDev: true, search: "?dayWaterReview=1" }), true);
  assert.equal(resolveDayWaterReviewEnabled({ isDev: true, search: "" }), false);
});

test("DAY WATER — reduced motion renders a static arrangement (no animation) at the approved opacity", () => {
  assert.match(layerSource, /animationName: reducedMotion \? "none" : "metWaterDrift, metWaterShimmer"/);
  assert.match(layerSource, /opacity: reducedMotion \? element\.opacity : undefined/);
});

test("DAY WATER — rotation (static) and drift animation (dynamic) live on two separate nested elements, never sharing one element's transform", () => {
  assert.match(layerSource, /className=\{`met-day-water__\$\{element\.kind\}`\}/);
  assert.match(layerSource, /className="met-day-water__glint"/);
  // the outer element only ever sets a static rotate(), never an animationName
  const outerDivMatch = layerSource.match(/<div\s+key=\{element\.id\}[\s\S]*?<div\s+className="met-day-water__glint"/)[0];
  const outerOnly = outerDivMatch.slice(0, outerDivMatch.lastIndexOf('<div\n            className="met-day-water__glint"'));
  assert.doesNotMatch(outerOnly, /animationName/, "the outer (rotated) element must never also carry an animation");
});

test("DAY WATER — mounted in MetaverseLivingCityLayer.jsx BEFORE clouds (required order: city plate -> water -> clouds -> birds -> markers -> UI)", () => {
  const waterIndex = livingCityLayerSource.indexOf("<MetaverseDayWaterLayer");
  const cloudIndex = livingCityLayerSource.indexOf("<MetaverseDayCloudLayer");
  const birdIndex = livingCityLayerSource.indexOf("<MetaverseDayBirdLayer");
  assert.ok(waterIndex > -1, "MetaverseDayWaterLayer must be mounted");
  assert.ok(waterIndex < cloudIndex, "water must mount before clouds, per the required layer order");
  assert.ok(cloudIndex < birdIndex, "clouds must still mount before birds (unchanged ordering)");
});

test("DAY WATER — district markers/UI are NOT part of this component tree at all, so water structurally cannot render above them", () => {
  assert.doesNotMatch(layerSource, /MetaverseHotspot|Sidebar|MiniMap/);
});

test("DAY WATER — CSS defines its own keyframes, distinct from cloud/bird keyframes, blur stays within the approved 0.5-1.5px range, and animation-direction is alternate (no visible loop reset)", () => {
  assert.match(cssSource, /@keyframes metWaterDrift \{/);
  assert.match(cssSource, /@keyframes metWaterShimmer \{/);
  const glintBlock = cssSource.match(/\n\.met-day-water__glint \{[\s\S]*?\}/)[0];
  assert.match(glintBlock, /alternate/, "must use alternate (sway back and forth), never a hard loop reset");
  const streakBlurMatch = cssSource.match(/\.met-day-water__streak \.met-day-water__glint \{[\s\S]*?filter:\s*blur\(([\d.]+)px\)/);
  const fleckBlurMatch = cssSource.match(/\.met-day-water__fleck \.met-day-water__glint \{[\s\S]*?filter:\s*blur\(([\d.]+)px\)/);
  assert.ok(streakBlurMatch, "streak must define a blur");
  assert.ok(fleckBlurMatch, "fleck must define a blur");
  assert.ok(parseFloat(streakBlurMatch[1]) <= 1.5, "streak blur must stay within the approved max");
  assert.ok(parseFloat(fleckBlurMatch[1]) <= 1.5, "fleck blur must stay within the approved max");
});

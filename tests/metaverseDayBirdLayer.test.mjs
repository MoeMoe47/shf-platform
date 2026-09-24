// DAY BIRD PLACEMENT V1 tests.
// Registry values are checked directly (real data). Component/CSS
// behavior is checked via static source-text assertions, same convention
// as tests/metaverseDayCloudPlacement.test.mjs (no rendered-component
// harness is configured for the metaverse UI).
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  DAY_BIRD_ASSETS,
  DAY_BIRD_DEPTH_TIERS,
  DAY_BIRD_GROUPS,
  DAY_BIRD_LANDMARK_KEEPOUTS,
  DAY_BIRD_TOTAL_COUNT,
  DAY_BIRDS,
  isDayBirdAnchorOutsideLandmarkKeepouts,
  resolveDayBirdsReviewEnabled,
} from "../src/system/metaverse/dayBirdRegistry.js";

const layerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayBirdLayer.jsx", import.meta.url), "utf8");
const livingCityLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseLivingCityLayer.jsx", import.meta.url), "utf8");
const cameraSource = readFileSync(new URL("../src/components/metaverse/MetaverseCamera.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");

const NIGHT_STYLE_SOURCE_ASSETS = ["bird_pair.png", "bird_flock_small.png"]; // never organized into the project — excluded as dusk/night-styled

const birdsDir = fileURLToPath(new URL("../public/assets/metaverse/birds/day/", import.meta.url));

test("DAY BIRD ASSET TRIM FIX — every bird uses a *_trim.png asset, the trimmed file exists and is smaller than its untouched original", () => {
  for (const bird of DAY_BIRDS) {
    assert.match(bird.asset, /_trim\.png$/, `${bird.id} must use a trimmed asset`);
    const trimmedPath = `${birdsDir}${bird.asset.split("/").pop()}`;
    const originalPath = trimmedPath.replace("_trim.png", ".png");
    assert.ok(existsSync(trimmedPath), `${trimmedPath} must exist`);
    assert.ok(existsSync(originalPath), `${originalPath} (untouched original) must still exist`);
    const trimmedSize = statSync(trimmedPath).size;
    const originalSize = statSync(originalPath).size;
    assert.ok(trimmedSize < originalSize, `${bird.asset} (${trimmedSize}b) should be smaller than its untouched original (${originalSize}b)`);
  }
});

test("DAY BIRD — exactly 6 birds across 3 groups (1 lone glider, 2 pair, 3 small flock)", () => {
  assert.equal(DAY_BIRD_TOTAL_COUNT, 6);
  assert.equal(DAY_BIRDS.length, 6);
  const byGroup = { lone_glider: 0, pair: 0, small_flock: 0 };
  for (const bird of DAY_BIRDS) {
    assert.ok(bird.group in byGroup, `${bird.id} has an unexpected group "${bird.group}"`);
    byGroup[bird.group] += 1;
  }
  assert.equal(byGroup[DAY_BIRD_GROUPS.LONE_GLIDER], 1);
  assert.equal(byGroup[DAY_BIRD_GROUPS.PAIR], 2);
  assert.equal(byGroup[DAY_BIRD_GROUPS.SMALL_FLOCK], 3);
});

test("DAY BIRD — every bird has a unique id and uses a real day-appropriate PNG asset path (never a night-styled source file)", () => {
  const ids = DAY_BIRDS.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length, "bird ids must be unique");
  const approvedAssets = new Set(Object.values(DAY_BIRD_ASSETS));
  for (const bird of DAY_BIRDS) {
    assert.ok(bird.asset.startsWith("public/assets/metaverse/birds/day/"), `${bird.id} must reference the real Day bird asset folder`);
    assert.ok(bird.asset.endsWith(".png"), `${bird.id} must reference a real PNG, not a generated shape`);
    assert.ok(approvedAssets.has(bird.asset), `${bird.id} must use one of the day-appropriate assets`);
    for (const excluded of NIGHT_STYLE_SOURCE_ASSETS) {
      assert.ok(!bird.asset.includes(excluded), `${bird.id} must not reference the excluded night-styled ${excluded}`);
    }
  }
});

test("DAY BIRD — Group A (Lone Glider) sits in the upper-right sky at the approved placement/size zone", () => {
  const bird = DAY_BIRDS.find((b) => b.group === DAY_BIRD_GROUPS.LONE_GLIDER);
  assert.ok(bird, "lone glider must exist");
  assert.ok(bird.left >= 80 && bird.left <= 86, `lone glider left ${bird.left}% must be within 80-86%`);
  assert.ok(bird.top >= 10 && bird.top <= 15, `lone glider top ${bird.top}% must be within 10-15%`);
  assert.ok(bird.widthPx >= DAY_BIRD_DEPTH_TIERS.NEAR.minPx && bird.widthPx <= DAY_BIRD_DEPTH_TIERS.NEAR.maxPx, "lone glider must be sized in the Near tier (20-24px)");
});

test("DAY BIRD — Group B (Pair) has 2 birds in the approved zone, with distinct size/Y-position/speed (and therefore distinct animation delay)", () => {
  const pair = DAY_BIRDS.filter((b) => b.group === DAY_BIRD_GROUPS.PAIR);
  assert.equal(pair.length, 2);
  for (const bird of pair) {
    assert.ok(bird.left >= 68 && bird.left <= 78, `${bird.id} left ${bird.left}% must be within 68-78%`);
    assert.ok(bird.top >= 11 && bird.top <= 18, `${bird.id} top ${bird.top}% must be within 11-18%`);
    assert.ok(bird.widthPx >= DAY_BIRD_DEPTH_TIERS.MID.minPx && bird.widthPx <= DAY_BIRD_DEPTH_TIERS.MID.maxPx, `${bird.id} must be sized in the Mid tier (14-18px)`);
  }
  const [a, b] = pair;
  assert.notEqual(a.widthPx, b.widthPx, "pair members must differ slightly in size");
  assert.notEqual(a.top, b.top, "pair members must differ slightly in Y position");
  assert.notEqual(a.speedPxPerSecond, b.speedPxPerSecond, "pair members must differ slightly in speed");
  assert.notEqual(a.driftDelaySeconds, b.driftDelaySeconds, "pair members must have a different animation delay");
});

test("DAY BIRD — Group C (Small Flock) has 2-3 birds, farther/smaller than Group A, in the approved zone", () => {
  const flock = DAY_BIRDS.filter((b) => b.group === DAY_BIRD_GROUPS.SMALL_FLOCK);
  assert.ok(flock.length >= 2 && flock.length <= 3, `expected 2-3 small-flock birds, got ${flock.length}`);
  const loneGlider = DAY_BIRDS.find((b) => b.group === DAY_BIRD_GROUPS.LONE_GLIDER);
  for (const bird of flock) {
    assert.ok(bird.left >= 74 && bird.left <= 90, `${bird.id} left ${bird.left}% must be within 74-90%`);
    assert.ok(bird.top >= 8 && bird.top <= 16, `${bird.id} top ${bird.top}% must be within 8-16%`);
    assert.ok(bird.widthPx >= DAY_BIRD_DEPTH_TIERS.FAR.minPx && bird.widthPx <= DAY_BIRD_DEPTH_TIERS.FAR.maxPx, `${bird.id} must be sized in the Far tier (8-12px)`);
    assert.ok(bird.widthPx < loneGlider.widthPx, `${bird.id} must read as farther away (smaller) than the lone glider`);
  }
});

test("DAY BIRD — depth/size logic: near > mid > far, and no bird is oversized", () => {
  const near = DAY_BIRDS.filter((b) => b.group === DAY_BIRD_GROUPS.LONE_GLIDER);
  const mid = DAY_BIRDS.filter((b) => b.group === DAY_BIRD_GROUPS.PAIR);
  const far = DAY_BIRDS.filter((b) => b.group === DAY_BIRD_GROUPS.SMALL_FLOCK);
  const maxNear = Math.max(...near.map((b) => b.widthPx));
  const minMid = Math.min(...mid.map((b) => b.widthPx));
  const maxMid = Math.max(...mid.map((b) => b.widthPx));
  const minFar = Math.min(...far.map((b) => b.widthPx));
  assert.ok(maxNear >= minMid, "near tier should not be smaller than mid tier's smallest bird");
  assert.ok(maxMid > minFar, "mid tier's largest should read closer than far tier's smallest");
  for (const bird of DAY_BIRDS) {
    assert.ok(bird.widthPx <= 28, `${bird.id} at ${bird.widthPx}px must not be oversized`);
  }
});

test("DAY BIRD — all six birds drift in the same direction (a calm, coherent sky), with opacity in the approved 0.72-0.92 range", () => {
  const directions = new Set(DAY_BIRDS.map((b) => b.direction));
  assert.equal(directions.size, 1, "all birds must move in the same sky direction");
  for (const bird of DAY_BIRDS) {
    assert.ok(bird.opacity >= 0.72 && bird.opacity <= 0.92, `${bird.id} opacity ${bird.opacity} must be within 0.72-0.92`);
    assert.ok(bird.blurPx <= 0.5, `${bird.id} blur ${bird.blurPx}px must stay very subtle (no heavy blur)`);
  }
});

test("DAY BIRD — no bird's static anchor sits inside a landmark keepout zone (Capitol dome / central spire)", () => {
  assert.equal(DAY_BIRD_LANDMARK_KEEPOUTS.length, 2);
  for (const bird of DAY_BIRDS) {
    assert.ok(isDayBirdAnchorOutsideLandmarkKeepouts(bird), `${bird.id} at left:${bird.left}%,top:${bird.top}% sits inside a landmark keepout zone`);
  }
});

test("DAY BIRD — every horizontal drift keyframe boundary is genuinely off the 0-100% visible frame (no visible loop reset)", () => {
  const REFERENCE_WIDTH = 1400;
  for (const bird of DAY_BIRDS) {
    const leftPx = (bird.left / 100) * REFERENCE_WIDTH;
    for (const offsetPx of [bird.driftStartPx, bird.driftEndPx]) {
      const actualLeftEdge = leftPx + offsetPx;
      const actualRightEdge = actualLeftEdge + bird.widthPx;
      const offscreen = actualRightEdge <= 0 || actualLeftEdge >= REFERENCE_WIDTH;
      assert.ok(offscreen, `${bird.id} is not fully offscreen at offset ${offsetPx}px (edges ${actualLeftEdge}-${actualRightEdge})`);
    }
    assert.ok(bird.driftEndPx > bird.driftStartPx, `${bird.id} must drift left-to-right (the shared sky direction)`);
  }
});

test("DAY BIRD — driftDelaySeconds lands every bird exactly at its authored anchor (offset 0px) at t=0, so birds are visible immediately on load", () => {
  for (const bird of DAY_BIRDS) {
    assert.ok(typeof bird.driftDelaySeconds === "number" && bird.driftDelaySeconds < 0, `${bird.id} must define a negative driftDelaySeconds`);
    const elapsedAtLoad = -bird.driftDelaySeconds;
    const fraction = elapsedAtLoad / bird.durationSeconds;
    const offsetAtLoad = bird.driftStartPx + fraction * (bird.driftEndPx - bird.driftStartPx);
    assert.ok(Math.abs(offsetAtLoad) < 1, `${bird.id} must sit at offset ~0px (its anchor) at t=0, got ${offsetAtLoad.toFixed(2)}px`);
  }
});

test("DAY BIRD — vertical bob is very small (no sudden flapping/rapid bobbing), and no two birds share a bob duration", () => {
  const durations = new Set();
  for (const bird of DAY_BIRDS) {
    const { amplitudePx, durationSeconds } = bird.verticalDrift;
    assert.ok(amplitudePx <= 3, `${bird.id} vertical amplitude ${amplitudePx}px must be very small`);
    assert.ok(durationSeconds >= 15, `${bird.id} vertical duration ${durationSeconds}s must stay calm, not rapid bobbing`);
    assert.ok(!durations.has(durationSeconds), `${bird.id} vertical duration ${durationSeconds}s collides with another bird`);
    durations.add(durationSeconds);
  }
});

test("DAY BIRD — birds move at a slow, believable speed with only slight variance between birds (no crazy speed differences)", () => {
  const speeds = DAY_BIRDS.map((b) => b.speedPxPerSecond);
  for (const speed of speeds) {
    assert.ok(speed >= 5 && speed <= 10, `speed ${speed}px/s should read as slow and believable`);
  }
  assert.equal(new Set(speeds).size, speeds.length, "every bird should have a slightly different speed");
});

function stripComments(source) {
  const noLineComments = source.replace(/\/\/.*$/gm, "");
  return noLineComments.replace(/\/\*[\s\S]*?\*\//g, "");
}

test("DAY BIRD — component renders nothing outside DAY mode, uses real <img> assets (never SVG/generated shapes), and never references dusk/night/event/traffic-aware code", () => {
  assert.match(layerSource, /if \(timeOfDay !== "DAY"\) return null;/);
  assert.match(layerSource, /<img/, "must render a real <img>, not a generated shape");
  assert.doesNotMatch(layerSource, /<svg/i, "must not use an SVG-generated shape");
  const codeOnly = stripComments(layerSource);
  assert.doesNotMatch(codeOnly, /dusk|night/i, "must not reference dusk/night in the bird layer");
  assert.doesNotMatch(codeOnly, /event|traffic/i, "must not reference event- or traffic-aware behavior");
});

test("DAY BIRD — PROMOTED TO NORMAL DAY SCENE: no review-gate check remains in the component; it renders purely off timeOfDay", () => {
  const codeOnly = stripComments(layerSource);
  assert.doesNotMatch(codeOnly, /isDayBirdsReviewEnabled/, "the component must no longer gate rendering behind the review flag");
  assert.doesNotMatch(codeOnly, /resolveDayBirdsReviewEnabled/, "the component must no longer import/use the review-gate resolver");
  // resolveDayBirdsReviewEnabled itself must still exist and still work
  // (harmlessly supported, per the promotion brief), just unused here.
  assert.equal(resolveDayBirdsReviewEnabled({ isDev: true, search: "?dayBirdsReview=1" }), true);
  assert.equal(resolveDayBirdsReviewEnabled({ isDev: true, search: "" }), false);
});

// UI UPGRADE V1 (superseded the earlier METAVERSE TIME-OF-DAY AUTHORITY
// FIX's "unconditional DAY default"): students no longer have ANY
// manual time-of-day control, and the scene runs on AUTO by default.
// dayBirdsReview (and dayWaterReview/dayRapidsMotionReview) still force
// DAY for a dev review session via the page's initial-state resolver —
// see tests/metaverseTimeOfDayAuthority.test.mjs for the full
// regression suite covering this.
test("DAY BIRD — MetaverseCityPage has no manual time-of-day preview buttons, and dayBirdsReview still forces DAY for a dev review session", () => {
  assert.doesNotMatch(cityPageSource, /\["AUTO", "DAY", "DUSK", "NIGHT"\]\.map/, "the manual preview buttons must be gone");
  assert.match(cityPageSource, /resolveDayBirdsReviewEnabled/, "the page must still be able to force DAY for a bird review session");
});

test("DAY BIRD — reduced motion omits the animation entirely (static arrangement) rather than freezing at the offscreen keyframe endpoint", () => {
  assert.match(layerSource, /animationName: reducedMotion \? "none" : "metBirdDrift"/);
  assert.match(layerSource, /animationName: reducedMotion \? "none" : "metBirdVerticalDrift"/);
});

test("DAY BIRD — each bird is two nested elements (outer horizontal-drift div, inner vertical-bob div) so the two motions never fight over the same transform", () => {
  assert.match(layerSource, /className="met-day-bird"/);
  assert.match(layerSource, /className="met-day-bird__bob"/);
  assert.match(layerSource, /className="met-day-bird__image"/);
});

test("DAY BIRD — mounted in MetaverseLivingCityLayer.jsx after traffic and before the debug layers (before markers/UI, which mount outside this component entirely)", () => {
  const birdIndex = livingCityLayerSource.indexOf("<MetaverseDayBirdLayer");
  const trafficIndex = livingCityLayerSource.indexOf("<MetaverseTrafficAllRoutesReviewLayer");
  assert.ok(birdIndex > -1, "MetaverseDayBirdLayer must be mounted");
  assert.ok(birdIndex > trafficIndex, "birds must mount after traffic, per the layer-order note");
});

test("DAY BIRD — no leftover temporary debug/review bird probe remains in MetaverseCamera.jsx", () => {
  assert.doesNotMatch(cameraSource, /bird-review|bird_glide_a\.png|data-test-probe/i);
});

test("DAY BIRD — district markers/UI are NOT part of this component tree at all, so birds structurally cannot render above them", () => {
  assert.doesNotMatch(layerSource, /MetaverseHotspot|Sidebar|MiniMap/);
});

test("DAY BIRD — CSS defines its own keyframes, distinct from the cloud keyframes, and horizontal drift never uses animation-direction: alternate", () => {
  assert.match(cssSource, /@keyframes metBirdDrift \{/);
  assert.match(cssSource, /@keyframes metBirdVerticalDrift \{/);
  const birdBlock = cssSource.match(/\.met-day-bird \{[\s\S]*?\}/)[0];
  assert.doesNotMatch(birdBlock, /alternate/);
  const bobBlock = cssSource.match(/\.met-day-bird__bob \{[\s\S]*?\}/)[0];
  assert.match(bobBlock, /alternate/, "only the vertical bob uses alternate");
});

test("DAY BIRD — no CSS glow filter is applied to birds", () => {
  const imageBlock = cssSource.match(/\.met-day-bird__image \{[\s\S]*?\}/)[0];
  assert.doesNotMatch(imageBlock, /glow|drop-shadow/i);
});

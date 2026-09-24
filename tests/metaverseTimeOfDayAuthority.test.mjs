// METAVERSE TIME-OF-DAY AUTHORITY — regression suite.
//
// UI UPGRADE V1 (PART 7/8) supersedes the previous "DAY unconditional
// default" policy: students no longer have ANY manual DAY/DUSK/NIGHT
// control at all (those buttons are removed entirely, not just
// defaulted away from), and the scene always runs on AUTO — the
// existing canonical resolver deriving DAY/DUSK/NIGHT from the real
// clock hour via fixed, deterministic windows. The one exception is a
// dev-build DAY review flag (dayBirdsReview, dayWaterReview,
// dayRapidsMotionReview, ...), which still forces DAY for the duration
// of that review — an explicit developer/admin mechanism, never a
// student-facing control.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  METAVERSE_TIME_OF_DAY_META,
  METAVERSE_TIME_OF_DAY_MODES,
  resolveMetaverseTimeOfDay,
} from "../src/system/metaverse/metaverseTimeOfDay.js";
import { resolveDayBirdsReviewEnabled } from "../src/system/metaverse/dayBirdRegistry.js";
import { resolveDayWaterReviewEnabled } from "../src/system/metaverse/dayWaterRegistry.js";
import { resolveDayRapidsMotionReviewEnabled } from "../src/system/metaverse/dayRapidsMotionRegistry.js";

const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const rapidsLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayRapidsMotionLayer.jsx", import.meta.url), "utf8");
const waterLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayWaterLayer.jsx", import.meta.url), "utf8");
const birdLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayBirdLayer.jsx", import.meta.url), "utf8");
const cloudLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayCloudLayer.jsx", import.meta.url), "utf8");

test("TIME-OF-DAY AUTHORITY — students have NO manual DAY/DUSK/NIGHT/AUTO controls anywhere in MetaverseCityPage.jsx", () => {
  assert.doesNotMatch(cityPageSource, /\["AUTO", "DAY", "DUSK", "NIGHT"\]\.map/, "the manual mode-picker button row must be gone");
  assert.doesNotMatch(cityPageSource, /setTimePreviewMode\(mode\)/, "no click handler may let a student pick a mode");
  assert.doesNotMatch(cityPageSource, /aria-label="Time of day preview"/, "the removed control's label must not remain");
});

// DEV MODE TIME-OF-DAY REVIEW CONTROLS supersedes this test's old
// "timePreviewMode has no setter at all" assertion: timePreviewMode is
// now a DERIVED value computed fresh every render from a 3-tier
// priority chain (feature review flag > ?metaverseDev=1 manual
// override > AUTO), never its own piece of settable state — see
// tests/metaverseDevModeTimeControls.test.mjs for the full regression
// suite covering the DEV toolbar itself.
test("TIME-OF-DAY AUTHORITY — the resolved mode is AUTO by default, a feature-review flag forces DAY with top priority, and no student control can ever set it", () => {
  assert.match(cityPageSource, /resolveDayBirdsReviewEnabled\(\{ isDev, search \}\) \|\|\s*\n\s*resolveDayWaterReviewEnabled\(\{ isDev, search \}\) \|\|\s*\n\s*resolveDayRapidsMotionReviewEnabled\(\{ isDev, search \}\)/, "every DAY-only review flag must still be able to force DAY");
  assert.match(cityPageSource, /const timePreviewMode = riverTraceEnabled \? "DAY" : \(reviewForcesDay \? "DAY" : \(devModeEnabled \? devTimeMode : "AUTO"\)\);/);
  assert.doesNotMatch(cityPageSource, /useState\("AUTO"\)/, "AUTO must never be written as timePreviewMode's OWN state — it's the fallback branch of the derived value");
});

test("TIME-OF-DAY AUTHORITY — a real clock tick drives BOTH the automatic resolver and the date/time status strip from one shared \"now\" (no duplicate timing logic)", () => {
  assert.match(cityPageSource, /const \[now, setNow\] = useState\(\(\) => new Date\(\)\);/);
  assert.match(cityPageSource, /setInterval\(\(\) => setNow\(new Date\(\)\), 30000\)/);
  assert.match(cityPageSource, /resolveMetaverseTimeOfDay\(\{ mode: timePreviewMode, date: now \}\)/, "the resolver must consume the same `now`, not a fresh unrelated Date()");
});

// AUTO resolves according to the real clock — this is the ONLY mode the
// student experience ever runs in (barring a dev review override), so
// this behavior must remain deterministic and stable (fixed hour
// windows, never random).
test("TIME-OF-DAY AUTHORITY — AUTO deterministically resolves DAY/DUSK/NIGHT from the clock hour, and the same hour always resolves the same way", () => {
  assert.equal(resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date(2026, 0, 1, 8, 0, 0) }), "DAY");
  assert.equal(resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date(2026, 0, 1, 18, 0, 0) }), "DUSK");
  assert.equal(resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date(2026, 0, 1, 22, 0, 0) }), "NIGHT");
  assert.equal(resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date(2026, 0, 1, 2, 0, 0) }), "NIGHT");
  // determinism: re-resolving the exact same hour on a different day
  // must always agree — no randomness, no session-dependent drift.
  for (const hour of [8, 18, 22, 2]) {
    const a = resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date(2026, 0, 1, hour, 0, 0) });
    const b = resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date(2026, 5, 15, hour, 30, 0) });
    assert.equal(a, b, `hour ${hour} must resolve identically regardless of the date/minute`);
  }
});

test("TIME-OF-DAY AUTHORITY — every DAY-only review flag resolver still works standalone (dev + explicit param, absent by default)", () => {
  for (const resolve of [resolveDayBirdsReviewEnabled, resolveDayWaterReviewEnabled, resolveDayRapidsMotionReviewEnabled]) {
    assert.equal(resolve({ isDev: false, search: "?dayBirdsReview=1&dayWaterReview=1&dayRapidsMotionReview=1" }), false, "must stay off outside a dev build");
  }
  assert.equal(resolveDayBirdsReviewEnabled({ isDev: true, search: "?dayBirdsReview=1" }), true);
  assert.equal(resolveDayWaterReviewEnabled({ isDev: true, search: "?dayWaterReview=1" }), true);
  assert.equal(resolveDayRapidsMotionReviewEnabled({ isDev: true, search: "?dayRapidsMotionReview=1" }), true);
});

test("TIME-OF-DAY AUTHORITY — every DAY-only layer (rapids, water, birds, clouds) still gates on timeOfDay === \"DAY\"", () => {
  for (const source of [rapidsLayerSource, waterLayerSource, birdLayerSource, cloudLayerSource]) {
    assert.match(source, /timeOfDay !== "DAY"/, "each DAY-only layer must still refuse to render outside DAY");
  }
});

test("TIME-OF-DAY AUTHORITY — rapids review flag's own layer gate is untouched (timeOfDay === \"DAY\" AND the flag)", () => {
  assert.match(rapidsLayerSource, /if \(timeOfDay !== "DAY"\) return null;/);
  assert.match(rapidsLayerSource, /if \(!isDayRapidsMotionReviewEnabled\(\)\) return null;/);
});

test("TIME-OF-DAY AUTHORITY — the persistent date/time status strip renders from the same resolvedTimeOfDay/now, with no manual time controls next to it", () => {
  assert.match(cityPageSource, /met-status-strip/);
  assert.match(cityPageSource, /now\.toLocaleDateString/);
  assert.match(cityPageSource, /now\.toLocaleTimeString/);
  assert.match(cityPageSource, />Auto Time</);
});

test("TIME-OF-DAY AUTHORITY — resolver metadata still declares this is presentation-only, using the learner's local browser time only in AUTO mode", () => {
  assert.equal(METAVERSE_TIME_OF_DAY_META.presentationOnly, true);
  assert.equal(METAVERSE_TIME_OF_DAY_META.usesLearnerLocalBrowserTime, true);
  assert.equal(METAVERSE_TIME_OF_DAY_META.grantsAuthority, false);
  assert.deepEqual(METAVERSE_TIME_OF_DAY_MODES, ["AUTO", "DAY", "DUSK", "NIGHT"], "AUTO/DUSK/NIGHT remain valid resolver modes even though only AUTO and a review-forced DAY are ever reachable from the UI now");
});

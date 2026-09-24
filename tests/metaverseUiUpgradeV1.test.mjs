// METAVERSE UI UPGRADE V1 — regression suite.
//
// Covers: (1) hover/focus/select-revealed district hotspot cards
// instead of permanently-visible cards, (2) the richer collapsible
// City Map panel (spatial canvas + text-equivalent list, data-driven
// markers only), (3) removal of student-facing manual DAY/DUSK/NIGHT
// controls plus the always-on automatic AUTO resolver, and (4) the
// persistent top-right date/time status strip. Uses this repo's
// established source-text-assertion convention (no rendered-component
// harness is configured for the metaverse UI).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const hotspotSource = readFileSync(new URL("../src/components/metaverse/MetaverseHotspot.jsx", import.meta.url), "utf8");
const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
const cloudLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayCloudLayer.jsx", import.meta.url), "utf8");
const birdLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayBirdLayer.jsx", import.meta.url), "utf8");
const rapidsLayerSource = readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayRapidsMotionLayer.jsx", import.meta.url), "utf8");

// 1. District cards hidden by default.
test("UI UPGRADE V1 — the hotspot label/state card is hidden by default (opacity 0, visibility hidden), not a permanently-visible card", () => {
  assert.match(cssSource, /\.met-hotspot__card\s*\{[^}]*opacity:\s*0;[^}]*visibility:\s*hidden;/s);
  assert.match(cssSource, /\.met-hotspot__card\s*\{[^}]*pointer-events:\s*none;/s);
});

// 2. Hover reveals the card.
test("UI UPGRADE V1 — hovering a hotspot reveals its card", () => {
  assert.match(cssSource, /\.met-hotspot:hover \.met-hotspot__card,/);
});

// 3. Keyboard focus reveals the card.
test("UI UPGRADE V1 — keyboard focus on a hotspot reveals its card", () => {
  assert.match(cssSource, /\.met-hotspot:focus \.met-hotspot__card,/);
  assert.match(cssSource, /\.met-hotspot:focus-within \.met-hotspot__card,/);
});

// 4. Mouse leave hides a hover-only card gracefully (not instantly).
test("UI UPGRADE V1 — a hover-only card hides with a short graceful delay (120-200ms), never an instant snap", () => {
  const match = cssSource.match(/\.met-hotspot__card\s*\{[^}]*transition:\s*opacity\s+(\d+)ms[^,]*,\s*visibility\s+0s\s+linear\s+(\d+)ms;/s);
  assert.ok(match, "the hide transition must exist on .met-hotspot__card");
  const [, fadeMs, delayMs] = match.map(Number).length ? match : [];
  const delay = Number(match[2]);
  assert.ok(delay >= 120 && delay <= 200, `hide delay ${delay}ms must be within the suggested 120-200ms range`);
  // reduced-motion respected: no bounce/strobe-fast timing anywhere new.
  assert.doesNotMatch(cssSource, /\.met-hotspot__card[\s\S]{0,200}(0\.1s|100ms|steps\()/);
});

// 5. Selected card persists regardless of mouse leave.
test("UI UPGRADE V1 — a selected hotspot's card stays open (.is-selected keeps it revealed) independent of hover/focus", () => {
  assert.match(cssSource, /\.met-hotspot\.is-selected \.met-hotspot__card\s*\{/);
  assert.match(hotspotSource, /selected \? "is-selected" : ""/);
  assert.match(hotspotSource, /aria-pressed=\{selected\}/);
});

// 6. ESC closes the selected card. This is the PRE-EXISTING
// selection/context-panel architecture (MetaverseContextPanel +
// closeAllDrawers), intentionally reused rather than rebuilt — ESC was
// already wired globally and already clears `selection` (which is what
// drives a hotspot's `selected`/`.is-selected` prop).
test("UI UPGRADE V1 — ESC closes the selected location context (reuses the existing global keydown + closeAllDrawers/selection wiring)", () => {
  assert.match(cityPageSource, /if \(event\.key === "Escape"\)/);
  assert.match(cityPageSource, /if \(anyDrawerOpen\)\s*\{\s*closeAllDrawers\(\);/);
  assert.match(cityPageSource, /const anyDrawerOpen = Boolean\(\s*\n\s*selection \|\|/);
  assert.match(cityPageSource, /const closeAllDrawers = \(\) => \{\s*\n\s*setSelection\(null\);/);
});

// 7/8. City Map collapses and reopens.
// MINIMAP V3 superseded the simple boolean expanded/collapsed toggle
// this test used to check with a persisted 3-state model (collapsed/
// compact/expanded) — see tests/metaverseMiniMapV3.test.mjs for the
// full regression suite covering that.
test("UI UPGRADE V1 — the City Map still has a toggle that's always rendered (never trapped inside a collapsed-only block)", () => {
  const toggleIndex = miniMapSource.indexOf("met-minimap__toggle");
  const headIndex = miniMapSource.indexOf('className="met-minimap__head"');
  assert.ok(toggleIndex > -1 && headIndex > -1 && toggleIndex > headIndex, "the toggle button must render inside the always-visible head");
});

// 9. Current student marker uses only real, authorized navigation state
// (which district the student has actually entered), never a
// fabricated position.
test("UI UPGRADE V1 — the City Map's \"you\" marker is driven by the real currentDistrictId (navigation state), not an invented position", () => {
  // FINAL RECONCILIATION V3.1 — PART 4: the marker now anchors to
  // youAreHereAnchorId (currentDistrictId, falling back to the last
  // REAL district actually visited this session — see
  // MetaverseCityPage.jsx's lastKnownDistrictId — so the marker stays
  // visible at the city overview too, never an invented position).
  assert.match(miniMapSource, /const isYou = district\.id === youAreHereAnchorId;/);
  assert.match(miniMapSource, /const youAreHereAnchorId = youAreHereDistrictId \|\| currentDistrictId;/);
  assert.match(cityPageSource, /districts=\{METAVERSE_DISTRICTS\}/);
  assert.match(cityPageSource, /currentDistrictId=\{districtId\}/);
  assert.match(cityPageSource, /youAreHereDistrictId=\{districtId \|\| lastKnownDistrictId\}/);
});

// 10. No fake other-student positions are ever generated — only the
// real per-district aggregate count (presence-contract.ts's
// online_count), never an individual marker for anyone else.
test("UI UPGRADE V1 — other students are represented ONLY as a per-district count badge, never as an individually-positioned marker", () => {
  assert.match(miniMapSource, /countForDistrict/);
  assert.match(miniMapSource, /presenceCounts\.find\(\(item\) => item\.district_id === districtId\)/);
  assert.doesNotMatch(miniMapSource, /Math\.random/, "no randomly-placed markers");
  // Exactly one marker per district — no nested loop plotting N other
  // students inside a district's marker.
  assert.match(miniMapSource, /districts\.map\(\(district\) => \{/);
  assert.doesNotMatch(miniMapSource, /presenceCounts\.map\(/, "presence data must only ever be looked up (count), never mapped into its own markers");
});

// 11. Student-facing manual DAY/DUSK/NIGHT controls are absent.
test("UI UPGRADE V1 — no manual DAY/DUSK/NIGHT/AUTO control exists anywhere in the student UI", () => {
  assert.doesNotMatch(cityPageSource, /\["AUTO", "DAY", "DUSK", "NIGHT"\]\.map/);
  assert.doesNotMatch(cityPageSource, /setTimePreviewMode\(mode\)/);
  assert.doesNotMatch(cityPageSource, /aria-label="Time of day preview"/);
});

// 12. The automatic (AUTO) time resolver remains active for students.
// DEV MODE TIME-OF-DAY REVIEW CONTROLS added a second, dev-only tier
// between "review flag" and "AUTO" — see
// tests/metaverseDevModeTimeControls.test.mjs for that suite; a real
// student (devModeEnabled always false) still falls through to AUTO.
test("UI UPGRADE V1 — the scene resolves time-of-day via the existing canonical AUTO resolver by default", () => {
  assert.match(cityPageSource, /const timePreviewMode = reviewForcesDay \? "DAY" : \(devModeEnabled \? devTimeMode : "AUTO"\);/);
  assert.match(cityPageSource, /resolveMetaverseTimeOfDay\(\{ mode: timePreviewMode, date: now \}\)/);
});

// 13. The date/time status strip is always visible (not behind any
// toggle, not removable).
test("UI UPGRADE V1 — the date/time status strip renders unconditionally, with no manual time buttons next to it", () => {
  const stripIndex = cityPageSource.indexOf('className="met-status-strip"');
  assert.ok(stripIndex > -1, "the status strip must exist");
  // It must not be wrapped in a conditional like `{someFlag ? (` on the
  // immediately preceding lines — a crude but effective always-on check
  // consistent with this file's other source-text tests.
  const precedingChunk = cityPageSource.slice(Math.max(0, stripIndex - 300), stripIndex);
  assert.doesNotMatch(precedingChunk, /\?\s*\(\s*$/, "the status strip must not be gated behind a conditional render");
});

// 14. Map markers remain data-driven (props/registry), never hardcoded.
test("UI UPGRADE V1 — City Map markers/events/counts are all sourced from props (registry/orchestration data), nothing hardcoded in the component", () => {
  assert.match(miniMapSource, /districts = \[\]/);
  assert.match(miniMapSource, /presenceCounts = \[\]/);
  assert.match(miniMapSource, /events = \[\]/);
  assert.doesNotMatch(miniMapSource, /"Avery|Marcus|Priya"/i, "no invented student names/sample data");
});

// 15. No unrelated Metaverse systems (background, birds, clouds,
// rapids) were touched by this UI-only upgrade.
test("UI UPGRADE V1 — background/bird/cloud/rapids layer components have no knowledge of the new City Map/status-strip/hotspot-card classes (isolation preserved)", () => {
  for (const source of [cloudLayerSource, birdLayerSource, rapidsLayerSource]) {
    assert.doesNotMatch(source, /met-citymap|met-status-strip|met-hotspot__card/);
  }
});

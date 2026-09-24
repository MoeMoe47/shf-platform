// MINIMAP FINAL VISUAL RECONCILIATION V3.1 — regression suite.
//
// Covers the seven scoped gaps from the V3.1 addendum: sidebar/minimap
// brightening, live marker-chip treatment (replacing baked-label
// reliance), the "you are here" marker's city-overview fallback
// anchor, adaptive label detail, the DEV-only Students Nearby face
// fixture, and the collapsed-pill click-target fix. Does NOT touch
// clouds/birds/rapids/traffic/trains/boats/backgrounds/district
// routing/time authority/DEV mode architecture.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveMiniMapFaceFixtureEnabled, getMiniMapLocationIcon } from "../src/system/metaverse/metaverseMiniMapRegistry.js";

const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("V3.1 — PART 4: the you-are-here marker anchors to a real last-known district at city overview, never an invented position", () => {
  assert.match(cityPageSource, /const \[lastKnownDistrictId, setLastKnownDistrictId\] = useState\(null\);/);
  assert.match(cityPageSource, /if \(districtId\) setLastKnownDistrictId\(districtId\);/);
  assert.match(cityPageSource, /youAreHereDistrictId=\{districtId \|\| lastKnownDistrictId\}/);
  assert.match(miniMapSource, /const youAreHereAnchorId = youAreHereDistrictId \|\| currentDistrictId;/);
  assert.match(miniMapSource, /const isYou = district\.id === youAreHereAnchorId;/);
  // "You are here" text is hover/focus-revealed only, never a
  // permanent inline label on the marker chip.
  assert.doesNotMatch(miniMapSource, /met-citymap__tag-name">\{[^}]*You/, "the tag chip itself must never carry a permanent You/You-are-here suffix");
  assert.match(miniMapSource, /isYou \? " — You are here" : ""/);
});

test("V3.1 — PART 3/5: district markers render a real icon+name chip, and reveal a status word only when zoomed in (adaptive labels)", () => {
  assert.match(miniMapSource, /getMiniMapLocationIcon\(district\.id\)/);
  assert.match(miniMapSource, /met-citymap__tag-icon/);
  assert.match(miniMapSource, /met-citymap__tag-name/);
  assert.match(miniMapSource, /met-citymap__tag--detailed/);
  assert.match(miniMapSource, /denseMarkers \? <span className="met-citymap__tag-status">\{statusLabel\}<\/span> : null/);
  assert.match(miniMapSource, /\{denseMarkers \? \(district\.fullLabel \|\| district\.label\) : mapTagLabel\(district\.label\)\}/, "broad view must stay the short name; only zoomed-in reveals the full name");
  assert.match(cssSource, /\.met-citymap__tag--detailed \{/);
  for (const id of ["civic-district", "career-education-district", "data-center-district"]) {
    assert.ok(getMiniMapLocationIcon(id), `${id} must resolve a real registry icon`);
  }
});

test("V3.1 — PART 3: a scrim dims the baked-label base map art without covering the live marker chips (BASE-ASSET limitation, image itself not regenerated)", () => {
  assert.match(miniMapSource, /<span className="met-citymap__canvas-scrim" aria-hidden="true" \/>/);
  const scrimIdx = miniMapSource.indexOf('className="met-citymap__canvas-scrim"');
  const markersIdx = miniMapSource.indexOf("districts.map((district)");
  assert.ok(scrimIdx > -1 && markersIdx > scrimIdx, "the scrim must be the FIRST child inside canvas-inner so markers (later in DOM order) paint above it");
  assert.match(cssSource, /\.met-citymap__canvas-scrim \{/);
});

test("V3.1 — PART 6: a DEV-only, explicitly-flagged face fixture exists for visual QA, and can never leak into production or override real roster data", () => {
  assert.equal(resolveMiniMapFaceFixtureEnabled({ isDev: false, search: "?minimapFaceFixture=1" }), false, "must stay off outside a dev build even with the flag present");
  assert.equal(resolveMiniMapFaceFixtureEnabled({ isDev: true, search: "" }), false, "must stay off without the explicit flag");
  assert.equal(resolveMiniMapFaceFixtureEnabled({ isDev: true, search: "?minimapFaceFixture=1" }), true);
  assert.match(miniMapSource, /const usingFaceFixture = !activeRoomParticipants && faceFixtureMode;/, "a real activeRoomParticipants value must always win over the fixture");
  assert.match(miniMapSource, /const effectiveRoomParticipants = activeRoomParticipants \|\| \(faceFixtureMode \? DEV_FIXTURE_ROOM : null\);/);
  // Fixture identities are unmistakably labeled as fixtures, never a
  // realistic-looking invented name.
  assert.match(miniMapSource, /display_name: "Fixture /);
  assert.match(miniMapSource, /met-citymap__fixture-badge/);
});

test("V3.1 — PART 6: the Students Nearby face renders a real avatar image when present, and always falls back to real initials otherwise (no fake photos)", () => {
  assert.match(miniMapSource, /participant\.avatar_url \? \(/);
  assert.match(miniMapSource, /met-citymap__student-photo/);
  assert.match(miniMapSource, /initialsFor\(participant\.display_name\)/);
});

test("V3.1 — PART 7: the collapsed City Map pill is pinned clear of the global assistant FAB and has a >=44px usable click target", () => {
  assert.match(cssSource, /\.met-minimap\.met-citymap--collapsed \{[\s\S]{0,120}position: fixed;/);
  assert.match(cssSource, /\.met-minimap\.met-citymap--collapsed \{[\s\S]{0,200}z-index: 95;/);
  assert.match(cssSource, /\.met-minimap\.met-citymap--collapsed \.met-minimap__head \{\s*\n\s*padding: 12px 14px;\s*\n\s*min-height: 44px;/);
  assert.match(cssSource, /\.met-minimap\.met-citymap--collapsed \.met-minimap__toggle \{\s*\n\s*width: 32px;\s*\n\s*height: 32px;/);
  // The whole pill (not just the small chevron button) is clickable
  // while collapsed, for a much larger real hit area.
  assert.match(miniMapSource, /onClick=\{mapState === "collapsed" \? \(\) => setMapStateAndPersist\("expanded"\) : undefined\}/);
});

test("V3.1/V7 — sidebar body is navy, with cyan lighting and selected sidebar items visibly brighter still", () => {
  // SIDEBAR V7 keeps the no-frost, real 180deg shell gradient, but the
  // shell is now navy and the cyan/sky-blue values are edge lighting.
  assert.match(cssSource, /--met-sidebar-shell-top: #08345f;/);
  assert.match(cssSource, /--met-sidebar-shell-mid: #062b50;/);
  assert.match(cssSource, /--met-sidebar-shell-bottom: #041f3a;/);
  assert.match(cssSource, /\.met-sidebar \{[^}]*background:\s*\n\s*radial-gradient\(circle at 0% 0%, rgba\(123, 220, 255, 0\.14\)/);
  assert.match(cssSource, /\.met-sidebar \{[^}]*linear-gradient\(180deg, var\(--met-sidebar-shell-top\) 0%, var\(--met-sidebar-shell-mid\) 45%, var\(--met-sidebar-shell-bottom\) 100%\);/);
  assert.match(cssSource, /\.met-minimap\.met-citymap \{[^}]*background: linear-gradient\(165deg, rgba\(\d+, \d+, \d+, 0\.\d+\) 0%, rgba\(\d+, \d+, \d+, 0\.\d+\) 100%\);/);
  assert.match(cssSource, /--met-sidebar-active-start: #0c68c3;/);
  assert.match(cssSource, /--met-sidebar-active-end: #45bdfb;/);
  assert.match(cssSource, /\.met-sidebar__item\[aria-current="true"\],\s*\n\.met-sidebar__item\[aria-expanded="true"\] \{[^}]*background:\s*\n\s*linear-gradient\(180deg, rgba\(238, 254, 255, 0\.28\), transparent 34%\),/);
});

test("V3.1 — scope discipline: no traffic/trains/boats/clouds/rapids/background/time-authority/DEV-mode-architecture systems were touched", () => {
  for (const source of [
    readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayCloudLayer.jsx", import.meta.url), "utf8"),
    readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayBirdLayer.jsx", import.meta.url), "utf8"),
    readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayRapidsMotionLayer.jsx", import.meta.url), "utf8"),
  ]) {
    assert.doesNotMatch(source, /minimapFaceFixture|youAreHereAnchorId|met-citymap__canvas-scrim/);
  }
  assert.match(cityPageSource, /const timePreviewMode = riverTraceEnabled \? "DAY" : \(reviewForcesDay \? "DAY" : \(devModeEnabled \? devTimeMode : "AUTO"\)\);/, "time authority priority chain must be unchanged");
});

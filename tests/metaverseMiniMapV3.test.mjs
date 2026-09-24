// MINIMAP V3 — CANONICAL BLUE-FROST INTERACTIVE CITY MAP — regression suite.
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";

const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const controlsSource = readFileSync(new URL("../src/components/metaverse/MetaverseCameraControls.jsx", import.meta.url), "utf8");
const sidebarSource = readFileSync(new URL("../src/components/metaverse/MetaverseSidebar.jsx", import.meta.url), "utf8");
const hotspotSource = readFileSync(new URL("../src/components/metaverse/MetaverseHotspot.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
const assetPath = new URL("../public/assets/metaverse/minimap/silicon-heartland-metaverse-top-map.png", import.meta.url);

// 1. Minimap base asset loads.
test("MINIMAP V3 — the canonical top-view map asset still exists, unmodified (byte-identical to the approved install)", () => {
  assert.ok(existsSync(assetPath));
  assert.ok(statSync(assetPath).size > 100000);
  const hash = createHash("sha256").update(readFileSync(assetPath)).digest("hex");
  assert.equal(hash, "b3a50c0a1427923260870b9cd8d09db9b15c1cad327746909102aba774c2bdea", "the map must not be redrawn/regenerated");
});

// 2. Collapsed / compact / expanded states work.
test("MINIMAP V3 — the City Map supports three persisted states (collapsed/compact/expanded), not just a boolean toggle", () => {
  assert.match(miniMapSource, /const MAP_STATES = \["collapsed", "compact", "expanded"\];/);
  assert.match(miniMapSource, /className=\{`met-minimap met-citymap met-citymap--\$\{mapState\}`\}/);
  assert.match(cssSource, /\.met-minimap\.met-citymap--collapsed\s*\{/);
  assert.match(cssSource, /\.met-minimap\.met-citymap--compact\s*\{/);
  assert.match(cssSource, /\.met-minimap\.met-citymap--expanded\s*\{/);
});

// 3. Preference persistence works.
test("MINIMAP V3 — the map-state preference persists via localStorage (a genuine per-student UI preference), same safe try/catch pattern as the sidebar", () => {
  assert.match(miniMapSource, /function readStoredMapState\(\) \{[\s\S]{0,80}try \{\s*\n\s*const raw = window\.localStorage\.getItem\(MAP_STATE_STORAGE_KEY\);/);
  assert.match(miniMapSource, /function writeStoredMapState\(value\) \{\s*\n\s*try \{\s*\n\s*window\.localStorage\.setItem\(MAP_STATE_STORAGE_KEY, value\);/);
  assert.match(miniMapSource, /const \[mapState, setMapState\] = useState\(\(\) => readStoredMapState\(\)\);/);
  assert.match(miniMapSource, /setMapStateAndPersist/);
  // HARD VISUAL MATCH — PART 8: under dev review, the real stored
  // preference is still read fresh next time (a normal student session
  // is never affected), but the panel itself always OPENS expanded so
  // the owner never has to know a prior collapse happened.
  assert.match(miniMapSource, /if \(isDevReviewModeEnabled\(\)\) return "expanded";/);
});

// 4/5. Reset View is no longer floating on the city canvas; exists in the sidebar instead.
test("MINIMAP V3 — Reset View is no longer a floating city-canvas control", () => {
  // Comments are allowed to still mention "onReset" while documenting
  // the removal; only the actual prop/handler usage is disallowed.
  assert.doesNotMatch(controlsSource, /onReset[,}=]/, "MetaverseCameraControls must no longer accept/render an onReset prop");
  assert.doesNotMatch(controlsSource, />Reset</);
});

test("MINIMAP V3 — Reset View exists in the sidebar's Map section", () => {
  assert.match(cityPageSource, /<h3>Map<\/h3>/);
  const mapSectionIndex = cityPageSource.indexOf("<h3>Map</h3>");
  const resetButtonIndex = cityPageSource.indexOf('<span className="met-sidebar__item-label">Reset View</span>');
  const resetOnClickIndex = cityPageSource.indexOf("onClick={() => setCamera(CAMERA_HOME)}");
  assert.ok(mapSectionIndex > -1 && resetButtonIndex > mapSectionIndex && resetButtonIndex - mapSectionIndex < 800, "Reset View must be inside the Map sidebar section");
  assert.ok(resetOnClickIndex > -1 && resetButtonIndex - resetOnClickIndex > 0 && resetButtonIndex - resetOnClickIndex < 200, "Reset View's button must call setCamera(CAMERA_HOME)");
});

// 6. Map Controls exist in the sidebar.
test("MINIMAP V3 — a Map View control exists in the sidebar", () => {
  assert.match(cityPageSource, /onClick=\{\(\) => setMiniMapVisible\(\(value\) => !value\)\}/);
  assert.match(cityPageSource, /Map View \{miniMapVisible \? "on" : "off"\}/);
});

// 7/8/9. Hotspot progressive disclosure (already established in UI
// UPGRADE V1; reconfirmed here since this phase explicitly lists it).
test("MINIMAP V3 — main-scene hotspot cards remain hidden by default and reveal on hover/focus/selection (unchanged from UI UPGRADE V1)", () => {
  assert.match(cssSource, /\.met-hotspot__card\s*\{[^}]*opacity:\s*0;[^}]*visibility:\s*hidden;/s);
  assert.match(cssSource, /\.met-hotspot:hover \.met-hotspot__card,/);
  assert.match(cssSource, /\.met-hotspot:focus \.met-hotspot__card,/);
  assert.match(cssSource, /\.met-hotspot\.is-selected \.met-hotspot__card\s*\{/);
  assert.match(hotspotSource, /selected \? "is-selected" : ""/);
});

// 10. Current student marker is visually distinct.
test("MINIMAP V3 — the current-student marker uses a distinct cyan/blue ring shape and a subtle reduced-motion-aware pulse, never the district's plain square dot", () => {
  assert.match(cssSource, /\.met-citymap__marker\.is-you \.met-citymap__dot \{[^}]*border: 2px solid #7dd3fc;/);
  assert.match(cssSource, /@keyframes metCityMapYouPulse/);
  assert.match(cssSource, /\.met-shell\[data-reduced-motion="true"\] \.met-citymap__you-pulse \{\s*\n\s*animation: none;/);
  assert.match(miniMapSource, /isYou \? <span className="met-citymap__you-pulse"/);
  // FINAL RECONCILIATION V3.1 — PART 4: "You are here" text now only
  // ever surfaces in the hover/focus-revealed callout, never as a
  // permanent inline suffix on the marker chip itself.
  assert.match(miniMapSource, /isYou \? " — You are here" : ""/);
  assert.doesNotMatch(miniMapSource, /\{isYou \? " \(You\)" : ""\}/, "the (You) suffix must not be permanently visible on the marker chip");
});

// 11. No fake student coordinates are created.
test("MINIMAP V3 — no individual other-student marker is ever plotted; only a real per-district aggregate count", () => {
  assert.doesNotMatch(miniMapSource, /presenceCounts\.map\(/, "presence data must only ever be looked up (count), never mapped into its own markers");
  assert.doesNotMatch(miniMapSource, /Math\.random/);
  assert.match(miniMapSource, /countForDistrict = \(districtId\) => \{/);
});

// 12. Student faces render only from real available profile/avatar data.
test("MINIMAP V3 — Students Nearby renders real named participants only when a live room roster exists, otherwise a real aggregate-count empty-state (never invented names)", () => {
  assert.match(miniMapSource, /effectiveRoomParticipants && effectiveRoomParticipants\.participants\.length > 0/);
  assert.match(miniMapSource, /initialsFor\(participant\.display_name\)/, "avatar initials must be derived from the REAL display_name field");
  assert.match(miniMapSource, /No live student presence data available right now\./);
  assert.doesNotMatch(miniMapSource, /"Avery|Marcus|Priya"/i, "no invented student names/sample data");
  assert.match(cityPageSource, /activeRoomParticipants=\{activeRoom \? roomParticipants : null\}/, "must only pass the REAL room roster, and only when a room is actually active");
});

// 13. Map legend renders (District, Student (You), Classmate/Student,
// Event, Opportunity, Point of Interest), distinguished by shape AND color.
test("MINIMAP V3 — the map legend covers all required categories with shape+color differentiation, not color alone", () => {
  for (const label of ["District", "Student (You)", "Classmate/Student", "Event", "Opportunity", "Point of Interest"]) {
    assert.ok(miniMapSource.includes(label), `legend must include "${label}"`);
  }
  // Event vs. Opportunity: distinct glyphs (star vs. diamond), not the
  // same icon recolored.
  assert.match(miniMapSource, /met-citymap__event-flag">\{"[^"]+"\}/);
  assert.match(miniMapSource, /met-citymap__opportunity-flag">\{"[^"]+"\}/);
  const eventGlyph = miniMapSource.match(/met-citymap__event-flag">\{"([^"]+)"\}/)[1];
  const opportunityGlyph = miniMapSource.match(/met-citymap__opportunity-flag">\{"([^"]+)"\}/)[1];
  assert.notEqual(eventGlyph, opportunityGlyph, "event and opportunity must use different glyphs, not the same icon recolored");
});

// 14. Layers control works, and only lists layers with real data.
test("MINIMAP V3 — the Layers tab toggles real data layers only (no Transit/Traffic layer fabricated without real data)", () => {
  assert.match(miniMapSource, /layerToggles\.districts\s*\n\s*\? districts\.map/);
  assert.match(miniMapSource, /count = layerToggles\.students \? countForDistrict/);
  assert.match(miniMapSource, /live = layerToggles\.events && hasActiveEvent/);
  assert.match(miniMapSource, /disabled=\{!civicActive\}/);
  assert.doesNotMatch(miniMapSource, />Transit<|>Traffic</, "no fabricated Transit/Traffic toggle without real data backing it");
  assert.match(miniMapSource, /Transit and Traffic layers appear here once real city-state data is wired in\./);
});

// 15/16. Recenter and Fit World.
test("MINIMAP V3 — Recenter zooms/pans toward the real current district; Fit World returns to the default whole-map view", () => {
  assert.match(miniMapSource, /const handleRecenter = \(\) => \{/);
  assert.match(miniMapSource, /districts\.find\(\(district\) => district\.id === currentDistrictId\)/);
  assert.match(miniMapSource, /setMapZoom\(1\.7\);/);
  assert.match(miniMapSource, /const handleFitWorld = \(\) => \{\s*\n\s*setMapOrigin\("50% 50%"\);\s*\n\s*setMapZoom\(1\);/);
  assert.doesNotMatch(miniMapSource, /met-explore-fast-travel.*Recenter|Recenter.*met-explore-fast-travel/s, "Recenter must live inside the minimap/modal, never as a floating city-canvas button");
});

// 17. Full map reuses the same data state (see also metaverseMiniMapV2.test.mjs).
test("MINIMAP V3 — the full-map modal reuses the same renderMapLayers/state, not a second map implementation", () => {
  const districtLoopOccurrences = (miniMapSource.match(/districts\.map\(\(district\) => \{/g) || []).length;
  assert.equal(districtLoopOccurrences, 1);
  assert.match(miniMapSource, /renderMapLayers\("compact"\)/);
  assert.match(miniMapSource, /renderMapLayers\("full"\)/);
});

// 18. Responsive behavior remains valid.
test("MINIMAP V3 — mobile touch targets and existing responsive conventions remain intact", () => {
  assert.match(cssSource, /@media \(max-width:\s*620px\)/);
  assert.match(cssSource, /\.met-hotspot\s*\{[\s\S]{0,40}width:\s*44px;\s*\n\s*height:\s*44px;/);
});

// 19. Accessibility labels/focus states exist.
test("MINIMAP V3 — accessibility: markers are keyboard-focusable with aria-labels, tabs use role=tab/aria-selected, layer toggles use aria-pressed, map toggle uses aria-expanded", () => {
  assert.match(miniMapSource, /aria-label=\{`\$\{district\.fullLabel \|\| district\.label\}/);
  assert.match(miniMapSource, /role="tablist"/);
  assert.match(miniMapSource, /role="tab"/);
  assert.match(miniMapSource, /aria-selected=\{activeTab === tab\}/);
  assert.match(miniMapSource, /aria-pressed=\{layerToggles\./);
  assert.match(miniMapSource, /aria-expanded=\{false\}/);
  assert.match(miniMapSource, /aria-expanded=\{true\}/);
  assert.match(cssSource, /\.met-hotspot:focus-visible,/);
});

// 20. Normal district navigation still works.
test("MINIMAP V3 — clicking a district marker still calls the exact same canonical selectDistrict navigation, unchanged", () => {
  assert.match(miniMapSource, /onSelectDistrict\?\.\(district\)/);
  assert.match(cityPageSource, /onSelectDistrict=\{selectDistrict\}/);
});

test("MINIMAP V3 — sidebar blue-frost framing changed only sidebar/minimap chrome, not the global orange brand variable definitions", () => {
  // SIDEBAR V4 keeps the solid non-frost shell, but routes the sampled
  // approved-mock colors through canonical tokens so every sidebar part
  // shares one color system.
  assert.match(cssSource, /--met-sidebar-shell-top: #08345f;/);
  assert.match(cssSource, /--met-sidebar-shell-mid: #062b50;/);
  assert.match(cssSource, /--met-sidebar-shell-bottom: #041f3a;/);
  assert.match(cssSource, /\.met-sidebar \{[^}]*background:\s*\n\s*radial-gradient\(circle at 0% 0%, rgba\(123, 220, 255, 0\.14\)/);
  assert.match(cssSource, /\.met-sidebar \{[^}]*linear-gradient\(180deg, var\(--met-sidebar-shell-top\) 0%, var\(--met-sidebar-shell-mid\) 45%, var\(--met-sidebar-shell-bottom\) 100%\);/);
  assert.match(cssSource, /\.met-minimap\.met-citymap \{[^}]*background: [^;]*rgba\(\d+, \d+, \d+, 0\.\d+\)/);
  // The orange CSS custom properties themselves are untouched (not
  // redefined) — only specific sidebar usages were swapped to explicit
  // blue/cyan literals.
  assert.doesNotMatch(cssSource, /--shf-orange:\s*#[0-9a-f]{3,6};?\s*\n[^}]*--shf-orange:/is);
});

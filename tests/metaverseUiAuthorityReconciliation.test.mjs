// UI AUTHORITY RECONCILIATION — regression suite.
//
// Owner decision: the sidebar is now the canonical navigation/control
// authority for the Metaverse city page, superseding the older
// MET-7/MET-8/MET-9/MET-10 UI direction that also required a floating
// lower-right Locations/Missions/Opportunity Exchange cluster on the
// city canvas (MetaverseCameraControls.jsx). This file documents and
// proves the supersession: the underlying capabilities (opening the
// Navigator/Missions/Opportunities panels) are unchanged and still
// required — only the DUPLICATE floating presentation is removed.
// MET-7/MET-8's own test files carry matching "(superseded)" tests
// covering the Missions/Opportunities half of this; this file covers
// Locations/Explore plus the cluster-wide "no duplicate" and
// "navigation still works" checks called out explicitly in the
// reconciliation brief.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const controlsSource = readFileSync(new URL("../src/components/metaverse/MetaverseCameraControls.jsx", import.meta.url), "utf8");
const sidebarSource = readFileSync(new URL("../src/components/metaverse/MetaverseSidebar.jsx", import.meta.url), "utf8");

test("UI AUTHORITY — the floating Locations/Missions/Opportunity Exchange cluster no longer renders on the city canvas", () => {
  assert.doesNotMatch(controlsSource, />Locations</, "no floating Locations button text on the city canvas");
  assert.doesNotMatch(controlsSource, />Missions</);
  assert.doesNotMatch(controlsSource, />Opportunity Exchange</);
  assert.doesNotMatch(controlsSource, /onToggleNavigator|onToggleMissions|onToggleOpportunities/, "none of the three superseded toggle props remain on the camera controls component");
  assert.doesNotMatch(pageSource, /<MetaverseCameraControls[\s\S]{0,400}onToggleNavigator/, "the call site must no longer wire the superseded toggles into camera controls");
});

test("UI AUTHORITY — Explore/Locations remains fully accessible from the sidebar, wired to the exact same real navigatorOpen state the old floating toggle used", () => {
  assert.match(sidebarSource, /<NavItem icon="📍" label="Explore" sublabel="[^"]*" active=\{navigatorOpen\} onClick=\{onExplore\} expanded=\{expanded\} \/>/);
  assert.match(pageSource, /<MetaverseSidebar[\s\S]{0,400}navigatorOpen=\{navigatorOpen\}/, "MetaverseCityPage.jsx must still pass the real navigatorOpen state into the sidebar");
  assert.match(pageSource, /onExplore=\{\(\) => openPanel\(setNavigatorOpen\)\}/, "the sidebar's Explore click must open the SAME navigatorOpen state the Navigator panel reads");
  assert.match(pageSource, /<MetaverseLocationNavigator\s*\n\s*open=\{navigatorOpen\}/, "the Navigator panel itself must still render off the real navigatorOpen state");
});

test("UI AUTHORITY — city navigation behavior still works: camera zoom/back and the underlying panel-open state machine are all still real and wired, nothing was deleted, only the duplicate presentation", () => {
  // Zoom/Back have no sidebar equivalent and are correctly retained.
  assert.match(controlsSource, /aria-label="Zoom in"/);
  assert.match(controlsSource, /aria-label="Zoom out"/);
  assert.match(controlsSource, /onClick=\{onBack\} disabled=\{!canGoBack\}/);
  // The three panel-open state values themselves (navigatorOpen/
  // missionsOpen/opportunitiesOpen) are untouched — only how a student
  // reaches them changed.
  assert.match(pageSource, /const \[navigatorOpen, setNavigatorOpen\] = useState\(false\);/);
  assert.match(pageSource, /const \[missionsOpen, setMissionsOpen\] = useState/);
  assert.match(pageSource, /const \[opportunitiesOpen, setOpportunitiesOpen\] = useState/);
});

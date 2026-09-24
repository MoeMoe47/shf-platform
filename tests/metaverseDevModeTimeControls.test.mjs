// DEV MODE TIME-OF-DAY REVIEW CONTROLS — regression suite.
//
// Adds an owner/developer-only manual AUTO/DAY/DUSK/NIGHT override,
// gated behind `?metaverseDev=1` (dev build only), that sits BELOW a
// feature-specific DAY review flag (dayRapidsMotionReview, etc.) and
// ABOVE normal AUTO clock resolution in priority. Students never see
// or reach this — no query param, dev build required, never linked
// from navigation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  METAVERSE_TIME_OF_DAY_MODES,
  resolveMetaverseDevModeEnabled,
  resolveMetaverseTimeOfDay,
} from "../src/system/metaverse/metaverseTimeOfDay.js";

const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");
const sidebarSource = readFileSync(new URL("../src/components/metaverse/MetaverseSidebar.jsx", import.meta.url), "utf8");

// 1/2. /metaverse -> no DEV toolbar; /metaverse?metaverseDev=1 -> DEV toolbar.
test("DEV MODE — resolveMetaverseDevModeEnabled follows the standard review-flag convention: dev build + explicit param, off by default", () => {
  assert.equal(resolveMetaverseDevModeEnabled({ isDev: false, search: "?metaverseDev=1" }), false, "must stay off outside a dev build even with the flag present");
  assert.equal(resolveMetaverseDevModeEnabled({ isDev: true, search: "" }), false, "must stay off without the explicit flag");
  assert.equal(resolveMetaverseDevModeEnabled({ isDev: true, search: "?metaverseDev=1" }), true);
  assert.equal(resolveMetaverseDevModeEnabled({ isDev: true, search: "?metaverseDev=0" }), false, "explicit 0 must disable it");
  assert.equal(resolveMetaverseDevModeEnabled({ isDev: true, search: "?metaverseDev=false" }), false, "explicit false must disable it");
});

// VISUAL RECONCILIATION — the DEV controls now render via a dedicated
// `devContent` prop that MetaverseSidebar.jsx places immediately after
// the primary nav list, unconditional on the collapsible More panel's
// open/scroll state — "visible without searching" the instant the
// sidebar is expanded, not buried inside More.
test("DEV MODE — the DEV section is pinned directly under the sidebar's primary nav (not inside the collapsible More panel), and is visually distinct from every other sidebar section", () => {
  assert.match(cityPageSource, /devContent=\{\s*\n\s*devModeEnabled \? \(\s*\n\s*<div className="met-sidebar__dev-pinned">/, "the section must be conditionally rendered via the always-visible devContent prop");
  assert.match(sidebarSource, /\{expanded && devContent \? devContent : null\}/, "MetaverseSidebar must render devContent unconditional on moreOpen");
  const navCloseIndex = sidebarSource.indexOf("</ul>");
  const devContentIndex = sidebarSource.indexOf("devContent ? devContent");
  const morePanelIndex = sidebarSource.indexOf("moreOpen ?");
  assert.ok(navCloseIndex > -1 && devContentIndex > navCloseIndex && devContentIndex < morePanelIndex, "devContent must render between the primary nav and the More panel");
  assert.match(cssSource, /\.met-sidebar__dev-pinned\s*\{/);
  assert.match(cssSource, /\.met-sidebar__dev-pinned\s*\{[^}]*border:\s*1px dashed/s);
  assert.match(cityPageSource, /met-sidebar__dev-badge">DEV MODE</);
  assert.match(cityPageSource, /<h3>Developer /);
});

test("DEV MODE — the sidebar Developer section exposes AUTO/DAY/DUSK/NIGHT buttons and a \"Resolved\" readout", () => {
  assert.match(cityPageSource, /\{METAVERSE_TIME_OF_DAY_MODES\.map\(\(mode\) => \(/);
  assert.match(cityPageSource, /onClick=\{\(\) => handleDevTimeModeSelect\(mode\)\}/);
  assert.match(cityPageSource, /Resolved: \{resolvedTimeOfDay\}/);
});

test("DEV MODE — changing the DEV scene never falsifies the real-clock status strip: the icon uses realAutoTimeOfDay, and an explicit \"DEV Scene\" annotation appears only in DEV mode", () => {
  assert.match(cityPageSource, /const realAutoTimeOfDay = useMemo\(\(\) => resolveMetaverseTimeOfDay\(\{ mode: "AUTO", date: now \}\), \[now\]\);/);
  assert.match(cityPageSource, /\{realAutoTimeOfDay === "DAY" \? "☀️" : realAutoTimeOfDay === "DUSK" \? "🌆" : "🌙"\}/);
  assert.doesNotMatch(cityPageSource, /met-status-strip__icon"[\s\S]{0,20}\{resolvedTimeOfDay ===/, "the status strip icon must never be driven by the overridable resolvedTimeOfDay");
  assert.match(cityPageSource, /\{devModeEnabled \? <span className="met-status-strip__dev-scene">DEV Scene: \{resolvedTimeOfDay\}<\/span> : null\}/);
});

// 3/4/5. Selecting DAY/DUSK/NIGHT makes the resolver return that mode
// unconditionally, regardless of the real clock hour — i.e. it behaves
// exactly like every other manual (non-AUTO) mode already does.
test("DEV MODE — selecting DAY/DUSK/NIGHT in dev mode resolves to that exact mode at every hour (never overwritten by the clock)", () => {
  const hours = [0, 6, 9, 12, 16, 18, 21, 23];
  for (const mode of ["DAY", "DUSK", "NIGHT"]) {
    for (const hour of hours) {
      const date = new Date(2026, 0, 1, hour, 0, 0);
      assert.equal(resolveMetaverseTimeOfDay({ mode, date }), mode, `DEV-selected ${mode} must resolve to ${mode} at hour ${hour}`);
    }
  }
});

// 6. Selecting AUTO returns to real clock behavior.
test("DEV MODE — selecting AUTO in dev mode returns to real clock resolution, identical to production AUTO", () => {
  assert.equal(resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date(2026, 0, 1, 8, 0, 0) }), "DAY");
  assert.equal(resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date(2026, 0, 1, 18, 0, 0) }), "DUSK");
  assert.equal(resolveMetaverseTimeOfDay({ mode: "AUTO", date: new Date(2026, 0, 1, 22, 0, 0) }), "NIGHT");
});

// 7. Feature-review DAY flags still win over a DEV manual selection.
test("DEV MODE — a feature-specific DAY review flag (e.g. dayRapidsMotionReview) takes priority over a DEV manual selection", () => {
  assert.match(cityPageSource, /const timePreviewMode = reviewForcesDay \? "DAY" : \(devModeEnabled \? devTimeMode : "AUTO"\);/, "reviewForcesDay must be checked FIRST, before devModeEnabled/devTimeMode");
});

// 8. Removing ?metaverseDev=1 restores production AUTO behavior; the
// DEV mode gate is re-derived fresh from the CURRENT URL at mount, and
// stored preference is only ever read when the flag is present.
test("DEV MODE — devModeEnabled and devTimeMode are both derived fresh from the current URL/session at mount, so removing the flag falls straight back to AUTO", () => {
  assert.match(cityPageSource, /const \[devModeEnabled\] = useState\(\(\) => resolveMetaverseDevModeEnabled\(\{ isDev: import\.meta\.env\.DEV, search: window\.location\.search \}\)\);/);
  assert.match(cityPageSource, /const \[devTimeMode, setDevTimeMode\] = useState\(\(\) => \(devModeEnabled \? readStoredDevTimeMode\(\) : "AUTO"\)\);/, "the stored DEV preference must only ever be read when devModeEnabled is true");
});

test("DEV MODE — the DEV time-mode preference uses sessionStorage (not localStorage), wrapped in the same safe try/catch pattern as the sidebar's existing client preference", () => {
  assert.match(cityPageSource, /function readStoredDevTimeMode\(\) \{\s*\n\s*try \{\s*\n\s*const raw = window\.sessionStorage\.getItem\(DEV_TIME_MODE_STORAGE_KEY\);/);
  assert.match(cityPageSource, /function writeStoredDevTimeMode\(mode\) \{\s*\n\s*try \{\s*\n\s*window\.sessionStorage\.setItem\(DEV_TIME_MODE_STORAGE_KEY, mode\);/);
  assert.doesNotMatch(cityPageSource, /DEV_TIME_MODE_STORAGE_KEY.*localStorage|localStorage.*DEV_TIME_MODE_STORAGE_KEY/);
});

test("DEV MODE — no timer/interval in MetaverseCityPage.jsx can ever overwrite a DEV manual selection (the 30s clock tick only ever changes `now`, never devTimeMode)", () => {
  const intervalBlocks = cityPageSource.match(/setInterval\([\s\S]{0,400}?\)/g) || [];
  for (const block of intervalBlocks) {
    assert.doesNotMatch(block, /devTimeMode|setDevTimeMode/, `an interval must never touch the DEV override: ${block.slice(0, 80)}...`);
  }
});

test("DEV MODE — hotspot hover/clouds/birds/rapids remain completely untouched by any dev-mode concept, and the DEV time-mode override itself (devTimeMode) never leaks beyond MetaverseCityPage.jsx", () => {
  for (const source of [
    readFileSync(new URL("../src/components/metaverse/MetaverseHotspot.jsx", import.meta.url), "utf8"),
    readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayCloudLayer.jsx", import.meta.url), "utf8"),
    readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayBirdLayer.jsx", import.meta.url), "utf8"),
    readFileSync(new URL("../src/components/metaverse/living-city/MetaverseDayRapidsMotionLayer.jsx", import.meta.url), "utf8"),
  ]) {
    assert.doesNotMatch(source, /metaverseDev|met-dev-toolbar|devTimeMode/);
  }
  // HARD VISUAL MATCH — PART 1/8: MetaverseSidebar.jsx and
  // MetaverseMiniMap.jsx now DO have one narrow, intentional dev-review
  // touch each (force an expanded start under ?metaverseDev=1, since a
  // collapsed sidebar/minimap was the real reason DEV controls kept
  // reading as "invisible") — but neither ever references the DEV
  // time-mode override (devTimeMode) itself, which stays fully
  // contained in MetaverseCityPage.jsx.
  const sidebarSource = readFileSync(new URL("../src/components/metaverse/MetaverseSidebar.jsx", import.meta.url), "utf8");
  const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(sidebarSource, /devTimeMode|met-dev-toolbar/);
  assert.doesNotMatch(miniMapSource, /devTimeMode|met-dev-toolbar/);
  assert.match(sidebarSource, /devContent \? true : readStoredExpanded\(\)/);
  assert.match(miniMapSource, /resolveMetaverseDevModeEnabled/);
});

test("DEV MODE — resolver mode list is unchanged (still exactly AUTO/DAY/DUSK/NIGHT)", () => {
  assert.deepEqual(METAVERSE_TIME_OF_DAY_MODES, ["AUTO", "DAY", "DUSK", "NIGHT"]);
});

// VISUAL RECONCILIATION — regression suite.
//
// Covers: DEV controls pinned immediately below the sidebar's primary
// nav (never buried in the collapsible More panel or requiring
// scroll), the real-clock/DEV-scene status-strip separation, and the
// minimap's two-column expanded layout (map + legend/students side
// column) matching the approved mock's proportions.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cityPageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const sidebarSource = readFileSync(new URL("../src/components/metaverse/MetaverseSidebar.jsx", import.meta.url), "utf8");
const miniMapSource = readFileSync(new URL("../src/components/metaverse/MetaverseMiniMap.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("VISUAL RECONCILIATION — MetaverseSidebar accepts a devContent prop and renders it unconditionally on moreOpen, right after the primary nav", () => {
  assert.match(sidebarSource, /devContent,\s*\n\}\) \{/, "devContent must be a top-level prop");
  assert.match(sidebarSource, /\{expanded && devContent \? devContent : null\}/);
  const primaryNavCloseIdx = sidebarSource.indexOf("</ul>");
  const devIdx = sidebarSource.indexOf("devContent ? devContent");
  const morePanelIdx = sidebarSource.indexOf("moreOpen ?");
  assert.ok(primaryNavCloseIdx < devIdx && devIdx < morePanelIdx, "devContent must render between the primary nav and the collapsible More panel");
});

test("VISUAL RECONCILIATION — the sidebar Developer block is never nested inside moreContent/the More panel", () => {
  const moreContentStart = cityPageSource.indexOf("moreContent={(");
  const moreContentEnd = cityPageSource.indexOf(")}", moreContentStart);
  const devPinnedIdx = cityPageSource.indexOf('<div className="met-sidebar__dev-pinned">');
  assert.ok(devPinnedIdx > moreContentEnd, "the DEV block must be defined outside/after the moreContent prop value, passed via its own devContent prop");
  assert.match(cityPageSource, /devContent=\{/);
});

test("VISUAL RECONCILIATION — clicking a Scene Time button changes the resolved scene immediately (same handler proven in the DEV MODE suite), and the label matches the brief's \"Resolved:\" wording", () => {
  assert.match(cityPageSource, /Resolved: \{resolvedTimeOfDay\}/);
  assert.doesNotMatch(cityPageSource, /Resolved Scene: \{resolvedTimeOfDay\}/, "the sidebar block must use the brief's exact \"Resolved:\" label, not the old \"Resolved Scene:\" wording");
});

test("VISUAL RECONCILIATION — the status strip shows a compact real-time \"DEV SCENE: X\" annotation inline, never falsifying the real clock icon", () => {
  assert.match(cityPageSource, /met-status-strip__dev-scene/);
  assert.match(cityPageSource, /realAutoTimeOfDay/);
});

test("VISUAL RECONCILIATION — the expanded City Map's District Map tab is a two-column layout (map column + legend/students side column), not a single stacked column", () => {
  assert.match(miniMapSource, /met-citymap__district-body/);
  assert.match(miniMapSource, /met-citymap__map-col/);
  assert.match(miniMapSource, /met-citymap__side-col/);
  assert.match(cssSource, /\.met-citymap__district-body\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:/s);
});

test("VISUAL RECONCILIATION — the side column shows the Map Legend heading, then a Students Nearby heading with real face avatars and a View All Students button (only when real roster data exists)", () => {
  assert.match(miniMapSource, />Map Legend</);
  assert.match(miniMapSource, /met-citymap__face-row/);
  assert.match(miniMapSource, /met-citymap__view-all-button/);
  // The face row + button only render inside the real-roster branch,
  // never unconditionally — still no invented students (a DEV-only
  // fixture may substitute for effectiveRoomParticipants, but only
  // behind an explicit, dev-build-only flag — see
  // metaverseMinimapFinalReconciliation.test.mjs).
  const conditionIdx = miniMapSource.lastIndexOf("effectiveRoomParticipants && effectiveRoomParticipants.participants.length > 0 ? (");
  const faceRowIdx = miniMapSource.indexOf('className="met-citymap__face-row"');
  const viewAllIdx = miniMapSource.indexOf("met-citymap__view-all-button");
  assert.ok(conditionIdx > -1 && faceRowIdx > conditionIdx && faceRowIdx - conditionIdx < 200, "the face row must be inside the real-roster conditional branch");
  assert.ok(viewAllIdx > faceRowIdx && viewAllIdx - faceRowIdx < 1200, "View All Students must be near the face row, in the same real-data branch");
});

test("VISUAL RECONCILIATION — the City Map tabs render inline in the header row (next to the title), not as a separate row below it", () => {
  const headOpenIdx = miniMapSource.indexOf('className="met-minimap__head"');
  const headCloseIdx = miniMapSource.indexOf("</div>", headOpenIdx);
  const tabsIdx = miniMapSource.indexOf('className="met-citymap__tabs"');
  assert.ok(tabsIdx > headOpenIdx && tabsIdx < headCloseIdx, "tabs must be inside the same .met-minimap__head block as the title");
});

test("VISUAL RECONCILIATION — the expanded City Map panel is substantially wider than the old narrow card, matching the mock's larger proportion", () => {
  // PIXEL-FAITHFUL MOCK MATCH — widened again (460px -> 540px) to more
  // closely match the approved reference's larger panel proportion;
  // assert the general "substantially wider than the pre-V3 320px
  // card" property rather than pinning the intentionally-superseded
  // exact value.
  assert.match(cssSource, /\.met-minimap\.met-citymap--expanded\s*\{[^}]*width:\s*min\((\d+)px,/);
  const widthMatch = cssSource.match(/\.met-minimap\.met-citymap--expanded\s*\{[^}]*width:\s*min\((\d+)px,/);
  assert.ok(Number(widthMatch[1]) >= 460, "expanded panel must stay at least as wide as the prior pass's 460px");
});

test("VISUAL RECONCILIATION — sidebar keeps a navy body while preserving cyan edge lighting", () => {
  // SIDEBAR V7 corrects the hierarchy: the body itself is navy, while
  // brightness comes from cyan/sky-blue edges, corners, and active state.
  assert.match(cssSource, /--met-sidebar-shell-top: #08345f;/);
  assert.match(cssSource, /--met-sidebar-shell-mid: #062b50;/);
  assert.match(cssSource, /--met-sidebar-shell-bottom: #041f3a;/);
  assert.match(cssSource, /\.met-sidebar \{[^}]*background:\s*\n\s*radial-gradient\(circle at 0% 0%, rgba\(123, 220, 255, 0\.14\)/);
  assert.match(cssSource, /\.met-sidebar \{[^}]*linear-gradient\(180deg, var\(--met-sidebar-shell-top\) 0%, var\(--met-sidebar-shell-mid\) 45%, var\(--met-sidebar-shell-bottom\) 100%\);/);
  assert.match(cssSource, /\.met-minimap\.met-citymap \{[^}]*background: [^;]*rgba\(\d+, \d+, \d+, 0\.\d+\)/);
  assert.match(cssSource, /\.met-sidebar__item\[aria-current="true"\],\s*\n\.met-sidebar__item\[aria-expanded="true"\] \{[^}]*box-shadow:/s);
});

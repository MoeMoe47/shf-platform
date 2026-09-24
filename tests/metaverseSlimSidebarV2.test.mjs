// SLIM COLLAPSIBLE BLUE-FROST SIDEBAR V2 — regression suite.
//
// Sidebar width + collapse + presentation refinement only: expanded
// 272px -> 216px, collapsed 58px -> 60px, transition duration bumped
// into the 220-280ms range, and each primary/secondary nav row gains
// an optional static (non-data) sublabel line. No navigation structure,
// capability, minimap, city background, hotspot, or time-of-day change.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sidebarSource = readFileSync(new URL("../src/components/metaverse/MetaverseSidebar.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("V2 — expanded width reduced to the 205-225px target range (216px), collapsed stays within 56-64px (60px)", () => {
  assert.match(cssSource, /\.met-sidebar\.is-expanded \{/, "expanded selector must exist");
  const expandedMatch = cssSource.match(/width:\s*min\((\d+)px,\s*82vw\)/);
  assert.ok(expandedMatch, "expanded width declaration must exist");
  const expandedWidth = Number(expandedMatch[1]);
  assert.ok(expandedWidth >= 205 && expandedWidth <= 225, `expanded width ${expandedWidth}px must be within 205-225px`);

  const collapsedMatch = cssSource.match(/\.met-sidebar \{[^}]*width:\s*(\d+)px;/);
  assert.ok(collapsedMatch, "collapsed width rule must exist");
  const collapsedWidth = Number(collapsedMatch[1]);
  assert.ok(collapsedWidth >= 56 && collapsedWidth <= 64, `collapsed width ${collapsedWidth}px must be within 56-64px`);
});

test("V2 — width transition duration is within the 220-280ms target range", () => {
  const match = cssSource.match(/\.met-sidebar \{[^}]*transition:\s*width\s*(\d+)ms\s*ease;/);
  assert.ok(match, "width transition rule must exist");
  const duration = Number(match[1]);
  assert.ok(duration >= 220 && duration <= 280, `transition duration ${duration}ms must be within 220-280ms`);
});

test("V2 — the city canvas is already full-bleed behind the sidebar (no dead layout column to reclaim on collapse)", () => {
  assert.match(cssSource, /\.met-camera \{\s*\n\s*position:\s*absolute;\s*\n\s*inset:\s*0;/);
  assert.match(cssSource, /\.met-sidebar \{\s*\n\s*position:\s*absolute;/, "the sidebar must overlay the city, not push it via a layout column");
});

test("V2 — expanded nav rows carry an optional static sublabel (never real user/backend data), collapsed rail hides label+sublabel together", () => {
  assert.match(sidebarSource, /function NavItem\(\{ icon, label, sublabel, badge, dot, active, onClick, expanded \}\)/);
  assert.match(sidebarSource, /<span className="met-sidebar__item-sublabel">\{sublabel\}<\/span>/);
  assert.match(cssSource, /\.met-sidebar:not\(\.is-expanded\) \.met-sidebar__item-text \{/, "collapsed rail must hide the label+sublabel wrapper together, not just the primary label");
  // Sublabels are static UI copy, never derived from live props/state.
  assert.doesNotMatch(sidebarSource, /sublabel=\{/, "sublabel must always be a literal string, never bound to dynamic/real data");
});

test("V2 — the collapsed-rail tooltip still carries both the primary label and sublabel together for accessibility", () => {
  assert.match(sidebarSource, /const accessibleName = sublabel \? `\$\{label\}, \$\{sublabel\}` : label;/);
  assert.match(sidebarSource, /aria-label=\{accessibleName\}/);
  assert.match(sidebarSource, /data-tooltip=\{accessibleName\}/);
});

test("V2 — no navigation items were added or removed; the same onHome/onNextAction/onExplore/onMissions/onOpportunities/onMe/onToggleMore/onChat/onSettings callbacks are still wired", () => {
  for (const handler of ["onHome", "onNextAction", "onExplore", "onMissions", "onOpportunities", "onMe", "onToggleMore", "onChat", "onSettings"]) {
    assert.match(sidebarSource, new RegExp(`onClick=\\{${handler}\\}`), `${handler} must still be wired to a nav row`);
  }
  const navItemCount = (sidebarSource.match(/<NavItem[\s]/g) || []).length;
  assert.equal(navItemCount, 9, "exactly the same 9 nav rows (7 primary + Chat + Settings) as before this pass");
});

// SIDEBAR VISUAL MATCH V3 (superseded) — the V1 frosted-glass
// treatment this test originally pinned (translucent rgba gradient +
// backdrop-filter blur/saturate) was deliberately removed: the
// approved mock reads as a solid product-UI panel, not glass the city
// bleeds through. See metaverseSidebarVisualMatchV3.test.mjs for the
// current solid-panel assertions.
test("V2 (superseded by V3) — the frosted-glass backdrop-filter blur is gone; the sidebar is now a solid panel", () => {
  assert.doesNotMatch(cssSource, /\.met-sidebar \{[^}]*backdrop-filter:/, "the sidebar's own background must no longer use backdrop-filter blur");
  assert.match(cssSource, /border-right: 1px solid var\(--met-sidebar-edge\);/, "the cyan edge glow direction is preserved, just retuned");
});

test("V2 — orange mission badge is unchanged (still var(--shf-orange), never converted to cyan)", () => {
  assert.match(cssSource, /\.met-sidebar__item-badge \{[^}]*background: var\(--shf-orange\);/);
});

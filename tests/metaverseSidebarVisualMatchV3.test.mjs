// SIDEBAR VISUAL MATCH V4 — EXACT COLOR + GLOW CALIBRATION — regression
// suite. Visual style + structure only: no navigation architecture
// change, no capability removal, no minimap/city/hotspot/time-of-day
// change.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sidebarSource = readFileSync(new URL("../src/components/metaverse/MetaverseSidebar.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("V7 — the sidebar shell uses a navy body with cyan edge/corner light and no backdrop-filter blur", () => {
  assert.doesNotMatch(cssSource, /\.met-sidebar \{[^}]*backdrop-filter:/, "no blur on the base sidebar shell");
  assert.match(cssSource, /--met-sidebar-shell-top: #08345f;/);
  assert.match(cssSource, /--met-sidebar-shell-mid: #062b50;/);
  assert.match(cssSource, /--met-sidebar-shell-bottom: #041f3a;/);
  assert.match(cssSource, /\.met-sidebar \{[^}]*isolation: isolate;/);
  assert.match(cssSource, /\.met-sidebar \{[^}]*background:\s*\n\s*radial-gradient\(circle at 0% 0%, rgba\(123, 220, 255, 0\.14\)/);
  assert.match(cssSource, /\.met-sidebar::before \{[^}]*inset: -14px -18px -10px -12px;/);
  assert.match(cssSource, /\.met-sidebar::before \{[^}]*radial-gradient\(circle at 10% 4%, rgba\(156, 232, 255, 0\.32\)/);
  assert.match(cssSource, /\.met-sidebar \{[^}]*border-right: 1px solid var\(--met-sidebar-edge\);/, "cyan edge glow direction preserved");
});

test("V7 — the primary nav remains navy with a deep recessed well", () => {
  assert.match(cssSource, /\.met-sidebar__nav:not\(\.met-sidebar__nav--secondary\) \{/);
  assert.match(cssSource, /--met-sidebar-inner-surface-top: rgba\(8, 55, 100, 0\.82\);/);
  assert.match(cssSource, /--met-sidebar-inner-surface-bottom: rgba\(4, 38, 72, 0\.86\);/);
  assert.match(cssSource, /--met-sidebar-navy-well-top: rgba\(5, 40, 69, 0\.94\);/);
  assert.match(cssSource, /--met-sidebar-navy-well-bottom: rgba\(4, 31, 56, 0\.94\);/);
  assert.match(cssSource, /\.met-sidebar__nav:not\(\.met-sidebar__nav--secondary\)::before \{/);
  assert.match(cssSource, /\.met-sidebar__nav:not\(\.met-sidebar__nav--secondary\)::before \{[^}]*inset: 7px;/);
  assert.match(cssSource, /\.met-sidebar__nav:not\(\.met-sidebar__nav--secondary\)::before \{[^}]*linear-gradient\(180deg, var\(--met-sidebar-navy-well-top\) 0%, var\(--met-sidebar-navy-well-bottom\) 100%\)/);
});

test("V7 — rows are navy surfaces and the active nav item carries the cobalt/electric illumination", () => {
  assert.match(cssSource, /\.met-sidebar__item \{[^}]*background:\s*\n\s*linear-gradient\(180deg, rgba\(62, 142, 210, 0\.07\), rgba\(4, 30, 62, 0\.08\)\);/);
  assert.match(cssSource, /--met-sidebar-active-start: #0c68c3;/);
  assert.match(cssSource, /--met-sidebar-active-end: #45bdfb;/);
  assert.match(cssSource, /\.met-sidebar__item\[aria-current="true"\],\s*\n\.met-sidebar__item\[aria-expanded="true"\] \{[^}]*background:\s*\n\s*linear-gradient\(180deg, rgba\(238, 254, 255, 0\.28\), transparent 34%\),/);
  assert.match(cssSource, /\.met-sidebar__item\[aria-current="true"\]::before,\s*\n\.met-sidebar__item\[aria-expanded="true"\]::before \{/);
  assert.match(cssSource, /\.met-sidebar__item\[aria-current="true"\]::after,\s*\n\.met-sidebar__item\[aria-expanded="true"\]::after \{/);
  assert.match(cssSource, /\.met-sidebar__item\[aria-current="true"\],\s*\n\.met-sidebar__item\[aria-expanded="true"\] \{[^}]*border-color: var\(--met-sidebar-active-border\);/);
  assert.match(cssSource, /\.met-sidebar__item\[aria-current="true"\],\s*\n\.met-sidebar__item\[aria-expanded="true"\] \{[^}]*0 0 38px var\(--met-sidebar-active-glow\)/);
  assert.match(sidebarSource, /met-sidebar__item-chevron/, "active row shows a chevron, matching the mock");
});

test("V6 — right-edge glow has cyan core, near bloom, and soft city-side spill", () => {
  assert.match(cssSource, /\.met-sidebar::after \{/);
  assert.match(cssSource, /\.met-sidebar::after \{[^}]*right: -26px;/);
  assert.match(cssSource, /\.met-sidebar::after \{[^}]*background:\s*\n\s*linear-gradient\(90deg, rgba\(230, 253, 255, 0\.98\) 0%, var\(--met-sidebar-edge\) 5%, var\(--met-sidebar-edge-glow\) 22%/);
});

test("V7 — the sidebar scrollbar is sky-blue/cyan, never beige or tan", () => {
  assert.match(cssSource, /\.met-sidebar \{[^}]*scrollbar-color: #61cfff #062744;/);
  assert.match(cssSource, /\.met-sidebar::-webkit-scrollbar-thumb \{[^}]*linear-gradient\(180deg, #7bdcff, #4bbdf4\)/);
  assert.match(cssSource, /\.met-sidebar::-webkit-scrollbar-thumb:hover \{[^}]*background: #91e5ff;/);
  assert.match(cssSource, /\.met-sidebar::-webkit-scrollbar-thumb:active \{[^}]*background: #9ce8ff;/);
  assert.doesNotMatch(cssSource, /\.met-sidebar[^}]*#[a-f0-9]*(?:d2b48c|c2a679|d6b98c|c8ad7f)/i);
});

test("V7 — the official white Metaverse logo asset replaces the placeholder brand markup", () => {
  assert.match(sidebarSource, /<img[\s\S]*className="met-sidebar__logo"[\s\S]*src="\/assets\/metaverse\/branding\/silicon-heartland-metaverse-logo-white\.png"[\s\S]*alt="Silicon Heartland Metaverse"/);
  assert.doesNotMatch(sidebarSource, /🧡|met-sidebar__wordmark-stack/);
  assert.match(cssSource, /\.met-sidebar__logo \{[\s\S]*object-fit: contain;/);
  assert.match(sidebarSource, /met-sidebar__logo-frame/);
  assert.match(cssSource, /\.met-sidebar__logo \{[\s\S]*width: 100%;[\s\S]*height: 68px;[\s\S]*object-fit: contain;/);
  assert.match(cssSource, /\.met-sidebar__logo-frame \{[\s\S]*height: 68px;/);
  assert.match(cssSource, /\.met-sidebar:not\(\.is-expanded\) \.met-sidebar__logo-frame \{[\s\S]*overflow: hidden;/);
  assert.match(cssSource, /\.met-sidebar:not\(\.is-expanded\) \.met-sidebar__logo \{[\s\S]*width: 300px;[\s\S]*height: 100px;/);
});

test("V4 — a dedicated 'Today's Focus' card exists (expanded only), uses canonical card tokens, and stays wired to Explore", () => {
  assert.match(sidebarSource, /met-sidebar__focus-card/);
  assert.match(sidebarSource, /Today.s Focus/);
  assert.match(sidebarSource, /<button type="button" className="met-sidebar__focus-card" onClick=\{onExplore\}>/, "the card's action must be a real, already-existing capability (Explore), not a new invented feature");
  assert.match(cssSource, /\.met-sidebar__focus-card \{[^}]*background:\s*\n\s*linear-gradient\(180deg, rgba\(156, 232, 255, 0\.12\), transparent 30%\),/);
  assert.match(cssSource, /\.met-sidebar__focus-card \{[^}]*0 0 24px var\(--met-sidebar-card-glow\)/);
  // Collapsed-hidden via conditional render, not CSS clipping.
  const cardIdx = sidebarSource.indexOf("met-sidebar__focus-card");
  const guardIdx = sidebarSource.lastIndexOf("expanded ?", cardIdx);
  assert.ok(guardIdx > -1 && cardIdx - guardIdx < 100, "the focus card must be conditionally rendered only when expanded");
});

test("V4 — a small decorative bottom brand strip exists, expanded only, purely presentational (aria-hidden)", () => {
  assert.match(sidebarSource, /met-sidebar__brand-strip/);
  assert.match(sidebarSource, /<div className="met-sidebar__brand-strip" aria-hidden="true">/);
  assert.match(cssSource, /\.met-sidebar__brand-strip \{/);
});

test("V4 — real presence data (online count/status) in the org card is preserved, not replaced by decorative-only mock copy", () => {
  assert.match(sidebarSource, /\{totalOnline\} online &middot; \{STATUS_LABEL\[status\] \|\| "Available"\}/);
  assert.match(cssSource, /\.met-sidebar__user \{[^}]*border: 1px solid rgba\(105, 215, 255, 0\.44\);/);
  assert.match(cssSource, /\.met-sidebar__user \{[^}]*background:\s*\n\s*linear-gradient\(180deg, rgba\(156, 232, 255, 0\.08\), transparent 28%\),/);
});

test("V4 — no navigation items were added/removed and every existing callback is still wired (structure/behavior untouched, styling only)", () => {
  const navItemCount = (sidebarSource.match(/<NavItem[\s]/g) || []).length;
  assert.equal(navItemCount, 9, "still exactly 9 nav rows");
  for (const handler of ["onHome", "onNextAction", "onExplore", "onMissions", "onOpportunities", "onMe", "onToggleMore", "onChat", "onSettings"]) {
    assert.match(sidebarSource, new RegExp(`onClick=\\{${handler}\\}`));
  }
});

test("V7 — collapsed rail hides label/sublabel text and keeps the orange mission badge untouched", () => {
  assert.match(cssSource, /\.met-sidebar:not\(\.is-expanded\) \.met-sidebar__item-text \{/);
  assert.match(cssSource, /\.met-sidebar__item-badge \{[^}]*background: var\(--shf-orange\);/);
});

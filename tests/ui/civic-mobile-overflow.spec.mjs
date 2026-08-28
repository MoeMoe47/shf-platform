// Regression protection for the Civic page-level mobile-overflow closure
// (2026-08-24), a follow-up to the entrypoint/router restoration in
// tests/ui/civic-route-recovery.spec.mjs. That restoration fixed the
// shell-wide overflow (missing .crb-root, missing .crb-body mobile
// breakpoint); this file guards the 8 routes that still overflowed at
// 390px due to page-specific layout, confirmed by direct measurement:
//
//   Elections        — unwrapped flex action-row (Cast Vote/Cancel/hint)
//   Proposals        — fixed "1fr 1fr" content grid, no mobile collapse
//   Treasury Simulator (+ its /treasury alias) — same "1fr 1fr" grid, plus
//                      a slider row with fixed-width label/value that
//                      didn't wrap
//   Treasury Snapshots — unwrapped flex header action-row
//   Issue Survey     — same "1fr 1fr" grid pattern
//   Constitution Journal — asymmetric two-pane grid with a 280px hard
//                      minimum on the list column
//   Civic Portfolio  — unwrapped flex header action-row + "1fr 1fr" form grids
//
// Fixes used the grid's existing repeat(auto-fit, minmax(...)) idiom
// (already used by civic-shell.css's .db-grid--kpis) for the equal-split
// grids, a scoped .crb-journalGrid class with a real mobile override for
// Journal's asymmetric split (preserving its exact desktop proportions),
// and flex-wrap for the unwrapped action rows plus a systemic .db-head
// flex-wrap safety net. Proposals/Portfolio/Snapshots only reproduce
// under realistic (non-empty) data, so those tests seed localStorage
// before measuring.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/civic.html";
const MOBILE = { width: 390, height: 844 };

async function overflowAt(page, route, seed) {
  if (seed) {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await page.evaluate((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, seed);
  }
  await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle", timeout: 15000 });
  await page.waitForTimeout(500);
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.describe("Civic page-level mobile overflow — empty state", () => {
  test.use({ viewport: MOBILE });

  for (const route of ["elections", "treasury-sim", "treasury", "survey", "journal"]) {
    test(`/${route}: no horizontal overflow at 390px`, async ({ page }) => {
      const overflow = await overflowAt(page, route);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("Civic page-level mobile overflow — realistic populated data", () => {
  test.use({ viewport: MOBILE });

  test("/proposals: no horizontal overflow with seeded proposals", async ({ page }) => {
    // Proposals.jsx self-seeds sample proposals when its store is empty,
    // so no manual localStorage seed is needed — just a longer settle.
    const overflow = await overflowAt(page, "proposals");
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("/portfolio: no horizontal overflow with saved artifacts", async ({ page }) => {
    const overflow = await overflowAt(page, "portfolio", {
      "civic:portfolio:artifacts": JSON.stringify([
        { id: "a1", title: "Community Cleanup Photo Essay", desc: "Documented the spring cleanup drive.", tags: ["community"], kind: "document", url: "", createdAt: Date.now(), updatedAt: Date.now() },
      ]),
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("/snapshots: no horizontal overflow with saved snapshots", async ({ page }) => {
    const overflow = await overflowAt(page, "snapshots", {
      "civic:treasury:snapshots": JSON.stringify([
        { id: "s1", name: "Baseline balanced budget", note: "Even split.", state: { Education: 34, Health: 33, "Public Safety": 33 }, at: Date.now() },
      ]),
      "civic:treasury:state": JSON.stringify({ Education: 40, Health: 30, "Public Safety": 30 }),
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe("Desktop layout is unchanged by the mobile fixes", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Proposals: two-column split still renders side by side", async ({ page }) => {
    // Updated for the Civic Lab Proposals redesign (2026-08-24): the old
    // .db-grid "1fr 1fr" content grid this test originally guarded was
    // intentionally replaced by CivicDashboard/Elections/Proposals' own
    // .prop-layout (see src/styles/civic-proposals.css) — the same kind of
    // deliberate shell/page-architecture replacement already made for
    // Dashboard's .cv-* classes and Elections' .elex-* classes. The
    // guarantee this test protects (desktop keeps a real two-column split)
    // is unchanged; only the selector needed updating.
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const grid = page.locator(".prop-layout").first();
    const cols = await grid.evaluate((n) => getComputedStyle(n).gridTemplateColumns.split(" ").length);
    expect(cols).toBeGreaterThanOrEqual(2);
  });

  test("Constitution Journal: list/filter column stays a real minority split, not an equal split", async ({ page }) => {
    // Updated for the Civic Lab Constitution Journal redesign (2026-08-25):
    // the old .crb-journalGrid (fixed 280-360px first-column cap) was
    // intentionally replaced by the page's own .cj-workspace (see
    // src/styles/civic-journal.css), which uses a 30-35%-left / 65-70%-right
    // split per the approved brief — the same kind of deliberate
    // shell/page-architecture replacement already made for Proposals'
    // .prop-layout above. The guarantee this test protects (list/filter
    // column stays meaningfully narrower than the editor, not an equal
    // split) is unchanged; only the selector and expected range needed
    // updating to match the new, wider two-pane workspace.
    await page.goto(`${BASE}#/journal`, { waitUntil: "networkidle" });
    const grid = page.locator(".cj-workspace");
    const [firstColWidth, totalWidth] = await grid.evaluate((n) => {
      const cols = getComputedStyle(n).gridTemplateColumns.split(" ").map(parseFloat);
      return [cols[0], n.getBoundingClientRect().width];
    });
    const ratio = firstColWidth / totalWidth;
    expect(ratio).toBeGreaterThanOrEqual(0.28);
    expect(ratio).toBeLessThanOrEqual(0.38);
  });

  test("Treasury Simulator: allocation sliders still render on one row", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    // Scope to a program slider specifically (aria-label="Adjust <label>"),
    // not the "Total Cap" slider elsewhere on the page — which, since the
    // Treasury Simulator redesign, now also carries an accessible name
    // ("Adjust total cap") that starts with "Adjust ", so the regex alone
    // no longer disambiguates.
    const slider = page.locator(".ts-programs").getByRole("slider", { name: /^Adjust / }).first();
    const row = slider.locator("..");
    const label = row.locator("span").first();
    const code = row.locator("code").first();
    const [rowBox, labelBox, sliderBox, codeBox] = await Promise.all([
      row.boundingBox(), label.boundingBox(), slider.boundingBox(), code.boundingBox(),
    ]);
    // All three sit on the same visual line at desktop width (no wrap).
    expect(Math.abs(labelBox.y - rowBox.y)).toBeLessThan(5);
    expect(Math.abs(sliderBox.y - rowBox.y)).toBeLessThan(5);
    expect(Math.abs(codeBox.y - rowBox.y)).toBeLessThan(5);
  });
});

test.describe("Responsive containment across all four required viewports", () => {
  for (const vp of [
    { name: "390x844", width: 390, height: 844 },
    { name: "768x1024", width: 768, height: 1024 },
    { name: "1024x768", width: 1024, height: 768 },
    { name: "1440x900", width: 1440, height: 900 },
  ]) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const route of ["elections", "proposals", "treasury-sim", "survey", "journal"]) {
        test(`/${route}: no horizontal overflow`, async ({ page }) => {
          const overflow = await overflowAt(page, route);
          expect(overflow).toBeLessThanOrEqual(0);
        });
      }
    });
  }
});

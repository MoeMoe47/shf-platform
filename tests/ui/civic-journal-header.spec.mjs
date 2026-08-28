// Regression protection for the Constitution Journal header (originally
// the 2026-08-24 title/action overlap closure; updated 2026-08-25 for the
// full Constitution Journal redesign — see civic-journal-redesign.spec.mjs
// for the comprehensive suite). ConstitutionJournal.jsx now uses its own
// .cj-header (src/styles/civic-journal.css), matching the same "visible
// title as a styled <p>, real <h1> kept sr-only for a11y" pattern already
// established by every other redesigned Civic page (Dashboard/Elections/
// Proposals/Grant Story/Debt Clock/Treasury Simulator) — not the shared
// site-navbar .app-header/.app-main shell this guard originally protected
// against. This file keeps guarding the same two real regressions: (1) the
// old site-navbar shell classes never coming back, and (2) the VISIBLE
// title never visually overlapping an action button (checked against the
// visible .cj-header__h1 element now, since the real <h1> is intentionally
// sr-only and would make the overlap check vacuous).
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/civic.html";

async function titleOverlapsAnyButton(page) {
  return page.evaluate(() => {
    const title = document.querySelector(".cj-header__h1");
    const hr = title.getBoundingClientRect();
    for (const b of document.querySelectorAll("button")) {
      const br = b.getBoundingClientRect();
      const intersects = !(hr.right < br.left || hr.left > br.right || hr.bottom < br.top || hr.top > br.bottom);
      if (intersects) return { overlap: true, button: b.textContent.trim() };
    }
    return { overlap: false };
  });
}

test.describe("Constitution Journal header uses the shared Civic in-page pattern", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("header and title use the page's own .cj-header, not the site-navbar .app-header/.app-main", async ({ page }) => {
    await page.goto(`${BASE}#/journal`, { waitUntil: "networkidle" });
    await expect(page.locator("header.cj-header")).toBeVisible();
    await expect(page.locator(".cj-header__h1", { hasText: "Constitution Journal" })).toBeVisible();
    await expect(page.locator("header.app-header")).toHaveCount(0);
    await expect(page.locator("section.app-main")).toHaveCount(0);
  });

  test("title does not overlap any action button", async ({ page }) => {
    await page.goto(`${BASE}#/journal`, { waitUntil: "networkidle" });
    const result = await titleOverlapsAnyButton(page);
    expect(result.overlap).toBe(false);
  });

  test("New entry / Export buttons are all visible and independently clickable targets", async ({ page }) => {
    await page.goto(`${BASE}#/journal`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "New entry" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export JSON" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export Markdown" })).toBeVisible();
  });

  test("New entry workflow still functions (data/logic untouched by the redesign)", async ({ page }) => {
    await page.goto(`${BASE}#/journal`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "New entry" }).click();
    await expect(page.getByText("Entries:").locator("xpath=./strong")).toHaveText("1");
    // Placeholder copy intentionally changed by the redesign brief:
    // "Entry title" -> "Enter a title..." (see ConstitutionJournal.jsx).
    await expect(page.getByPlaceholder("Enter a title...")).toHaveValue("New Journal Entry");
  });
});

test.describe("Constitution Journal responsive containment (no overflow, no overlap)", () => {
  for (const vp of [
    { name: "390x844", width: 390, height: 844 },
    { name: "768x1024", width: 768, height: 1024 },
    { name: "1024x768", width: 1024, height: 768 },
    { name: "1440x900", width: 1440, height: 900 },
  ]) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test("no horizontal overflow and no title/button overlap", async ({ page }) => {
        await page.goto(`${BASE}#/journal`, { waitUntil: "networkidle" });
        await page.waitForTimeout(300);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
        const result = await titleOverlapsAnyButton(page);
        expect(result.overlap).toBe(false);
      });
    });
  }
});

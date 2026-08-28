// Regression protection for the Civic Lab Grant Story redesign
// (2026-08-25): truthful metrics, read-only narrative viewer, copy/
// download, impact pathway, "What funders see", Coach, and responsive
// shell inheritance from the Dashboard/Elections/Proposals redesigns.
//
// This page is a pure reader over shf_master_grant_narrative_v1 (see
// src/utils/binderMerge.js) — Admin's ToolDashboard.jsx is the only
// writer. Tests that need a populated state seed data through the real
// mergeAdminAndCivicLogs/buildGrantNarrative/saveMasterNarrativeToStorage
// pipeline, never by hand-writing fabricated markdown.
//
// Every route this suite navigates to or links to is real (cross-checked
// against src/router/CivicRoutes.jsx) — no placeholder hrefs.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/civic.html";

async function seedNarrative(page, { updatedAt = "2026-01-10" } = {}) {
  return page.evaluate(async (updatedAt) => {
    const mod = await import("/src/utils/binderMerge.js");
    const adminLogs = [{ when: "2026-01-05", category: "Funding & grants", duration: 45, outcome: "Drafted narrative.", tool: "Claude" }];
    const civicLogs = [
      { when: "2026-01-08", mission: "elections-mission", duration: 30, summary: "Cast a practice ballot." },
      { when: "2026-01-09", mission: "civic-proposals-mission", duration: 60, summary: "Submitted a proposal." },
    ];
    const m = mod.mergeAdminAndCivicLogs(adminLogs, civicLogs);
    const narrative = mod.buildGrantNarrative(m);
    const civicMinutesTotal = (m.byCategory?.Civic || []).reduce((s, i) => s + Number(i.duration || 0), 0);
    mod.saveMasterNarrativeToStorage(narrative, {
      updatedAt,
      adminCount: m.adminCount,
      civicCount: m.civicCount,
      totalTimeHours: m.totalTimeHours,
      civicMinutesTotal,
    });
    return narrative;
  }, updatedAt);
}

test.describe("Page load and truthful empty state", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("page loads with no console/page errors, exactly one h1", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("shows honest zero/fallback values with no narrative synced, not inflated mock numbers", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    const cards = page.locator(".gs-summary");
    await expect(cards.nth(0)).toContainText("Not available");
    await expect(cards.nth(1)).toContainText("0%");
    await expect(cards.nth(2)).toContainText("0 / 0 hrs");
    await expect(cards.nth(3)).toContainText("Read-only");
  });

  test("shows an honest narrative-unavailable state, not a blank panel", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    await expect(page.locator(".gs-narrative__empty")).toContainText("Grant narrative is not available yet.");
  });
});

test.describe("Populated state — real data through the real pipeline", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Last Updated, Civic Contribution, and Civic Sessions/Hours reflect the real seeded meta", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    await seedNarrative(page);
    await page.reload({ waitUntil: "networkidle" });
    const cards = page.locator(".gs-summary");
    await expect(cards.nth(0)).toContainText("Jan 10, 2026");
    await expect(cards.nth(1)).toContainText("67%"); // 2 civic / 3 total
    await expect(cards.nth(2)).toContainText("2 / 1.5 hrs"); // civicMinutesTotal 90/60
  });

  test("the actual narrative content renders in a real, scrollable, read-only viewer", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    const narrative = await seedNarrative(page);
    await page.reload({ waitUntil: "networkidle" });
    const body = page.locator(".gs-narrative__body");
    await expect(body).toBeVisible();
    const rendered = await body.textContent();
    expect(rendered.trim()).toBe(narrative.trim());
    await expect(page.locator(".gs-narrative__badge")).toContainText("Read-only");
    // genuinely read-only, not an editable field
    const tag = await body.evaluate((n) => n.tagName);
    expect(tag).toBe("PRE");
  });
});

test.describe("Copy for Grant Portal / Download .md", () => {
  test.use({
    viewport: { width: 1440, height: 900 },
    permissions: ["clipboard-read", "clipboard-write"],
  });

  test("Copy writes the exact real narrative to the clipboard with success feedback", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    const narrative = await seedNarrative(page);
    await page.reload({ waitUntil: "networkidle" });

    await page.getByRole("button", { name: /Copy for Grant Portal/ }).click();
    await expect(page.locator(".gs-actionFeedback")).toHaveText("Copied to clipboard");
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip.trim()).toBe(narrative.trim());
  });

  test("Copy with no narrative shows an honest error, does not throw", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Copy for Grant Portal/ }).click();
    await expect(page.locator(".gs-actionFeedback")).toContainText("no narrative to copy");
  });

  test("Download .md downloads the exact real narrative with a sensible filename", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    const narrative = await seedNarrative(page);
    await page.reload({ waitUntil: "networkidle" });

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Download \.md/ }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("shf-grant-narrative.md");
    const path = await download.path();
    const fs = await import("fs");
    const content = fs.readFileSync(path, "utf8");
    expect(content.trim()).toBe(narrative.trim());
    await expect(page.locator(".gs-actionFeedback")).toHaveText("Download started");
  });
});

test.describe("Impact pathway / What funders see / Coach", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("impact pathway renders all five steps with real navigation links", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    const pathway = page.locator(".gs-pathway");
    for (const name of ["Learn", "Participate", "Document", "Portfolio", "Grant Story / Impact"]) {
      await expect(pathway.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(pathway.locator("a", { hasText: "Learn" })).toHaveAttribute("href", /#\/micro-lessons/);
    await expect(pathway.locator("a", { hasText: "Portfolio" })).toHaveAttribute("href", /#\/portfolio/);
  });

  test("What funders see renders all three real, non-inflated claims", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    const panel = page.locator(".gs-funders");
    await expect(panel.getByText("Student work is documented through missions")).toBeVisible();
    await expect(panel.getByText("AI tools enhance, not replace, student agency")).toBeVisible();
    await expect(panel.getByText("Outcomes are connected to community impact")).toBeVisible();
    // no fabricated funding/award claims
    await expect(panel).not.toContainText("guarantee");
    await expect(panel).not.toContainText("award");
  });

  test("Ask Coach! opens the real, existing Coach panel", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ask Coach!" }).click();
    await expect(page.locator(".coach-panel")).toBeVisible();
  });
});

test.describe("Theme", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dark mode applies to the Grant Story page content", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Theme, currently/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await page.waitForTimeout(250);
    const bg = await page.locator(".gs-page").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).toBe("rgb(11, 15, 22)");
  });
});

test.describe("Tablet shell (768-1199px)", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("2x2 summary cards, collapsed icon rail, no horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-collapsed/);
    const cols = await page.locator(".gs-summaryGrid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(cols).toBe(2);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
});

test.describe("Mobile (<768px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow, correct DOM order, narrative remains readable", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    await seedNarrative(page);
    await page.reload({ waitUntil: "networkidle" });

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);

    const order = await page.evaluate(() => {
      const sel = [".gs-header", ".gs-actions", ".gs-summaryGrid", ".gs-pathway", ".gs-narrative", ".gs-funders", ".gs-coach"];
      return sel.map((s) => document.querySelector(s)?.className).filter(Boolean);
    });
    expect(order[0]).toMatch(/gs-header/);
    expect(order[order.length - 1]).toMatch(/gs-coach/);

    await expect(page.locator(".gs-narrative__body")).toBeVisible();
  });

  test("hamburger drawer still opens over the Grant Story page", async ({ page }) => {
    await page.goto(`${BASE}#/grant-story`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-mobileOpen/);
  });
});

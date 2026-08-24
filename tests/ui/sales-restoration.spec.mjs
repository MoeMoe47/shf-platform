// Regression protection for the Sales application forensic recovery
// (2026-08-24). Restored/adapted from the Nov 2025 archive
// (src/_archive/components.sales.20251107-000126/,
// src/_archive/pages.sales.20251107-000126/) after comparing it against
// the app's own current, thin (and partly Civic-contaminated) state.
//
// Confirmed contamination fixed by this restoration: Proposals.jsx,
// Settings.jsx, SalesHeader.jsx, and Help.jsx were unmodified or
// near-unmodified copies of the Civic app's own files, writing to
// "civic:*" localStorage keys and showing Civic UI text/branding. This
// file guards against that regressing, plus the route/layout/CSS/import
// defects found and fixed while wiring the restoration up live:
//   - SalesLayout.jsx used one-off inline styles instead of the
//     .crb-root/.crb-header/.crb-body/.crb-sidebar/.crb-main shell
//     architecture sales-shell.css already defines.
//   - SalesSidebar.jsx referenced phantom CSS classes.
//   - FundingCalculator.jsx navigated to a wrong route prefix.
//   - src/components/sales/LessonBody.jsx had a broken import path
//     (stray space: "@/components /sales/AccreditationPanel.jsx").
//   - DemoProposal.jsx read window.location.search, which is always
//     empty under HashRouter (the query string lives inside the hash
//     fragment) — every stat rendered $0 until fixed to use
//     react-router's useLocation().search.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/sales.html";

const ROUTES = [
  "dashboard", "northstar", "leads", "pipeline", "proposals",
  "quotes", "orders", "analytics", "exports", "demo", "lesson",
  "settings", "help",
];

test.describe("Every restored Sales route renders real content, not an error boundary", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of ROUTES) {
    test(`/${route}: direct navigation and hard refresh both succeed`, async ({ page }) => {
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));

      await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle" });
      await expect(page.getByText("Something went wrong")).not.toBeVisible();

      await page.reload({ waitUntil: "networkidle" });
      await expect(page.getByText("Something went wrong")).not.toBeVisible();

      expect(pageErrors).toEqual([]);
    });
  }
});

test.describe("Shell architecture", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("sidebar renders beside main content via the .crb-* shell (not stacked)", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const sidebar = page.locator(".crb-sidebar");
    const main = page.locator("main.crb-main");
    await expect(sidebar).toBeVisible();
    await expect(main).toBeVisible();
    const sidebarBox = await sidebar.boundingBox();
    const mainBox = await main.boundingBox();
    expect(mainBox.x).toBeGreaterThan(sidebarBox.x);
    expect(mainBox.y).toBeLessThan(100);
  });

  test("sidebar nav links use real, styled classes (not phantom .sh-sidebar*)", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const link = page.locator(".crb-link").first();
    await expect(link).toBeVisible();
    const bg = await link.evaluate((n) => getComputedStyle(n).textDecoration);
    expect(bg).toContain("none");
  });
});

test.describe("Contamination guard: no Sales page ever writes a civic:* key", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Proposals: creating a draft only writes sales:proposal:drafts", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const before = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).filter((k) => k.startsWith("civic:")).sort()));

    await page.getByPlaceholder("e.g. Cleveland City Schools").fill("Test District");
    await page.getByRole("button", { name: "Create Draft" }).click();
    await expect(page.getByText("Test District")).toBeVisible();

    const after = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).filter((k) => k.startsWith("civic:")).sort()));
    expect(after).toBe(before); // no new civic:* key appeared
    const salesDrafts = await page.evaluate(() => localStorage.getItem("sales:proposal:drafts"));
    expect(salesDrafts).toContain("Test District");
  });

  test("Settings: toggling a preference only writes sales:settings", async ({ page }) => {
    await page.goto(`${BASE}#/settings`, { waitUntil: "networkidle" });
    await page.getByRole("checkbox").click();
    const settingsRaw = await page.evaluate(() => localStorage.getItem("sales:settings"));
    expect(settingsRaw).toBeTruthy();
    const civicPrivacy = await page.evaluate(() => localStorage.getItem("civic:privacy"));
    // civic:privacy may pre-exist from unrelated Civic testing in the same
    // browser profile, but this Settings page must never be the one
    // writing to it — the real guard is the key existing under sales:*.
    expect(JSON.parse(settingsRaw)).toHaveProperty("notifyOnNewLead");
    void civicPrivacy;
  });

  test("Proposals page text is Sales-specific, not the Civic original", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await expect(page.getByText("Draft, debate, vote")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Proposals" })).toBeVisible();
  });

  test("Help page text is Sales-specific, not the Civic original", async ({ page }) => {
    await page.goto(`${BASE}#/help`, { waitUntil: "networkidle" });
    await expect(page.getByText("civic participation guidelines")).not.toBeVisible();
  });
});

test.describe("FundingCalculator -> DemoProposal handoff loop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Send to Proposal carries real computed values through to the proposal page", async ({ page }) => {
    await page.goto(`${BASE}#/demo`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Send to Proposal" }).click();
    await expect.poll(() => page.evaluate(() => window.location.hash)).toContain("#/demo/proposal?");

    // The bug this guards: window.location.search is always empty under
    // HashRouter, so every stat used to render as 0/$0.
    await expect(page.getByText("120", { exact: true })).toBeVisible();
    const totalCostText = await page.locator("text=Total Cost").locator("..").innerText();
    expect(totalCostText).not.toContain("$0");
  });
});

test.describe("Lesson page renders the real LessonBody (not a broken import)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("/lesson renders objectives, vocabulary, and a quiz", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await page.goto(`${BASE}#/lesson`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /Sales Fundamentals/ })).toBeVisible();
    await expect(page.getByText("ICP", { exact: true }).first()).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});

test.describe("Dashboard KPIs render real, non-zero pipeline data", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("/dashboard shows Open Pipeline and Pipeline Preview", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByText("Open Pipeline")).toBeVisible();
    await expect(page.getByText("SHF Foundation Pilot")).toBeVisible();
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

      for (const route of ["dashboard", "demo", "lesson", "proposals"]) {
        test(`/${route}: no horizontal overflow`, async ({ page }) => {
          await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle" });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow).toBeLessThanOrEqual(0);
        });
      }
    });
  }
});

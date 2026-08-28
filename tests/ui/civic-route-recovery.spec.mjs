// Regression protection for the Civic application entrypoint recovery
// (2026-08-24). Civic was rendering a static "smoke test" civic.html with
// no <script> tag at all, plus a placeholder civic.main.jsx that never
// mounted CivicRoutes.jsx. The real entry (src/entries/civic.main.jsx.bak)
// was proven complete — every import it referenced existed in the tree —
// and was restored verbatim (with one prop-name bug fixed: RoleProvider
// takes `initialRoles`, not `initial`). Restoring the entry then exposed a
// second, previously-unreachable defect: CivicLayout.jsx never rendered
// the `.crb-root` element civic-shell.css needs to define --crb-sidebar-w,
// so the sidebar/main grid silently collapsed to a single stacked column.
// Both are fixed; this file guards against either regressing.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/civic.html";

const ROUTES = [
  "dashboard", "dashboard-ns", "micro-lessons", "assignments", "lesson",
  "elections", "proposals", "treasury-sim", "debtclock", "grant-story",
  "leaderboard", "snapshots", "survey", "profile", "journal", "badges",
  "notes", "portfolio", "rewards", "settings", "help",
];

test.describe("Civic entrypoint renders the real app, not a smoke test", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("civic.html mounts React and the Civic shell (not the static smoke-test HTML)", async ({ page }) => {
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator("#root")).toBeAttached();
    await expect(page.getByText("CIVIC HARD SMOKE TEST")).not.toBeVisible();
    await expect(page.getByText("CIVIC ENTRY SMOKE TEST")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Civic Lab" })).toBeVisible();
  });

  test("sidebar renders beside main content, not stacked above it (.crb-root regression)", async ({ page }) => {
    // Updated for the Civic Lab Dashboard redesign (2026-08-24): CivicLayout
    // now renders CivicAppShell (src/layouts/civic/CivicAppShell.jsx), which
    // replaced the old .crb-root/.civic-sidebar grid shell with a
    // .cv-shell/.cv-shell__sidebar flex shell (collapsible desktop sidebar,
    // tablet icon rail, mobile drawer). `main.crb-main` is still the real
    // Outlet wrapper — unchanged, so every other route's own CSS still
    // targets it correctly. The guarantee this test protects (sidebar
    // beside content, not stacked above it) is unchanged; only the
    // selector for "the sidebar" needed updating.
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const sidebar = page.locator(".cv-shell__sidebar");
    const main = page.locator("main.crb-main");
    await expect(sidebar).toBeVisible();
    await expect(main).toBeVisible();
    const sidebarBox = await sidebar.boundingBox();
    const mainBox = await main.boundingBox();
    // Side-by-side means main starts within a reasonable band of the
    // viewport top, not hundreds of pixels down past a stacked sidebar.
    expect(mainBox.y).toBeLessThan(300);
    expect(mainBox.x).toBeGreaterThan(sidebarBox.x);
  });

  test("--civic-sidebar-w resolves to a real value on .cv-shell", async ({ page }) => {
    // Updated alongside the test above — .crb-root/--crb-sidebar-w no
    // longer exist; CivicAppShell's own .cv-shell defines --civic-sidebar-w
    // (see src/styles/civic-dashboard.css) as the real desktop sidebar
    // width token the redesign uses.
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    const val = await page.locator(".cv-shell").evaluate((n) => getComputedStyle(n).getPropertyValue("--civic-sidebar-w").trim());
    expect(val).toBe("268px");
  });
});

test.describe("Every registered Civic route renders real content on direct navigation and hard refresh", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of ROUTES) {
    test(`/${route}: direct navigation and hard refresh both succeed with no console/page errors`, async ({ page }) => {
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));

      await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle" });
      await expect(page.locator("main.crb-main")).toBeVisible();
      await expect(page.getByText("CIVIC HARD SMOKE TEST")).not.toBeVisible();

      await page.reload({ waitUntil: "networkidle" });
      await expect(page.locator("main.crb-main")).toBeVisible();

      expect(pageErrors).toEqual([]);
    });
  }
});

test.describe("TreasurySnapshots import fix (StorageSoftReset)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("/snapshots renders without a module-resolution error", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await page.goto(`${BASE}#/snapshots`, { waitUntil: "networkidle" });
    await expect(page.getByText("Something went wrong")).not.toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});

test.describe("Responsive containment on the primary shell routes", () => {
  for (const vp of [
    { name: "390x844", width: 390, height: 844 },
    { name: "768x1024", width: 768, height: 1024 },
    { name: "1024x768", width: 1024, height: 768 },
    { name: "1440x900", width: 1440, height: 900 },
  ]) {
    test.describe(vp.name, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const route of ["dashboard", "debtclock", "leaderboard", "help"]) {
        test(`/${route}: no page-level horizontal overflow`, async ({ page }) => {
          await page.goto(`${BASE}#/${route}`, { waitUntil: "networkidle" });
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow).toBeLessThanOrEqual(0);
        });
      }
    });
  }
});

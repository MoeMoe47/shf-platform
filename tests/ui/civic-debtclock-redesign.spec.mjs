// Regression protection for the Civic Lab Debt Clock redesign
// (2026-08-25): the static/simulated debt figure and its honest source
// disclaimer, Fiscal Policy mission logging, Civic Grant Story
// integration, Coach, theme, and responsive shell inheritance from the
// Dashboard/Elections/Proposals/Grant Story redesigns.
//
// The displayed debt value is a hardcoded, static educational figure in
// the pre-redesign source (never fetched/computed) — this suite asserts
// it renders exactly, not that it is "live" in any sense.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/civic.html";

test.describe("Page load and content", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("page loads with no console/page errors, exactly one h1", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Debt Clock");
    expect(errors).toEqual([]);
  });

  test("educational/simulated disclaimer renders and is not stripped away", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    await expect(page.locator(".dc-header__sub")).toHaveText("State/County debt visualized for education (simulated).");
  });

  test("the actual static debt value and its honest source line render unchanged", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    await expect(page.locator(".dc-hero__value")).toHaveText("$89,420,000,000");
    await expect(page.locator(".dc-hero__source")).toHaveText("Source: Public treasury data (educational use)");
    // Page must never claim this is real-time.
    await expect(page.locator(".dc-page")).not.toContainText(/real-time|real time|live feed/i);
  });

  test("fiscal illustration is present and marked purely decorative", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    const svg = page.locator(".dc-illustration svg");
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});

test.describe("Mission Log / Grant Story integration (unchanged data model)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Fiscal Policy 1 chapter, default 45 minutes, and ESSA/CIVICS funding tags render", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    const log = page.locator(".dc-missionLog");
    await expect(log.getByText("Chapter:")).toBeVisible();
    await expect(log.getByText("Fiscal Policy 1")).toBeVisible();
    await expect(log.locator('input[type="number"]')).toHaveValue("45");
    await expect(log.getByText("ESSA", { exact: true })).toBeVisible();
    await expect(log.getByText("CIVICS", { exact: true })).toBeVisible();
    await expect(log).toContainText("Civic Grant Story");
    await expect(log).toContainText("Master Grant Narrative");
  });

  test("mission fields accept input and are preserved (What did you do? / What was the outcome?)", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    const log = page.locator(".dc-missionLog");
    await log.getByPlaceholder(/Compared debt scenarios/).fill("Compared two budget scenarios.");
    await log.getByPlaceholder(/Selected a policy option/).fill("Chose the balanced option and explained why.");
    await expect(log.getByPlaceholder(/Compared debt scenarios/)).toHaveValue("Compared two budget scenarios.");
    await expect(log.getByPlaceholder(/Selected a policy option/)).toHaveValue("Chose the balanced option and explained why.");
  });

  test("Log & keep open logs the mission and keeps the form open", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    const log = page.locator(".dc-missionLog");
    await log.getByPlaceholder(/Compared debt scenarios/).fill("Reviewed the debt figure.");
    await log.getByRole("button", { name: "Log & keep open" }).click();
    const logs = await page.evaluate(() => JSON.parse(localStorage.getItem("shf.civicMissionLogs.v1") || "[]"));
    expect(logs.length).toBe(1);
    expect(logs[0].mission).toBe("debt-clock-mission");
    expect(logs[0].chapter).toBe("Fiscal Policy 1");
    expect(logs[0].fundingStreams).toEqual(["essa", "civics"]);
    expect(logs[0].mode).toBe("log+keep");
    // form stays open with its values (log+keep does not reset fields)
    await expect(log.getByPlaceholder(/Compared debt scenarios/)).toHaveValue("Reviewed the debt figure.");
  });

  test("Log mission logs and resets the form", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    const log = page.locator(".dc-missionLog");
    await log.getByPlaceholder(/Compared debt scenarios/).fill("Reviewed the debt figure.");
    await log.getByRole("button", { name: "Log mission" }).click();
    const logs = await page.evaluate(() => JSON.parse(localStorage.getItem("shf.civicMissionLogs.v1") || "[]"));
    expect(logs.length).toBe(1);
    expect(logs[0].mode).toBe("log+close");
    await expect(log.getByPlaceholder(/Compared debt scenarios/)).toHaveValue("");
  });
});

test.describe("Coach", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Ask Coach! opens the real, existing Coach panel", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ask Coach!" }).click();
    await expect(page.locator(".coach-panel")).toBeVisible();
  });
});

test.describe("Theme", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dark mode applies to the Debt Clock page content", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Theme, currently/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await page.waitForTimeout(250);
    const bg = await page.locator(".dc-page").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).toBe("rgb(11, 15, 22)");
  });
});

test.describe("Tablet shell (768-1199px)", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("collapsed icon rail, hero+illustration stack, no horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-collapsed/);
    const flexDir = await page.locator(".dc-heroRow").evaluate((el) => getComputedStyle(el).flexDirection);
    expect(flexDir).toBe("column");
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
});

test.describe("Mobile (<768px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow, debt value never clips, correct DOM order", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);

    const clipped = await page.evaluate(() => {
      const el = document.querySelector(".dc-hero__value");
      return el.scrollWidth > el.clientWidth + 2;
    });
    expect(clipped).toBe(false);
    await expect(page.locator(".dc-hero__value")).toHaveText("$89,420,000,000");

    const order = await page.evaluate(() => {
      const sel = [".dc-header", ".dc-heroRow", ".dc-missionLog", ".dc-coachRow"];
      return sel.map((s) => document.querySelector(s)?.className).filter(Boolean);
    });
    expect(order[0]).toMatch(/dc-header/);
    expect(order[order.length - 1]).toMatch(/dc-coachRow/);
  });

  test("hamburger drawer still opens over the Debt Clock page", async ({ page }) => {
    await page.goto(`${BASE}#/debtclock`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-mobileOpen/);
  });
});

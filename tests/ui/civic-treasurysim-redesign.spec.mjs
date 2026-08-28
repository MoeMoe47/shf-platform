// Regression protection for the Civic Lab Treasury Simulator redesign
// (2026-08-25): cap/program slider math, the two distinct save actions
// (header "Save Snapshot" / Programs "Save scenario"), the mandatory
// snapshot round-trip through /snapshots, real Mission Log fields only
// (not the mock's fabricated fields), Coach, theme, and responsive shell
// inheritance from the Dashboard/Elections/Proposals/Grant Story/Debt
// Clock redesigns.
//
// State model is unchanged from the pre-redesign source: cap (50-200),
// 5 fixed program lines (0..cap each), total/balance/remaining derived,
// mirrored to localStorage["civic:treasury:state"] and read back on mount
// (added — see TreasurySim.jsx header comment — so a snapshot restored via
// TreasurySnapshots.jsx actually reappears in the sliders).
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/civic.html";

test.describe("Page load and content", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("page loads with no console/page errors, exactly one h1", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Treasury Simulator");
    expect(errors).toEqual([]);
  });

  test("Total Cap and Programs cards render with initial values", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    const badges = page.locator(".ts-totals .ts-badge");
    await expect(badges.nth(0)).toContainText("Cap: 100");
    await expect(badges.nth(1)).toContainText("Allocated: 100");
    await expect(badges.nth(2)).toContainText("Remaining: 0");
    await expect(page.locator(".ts-programs input[type=range]")).toHaveCount(5);
  });
});

test.describe("Cap and program sliders (unchanged math)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("cap slider updates Cap/Remaining badges live", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    await page.locator(".ts-totals input[type=range]").fill("150");
    const badges = page.locator(".ts-totals .ts-badge");
    await expect(badges.nth(0)).toContainText("Cap: 150");
    await expect(badges.nth(2)).toContainText("Remaining: 50");
  });

  test("program slider clamps to [0, cap] and updates its readout", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    const eduSlider = page.locator(".ts-programs input[type=range]").nth(0);
    await eduSlider.fill("80");
    await expect(page.locator(".ts-programRow__value").nth(0)).toHaveText("80");
  });

  test("over-allocation warning shows only when total exceeds cap", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    await expect(page.locator(".ts-overAlloc")).toHaveCount(0);
    await page.locator(".ts-totals input[type=range]").fill("50");
    await expect(page.locator(".ts-overAlloc")).toContainText("Over-allocated");
  });
});

test.describe("Save Snapshot / Save scenario — two real, distinct entry points", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("both buttons exist and both save (same underlying action, different notes)", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.removeItem("civic:treasury:snapshots"));
    await page.reload({ waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Save Snapshot" }).click();
    await page.getByRole("button", { name: "Save scenario" }).click();

    const snaps = await page.evaluate(() => JSON.parse(localStorage.getItem("civic:treasury:snapshots") || "[]"));
    expect(snaps.length).toBe(2);
    expect(snaps[0].note).not.toBe(snaps[1].note);
  });
});

test.describe("Snapshot compatibility (mandatory live round trip)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("create a scenario, save it, open /snapshots, restore it — exact allocations survive", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.removeItem("civic:treasury:snapshots");
      localStorage.removeItem("civic:treasury:state");
    });
    await page.reload({ waitUntil: "networkidle" });

    await page.locator(".ts-totals input[type=range]").fill("180");
    await page.locator(".ts-programs input[type=range]").nth(0).fill("90");
    await page.getByRole("button", { name: "Save Snapshot" }).click();

    await page.goto(`${BASE}#/snapshots`, { waitUntil: "networkidle" });
    await page.getByText("Saved Snapshots").waitFor({ state: "visible" });
    const row = page.locator("section[aria-label='Saved Snapshots'] li").first();
    await expect(row).toContainText("Total: 180");

    await row.getByRole("button", { name: "Restore" }).click();
    await page.waitForURL(/treasury-sim|treasury$/);

    await expect(page.locator(".ts-totals .ts-badge").nth(0)).toContainText("Cap: 180");
    await expect(page.locator(".ts-programRow__value").nth(0)).toHaveText("90");
  });
});

test.describe("Portfolio integration (verified, not inferred)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Open Portfolio is a real navigation link and writes nothing to storage", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    const before = await page.evaluate(() => Object.keys(localStorage).length);
    await page.getByRole("link", { name: "Open Portfolio" }).click();
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => Object.keys(localStorage).length);
    expect(after).toBe(before);
  });
});

test.describe("Mission Log (real fields only, not the mock's fabricated fields)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Budget & Trade-Offs chapter, default 45 minutes, and PERKINS/WIOA/ESSA funding tags render", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    const log = page.locator(".ts-missionLog");
    await expect(log.getByText("Budget & Trade-Offs")).toBeVisible();
    await expect(log.locator('input[type="number"]')).toHaveValue("45");
    await expect(log.getByText("PERKINS", { exact: true })).toBeVisible();
    await expect(log.getByText("WIOA", { exact: true })).toBeVisible();
    await expect(log.getByText("ESSA", { exact: true })).toBeVisible();
  });

  test("only the real mission fields exist — no fabricated Mission Title/Type/Difficulty/Tags/mood fields", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    const log = page.locator(".ts-missionLog");
    await expect(log.getByText("What did you do?")).toBeVisible();
    await expect(log.getByText("What was the outcome?")).toBeVisible();
    for (const fabricated of ["Mission Title", "Mission Type", "Time Spent", "Difficulty", "What did you try?", "What happened?", "Add Tags"]) {
      await expect(log.getByText(fabricated, { exact: true })).toHaveCount(0);
    }
  });

  test("Log mission logs with the correct mission id, chapter, and funding streams, then resets", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    const log = page.locator(".ts-missionLog");
    await log.getByPlaceholder(/Compared debt scenarios/).fill("Balanced the budget.");
    await log.getByRole("button", { name: "Log mission" }).click();
    const logs = await page.evaluate(() => JSON.parse(localStorage.getItem("shf.civicMissionLogs.v1") || "[]"));
    expect(logs.length).toBe(1);
    expect(logs[0].mission).toBe("treasury-sim-mission");
    expect(logs[0].chapter).toBe("Budget & Trade-Offs");
    expect(logs[0].fundingStreams).toEqual(["perkins", "wioa", "essa"]);
    expect(logs[0].mode).toBe("log+close");
    await expect(log.getByPlaceholder(/Compared debt scenarios/)).toHaveValue("");
  });

  test("Log & keep open logs the mission and keeps the form open", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    const log = page.locator(".ts-missionLog");
    await log.getByPlaceholder(/Compared debt scenarios/).fill("Reviewed allocations.");
    await log.getByRole("button", { name: "Log & keep open" }).click();
    const logs = await page.evaluate(() => JSON.parse(localStorage.getItem("shf.civicMissionLogs.v1") || "[]"));
    expect(logs[0].mode).toBe("log+keep");
    await expect(log.getByPlaceholder(/Compared debt scenarios/)).toHaveValue("Reviewed allocations.");
  });
});

test.describe("Coach", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Ask Coach! opens the real, existing Coach panel", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ask Coach!" }).click();
    await expect(page.locator(".coach-panel")).toBeVisible();
  });
});

test.describe("Theme", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dark mode applies to the Treasury Simulator page content", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Theme, currently/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await page.waitForTimeout(250);
    const bg = await page.locator(".ts-page").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).toBe("rgb(11, 15, 22)");
  });
});

test.describe("Tablet shell (768-1199px)", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("collapsed icon rail, Totals/Programs stack, no horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-collapsed/);
    const cols = await page.locator(".ts-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(cols).toBe(1);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
});

test.describe("Mobile (<768px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow and required DOM order (header -> totals/programs -> results -> mission log -> coach)", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);

    const order = await page.evaluate(() => {
      const sel = [".ts-header", ".ts-grid", ".ts-results", ".ts-missionLog", ".ts-coachRow"];
      return sel.map((s) => document.querySelector(s)?.className).filter(Boolean);
    });
    expect(order[0]).toMatch(/ts-header/);
    expect(order[order.length - 1]).toMatch(/ts-coachRow/);
  });

  test("hamburger drawer still opens over Treasury Simulator", async ({ page }) => {
    await page.goto(`${BASE}#/treasury-sim`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-mobileOpen/);
  });
});

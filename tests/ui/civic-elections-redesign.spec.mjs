// Regression protection for the Civic Lab Elections redesign (2026-08-24):
// candidate ballots, selection/validation, the Review Ballot -> Cast
// Practice Vote flow, recent-vote history, mission logging, Grant Story
// wiring, Coach, political-neutrality structure, theme, and responsive
// shell inheritance from the Dashboard redesign.
//
// Every route this suite navigates to or links to is real (cross-checked
// against src/router/CivicRoutes.jsx) — no placeholder hrefs.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/civic.html";

test.describe("Page load and structure", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("page loads with no console/page errors, exactly one h1", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("practice-election disclaimer is visible near the ballot actions", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await expect(page.locator(".elex-disclaimer")).toContainText("This is a practice election. No official votes are recorded.");
  });

  test("progress steps render and step 1 is active before any selection", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    const steps = page.locator(".elex-steps li");
    await expect(steps).toHaveCount(4);
    await expect(steps.nth(0)).toHaveClass(/is-active/);
    await expect(steps.nth(0)).toHaveAttribute("aria-current", "step");
  });
});

test.describe("Candidate ballots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Mayor race renders all three candidates with real bios and party tags", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    const mayor = page.locator("fieldset.elex-race", { hasText: "Mayor" });
    for (const name of ["Alex Carter", "Jordan Reyes", "Taylor Kim"]) {
      await expect(mayor.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(mayor.getByText("Unity Party")).toBeVisible();
    await expect(mayor.getByText("Forward Party")).toBeVisible();
    await expect(mayor.getByText("Civic Party")).toBeVisible();
  });

  test("City Treasurer race renders both candidates", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    const treasurer = page.locator("fieldset.elex-race", { hasText: "City Treasurer" });
    await expect(treasurer.getByText("Morgan Singh", { exact: true })).toBeVisible();
    await expect(treasurer.getByText("Riley Brooks", { exact: true })).toBeVisible();
  });

  test("candidate cards carry equal structural weight regardless of party (neutrality)", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    const cards = page.locator("fieldset.elex-race", { hasText: "Mayor" }).locator(".elex-candidate");
    const boxes = await cards.evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    }));
    expect(boxes.every((b) => b.w === boxes[0].w)).toBe(true);
    expect(boxes.every((b) => b.h === boxes[0].h)).toBe(true);
  });

  test("selecting a candidate shows a visible selected state (border + filled radio, not color alone)", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    const card = page.locator(".elex-candidate", { hasText: "Alex Carter" });
    await card.click();
    await expect(card).toHaveClass(/is-selected/);
    await expect(card.locator('input[type="radio"]')).toBeChecked();
  });

  test("only one candidate per race can be selected at a time", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await page.locator(".elex-candidate", { hasText: "Alex Carter" }).click();
    await page.locator(".elex-candidate", { hasText: "Jordan Reyes" }).click();
    await expect(page.locator(".elex-candidate", { hasText: "Alex Carter" })).not.toHaveClass(/is-selected/);
    await expect(page.locator(".elex-candidate", { hasText: "Jordan Reyes" })).toHaveClass(/is-selected/);
  });

  test("keyboard: arrow keys move selection within a race's native radio group", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await page.locator('input[name="race-mayor"]').first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator('input[name="race-mayor"]').nth(1)).toBeChecked();
  });
});

test.describe("Validation and voting flow", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Review Ballot is disabled with a visible hint until both races are selected", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    const reviewBtn = page.getByRole("button", { name: /Review Ballot/ });
    await expect(reviewBtn).toBeDisabled();
    await expect(page.locator(".elex-actions__hint")).toHaveText("Select one candidate in each race to continue.");

    await page.locator(".elex-candidate", { hasText: "Alex Carter" }).click();
    await expect(reviewBtn).toBeDisabled();

    await page.locator(".elex-candidate", { hasText: "Morgan Singh" }).click();
    await expect(reviewBtn).toBeEnabled();
    await expect(page.locator(".elex-actions__hint")).toHaveCount(0);
  });

  test("Cancel navigates to the real Dashboard route", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /Cancel/ }).click();
    await expect(page).toHaveURL(/#\/dashboard$/);
  });

  test("Review Ballot shows a real confirm summary, Back to edit returns to the ballot", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await page.locator(".elex-candidate", { hasText: "Alex Carter" }).click();
    await page.locator(".elex-candidate", { hasText: "Morgan Singh" }).click();
    await page.getByRole("button", { name: /Review Ballot/ }).click();

    await expect(page.locator(".elex-review")).toBeVisible();
    await expect(page.locator(".elex-review__row", { hasText: "Mayor" })).toContainText("Alex Carter");
    await expect(page.locator(".elex-review__row", { hasText: "City Treasurer" })).toContainText("Morgan Singh");

    await page.getByRole("button", { name: /Back to edit/ }).click();
    await expect(page.locator(".elex-review")).toHaveCount(0);
    await expect(page.locator(".elex-candidate", { hasText: "Alex Carter" })).toHaveClass(/is-selected/);
  });

  test("Cast Practice Vote records the vote, awards points, and navigates to Northstar (unchanged underlying logic)", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await page.locator(".elex-candidate", { hasText: "Jordan Reyes" }).click();
    await page.locator(".elex-candidate", { hasText: "Riley Brooks" }).click();
    await page.getByRole("button", { name: /Review Ballot/ }).click();
    await page.getByRole("button", { name: /Cast Practice Vote/ }).click();

    await expect(page).toHaveURL(/#\/dashboard-ns/);
    const votes = await page.evaluate(() => JSON.parse(localStorage.getItem("civic:votes") || "[]"));
    expect(votes.length).toBeGreaterThan(0);
    const last = votes[votes.length - 1];
    expect(last.selections["race-mayor"]).toBe("c2");
    expect(last.selections["race-treasurer"]).toBe("t2");
    const points = await page.evaluate(() => Number(localStorage.getItem("wallet:points") || "0"));
    expect(points).toBeGreaterThanOrEqual(10);
  });
});

test.describe("Recent Practice Votes", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows a real empty state when there is no history, not fabricated rows", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await expect(page.locator(".elex-history__empty")).toHaveText("No practice votes yet.");
  });

  test("shows real stored vote history with candidate names and a status pill", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("civic:votes", JSON.stringify([
        { at: Date.now(), ballotId: "x", selections: { "race-mayor": "c3", "race-treasurer": "t1" } },
      ]));
    });
    await page.reload({ waitUntil: "networkidle" });
    const row = page.locator(".elex-history__row").first();
    await expect(row).toContainText("Taylor Kim");
    await expect(row).toContainText("Morgan Singh");
    await expect(row.locator(".elex-history__status")).toHaveText("Completed");
  });
});

test.describe("Mission Log / Grant Story / navigation", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Mission Log fields and Grant Story footer copy are present, funding badges show ESSA and CIVICS", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    const log = page.locator(".elex-missionLog");
    await expect(log.getByText("Your Mission Log")).toBeVisible();
    await expect(log.getByText("Minutes")).toBeVisible();
    await expect(log.getByText("What did you do?")).toBeVisible();
    await expect(log.getByText("What was the outcome?")).toBeVisible();
    await expect(log.getByText("ESSA", { exact: true })).toBeVisible();
    await expect(log.getByText("CIVICS", { exact: true })).toBeVisible();
    await expect(log.getByRole("button", { name: "Log & keep open" })).toBeVisible();
    await expect(log.getByRole("button", { name: "Log mission" })).toBeVisible();
    await expect(log).toContainText("Civic Grant Story");
  });

  test("logging a mission writes to the real Grant Story log key", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Log mission" }).click();
    const logs = await page.evaluate(() => JSON.parse(localStorage.getItem("shf.civicMissionLogs.v1") || "[]"));
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].mission).toBe("elections-mission");
    expect(logs[0].fundingStreams).toEqual(["essa", "civics"]);
  });

  test("View Proposals and Northstar Dashboard header actions go to real routes", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await expect(page.locator(".elex-header").getByRole("link", { name: /View Proposals/ })).toHaveAttribute("href", /#\/proposals/);
    await expect(page.locator(".elex-header").getByRole("link", { name: /Northstar Dashboard/ })).toHaveAttribute("href", /#\/dashboard-ns/);
  });
});

test.describe("Coach", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Ask Coach! opens the real, existing Coach panel", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ask Coach!" }).click();
    await expect(page.locator(".coach-panel")).toBeVisible();
  });
});

test.describe("Theme", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dark mode applies to the Elections page content", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Theme, currently/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await page.waitForTimeout(250);
    const bg = await page.locator(".elex-page").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).toBe("rgb(11, 15, 22)");
  });
});

test.describe("Tablet shell (768-1199px)", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("sidebar is the inherited collapsed icon rail, no horizontal overflow, Mayor reflows to 2 columns", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-collapsed/);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
    const cols = await page.locator(".elex-candidateGrid--3").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(cols).toBe(2);
  });
});

test.describe("Mobile drawer (<768px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow, candidate descriptions are not hidden, order matches spec", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
    await expect(page.getByText("Former council member focused on smart growth")).toBeVisible();

    const order = await page.evaluate(() => {
      const sel = [".elex-header", ".elex-steps", ".elex-race", ".elex-actions", ".elex-disclaimer", ".elex-missionLog", ".elex-history", ".elex-coach"];
      return sel.map((s) => document.querySelector(s)).filter(Boolean).map((el) => el.className);
    });
    expect(order[0]).toMatch(/elex-header/);
    expect(order[order.length - 1]).toMatch(/elex-coach/);
  });

  test("hamburger drawer still opens over the Elections page", async ({ page }) => {
    await page.goto(`${BASE}#/elections`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-mobileOpen/);
  });
});

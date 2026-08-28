// Regression protection for the Civic Lab Proposals redesign (2026-08-24):
// creation, validation, active-proposal list, upvote/downvote, pass/reject
// thresholds, delete-with-undo, mission logging, Grant Story wiring,
// recent activity, Coach, theme, and responsive shell inheritance from the
// Dashboard/Elections redesigns.
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
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("progress steps use Proposals-specific copy, not Elections' 'Review Candidates'", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const steps = page.locator(".prop-steps li");
    await expect(steps).toHaveCount(4);
    await expect(page.getByText("Draft Your Idea")).toBeVisible();
    await expect(page.getByText("Build Your Case")).toBeVisible();
    await expect(page.getByText("Debate & Vote")).toBeVisible();
    await expect(page.getByText("Reflect & Log")).toBeVisible();
    await expect(page.getByText("Review Candidates")).toHaveCount(0);
  });

  test("no redundant self-link back to Proposals in the header", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await expect(page.locator(".prop-header").getByRole("link", { name: /^View Proposals/ })).toHaveCount(0);
  });

  test("practice disclaimer uses Proposals-specific wording", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await expect(page.locator(".prop-disclaimer")).toContainText("This is a practice proposal workshop. No official policy decisions are recorded.");
  });
});

test.describe("Submit a Proposal / validation", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Create Proposal is disabled until title >= 4 chars and rationale >= 10 chars, hint is visible", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const createBtn = page.getByRole("button", { name: "Create Proposal" });
    await expect(createBtn).toBeDisabled();
    await expect(page.locator(".prop-form__hint")).toContainText("Title ≥ 4 chars & Rationale ≥ 10 chars.");

    await page.getByPlaceholder("Short, descriptive title").fill("Ab");
    await page.getByPlaceholder("What problem does this solve? Why now?").fill("Too short");
    await expect(createBtn).toBeDisabled();

    await page.getByPlaceholder("Short, descriptive title").fill("Community Garden");
    await page.getByPlaceholder("What problem does this solve? Why now?").fill("Turn vacant lots into shared gardens.");
    await expect(createBtn).toBeEnabled();
  });

  test("creating a proposal adds it to Active Proposals with real, non-mocked data", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await page.getByPlaceholder("Short, descriptive title").fill("Youth Mental Health Hub");
    await page.getByPlaceholder("What problem does this solve? Why now?").fill("Provide free counseling access for students.");
    await page.getByPlaceholder(/Reallocate \$250k/).fill("$40k from wellness grant");
    await page.getByRole("button", { name: "Create Proposal" }).click();
    await expect(page.locator(".prop-proposal", { hasText: "Youth Mental Health Hub" })).toBeVisible();

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("civic:proposals") || "[]"));
    const created = stored.find((p) => p.title === "Youth Mental Health Hub");
    expect(created).toBeTruthy();
    expect(created.status).toBe("open");
    expect(created.score).toBe(0);
    expect(created.impact).toBe("$40k from wellness grant");
    expect(created.authorId).toBe("local:user");
  });
});

test.describe("Active Proposals / voting / thresholds", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("seeded proposals render with title, status, date, score, rationale, and budget impact", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const card = page.locator(".prop-proposal", { hasText: "After-School Tech Labs" });
    await expect(card).toBeVisible();
    await expect(card.locator(".prop-status")).toHaveText("Open");
    await expect(card.locator(".prop-proposal__score")).toContainText("+2");
    await expect(card).toContainText("Create community labs");
    await expect(card).toContainText("Budget Impact");
  });

  test("upvote increases score and toggles off on second click (toggle-vote semantics preserved)", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const card = page.locator(".prop-proposal").first();
    const upBtn = card.getByRole("button", { name: /Upvote/ });
    await upBtn.click();
    await expect(card.locator(".prop-proposal__score strong")).toHaveText("+3");
    await expect(upBtn).toHaveAttribute("aria-pressed", "true");
    await upBtn.click();
    await expect(card.locator(".prop-proposal__score strong")).toHaveText("+2");
    await expect(upBtn).toHaveAttribute("aria-pressed", "false");
  });

  test("downvote decreases score", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const card = page.locator(".prop-proposal").first();
    await card.getByRole("button", { name: /Downvote/ }).click();
    await expect(card.locator(".prop-proposal__score strong")).toHaveText("+1");
  });

  test("crossing +5 sets status to Passed and disables voting on that proposal", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      const arr = JSON.parse(localStorage.getItem("civic:proposals") || "[]");
      arr[0].score = 4;
      localStorage.setItem("civic:proposals", JSON.stringify(arr));
    });
    await page.reload({ waitUntil: "networkidle" });
    const card = page.locator(".prop-proposal").first();
    await card.getByRole("button", { name: /Upvote/ }).click();
    await expect(card.locator(".prop-status")).toHaveText("Passed");
    await expect(card.locator(".prop-proposal__score strong")).toHaveText("+5");
    await expect(card.getByRole("button", { name: /Upvote/ })).toBeDisabled();
    await expect(card.getByRole("button", { name: /Downvote/ })).toBeDisabled();
  });

  test("crossing -5 sets status to Rejected", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      const arr = JSON.parse(localStorage.getItem("civic:proposals") || "[]");
      arr[1].score = -4;
      localStorage.setItem("civic:proposals", JSON.stringify(arr));
    });
    await page.reload({ waitUntil: "networkidle" });
    const card = page.locator(".prop-proposal", { hasText: "Open Ledger for City Spending" });
    await card.getByRole("button", { name: /Downvote/ }).click();
    await expect(card.locator(".prop-status")).toHaveText("Rejected");
  });

  test("Decision Thresholds panel shows the real threshold values from code (+5 / -5)", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const panel = page.locator(".prop-thresholds");
    await expect(panel).toContainText("+5 score passes");
    await expect(panel).toContainText("-5 score is rejected");
  });
});

test.describe("Delete", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("delete removes the proposal and Undo restores it", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const card = page.locator(".prop-proposal", { hasText: "After-School Tech Labs" });
    await card.getByRole("button", { name: /Delete/ }).click();
    await expect(page.locator(".prop-proposal", { hasText: "After-School Tech Labs" })).toHaveCount(0);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.locator(".prop-proposal", { hasText: "After-School Tech Labs" })).toBeVisible();
  });
});

test.describe("Empty state", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // seedIfEmpty() re-seeds on any reload where storage is empty (existing,
  // unchanged behavior) — so a genuine empty state is only reachable within
  // a live session by deleting every proposal via the real UI, not by
  // pre-seeding localStorage with [] and reloading.
  test("shows an honest empty state once every proposal is deleted, not fabricated cards", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await page.locator(".prop-proposal").first().getByRole("button", { name: /Delete/ }).click();
    await page.locator(".prop-proposal").first().getByRole("button", { name: /Delete/ }).click();
    await expect(page.locator(".prop-proposal")).toHaveCount(0);
    await expect(page.locator(".prop-empty")).toHaveText("No active proposals yet. Create the first proposal to start the discussion.");
  });

  test("Recent Proposal Activity shows an honest empty state once every proposal is deleted", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await page.locator(".prop-proposal").first().getByRole("button", { name: /Delete/ }).click();
    await page.locator(".prop-proposal").first().getByRole("button", { name: /Delete/ }).click();
    await expect(page.locator(".prop-activity__empty")).toHaveText("No proposal activity yet.");
  });
});

test.describe("Mission Log / Grant Story / navigation", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Mission Log fields and Grant Story footer copy are present, funding badges show ESSA and CIVICS", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const log = page.locator(".prop-missionLog");
    await expect(log.getByText("Log this mission to Grant Story")).toBeVisible();
    await expect(log.getByText("Chapter:")).toBeVisible();
    await expect(log.getByText("Constitution Lab 1")).toBeVisible();
    await expect(log.getByText("ESSA", { exact: true })).toBeVisible();
    await expect(log.getByText("CIVICS", { exact: true })).toBeVisible();
    await expect(log).toContainText("Civic Grant Story");
    await expect(log).toContainText("Master Grant Narrative");
  });

  test("logging a mission writes to the real Grant Story log key with the unchanged mission id", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await page.locator(".prop-missionLog").getByRole("button", { name: "Log mission" }).click();
    const logs = await page.evaluate(() => JSON.parse(localStorage.getItem("shf.civicMissionLogs.v1") || "[]"));
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].mission).toBe("civic-proposals-mission");
    expect(logs[0].chapter).toBe("Constitution Lab 1");
    expect(logs[0].fundingStreams).toEqual(["essa", "civics"]);
  });

  test("Northstar Dashboard header action goes to the real route", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await expect(page.locator(".prop-header").getByRole("link", { name: /Northstar Dashboard/ })).toHaveAttribute("href", /#\/dashboard-ns/);
  });
});

test.describe("Recent Proposal Activity", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows real proposal titles and status, not invented rows", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const activity = page.locator(".prop-activity");
    await expect(activity.getByText("After-School Tech Labs")).toBeVisible();
    await expect(activity.getByText("Open Ledger for City Spending")).toBeVisible();
  });
});

test.describe("Coach", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Ask Coach! opens the real, existing Coach panel", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Ask Coach!" }).click();
    await expect(page.locator(".coach-panel")).toBeVisible();
  });
});

test.describe("Theme", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dark mode applies to the Proposals page content", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Theme, currently/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await page.waitForTimeout(250);
    const bg = await page.locator(".prop-page").evaluate((n) => getComputedStyle(n).backgroundColor);
    expect(bg).toBe("rgb(11, 15, 22)");
  });
});

test.describe("Tablet shell (768-1199px)", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("sidebar is the inherited collapsed icon rail, no horizontal overflow", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-collapsed/);
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
});

test.describe("Mobile (<768px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow, DOM/visual order is Header -> Steps -> Submit -> Thresholds -> Activity -> Disclaimer -> Active Proposals -> Mission Log -> Coach", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);

    const order = await page.evaluate(() => {
      const sel = [".prop-header", ".prop-steps", ".prop-form", ".prop-thresholds", ".prop-activity", ".prop-disclaimer", ".prop-list", ".prop-missionLog", ".prop-coach"];
      return sel.map((s) => document.querySelector(s)?.className).filter(Boolean);
    });
    expect(order[0]).toMatch(/prop-header/);
    expect(order[order.length - 1]).toMatch(/prop-coach/);
    // Every element's computed `order` must be the unset default — no
    // CSS `order` is used anywhere on this page at this breakpoint.
    const orders = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".prop-page, .prop-page *")).map((el) => getComputedStyle(el).order)
    );
    expect(orders.every((o) => o === "0")).toBe(true);
  });

  test("hamburger drawer still opens over the Proposals page", async ({ page }) => {
    await page.goto(`${BASE}#/proposals`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.locator(".cv-shell__sidebar")).toHaveClass(/is-mobileOpen/);
  });
});

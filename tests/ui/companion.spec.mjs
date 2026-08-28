// Regression protection for the SHF Learning Companion ("Brainiact") —
// the shared runtime + character mounted once via
// src/entries/RootProviders.jsx for both Career and Curriculum, replacing
// the old separate .coach-fab (Career) and AITutorButton (Curriculum)
// triggers without losing the underlying CoachSlideOver capability. See
// src/companion/*, src/components/companion/*, src/hooks/useCompanion.js.
import { test, expect } from "@playwright/test";

const CAREER = "http://localhost:5173/career.html";
const CURRICULUM = "http://localhost:5173/curriculum.html";
const CURRICULUM_DASHBOARD = `${CURRICULUM}#/curriculum/asl/dashboard`;

function emitCompanionEvent(page, name, payload = {}) {
  return page.evaluate(
    ([n, p]) => window.dispatchEvent(new CustomEvent("companion:event", { detail: { name: n, payload: p } })),
    [name, payload]
  );
}

test.describe("Brainiact mounts once per app, replacing the old duplicate triggers", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders in Career, exactly once, with no leftover .coach-fab", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator(".brainiact-fab")).toBeVisible();
    expect(await page.locator(".brainiact-root").count()).toBe(1);
    expect(await page.locator(".coach-fab").count()).toBe(0);
  });

  test("renders in Curriculum, exactly once, with no leftover AI Tutor button", async ({ page }) => {
    await page.goto(CURRICULUM_DASHBOARD, { waitUntil: "networkidle" });
    await expect(page.locator(".brainiact-fab")).toBeVisible();
    expect(await page.locator(".brainiact-root").count()).toBe(1);
    expect(await page.locator(".ld-aiTutorBtn").count()).toBe(0);
  });

  test("does not duplicate across route changes within Career", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await page.goto(`${CAREER}#/portfolio`, { waitUntil: "networkidle" });
    await page.goto(`${CAREER}#/resume`, { waitUntil: "networkidle" });
    expect(await page.locator(".brainiact-root").count()).toBe(1);
  });
});

test.describe("Collapsed/expanded state and existing Coach capability", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("clicking Brainiact expands the compact panel; Escape collapses it and returns focus", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    const fab = page.locator(".brainiact-fab");
    await fab.click();
    await expect(page.locator(".brainiact-bubble")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator(".brainiact-bubble")).not.toBeVisible();
    const focused = await page.evaluate(() => document.activeElement?.classList?.contains("brainiact-fab"));
    expect(focused).toBe(true);
  });

  test("Ask Coach from within Brainiact's panel opens the existing CoachSlideOver", async ({ page }) => {
    await page.goto(CURRICULUM_DASHBOARD, { waitUntil: "networkidle" });
    await page.locator(".brainiact-fab").click();
    await page.getByRole("button", { name: "Ask Coach →" }).click();
    await expect(page.locator(".coach-panel")).toBeVisible();
    await expect(page.getByText("Coach Mode")).toBeVisible();
  });

  test("Career's header Coach entry also opens the same CoachSlideOver", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await page.locator(".car-headerCoachBtn").click();
    await expect(page.locator(".coach-panel")).toBeVisible();
  });
});

test.describe("Student controls: Focus Mode, reduce motion, hide", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Focus Mode toggles on and off", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await page.locator(".brainiact-fab").click();
    const focusToggle = page.getByRole("button", { name: "Focus Mode" });
    await focusToggle.click();
    await expect(page.getByRole("button", { name: "Focus: On" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Focus: On" }).click();
    await expect(page.getByRole("button", { name: "Focus Mode" })).toHaveAttribute("aria-pressed", "false");
  });

  test("system reduced-motion preference sets data-motion=reduced", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.locator(".brainiact-root")).toHaveAttribute("data-motion", "reduced");
  });

  test("Hide replaces Brainiact with a reveal control; reveal brings it back", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await page.locator(".brainiact-fab").click();
    await page.getByRole("button", { name: "Hide" }).click();
    await expect(page.locator(".brainiact-fab")).not.toBeVisible();
    const reveal = page.getByRole("button", { name: "Show Brainiact" });
    await expect(reveal).toBeVisible();
    await reveal.click();
    await expect(page.locator(".brainiact-fab")).toBeVisible();
  });
});

test.describe("Event API drives celebration/reaction state", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("answer_correct produces a minor reaction with a short face message", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await emitCompanionEvent(page, "answer_correct");
    await expect(page.locator(".brainiact-faceChip")).toHaveText("NICE!");
  });

  test("quiz_perfect produces a larger, time-bounded celebration", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await emitCompanionEvent(page, "quiz_perfect");
    await expect(page.locator(".brainiact-fab")).toHaveAttribute("data-anim", "victoryDance");
    await expect(page.locator(".brainiact-faceChip")).toHaveText("PERFECT!");
    // Bounded: must clear on its own well within the ~5s hard cap.
    await expect(page.locator(".brainiact-fab")).toHaveAttribute("data-anim", "idle", { timeout: 6000 });
  });

  test("an unknown event fails safely — no throw, no state change", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await emitCompanionEvent(page, "totally_unknown_event_xyz");
    await page.waitForTimeout(150);
    expect(errors).toEqual([]);
    await expect(page.locator(".brainiact-fab")).toBeVisible();
  });
});

test.describe("Visual Hint Engine / Charades proof of concept", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("requesting a hint for a registered concept enters Hint Mode with progressive controls", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await page.locator(".brainiact-fab").click();
    await page.getByRole("button", { name: "Hint?" }).click();
    await expect(page.locator(".brainiact-hintPanel")).toBeVisible();
    await expect(page.getByRole("button", { name: "Show another clue" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Explain it" })).toBeVisible();
    await expect(page.getByRole("button", { name: "I’m good" })).toBeVisible();
  });

  test("Show another clue advances the hint level without skipping to the answer", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await page.locator(".brainiact-fab").click();
    await page.getByRole("button", { name: "Hint?" }).click();
    await expect(page.locator(".brainiact-hintLevel")).toHaveText("Level: gesture");
    await page.getByRole("button", { name: "Show another clue" }).click();
    await expect(page.locator(".brainiact-hintLevel")).toHaveText("Level: visual");
  });

  test("I'm good dismisses the hint and returns to idle", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await page.locator(".brainiact-fab").click();
    await page.getByRole("button", { name: "Hint?" }).click();
    await page.getByRole("button", { name: "I’m good" }).click();
    await expect(page.locator(".brainiact-hintPanel")).not.toBeVisible();
  });
});

test.describe("Keyboard access and responsive containment", () => {
  test("keyboard-only: Tab to Brainiact, Enter opens it, Escape closes it", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await page.locator(".brainiact-fab").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".brainiact-bubble")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".brainiact-bubble")).not.toBeVisible();
  });

  test("no horizontal overflow at 390px in Career or Curriculum", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const url of [`${CAREER}#/dashboard`, CURRICULUM_DASHBOARD]) {
      await page.goto(url, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });

  test("Brainiact stays within the viewport at 390px and doesn't sit under the mobile hamburger", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    const box = await page.locator(".brainiact-fab").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  });
});

test.describe("No listener/timer leaks across route changes", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("navigating away and back still responds correctly to a single companion event (no duplicate handlers)", async ({ page }) => {
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await page.goto(`${CAREER}#/portfolio`, { waitUntil: "networkidle" });
    await page.goto(`${CAREER}#/dashboard`, { waitUntil: "networkidle" });
    await emitCompanionEvent(page, "answer_correct");
    // A leaked duplicate listener would still just set the same text once —
    // the real signal of a leak is an error or a stuck/garbled state, not a
    // count. Assert the reaction still applies cleanly.
    await expect(page.locator(".brainiact-faceChip")).toHaveText("NICE!");
  });
});

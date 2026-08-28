// Regression protection for the Career Pathways plan-generation and
// Personalizer repair (recommendPlans argument order + Personalizer
// contract). See src/pages/CareerPathways.jsx and
// src/components/PathwayPersonalizerSheet.jsx.
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/career.html";
const PATH = `${BASE}#/career/pathways`;

async function gotoPathways(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(PATH, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Your Career Plan" })).toBeVisible();
  return errors;
}

async function openPersonalizer(page) {
  await page.getByRole("button", { name: "Personalize" }).click();
  return page.getByRole("dialog", { name: "Personalize your plan" });
}

test.describe("recommendPlans module contract (direct)", () => {
  test("correct argument order: (inputs, pathways) generates plans from valid data", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "networkidle" });
    const result = await page.evaluate(async () => {
      const mod = await import("/src/utils/recommendPlans.js");
      const pathways = [
        { id: "p1", title: "Solar Installer", cluster: "Green", estWeeks: 10, estCost: 1000 },
        { id: "p2", title: "Wind Tech", cluster: "Green", estWeeks: 8, estCost: 800 },
      ];
      return mod.default({}, pathways);
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("strategy");
    expect(result[0]).toHaveProperty("pathwayId");
    expect(result[0]).toHaveProperty("pathway");
  });

  test("empty pathways collection returns an empty array, not a crash", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "networkidle" });
    const result = await page.evaluate(async () => {
      const mod = await import("/src/utils/recommendPlans.js");
      return mod.default({}, []);
    });
    expect(result).toEqual([]);
  });

  test("malformed pathway entries are handled safely (no throw)", async ({ page }) => {
    await page.goto(PATH, { waitUntil: "networkidle" });
    const result = await page.evaluate(async () => {
      const mod = await import("/src/utils/recommendPlans.js");
      const malformed = [null, undefined, {}, { title: "No id or cost" }, { id: "ok", title: "Fine", estWeeks: 5, estCost: 500 }];
      try {
        return { ok: true, plans: mod.default({}, malformed) };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    });
    expect(result.ok).toBe(true);
    expect(Array.isArray(result.plans)).toBe(true);
  });
});

test.describe("Plan A/B/C auto-generation on load", () => {
  test("plans populate automatically — 'No plans yet' is never shown with real pathway data", async ({ page }) => {
    const errors = await gotoPathways(page);
    await expect(page.getByText("No plans yet.")).toHaveCount(0);
    // exact: true — the visual upgrade added a "Plan A · Recommended" badge,
    // which is a loose substring match of "Plan A" and would be ambiguous.
    await expect(page.getByText("Plan A", { exact: true })).toBeVisible();
    await expect(page.getByText("Plan B", { exact: true })).toBeVisible();
    await expect(page.getByText("Plan C", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("generated plans remain selectable and update the Selected Plan Details panel", async ({ page }) => {
    await gotoPathways(page);
    const planBCard = page.locator("article", { hasText: "Plan B" });
    await planBCard.getByRole("button", { name: "Select" }).click();
    await expect(planBCard.getByRole("button", { name: "Selected" })).toBeVisible();
  });

  test("Detail Drawer opens from a generated plan (View Path)", async ({ page }) => {
    await gotoPathways(page);
    const planACard = page.locator("article", { hasText: "Plan A" });
    const title = await planACard.locator("h3").first().textContent();
    await planACard.getByRole("button", { name: "View Path" }).click();
    // Scoped by class: the shared Ask Coach panel is also role="dialog" and
    // permanently in the DOM, so an unscoped getByRole("dialog") is ambiguous.
    const dialog = page.locator(".pd-modal");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(title.trim());
    await dialog.locator(".pd-foot").getByRole("button", { name: "Close" }).click();
    await expect(page.locator(".pd-modal")).toHaveCount(0);
  });

  test("Career Consultant receives the selected pathway as context", async ({ page }) => {
    await gotoPathways(page);
    const planACard = page.locator("article", { hasText: "Plan A" });
    const title = (await planACard.locator("h3").first().textContent()).trim();
    // The visual upgrade relabels this panel "Coach Mode" (was "AI Career
    // Consultant") via CareerConsultantPanel's new `title` prop — same
    // component, same pathway-context wiring, just a different eyebrow label.
    await expect(page.locator("section", { hasText: "Coach Mode" }).first()).toContainText(title);
  });

  test("existing Funding Wizard remains functional and unaffected", async ({ page }) => {
    await gotoPathways(page);
    await page.getByRole("heading", { name: "Funding Wizard" }).scrollIntoViewIfNeeded();
    await page.getByLabel("State").fill("OH");
    await page.getByRole("button", { name: "Build funding plan" }).click();
    await expect(page.getByText("Estimated coverage:")).toBeVisible();
  });

  test("existing note/task stores remain untouched by this repair", async ({ page }) => {
    await gotoPathways(page);
    // The visual upgrade authorizedly reorganizes Collaboration/Tasks into
    // the Team Workspace tabs (same components, same storage keys, just no
    // longer both stacked full-width and visible at once) — navigate to
    // each tab before asserting, same as a real user would.
    await expect(page.getByRole("heading", { name: "Collaboration" })).toBeVisible();
    await expect(page.getByPlaceholder("Add a note for your coach or parent…")).toBeVisible();
    await page.getByRole("tab", { name: "Plan Tasks" }).click();
    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  });

  test("existing Career routes remain functional", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${BASE}#/dashboard`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Career Center" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("Personalizer: open / validate / cancel / complete", () => {
  test("Personalizer opens as an accessible dialog", async ({ page }) => {
    await gotoPathways(page);
    const dialog = await openPersonalizer(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  test("Cancel closes without changing the existing plans", async ({ page }) => {
    await gotoPathways(page);
    const planATitleBefore = (await page.locator("article", { hasText: "Plan A" }).locator("h3").first().textContent()).trim();
    const dialog = await openPersonalizer(page);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog", { name: "Personalize your plan" })).toHaveCount(0);
    const planATitleAfter = (await page.locator("article", { hasText: "Plan A" }).locator("h3").first().textContent()).trim();
    expect(planATitleAfter).toBe(planATitleBefore);
  });

  test("validation: empty hours-per-week shows an accessible error and does not submit", async ({ page }) => {
    await gotoPathways(page);
    const dialog = await openPersonalizer(page);
    const hours = dialog.getByLabel("Hours per week you can commit");
    await hours.fill("");
    await dialog.getByRole("button", { name: "Generate Plan A/B/C" }).click();
    await expect(dialog.getByRole("alert")).toContainText("Enter how many hours per week");
    await expect(dialog).toBeVisible(); // still open — did not submit
  });

  test("successful completion calls the output callback and populates Plan A/B/C", async ({ page }) => {
    await gotoPathways(page);
    const dialog = await openPersonalizer(page);
    await dialog.getByLabel("Hours per week you can commit").fill("15");
    await dialog.getByRole("button", { name: "Generate Plan A/B/C" }).click();
    await expect(page.getByRole("dialog", { name: "Personalize your plan" })).toHaveCount(0);
    // exact: true — the sr-only completion announcement also contains the
    // substring "Plan A", so a loose match would be ambiguous.
    await expect(page.getByText("Plan A", { exact: true })).toBeVisible();
    await expect(page.getByText("Plan B", { exact: true })).toBeVisible();
    await expect(page.getByText("Plan C", { exact: true })).toBeVisible();
  });

  test("no valid pathways for a narrow filter shows an honest message, not a crash or fake plans", async ({ page }) => {
    await gotoPathways(page);
    const dialog = await openPersonalizer(page);
    // Force an impossible filter via the DOM (a cluster string that can't match)
    await page.evaluate(() => {
      const sel = document.getElementById("pp-cluster");
      const opt = document.createElement("option");
      opt.value = "__no_such_cluster__";
      opt.textContent = "__no_such_cluster__";
      sel.appendChild(opt);
      sel.value = "__no_such_cluster__";
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await dialog.getByRole("button", { name: "Generate Plan A/B/C" }).click();
    await expect(dialog.getByRole("alert")).toContainText(/No pathways currently exist/);
    await expect(dialog).toBeVisible();
  });

  test("reward is issued only after genuine completion, not on cancel", async ({ page }) => {
    await gotoPathways(page);
    const events = [];
    await page.exposeFunction("__testCaptureEarn", (detail) => events.push(detail));
    await page.evaluate(() => {
      window.shfCredit = window.shfCredit || {};
      window.shfCredit.earn = (detail) => window.__testCaptureEarn(detail);
    });

    // Cancel first — must not award.
    let dialog = await openPersonalizer(page);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    expect(events.length).toBe(0);

    // Now genuinely complete — must award exactly once.
    dialog = await openPersonalizer(page);
    await dialog.getByLabel("Hours per week you can commit").fill("12");
    await dialog.getByRole("button", { name: "Generate Plan A/B/C" }).click();
    await expect(page.getByRole("dialog", { name: "Personalize your plan" })).toHaveCount(0);
    expect(events.length).toBe(1);
    expect(events[0].action).toBe("pathway.personalized");
  });

  test("analytics fires at the correct success point", async ({ page }) => {
    await gotoPathways(page);
    const analyticsEvents = [];
    await page.exposeFunction("__testCaptureAnalytics", (e) => analyticsEvents.push(e));
    await page.evaluate(() => {
      window.addEventListener("analytics:event", (e) => window.__testCaptureAnalytics(e.detail));
    });
    const dialog = await openPersonalizer(page);
    await dialog.getByLabel("Hours per week you can commit").fill("12");
    await dialog.getByRole("button", { name: "Generate Plan A/B/C" }).click();
    await expect(page.getByRole("dialog", { name: "Personalize your plan" })).toHaveCount(0);
    const names = analyticsEvents.map((e) => e.event);
    expect(names).toContain("plan_personalizer_saved");
  });

  test("existing plan persists compatibly (schema unchanged) after a fresh personalization", async ({ page }) => {
    await gotoPathways(page);
    const dialog = await openPersonalizer(page);
    await dialog.getByLabel("Hours per week you can commit").fill("18");
    await dialog.getByRole("button", { name: "Generate Plan A/B/C" }).click();
    await expect(page.getByRole("dialog", { name: "Personalize your plan" })).toHaveCount(0);
    const planACard = page.locator("article", { hasText: "Plan A" });
    await expect(planACard.getByText(/wks/)).toBeVisible();
    await expect(planACard.getByText(/after aid/)).toBeVisible();
    await expect(planACard.getByText(/Next cohort:/)).toBeVisible();
  });
});

test.describe("Personalizer accessibility", () => {
  test("focus trapping keeps Tab cycling inside the dialog", async ({ page }) => {
    await gotoPathways(page);
    const dialog = await openPersonalizer(page);
    const closeBtn = dialog.getByRole("button", { name: "Close personalizer" });
    // Tab through everything and confirm focus never leaves the dialog.
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const stillInside = await page.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"][aria-labelledby="pp-title"]');
        return dlg ? dlg.contains(document.activeElement) : false;
      });
      expect(stillInside).toBe(true);
    }
    await closeBtn.click();
  });

  test("Escape closes the Personalizer and restores focus to the trigger", async ({ page }) => {
    await gotoPathways(page);
    const trigger = page.getByRole("button", { name: "Personalize" });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Personalize your plan" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Personalize your plan" })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("focus moves to the plan region after successful generation", async ({ page }) => {
    await gotoPathways(page);
    const dialog = await openPersonalizer(page);
    await dialog.getByLabel("Hours per week you can commit").fill("9");
    await dialog.getByRole("button", { name: "Generate Plan A/B/C" }).click();
    await expect(page.getByRole("dialog", { name: "Personalize your plan" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Your Career Plan" })).toBeFocused();
  });
});

test.describe("Responsive containment", () => {
  for (const [label, width, height] of [
    ["390x844", 390, 844],
    ["768x1024", 768, 1024],
    ["1024x768", 1024, 768],
    ["1440x900", 1440, 900],
  ]) {
    test(`Personalizer stays contained, no horizontal overflow at ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await gotoPathways(page);
      const dialog = await openPersonalizer(page);
      const box = await dialog.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);

      await dialog.getByRole("button", { name: "Cancel" }).click();
    });
  }

  for (const [label, width, height] of [
    ["390x844", 390, 844],
    ["768x1024", 768, 1024],
    ["1024x768", 1024, 768],
    ["1440x900", 1440, 900],
  ]) {
    test(`redesigned page layout has no horizontal overflow at ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await gotoPathways(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);
      // Core capability stays reachable at every width.
      await expect(page.getByRole("button", { name: "Personalize My Plan" })).toBeVisible();
    });
  }
});

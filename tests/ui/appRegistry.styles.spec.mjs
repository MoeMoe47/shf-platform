import { test, expect } from "@playwright/test";

test("App Registry cards have expected visual styling", async ({ page }) => {
  await page.goto("http://localhost:5173/admin.html#/alignment/app-registry", {
    waitUntil: "networkidle",
  });

  const card = page
    .locator('.ar-card:not([aria-hidden="true"])')
    .first();

  await expect(card).toBeVisible();

  const styles = await card.evaluate(el => {
    const cs = getComputedStyle(el);
    return {
      borderRadius: cs.borderRadius,
      backgroundColor: cs.backgroundColor,
      boxShadow: cs.boxShadow,
      opacity: cs.opacity,
    };
  });

  // Hard guarantees (these SHOULD NEVER regress)
  expect(styles.borderRadius).not.toBe("0px");
  expect(styles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(styles.boxShadow).not.toBe("none");
});

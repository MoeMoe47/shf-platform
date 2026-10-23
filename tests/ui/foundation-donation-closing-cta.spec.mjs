import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
for (const width of [1440, 1280, 768, 390]) {
  test(`Donation canonical closing CTA at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${origin}/foundation.html#/get-involved`);
    const cta = page.getByRole("region", {
      name: "Support the Silicon Heartland Foundation",
    });
    await expect(cta).toHaveCount(1);
    await expect(page.locator(".shf-footer")).toHaveCount(1);
    await expect(cta.getByRole("heading", { level: 2 })).toHaveText(
      "Invest in People. Strengthen Communities.",
    );
    expect(
      await cta.evaluate((n) =>
        n.nextElementSibling.matches("footer.shf-footer"),
      ),
    ).toBe(true);
    expect(
      await cta.evaluate((n) =>
        n.previousElementSibling.matches("main.shf-main"),
      ),
    ).toBe(true);
    const background = await cta.evaluate(
      (n) => getComputedStyle(n).backgroundImage,
    );
    expect(background).toContain("shf-footer-landscape-light");
    await page.evaluate(() => document.fonts.ready);
    await cta.scrollIntoViewIfNeeded();
    for (const action of await cta.getByRole("link").all()) {
      await action.focus();
      await expect(action).toBeFocused();
      expect(
        await action.evaluate((n) => getComputedStyle(n).outlineStyle),
      ).not.toBe("none");
      const box = await action.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await mkdir("docs/ui/foundation-donation/screenshots/section-08", {
      recursive: true,
    });
    await cta.screenshot({
      path: `docs/ui/foundation-donation/screenshots/section-08/closing-${width}.png`,
    });
    await cta
      .getByRole("link", { name: "Support SHF", exact: true })
      .press("Enter");
    await expect(page.locator("#make-a-gift")).toBeFocused();
    await expect(page).toHaveURL(/#\/get-involved$/);
    const headerHeight = await page
      .locator(".shf-institutional-header")
      .evaluate((n) => n.getBoundingClientRect().height);
    expect(
      await page
        .locator("#make-a-gift")
        .evaluate((n) => n.getBoundingClientRect().top),
    ).toBeGreaterThanOrEqual(headerHeight + 15);
    await cta
      .getByRole("link", { name: "Partner With Us", exact: true })
      .press("Enter");
    await expect(page).toHaveURL(/#\/partners$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Work with SHF",
    );
  });
}

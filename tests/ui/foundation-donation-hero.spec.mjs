import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
for (const width of [1440, 1280, 768, 390]) {
  test(`approved Donation Hero at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/foundation.html#/get-involved`);
    const hero = page.getByRole("region", {
      name: "Invest in People.Build BrighterTomorrows.",
    });
    await expect(hero).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    const image = hero.getByRole("img");
    await expect(image).toHaveAttribute(
      "src",
      "/assets/foundation/donation/donation-hero.webp",
    );
    await expect
      .poll(() => image.evaluate((n) => n.complete && n.naturalWidth === 1672))
      .toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await expect(hero.locator(".shf-donation-handwritten")).toHaveText(
      "OPPORTUNITYCHANGESLIVES.",
    );
    expect(
      await hero
        .locator(".shf-donation-handwritten")
        .evaluate((n) => getComputedStyle(n).backgroundColor),
    ).toBe("rgba(0, 0, 0, 0)");
    expect(
      await hero.evaluate((n) =>
        n.nextElementSibling.classList.contains("shf-donation-nav"),
      ),
    ).toBe(true);
    const heroBox = await hero.boundingBox();
    const navBox = await page.locator(".shf-donation-nav").boundingBox();
    expect(
      Math.abs(navBox.y - (heroBox.y + heroBox.height)),
    ).toBeLessThanOrEqual(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await mkdir("docs/ui/foundation-donation/screenshots/section-02", {
      recursive: true,
    });
    await hero.screenshot({
      path: `docs/ui/foundation-donation/screenshots/section-02/hero-${width}.png`,
    });
  });
}

import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route("**/foundation/donations/checkout", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "donation_provider_unavailable" }),
    }),
  );
});
import { mkdir } from "node:fs/promises";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
for (const width of [1440, 1280, 768, 390]) {
  test(`Choose Your Impact behavior and layout at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${origin}/foundation.html#/get-involved`);
    const section = page.getByRole("region", { name: "Choose Your Impact." });
    const form = section.locator("form");
    const input = page.getByLabel("Custom Amount");
    const give = form.getByRole("button", { name: "Give Now", exact: true });
    await expect(section).toBeVisible();
    await expect(form.locator('[aria-pressed="true"]')).toHaveCount(0);
    for (const [index, amount] of [25, 50, 100, 250].entries()) {
      const preset = form.locator(".shf-gift-presets button").nth(index);
      await preset.focus();
      await preset.press(index % 2 ? "Space" : "Enter");
      await expect(preset).toHaveAttribute("aria-pressed", "true");
      await expect(form.locator('[aria-pressed="true"]')).toHaveCount(1);
      await expect(input).toHaveValue(String(amount));
    }
    await input.fill("42.37");
    await expect(form.locator('[aria-pressed="true"]')).toHaveCount(0);
    for (const value of ["", "0", "-10", "not a number", "1.234"]) {
      await input.fill(value);
      await give.click();
      await expect(form.getByRole("alert")).toContainText(
        "positive USD amount",
      );
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toHaveValue(value);
      await expect(input).toBeFocused();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
    await input.fill("42.37");
    await input.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("$42.37");
    await expect(dialog).toContainText("provider must be connected");
    await expect(dialog).toContainText("No payment has been taken");
    await expect(
      dialog.getByRole("button", { name: "Close and return" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(give).toBeFocused();
    await give.press("Enter");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button").click();
    await expect(give).toBeFocused();
    const image = section.getByRole("img");
    await expect(image).toHaveAttribute(
      "src",
      "/assets/foundation/donation/donation-impact-support.webp",
    );
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((n) => n.complete && n.naturalWidth === 1122))
      .toBe(true);
    for (const button of await form.locator("button").all()) {
      const box = await button.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await page.evaluate(() => document.fonts.ready);
    await mkdir("docs/ui/foundation-donation/screenshots/section-04", {
      recursive: true,
    });
    await section.screenshot({
      path: `docs/ui/foundation-donation/screenshots/section-04/gift-${width}.png`,
    });
  });
}

import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
const url = `${origin}/foundation.html#/get-involved`;
const screenshots = "docs/ui/foundation-donation/screenshots";

for (const width of [1440, 1280, 768, 390]) {
  test(`donation page composition, images and overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Invest in People.Build BrighterTomorrows.",
    );
    await expect(page.locator(".shf-institutional-header")).toHaveCount(1);
    await expect(
      page.locator(".shf-institutional-header__support"),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.locator(".shf-institutional-header__brand img"),
    ).toHaveAttribute("src", "/assets/brand/shf-official-logo.webp");
    await expect(page.locator(".shf-giving-card")).toHaveCount(6);
    await expect(page.locator(".shf-final-cta")).toHaveCount(1);
    await expect(page.locator(".shf-footer")).toHaveCount(1);
    await expect(page.locator(".shf-final-cta h2")).toHaveText(
      "Invest in People. Strengthen Communities.",
    );
    const order = await page
      .locator(".shf-main")
      .evaluate((main) => [
        main.nextElementSibling.className,
        main.nextElementSibling.nextElementSibling.className,
      ]);
    expect(order).toEqual(["shf-final-cta", "shf-footer"]);
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.locator('.shf-donation-page [data-photo-status="owner-approved"]'),
    ).toHaveCount(9);
    await expect(page.locator(".shf-donation-page img")).toHaveCount(9);
    for (const image of await page
      .locator(
        ".shf-donation-page img, .shf-institutional-header img, .shf-footer img",
      )
      .all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate((node) => node.complete && node.naturalWidth > 0),
        )
        .toBe(true);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    await mkdir(screenshots, { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `${screenshots}/donation-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}

test("amount selection, validation, safe handoff and keyboard focus return", async ({
  page,
}) => {
  await page.goto(url);
  const form = page.locator(".shf-gift-selector");
  const input = page.getByLabel("Custom Amount");
  const give = page.getByRole("button", { name: "Give Now", exact: true });
  for (const amount of [25, 50, 100, 250]) {
    const preset = form.getByRole("button", {
      name: new RegExp(`^\\$${amount} `),
    });
    await preset.focus();
    await page.keyboard.press("Enter");
    await expect(preset).toHaveAttribute("aria-pressed", "true");
    await expect(form.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(input).toHaveValue(String(amount));
  }
  await input.fill("37.42");
  await expect(form.locator('[aria-pressed="true"]')).toHaveCount(0);
  const requests = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") requests.push(request.url());
  });
  for (const amount of ["", "0", "-5", "12.345", "abc"]) {
    await input.fill(amount);
    await give.click();
    await expect(page.getByRole("alert")).toContainText("positive USD amount");
    await expect(input).toBeFocused();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  }
  await input.fill("37.42");
  await give.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("$37.42");
  await expect(dialog).toContainText("No payment has been taken");
  const close = dialog.getByRole("button", { name: "Close and return" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() =>
      document.querySelector("dialog").contains(document.activeElement),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(give).toBeFocused();
  expect(requests).toEqual([]);
  await page.reload();
  await expect(input).toHaveValue("");
});

test("section navigation, giving actions, reporting controls and canonical impact route", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  const nav = page.getByRole("navigation", { name: "Donation page sections" });
  await nav.getByRole("button", { name: "Ways to Give" }).click();
  await expect(page.locator("#ways-to-give")).toBeFocused();
  await expect(
    nav.getByRole("button", { name: "Ways to Give" }),
  ).toHaveAttribute("aria-current", "location");
  await nav.getByRole("button", { name: "Where It Goes" }).click();
  await expect(page.locator("#where-it-goes")).toBeFocused();
  await nav.getByRole("button", { name: "Make a Gift" }).click();
  await expect(page.locator("#make-a-gift")).toBeFocused();
  for (const name of [
    "Monthly Giving",
    "Grants & Foundations",
    "Planned Giving",
    "Financial Reports",
    "Governance Overview",
  ]) {
    const action = page.getByRole("button", { name: new RegExp(`^${name}`) });
    await action.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading")).toHaveText(name);
    await dialog.getByRole("button").click();
    await expect(action).toBeFocused();
  }
  await page.getByRole("button", { name: /^One-Time Gift/ }).click();
  await expect(page.getByLabel("Custom Amount")).toBeFocused();
  for (const label of ["Corporate Support", "Employer Partnerships"])
    await expect(
      page.getByRole("link", { name: new RegExp(`^${label}`) }),
    ).toHaveAttribute("href", "#/partners");
  await page
    .getByRole("link", { name: "Impact Reporting", exact: true })
    .click();
  await expect(page).toHaveURL(/#\/reports$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Public information",
  );
  await page.goto(url);
  await page
    .getByRole("link", { name: "Our Impact", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL(/#impact$/);
  await expect(page.locator("#impact")).toBeVisible();
});

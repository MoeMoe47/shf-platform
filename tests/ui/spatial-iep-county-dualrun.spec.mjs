import { expect, test } from "@playwright/test";

const baseUrl = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const routeUrl = `${baseUrl}/capital.html#/iep-command-v2`;
const dualRunUrl = `${routeUrl}?iepSpatialDualRun=1`;

test("legacy IEP route renders 88 counties without dual-run activation", async ({ page }) => {
  await page.goto(routeUrl);
  await expect(page.locator("svg .ohio-official-map-v2__county")).toHaveCount(88);
  await expect(page.locator(".ohio-official-map-v2__county-control")).toHaveCount(88);
  await expect(page.getByTestId("iep-spatial-dual-run")).toHaveCount(0);
});

test("development dual-run certifies real IEP county parity", async ({ page }) => {
  await page.goto(dualRunUrl);
  await expect(page.getByTestId("iep-spatial-dual-run")).toBeVisible();
  await expect(page.getByTestId("iep-dual-run-legacy-count")).toHaveText("88");
  await expect(page.getByTestId("iep-dual-run-spatial-count")).toHaveText("88");
  await expect(page.getByTestId("iep-dual-run-fips-parity")).toHaveText("true");
  await expect(page.getByTestId("iep-dual-run-label-parity")).toHaveText("true");
  await expect(page.getByTestId("iep-dual-run-geometry-parity")).toHaveText("true");
  await expect(page.locator("svg .ohio-official-map-v2__county")).toHaveCount(88);
});

test("county controls preserve FIPS selection and drawer focus lifecycle", async ({ page }) => {
  await page.goto(dualRunUrl);
  const geauga = page.getByRole("button", { name: "Select Geauga County" });
  await geauga.focus();
  await geauga.press("Enter");
  await expect(geauga).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("iep-dual-run-selected-fips")).toHaveText("39055");
  await expect(page.getByRole("dialog", { name: "Geauga" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close county details" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Geauga" })).toBeHidden();
  await expect(geauga).toBeFocused();
  await expect(page).toHaveURL(/capital\.html#\/iep-command-v2\?iepSpatialDualRun=1$/);
});

test("Space activation and privacy remain safe on the county equivalent", async ({ page }) => {
  await page.goto(dualRunUrl);
  const franklin = page.getByRole("button", { name: "Select Franklin County" });
  await franklin.focus();
  await franklin.press(" ");
  await expect(franklin).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("iep-dual-run-selected-fips")).toHaveText("39049");
  await expect(page.locator("body")).not.toContainText("entityToCounty");
  await expect(page.locator("body")).not.toContainText("privateProvenance");
  await expect(page.locator("body")).not.toContainText("authorizationContext");
});

import { expect, test } from "@playwright/test";

const baseUrl = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const fixtureUrl = `${baseUrl}/metaverse/city?metaverseDev=1&spatialFixture=1&metSceneTime=DAY`;

const fixtures = [
  { alias: "normal", label: "Spatial Fixture Normal", state: "Normal" },
  { alias: "stale", label: "Spatial Fixture Stale", state: "out of date" },
  { alias: "unavailable", label: "Spatial Fixture Unavailable", state: "Unavailable" },
];

function markerId(alias) {
  return `spatial-marker-spatial-fixture-${alias}`;
}

function listId(alias) {
  return `spatial-list-spatial-fixture-${alias}`;
}

test("fixture markers and semantic entries have live parity", async ({ page }) => {
  await page.goto(fixtureUrl);

  for (const fixture of fixtures) {
    const marker = page.getByTestId(markerId(fixture.alias));
    const item = page.getByTestId(listId(fixture.alias));
    await expect(marker).toBeVisible();
    await expect(item).toBeVisible();
    await expect(marker).toContainText(fixture.label);
    await expect(item).toContainText(fixture.label);
    await expect(item).toContainText(fixture.state);
  }

  await expect(page.getByTestId("spatial-marker-spatial-fixture-hidden")).toHaveCount(0);
  await expect(page.getByTestId("spatial-list-spatial-fixture-hidden")).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText("fixture-hidden");
  await expect(page.locator("body")).not.toContainText("test.spatial.quick-map-fixture");
  await expect(page.getByTestId(markerId("unavailable"))).toBeDisabled();
  await expect(page.getByTestId(listId("unavailable"))).toBeDisabled();
});

test("map and list share the single Spatial selection state", async ({ page }) => {
  await page.goto(fixtureUrl);
  const normalMarker = page.getByTestId(markerId("normal"));
  const normalItem = page.getByTestId(listId("normal"));
  const staleMarker = page.getByTestId(markerId("stale"));
  const staleItem = page.getByTestId(listId("stale"));

  await normalMarker.click();
  await expect(normalMarker).toHaveAttribute("aria-pressed", "true");
  await expect(normalItem).toHaveAttribute("aria-pressed", "true");
  await expect(staleMarker).toHaveAttribute("aria-pressed", "false");

  await staleItem.focus();
  await staleItem.press("Enter");
  await expect(staleMarker).toHaveAttribute("aria-pressed", "true");
  await expect(staleItem).toHaveAttribute("aria-pressed", "true");
  await expect(normalMarker).toHaveAttribute("aria-pressed", "false");
  await expect(normalItem).toHaveAttribute("aria-pressed", "false");
  await expect(page).toHaveURL(/\/metaverse\/city\?/);
});

test("fixture mode preserves modal keyboard accessibility", async ({ page }) => {
  await page.goto(fixtureUrl);
  const opener = page.getByRole("button", { name: "View full map" });
  await opener.focus();
  await opener.press("Enter");
  await expect(page.getByRole("dialog", { name: "Silicon Heartland — Full Map" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close full map" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Silicon Heartland — Full Map" })).toBeHidden();
  await expect(opener).toBeFocused();
});

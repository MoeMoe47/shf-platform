import { expect, test } from "@playwright/test";

const cityUrl = "/metaverse/city?metaverseDev=1&metSceneTime=DAY";
const baseUrl = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";

test("Quick Map full-map dialog has keyboard entry, Escape close, and focus return", async ({ page }) => {
  await page.goto(`${baseUrl}${cityUrl}`);

  const viewFullMap = page.getByRole("button", { name: "View full map" });
  await expect(viewFullMap).toBeVisible();
  await viewFullMap.focus();
  await viewFullMap.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Silicon Heartland — Full Map" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close full map" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(viewFullMap).toBeFocused();
});

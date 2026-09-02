import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173/curriculum.html";

test("authorized staff can review a structured import without publishing", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(`${BASE}?admin=1#/curriculum/import`, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "Structured curriculum import", level: 1 })).toBeVisible();
  await expect(page.locator("#cim-source")).toBeVisible();
  await expect(page.locator("#cim-source option")).not.toHaveCount(1);

  await page.locator("#cim-source").selectOption({ label: "asl" });
  await page.getByRole("button", { name: "Create preview" }).click();
  await expect(page.getByRole("heading", { name: "asl", exact: true, level: 2 })).toBeVisible();
  await expect(page.getByText("Course candidate hierarchy")).toHaveCount(0); // aria-label, not visible copy
  await expect(page.getByLabel("Course candidate hierarchy").first()).toBeVisible();
  await expect(page.locator(".cim-treeChildren")).not.toHaveCount(0);
  await expect(page.getByText("Import creates DRAFT curriculum only. It does not publish or assign learners.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import to Draft" })).toBeVisible();
  await expect(page.getByText("Import to Draft")).toBeVisible();
  expect(errors).toEqual([]);
});

test("student access is rejected by the canonical backend permission boundary", async ({ page }) => {
  await page.goto(`${BASE}#/curriculum/import`, { waitUntil: "networkidle" });
  const alerts = page.getByRole("alert");
  await expect(alerts).toHaveCount(2); // import-job gate + raw-document panel gate
  await expect(alerts.first()).toContainText(/permission|forbidden|failed/i);
  await expect(alerts.last()).toContainText(/permission|forbidden|failed/i);
  await expect(page.locator("#cim-source")).toBeDisabled();
});

for (const width of [390, 768]) {
  test(`import surface remains usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${BASE}#/curriculum/import`, { waitUntil: "networkidle" });
    await expect(page.locator(".cim-page")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

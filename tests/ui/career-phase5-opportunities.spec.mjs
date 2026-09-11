import { test, expect } from "@playwright/test";

const BASE = `${String(process.env.SHRV1_BASE_URL || "http://localhost:5173").replace(/\/$/, "")}/career.html`;
const opportunity = { id: "public-opportunity-1", title: "Data Center Internship", description: "A published opportunity.", opportunityType: "INTERNSHIP", applicationDeadline: "2099-12-01", location: "Columbus, Ohio", deliveryMode: "IN_PERSON", actionUrl: "https://example.org/apply", organization: { id: "org-public", name: "Public Organization", type: "partner" }, career: { slug: "data-center-technician", title: "Data Center Technician", familyName: "Infrastructure" } };

async function publicApi(page) {
  await page.route("**/public/career/opportunities", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { items: [opportunity] } }) }));
  await page.route("**/public/career/opportunities/public-opportunity-1", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: opportunity }) }));
  await page.route("**/public/career/employers", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { items: [{ id: "org-public", name: "Public Organization", type: "partner", opportunityCount: 1, opportunities: [opportunity] }] } }) }));
  await page.route("**/public/career/employers/org-public", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { id: "org-public", name: "Public Organization", type: "partner", opportunityCount: 1, opportunities: [opportunity] } }) }));
}

test("public Opportunities list and type filter use public canonical values", async ({ page }) => {
  await publicApi(page); await page.goto(`${BASE}#/opportunities`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Public Opportunities" })).toBeVisible();
  await expect(page.getByText("Data Center Internship")).toBeVisible();
  await expect(page.getByLabel("Type")).toBeVisible();
  await expect(page.getByText("Career Center does not submit")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("public Opportunity detail has external action and canonical Career link", async ({ page }) => {
  await publicApi(page); await page.goto(`${BASE}#/opportunities/public-opportunity-1`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Data Center Internship" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Visit Opportunity/ })).toHaveAttribute("href", "https://example.org/apply");
  await expect(page.getByRole("link", { name: "Data Center Technician" })).toHaveAttribute("href", "#/careers/data-center-technician");
  await expect(page.getByText("does not submit or track applications")).toBeVisible();
});

test("private or unavailable public opportunity is an indistinguishable not-found state", async ({ page }) => {
  await page.route("**/public/career/opportunities/private-id", (route) => route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "NOT_FOUND" } }) }));
  await page.goto(`${BASE}#/opportunities/private-id`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Opportunity not found" })).toBeVisible();
});

test("Organizations directory and profile remain a public opportunity projection", async ({ page }) => {
  await publicApi(page); await page.goto(`${BASE}#/employers`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();
  await expect(page.getByText("Opportunity Provider")).toBeVisible();
  await page.getByRole("link", { name: "View Organization" }).click();
  await expect(page.getByRole("heading", { name: "Public Organization" })).toBeVisible();
  await expect(page.getByText("Public opportunities")).toBeVisible();
  await expect(page.getByText("tenantId")).toHaveCount(0);
});

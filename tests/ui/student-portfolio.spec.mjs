import { test, expect } from "@playwright/test";

const routes = [["curriculum", "http://localhost:5173/curriculum.html#/curriculum/asl/portfolio"], ["career", "http://localhost:5173/career.html#/portfolio"]];
const artifact = { artifactId: "artifact_website_1", portfolioId: "portfolio_1", status: "ACTIVE", provenance: { projectType: "WEBSITE", workspaceRevision: 4 }, presentation: { title: "Community Garden", summary: "A site for neighbors.", reflection: "I learned to structure content.", visibility: "PRIVATE" } };

async function mockPortfolio(page, artifacts = [artifact]) {
  await page.route("**/portfolio", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { portfolio: { portfolioId: "portfolio_1" }, artifacts } }) }));
  await page.route("**/portfolio/artifacts/**", async (route) => {
    if (route.request().method() !== "PATCH") return route.continue();
    const body = JSON.parse(route.request().postData() || "{}");
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { ...artifact, status: body.status || artifact.status, presentation: { ...artifact.presentation, ...body } } }) });
  });
}

for (const [host, url] of routes) test(`${host}: durable Portfolio renders canonical artifact`, async ({ page }) => {
  await mockPortfolio(page); await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Portfolio", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Community Garden", level: 2 })).toBeVisible();
  await expect(page.getByText("Verified Work")).toBeVisible(); await expect(page.getByText("Private")).toBeVisible();
});

test("durable Portfolio empty state is honest and does not import legacy storage", async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("portfolio:items", JSON.stringify([{ title: "Fake legacy item" }])); localStorage.setItem("civic:portfolio:artifacts", JSON.stringify([{ title: "Fake civic item" }])); });
  await mockPortfolio(page, []); await page.goto(routes[0][1], { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "What You Proved", level: 2 })).toBeVisible();
  await expect(page.getByText("Fake legacy item")).toHaveCount(0); await expect(page.getByText("Fake civic item")).toHaveCount(0);
});

test("artifact presentation editing exposes only supported visibility", async ({ page }) => {
  await mockPortfolio(page); await page.goto(routes[0][1], { waitUntil: "domcontentloaded" }); await page.getByRole("button", { name: "Edit Presentation" }).click();
  await expect(page.getByLabel("Summary")).toHaveValue("A site for neighbors."); await expect(page.getByLabel("Visibility")).toHaveValue("PRIVATE");
  await expect(page.getByRole("option", { name: "Private" })).toHaveCount(1); await expect(page.getByRole("option", { name: "Visible to My Organization" })).toHaveCount(1);
  await expect(page.getByRole("option", { name: "Public" })).toHaveCount(0); await expect(page.getByRole("option", { name: "Unlisted" })).toHaveCount(0);
});

test("removal is presented as Portfolio-only containment", async ({ page }) => {
  await mockPortfolio(page); await page.goto(routes[0][1], { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/does not change Evidence, completion, deployment, or credentials/)).toBeVisible(); await expect(page.getByRole("button", { name: "Remove from Portfolio" })).toBeVisible();
});

test("AI Agent artifact keeps the governed project type", async ({ page }) => {
  await mockPortfolio(page, [{ ...artifact, artifactId: "artifact_agent_1", provenance: { projectType: "AI_AGENT", workspaceRevision: 2 }, presentation: { ...artifact.presentation, title: "Neighborhood Guide Agent" } }]);
  await page.goto(routes[0][1], { waitUntil: "domcontentloaded" });
  await expect(page.getByText("AI Agent")).toBeVisible();
  await expect(page.getByText(/does not change Evidence, completion, deployment, or credentials/)).toBeVisible();
  await expect(page.getByText(/Registry|certified|production/i)).toHaveCount(0);
});

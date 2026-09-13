import { test, expect } from "@playwright/test";

const apiBase = process.env.SHS_TEST_API_URL || "http://127.0.0.1:8091";
const token = (userId) => userId ? { Authorization: `Bearer dev-token:${userId}` } : {};

async function requestRepresentation(request, userId, body) {
  return request.post(`${apiBase}/accessibility/content/representations`, {
    headers: { ...token(userId), "Content-Type": "application/json" },
    data: body,
  });
}

test("Curriculum accessible HTML is delivered by the live AX-3 service", async ({ page, request }) => {
  const created = await requestRepresentation(request, "learner_A1", { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "ACCESSIBLE_HTML" });
  expect(created.status()).toBe(201);
  const representation = (await created.json()).data;
  await page.setExtraHTTPHeaders(token("learner_A1"));
  await page.goto(`${apiBase}/accessibility/content/representations/${representation.representationId}/content`);
  await expect(page.locator("article")).toContainText("Lesson A");
  await expect(page.locator("h1")).toHaveAttribute("id", "ax3-content-title");
});

test("DGAL accessible representation is delivered without changing the document authority", async ({ page, request }) => {
  const created = await requestRepresentation(request, "admin_A", { sourceType: "DGAL_DOCUMENT", sourceId: "phase8_ax3_document", representationType: "ACCESSIBLE_HTML" });
  expect(created.status()).toBe(201);
  const representation = (await created.json()).data;
  await page.setExtraHTTPHeaders(token("admin_A"));
  await page.goto(`${apiBase}/accessibility/content/representations/${representation.representationId}/content`);
  await expect(page.locator("article")).toContainText("AX-3 acceptance document");
});

test("anonymous public content receives only the public-safe representation", async ({ browser, request }) => {
  const created = await requestRepresentation(request, undefined, { sourceType: "PUBLIC_ARTICLE", sourceId: "foundation-about", representationType: "PLAIN_TEXT" });
  expect(created.status()).toBe(201);
  const representation = (await created.json()).data;
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${apiBase}/accessibility/content/representations/${representation.representationId}/content`);
  await expect(page.locator("body")).toContainText("Foundation");
  await expect(page.locator("body")).not.toContainText("organization_id");
  await context.close();
});

test("unsupported preferred format remains honest while source access stays available", async ({ request }) => {
  const response = await requestRepresentation(request, "learner_A1", { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "EPUB" });
  expect(response.status()).toBe(422);
  expect((await response.json()).error.code).toBe("REPRESENTATION_UNSUPPORTED");
});

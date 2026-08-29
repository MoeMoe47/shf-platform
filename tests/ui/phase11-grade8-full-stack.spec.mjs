import { test, expect } from "@playwright/test";

const baseUrl = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const apiUrl = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const curriculum = String(process.env.SHS_TEST_COMPLETION_CURRICULUM || "data-center-design-8");
const completionLessons = JSON.parse(process.env.SHS_TEST_COMPLETION_LESSONS || JSON.stringify([
  "data-center-design-8-design-challenge",
  "data-center-design-8-sustainability-resources",
  "data-center-design-8-build-better-data-center",
]));

test("representative Grade 8 lessons complete through the disposable API", {
  skip: baseUrl && apiUrl ? false : "SHS_TEST_FRONTEND_URL and SHS_TEST_API_URL are required",
}, async ({ page }) => {
  const completionRequests = [];
  let completionAuthorization;
  page.on("request", (request) => {
    if (request.url().includes("/curriculum/lessons/") && request.url().includes("/complete")) {
      completionRequests.push(request);
      completionAuthorization ||= request.headers().authorization;
    }
  });

  for (const lessonId of completionLessons) {
    await page.goto(`${baseUrl}/curriculum.html#/curriculum/lessons/${encodeURIComponent(lessonId)}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const completionResponse = page.waitForResponse((response) => response.url().includes(`/curriculum/lessons/${lessonId}/complete`) && response.request().method() === "POST");
    await page.getByRole("button", { name: "Mark Lesson Complete" }).click();
    expect((await completionResponse).status()).toBe(200);
    await expect(page.getByRole("button", { name: /Lesson Complete/ })).toBeVisible();

    const repeatCompletion = await page.request.post(`${apiUrl}/curriculum/lessons/${lessonId}/complete`, {
      headers: { Authorization: completionAuthorization },
      data: { curriculum },
    });
    expect(repeatCompletion.status()).toBe(200);

    if (lessonId === completionLessons[0]) {
      const crossTenant = await page.request.post(`${apiUrl}/curriculum/lessons/${lessonId}/complete`, {
        headers: { Authorization: "Bearer dev-token:user_other_admin_001" },
        data: { curriculum },
      });
      expect([400, 403]).toContain(crossTenant.status());
    }
  }

  expect(completionRequests).toHaveLength(completionLessons.length);
  for (const request of completionRequests) expect(request.postDataJSON()).toMatchObject({ curriculum });
});

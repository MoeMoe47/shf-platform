import { test, expect } from "@playwright/test";
const origin = process.env.SHF_FOUNDATION_BASE_URL || "http://127.0.0.1:5191";
const reference = "0d73f380-cf5f-4a67-929c-ce569880059d";
test("monthly Give Now posts exact cents and navigates to a mocked hosted Stripe page", async ({
  page,
}) => {
  let body;
  await page.route("**/foundation/donations/checkout", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        donationId: reference,
        checkoutUrl: "https://checkout.stripe.com/c/pay/local-browser-fixture",
      }),
    });
  });
  await page.route(
    "https://checkout.stripe.com/c/pay/local-browser-fixture",
    (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<h1>Mock hosted checkout — no real donation</h1>",
      }),
  );
  await page.goto(`${origin}/foundation.html#/get-involved`);
  await page.getByRole("radio", { name: "Monthly", exact: true }).check();
  await page.getByLabel("Custom Amount").fill("42.37");
  await page.getByRole("button", { name: "Give Now", exact: true }).click();
  await expect(page).toHaveURL(
    "https://checkout.stripe.com/c/pay/local-browser-fixture",
  );
  expect(body).toEqual({
    amountCents: 4237,
    currency: "usd",
    frequency: "MONTHLY",
  });
});
test("malformed checkout redirect retains truthful fallback on the Foundation page", async ({
  page,
}) => {
  await page.route("**/foundation/donations/checkout", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        donationId: reference,
        checkoutUrl: "https://attacker.example/",
      }),
    }),
  );
  await page.goto(`${origin}/foundation.html#/get-involved`);
  await page.getByLabel("Custom Amount").fill("25");
  await page.getByRole("button", { name: "Give Now", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "could not open secure giving",
  );
  await expect(page).toHaveURL(`${origin}/foundation.html#/get-involved`);
});
test("success route remains pending until backend confirmation; cancellation does not invent success", async ({
  page,
}) => {
  let status = "PENDING";
  await page.route("**/foundation/donations/*/status", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        status,
        amountCents: 2500,
        currency: "usd",
        frequency: "MONTHLY",
        recurringStatus: "ACTIVE",
      }),
    }),
  );
  await page.goto(
    `${origin}/foundation.html#/get-involved/success?donation=${reference}`,
  );
  await expect(page.getByRole("status")).toContainText(
    "We are confirming your donation",
  );
  await expect(page.getByRole("status")).not.toContainText(
    "first monthly gift is confirmed",
  );
  status = "COMPLETED";
  await page.getByRole("button", { name: "Refresh payment status" }).click();
  await expect(page.getByRole("status")).toContainText(
    "first monthly gift is confirmed",
  );
  await page.goto(`${origin}/foundation.html#/get-involved/canceled`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Checkout canceled",
  );
  await expect(page.getByRole("status")).toContainText(
    "No completed donation is confirmed",
  );
  await expect(
    page.getByRole("link", { name: "Return to giving" }),
  ).toHaveAttribute("href", "#/get-involved");
});

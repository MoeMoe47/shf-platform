import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import express from "express";
import pg from "pg";
import Stripe from "stripe";
import { validateGift } from "../src/domain/foundation-donations/model.js";
import { PostgresDonationRepository } from "../src/domain/foundation-donations/repo.js";
import { DonationService } from "../src/domain/foundation-donations/service.js";
import {
  donationStripeConfig,
  StripeDonationProvider,
} from "../src/domain/foundation-donations/stripe-provider.js";
import { registerDonationRoutes } from "../src/domain/foundation-donations/routes.js";

// Synthetic credentials are only used to sign local unit-test fixtures.
const config = {
  secret: "sk_test_local_fixture",
  webhookSecret: "whsec_local_fixture",
  successUrl:
    "https://foundation.example/foundation.html#/get-involved/success",
  cancelUrl:
    "https://foundation.example/foundation.html#/get-involved/canceled",
};
const sdk = new Stripe(config.secret);
const gift = { amountCents: 2500, currency: "usd", frequency: "ONE_TIME" };
const metadata = (id: string) => ({
  shf_donation_id: id,
  context: "shf_public_donation",
});

test("USD preset, custom, exact cents and currency normalization", () => {
  for (const cents of [100, 2500, 5000, 10000, 25000, 4237, 1_000_000]) {
    assert.deepEqual(
      validateGift({ ...gift, amountCents: cents, currency: "USD" }),
      { ...gift, amountCents: cents },
    );
  }
});
for (const [name, value] of Object.entries({
  zero: 0,
  negative: -1,
  decimal: 42.37,
  string: "2500",
  nan: NaN,
  infinity: Infinity,
  fractionalCent: 2500.5,
  excessive: 1_000_001,
  belowMinimum: 99,
  missing: undefined,
})) {
  test(`rejects ${name} amount`, () =>
    assert.throws(() => validateGift({ ...gift, amountCents: value })));
}
test("rejects invalid frequency, currency, array, and privileged processor fields", () => {
  for (const value of [
    null,
    [],
    { ...gift, frequency: "WEEKLY" },
    { ...gift, currency: "eur" },
    { ...gift, frequency: ["MONTHLY"] },
    { ...gift, priceId: "price_privileged" },
    { ...gift, organizationId: "org" },
  ])
    assert.throws(() => validateGift(value));
});
test("configuration fails closed for missing secrets, mismatched origins, unsafe or wrong return routes", () => {
  const env = {
    STRIPE_SECRET_KEY: config.secret,
    STRIPE_WEBHOOK_SECRET: config.webhookSecret,
    SHF_DONATION_SUCCESS_URL: config.successUrl,
    SHF_DONATION_CANCEL_URL: config.cancelUrl,
  };
  assert.ok(donationStripeConfig(env));
  assert.equal(donationStripeConfig({}), null);
  for (const invalid of [
    { STRIPE_WEBHOOK_SECRET: "" },
    { STRIPE_SECRET_KEY: "pk_test_browser" },
    { SHF_DONATION_SUCCESS_URL: "javascript:alert(1)" },
    {
      SHF_DONATION_CANCEL_URL:
        "https://other.example/foundation.html#/get-involved/canceled",
    },
    {
      SHF_DONATION_SUCCESS_URL:
        "https://foundation.example/foundation.html#/get-involved/success?donation=spoofed",
    },
    {
      SHF_DONATION_SUCCESS_URL:
        "http://foundation.example/foundation.html#/get-involved/success",
    },
  ]) {
    assert.equal(donationStripeConfig({ ...env, ...invalid }), null);
  }
});

function fakeSdk(fail = false) {
  const calls: any[] = [];
  const client = {
    webhooks: sdk.webhooks,
    checkout: {
      sessions: {
        create: async (params: any, options: any) => {
          calls.push({ params, options });
          if (fail)
            throw new Error("private Stripe diagnostic must not escape");
          return {
            id: `cs_test_${params.client_reference_id}`,
            url: `https://checkout.stripe.com/c/pay/${params.client_reference_id}`,
            livemode: false,
          };
        },
      },
    },
  };
  return { provider: new StripeDonationProvider(config, client as any), calls };
}
function signed(type: string, object: any, overrides: any = {}) {
  const payload = JSON.stringify(
    {
      id: `evt_${randomUUID()}`,
      object: "event",
      type,
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      data: { object },
      ...overrides,
    },
    null,
    2,
  );
  const signature = sdk.webhooks.generateTestHeaderString({
    payload,
    secret: config.webhookSecret,
  });
  return { raw: Buffer.from(payload), signature };
}
function checkoutObject(row: any, overrides: any = {}) {
  return {
    id: row.checkout_session_id,
    object: "checkout.session",
    client_reference_id: row.donation_id,
    metadata: metadata(row.donation_id),
    mode: row.frequency === "MONTHLY" ? "subscription" : "payment",
    amount_total: row.amountCents,
    currency: row.currency,
    payment_status: "paid",
    payment_intent:
      row.frequency === "MONTHLY" ? null : `pi_${row.donation_id}`,
    subscription: row.frequency === "MONTHLY" ? `sub_${row.donation_id}` : null,
    ...overrides,
  };
}
function invoiceObject(row: any, overrides: any = {}) {
  return {
    id: `in_${randomUUID()}`,
    object: "invoice",
    status: "paid",
    collection_method: "charge_automatically",
    amount_paid: row.amountCents,
    amount_due: row.amountCents,
    currency: row.currency,
    parent: {
      type: "subscription_details",
      subscription_details: {
        subscription: `sub_${row.donation_id}`,
        metadata: metadata(row.donation_id),
      },
    },
    ...overrides,
  };
}
test("SDK signature verification rejects invalid and stale signatures and cross-environment events", async () => {
  const { provider } = fakeSdk();
  await assert.rejects(
    provider.verifyEvent(Buffer.from("{}"), "bad"),
    /invalid_webhook/,
  );
  const payload = JSON.stringify({
    id: "evt_old",
    type: "unknown",
    data: { object: {} },
  });
  const expired = sdk.webhooks.generateTestHeaderString({
    payload,
    secret: config.webhookSecret,
    timestamp: 1,
  });
  await assert.rejects(
    provider.verifyEvent(Buffer.from(payload), expired),
    /invalid_webhook/,
  );
  const live = signed("checkout.session.completed", {}, { livemode: true });
  await assert.rejects(
    provider.verifyEvent(live.raw, live.signature),
    /invalid_webhook/,
  );
});

const connection = process.env.DONATION_TEST_DATABASE_URL;
const schema = `donation_test_${randomUUID().replaceAll("-", "")}`;
let database: pg.Pool;
let admin: pg.Pool;
before(async () => {
  if (!connection) return;
  const url = new URL(connection);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.port !== "5597")
    throw new Error(
      "Use the dedicated disposable donation PostgreSQL cluster on port 5597",
    );
  admin = new pg.Pool({ connectionString: connection });
  await admin.query(`CREATE SCHEMA ${schema}`);
  database = new pg.Pool({
    connectionString: connection,
    options: `-c search_path=${schema}`,
    max: 8,
  });
  await database.query(
    await readFile(
      new URL(
        "../migrations/164_foundation_public_donations.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
});
after(async () => {
  await database?.end();
  await admin?.end();
});
const integration = (name: string, fn: () => Promise<void>) =>
  test(name, { skip: !connection }, fn);
integration(
  "subscription cancellation before the first collection remains uncompleted",
  async () => {
    const f = await fixture("MONTHLY");
    const event = signed("customer.subscription.deleted", {
      id: `sub_${f.row.donation_id}`,
      status: "canceled",
      metadata: metadata(f.row.donation_id),
    });
    await f.service.webhook(event.raw, event.signature);
    const status = await f.service.status(f.result.donationId);
    assert.equal(status.status, "CANCELED");
    assert.equal(status.recurringStatus, "CANCELED");
    assert.equal(
      (
        await database.query(
          "SELECT * FROM foundation_donation_collections WHERE donation_id=$1",
          [f.row.donation_id],
        )
      ).rowCount,
      0,
    );
  },
);
async function fixture(frequency = "ONE_TIME", amountCents = 2500) {
  const fake = fakeSdk();
  const repo = new PostgresDonationRepository(database);
  const service = new DonationService(repo, fake.provider);
  const key = randomUUID();
  const result = await service.checkout(
    { ...gift, frequency, amountCents },
    key,
  );
  const row = await repo.create(
    { ...gift, frequency, amountCents } as any,
    key,
    false,
  );
  return { ...fake, service, repo, result, row, key };
}
integration(
  "one-time checkout persists exact custom cents and server-owned Stripe parameters and URLs",
  async () => {
    const f = await fixture("ONE_TIME", 4237);
    const { params, options } = f.calls[0];
    assert.equal(params.mode, "payment");
    assert.equal(params.line_items[0].price_data.unit_amount, 4237);
    assert.deepEqual(params.allowed_payment_method_types, ["card"]);
    assert.equal(
      params.success_url,
      `${config.successUrl}?donation=${f.result.donationId}`,
    );
    assert.equal(
      params.cancel_url,
      `${config.cancelUrl}?donation=${f.result.donationId}`,
    );
    assert.equal(params.metadata.shf_donation_id, f.row.donation_id);
    assert.equal(options.idempotencyKey, `shf-donation:${f.row.donation_id}`);
    assert.notEqual(f.result.donationId, f.row.donation_id);
  },
);
integration(
  "monthly checkout uses server-generated recurring price and subscription metadata",
  async () => {
    const f = await fixture("MONTHLY");
    const { params } = f.calls[0];
    assert.equal(params.mode, "subscription");
    assert.deepEqual(params.line_items[0].price_data.recurring, {
      interval: "month",
    });
    assert.equal(
      params.subscription_data.metadata.shf_donation_id,
      f.row.donation_id,
    );
    assert.equal(
      (await f.service.status(f.result.donationId)).status,
      "CHECKOUT_CREATED",
    );
  },
);
integration(
  "concurrent checkout retries create one intent and one provider session; changed payload conflicts",
  async () => {
    const { provider, calls } = fakeSdk();
    const service = new DonationService(
      new PostgresDonationRepository(database),
      provider,
    );
    const key = randomUUID();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => service.checkout(gift, key)),
    );
    assert.equal(new Set(results.map((item) => item.donationId)).size, 1);
    assert.equal(calls.length, 1);
    await assert.rejects(
      service.checkout({ ...gift, amountCents: 5000 }, key),
      /donation_intent_conflict/,
    );
  },
);
integration(
  "missing configuration never creates an intent or invokes a fake runtime",
  async () => {
    const service = new DonationService(
      new PostgresDonationRepository(database),
      null,
    );
    await assert.rejects(
      service.checkout(gift, randomUUID()),
      /donation_provider_unavailable/,
    );
    await assert.rejects(service.checkout(gift, ""), /invalid_idempotency_key/);
  },
);
integration(
  "checkout provider failure leaves a durable retryable intent and reuses provider idempotency key",
  async () => {
    const { provider, calls } = fakeSdk(true);
    const repo = new PostgresDonationRepository(database);
    const service = new DonationService(repo, provider);
    const key = randomUUID();
    await assert.rejects(service.checkout(gift, key));
    await assert.rejects(service.checkout(gift, key));
    assert.equal(
      calls[0].options.idempotencyKey,
      calls[1].options.idempotencyKey,
    );
    const row = await repo.create(gift as any, key, false);
    assert.equal(row.status, "CREATED");
  },
);
integration(
  "ambiguous checkout creation cannot be retried beyond the Stripe idempotency window",
  async () => {
    const f = await fixture();
    await database.query(
      "UPDATE foundation_donations SET created_at=NOW()-INTERVAL '24 hours' WHERE donation_id=$1",
      [f.row.donation_id],
    );
    await assert.rejects(
      f.service.checkout(gift, f.key),
      /donation_checkout_closed/,
    );
  },
);
integration(
  "valid verified completion is durable; duplicate and concurrent deliveries have one collection",
  async () => {
    const f = await fixture();
    const event = signed("checkout.session.completed", checkoutObject(f.row));
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        f.service.webhook(event.raw, event.signature),
      ),
    );
    assert.equal(
      results.filter((result) => result.result === "APPLIED").length,
      1,
    );
    assert.equal(
      results.filter((result) => result.result === "DUPLICATE").length,
      3,
    );
    const fresh = new DonationService(
      new PostgresDonationRepository(database),
      null,
    );
    assert.equal((await fresh.status(f.result.donationId)).status, "COMPLETED");
    const collections = await database.query(
      "SELECT * FROM foundation_donation_collections WHERE donation_id=$1",
      [f.row.donation_id],
    );
    assert.equal(collections.rowCount, 1);
  },
);
integration(
  "distinct duplicate completion events and late failures cannot regress a completed donation",
  async () => {
    const f = await fixture();
    for (const type of [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.async_payment_failed",
      "checkout.session.expired",
    ]) {
      const event = signed(type, checkoutObject(f.row));
      await f.service.webhook(event.raw, event.signature);
    }
    assert.equal(
      (await f.service.status(f.result.donationId)).status,
      "COMPLETED",
    );
    assert.equal(
      (
        await database.query(
          "SELECT * FROM foundation_donation_collections WHERE donation_id=$1",
          [f.row.donation_id],
        )
      ).rowCount,
      1,
    );
  },
);
integration(
  "unpaid completion is pending and failure/expiration never completes a gift",
  async () => {
    for (const [type, expected] of [
      ["checkout.session.completed", "PENDING"],
      ["checkout.session.async_payment_failed", "FAILED"],
      ["checkout.session.expired", "CANCELED"],
    ]) {
      const f = await fixture();
      const event = signed(
        type,
        checkoutObject(f.row, { payment_status: "unpaid" }),
      );
      await f.service.webhook(event.raw, event.signature);
      assert.equal(
        (await f.service.status(f.result.donationId)).status,
        expected,
      );
    }
  },
);
integration(
  "amount/currency/session mismatch rolls back event evidence and state",
  async () => {
    const f = await fixture();
    for (const change of [
      { amount_total: 1 },
      { currency: "eur" },
      { id: "cs_unrelated" },
    ]) {
      const event = signed(
        "checkout.session.completed",
        checkoutObject(f.row, change),
      );
      await assert.rejects(
        f.service.webhook(event.raw, event.signature),
        /donation_event_mismatch/,
      );
    }
    assert.equal(
      (await f.service.status(f.result.donationId)).status,
      "CHECKOUT_CREATED",
    );
    assert.equal(
      (
        await database.query(
          "SELECT * FROM foundation_donation_events WHERE donation_id=$1",
          [f.row.donation_id],
        )
      ).rowCount,
      0,
    );
  },
);
integration(
  "monthly checkout alone stays pending; separate invoices record each successful month once",
  async () => {
    const f = await fixture("MONTHLY");
    const checkout = signed(
      "checkout.session.completed",
      checkoutObject(f.row),
    );
    await f.service.webhook(checkout.raw, checkout.signature);
    assert.equal(
      (await f.service.status(f.result.donationId)).status,
      "PENDING",
    );
    const invoice = invoiceObject(f.row);
    for (const object of [invoice, invoice, invoiceObject(f.row)]) {
      const event = signed("invoice.payment_succeeded", object);
      await f.service.webhook(event.raw, event.signature);
    }
    const status = await f.service.status(f.result.donationId);
    assert.equal(status.status, "COMPLETED");
    assert.equal(status.recurringStatus, "ACTIVE");
    assert.equal(
      (
        await database.query(
          "SELECT * FROM foundation_donation_collections WHERE donation_id=$1",
          [f.row.donation_id],
        )
      ).rowCount,
      2,
    );
  },
);
integration(
  "invoice before checkout webhook correlates without duplicate first collection",
  async () => {
    const f = await fixture("MONTHLY");
    const paid = signed("invoice.payment_succeeded", invoiceObject(f.row));
    const checkout = signed(
      "checkout.session.completed",
      checkoutObject(f.row),
    );
    await f.service.webhook(paid.raw, paid.signature);
    await f.service.webhook(checkout.raw, checkout.signature);
    assert.equal(
      (await f.service.status(f.result.donationId)).status,
      "COMPLETED",
    );
    assert.equal(
      (
        await database.query(
          "SELECT * FROM foundation_donation_collections WHERE donation_id=$1",
          [f.row.donation_id],
        )
      ).rowCount,
      1,
    );
  },
);
integration(
  "monthly payment failure and subscription cancellation do not erase a historical paid gift",
  async () => {
    const f = await fixture("MONTHLY");
    const paid = signed("invoice.payment_succeeded", invoiceObject(f.row), {
      created: 100,
    });
    const failed = signed(
      "invoice.payment_failed",
      invoiceObject(f.row, { status: "open", amount_paid: 0 }),
      { created: 200 },
    );
    const canceled = signed(
      "customer.subscription.deleted",
      {
        id: `sub_${f.row.donation_id}`,
        status: "canceled",
        metadata: metadata(f.row.donation_id),
      },
      { created: 300 },
    );
    await f.service.webhook(paid.raw, paid.signature);
    await f.service.webhook(failed.raw, failed.signature);
    assert.equal(
      (await f.service.status(f.result.donationId)).recurringStatus,
      "PAST_DUE",
    );
    await f.service.webhook(canceled.raw, canceled.signature);
    // Late delivery of older successful invoice cannot reactivate cancellation.
    const late = signed("invoice.payment_succeeded", invoiceObject(f.row), {
      created: 150,
    });
    await f.service.webhook(late.raw, late.signature);
    assert.equal(
      (await f.service.status(f.result.donationId)).status,
      "COMPLETED",
    );
    assert.equal(
      (await f.service.status(f.result.donationId)).recurringStatus,
      "CANCELED",
    );
  },
);
integration(
  "public lookup only exposes status, amount, currency, frequency and recurring status",
  async () => {
    const f = await fixture();
    const status = await f.service.status(f.result.donationId);
    assert.deepEqual(
      Object.keys(status).sort(),
      [
        "status",
        "amountCents",
        "currency",
        "frequency",
        "recurringStatus",
      ].sort(),
    );
    await assert.rejects(
      f.service.status(f.row.donation_id),
      /donation_not_found/,
    );
    await assert.rejects(f.service.status("guessable"), /donation_not_found/);
  },
);
integration(
  "HTTP raw-body signatures, malformed JSON, unavailable provider and public errors",
  async () => {
    const f = await fixture();
    const app = express();
    registerDonationRoutes(app, f.service, async () => {});
    app.use(express.json());
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const url = `http://127.0.0.1:${(server.address() as any).port}/foundation/donations`;
    try {
      for (const signature of ["", "invalid"]) {
        const response = await fetch(`${url}/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Stripe-Signature": signature,
          },
          body: "{}",
        });
        assert.equal(response.status, 400);
      }
      const event = signed("checkout.session.completed", checkoutObject(f.row));
      const response = await fetch(`${url}/webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Stripe-Signature": event.signature,
        },
        body: event.raw.toString(),
      });
      assert.equal(response.status, 200);
      const status = await fetch(`${url}/${f.result.donationId}/status`);
      assert.equal(status.headers.get("cache-control"), "no-store");
      assert.equal((await status.json()).status, "COMPLETED");
      const unknown = signed("unhandled.event", {});
      assert.equal(
        (await f.service.webhook(unknown.raw, unknown.signature)).result,
        "IGNORED",
      );
      const malformed = await fetch(`${url}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      });
      assert.equal(malformed.status, 400);
      const oversized = await fetch(`${url}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ junk: "x".repeat(3000) }),
      });
      assert.equal(oversized.status, 413);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
);
integration(
  "HTTP checkout provider errors return sanitized 503 without processor diagnostics",
  async () => {
    for (const provider of [null, fakeSdk(true).provider]) {
      const app = express();
      registerDonationRoutes(
        app,
        new DonationService(new PostgresDonationRepository(database), provider),
        async () => {},
      );
      const server = app.listen(0, "127.0.0.1");
      await new Promise<void>((resolve) => server.once("listening", resolve));
      try {
        const response = await fetch(
          `http://127.0.0.1:${(server.address() as any).port}/foundation/donations/checkout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": randomUUID(),
            },
            body: JSON.stringify(gift),
          },
        );
        assert.equal(response.status, 503);
        assert.doesNotMatch(
          await response.text(),
          /private|secret|sk_test|Stripe diagnostic/,
        );
      } finally {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }
  },
);

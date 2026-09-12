import assert from "node:assert/strict";
import test from "node:test";
import { DeterministicPaymentAdapter, PAYMENT_BOUNDARIES, PaymentReadinessStore, type ProviderEvent } from "../src/domain/payments/payment-readiness.js";
import { readFile } from "node:fs/promises";

const base = { legalEntity: "SHS" as const, organizationId: "org-a", payerReference: "user-a", purpose: "COMMERCIAL" as const, productReference: "bos", amountMinor: 12500, currency: "USD", provider: "test-double", environment: "SANDBOX" as const, idempotencyKey: "checkout-1" };

test("idempotent payment creation and verified duplicate webhook are harmless", () => {
  const adapter = new DeterministicPaymentAdapter("sandbox-secret", "SANDBOX"); const store = new PaymentReadinessStore();
  const first = store.createPayment(base, adapter); const retry = store.createPayment(base, adapter);
  assert.equal(retry.paymentId, first.paymentId);
  const event: ProviderEvent = { eventId: "evt-1", providerPaymentId: first.providerPaymentId, state: "SUCCEEDED", amountMinor: 12500, currency: "USD", environment: "SANDBOX", occurredAt: new Date().toISOString() };
  const payload = JSON.stringify(event); const verified = adapter.verifyWebhook(payload, adapter.signWebhook(event));
  assert.equal(store.applyVerifiedWebhook(verified, adapter).state, "APPLIED");
  assert.equal(store.applyVerifiedWebhook(verified, adapter).state, "DUPLICATE");
});

test("invalid, mismatched, and cross-environment provider events fail closed", () => {
  const adapter = new DeterministicPaymentAdapter("sandbox-secret", "SANDBOX"); const store = new PaymentReadinessStore(); const payment = store.createPayment(base, adapter);
  assert.throws(() => adapter.verifyWebhook("{}", "bad"), /signature_invalid/);
  const mismatch: ProviderEvent = { eventId: "evt-2", providerPaymentId: payment.providerPaymentId, state: "SUCCEEDED", amountMinor: 1, currency: "USD", environment: "SANDBOX", occurredAt: new Date().toISOString() };
  assert.equal(store.applyVerifiedWebhook(mismatch, adapter).state, "REQUIRES_REVIEW");
  assert.throws(() => adapter.createPayment({ amountMinor: 100, currency: "USD", idempotencyKey: "x", environment: "PRODUCTION" }), /environment_mismatch/);
});

test("refunds are bounded and reconciliation does not overwrite history", () => {
  const adapter = new DeterministicPaymentAdapter("sandbox-secret", "SANDBOX"); const store = new PaymentReadinessStore(); const payment = store.createPayment(base, adapter);
  const event: ProviderEvent = { eventId: "evt-3", providerPaymentId: payment.providerPaymentId, state: "SUCCEEDED", amountMinor: 12500, currency: "USD", environment: "SANDBOX", occurredAt: new Date().toISOString() }; store.applyVerifiedWebhook(event, adapter);
  assert.throws(() => store.requestRefund(payment.paymentId, 12501, adapter), /refund_exceeds_payment/);
  assert.equal(store.requestRefund(payment.paymentId, 5000, adapter).totalRefundedMinor, 5000);
  assert.equal(store.reconcileExternal({ providerPaymentId: payment.providerPaymentId, amountMinor: 1, currency: "USD", environment: "SANDBOX" }), "MISMATCH");
  assert.deepEqual(adapter.createDispute(payment.providerPaymentId, 12500), { disputeId: `testdispute_${payment.providerPaymentId}_12500`, state: "OPEN" });
});

test("financial boundaries forbid raw cards, browser confirmation, and CivicSure money authority", async () => {
  assert.deepEqual(PAYMENT_BOUNDARIES, { noRawCardData: true, hostedOrTokenizedCollectionRequired: true, browserCannotConfirm: true, civicSureIsNotPaymentAuthority: true, entitlementActivationRequiresAuthorizedFulfillment: true, shfAndShsEntityRequired: true });
  const migration = await readFile(new URL("../migrations/131_payment_financial_operations_foundation.sql", import.meta.url), "utf8");
  assert.doesNotMatch(migration, /card_number|pan|cvv|raw_card/i); assert.match(migration, /UNIQUE \(organization_id, idempotency_key\)/); assert.match(migration, /PRIMARY KEY \(provider_key, provider_event_id\)/);
});

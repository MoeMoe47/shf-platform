import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { InMemoryTreasuryAdapter } from "../src/domain/metaverse/market/service/market-treasury-adapter.ts";
import { isProhibitedInstitutionalGood } from "../src/domain/metaverse/market/model/market-contract.ts";
import { settleMissionReward } from "../src/domain/metaverse/market/service/market-mission-adapter.ts";
import { settleOpportunityCompensation } from "../src/domain/metaverse/market/service/market-opportunity-adapter.ts";

const migration = readFileSync(new URL("../migrations/145_student_market.sql", import.meta.url), "utf8");
const listingService = readFileSync(new URL("../src/domain/metaverse/market/service/listing-service.ts", import.meta.url), "utf8");
const orderService = readFileSync(new URL("../src/domain/metaverse/market/service/order-service.ts", import.meta.url), "utf8");
const fulfillmentService = readFileSync(new URL("../src/domain/metaverse/market/service/fulfillment-service.ts", import.meta.url), "utf8");
const refundService = readFileSync(new URL("../src/domain/metaverse/market/service/refund-service.ts", import.meta.url), "utf8");
const treasuryAdapter = readFileSync(new URL("../src/domain/metaverse/market/service/market-treasury-adapter.ts", import.meta.url), "utf8");
const marketPolicy = readFileSync(new URL("../src/domain/metaverse/market/service/market-policy.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("../src/domain/metaverse/market/api/routes.ts", import.meta.url), "utf8");
const notifications = readFileSync(new URL("../src/domain/notifications/service/notification-service.ts", import.meta.url), "utf8");

const actor = { user_id: "reviewer", active_organization_id: "org-a", organization_id: "org-a", tenant_id: "tenant:org-a", roles: ["instructor"] };

test("MET-9 migration creates durable market records and no duplicate Treasury ledger or balance authority", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS market_listings/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS market_orders/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS market_fulfillments/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS market_refund_requests/);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS .*ledger/i);
  assert.doesNotMatch(migration, /CREATE TABLE IF NOT EXISTS .*balance/i);
  assert.match(migration, /treasury_payment_intent_ref/);
  assert.match(migration, /treasury_transaction_ref/);
});

test("MET-9 listing contract enforces allowed types, bounded sellers, approval, visibility, quantity and prohibited outcomes", () => {
  for (const type of ["DIGITAL_PRODUCT", "SERVICE", "PROJECT_RESOURCE", "PROGRAM_RESOURCE", "ARCADE_RESOURCE", "EVENT_ITEM", "COSMETIC_ITEM", "CITY_COLLECTIBLE", "EDUCATIONAL_RESOURCE", "SIMULATED_GOOD"]) {
    assert.match(migration, new RegExp(type));
  }
  // MET-12 replaced the prior STUDENT_ENTERPRISE fail-closed guard (see
  // migrations/146_student_enterprises.sql and
  // tests/met-12-student-enterprise.test.ts) now that enterprise authority
  // exists; deriveSeller still requires an ACTIVE enterprise and an
  // authorized enterprise role before returning this seller type.
  assert.match(marketPolicy, /STUDENT_ENTERPRISE/);
  assert.match(marketPolicy, /assertAuthorizedEnterpriseActor/);
  assert.match(listingService, /PENDING_REVIEW/);
  assert.match(listingService, /PROHIBITED_MARKET_GOOD/);
  assert.match(listingService, /quantityMode/);
  assert.match(migration, /visibility TEXT NOT NULL CHECK/);
  assert.equal(isProhibitedInstitutionalGood({ title: "Buy a verified skill certificate" }), true);
  assert.equal(isProhibitedInstitutionalGood({ title: "Logo design support" }), false);
});

test("MET-9 routes require auth, active org, server-derived identities and no client payment truth", () => {
  assert.match(router, /requirePermission\(SHS_SECURITY_PERMISSIONS\.METAVERSE_MARKET_VIEW/);
  assert.match(router, /requirePermission\(SHS_SECURITY_PERMISSIONS\.METAVERSE_MARKET_BUY/);
  assert.match(router, /requirePermission\(SHS_SECURITY_PERMISSIONS\.METAVERSE_MARKET_SELL/);
  assert.match(router, /requirePermission\(SHS_SECURITY_PERMISSIONS\.METAVERSE_MARKET_REVIEW/);
  assert.match(marketPolicy, /AUTH_REQUIRED/);
  assert.match(marketPolicy, /ORG_CONTEXT_REQUIRED/);
  assert.match(marketPolicy, /sellerRef: s\.userId/);
  assert.match(orderService, /buyerUserId: s\.userId/);
  assert.doesNotMatch(orderService, /input\?\.buyer/);
  assert.doesNotMatch(orderService, /input\?\.treasuryTransactionRef/);
});

test("MET-9 Treasury owns balance, debit, settlement, idempotency, and insufficient balance decisions", async () => {
  const treasury = new InMemoryTreasuryAdapter();
  treasury.setBalance("org-a", "buyer", 10);
  assert.deepEqual(await treasury.getBalance({ organizationId: "org-a", userId: "buyer", currencyType: "SHF_CREDITS" }), { amount: 10, currencyType: "SHF_CREDITS", source: "TREASURY" });
  await assert.rejects(() => treasury.executeTransfer({ organizationId: "org-a", buyerUserId: "buyer", sellerType: "STUDENT", sellerRef: "seller", amount: 11, currencyType: "SHF_CREDITS", purpose: "MARKET_PURCHASE", sourceRef: "order-a", idempotencyKey: "order-a" }), /Insufficient SHF Credits/);
  const first = await treasury.executeTransfer({ organizationId: "org-a", buyerUserId: "buyer", sellerType: "STUDENT", sellerRef: "seller", amount: 4, currencyType: "SHF_CREDITS", purpose: "MARKET_PURCHASE", sourceRef: "order-b", idempotencyKey: "order-b" });
  const second = await treasury.executeTransfer({ organizationId: "org-a", buyerUserId: "buyer", sellerType: "STUDENT", sellerRef: "seller", amount: 4, currencyType: "SHF_CREDITS", purpose: "MARKET_PURCHASE", sourceRef: "order-b", idempotencyKey: "order-b" });
  assert.equal(first.transactionRef, second.transactionRef);
  assert.equal(treasury.debitCalls, 1);
  assert.equal((await treasury.getBalance({ organizationId: "org-a", userId: "buyer", currencyType: "SHF_CREDITS" })).amount, 6);
  assert.match(orderService, /authorizeDebit/);
  assert.match(orderService, /executeTransfer/);
  assert.match(orderService, /getOrderByPaymentIntent/);
  assert.match(orderService, /PRICE_TAMPERING_REJECTED/);
  assert.match(orderService, /CURRENCY_TAMPERING_REJECTED/);
});

test("MET-9 order, fulfillment, cancellation, refund and abuse controls are represented", () => {
  assert.match(marketPolicy, /SELF_PURCHASE_DENIED/);
  assert.match(orderService, /decrementQuantity/);
  assert.match(orderService, /SOLD_OUT/);
  assert.match(orderService, /listingSnapshot/);
  assert.match(orderService, /CANCEL_REQUESTED/);
  assert.match(fulfillmentService, /BUYER_CANNOT_FULFILL/);
  assert.match(fulfillmentService, /Only the seller or an authorized reviewer/);
  assert.match(refundService, /requestRefund/);
  assert.match(refundService, /settleRefund/);
  assert.match(refundService, /DUPLICATE_REFUND_BLOCKED/);
  assert.match(refundService, /treasury\.refund/);
  assert.match(refundService, /REFUNDED/);
});

test("MET-9 mission rewards and MET-8 compensation cross Treasury boundary without mutating source authority", async () => {
  const treasury = new InMemoryTreasuryAdapter();
  const mission = await settleMissionReward(actor, { missionProjectionId: "mission-a", learnerUserId: "learner", amount: 7, rewardType: "PROGRAM_MISSION", completionVerified: true, idempotencyKey: "mission-a" }, treasury);
  assert.match(mission.transactionRef, /^treasury_refund_/);
  await assert.rejects(() => settleMissionReward(actor, { missionProjectionId: "mission-b", learnerUserId: "learner", amount: 7, rewardType: "SIDE_MISSION", completionVerified: false, idempotencyKey: "mission-b" }, treasury), /canonically verified/);
  const opportunity = await settleOpportunityCompensation(actor, { opportunityId: "opp-a", awardId: "award-a", paymentIntentRef: "payment_intent_award-a", awardeeUserId: "learner", amount: 9, acceptedWork: true, idempotencyKey: "award-a" }, treasury);
  assert.match(opportunity.transactionRef, /^treasury_refund_/);
  await assert.rejects(() => settleOpportunityCompensation(actor, { opportunityId: "opp-b", awardId: "award-b", paymentIntentRef: "bad", awardeeUserId: "learner", amount: 9, acceptedWork: true, idempotencyKey: "award-b" }, treasury), /payment intent/i);
});

test("MET-9 preserves education, evidence, reputation, communication and notification boundaries", () => {
  for (const source of [listingService, orderService, fulfillmentService, refundService]) {
    assert.doesNotMatch(source, /credential\.issued|verified_evidence|career_eligibility|civic_authority/i);
    assert.doesNotMatch(source, /DIRECT_MESSAGE|marketplace_dm|create.*Room/i);
  }
  assert.match(notifications, /market\.order\.paid/);
  assert.match(notifications, /market\.order\.fulfilled/);
  assert.match(notifications, /market\.refund\.settled/);
  assert.match(treasuryAdapter, /not a Market[\s\S]*ledger/);
});

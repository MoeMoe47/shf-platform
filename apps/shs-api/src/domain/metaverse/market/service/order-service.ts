import { randomUUID } from "node:crypto";
import { IntegrationOutboxRepo } from "../../../trusted-reporting/outbox-repo.js";
import { MarketRepo } from "../repo/market-repo.js";
import { MarketError } from "./market-errors.js";
import { assertListingVisible, assertNoSelfPurchase, canAdminMarket, scope } from "./market-policy.js";
import { defaultTreasuryAdapter, type TreasuryAdapter } from "./market-treasury-adapter.js";

const repo = new MarketRepo();
const outbox = new IntegrationOutboxRepo();

function paymentIntentRef(listingId: string, buyerUserId: string, idempotencyKey: string) {
  return `market_payment_intent_${Buffer.from(`${listingId}:${buyerUserId}:${idempotencyKey}`).toString("base64url")}`;
}

export async function getBalance(actor: any, treasury: TreasuryAdapter = defaultTreasuryAdapter) {
  const s = scope(actor);
  return treasury.getBalance({ organizationId: s.organizationId, userId: s.userId, currencyType: "SHF_CREDITS" });
}

export async function placeOrder(actor: any, input: any, treasury: TreasuryAdapter = defaultTreasuryAdapter) {
  const s = scope(actor);
  const listingId = String(input?.listingId || "");
  const quantity = Number(input?.quantity || 1);
  const idempotencyKey = String(input?.idempotencyKey || input?.clientRequestId || "");
  if (!listingId) throw new MarketError("LISTING_REQUIRED", "Listing is required.", 400);
  if (!Number.isInteger(quantity) || quantity <= 0) throw new MarketError("INVALID_QUANTITY", "Quantity must be positive.", 400);
  if (!idempotencyKey) throw new MarketError("IDEMPOTENCY_REQUIRED", "Idempotency key is required.", 400);
  const listing = await repo.getListing(listingId);
  if (!listing) throw new MarketError("NOT_FOUND", "Listing not found.", 404);
  assertListingVisible(actor, listing);
  assertNoSelfPurchase(actor, listing);
  if (listing.status !== "PUBLISHED") throw new MarketError("LISTING_NOT_PURCHASABLE", "Listing is not available for purchase.", 409);
  if (String(input?.currencyType || listing.currencyType) !== listing.currencyType) throw new MarketError("CURRENCY_TAMPERING_REJECTED", "Currency is server-authoritative.", 400);
  if (input?.priceAmount !== undefined && Number(input.priceAmount) !== Number(listing.priceAmount || 0)) throw new MarketError("PRICE_TAMPERING_REJECTED", "Price is server-authoritative.", 400);
  const unitPrice = Number(listing.priceAmount || 0);
  const total = unitPrice * quantity;
  const intentRef = paymentIntentRef(listing.listingId, s.userId, idempotencyKey);
  const replayed = await repo.getOrderByPaymentIntent(s.organizationId, intentRef);
  if (replayed) return replayed;
  const authorization = await treasury.authorizeDebit({ organizationId: s.organizationId, userId: s.userId, amount: total, currencyType: listing.currencyType });
  if (!authorization.authorized) throw new MarketError("INSUFFICIENT_BALANCE", "Insufficient SHF Credits for this purchase.", 402);
  const decremented = await repo.decrementQuantity(listing.listingId, s.organizationId, quantity);
  if (!decremented) throw new MarketError("SOLD_OUT", "Listing quantity is no longer available.", 409);
  const existing = await repo.createOrder({
    orderId: `market_order_${randomUUID()}`,
    organizationId: s.organizationId,
    tenantId: s.tenantId,
    listingId: listing.listingId,
    buyerUserId: s.userId,
    buyerTeamId: null,
    sellerType: listing.sellerType,
    sellerRef: listing.sellerRef,
    quantity,
    unitPriceSnapshot: unitPrice,
    totalPriceSnapshot: total,
    currencyType: listing.currencyType,
    listingSnapshot: { title: listing.title, summary: listing.summary, listingType: listing.listingType, priceType: listing.priceType, priceAmount: unitPrice, currencyType: listing.currencyType, sellerType: listing.sellerType, sellerRef: listing.sellerRef },
    buyerSnapshot: { buyerUserId: s.userId, organizationId: s.organizationId },
    fulfillmentTermsSnapshot: { fulfillmentType: listing.fulfillmentType, visibility: listing.visibility },
    treasuryPaymentIntentRef: intentRef,
    treasuryTransactionRef: null,
    status: "PENDING_PAYMENT",
  });
  if (existing.treasuryTransactionRef) return existing;
  const settled = await treasury.executeTransfer({
    organizationId: s.organizationId,
    buyerUserId: s.userId,
    sellerType: listing.sellerType,
    sellerRef: listing.sellerRef,
    amount: total,
    currencyType: listing.currencyType,
    purpose: "MARKET_PURCHASE",
    sourceRef: existing.orderId,
    idempotencyKey: intentRef,
  });
  const paid = await repo.updateOrderPayment(existing.orderId, s.organizationId, settled.transactionRef);
  await outbox.enqueue({
    producer_id: "shs-api.metaverse.market",
    event_type: "market.order.paid",
    subject_type: "market_order",
    subject_id: existing.orderId,
    organization_id: s.organizationId,
    originating_actor_id: s.userId,
    occurred_at: new Date().toISOString(),
    idempotency_key: existing.orderId,
    correlation_id: `market:${listing.listingId}`,
    destination: "shs-metaverse-market",
    payload: { order_id: existing.orderId, buyer_user_id: s.userId, seller_ref: listing.sellerRef },
  });
  return paid!;
}

export async function listMyOrders(actor: any) {
  const s = scope(actor);
  return repo.listOrdersForActor(s.organizationId, s.userId);
}

export async function cancelOrder(actor: any, orderId: string) {
  const s = scope(actor);
  const order = await repo.getOrder(orderId);
  if (!order || order.organizationId !== s.organizationId) throw new MarketError("NOT_FOUND", "Order not found.", 404);
  if (order.buyerUserId !== s.userId && !canAdminMarket(actor)) throw new MarketError("FORBIDDEN", "Order cancellation is not authorized.", 403);
  if (order.status === "PENDING_PAYMENT") return repo.updateOrderStatus(orderId, s.organizationId, "CANCELLED", "cancelled_at");
  if (["PAID", "ACCEPTED"].includes(order.status)) return repo.updateOrderStatus(orderId, s.organizationId, "CANCEL_REQUESTED");
  throw new MarketError("CANCELLATION_NOT_ALLOWED", "This order cannot be cancelled in its current state.", 409);
}

export { repo as orderRepo };

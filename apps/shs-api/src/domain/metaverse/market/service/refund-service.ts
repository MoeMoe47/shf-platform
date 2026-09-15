import { randomUUID } from "node:crypto";
import { IntegrationOutboxRepo } from "../../../trusted-reporting/outbox-repo.js";
import { MarketRepo } from "../repo/market-repo.js";
import { MarketError } from "./market-errors.js";
import { canAdminMarket, scope } from "./market-policy.js";
import { defaultTreasuryAdapter, type TreasuryAdapter } from "./market-treasury-adapter.js";

const repo = new MarketRepo();
const outbox = new IntegrationOutboxRepo();

export async function requestRefund(actor: any, orderId: string, reason: string) {
  const s = scope(actor);
  const order = await repo.getOrder(orderId);
  if (!order || order.organizationId !== s.organizationId) throw new MarketError("NOT_FOUND", "Order not found.", 404);
  if (order.buyerUserId !== s.userId && !canAdminMarket(actor)) throw new MarketError("FORBIDDEN", "Refund request is not authorized.", 403);
  if (!["PAID", "ACCEPTED", "IN_FULFILLMENT", "FULFILLED", "CANCEL_REQUESTED"].includes(order.status)) throw new MarketError("REFUND_NOT_ALLOWED", "Refund is not available for this order state.", 409);
  const refund = await repo.createRefund({
    refundRequestId: `market_refund_${randomUUID()}`,
    orderId,
    organizationId: s.organizationId,
    tenantId: s.tenantId,
    requestedByUserId: s.userId,
    reason: String(reason || "Refund requested.").slice(0, 1000),
  });
  await repo.updateOrderStatus(orderId, s.organizationId, "REFUND_REQUESTED");
  return refund;
}

export async function settleRefund(actor: any, refundRequestId: string, treasury: TreasuryAdapter = defaultTreasuryAdapter) {
  const s = scope(actor);
  if (!canAdminMarket(actor)) throw new MarketError("UNAUTHORIZED_REFUND", "Refund settlement authority is required.", 403);
  const refund = await repo.getRefund(refundRequestId);
  if (!refund || refund.organizationId !== s.organizationId) throw new MarketError("NOT_FOUND", "Refund request not found.", 404);
  if (refund.status === "SETTLED") throw new MarketError("DUPLICATE_REFUND_BLOCKED", "Refund has already been settled.", 409);
  const order = await repo.getOrder(refund.orderId);
  if (!order || order.organizationId !== s.organizationId) throw new MarketError("NOT_FOUND", "Order not found.", 404);
  const settled = await treasury.refund({
    organizationId: s.organizationId,
    buyerUserId: order.buyerUserId,
    sellerType: order.sellerType,
    sellerRef: order.sellerRef,
    amount: order.totalPriceSnapshot,
    currencyType: order.currencyType,
    purpose: "MARKET_REFUND",
    sourceRef: refund.refundRequestId,
    idempotencyKey: `market_refund:${refund.refundRequestId}`,
  });
  const updated = await repo.settleRefund(refund.refundRequestId, s.organizationId, s.userId, settled.transactionRef);
  await repo.updateOrderStatus(order.orderId, s.organizationId, "REFUNDED", "refunded_at");
  await outbox.enqueue({
    producer_id: "shs-api.metaverse.market",
    event_type: "market.refund.settled",
    subject_type: "market_refund_request",
    subject_id: refund.refundRequestId,
    organization_id: s.organizationId,
    originating_actor_id: s.userId,
    occurred_at: new Date().toISOString(),
    idempotency_key: `${refund.refundRequestId}:settled`,
    correlation_id: `market:${order.listingId}`,
    destination: "shs-metaverse-market",
    payload: { order_id: order.orderId, buyer_user_id: order.buyerUserId, refund_request_id: refund.refundRequestId },
  });
  return updated;
}

import { randomUUID } from "node:crypto";
import { IntegrationOutboxRepo } from "../../../trusted-reporting/outbox-repo.js";
import { MarketRepo } from "../repo/market-repo.js";
import { MarketError } from "./market-errors.js";
import { canAdminMarket, scope } from "./market-policy.js";

const repo = new MarketRepo();
const outbox = new IntegrationOutboxRepo();

export async function fulfillOrder(actor: any, orderId: string, input: any = {}) {
  const s = scope(actor);
  const order = await repo.getOrder(orderId);
  if (!order || order.organizationId !== s.organizationId) throw new MarketError("NOT_FOUND", "Order not found.", 404);
  if (order.buyerUserId === s.userId) throw new MarketError("BUYER_CANNOT_FULFILL", "Buyer cannot fulfill their own order.", 403);
  const sellerOwnedByActor = order.sellerType === "STUDENT" && order.sellerRef === s.userId;
  if (!sellerOwnedByActor && !canAdminMarket(actor)) throw new MarketError("FORBIDDEN", "Only the seller or an authorized reviewer can fulfill this order.", 403);
  if (!["PAID", "ACCEPTED", "IN_FULFILLMENT"].includes(order.status)) throw new MarketError("FULFILLMENT_NOT_ALLOWED", "Order is not ready for fulfillment.", 409);
  await repo.createFulfillment({
    fulfillmentId: `market_fulfillment_${randomUUID()}`,
    orderId,
    organizationId: s.organizationId,
    tenantId: s.tenantId,
    fulfilledByUserId: s.userId,
    fulfillmentType: String(input.fulfillmentType || order.fulfillmentTermsSnapshot.fulfillmentType || "DIGITAL_DELIVERY"),
    fulfillmentRef: input.fulfillmentRef || null,
    notes: input.notes || null,
  });
  const fulfilled = await repo.updateOrderStatus(orderId, s.organizationId, "FULFILLED", "fulfilled_at");
  await outbox.enqueue({
    producer_id: "shs-api.metaverse.market",
    event_type: "market.order.fulfilled",
    subject_type: "market_order",
    subject_id: orderId,
    organization_id: s.organizationId,
    originating_actor_id: s.userId,
    occurred_at: new Date().toISOString(),
    idempotency_key: `${orderId}:fulfilled`,
    correlation_id: `market:${order.listingId}`,
    destination: "shs-metaverse-market",
    payload: { order_id: orderId, buyer_user_id: order.buyerUserId },
  });
  return fulfilled;
}

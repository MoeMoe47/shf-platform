import { query } from "../../../../db/client.js";
import type { MarketListing, MarketOrder, MarketRefundRequest } from "../model/market-contract.js";

export type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

function camelListing(row: any): MarketListing {
  return {
    listingId: row.listing_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    sellerType: row.seller_type,
    sellerRef: row.seller_ref,
    createdByUserId: row.created_by_user_id,
    title: row.title,
    summary: row.summary,
    description: row.description,
    listingType: row.listing_type,
    category: row.category,
    priceType: row.price_type,
    priceAmount: row.price_amount === null ? null : Number(row.price_amount),
    currencyType: row.currency_type,
    quantityMode: row.quantity_mode,
    quantityAvailable: row.quantity_available === null ? null : Number(row.quantity_available),
    fulfillmentType: row.fulfillment_type,
    visibility: row.visibility,
    districtId: row.district_id,
    facilityId: row.facility_id,
    programId: row.program_id,
    missionId: row.mission_id,
    status: row.status,
    availableFrom: row.available_from,
    availableUntil: row.available_until,
    rejectionReason: row.rejection_reason,
    moderationReason: row.moderation_reason,
    approvedByUserId: row.approved_by_user_id,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: Number(row.version || 1),
  };
}

function camelOrder(row: any): MarketOrder {
  return {
    orderId: row.order_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    listingId: row.listing_id,
    buyerUserId: row.buyer_user_id,
    buyerTeamId: row.buyer_team_id,
    sellerType: row.seller_type,
    sellerRef: row.seller_ref,
    quantity: Number(row.quantity),
    unitPriceSnapshot: Number(row.unit_price_snapshot),
    totalPriceSnapshot: Number(row.total_price_snapshot),
    currencyType: row.currency_type,
    listingSnapshot: row.listing_snapshot_json || {},
    buyerSnapshot: row.buyer_snapshot_json || {},
    fulfillmentTermsSnapshot: row.fulfillment_terms_snapshot_json || {},
    treasuryPaymentIntentRef: row.treasury_payment_intent_ref,
    treasuryTransactionRef: row.treasury_transaction_ref,
    status: row.status,
    placedAt: row.placed_at,
    acceptedAt: row.accepted_at,
    fulfilledAt: row.fulfilled_at,
    cancelledAt: row.cancelled_at,
    refundedAt: row.refunded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function camelRefund(row: any): MarketRefundRequest {
  return {
    refundRequestId: row.refund_request_id,
    orderId: row.order_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    requestedByUserId: row.requested_by_user_id,
    reason: row.reason,
    status: row.status,
    reviewerUserId: row.reviewer_user_id,
    reviewedAt: row.reviewed_at,
    treasuryRefundRef: row.treasury_refund_ref,
    requestedAt: row.requested_at,
    updatedAt: row.updated_at,
  };
}

export class MarketRepo {
  async createListing(input: Partial<MarketListing>, db: Executor = { query }) {
    const result = await db.query(
      `INSERT INTO market_listings (listing_id, organization_id, tenant_id, seller_type, seller_ref, created_by_user_id, title, summary, description, listing_type, category, price_type, price_amount, currency_type, quantity_mode, quantity_available, fulfillment_type, visibility, district_id, facility_id, program_id, mission_id, status, available_from, available_until)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING *`,
      [input.listingId, input.organizationId, input.tenantId, input.sellerType, input.sellerRef, input.createdByUserId, input.title, input.summary, input.description, input.listingType, input.category, input.priceType, input.priceAmount, input.currencyType, input.quantityMode, input.quantityAvailable, input.fulfillmentType, input.visibility, input.districtId, input.facilityId, input.programId, input.missionId, input.status, input.availableFrom, input.availableUntil],
    );
    return camelListing(result.rows[0]);
  }

  async getListing(listingId: string, db: Executor = { query }) {
    const result = await db.query("SELECT * FROM market_listings WHERE listing_id=$1", [listingId]);
    return result.rows[0] ? camelListing(result.rows[0]) : null;
  }

  async listListings(organizationId: string, db: Executor = { query }) {
    const result = await db.query(
      "SELECT * FROM market_listings WHERE organization_id=$1 AND status IN ('PUBLISHED','SOLD_OUT') ORDER BY created_at DESC, listing_id DESC",
      [organizationId],
    );
    return result.rows.map(camelListing);
  }

  async updateListingStatus(listingId: string, organizationId: string, status: string, actorId: string, reason?: string, db: Executor = { query }) {
    const result = await db.query(
      `UPDATE market_listings SET status=$3, approved_by_user_id=CASE WHEN $3 IN ('APPROVED','PUBLISHED') THEN $4 ELSE approved_by_user_id END, approved_at=CASE WHEN $3 IN ('APPROVED','PUBLISHED') THEN NOW() ELSE approved_at END, rejection_reason=CASE WHEN $3='REJECTED' THEN $5 ELSE rejection_reason END, moderation_reason=CASE WHEN $3='SUSPENDED' THEN $5 ELSE moderation_reason END, updated_at=NOW(), version=version+1
       WHERE listing_id=$1 AND organization_id=$2 RETURNING *`,
      [listingId, organizationId, status, actorId, reason || null],
    );
    return result.rows[0] ? camelListing(result.rows[0]) : null;
  }

  async decrementQuantity(listingId: string, organizationId: string, quantity: number, db: Executor = { query }) {
    const result = await db.query(
      `UPDATE market_listings
       SET quantity_available = quantity_available - $3,
           status = CASE WHEN quantity_mode='LIMITED' AND quantity_available - $3 = 0 THEN 'SOLD_OUT' ELSE status END,
           updated_at = NOW(), version = version + 1
       WHERE listing_id=$1 AND organization_id=$2
         AND (quantity_mode='UNLIMITED' OR quantity_available >= $3)
       RETURNING *`,
      [listingId, organizationId, quantity],
    );
    return result.rows[0] ? camelListing(result.rows[0]) : null;
  }

  async createOrder(input: Partial<MarketOrder>, db: Executor = { query }) {
    const result = await db.query(
      `INSERT INTO market_orders (order_id, organization_id, tenant_id, listing_id, buyer_user_id, buyer_team_id, seller_type, seller_ref, quantity, unit_price_snapshot, total_price_snapshot, currency_type, listing_snapshot_json, buyer_snapshot_json, fulfillment_terms_snapshot_json, treasury_payment_intent_ref, treasury_transaction_ref, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::jsonb,$16,$17,$18)
       ON CONFLICT (organization_id, treasury_payment_intent_ref) DO UPDATE SET updated_at=market_orders.updated_at
       RETURNING *`,
      [input.orderId, input.organizationId, input.tenantId, input.listingId, input.buyerUserId, input.buyerTeamId, input.sellerType, input.sellerRef, input.quantity, input.unitPriceSnapshot, input.totalPriceSnapshot, input.currencyType, JSON.stringify(input.listingSnapshot || {}), JSON.stringify(input.buyerSnapshot || {}), JSON.stringify(input.fulfillmentTermsSnapshot || {}), input.treasuryPaymentIntentRef, input.treasuryTransactionRef, input.status],
    );
    return camelOrder(result.rows[0]);
  }

  async getOrderByPaymentIntent(organizationId: string, treasuryPaymentIntentRef: string, db: Executor = { query }) {
    const result = await db.query("SELECT * FROM market_orders WHERE organization_id=$1 AND treasury_payment_intent_ref=$2", [organizationId, treasuryPaymentIntentRef]);
    return result.rows[0] ? camelOrder(result.rows[0]) : null;
  }

  async getOrder(orderId: string, db: Executor = { query }) {
    const result = await db.query("SELECT * FROM market_orders WHERE order_id=$1", [orderId]);
    return result.rows[0] ? camelOrder(result.rows[0]) : null;
  }

  async listOrdersForActor(organizationId: string, userId: string, db: Executor = { query }) {
    const result = await db.query("SELECT * FROM market_orders WHERE organization_id=$1 AND buyer_user_id=$2 ORDER BY created_at DESC", [organizationId, userId]);
    return result.rows.map(camelOrder);
  }

  async listSellerOrders(organizationId: string, sellerType: string, sellerRef: string, db: Executor = { query }) {
    const result = await db.query("SELECT * FROM market_orders WHERE organization_id=$1 AND seller_type=$2 AND seller_ref=$3 ORDER BY created_at DESC", [organizationId, sellerType, sellerRef]);
    return result.rows.map(camelOrder);
  }

  async updateOrderPayment(orderId: string, organizationId: string, treasuryTransactionRef: string, db: Executor = { query }) {
    const result = await db.query(
      `UPDATE market_orders SET treasury_transaction_ref=COALESCE(treasury_transaction_ref,$3), status=CASE WHEN status='PENDING_PAYMENT' THEN 'PAID' ELSE status END, updated_at=NOW()
       WHERE order_id=$1 AND organization_id=$2 RETURNING *`,
      [orderId, organizationId, treasuryTransactionRef],
    );
    return result.rows[0] ? camelOrder(result.rows[0]) : null;
  }

  async updateOrderStatus(orderId: string, organizationId: string, status: string, timestampColumn?: string, db: Executor = { query }) {
    const allowedTimestamp = new Set(["accepted_at", "fulfilled_at", "cancelled_at", "refunded_at"]);
    const tsSql = timestampColumn && allowedTimestamp.has(timestampColumn) ? `, ${timestampColumn}=NOW()` : "";
    const result = await db.query(`UPDATE market_orders SET status=$3, updated_at=NOW()${tsSql} WHERE order_id=$1 AND organization_id=$2 RETURNING *`, [orderId, organizationId, status]);
    return result.rows[0] ? camelOrder(result.rows[0]) : null;
  }

  async createFulfillment(input: { fulfillmentId: string; orderId: string; organizationId: string; tenantId: string; fulfilledByUserId: string; fulfillmentType: string; fulfillmentRef?: string | null; notes?: string | null }, db: Executor = { query }) {
    await db.query(
      `INSERT INTO market_fulfillments (fulfillment_id, order_id, organization_id, tenant_id, fulfilled_by_user_id, fulfillment_type, fulfillment_ref, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (order_id) DO NOTHING`,
      [input.fulfillmentId, input.orderId, input.organizationId, input.tenantId, input.fulfilledByUserId, input.fulfillmentType, input.fulfillmentRef || null, input.notes || null],
    );
  }

  async createRefund(input: Partial<MarketRefundRequest>, db: Executor = { query }) {
    const result = await db.query(
      `INSERT INTO market_refund_requests (refund_request_id, order_id, organization_id, tenant_id, requested_by_user_id, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,'REQUESTED')
       RETURNING *`,
      [input.refundRequestId, input.orderId, input.organizationId, input.tenantId, input.requestedByUserId, input.reason],
    );
    return camelRefund(result.rows[0]);
  }

  async getRefund(refundRequestId: string, db: Executor = { query }) {
    const result = await db.query("SELECT * FROM market_refund_requests WHERE refund_request_id=$1", [refundRequestId]);
    return result.rows[0] ? camelRefund(result.rows[0]) : null;
  }

  async settleRefund(refundRequestId: string, organizationId: string, reviewerUserId: string, treasuryRefundRef: string, db: Executor = { query }) {
    const result = await db.query(
      `UPDATE market_refund_requests SET status='SETTLED', reviewer_user_id=$3, reviewed_at=NOW(), treasury_refund_ref=COALESCE(treasury_refund_ref,$4), updated_at=NOW()
       WHERE refund_request_id=$1 AND organization_id=$2 AND status IN ('REQUESTED','APPROVED')
       RETURNING *`,
      [refundRequestId, organizationId, reviewerUserId, treasuryRefundRef],
    );
    return result.rows[0] ? camelRefund(result.rows[0]) : null;
  }
}

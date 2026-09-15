import { randomUUID } from "node:crypto";
import { IntegrationOutboxRepo } from "../../../trusted-reporting/outbox-repo.js";
import { MarketRepo } from "../repo/market-repo.js";
import { MARKET_CURRENCY_TYPES, MARKET_FULFILLMENT_TYPES, MARKET_LISTING_TYPES, MARKET_PRICE_TYPES, MARKET_QUANTITY_MODES, MARKET_VISIBILITIES, isProhibitedInstitutionalGood } from "../model/market-contract.js";
import { MarketError } from "./market-errors.js";
import { canAdminMarket, deriveSeller, scope } from "./market-policy.js";

const repo = new MarketRepo();
const outbox = new IntegrationOutboxRepo();

function enumValue(name: string, value: string, allowed: readonly string[]) {
  if (!allowed.includes(value)) throw new MarketError("INVALID_ENUM_VALUE", `${name} is not supported.`, 400);
  return value;
}

export async function createListing(actor: any, input: any) {
  const s = scope(actor);
  const seller = await deriveSeller(actor, input);
  const listingType = enumValue("listingType", String(input?.listingType || ""), MARKET_LISTING_TYPES);
  const priceType = enumValue("priceType", String(input?.priceType || "FIXED"), MARKET_PRICE_TYPES);
  const currencyType = enumValue("currencyType", String(input?.currencyType || (priceType === "FREE" ? "NONE" : "SHF_CREDITS")), MARKET_CURRENCY_TYPES);
  const quantityMode = enumValue("quantityMode", String(input?.quantityMode || "UNLIMITED"), MARKET_QUANTITY_MODES);
  const fulfillmentType = enumValue("fulfillmentType", String(input?.fulfillmentType || "DIGITAL_DELIVERY"), MARKET_FULFILLMENT_TYPES);
  const requestedVisibility = String(input?.visibility || "ORGANIZATION").toUpperCase();
  const visibility = enumValue("visibility", canAdminMarket(actor) ? requestedVisibility : (requestedVisibility === "PROGRAM" ? "PROGRAM" : "ORGANIZATION"), MARKET_VISIBILITIES);
  const title = String(input?.title || "").trim();
  const summary = String(input?.summary || "").trim();
  if (!title || !summary) throw new MarketError("LISTING_CONTENT_REQUIRED", "Title and summary are required.", 400);
  if (isProhibitedInstitutionalGood({ title, summary, description: input?.description, category: input?.category, listingType })) {
    throw new MarketError("PROHIBITED_MARKET_GOOD", "Institutional outcomes cannot be market listings.", 400);
  }
  const priceAmount = priceType === "FREE" ? 0 : Number(input?.priceAmount ?? 0);
  if (!Number.isInteger(priceAmount) || priceAmount < 0) throw new MarketError("INVALID_PRICE", "Price must be a non-negative whole SHF Credit amount.", 400);
  if (priceType === "FREE" && currencyType !== "NONE") throw new MarketError("INVALID_PRICE", "Free listings must use NONE currency.", 400);
  const quantityAvailable = quantityMode === "LIMITED" ? Number(input?.quantityAvailable) : null;
  if (quantityMode === "LIMITED" && (!Number.isInteger(quantityAvailable) || quantityAvailable < 0)) throw new MarketError("INVALID_QUANTITY", "Limited listings require non-negative quantity.", 400);
  const status = canAdminMarket(actor) ? "PUBLISHED" : "PENDING_REVIEW";
  const listing = await repo.createListing({
    listingId: `market_listing_${randomUUID()}`,
    organizationId: s.organizationId,
    tenantId: s.tenantId,
    sellerType: seller.sellerType,
    sellerRef: seller.sellerRef,
    createdByUserId: s.userId,
    title,
    summary,
    description: input?.description ? String(input.description) : null,
    listingType: listingType as any,
    category: String(input?.category || "GENERAL").toUpperCase(),
    priceType: priceType as any,
    priceAmount,
    currencyType: currencyType as any,
    quantityMode: quantityMode as any,
    quantityAvailable,
    fulfillmentType: fulfillmentType as any,
    visibility: visibility as any,
    districtId: input?.districtId || null,
    facilityId: input?.facilityId || null,
    programId: input?.programId || null,
    missionId: input?.missionId || null,
    status: status as any,
    availableFrom: input?.availableFrom || null,
    availableUntil: input?.availableUntil || null,
  });
  await outbox.enqueue({
    producer_id: "shs-api.metaverse.market",
    event_type: status === "PUBLISHED" ? "market.listing.published" : "market.listing.review_requested",
    subject_type: "market_listing",
    subject_id: listing.listingId,
    organization_id: s.organizationId,
    originating_actor_id: s.userId,
    occurred_at: new Date().toISOString(),
    idempotency_key: listing.listingId,
    correlation_id: `market:${listing.listingId}`,
    destination: "shs-metaverse-market",
    payload: { listing_id: listing.listingId, seller_user_id: seller.sellerType === "STUDENT" ? seller.sellerRef : null, created_by_user_id: s.userId },
  });
  return listing;
}

export async function listListings(actor: any) {
  const s = scope(actor);
  return repo.listListings(s.organizationId);
}

export async function getListing(actor: any, listingId: string) {
  const s = scope(actor);
  const listing = await repo.getListing(listingId);
  if (!listing || (listing.organizationId !== s.organizationId && !["NETWORK", "CITY"].includes(listing.visibility))) return null;
  if (!["PUBLISHED", "SOLD_OUT"].includes(listing.status) && listing.createdByUserId !== s.userId && !canAdminMarket(actor)) return null;
  return listing;
}

export async function reviewListing(actor: any, listingId: string, decision: "APPROVE" | "REJECT" | "SUSPEND", reason?: string) {
  const s = scope(actor);
  if (!canAdminMarket(actor)) throw new MarketError("FORBIDDEN", "Listing review authority is required.", 403);
  const status = decision === "APPROVE" ? "PUBLISHED" : decision === "REJECT" ? "REJECTED" : "SUSPENDED";
  const listing = await repo.updateListingStatus(listingId, s.organizationId, status, s.userId, reason);
  if (!listing) throw new MarketError("NOT_FOUND", "Listing not found.", 404);
  return listing;
}

export { repo as listingRepo };

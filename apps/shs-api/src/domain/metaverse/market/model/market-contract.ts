// MET-9 — Student Market contract.
//
// Market owns listings, orders, fulfillment, cancellation and refund
// workflow. Treasury owns SHF Credit balances, transfer execution, refund
// settlement and canonical financial history.

export const MARKET_SELLER_TYPES = ["STUDENT", "TEAM", "PROGRAM", "ORGANIZATION", "SYSTEM", "STUDENT_ENTERPRISE"] as const;
export type MarketSellerType = typeof MARKET_SELLER_TYPES[number];

export const MARKET_LISTING_TYPES = [
  "DIGITAL_PRODUCT",
  "SERVICE",
  "PROJECT_RESOURCE",
  "PROGRAM_RESOURCE",
  "ARCADE_RESOURCE",
  "EVENT_ITEM",
  "COSMETIC_ITEM",
  "CITY_COLLECTIBLE",
  "EDUCATIONAL_RESOURCE",
  "SIMULATED_GOOD",
] as const;
export type MarketListingType = typeof MARKET_LISTING_TYPES[number];

export const MARKET_PRICE_TYPES = ["FIXED", "FREE", "PROGRAM_DEFINED", "REWARD_REDEMPTION"] as const;
export type MarketPriceType = typeof MARKET_PRICE_TYPES[number];

export const MARKET_CURRENCY_TYPES = ["SHF_CREDITS", "PROGRAM_POINTS", "NONE"] as const;
export type MarketCurrencyType = typeof MARKET_CURRENCY_TYPES[number];

export const MARKET_QUANTITY_MODES = ["UNLIMITED", "LIMITED"] as const;
export type MarketQuantityMode = typeof MARKET_QUANTITY_MODES[number];

export const MARKET_FULFILLMENT_TYPES = [
  "DIGITAL_DELIVERY",
  "IN_PLATFORM_SERVICE",
  "PROJECT_HANDOFF",
  "EVENT_ACCESS",
  "PROGRAM_RESOURCE",
  "SIMULATED_GOOD",
] as const;
export type MarketFulfillmentType = typeof MARKET_FULFILLMENT_TYPES[number];

export const MARKET_VISIBILITIES = ["PRIVATE", "PROGRAM", "ORGANIZATION", "NETWORK", "CITY"] as const;
export type MarketVisibility = typeof MARKET_VISIBILITIES[number];

export const MARKET_LISTING_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "PUBLISHED",
  "PAUSED",
  "REJECTED",
  "SUSPENDED",
  "ARCHIVED",
  "SOLD_OUT",
] as const;
export type MarketListingStatus = typeof MARKET_LISTING_STATUSES[number];

export const MARKET_ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "ACCEPTED",
  "IN_FULFILLMENT",
  "FULFILLED",
  "CANCEL_REQUESTED",
  "CANCELLED",
  "REFUND_REQUESTED",
  "REFUNDED",
  "DECLINED",
  "EXPIRED",
] as const;
export type MarketOrderStatus = typeof MARKET_ORDER_STATUSES[number];

export const PROHIBITED_MARKET_GOOD_TERMS = [
  "grade",
  "academic mastery",
  "verified skill",
  "credential",
  "certificate",
  "civic authority",
  "job eligibility",
  "career qualification",
  "verified evidence",
  "instructor approval",
  "course completion",
  "assessment outcome",
  "legal entitlement",
  "membership authority",
  "work passport",
] as const;

export interface MarketListing {
  listingId: string;
  organizationId: string;
  tenantId: string;
  sellerType: MarketSellerType;
  sellerRef: string;
  createdByUserId: string;
  title: string;
  summary: string;
  description: string | null;
  listingType: MarketListingType;
  category: string;
  priceType: MarketPriceType;
  priceAmount: number | null;
  currencyType: MarketCurrencyType;
  quantityMode: MarketQuantityMode;
  quantityAvailable: number | null;
  fulfillmentType: MarketFulfillmentType;
  visibility: MarketVisibility;
  districtId: string | null;
  facilityId: string | null;
  programId: string | null;
  missionId: string | null;
  status: MarketListingStatus;
  availableFrom: string | null;
  availableUntil: string | null;
  rejectionReason: string | null;
  moderationReason: string | null;
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface MarketOrder {
  orderId: string;
  organizationId: string;
  tenantId: string;
  listingId: string;
  buyerUserId: string;
  buyerTeamId: string | null;
  sellerType: MarketSellerType;
  sellerRef: string;
  quantity: number;
  unitPriceSnapshot: number;
  totalPriceSnapshot: number;
  currencyType: MarketCurrencyType;
  listingSnapshot: Record<string, unknown>;
  buyerSnapshot: Record<string, unknown>;
  fulfillmentTermsSnapshot: Record<string, unknown>;
  treasuryPaymentIntentRef: string;
  treasuryTransactionRef: string | null;
  status: MarketOrderStatus;
  placedAt: string;
  acceptedAt: string | null;
  fulfilledAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketRefundRequest {
  refundRequestId: string;
  orderId: string;
  organizationId: string;
  tenantId: string;
  requestedByUserId: string;
  reason: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "SETTLED";
  reviewerUserId: string | null;
  reviewedAt: string | null;
  treasuryRefundRef: string | null;
  requestedAt: string;
  updatedAt: string;
}

export function isAllowedListingType(value: string): value is MarketListingType {
  return (MARKET_LISTING_TYPES as readonly string[]).includes(value);
}

export function isProhibitedInstitutionalGood(input: { title?: string; summary?: string; description?: string; category?: string; listingType?: string }) {
  const haystack = [input.title, input.summary, input.description, input.category, input.listingType]
    .map((part) => String(part || "").toLowerCase())
    .join(" ");
  return PROHIBITED_MARKET_GOOD_TERMS.some((term) => haystack.includes(term));
}

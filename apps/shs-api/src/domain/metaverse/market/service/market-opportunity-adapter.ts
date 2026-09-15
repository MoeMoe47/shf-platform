import { MarketError } from "./market-errors.js";
import { scope } from "./market-policy.js";
import { defaultTreasuryAdapter, type TreasuryAdapter } from "./market-treasury-adapter.js";

export async function settleOpportunityCompensation(actor: any, input: { opportunityId: string; awardId: string; paymentIntentRef: string; awardeeUserId: string; amount: number; acceptedWork: boolean; idempotencyKey: string }, treasury: TreasuryAdapter = defaultTreasuryAdapter) {
  const s = scope(actor);
  if (!input.acceptedWork) throw new MarketError("OPPORTUNITY_COMPENSATION_NOT_ELIGIBLE", "Opportunity work must be accepted before compensation settlement.", 409);
  if (!input.paymentIntentRef || !input.paymentIntentRef.startsWith("payment_intent_")) throw new MarketError("PAYMENT_INTENT_REQUIRED", "MET-8 payment intent reference is required.", 400);
  if (!Number.isInteger(input.amount) || input.amount <= 0) throw new MarketError("INVALID_COMPENSATION", "Compensation amount must be positive.", 400);
  return treasury.refund({
    organizationId: s.organizationId,
    buyerUserId: input.awardeeUserId,
    sellerType: "SYSTEM",
    sellerRef: s.organizationId,
    amount: input.amount,
    currencyType: "SHF_CREDITS",
    purpose: "OPPORTUNITY_COMPENSATION",
    sourceRef: input.awardId,
    idempotencyKey: `opportunity_compensation:${input.idempotencyKey}`,
  });
}

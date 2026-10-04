import type { SalesOpportunityStage } from "../model/sales-record.js";

export type SalesStageTransitionCode =
  | "TRANSITION_ALLOWED"
  | "MISSING_RELATIONSHIP"
  | "DISCOVERY_INCOMPLETE"
  | "MISSING_ACTIVE_NEED"
  | "PRODUCT_AUTHORITY_REQUIRED"
  | "FUNDING_REVIEW_REQUIRED"
  | "PROPOSAL_AUTHORITY_NOT_CONNECTED"
  | "CONTRACT_AUTHORITY_NOT_CONNECTED"
  | "INVALID_TRANSITION";

export type SalesStageTransitionDecision = {
  allowed: boolean;
  code: SalesStageTransitionCode;
  message: string;
  warnings: string[];
};

export type SalesStageTransitionContext = {
  relationshipStatus?: string | null;
  discoveryStatus?: string | null;
  hasActiveNeed: boolean;
  productAuthorityConnected: boolean;
  fundingReviewComplete: boolean;
  noFundingNeeded: boolean;
  proposalAuthorityConnected: boolean;
  contractAuthorityConnected: boolean;
};

const ORDER: SalesOpportunityStage[] = [
  "TARGET", "RELATIONSHIP", "DISCOVERY", "SOLUTION", "FUNDING", "PROPOSAL", "CONTRACT", "WON",
];

function decision(code: SalesStageTransitionCode, message: string, warnings: string[] = []): SalesStageTransitionDecision {
  return { allowed: code === "TRANSITION_ALLOWED", code, message, warnings };
}

export function evaluateSalesOpportunityStageTransition(
  fromStage: SalesOpportunityStage,
  toStage: SalesOpportunityStage,
  context: SalesStageTransitionContext,
): SalesStageTransitionDecision {
  if (fromStage === toStage) return decision("TRANSITION_ALLOWED", "Opportunity is already at the requested stage.");
  if (fromStage === "WON" || fromStage === "LOST") {
    return decision("INVALID_TRANSITION", "Closed Opportunities cannot change stage.");
  }
  if (toStage === "LOST") return decision("TRANSITION_ALLOWED", "Opportunity may be closed as lost.");
  if (toStage === "WON") {
    if (fromStage !== "CONTRACT") return decision("INVALID_TRANSITION", "WON requires a preceding CONTRACT stage.");
    if (!context.contractAuthorityConnected) {
      return decision("CONTRACT_AUTHORITY_NOT_CONNECTED", "A connected contract authority must confirm signed status before WON.");
    }
    return decision("CONTRACT_AUTHORITY_NOT_CONNECTED", "No Sales contract reference is available to verify signed status.");
  }

  const fromIndex = ORDER.indexOf(fromStage);
  const toIndex = ORDER.indexOf(toStage);
  if (toIndex !== fromIndex + 1) {
    return decision("INVALID_TRANSITION", "Opportunity stages must advance one governed stage at a time.");
  }
  if (toStage === "DISCOVERY" && !["ACTIVE", "PARTNER"].includes(context.relationshipStatus || "")) {
    return decision("MISSING_RELATIONSHIP", "DISCOVERY requires an active Sales relationship for this account.");
  }
  if (toStage === "SOLUTION" && context.discoveryStatus !== "COMPLETE") {
    return decision("DISCOVERY_INCOMPLETE", "SOLUTION requires a completed Discovery record.");
  }
  if ((toStage === "SOLUTION" || toStage === "FUNDING") && !context.hasActiveNeed) {
    return decision("MISSING_ACTIVE_NEED", "This stage requires at least one active Need for the same account.");
  }
  if (toStage === "FUNDING" && !context.productAuthorityConnected) {
    return decision("TRANSITION_ALLOWED", "Funding exploration may proceed; this stage is not product approval.", [
      "No product approval is implied. PRODUCT_AUTHORITY_REQUIRED before any product is represented as Sales-ready.",
    ]);
  }
  if (toStage === "PROPOSAL") {
    if (!context.fundingReviewComplete && !context.noFundingNeeded) {
      return decision("FUNDING_REVIEW_REQUIRED", "A funding review or governed no-funding-needed disposition is required.");
    }
    if (!context.proposalAuthorityConnected) {
      return decision("PROPOSAL_AUTHORITY_NOT_CONNECTED", "Proposal authority is not connected.");
    }
  }
  if (toStage === "CONTRACT" && !context.proposalAuthorityConnected) {
    return decision("PROPOSAL_AUTHORITY_NOT_CONNECTED", "Proposal authority must confirm an approved proposal before CONTRACT.");
  }
  if (toStage === "CONTRACT" && !context.contractAuthorityConnected) {
    return decision("CONTRACT_AUTHORITY_NOT_CONNECTED", "Contract authority is not connected.");
  }
  return decision("TRANSITION_ALLOWED", "Current Sales records satisfy the backend transition policy.");
}

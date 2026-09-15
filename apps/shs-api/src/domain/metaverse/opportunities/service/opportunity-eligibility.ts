// MET-8 — eligibility engine (build brief §6/§7).
//
// Pure function over server-derived facts only. Never trusts a client-
// supplied eligibility claim. Every result carries an explainable reason
// and (when relevant) a list of what remains before ELIGIBLE. BEGINNER-tier
// opportunities never require prior reputation/awards (§7) — that
// invariant is enforced here, not left to each caller to remember.
import type { EligibilityResult, EligibilityRules, OpportunityDifficultyTier, StudentOpportunityStatus } from "../model/opportunity-contract.js";

export interface EligibilityFacts {
  opportunityStatus: StudentOpportunityStatus;
  applicationWindowOpen: boolean;
  bidCount: number;
  maxAwards: number;
  activeAwardsCount: number;
  alreadyHasActiveBid: boolean;
  difficultyTier: OpportunityDifficultyTier;
  isActiveEnrollment: boolean;
  enrolledProgramIds: string[];
  enrolledCohortIds: string[];
  priorCompletedAwardsCount: number;
}

export interface EligibilityEvaluation {
  result: EligibilityResult;
  reasons: string[];
  requirementsRemaining: string[];
}

export function evaluateEligibility(rules: EligibilityRules, facts: EligibilityFacts): EligibilityEvaluation {
  if (facts.opportunityStatus !== "OPEN") {
    return { result: "CLOSED", reasons: [`Opportunity is ${facts.opportunityStatus.toLowerCase()}, not open for bids.`], requirementsRemaining: [] };
  }
  if (!facts.applicationWindowOpen) {
    return { result: "CLOSED", reasons: ["The application window is not currently open."], requirementsRemaining: [] };
  }
  if (facts.activeAwardsCount >= facts.maxAwards) {
    return { result: "FULL", reasons: ["All available awards for this opportunity have already been given."], requirementsRemaining: [] };
  }
  if (facts.alreadyHasActiveBid) {
    return { result: "RESTRICTED", reasons: ["You already have an active bid on this opportunity."], requirementsRemaining: [] };
  }

  // BEGINNER tier is a fairness floor: never gated by prior reputation/awards
  // (build brief §7), regardless of what eligibility_rules a sponsor set.
  const requiresReputation = facts.difficultyTier !== "BEGINNER" && !rules.noReputationRequired;

  const requirementsRemaining: string[] = [];
  const reasons: string[] = [];

  if (rules.requiresActiveEnrollment && !facts.isActiveEnrollment) {
    requirementsRemaining.push("An active enrollment in this organization is required.");
  }
  if (rules.requiresProgramId && !facts.enrolledProgramIds.includes(rules.requiresProgramId)) {
    requirementsRemaining.push("Enrollment in the sponsoring program is required.");
  }
  if (rules.requiresCohortId && !facts.enrolledCohortIds.includes(rules.requiresCohortId)) {
    requirementsRemaining.push("Membership in the sponsoring cohort is required.");
  }
  if (requiresReputation && rules.minPriorCompletedAwards && facts.priorCompletedAwardsCount < rules.minPriorCompletedAwards) {
    requirementsRemaining.push(`Completing ${rules.minPriorCompletedAwards} prior awarded opportunit${rules.minPriorCompletedAwards === 1 ? "y" : "ies"} in this organization is required.`);
  }

  if (requirementsRemaining.length) {
    return { result: "CONDITIONALLY_ELIGIBLE", reasons: ["Some requirements are not yet met."], requirementsRemaining };
  }
  reasons.push(facts.difficultyTier === "BEGINNER" ? "Open to all students regardless of prior history." : "All eligibility requirements are met.");
  return { result: "ELIGIBLE", reasons, requirementsRemaining: [] };
}

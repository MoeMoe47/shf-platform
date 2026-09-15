// MET-8 — evidence boundary description (build brief §16/§30, mirrors
// apps/shs-api/src/domain/metaverse/missions/mission-evidence-adapter.ts).
//
// Pure, read-only. Never writes to verified_evidence/truth_facts and never
// calls projectAuthoritativeFact/createEvidenceRule itself. Accepted work
// is described as an EVIDENCE CANDIDATE only — an organization must
// separately register an evidence rule for the OPPORTUNITY_SUBMISSION
// source type (apps/shs-api/src/domain/verified-evidence/service/
// verified-evidence-service.ts SOURCE_TABLES) before verified-evidence
// authority will ever project it into real Evidence. The Exchange never
// asserts verification itself.
export interface OpportunityEvidenceExpectation {
  possibleSourceType: "OPPORTUNITY_SUBMISSION";
  canBecomeEvidenceCandidate: boolean;
  isVerifiedEvidence: false;
  notes: string;
}

export function describeOpportunitySubmissionEvidenceExpectation(accepted: boolean): OpportunityEvidenceExpectation {
  return {
    possibleSourceType: "OPPORTUNITY_SUBMISSION",
    canBecomeEvidenceCandidate: accepted,
    isVerifiedEvidence: false,
    notes: accepted
      ? "Accepted work is an evidence candidate. It becomes real Evidence only if this organization has registered an OPPORTUNITY_SUBMISSION evidence rule and the verified-evidence domain projects it — the Exchange never verifies evidence itself."
      : "Work has not been accepted yet, so it carries no evidence-candidate status.",
  };
}

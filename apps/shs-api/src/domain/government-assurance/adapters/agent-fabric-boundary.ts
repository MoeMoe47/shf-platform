/** Shared Agent Fabric contract for GPA consumers. No agent persistence lives here. */
export const GPA_AGENT_IDENTIFIER = "gpa-governed-assistant";
export const GPA_AGENT_PURPOSE = "GOVERNMENT_PROGRAM_ASSURANCE";

export const GPA_AGENT_FORBIDDEN_AUTHORITIES = Object.freeze([
  "DETERMINE_TRUTH",
  "VERIFY_CLAIM",
  "APPROVE_PUBLIC_DISCLOSURE",
  "RECONCILE_SOURCE",
  "RECORD_GOVERNMENT_DECISION",
  "RELEASE_PAYMENT",
]);

export function assertAdvisoryAgentResult(result: any) {
  if (result?.status === "GROUNDED" && result?.decision === "APPROVED") {
    throw new Error("GPA_AGENT_CONSEQUENTIAL_DECISION_FORBIDDEN");
  }
  return {
    ...result,
    authority: "ADVISORY_ONLY",
    mayDetermineTruth: false,
    mayApprovePublication: false,
    mayRecordGovernmentDecision: false,
  };
}


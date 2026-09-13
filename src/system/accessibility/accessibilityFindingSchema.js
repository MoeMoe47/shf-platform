export const FINDING_SEVERITIES = ["CRITICAL", "SERIOUS", "MODERATE", "MINOR", "INFO"];
export const RELEASE_IMPACTS = ["BLOCK_RELEASE", "REQUIRES_REVIEW", "WARNING", "INFORMATIONAL"];
export const FINDING_STATES = ["OPEN", "ACKNOWLEDGED", "IN_REMEDIATION", "READY_FOR_RETEST", "VERIFIED_FIXED", "WAIVED", "ACCEPTED_RISK", "REGRESSION"];
export const HUMAN_REVIEW_STATES = ["NOT_REQUIRED", "REQUIRED", "SCHEDULED", "COMPLETED", "FAILED", "WAIVED_BY_AUTHORITY"];

export function isFinding(finding) {
  return Boolean(finding?.findingId && finding?.ruleId && finding?.sourceTool && FINDING_SEVERITIES.includes(finding.severity) && RELEASE_IMPACTS.includes(finding.releaseImpact) && FINDING_STATES.includes(finding.status));
}

export function createFinding(input) {
  const finding = { humanReviewRequired: false, status: "OPEN", ...input };
  if (!isFinding(finding)) throw new Error("invalid_accessibility_finding");
  return Object.freeze(finding);
}

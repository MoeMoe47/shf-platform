import { FINDING_SEVERITIES, RELEASE_IMPACTS } from "./accessibilityFindingSchema.js";

export const ACCESSIBILITY_ASSURANCE_POLICY = Object.freeze({
  policyVersion: "ax5.v1",
  owner: "AccessibilityAssurance",
  automatedPassIsVerified: false,
  waiverAuthority: "AUTHORIZED_HUMAN",
  releaseDecisions: ["PASS", "PASS_WITH_WARNINGS", "REVIEW_REQUIRED", "BLOCKED"],
  severities: FINDING_SEVERITIES,
  releaseImpacts: RELEASE_IMPACTS,
  blockingRules: ["keyboard-trap", "critical-action-inaccessible", "critical-focus-failure", "critical-text-scale-clipping", "critical-semantic-control", "critical-color-only-status", "critical-accommodation-control"],
  humanReviewRules: ["screen-reader-semantic-quality", "complex-table-interpretation", "complex-form-errors", "alternative-content-quality", "accommodation-usability", "zoom-usability"],
  criticalJourneys: ["Student", "Instructor", "Parent", "Career", "Onboarding Applicant", "Onboarding Reviewer", "CivicSure Provider", "CivicSure Operator", "Studio Builder", "Studio QA", "Studio Reviewer", "Hub/BOS", "Agent Fabric", "ARAG-1", "Accessibility Settings", "Accommodation Requestor", "Accommodation Reviewer", "Accommodation Approver", "Accommodation Fulfillment", "Foundation/Public", "Impact Public", "OAS", "Universe", "Learning Arcade shell", "DGAL"],
});

export function evaluateFindings(findings = []) {
  const blockingFindings = findings.filter((finding) => finding.releaseImpact === "BLOCK_RELEASE" && finding.status !== "WAIVED");
  const reviewFindings = findings.filter((finding) => finding.releaseImpact === "REQUIRES_REVIEW" && finding.status !== "WAIVED");
  const warnings = findings.filter((finding) => finding.releaseImpact === "WARNING" && finding.status !== "WAIVED");
  const result = blockingFindings.length ? "BLOCKED" : reviewFindings.length ? "REVIEW_REQUIRED" : warnings.length ? "PASS_WITH_WARNINGS" : "PASS";
  return { result, blockingFindings, reviewFindings, warnings, countsBySeverity: Object.fromEntries(ACCESSIBILITY_ASSURANCE_POLICY.severities.map((severity) => [severity, findings.filter((finding) => finding.severity === severity).length])) };
}

export function evaluateWaiver(finding, actor) {
  return finding?.releaseImpact === "BLOCK_RELEASE" && actor?.authorizedHuman === true && actor?.expiresAt ? "WAIVED" : "BLOCKED";
}

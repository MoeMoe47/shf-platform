import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { ACCESSIBILITY_ASSURANCE_POLICY, evaluateFindings, evaluateWaiver } from "../src/system/accessibility/accessibilityAssurancePolicy.js";

const scenario = process.argv.find((arg) => arg.startsWith("--scenario="))?.split("=")[1] || "clean";
const runId = `ax5_${randomUUID()}`;
const synthetic = {
  clean: [],
  warning: [{ findingId: "AX5-WARN-001", ruleId: "decorative-contrast", sourceTool: "synthetic", severity: "MINOR", releaseImpact: "WARNING", status: "OPEN" }],
  review: [{ findingId: "AX5-REVIEW-001", ruleId: "screen-reader-semantic-quality", sourceTool: "synthetic", severity: "MODERATE", releaseImpact: "REQUIRES_REVIEW", status: "OPEN", humanReviewRequired: true }],
  blocking: [{ findingId: "AX5-BLOCK-001", ruleId: "keyboard-trap", sourceTool: "synthetic", severity: "CRITICAL", releaseImpact: "BLOCK_RELEASE", status: "OPEN" }],
  waived: [{ findingId: "AX5-WAIVE-001", ruleId: "keyboard-trap", sourceTool: "synthetic", severity: "CRITICAL", releaseImpact: "BLOCK_RELEASE", status: evaluateWaiver({ releaseImpact: "BLOCK_RELEASE" }, { authorizedHuman: true, expiresAt: "2099-01-01" }) }],
  regression: [{ findingId: "AX5-REG-001", ruleId: "critical-action-inaccessible", sourceTool: "baseline", severity: "SERIOUS", releaseImpact: "BLOCK_RELEASE", status: "REGRESSION" }],
};
if (!synthetic[scenario]) throw new Error(`unknown_accessibility_assurance_scenario:${scenario}`);
if (scenario === "clean") {
  execFileSync("node", ["scripts/validate-accessibility-assurance.mjs"], { stdio: "inherit" });
  execFileSync("node", ["scripts/validate-accessibility-runtime.mjs"], { stdio: "inherit" });
  execFileSync("node", ["scripts/validate-accessibility-profile.mjs"], { stdio: "inherit" });
  execFileSync("node", ["scripts/validate-accessibility-content-engine.mjs"], { stdio: "inherit" });
  execFileSync("node", ["scripts/validate-accessibility-accommodations.mjs"], { stdio: "inherit" });
}
const evaluated = evaluateFindings(synthetic[scenario]);
const result = { runId, policyVersion: ACCESSIBILITY_ASSURANCE_POLICY.policyVersion, revision: process.env.GIT_COMMIT || "working-tree", result: evaluated.result, ...evaluated, tools: ["repository validators", "AX policy evaluator"], criticalJourneys: ACCESSIBILITY_ASSURANCE_POLICY.criticalJourneys, humanReview: ACCESSIBILITY_ASSURANCE_POLICY.humanReviewRules };
console.log(JSON.stringify(result, null, 2));
if (result.result === "BLOCKED") process.exitCode = 2;

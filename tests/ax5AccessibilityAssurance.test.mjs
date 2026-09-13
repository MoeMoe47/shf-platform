import test from "node:test";
import assert from "node:assert/strict";
import { ACCESSIBILITY_ASSURANCE_POLICY, evaluateFindings, evaluateWaiver } from "../src/system/accessibility/accessibilityAssurancePolicy.js";

const finding = (releaseImpact, status = "OPEN") => ({ findingId: "test", ruleId: "rule", sourceTool: "test", severity: "CRITICAL", releaseImpact, status });

test("clean assurance result passes", () => assert.equal(evaluateFindings([]).result, "PASS"));
test("minor warning is non-blocking", () => assert.equal(evaluateFindings([finding("WARNING")]).result, "PASS_WITH_WARNINGS"));
test("human review remains distinct", () => assert.equal(evaluateFindings([finding("REQUIRES_REVIEW")]).result, "REVIEW_REQUIRED"));
test("blocking finding blocks release", () => assert.equal(evaluateFindings([finding("BLOCK_RELEASE")]).result, "BLOCKED"));
test("waived blocking finding does not block", () => assert.equal(evaluateFindings([finding("BLOCK_RELEASE", "WAIVED")]).result, "PASS"));
test("waiver requires authorized human and expiry", () => { assert.equal(evaluateWaiver(finding("BLOCK_RELEASE"), { authorizedHuman: true, expiresAt: "2099-01-01" }), "WAIVED"); assert.equal(evaluateWaiver(finding("BLOCK_RELEASE"), { authorizedHuman: false }), "BLOCKED"); });
test("automated pass is not verified accessible", () => assert.equal(ACCESSIBILITY_ASSURANCE_POLICY.automatedPassIsVerified, false));
test("critical journey coverage and ARAG boundary are declared", () => { assert.ok(ACCESSIBILITY_ASSURANCE_POLICY.criticalJourneys.includes("Accessibility Settings")); assert.ok(ACCESSIBILITY_ASSURANCE_POLICY.criticalJourneys.includes("ARAG-1")); });

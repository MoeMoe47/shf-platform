import test from "node:test";
import assert from "node:assert/strict";
import { AssuranceOutcomeRiskIntegrationService } from "../src/domain/government-assurance/service/assurance-outcome-risk-integration-service.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";

const actor = { userId: "wave3ha-reviewer", organizationId: "wave3ha-org", tenantId: "tenant:wave3ha-org", permissions: [SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_MONITORING_MANAGE] };

test("verification outcomes block Truth and create scoped risk only for blocked outcomes", async () => {
  const calls: any[] = [];
  const risk = { evaluate: async (_a: any, input: any) => { calls.push(["evaluate", input]); return { evaluation: { evaluation_id: "eval-1" }, signal: { signal_id: "signal-1" } }; }, createExposure: async (_a: any, input: any) => { calls.push(["exposure", input]); return { exposure_id: "exposure-1" }; } } as any;
  const service = new AssuranceOutcomeRiskIntegrationService(risk);
  const passed = await service.verificationOutcome(actor, { claimId: "claim-pass", verificationId: "verification-pass", outcome: "PASSED", evidenceState: "COMPLETE" });
  assert.equal(passed.truthEligible, true);
  assert.equal(calls.length, 0);
  const failed = await service.verificationOutcome(actor, { claimId: "claim-fail", verificationId: "verification-fail", outcome: "FAILED", evidenceState: "COMPLETE", ruleId: "rule-1", financialReference: "obligation-1", amountAtRisk: 50000, currency: "USD" });
  assert.equal(failed.truthEligible, false);
  assert.equal(failed.risk.signal.signal_id, "signal-1");
  assert.equal(failed.exposure.exposure_id, "exposure-1");
  assert.equal(calls[1][1].exposureReference, "obligation-1");
});

test("open reconciliation blocks affected assurance and resolution permits resumption", async () => {
  const calls: any[] = [];
  const risk = { evaluate: async (_a: any, input: any) => { calls.push(["evaluate", input]); return { signal: { signal_id: "signal-recon" } }; }, createExposure: async (_a: any, input: any) => { calls.push(["exposure", input]); return input; } } as any;
  const service = new AssuranceOutcomeRiskIntegrationService(risk);
  const open = await service.reconciliationOutcome(actor, { reconciliationCaseId: "recon-1", claimId: "claim-1", status: "OPEN", ruleId: "rule-1", financialReference: "obligation-1", amountAtRisk: 50000, currency: "USD" });
  assert.equal(open.affectedResultBlocked, true);
  assert.equal(open.truthEligible, false);
  assert.equal(open.exposure.status, "UNDER_REVIEW");
  const resolved = await service.reconciliationOutcome(actor, { reconciliationCaseId: "recon-1", claimId: "claim-1", status: "RESOLVED", financialReference: "obligation-1", amountAtRisk: 50000, currency: "USD" });
  assert.equal(resolved.affectedResultBlocked, false);
  assert.equal(resolved.truthEligible, true);
  assert.equal(resolved.exposure.status, "RESOLVED");
  assert.equal(calls.filter((call) => call[0] === "exposure").length, 2);
});

test("outcome integration preserves tenant scope", async () => {
  const service = new AssuranceOutcomeRiskIntegrationService({} as any);
  await assert.rejects(() => service.verificationOutcome(actor, { organizationId: "other-org", claimId: "claim", verificationId: "verification", outcome: "FAILED", ruleId: "rule" }), /GOVERNMENT_ASSURANCE_SCOPE_MISMATCH/);
});

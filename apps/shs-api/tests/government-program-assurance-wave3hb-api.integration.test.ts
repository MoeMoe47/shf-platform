import assert from "node:assert/strict";
import test from "node:test";
import { query } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { RiskService } from "../src/domain/government-assurance/service/risk-service.js";

const enabled = process.env.WAVE3_LIVE === "1";
const baseUrl = `http://127.0.0.1:${process.env.WAVE3_API_PORT || "8092"}`;
const organizationId = "wave0d-org";
const tenantId = `tenant:${organizationId}`;
const actor = { userId: "wave0d-user", organizationId, tenantId, permissions: Object.values(SHS_SECURITY_PERMISSIONS), actor_type: "user" };

async function post(path: string, body: any, userId?: string) {
  const response = await fetch(`${baseUrl}${path}`, { method: "POST", headers: { "content-type": "application/json", ...(userId ? { authorization: `Bearer dev-token:${userId}` } : {}), "x-shs-organization-id": organizationId }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

test("Wave 3H-B downstream routes execute and enforce scope", { skip: !enabled }, async () => {
  const suffix = Date.now();
  const rule = (await query("SELECT rule_id,version FROM gpa_risk_rules WHERE organization_id=$1 AND tenant_id=$2 AND signal_type='VERIFICATION_FAILURE' AND threshold=0 ORDER BY created_at DESC LIMIT 1", [organizationId, tenantId])).rows[0];
  assert.ok(rule);
  const risk = new RiskService();
  const evaluated = await risk.evaluate(actor, { ruleId: rule.rule_id, ruleVersion: rule.version, value: 1, providerReference: `wave3hb-api-provider-${suffix}`, programReference: `wave3hb-api-program-${suffix}`, cycleReference: "wave3hb-api-cycle-1", affectedReferences: [`wave3hb-api-claim-${suffix}`], explanation: "API lifecycle acceptance signal.", provenance: { acceptance: "wave3hb-api" } });
  const signalId = evaluated.signal.signal_id;
  await risk.createExposure(actor, { exposureReference: `wave3hb-api-obligation-${suffix}`, amountAtRisk: 2500, currency: "USD", providerReference: `wave3hb-api-provider-${suffix}`, programReference: `wave3hb-api-program-${suffix}`, cycleReference: "wave3hb-api-cycle-1", signalReferences: [signalId], provenance: { acceptance: "wave3hb-api" }, rationale: "API lifecycle acceptance exposure." });
  const scope = { organizationId, tenantId, providerReference: `wave3hb-api-provider-${suffix}`, programReference: `wave3hb-api-program-${suffix}`, cycleReference: "wave3hb-api-cycle-1", signalId };

  assert.equal((await post(`/government-assurance/risk-signals/${signalId}/transition`, { ...scope, status: "UNDER_REVIEW", rationale: "Human review opened." })).status, 200);
  const findingResponse = await post(`/government-assurance/risk-signals/${signalId}/escalate-finding`, { ...scope, findingId: `wave3hb-api-finding-${suffix}`, findingType: "EVIDENCE_DEFICIENCY", description: "API reviewed finding.", evidenceReferences: [`wave3hb-api-evidence-${suffix}`], verificationReferences: [`wave3hb-api-verification-${suffix}`], severity: "HIGH", materiality: "MATERIAL", correctiveActionRequired: true, rationale: "Evidence-backed human escalation.", provenance: { acceptance: "wave3hb-api" } });
  assert.equal(findingResponse.status, 201);
  assert.equal(findingResponse.body.data.finding.finding_id, `wave3hb-api-finding-${suffix}`);
  const actionResponse = await post("/government-assurance/corrective-actions/from-risk", { ...scope, findingId: `wave3hb-api-finding-${suffix}`, correctiveActionId: `wave3hb-api-action-${suffix}`, actionOwner: "wave3hb-api-human", requiredAction: "Submit corrected evidence.", dueAt: new Date(Date.now() - 1000).toISOString(), requiredEvidence: [`wave3hb-api-remediation-${suffix}`], retestCriteria: { result: "PASS" }, escalationCondition: "OVERDUE", provenance: { acceptance: "wave3hb-api" } });
  assert.equal(actionResponse.status, 201);
  const overdue = await post("/government-assurance/risk-evaluations/overdue-action", { ...scope, correctiveActionId: `wave3hb-api-action-${suffix}`, ruleId: rule.rule_id, ruleVersion: rule.version, threshold: 0, provenance: { acceptance: "wave3hb-api" } });
  assert.equal(overdue.status, 201);
  assert.equal(overdue.body.data.overdue, true);
  const failed = await post("/government-assurance/corrective-actions/retest-risk", { ...scope, correctiveActionId: `wave3hb-api-action-${suffix}`, findingId: `wave3hb-api-finding-${suffix}`, result: "FAIL", evidenceReferences: [`wave3hb-api-failed-remediation-${suffix}`] });
  assert.equal(failed.status, 200);
  assert.equal(failed.body.data.status, "RETEST_PENDING");
  const passed = await post("/government-assurance/corrective-actions/retest-risk", { ...scope, correctiveActionId: `wave3hb-api-action-${suffix}`, findingId: `wave3hb-api-finding-${suffix}`, signalId, result: "PASS", evidenceReferences: [`wave3hb-api-remediation-${suffix}`] });
  assert.equal(passed.status, 200);
  assert.equal(passed.body.data.status, "COMPLETE");
  const closed = await post("/government-assurance/corrective-actions/close-risk", { ...scope, correctiveActionId: `wave3hb-api-action-${suffix}`, findingId: `wave3hb-api-finding-${suffix}`, exposureReference: `wave3hb-api-obligation-${suffix}`, amountAtRisk: 2500, currency: "USD", decisionReference: `wave3hb-api-decision-${suffix}`, authorityReference: "wave3hb-api-human-authority", evidenceReferences: [`wave3hb-api-remediation-${suffix}`], rationale: "Human approved remediation closure.", provenance: { acceptance: "wave3hb-api" } });
  assert.equal(closed.status, 200);
  assert.equal(closed.body.data.correctiveAction.status, "CLOSED");

  const wrongOrg = await post(`/government-assurance/risk-signals/${signalId}/transition`, { ...scope, organizationId: "other-org", tenantId: "tenant:other-org", status: "UNDER_REVIEW", rationale: "Should be denied." });
  assert.equal(wrongOrg.status, 403);
  const wrongTenant = await post(`/government-assurance/risk-signals/${signalId}/transition`, { ...scope, tenantId: "tenant:other-org", status: "UNDER_REVIEW", rationale: "Should be denied." });
  assert.equal(wrongTenant.status, 403);
  const missingPermission = await post(`/government-assurance/risk-signals/${signalId}/transition`, { ...scope, status: "UNDER_REVIEW", rationale: "Should be denied." }, "user_operator_001");
  assert.equal(missingPermission.status, 403);
});

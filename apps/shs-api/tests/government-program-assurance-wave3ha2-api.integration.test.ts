import assert from "node:assert/strict";
import test from "node:test";
import { query } from "../src/db/client.js";

const enabled = process.env.WAVE3_LIVE === "1";
const baseUrl = `http://127.0.0.1:${process.env.WAVE3_API_PORT || "8092"}`;
const organizationId = "wave0d-org";
const tenantId = `tenant:${organizationId}`;

async function request(path: string, body: any, options: { authorization?: string; organization?: string } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(options.authorization ? { authorization: options.authorization } : {}),
      ...(options.organization ? { "x-shs-organization-id": options.organization } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test("Wave 3H-A2 risk endpoints execute and enforce scope", { skip: !enabled }, async () => {
  const suffix = Date.now();
  const rule = (await query("SELECT rule_id, version FROM gpa_risk_rules WHERE organization_id=$1 AND tenant_id=$2 AND signal_type='VERIFICATION_FAILURE' AND threshold=0 ORDER BY created_at DESC LIMIT 1", [organizationId, tenantId])).rows[0];
  assert.ok(rule, "disposable Wave 3 risk rule is required");

  const body = {
    organizationId,
    tenantId,
    claimId: `wave3ha2-api-claim-${suffix}`,
    verificationId: `wave3ha2-api-verification-${suffix}`,
    outcome: "FAILED",
    evidenceState: "INCOMPLETE",
    ruleId: rule.rule_id,
    ruleVersion: rule.version,
    providerReference: `wave3ha2-api-provider-${suffix}`,
    programReference: `wave3ha2-api-program-${suffix}`,
    cycleReference: "wave3ha2-api-cycle-1",
    financialReference: `wave3ha2-api-obligation-${suffix}`,
    amountAtRisk: 1250,
    currency: "USD",
    provenance: { acceptance: "wave3ha2-api" },
  };

  const correct = await request("/government-assurance/verification-outcomes/risk", body, { organization: organizationId });
  assert.equal(correct.status, 201);
  assert.equal(correct.body.data.truthEligible, false);
  assert.ok(correct.body.data.risk.signal.signal_id);

  const wrongOrg = await request("/government-assurance/verification-outcomes/risk", { ...body, organizationId: "other-org", tenantId: "tenant:other-org" }, { organization: organizationId });
  assert.equal(wrongOrg.status, 403);

  const wrongTenant = await request("/government-assurance/reconciliation-outcomes/risk", { ...body, reconciliationCaseId: `wave3ha2-api-recon-${suffix}`, status: "OPEN", tenantId: "tenant:other-org" }, { organization: organizationId });
  assert.equal(wrongTenant.status, 403);

  const missingPermission = await request("/government-assurance/verification-outcomes/risk", body, { authorization: "Bearer dev-token:user_operator_001", organization: organizationId });
  assert.equal(missingPermission.status, 403);
});

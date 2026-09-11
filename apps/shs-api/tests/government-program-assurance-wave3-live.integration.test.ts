import assert from "node:assert/strict";
import test from "node:test";
import { query, pool } from "../src/db/client.js";
import { RiskService } from "../src/domain/government-assurance/service/risk-service.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";

const enabled = process.env.WAVE3_LIVE === "1";
const organizationId = "wave0d-org";
const tenantId = "tenant:wave0d-org";
const actor = { userId: "wave0d-user", organizationId, tenantId, permissions: Object.values(SHS_SECURITY_PERMISSIONS), actor_type: "user" };

test("Wave 3 deterministic warning and Money-at-Risk acceptance", { skip: !enabled }, async () => {
  const service = new RiskService();
  const exposureReference = `wave3b-award-b-${Date.now()}`;
  const jurisdictionReference = `wave3b-jurisdiction-${Date.now()}`;
  const providerReference = `wave3b-provider-b-${Date.now()}`;
  const programReference = `wave3b-program-workforce-${Date.now()}`;
  const ruleId = `wave3b-evidence-completeness-${Date.now()}`;
  const rule = await service.createRule(actor, { ruleId, version: 1, signalType: "EVIDENCE_COMPLETENESS", threshold: 0.9, severity: "HIGH", materiality: "MATERIAL", provenance: { acceptance: "wave3b" } });
  const sourceRule = await service.createRule(actor, { ruleId: `${ruleId}-source`, version: 1, signalType: "SOURCE_FRESHNESS", threshold: 86400, severity: "MEDIUM", materiality: "MODERATE", provenance: { acceptance: "wave3b" } });
  const warning = await service.evaluate(actor, { ruleId: rule.rule_id, ruleVersion: 1, operator: "<", value: 0.5, providerReference, programReference, cycleReference: "wave3b-cycle-2", affectedReferences: ["wave3b-claim-b"], confidence: 0.8, provenance: { acceptance: "wave3b" } });
  assert.equal(warning.evaluation.result, "TRIGGERED"); assert.equal(warning.signal.signal_type, "EVIDENCE_COMPLETENESS");
  const sourceWarning = await service.evaluate(actor, { ruleId: sourceRule.rule_id, ruleVersion: 1, operator: ">", value: 172800, providerReference, programReference, cycleReference: "wave3b-cycle-2", affectedReferences: ["wave3b-source-b"], confidence: 0.7, provenance: { acceptance: "wave3b" } });
  assert.equal(sourceWarning.signal.signal_type, "SOURCE_FRESHNESS"); assert.notEqual(sourceWarning.signal.signal_type, warning.signal.signal_type);
  const exposure = await service.createExposure(actor, { exposureReference, amountBasis: 50000, amountAtRisk: 50000, currency: "USD", jurisdictionReference, providerReference, programReference, cycleReference: "wave3b-cycle-2", signalReferences: [warning.signal.signal_id, warning.signal.signal_id], status: "POTENTIAL", rationale: "Verified delivery is incomplete for an identifiable obligation.", provenance: { acceptance: "wave3b" } });
  assert.equal(Number(exposure.amount_at_risk), 50000); assert.deepEqual(exposure.signal_references, [warning.signal.signal_id]);
  const replay = await service.createExposure(actor, { exposureReference, amountBasis: 50000, amountAtRisk: 50000, currency: "USD", providerReference, programReference, cycleReference: "wave3b-cycle-2", status: "POTENTIAL", rationale: "Retry", provenance: { acceptance: "wave3b" } });
  assert.equal(replay.exposure_id, exposure.exposure_id);
  const profile = await service.providerRisk(actor, providerReference); assert.equal(profile.authoritative, false); assert.equal(profile.moneyAtRisk.amount, 50000); assert.equal(profile.assuranceState, "ELEVATED"); assert.equal(profile.reviewRequired, true);
  assert.equal((await service.queue(actor)).some((x: any) => x.signal_id === warning.signal.signal_id), true);
  const historyReference = `wave3b-history-${Date.now()}`;
  const trendProvider = `${providerReference}-trend`;
  await service.createExposure(actor, { exposureReference: historyReference, amountBasis: 10000, amountAtRisk: 10000, currency: "USD", providerReference: trendProvider, programReference, cycleReference: "wave3b-cycle-1", status: "POTENTIAL", rationale: "Initial bounded exposure.", provenance: { acceptance: "wave3b" } });
  await service.createExposure(actor, { exposureReference: historyReference, amountBasis: 10000, amountAtRisk: 10000, currency: "USD", providerReference: trendProvider, programReference, cycleReference: "wave3b-cycle-2", status: "REMEDIATING", rationale: "Corrective action underway.", provenance: { acceptance: "wave3b" } });
  await service.createExposure(actor, { exposureReference: historyReference, amountBasis: 10000, amountAtRisk: 0, currency: "USD", providerReference: trendProvider, programReference, cycleReference: "wave3b-cycle-2", status: "RESOLVED", rationale: "Remediation verified by authorized review.", provenance: { acceptance: "wave3b" } });
  const history = await service.exposureHistory(actor, historyReference); assert.deepEqual(history.map((x: any) => x.status), ["POTENTIAL", "REMEDIATING", "RESOLVED"]);
  const jurisdiction = await service.jurisdictionRisk(actor, jurisdictionReference); assert.equal(jurisdiction.moneyAtRisk.amount, 50000);
  const trend = await service.trend(actor, "PROVIDER", trendProvider); assert.equal(trend.trend, "IMPROVING");
  const healthy = await service.providerRisk(actor, `wave3b-healthy-${Date.now()}`); assert.equal(healthy.moneyAtRisk.amount, 0); assert.equal(healthy.signals.length, 0); assert.equal(healthy.assuranceState, "LOW"); assert.equal(healthy.escalationRecommended, false);
  const riskPacket = await service.riskPacket(actor, "PROVIDER", providerReference); assert.equal(riskPacket.authoritative, false); assert.ok(riskPacket.riskSignals.length > 0);
  const count = await query("SELECT COUNT(*)::int AS count FROM gpa_money_at_risk WHERE exposure_reference=$1 AND organization_id=$2 AND tenant_id=$3", [exposureReference, organizationId, tenantId]); assert.equal(count.rows[0].count, 1);
});

test.after(async () => { await pool.end(); });

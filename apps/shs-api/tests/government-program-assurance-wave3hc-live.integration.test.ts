import assert from "node:assert/strict";
import test from "node:test";
import { query, pool } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { RiskService } from "../src/domain/government-assurance/service/risk-service.js";
import { MonitoringAuditService } from "../src/domain/government-assurance/service/monitoring-audit-service.js";
import { ReconciliationQualityService } from "../src/domain/government-assurance/service/reconciliation-quality-service.js";

const enabled = process.env.WAVE3HC_LIVE === "1";
const permissions = Object.values(SHS_SECURITY_PERMISSIONS);
const actor = { userId: "wave0d-user", organizationId: "wave0d-org", tenantId: "tenant:wave0d-org", permissions, actor_type: "user" };
const other = { ...actor, userId: "wave3hc-other", organizationId: "wave3hc-isolated-org", tenantId: "tenant:wave3hc-isolated-org" };

test("Wave 3H-C live projections are deterministic, scoped, comparable, and traceable", { skip: !enabled }, async () => {
  const suffix = Date.now();
  const jurisdiction = `wave3hc-jurisdiction-${suffix}`;
  const provider = `wave3hc-provider-${suffix}`;
  const program = `wave3hc-program-${suffix}`;
  const cycle1 = `wave3hc-cycle-1-${suffix}`;
  const cycle2 = `wave3hc-cycle-2-${suffix}`;
  const risk = new RiskService();
  const ruleSpecs = [
    ["CRITICAL", "HIGHLY_MATERIAL", 5000], ["HIGH", "MATERIAL", 4000], ["MEDIUM", "MATERIAL", 3000],
    ["MEDIUM", "MODERATE", 2000], ["LOW", "IMMATERIAL", 1000],
  ] as const;
  const exposures: any[] = [];
  const signals: any[] = [];
  for (const [index, [severity, materiality, amount]] of ruleSpecs.entries()) {
    const rule = await risk.createRule(actor, { ruleId: `wave3hc-rule-${suffix}-${index}`, signalType: `WAVE3HC_SIGNAL_${index}`, threshold: 0, severity, materiality, provenance: { acceptance: "wave3hc" } });
    const result = await risk.evaluate(actor, { ruleId: rule.rule_id, ruleVersion: 1, value: 1, providerReference: provider, programReference: program, cycleReference: cycle2, affectedReferences: [`wave3hc-claim-${suffix}-${index}`], explanation: `Wave 3H-C queue fixture ${index}`, provenance: { acceptance: "wave3hc" } });
    assert.ok(result.signal);
    signals.push(result.signal);
    if (index < 4) exposures.push(await risk.createExposure(actor, { exposureReference: `wave3hc-exposure-${suffix}-${index}`, amountBasis: amount, amountAtRisk: amount, currency: "USD", jurisdictionReference: jurisdiction, providerReference: provider, programReference: program, cycleReference: cycle2, signalReferences: [result.signal.signal_id], status: "POTENTIAL", rationale: "Bounded H-C financial basis", provenance: { acceptance: "wave3hc" } }));
  }
  await query("UPDATE gpa_risk_signals SET detected_at = NOW() - ($1::int * INTERVAL '1 day') WHERE signal_id = $2", [10, signals[0].signal_id]);
  await query("UPDATE gpa_risk_signals SET detected_at = NOW() - ($1::int * INTERVAL '1 day') WHERE signal_id = $2", [8, signals[1].signal_id]);
  const queue = await risk.queue(actor);
  const queueItems = queue.filter((row: any) => String(row.signal_id).startsWith("gpa_risk_signal_") && row.provider_reference === provider);
  assert.deepEqual(queueItems.slice(0, 5).map((row: any) => row.signal_id), [signals[0], signals[1], signals[2], signals[3], signals[4]].map((row) => row.signal_id));

  const trendProvider = `${provider}-trend`;
  const trendReference = `wave3hc-trend-${suffix}`;
  const trendMeta = { trendCompatibility: { ruleKey: "wave3hc-rule", currency: "USD", basis: "OBLIGATION", scope: "provider-program" } };
  await risk.createExposure(actor, { exposureReference: trendReference, amountBasis: 10000, amountAtRisk: 10000, currency: "USD", providerReference: trendProvider, programReference: program, cycleReference: cycle1, status: "POTENTIAL", rationale: "Prior comparable exposure", provenance: trendMeta });
  await risk.createExposure(actor, { exposureReference: trendReference, amountBasis: 10000, amountAtRisk: 5000, currency: "USD", providerReference: trendProvider, programReference: program, cycleReference: cycle2, status: "REMEDIATING", rationale: "Current comparable exposure", provenance: trendMeta });
  const improving = await risk.trend(actor, "PROVIDER", trendProvider);
  assert.equal(improving.trend, "IMPROVING");
  assert.equal(improving.comparable, true);
  const incompatibleProvider = `${provider}-incompatible`;
  const incompatibleReference = `wave3hc-incompatible-${suffix}`;
  await risk.createExposure(actor, { exposureReference: incompatibleReference, amountBasis: 1000, amountAtRisk: 1000, currency: "USD", providerReference: incompatibleProvider, programReference: program, cycleReference: cycle1, status: "POTENTIAL", rationale: "Prior incompatible exposure", provenance: { trendCompatibility: { ruleKey: "wave3hc-rule-v1", currency: "USD", basis: "OBLIGATION", scope: "provider-program" } } });
  await risk.createExposure(actor, { exposureReference: incompatibleReference, amountBasis: 1000, amountAtRisk: 500, currency: "USD", providerReference: incompatibleProvider, programReference: program, cycleReference: cycle2, status: "POTENTIAL", rationale: "Current incompatible exposure", provenance: { trendCompatibility: { ruleKey: "wave3hc-rule-v2", currency: "USD", basis: "OBLIGATION", scope: "provider-program" } } });
  const notComparable = await risk.trend(actor, "PROVIDER", incompatibleProvider);
  assert.equal(notComparable.trend, "NOT_COMPARABLE");
  const insufficient = await risk.trend(actor, "PROVIDER", `${provider}-no-history`);
  assert.equal(insufficient.trend, "INSUFFICIENT_DATA");

  const finding = await new MonitoringAuditService().createFinding(actor, { findingId: `wave3hc-finding-${suffix}`, providerReference: provider, programReference: program, findingType: "DELIVERY_VARIANCE", severity: "HIGH", materiality: "MATERIAL", description: "Scoped H-C finding", evidenceReferences: [`wave3hc-evidence-${suffix}`], verificationReferences: [`wave3hc-verification-${suffix}`], correctiveActionRequired: true, provenance: { cycleReference: cycle2, acceptance: "wave3hc" } });
  const action = await new MonitoringAuditService().createAction(actor, { correctiveActionId: `wave3hc-action-${suffix}`, findingId: finding.finding_id, providerReference: provider, programReference: program, requiredAction: "Provide remediation evidence", actionOwner: provider, dueAt: new Date(Date.now() + 86400000), requiredEvidence: [`wave3hc-remediation-${suffix}`], accountableOwner: "wave0d-user", retestCriteria: { required: true }, escalationCondition: "DUE_DATE_PASSED", provenance: { cycleReference: cycle2, acceptance: "wave3hc" } });
  const reconciliation = await new ReconciliationQualityService().createCase(actor, { reconciliationCaseId: `wave3hc-reconciliation-${suffix}`, subjectType: "CLAIM", subjectReference: `wave3hc-claim-${suffix}`, competingClaimReferences: [`wave3hc-claim-${suffix}`], conflictReason: "Two source observations differ", conflictType: "VALUE_MISMATCH", materiality: "MATERIAL", severity: "HIGH", provenance: { cycleReference: cycle2, providerReference: provider, programReference: program, acceptance: "wave3hc" } });
  await risk.createExposure(actor, { exposureReference: exposures[0].exposure_reference, amountBasis: Number(exposures[0].amount_basis), amountAtRisk: Number(exposures[0].amount_at_risk), currency: exposures[0].currency, jurisdictionReference: jurisdiction, providerReference: provider, programReference: program, cycleReference: cycle2, reconciliationReferences: [reconciliation.reconciliation_case_id], signalReferences: [signals[0].signal_id], status: "POTENTIAL", rationale: "Reconciliation-linked scoped exposure", provenance: { acceptance: "wave3hc" } });
  const jurisdictionRisk = await risk.jurisdictionRisk(actor, jurisdiction);
  assert.equal(jurisdictionRisk.moneyAtRisk.amount, 14000);
  assert.equal(jurisdictionRisk.findingCount, 1);
  assert.equal(jurisdictionRisk.correctiveActionCount, 1);
  assert.equal(jurisdictionRisk.unresolvedReconciliationCount, 1);
  assert.equal(jurisdictionRisk.authoritative, false);

  const packets = await Promise.all([
    new MonitoringAuditService().assurancePacket(actor, { scopeType: "PROVIDER", scopeReference: provider }),
    new MonitoringAuditService().assurancePacket(actor, { scopeType: "PROGRAM", scopeReference: program }),
    new MonitoringAuditService().assurancePacket(actor, { scopeType: "CYCLE", scopeReference: cycle2 }),
  ]);
  for (const packet of packets) {
    assert.equal(packet.authoritative, false);
    assert.ok(packet.records.gpa_risk_signals.length >= 1);
    assert.ok(packet.records.gpa_money_at_risk.length >= 1);
    assert.ok(packet.records.gpa_risk_evaluations.length >= 1);
  }
  assert.equal((await risk.providerRisk(other, provider)).signals.length, 0);
  assert.equal((await risk.riskPacket(other, "PROGRAM", program)).riskSignals.length, 0);
  assert.ok(action.corrective_action_id);
  assert.ok(reconciliation.reconciliation_case_id);
  assert.equal(new Set(exposures.map((row) => row.exposure_id)).size, exposures.length);
  console.log(JSON.stringify({ acceptance: "wave3hc", jurisdiction, provider, program, cycles: [cycle1, cycle2], signalIds: signals.map((row) => row.signal_id), exposureIds: exposures.map((row) => row.exposure_id), findingId: finding.finding_id, correctiveActionId: action.corrective_action_id, reconciliationCaseId: reconciliation.reconciliation_case_id, queueOrder: queueItems.slice(0, 5).map((row: any) => row.signal_id), trends: { improving: improving.trend, incompatible: notComparable.trend, insufficient: insufficient.trend } }));
});

test.after(async () => { await pool.end(); });

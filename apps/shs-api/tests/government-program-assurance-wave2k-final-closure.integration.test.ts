import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { query, pool } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { MonitoringAuditService } from "../src/domain/government-assurance/service/monitoring-audit-service.js";
import { AssuranceCycleService } from "../src/domain/government-assurance/service/assurance-cycle-service.js";

const enabled = process.env.WAVE2K_LIVE === "1";
const organizationId = "wave0d-org";
const tenantId = "tenant:wave0d-org";
const actor = { userId: "wave0d-user", organizationId, tenantId, permissions: Object.values(SHS_SECURITY_PERMISSIONS), actor_type: "user" };
const historicalCycleId = "wave2d-cycle-1-1788915904963";
const q1 = { start: "2026-01-01", end: "2026-03-31" };

function stable(value: any): any {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stable).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}

function digest(value: any): string {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

async function rows(table: string, where: string, params: any[] = []) {
  return (await query(`SELECT * FROM ${table} WHERE organization_id=$1 AND tenant_id=$2 AND ${where}`, [organizationId, tenantId, ...params])).rows;
}

async function q1GlobalState(families: Record<string, any[]>) {
  const cycle = (await query("SELECT * FROM gpa_assurance_cycles WHERE cycle_id=$1 AND organization_id=$2 AND tenant_id=$3", [historicalCycleId, organizationId, tenantId])).rows;
  const scope = (await rows("gpa_assurance_cycle_scope", "cycle_id=$3", [historicalCycleId])).sort((a, b) => String(a.scope_id).localeCompare(String(b.scope_id)));
  const snapshots = (await rows("gpa_assurance_cycle_snapshots", "cycle_id=$3", [historicalCycleId])).sort((a, b) => String(a.snapshot_id).localeCompare(String(b.snapshot_id)));
  return { cycle, scope, snapshots, ...families };
}

async function packet(type: "PROVIDER" | "PROGRAM" | "CYCLE", reference: string) {
  return new MonitoringAuditService().assurancePacket(actor, { scopeType: type, scopeReference: reference });
}

const primaryKey: Record<string, string> = {
  gpa_claims: "claim_id", gpa_claim_evidence_links: "claim_evidence_link_id", gpa_evidence_admissibility: "claim_evidence_link_id",
  gpa_verification_records: "verification_id", gpa_truth_facts: "truth_fact_id", gpa_truth_determinations: "determination_id",
  truth_spine_records: "record_id", gpa_metric_results: "metric_result_id", gpa_assurance_cycles: "cycle_id",
  gpa_assurance_cycle_scope: "scope_id", gpa_assurance_cycle_snapshots: "snapshot_id", gpa_findings: "finding_id",
  gpa_corrective_actions: "corrective_action_id", gpa_decisions: "decision_id", gpa_monitoring_plans: "monitoring_plan_id",
  gpa_monitoring_activities: "activity_id", gpa_funding_references: "funding_reference_id", gpa_funding_lineage_edges: "lineage_edge_id",
};

async function assertPacketTrace(type: "PROVIDER" | "PROGRAM" | "CYCLE", reference: string) {
  const result: any = await packet(type, reference);
  assert.equal(result.authoritative, false);
  assert.equal(result.source, "derived_gpa_audit_projection");
  const records = result.records || {};
  let applicable = 0;
  for (const [table, key] of Object.entries(primaryKey)) {
    for (const row of records[table] || []) {
      applicable += 1;
      const id = row[key];
      const canonical = (await query(`SELECT ${key} FROM ${table} WHERE ${key}=$1 AND organization_id=$2 AND tenant_id=$3`, [id, organizationId, tenantId])).rows[0];
      assert.equal(canonical?.[key], id, `${type} packet dangling ${table}:${id}`);
    }
  }
  const truthIds = (records.gpa_truth_determinations || []).map((row: any) => row.provenance?.truthSpineRecordId).filter(Boolean);
  for (const id of truthIds) {
    const truth = (await query("SELECT record_id FROM truth_spine_records WHERE record_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, organizationId, tenantId])).rows[0];
    assert.equal(truth?.record_id, id);
  }
  assert.ok(applicable > 0);
  return { packet: result, applicable, truthIds, counts: Object.fromEntries(Object.entries(records).map(([name, value]) => [name, (value as any[]).length])) };
}

test("Wave 2K resolves GPA Truth lineage, all assurance packet references, and Q1 authoritative row immutability", { skip: !enabled }, async () => {
  const cycleLookup = await query("SELECT cycle_id FROM gpa_assurance_cycles WHERE organization_id=$1 AND tenant_id=$2 AND period_start='2026-01-01' ORDER BY created_at DESC LIMIT 1", [organizationId, tenantId]);
  const liveCycleId = cycleLookup.rows[0]?.cycle_id || historicalCycleId;
  const before = {
    metrics: await rows("gpa_metric_results", "reporting_period_start=$3 AND reporting_period_end=$4", [q1.start, q1.end]),
    findings: await rows("gpa_findings", "program_reference=$3 AND provider_reference IN ('wave2d-provider-a','wave2d-provider-b')", ["wave2d-program-workforce"]),
    actions: await rows("gpa_corrective_actions", "program_reference=$3 AND provider_reference IN ('wave2d-provider-a','wave2d-provider-b')", ["wave2d-program-workforce"]),
    decisions: await rows("gpa_decisions", "subject_reference IN (SELECT finding_id FROM gpa_findings WHERE program_reference=$3 UNION SELECT corrective_action_id FROM gpa_corrective_actions WHERE program_reference=$3)", ["wave2d-program-workforce"]),
  };
  const beforeDigests = Object.fromEntries(Object.entries(before).map(([key, value]) => [key, digest(value)]));
  const globalBefore = digest(await q1GlobalState(before));
  const providerTrace = await assertPacketTrace("PROVIDER", "wave2d-provider-a");
  const programTrace = await assertPacketTrace("PROGRAM", "wave2d-program-workforce");
  const cycleTrace = await assertPacketTrace("CYCLE", liveCycleId);
  assert.ok(providerTrace.truthIds.length > 0);
  assert.ok(programTrace.truthIds.length > 0);
  assert.ok(cycleTrace.truthIds.length > 0);

  await new AssuranceCycleService().history(actor, "PROVIDER", "wave2d-provider-a");
  await new AssuranceCycleService().history(actor, "PROGRAM", "wave2d-program-workforce");
  const q2Lookup = await query("SELECT cycle_id FROM gpa_assurance_cycles WHERE organization_id=$1 AND tenant_id=$2 AND period_start='2026-04-01' ORDER BY created_at DESC LIMIT 1", [organizationId, tenantId]);
  await packet("CYCLE", q2Lookup.rows[0]?.cycle_id || liveCycleId);

  const after = {
    metrics: await rows("gpa_metric_results", "reporting_period_start=$3 AND reporting_period_end=$4", [q1.start, q1.end]),
    findings: await rows("gpa_findings", "program_reference=$3 AND provider_reference IN ('wave2d-provider-a','wave2d-provider-b')", ["wave2d-program-workforce"]),
    actions: await rows("gpa_corrective_actions", "program_reference=$3 AND provider_reference IN ('wave2d-provider-a','wave2d-provider-b')", ["wave2d-program-workforce"]),
    decisions: await rows("gpa_decisions", "subject_reference IN (SELECT finding_id FROM gpa_findings WHERE program_reference=$3 UNION SELECT corrective_action_id FROM gpa_corrective_actions WHERE program_reference=$3)", ["wave2d-program-workforce"]),
  };
  for (const family of Object.keys(before)) assert.deepEqual(stable(after[family as keyof typeof after]), stable(before[family as keyof typeof before]));
  const afterDigests = Object.fromEntries(Object.entries(after).map(([key, value]) => [key, digest(value)]));
  assert.deepEqual(afterDigests, beforeDigests);
  const globalAfter = digest(await q1GlobalState(after));
  assert.equal(globalAfter, globalBefore);
  const truth = await query("SELECT d.determination_id, d.claim_reference, d.verification_reference, d.provenance->>'truthSpineRecordId' AS truth_spine_record_id, t.record_id FROM gpa_truth_determinations d JOIN truth_spine_records t ON t.record_id=d.provenance->>'truthSpineRecordId' WHERE d.organization_id=$1 AND d.tenant_id=$2 AND d.provenance ? 'truthSpineRecordId' ORDER BY d.created_at DESC LIMIT 1", [organizationId, tenantId]);
  assert.equal(truth.rows.length, 1);
  assert.ok(truth.rows[0].claim_reference && truth.rows[0].verification_reference);
  const q1Families = Object.fromEntries(Object.entries(before).map(([family, value]) => {
    const table = family === "metrics" ? "gpa_metric_results" : family === "findings" ? "gpa_findings" : family === "actions" ? "gpa_corrective_actions" : "gpa_decisions";
    return [family, { rowCount: (value as any[]).length, beforeDigest: beforeDigests[family], afterDigest: afterDigests[family], rowDigests: (value as any[]).map((row) => ({ id: row[primaryKey[table]], digest: digest(row) })) }];
  }));
  console.log(JSON.stringify({
    liveCycleId,
    packets: {
      provider: providerTrace.counts,
      program: programTrace.counts,
      cycle: cycleTrace.counts,
    },
    truthLineage: truth.rows[0],
    q1GlobalDigest: { before: globalBefore, after: globalAfter, equal: globalBefore === globalAfter },
    q1Families,
  }, null, 2));
});

test.after(async () => { await pool.end(); });

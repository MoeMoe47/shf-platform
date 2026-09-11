import { test } from "node:test";
import assert from "node:assert/strict";
import { SourceScopeService } from "../src/domain/government-assurance/service/source-scope-service.ts";
import { MonitoringAuditService } from "../src/domain/government-assurance/service/monitoring-audit-service.ts";

const actor = {
  userId: "wave2g-user",
  organizationId: "wave2g-org",
  tenantId: "tenant:wave2g-org",
  permissions: [
    "government.assurance.source_scope.manage",
    "government.assurance.audit.view",
  ],
};

test("source health observation validates scope, active source, and records provenance through audit", async () => {
  const calls: any[] = [];
  const repo: any = {
    getSourceSystem: async () => ({ source_system_id: "wave2g-source", status: "ACTIVE" }),
    getSourceHealth: async () => null,
    recordSourceHealthObservation: async (input: any) => ({ ...input, current_freshness_state: input.current_freshness_state, degraded_state: input.degraded_state }),
  };
  const service = new SourceScopeService(repo, async (input: any) => { calls.push(input); return input; });
  const result = await service.recordSourceHealthObservation(actor, {
    sourceSystemId: "wave2g-source",
    organizationId: actor.organizationId,
    tenantId: actor.tenantId,
    currentFreshnessState: "STALE",
    degradedState: "DEGRADED",
    observedAt: "2026-09-08T12:00:00.000Z",
    provenance: { sourceRecordId: "wave2g-health-observation" },
  });
  assert.equal(result.currentFreshnessState, "STALE");
  assert.equal(result.degradedState, "DEGRADED");
  assert.equal(calls[0].target_object_type, "GPA_SOURCE_HEALTH");
  assert.equal(calls[0].new_state_json.observation.provenance.sourceRecordId, "wave2g-health-observation");
});

test("assurance packets are scoped, derived, and non-authoritative", async () => {
  const repo: any = {
    list: async (_table: string, _scope: any) => [{ provider_reference: "wave2g-provider", program_reference: "wave2g-program", cycle_id: "wave2g-cycle" }],
  };
  const service = new MonitoringAuditService(repo);
  const packet = await service.assurancePacket(actor, { scopeType: "PROVIDER", scopeReference: "wave2g-provider" });
  assert.equal(packet.authoritative, false);
  assert.equal(packet.source, "derived_gpa_audit_projection");
  assert.deepEqual(packet.scope, { type: "PROVIDER", reference: "wave2g-provider", organizationId: actor.organizationId, tenantId: actor.tenantId });
  assert.ok(Object.values(packet.records).every((rows: any) => rows.length === 1));
});

test("assurance packet rejects missing or unsupported scope", async () => {
  const service = new MonitoringAuditService({ list: async () => [] } as any);
  await assert.rejects(() => service.assurancePacket(actor, { scopeType: "TRUTH", scopeReference: "wave2g-truth" }), /GPA_ASSURANCE_PACKET_SCOPE_REQUIRED/);
});

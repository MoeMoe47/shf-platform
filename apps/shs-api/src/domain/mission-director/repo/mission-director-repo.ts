import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import type { MissionDirectorAction, MissionDirectorDecisionStatus, MissionDirectorExecutorKind } from "../model/mission-director.js";
import type { MissionRuntimeSession } from "../../mission-runtime/model/mission-runtime.js";

export interface MissionDirectorDecisionRecord {
  decisionId: string;
  status: MissionDirectorDecisionStatus;
  action: MissionDirectorAction | null;
  rejectionReason: string | null;
  contextDigest: string;
  runtimeSessionId: string;
  expectedRevision: number;
  observedRevision: number;
  createdAt: string;
}

function fromRow(row: any): MissionDirectorDecisionRecord {
  return {
    decisionId: row.director_decision_id,
    status: row.decision_status as MissionDirectorDecisionStatus,
    action: row.proposal?.type === "INVALID_PROPOSAL" ? null : row.proposal as MissionDirectorAction,
    rejectionReason: row.rejection_reason as string | null,
    contextDigest: row.context_digest as string,
    runtimeSessionId: row.mission_runtime_session_id as string,
    expectedRevision: Number(row.expected_runtime_revision),
    observedRevision: Number(row.observed_runtime_revision),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export class MissionDirectorRepo {
  // Idempotency keys are scoped to organization/tenant, not to one runtime, so a key
  // reused against a different runtime is detected rather than silently reinterpreted.
  async findByIdempotency(scope: { organizationId: string; tenantId: string; idempotencyKey: string }) {
    const result = await query(
      `SELECT * FROM mission_director_decisions
       WHERE organization_id=$1 AND tenant_id=$2 AND idempotency_key=$3`,
      [scope.organizationId, scope.tenantId, scope.idempotencyKey],
    );
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  // Standalone records are only for decisions that did not mutate runtime state
  // (NO_OP, REJECTED, FAILED). APPLIED provenance is written inside the Mission Runtime transaction.
  async recordUnapplied(input: {
    runtime: MissionRuntimeSession;
    expectedRevision: number;
    idempotencyKey: string;
    capability: "missionDirector";
    action: MissionDirectorAction | null;
    status: Exclude<MissionDirectorDecisionStatus, "APPLIED">;
    rejectionReason: string | null;
    executorKind: MissionDirectorExecutorKind;
    providerExecutionRef: string | null;
    policyVersion: string;
    contextDigest: string;
  }) {
    const proposal = input.action && Buffer.byteLength(JSON.stringify(input.action), "utf8") <= 8192
      ? input.action : { type: "INVALID_PROPOSAL" };
    const inserted = await query(
      `INSERT INTO mission_director_decisions
       (director_decision_id, organization_id, tenant_id, mission_runtime_session_id, mission_id,
        mission_version, expected_runtime_revision, observed_runtime_revision, capability, idempotency_key,
        proposal, decision_status, rejection_reason, executor_kind, provider_execution_ref, policy_version, context_digest)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (organization_id, tenant_id, idempotency_key) DO NOTHING
       RETURNING *`,
      [randomUUID(), input.runtime.organizationId, input.runtime.tenantId, input.runtime.id, input.runtime.missionId,
        input.runtime.missionVersion, input.expectedRevision, input.runtime.revision, input.capability, input.idempotencyKey,
        JSON.stringify(proposal), input.status, input.rejectionReason, input.executorKind, input.providerExecutionRef,
        input.policyVersion, input.contextDigest],
    );
    if (inserted.rows[0]) return fromRow(inserted.rows[0]);
    const existing = await this.findByIdempotency({ organizationId: input.runtime.organizationId, tenantId: input.runtime.tenantId,
      idempotencyKey: input.idempotencyKey });
    if (!existing) throw new Error("MISSION_DIRECTOR_DECISION_PERSISTENCE_FAILED");
    return existing;
  }
}

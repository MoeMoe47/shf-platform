import { query } from "../../../db/client.js";

export type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };
const json = (value: unknown) => JSON.stringify(value ?? []);

export class ClaimVerificationRepo {
  constructor(private dbQuery: typeof query = query) {}
  private executor(executor?: Executor): Executor { return executor || { query: this.dbQuery }; }

  async getClaim(claimId: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_claims WHERE claim_id=$1 AND organization_id=$2 AND tenant_id=$3", [claimId, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }
  async createClaim(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_claims
      (claim_id, organization_id, tenant_id, claimant_reference, program_reference, claim_type, subject_type, subject_reference, metric_reference, reporting_period_start, reporting_period_end, asserted_value, asserted_population, asserted_unit, status, supersedes_claim_id, version, created_by, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`, [input.claim_id, input.organization_id, input.tenant_id, input.claimant_reference, input.program_reference || null, input.claim_type, input.subject_type, input.subject_reference, input.metric_reference || null, input.reporting_period_start || null, input.reporting_period_end || null, JSON.stringify(input.asserted_value), JSON.stringify(input.asserted_population || {}), input.asserted_unit, input.status || "DRAFT", input.supersedes_claim_id || null, input.version || 1, input.created_by, JSON.stringify(input.metadata || {})]);
    return result.rows[0];
  }
  async updateClaimLifecycle(claimId: string, scope: any, status: string, submittedAt: any, withdrawnAt: any, executor?: Executor) {
    const result = await this.executor(executor).query("UPDATE gpa_claims SET status=$4, submitted_at=COALESCE($5, submitted_at), withdrawn_at=COALESCE($6, withdrawn_at), updated_at=NOW() WHERE claim_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *", [claimId, scope.organizationId, scope.tenantId, status, submittedAt || null, withdrawnAt || null]);
    return result.rows[0] || null;
  }
  async listClaimEvidence(claimId: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query(`SELECT l.*, a.decision AS admissibility_decision, a.reason_codes AS admissibility_reason_codes,
      a.source_authority_reference, a.data_use_policy_reference, a.evaluated_at AS admissibility_evaluated_at,
      COALESCE((SELECT jsonb_agg(c ORDER BY c.occurred_at) FROM gpa_evidence_custody_events c WHERE c.evidence_id=l.evidence_id AND c.organization_id=l.organization_id AND c.tenant_id=l.tenant_id), '[]'::jsonb) AS custody_events
      FROM gpa_claim_evidence_links l LEFT JOIN LATERAL (SELECT * FROM gpa_evidence_admissibility x WHERE x.claim_evidence_link_id=l.claim_evidence_link_id AND x.organization_id=l.organization_id AND x.tenant_id=l.tenant_id ORDER BY x.evaluated_at DESC LIMIT 1) a ON TRUE
      WHERE l.claim_id=$1 AND l.organization_id=$2 AND l.tenant_id=$3 ORDER BY l.added_at`, [claimId, scope.organizationId, scope.tenantId]);
    return result.rows;
  }
  async createEvidenceLink(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_claim_evidence_links
      (claim_evidence_link_id, claim_id, organization_id, tenant_id, evidence_id, evidence_authority, relationship_type, evidence_role, requirement_reference, status, submitted_by, provenance_json)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ACTIVE',$10,$11) RETURNING *`, [input.claim_evidence_link_id, input.claim_id, input.organization_id, input.tenant_id, input.evidence_id, input.evidence_authority, input.relationship_type, input.evidence_role, input.requirement_reference || null, input.submitted_by, json(input.provenance_json)]);
    return result.rows[0];
  }
  async createAdmissibility(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_evidence_admissibility
      (admissibility_id, claim_evidence_link_id, organization_id, tenant_id, decision, reason_codes, source_authority_reference, data_use_policy_reference, evaluated_by, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [input.admissibility_id, input.claim_evidence_link_id, input.organization_id, input.tenant_id, input.decision, json(input.reason_codes), input.source_authority_reference || null, input.data_use_policy_reference || null, input.evaluated_by, json(input.metadata)]);
    return result.rows[0];
  }
  async createCustodyEvent(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_evidence_custody_events
      (custody_event_id, evidence_id, organization_id, tenant_id, event_type, actor_reference, source_reference, occurred_at, content_hash, classification, retention_reference, legal_hold_reference, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`, [input.custody_event_id, input.evidence_id, input.organization_id, input.tenant_id, input.event_type, input.actor_reference, input.source_reference || null, input.occurred_at, input.content_hash || null, input.classification || null, input.retention_reference || null, input.legal_hold_reference || null, json(input.metadata)]);
    return result.rows[0];
  }
  async getMethod(methodId: string, version: number, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_verification_methods WHERE method_id=$1 AND version=$2 AND organization_id=$3 AND tenant_id=$4", [methodId, version, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }
  async createVerification(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_verification_records
      (verification_id, organization_id, tenant_id, claim_id, subject_type, subject_reference, method_id, method_version, verifier_reference, status, result, evidence_references, policy_version_reference, created_by, requested_level, verification_mode, source_authority_references, provenance)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PENDING','{}'::JSONB,$10,$11,$12,$13,$14,$15,$16) RETURNING *`, [input.verification_id, input.organization_id, input.tenant_id, input.claim_id, input.subject_type, input.subject_reference, input.method_id, input.method_version, input.verifier_reference, json(input.evidence_references), input.policy_version_reference || null, input.created_by, input.requested_level, input.verification_mode, json(input.source_authority_references), json(input.provenance)]);
    return result.rows[0];
  }
  async getVerification(verificationId: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_verification_records WHERE verification_id=$1 AND organization_id=$2 AND tenant_id=$3", [verificationId, scope.organizationId, scope.tenantId]);
    return result.rows[0] || null;
  }
  async updateVerification(verificationId: string, scope: any, input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`UPDATE gpa_verification_records SET status=COALESCE($4,status), started_at=COALESCE($5,started_at), completed_at=COALESCE($6,completed_at), achieved_level=COALESCE($7,achieved_level), result=COALESCE($8,result), confidence=COALESCE($9,confidence), evidence_references=COALESCE($10,evidence_references), exceptions=COALESCE($11,exceptions), determination_rationale=COALESCE($12,determination_rationale), reviewer_reference=COALESCE($13,reviewer_reference), reviewer_decision=COALESCE($14,reviewer_decision), provenance=COALESCE($15,provenance) WHERE verification_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *`, [verificationId, scope.organizationId, scope.tenantId, input.status || null, input.started_at || null, input.completed_at || null, input.achieved_level || null, input.result ? JSON.stringify(input.result) : null, input.confidence ?? null, input.evidence_references ? json(input.evidence_references) : null, input.exceptions ? json(input.exceptions) : null, input.determination_rationale || null, input.reviewer_reference || null, input.reviewer_decision || null, input.provenance ? json(input.provenance) : null]);
    return result.rows[0] || null;
  }
  async createContradiction(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_verification_contradictions
      (contradiction_id, verification_id, organization_id, tenant_id, contradiction_type, left_reference, right_reference, severity, materiality, reconciliation_case_id, created_by, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`, [input.contradiction_id, input.verification_id, input.organization_id, input.tenant_id, input.contradiction_type, input.left_reference, input.right_reference, input.severity, input.materiality, input.reconciliation_case_id || null, input.created_by, json(input.metadata)]);
    return result.rows[0];
  }
  async listContradictions(verificationId: string, scope: any, executor?: Executor) {
    const result = await this.executor(executor).query("SELECT * FROM gpa_verification_contradictions WHERE verification_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY created_at", [verificationId, scope.organizationId, scope.tenantId]);
    return result.rows;
  }
  async createWorkItem(input: any, executor?: Executor) {
    const result = await this.executor(executor).query(`INSERT INTO gpa_verification_work_queue
      (work_item_id, claim_id, verification_id, organization_id, tenant_id, assigned_verifier_reference, priority, due_at, target_level, blocker_codes, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (verification_id) DO UPDATE SET blocker_codes=EXCLUDED.blocker_codes, status=EXCLUDED.status, updated_at=NOW() RETURNING *`, [input.work_item_id, input.claim_id, input.verification_id, input.organization_id, input.tenant_id, input.assigned_verifier_reference || null, input.priority || "NORMAL", input.due_at || null, input.target_level, json(input.blocker_codes), input.status || "OPEN"]);
    return result.rows[0];
  }
  async listWorkQueue(scope: any, executor?: Executor) {
    const result = await this.executor().query("SELECT * FROM gpa_verification_work_queue WHERE organization_id=$1 AND tenant_id=$2 ORDER BY priority DESC, created_at", [scope.organizationId, scope.tenantId]);
    return result.rows;
  }
}

import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";

type ProviderActor = {
  user_id?: string;
  userId?: string;
  organization_id?: string;
  organizationId?: string;
  tenant_id?: string;
  tenantId?: string;
  permissions?: string[];
};

type QueryFn = typeof query;

function scope(actor: ProviderActor) {
  const providerReference = String(actor.organization_id || actor.organizationId || "").trim();
  const tenantId = String(actor.tenant_id || actor.tenantId || `tenant:${providerReference}`).trim();
  const userId = String(actor.user_id || actor.userId || "").trim();
  if (!providerReference || !userId || tenantId !== `tenant:${providerReference}`) throw new Error("GPA_PROVIDER_SCOPE_REQUIRED");
  return { providerReference, tenantId, userId };
}

function requirePermission(actor: ProviderActor, permission: string) {
  if (!hasPermission(actor.permissions || [], permission)) throw new Error("GPA_PROVIDER_PERMISSION_REQUIRED");
}

function safeJson(value: unknown) {
  return JSON.stringify(value && typeof value === "object" ? value : {});
}

function publicFinding(row: any) {
  return {
    finding_id: row.finding_id,
    provider_reference: row.provider_reference,
    program_reference: row.program_reference,
    requirement_reference: row.requirement_reference,
    finding_type: row.finding_type,
    severity: row.severity,
    materiality: row.materiality,
    description: row.description,
    status: row.status,
    provider_response_state: row.provider_response_state,
    corrective_action_required: row.corrective_action_required,
    detected_at: row.detected_at,
  };
}

function publicAction(row: any) {
  return {
    corrective_action_id: row.corrective_action_id,
    finding_id: row.finding_id,
    provider_reference: row.provider_reference,
    program_reference: row.program_reference,
    required_action: row.required_action,
    action_owner: row.action_owner,
    due_at: row.due_at,
    milestones: row.milestones,
    required_evidence: row.required_evidence,
    status: row.status,
    escalation_state: row.escalation_state,
  };
}

async function audit(input: { organizationId: string; userId: string; type: string; id: string; action: string; next: unknown }, db: QueryFn) {
  await writeAuditEvent({
    audit_event_id: `gpa_provider_${randomUUID()}`,
    organization_id: input.organizationId,
    actor_user_id: input.userId,
    target_object_type: input.type,
    target_object_id: input.id,
    action_type: input.action,
    previous_state_json: null,
    new_state_json: input.next,
    reason_code: "provider_self_service",
    correlation_id: `gpa_provider_${randomUUID()}`,
    source_channel: "government_assurance_provider",
  }, { query: db });
}

export class ProviderSelfServiceService {
  constructor(private db: QueryFn = query) {}

  private readScope(actor: ProviderActor) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_PROVIDER_SELF_SERVICE_VIEW);
    return scope(actor);
  }

  private writeScope(actor: ProviderActor) {
    requirePermission(actor, SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_PROVIDER_SELF_SERVICE_SUBMIT);
    return scope(actor);
  }

  async workspace(actor: ProviderActor) {
    const s = this.readScope(actor);
    const [requests, findings, actions] = await Promise.all([
      this.db("SELECT evidence_request_id, provider_reference, program_reference, requirement_reference, evidence_type, requested_at, due_at, status, response_reference, admissibility_status FROM gpa_evidence_requests WHERE provider_reference=$1 AND status <> 'CANCELLED' ORDER BY due_at NULLS LAST, requested_at DESC", [s.providerReference]),
      this.db("SELECT * FROM gpa_findings WHERE provider_reference=$1 AND status NOT IN ('WITHDRAWN','SUPERSEDED') ORDER BY detected_at DESC", [s.providerReference]),
      this.db("SELECT * FROM gpa_corrective_actions WHERE provider_reference=$1 AND status NOT IN ('CLOSED') ORDER BY due_at NULLS LAST, created_at DESC", [s.providerReference]),
    ]);
    return {
      providerReference: s.providerReference,
      tenantId: s.tenantId,
      items: {
        evidenceRequests: requests.rows,
        findings: findings.rows.map(publicFinding),
        correctiveActions: actions.rows.map(publicAction),
      },
      authority: {
        canSubmitEvidence: true,
        canRespondToFindings: true,
        canRespondToCorrectiveActions: true,
        canVerify: false,
        canPublish: false,
        canTriggerPayment: false,
      },
    };
  }

  async evidenceRequest(actor: ProviderActor, id: string) {
    const s = this.readScope(actor);
    const result = await this.db("SELECT evidence_request_id, provider_reference, program_reference, requirement_reference, evidence_type, requested_at, due_at, status, response_reference, admissibility_status, provenance FROM gpa_evidence_requests WHERE evidence_request_id=$1 AND provider_reference=$2", [id, s.providerReference]);
    return result.rows[0] || null;
  }

  async finding(actor: ProviderActor, id: string) {
    const s = this.readScope(actor);
    const result = await this.db("SELECT * FROM gpa_findings WHERE finding_id=$1 AND provider_reference=$2", [id, s.providerReference]);
    return result.rows[0] ? publicFinding(result.rows[0]) : null;
  }

  async correctiveAction(actor: ProviderActor, id: string) {
    const s = this.readScope(actor);
    const result = await this.db("SELECT * FROM gpa_corrective_actions WHERE corrective_action_id=$1 AND provider_reference=$2", [id, s.providerReference]);
    return result.rows[0] ? publicAction(result.rows[0]) : null;
  }

  private async authorizedEvidenceReferences(providerReference: string, references: unknown) {
    const ids = Array.isArray(references) ? references.map(String).filter(Boolean) : [];
    if (!ids.length) return [];
    const result = await this.db("SELECT source_asset_id FROM source_assets WHERE organization_id=$1 AND status='ACTIVE' AND source_asset_id = ANY($2::text[])", [providerReference, ids]);
    if (result.rows.length !== ids.length) throw new Error("GPA_PROVIDER_EVIDENCE_SCOPE_DENIED");
    return ids;
  }

  async submitFindingResponse(actor: ProviderActor, findingId: string, input: any) {
    const s = this.writeScope(actor);
    const finding = await this.db("SELECT * FROM gpa_findings WHERE finding_id=$1 AND provider_reference=$2 AND status NOT IN ('WITHDRAWN','SUPERSEDED','CLOSED')", [findingId, s.providerReference]);
    if (!finding.rows[0]) throw new Error("GPA_PROVIDER_FINDING_NOT_FOUND");
    const evidence = await this.authorizedEvidenceReferences(s.providerReference, input?.evidenceReferences || input?.evidence_references);
    const responseId = `gpa_provider_response_${randomUUID()}`;
    const provenance = { source: "civicsure_provider_self_service", providerReference: s.providerReference, actorUserId: s.userId, findingId, submittedAt: new Date().toISOString() };
    const result = await this.db("INSERT INTO gpa_provider_responses (response_id, finding_id, organization_id, tenant_id, provider_reference, responder_reference, response_type, narrative_reference, supporting_evidence_references, status, provenance, created_by) VALUES ($1,$2,$3,$4,$5,$6,'FINDING_RESPONSE',$7,$8::jsonb,'SUBMITTED',$9::jsonb,$6) RETURNING response_id, finding_id, provider_reference, response_type, status, supporting_evidence_references, provenance, submitted_at", [responseId, findingId, finding.rows[0].organization_id, finding.rows[0].tenant_id, s.providerReference, s.userId, String(input?.narrative || input?.narrativeReference || "").trim() || null, safeJson(evidence), safeJson(provenance)]);
    await audit({ organizationId: finding.rows[0].organization_id, userId: s.userId, type: "GPA_PROVIDER_RESPONSE", id: responseId, action: "PROVIDER_RESPONSE_SUBMITTED", next: result.rows[0] }, this.db);
    return result.rows[0];
  }

  async submitCorrectiveActionResponse(actor: ProviderActor, actionId: string, input: any) {
    const s = this.writeScope(actor);
    const action = await this.db("SELECT a.*, f.status AS finding_status FROM gpa_corrective_actions a JOIN gpa_findings f ON f.finding_id=a.finding_id AND f.organization_id=a.organization_id AND f.tenant_id=a.tenant_id WHERE a.corrective_action_id=$1 AND a.provider_reference=$2 AND a.status NOT IN ('CLOSED','COMPLETE')", [actionId, s.providerReference]);
    if (!action.rows[0]) throw new Error("GPA_PROVIDER_CORRECTIVE_ACTION_NOT_FOUND");
    const evidence = await this.authorizedEvidenceReferences(s.providerReference, input?.evidenceReferences || input?.evidence_references);
    const responseId = `gpa_provider_response_${randomUUID()}`;
    const provenance = { source: "civicsure_provider_self_service", providerReference: s.providerReference, actorUserId: s.userId, correctiveActionId: actionId, submittedAt: new Date().toISOString() };
    const result = await this.db("INSERT INTO gpa_provider_responses (response_id, finding_id, organization_id, tenant_id, provider_reference, responder_reference, response_type, narrative_reference, supporting_evidence_references, status, provenance, created_by) VALUES ($1,$2,$3,$4,$5,$6,'CORRECTIVE_ACTION_RESPONSE',$7,$8::jsonb,'SUBMITTED',$9::jsonb,$6) RETURNING response_id, finding_id, provider_reference, response_type, status, supporting_evidence_references, provenance, submitted_at", [responseId, action.rows[0].finding_id, action.rows[0].organization_id, action.rows[0].tenant_id, s.providerReference, s.userId, String(input?.narrative || input?.narrativeReference || "").trim() || null, safeJson(evidence), safeJson(provenance)]);
    await this.db("UPDATE gpa_corrective_actions SET status='EVIDENCE_SUBMITTED', submitted_by=$2, provenance=provenance || $3::jsonb WHERE corrective_action_id=$1 AND provider_reference=$4", [actionId, s.userId, safeJson({ providerResponseId: responseId, providerReference: s.providerReference }), s.providerReference]);
    await audit({ organizationId: action.rows[0].organization_id, userId: s.userId, type: "GPA_CORRECTIVE_ACTION", id: actionId, action: "PROVIDER_CORRECTIVE_RESPONSE_SUBMITTED", next: { responseId, evidenceReferences: evidence } }, this.db);
    return result.rows[0];
  }
}

export const providerSelfService = new ProviderSelfServiceService();

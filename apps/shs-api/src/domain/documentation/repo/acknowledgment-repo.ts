import { query } from "../../../db/client.js";

function scope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  if (!organizationId || !userId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { organizationId, tenantId, userId };
}

export class DocumentationAgreementRepository {
  constructor(private readonly executor: any = { query }) {}
  scope(actor: any) { return scope(actor); }

  async getDocument(documentInstanceId: string, actor: any) {
    const s = scope(actor);
    const result = await this.executor.query("SELECT * FROM dgal_document_instances WHERE document_instance_id=$1 AND organization_id=$2 AND tenant_id=$3", [documentInstanceId, s.organizationId, s.tenantId]);
    return result.rows[0] || null;
  }

  async findAcknowledgment(input: any, actor: any) {
    const s = scope(actor);
    if (input.idempotencyKey) {
      const replay = await this.executor.query("SELECT * FROM documentation_acknowledgments WHERE organization_id=$1 AND tenant_id=$2 AND idempotency_key=$3", [s.organizationId, s.tenantId, input.idempotencyKey]);
      if (replay.rows[0]) return replay.rows[0];
    }
    const result = await this.executor.query("SELECT * FROM documentation_acknowledgments WHERE organization_id=$1 AND tenant_id=$2 AND actor_user_id=$3 AND owning_domain=$4 AND requirement_rule_id IS NOT DISTINCT FROM $5 AND document_instance_id IS NOT DISTINCT FROM $6 AND agreement_reference IS NOT DISTINCT FROM $7 AND agreement_version IS NOT DISTINCT FROM $8 AND content_hash IS NOT DISTINCT FROM $9 AND status='ACKNOWLEDGED' LIMIT 1", [s.organizationId, s.tenantId, s.userId, input.owningDomain, input.requirementRuleId || null, input.documentInstanceId || null, input.agreementReference || null, input.agreementVersion || null, input.contentHash || null]);
    return result.rows[0] || null;
  }

  async createAcknowledgment(input: any, actor: any) {
    const s = scope(actor);
    const result = await this.executor.query(`INSERT INTO documentation_acknowledgments (acknowledgment_id,organization_id,tenant_id,actor_user_id,actor_role,represented_party_reference,owning_domain,requirement_rule_id,document_instance_id,agreement_reference,agreement_version,template_version_id,content_hash,subject_reference,service_key,workflow_type,workflow_stage,resource_type,resource_id,source_action,acknowledgment_method,status,acknowledged_at,retention_policy_key,legal_hold_reference,idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,'DIGITAL_ACKNOWLEDGMENT','ACKNOWLEDGED',NOW(),$21,$22,$23) RETURNING *`, [input.acknowledgmentId,s.organizationId,s.tenantId,s.userId,input.actorRole,input.representedPartyReference || null,input.owningDomain,input.requirementRuleId || null,input.documentInstanceId || null,input.agreementReference || null,input.agreementVersion || null,input.templateVersionId || null,input.contentHash || null,input.subjectReference || null,input.serviceKey || null,input.workflowType || null,input.workflowStage || null,input.resourceType || null,input.resourceId || null,input.sourceAction,input.retentionPolicyKey || null,input.legalHoldReference || null,input.idempotencyKey || null]);
    return result.rows[0];
  }

  async getAcknowledgment(id: string, actor: any) { const s = scope(actor); const result = await this.executor.query("SELECT * FROM documentation_acknowledgments WHERE acknowledgment_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, s.organizationId, s.tenantId]); return result.rows[0] || null; }

  async createManualSignature(input: any, actor: any) {
    const s = scope(actor);
    const result = await this.executor.query(`INSERT INTO documentation_manual_signature_records (manual_signature_id,organization_id,tenant_id,document_instance_id,original_template_version_id,original_content_hash,signed_artifact_reference,signed_artifact_hash,signed_artifact_media_type,signed_artifact_byte_length,signer_reference,signer_role,signer_capacity,signing_date,uploaded_by_user_id,verification_status,owning_domain,requirement_rule_id,retention_policy_key,legal_hold_reference,idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'UPLOADED',$16,$17,$18,$19,$20) RETURNING *`, [input.manualSignatureId,s.organizationId,s.tenantId,input.documentInstanceId,input.originalTemplateVersionId,input.originalContentHash,input.signedArtifactReference,input.signedArtifactHash,input.signedArtifactMediaType,input.signedArtifactByteLength,input.signerReference,input.signerRole,input.signerCapacity || null,input.signingDate || null,s.userId,input.owningDomain,input.requirementRuleId || null,input.retentionPolicyKey || null,input.legalHoldReference || null,input.idempotencyKey || null]);
    return result.rows[0];
  }

  async findManualSignatureByIdempotency(key: string, actor: any) { const s = scope(actor); const result = await this.executor.query("SELECT * FROM documentation_manual_signature_records WHERE organization_id=$1 AND tenant_id=$2 AND idempotency_key=$3", [s.organizationId, s.tenantId, key]); return result.rows[0] || null; }
  async getManualSignature(id: string, actor: any) { const s = scope(actor); const result = await this.executor.query("SELECT * FROM documentation_manual_signature_records WHERE manual_signature_id=$1 AND organization_id=$2 AND tenant_id=$3", [id, s.organizationId, s.tenantId]); return result.rows[0] || null; }
  async transitionManualSignature(id: string, from: string, to: string, actor: any, input: any = {}) { const s = scope(actor); const result = await this.executor.query("UPDATE documentation_manual_signature_records SET verification_status=$1,verified_by_user_id=CASE WHEN $1='VERIFIED' OR $1='REJECTED' THEN $2 ELSE verified_by_user_id END,verified_at=CASE WHEN $1='VERIFIED' OR $1='REJECTED' THEN NOW() ELSE verified_at END,verification_notes=$3,verification_category=$4,updated_at=NOW() WHERE manual_signature_id=$5 AND organization_id=$6 AND tenant_id=$7 AND verification_status=$8 RETURNING *", [to,s.userId,input.notes || null,input.category || null,id,s.organizationId,s.tenantId,from]); if (!result.rows[0]) throw new Error("MANUAL_SIGNATURE_STATE_CONFLICT"); await this.executor.query("INSERT INTO documentation_manual_signature_events (event_id,manual_signature_id,organization_id,tenant_id,from_status,to_status,actor_user_id,reason_reference) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [`dgal_manual_event_${Date.now()}_${Math.random().toString(16).slice(2)}`,id,s.organizationId,s.tenantId,from,to,s.userId,input.reasonReference || null]); return result.rows[0]; }
}

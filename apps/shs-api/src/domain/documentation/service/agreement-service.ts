import { createHash, randomUUID } from "node:crypto";
import { LocalPrivateSourceStorage } from "../../source-ingestion/storage/source-storage.js";
import { validateSourceFile } from "../../source-ingestion/service/source-validation.js";
import { DocumentationAgreementRepository } from "../repo/acknowledgment-repo.js";
import { CanonicalServiceAgreementReader, type AgreementVersionReader } from "./agreement-reader.js";

function actorScope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  const userId = String(actor?.user_id || actor?.id || "").trim();
  if (!organizationId || !userId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { organizationId, tenantId, userId };
}

function has(actor: any, permission: string) { return Array.isArray(actor?.permissions) && actor.permissions.includes(permission); }

export class DocumentationAgreementService {
  constructor(
    private readonly repo = new DocumentationAgreementRepository(),
    private readonly storage = new LocalPrivateSourceStorage(),
    private readonly agreements: AgreementVersionReader = new CanonicalServiceAgreementReader(),
  ) {}

  async acknowledge(actor: any, input: any) {
    if (!has(actor, "documentation.acknowledge")) throw new Error("DOCUMENTATION_ACKNOWLEDGE_FORBIDDEN");
    const scope = actorScope(actor);
    const document = input?.documentInstanceId ? await this.repo.getDocument(String(input.documentInstanceId), actor) : null;
    if (input?.documentInstanceId && (!document || document.state !== "GENERATED")) throw new Error("ACKNOWLEDGMENT_DOCUMENT_NOT_AVAILABLE");
    if (!document && !input?.agreementReference) throw new Error("ACKNOWLEDGMENT_EXACT_ITEM_REQUIRED");
    if (input?.retentionPolicyKey || input?.legalHoldReference) {
      if (!has(actor, "documentation.retention.assign")) throw new Error("DOCUMENTATION_RETENTION_ASSIGN_FORBIDDEN");
    }
    if (document && input.contentHash && input.contentHash !== document.content_hash) throw new Error("ACKNOWLEDGMENT_DOCUMENT_HASH_MISMATCH");
    if (document && input.templateVersionId && input.templateVersionId !== document.template_version_id) throw new Error("ACKNOWLEDGMENT_TEMPLATE_VERSION_MISMATCH");
    if (input?.agreementReference) {
      if (!input.agreementVersion) throw new Error("AGREEMENT_VERSION_REQUIRED");
      const resolved = await this.agreements.resolve(actor, String(input.agreementReference), String(input.agreementVersion));
      if (!resolved) throw new Error("AGREEMENT_VERSION_NOT_AVAILABLE");
    }
    const data = { owningDomain: String(input.owningDomain || "DGAL"), requirementRuleId: input.requirementRuleId || null, documentInstanceId: document?.document_instance_id || null, agreementReference: input.agreementReference || null, agreementVersion: input.agreementVersion || null, contentHash: document?.content_hash || input.contentHash || null, idempotencyKey: String(input.idempotencyKey || "").trim() || null };
    const existing = await this.repo.findAcknowledgment(data, actor);
    if (existing) return { ...existing, replayed: true };
    const result = await this.repo.createAcknowledgment({ ...data, acknowledgmentId: `dgal_ack_${randomUUID()}`, actorRole: String(actor.role || actor.role_name || "UNSPECIFIED"), representedPartyReference: input.representedPartyReference || scope.organizationId, templateVersionId: document?.template_version_id || input.templateVersionId || null, subjectReference: document?.subject_reference || input.subjectReference, serviceKey: document?.service_key || input.serviceKey, workflowType: document?.workflow_type || input.workflowType, workflowStage: document?.workflow_stage || input.workflowStage, resourceType: document?.resource_type || input.resourceType, resourceId: document?.resource_id || input.resourceId, sourceAction: String(input.sourceAction || "explicit_acknowledgment"), retentionPolicyKey: input.retentionPolicyKey, legalHoldReference: input.legalHoldReference }, actor);
    return { ...result, replayed: false };
  }

  async getAcknowledgment(actor: any, id: string) { if (!has(actor, "documentation.acknowledgment.view") && !has(actor, "documentation.acknowledge")) throw new Error("DOCUMENTATION_ACKNOWLEDGMENT_VIEW_FORBIDDEN"); return this.repo.getAcknowledgment(id, actor); }

  async uploadManualSignature(actor: any, input: any, file: any) {
    if (!has(actor, "documentation.manual_signature.upload")) throw new Error("DOCUMENTATION_MANUAL_SIGNATURE_UPLOAD_FORBIDDEN");
    const scope = actorScope(actor);
    const document = await this.repo.getDocument(String(input?.documentInstanceId || ""), actor);
    if (!document || document.state !== "GENERATED" || !document.content_hash || !document.template_version_id) throw new Error("MANUAL_SIGNATURE_DOCUMENT_NOT_AVAILABLE");
    if (!String(input?.signerReference || "").trim() || !String(input?.signerRole || "").trim()) throw new Error("MANUAL_SIGNATURE_SIGNER_REQUIRED");
    if (input?.retentionPolicyKey || input?.legalHoldReference) {
      if (!has(actor, "documentation.retention.assign")) throw new Error("DOCUMENTATION_RETENTION_ASSIGN_FORBIDDEN");
    }
    if (input?.originalContentHash && input.originalContentHash !== document.content_hash) throw new Error("MANUAL_SIGNATURE_ORIGINAL_HASH_MISMATCH");
    const validated = validateSourceFile(file);
    const signedHash = createHash("sha256").update(file.buffer).digest("hex");
    const idempotencyKey = String(input?.idempotencyKey || "").trim() || null;
    if (idempotencyKey) { const existing = await this.repo.findManualSignatureByIdempotency(idempotencyKey, actor); if (existing) return { ...existing, replayed: true }; }
    const manualSignatureId = `dgal_manual_${randomUUID()}`;
    const storageReference = `manual-signatures/${scope.organizationId}/${scope.tenantId}/${manualSignatureId}/${signedHash}${validated.extension}`;
    await this.storage.put(storageReference, file.buffer);
    try {
      const result = await this.repo.createManualSignature({ manualSignatureId, documentInstanceId: document.document_instance_id, originalTemplateVersionId: document.template_version_id, originalContentHash: document.content_hash, signedArtifactReference: storageReference, signedArtifactHash: signedHash, signedArtifactMediaType: validated.mediaType, signedArtifactByteLength: file.size, signerReference: String(input?.signerReference || "").trim(), signerRole: String(input?.signerRole || "").trim(), signerCapacity: input?.signerCapacity, signingDate: input?.signingDate, owningDomain: input?.owningDomain || "DGAL", requirementRuleId: input?.requirementRuleId, retentionPolicyKey: input?.retentionPolicyKey, legalHoldReference: input?.legalHoldReference, idempotencyKey }, actor);
      return { ...result, replayed: false };
    } catch (error) { await this.storage.remove(storageReference).catch(() => undefined); throw error; }
  }

  async getManualSignature(actor: any, id: string) { if (!has(actor, "documentation.manual_signature.upload") && !has(actor, "documentation.manual_signature.verify")) throw new Error("DOCUMENTATION_MANUAL_SIGNATURE_VIEW_FORBIDDEN"); return this.repo.getManualSignature(id, actor); }

  async verifyManualSignature(actor: any, id: string, input: any) {
    if (!has(actor, "documentation.manual_signature.verify")) throw new Error("DOCUMENTATION_MANUAL_SIGNATURE_VERIFY_FORBIDDEN");
    const record = await this.repo.getManualSignature(id, actor);
    if (!record) throw new Error("MANUAL_SIGNATURE_NOT_FOUND");
    if (record.uploaded_by_user_id === actor.user_id && !has(actor, "documentation.manual_signature.self_verify")) throw new Error("MANUAL_SIGNATURE_SELF_VERIFY_FORBIDDEN");
    const target = String(input?.status || "").toUpperCase();
    if (!["VERIFIED", "REJECTED"].includes(target)) throw new Error("MANUAL_SIGNATURE_DECISION_REQUIRED");
    if (target === "REJECTED" && !input?.reasonReference && !input?.notes) throw new Error("MANUAL_SIGNATURE_REJECTION_REASON_REQUIRED");
    return this.repo.transitionManualSignature(id, record.verification_status, target, actor, input);
  }

  async getSignedArtifact(actor: any, id: string) {
    const record = await this.getManualSignature(actor, id);
    if (!record) return null;
    return { record, bytes: await this.storage.get(record.signed_artifact_reference) };
  }
}

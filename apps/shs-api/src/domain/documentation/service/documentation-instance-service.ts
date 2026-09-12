import { createHash, randomUUID } from "node:crypto";
import { ReportFileStorage } from "../../reporting/report-file-storage.js";
import { DocumentationInstanceRepository } from "../repo/documentation-instance-repo.js";
import { DocumentationRenderer, type DocumentationRenderInput } from "./documentation-renderer.js";
import { ReportingArtifactReferenceService } from "./reporting-artifact-reference.js";

const CLASSIFICATIONS = new Set(["INTERNAL", "RESTRICTED_EXTERNAL", "PUBLIC"]);

function stableJson(value: unknown) { return JSON.stringify(value, Object.keys((value || {}) as object).sort()); }
function hashManifest(value: unknown) { return createHash("sha256").update(stableJson(value)).digest("hex"); }
function actorScope(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { organizationId, tenantId, userId: actor?.user_id || actor?.id || null };
}

export class DocumentationInstanceService {
  constructor(
    private readonly repo = new DocumentationInstanceRepository(),
    private readonly renderer = new DocumentationRenderer(),
    private readonly storage = new ReportFileStorage(),
    private readonly reportingArtifacts = new ReportingArtifactReferenceService(),
  ) {}

  async createDocument(actor: any, input: any) {
    const scope = actorScope(actor);
    const template = await this.repo.getTemplateVersion(String(input?.templateVersionId || ""), actor);
    if (!template || template.status !== "ACTIVE") throw new Error("ACTIVE_TEMPLATE_VERSION_REQUIRED");
    const classification = String(input?.classification || template.classification || template.default_classification || "INTERNAL").toUpperCase();
    if (!CLASSIFICATIONS.has(classification)) throw new Error("DOCUMENT_CLASSIFICATION_INVALID");
    if (classification === "PUBLIC") throw new Error("DOCUMENT_PUBLICATION_OUTSIDE_DGAL3");
    if ((input?.retentionPolicyKey || input?.legalHoldReference) && !actor?.permissions?.includes("documentation.retention.assign")) throw new Error("DOCUMENTATION_RETENTION_ASSIGN_FORBIDDEN");
    const structuredData = input?.structuredData;
    if (!structuredData || typeof structuredData !== "object" || Array.isArray(structuredData)) throw new Error("STRUCTURED_DATA_REQUIRED");
    const idempotencyKey = String(input?.idempotencyKey || input?.idempotency_key || "").trim() || null;
    if (idempotencyKey) {
      const existing = await this.repo.findByIdempotency(idempotencyKey, actor);
      if (existing) return existing;
    }
    const instance = await this.repo.createInstance({
      documentInstanceId: `dgal_doc_${randomUUID()}`,
      documentTypeId: template.document_type_id,
      templateId: template.template_id,
      templateVersionId: template.template_version_id,
      owningDomain: template.owning_domain,
      organizationId: scope.organizationId,
      tenantId: scope.tenantId,
      serviceKey: input.serviceKey || template.service_key,
      workflowType: input.workflowType,
      workflowStage: input.workflowStage,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      subjectReference: input.subjectReference,
      title: input.title || template.template_title || template.document_type_title,
      classification,
      sourceManifest: input.sourceManifest || { references: input.sourceReferences || [], fields: Object.keys(structuredData).sort() },
      retentionPolicyKey: input.retentionPolicyKey || null,
      retentionStartAt: input.retentionStartAt || null,
      legalHoldReference: input.legalHoldReference || null,
      idempotencyKey,
      userId: scope.userId,
    });
    const renderInput: DocumentationRenderInput = {
      title: instance.title,
      documentType: template.document_type_title,
      templateVersion: `${template.version_number}:${template.revision}`,
      organizationId: scope.organizationId,
      serviceKey: instance.service_key,
      classification,
      structuredData,
    };
    try {
      const rendered = String(input.format || "HTML").toUpperCase() === "PDF"
        ? await this.renderer.renderPdf(renderInput)
        : this.renderer.renderHtml(renderInput);
      const extension = rendered.format.toLowerCase();
      const storageReference = `documentation/${scope.organizationId}/${scope.tenantId}/${instance.document_instance_id}/${rendered.hash}.${extension}`;
      await this.storage.put(storageReference, rendered.bytes);
      await this.repo.createArtifactLink({ artifactLinkId: `dgal_artifact_${randomUUID()}`, documentInstanceId: instance.document_instance_id, artifactType: rendered.format, mediaType: rendered.mimeType, storageReference, contentHash: rendered.hash, byteLength: rendered.bytes.length, rendererId: rendered.rendererId, rendererVersion: rendered.rendererVersion }, actor);
      const finalized = await this.repo.finalize(instance.document_instance_id, actor, rendered, storageReference);
      if (!finalized) throw new Error("DOCUMENT_FINALIZE_FAILED");
      return { ...finalized, template_version_id: template.template_version_id, artifact: { reference: storageReference, format: rendered.format, hash: rendered.hash, accessibleHtml: rendered.accessibility.semanticHtml } };
    } catch (error: any) {
      await this.repo.fail(instance.document_instance_id, actor, error?.message || "render_failed");
      throw error;
    }
  }

  async getDocument(actor: any, id: string) { return this.repo.get(id, actor); }
  async getArtifact(actor: any, id: string) {
    const instance = await this.repo.get(id, actor);
    if (!instance?.artifact_reference || instance.state !== "GENERATED") throw new Error("DOCUMENT_ARTIFACT_NOT_AVAILABLE");
    return { instance, bytes: await this.storage.get(instance.artifact_reference) };
  }
  async linkEvidence(actor: any, id: string, input: any) {
    if (!actor?.permissions?.includes("documentation.evidence.link")) throw new Error("DOCUMENTATION_EVIDENCE_LINK_FORBIDDEN");
    if (!input?.evidenceReference || !input?.relationshipType || !input?.sourceReference) throw new Error("EVIDENCE_LINK_METADATA_REQUIRED");
    return this.repo.linkEvidence({ documentInstanceId: id, evidenceLinkId: `dgal_evidence_link_${randomUUID()}`, evidenceReference: input.evidenceReference, relationshipType: input.relationshipType, owningDomain: input.owningDomain || "UNKNOWN", sourceReference: input.sourceReference }, actor);
  }
  async createPacket(actor: any, input: any) {
    const scope = actorScope(actor);
    const rawItems = Array.isArray(input?.items) ? input.items : [];
    const items = [] as any[];
    for (const [index, rawItem] of rawItems.entries()) {
      const itemType = String(rawItem.itemType || "DOCUMENT_INSTANCE");
      if (!["DOCUMENT_INSTANCE", "DOMAIN_ARTIFACT_REFERENCE", "GUIDANCE", "REPORT_ARTIFACT_REFERENCE"].includes(itemType)) throw new Error("PACKET_ITEM_TYPE_INVALID");
      const referenceId = String(rawItem.referenceId || "");
      if (!referenceId) continue;
      const item: any = { itemKey: String(rawItem.itemKey || `item-${index + 1}`), displayOrder: index, itemType, referenceId, sourceOwner: String(rawItem.sourceOwner || "UNKNOWN"), required: rawItem.required !== false, state: rawItem.state || (["DOMAIN_ARTIFACT_REFERENCE", "REPORT_ARTIFACT_REFERENCE"].includes(itemType) ? "EXTERNAL" : "PENDING") };
      if (itemType === "REPORT_ARTIFACT_REFERENCE") {
        const reportReference = await this.reportingArtifacts.resolve(actor, referenceId);
        if (!reportReference) throw new Error("REPORTING_ARTIFACT_NOT_FOUND_OR_FORBIDDEN");
        item.sourceOwner = "REPORTING";
        item.state = "EXTERNAL";
        item.contentHash = reportReference.contentHash;
        item.reportArtifact = reportReference;
      }
      items.push(item);
    }
    if (!items.length) throw new Error("PACKET_ITEMS_REQUIRED");
    const missingRequired = items.some((item: any) => item.required && ["MISSING", "FAILED", "PENDING"].includes(item.state));
    const manifest = items.map((item: any) => ({ ...item }));
    const packetClassification = String(input.classification || "INTERNAL").toUpperCase();
    if (!CLASSIFICATIONS.has(packetClassification) || packetClassification === "PUBLIC") throw new Error("PACKET_CLASSIFICATION_INVALID");
    if ((input?.retentionPolicyKey || input?.legalHoldReference) && !actor?.permissions?.includes("documentation.retention.assign")) throw new Error("DOCUMENTATION_RETENTION_ASSIGN_FORBIDDEN");
    const packet = await this.repo.createPacket({ packetInstanceId: `dgal_packet_${randomUUID()}`, packetDefinitionId: input.packetDefinitionId, packetKey: input.packetKey || "runtime-packet", title: input.title || "Documentation packet", owningDomain: input.owningDomain || "DGAL", organizationId: scope.organizationId, tenantId: scope.tenantId, serviceKey: input.serviceKey, workflowType: input.workflowType, workflowStage: input.workflowStage, resourceType: input.resourceType, resourceId: input.resourceId, classification: packetClassification, manifest, manifestHash: hashManifest(manifest), retentionPolicyKey: input.retentionPolicyKey, retentionStartAt: input.retentionStartAt, legalHoldReference: input.legalHoldReference, userId: scope.userId });
    await this.repo.createPacketItems(packet.packet_instance_id, items, actor);
    const state = missingRequired ? "PARTIAL" : "GENERATED";
    const finalized = await this.repo.finalizePacket(packet.packet_instance_id, actor, state);
    return { ...(finalized || packet), state, manifest, manifestHash: hashManifest(manifest) };
  }
  async getPacket(actor: any, id: string) { return this.repo.getPacket(id, actor); }
}

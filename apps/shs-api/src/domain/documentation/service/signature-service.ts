import { createHash, randomUUID } from "node:crypto";
import { LocalPrivateSourceStorage } from "../../source-ingestion/storage/source-storage.js";
import { DocumentationInstanceRepository } from "../repo/documentation-instance-repo.js";
import { DocumentationSignatureRepository } from "../repo/signature-repo.js";
import { defaultSignatureProviderRegistry, type SignatureProviderRegistry } from "../provider/signature-adapter.js";
import type { SignatureEnvironment, SignatureRequestInput, ProviderSignatureEvent } from "../model/signature.js";

function scope(actor: any) { const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim(); const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim(); const userId = String(actor?.user_id || actor?.id || "").trim(); if (!organizationId || !userId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED"); return { organizationId, tenantId, userId }; }
function permission(actor: any, name: string) { if (!actor?.permissions?.includes(name)) throw new Error(`SIGNATURE_${name.toUpperCase().replaceAll(".", "_")}_FORBIDDEN`); }
function digest(bytes: Buffer) { return createHash("sha256").update(bytes).digest("hex"); }

export class DocumentationSignatureService {
  constructor(private readonly repo = new DocumentationSignatureRepository(), private readonly documents = new DocumentationInstanceRepository(), private readonly storage = new LocalPrivateSourceStorage(), private readonly providers: SignatureProviderRegistry = defaultSignatureProviderRegistry()) {}

  async createRequest(actor: any, input: SignatureRequestInput) {
    permission(actor, "documentation.signature.request"); const s = scope(actor);
    const document = await this.repo.getDocument(input.documentInstanceId, actor);
    if (!document || document.state !== "GENERATED") throw new Error("SIGNATURE_DOCUMENT_NOT_AVAILABLE");
    if (input.contentHash !== document.content_hash) throw new Error("SIGNATURE_DOCUMENT_HASH_MISMATCH");
    if (input.templateVersionId && input.templateVersionId !== document.template_version_id) throw new Error("SIGNATURE_TEMPLATE_VERSION_MISMATCH");
    if (!input.signerReference || !input.signerRole) throw new Error("SIGNATURE_SIGNER_REQUIRED");
    const environment = (input.providerEnvironment || "TEST") as SignatureEnvironment;
    const adapter = this.providers.get(input.providerKey, environment); if (!adapter) throw new Error("SIGNATURE_PROVIDER_NOT_CONFIGURED");
    if ((input.retentionPolicyKey || input.legalHoldReference) && !actor.permissions?.includes("documentation.retention.assign")) throw new Error("SIGNATURE_RETENTION_ASSIGN_FORBIDDEN");
    if (input.idempotencyKey) { const existing = await this.repo.findIdempotent(input.idempotencyKey, actor); if (existing) return existing; }
    const created = await this.repo.create({ ...input, signatureRequestId: `dgal_sig_${randomUUID()}`, templateVersionId: document.template_version_id, providerEnvironment: environment }, actor);
    try { const provider = await adapter.createRequest({ documentInstanceId: document.document_instance_id, contentHash: document.content_hash, signerReference: input.signerReference, signerRole: input.signerRole }); const attached = await this.repo.attachProviderRequest(created.signature_request_id, provider, actor); if (!attached) throw new Error("SIGNATURE_REQUEST_FINALIZE_FAILED"); return attached; } catch (error) { try { await this.repo.transition(created.signature_request_id, "FAILED", { rawStatus: "create_failed", metadata: { error: String((error as Error)?.message || "provider_error").slice(0, 160) } }, actor); } catch { /* preserve original failure */ } throw error; }
  }
  async get(actor: any, id: string) { permission(actor, "documentation.signature.view"); return this.repo.get(id, actor); }
  async createSession(actor: any, id: string) { permission(actor, "documentation.signature.session"); const request = await this.repo.get(id, actor); if (!request?.provider_request_reference) throw new Error("SIGNATURE_REQUEST_NOT_SENT"); const adapter = this.providers.get(request.provider_key, request.provider_environment); if (!adapter) throw new Error("SIGNATURE_PROVIDER_NOT_CONFIGURED"); return adapter.createSigningSession({ providerRequestReference: request.provider_request_reference }); }
  async voidRequest(actor: any, id: string, reason: string) { permission(actor, "documentation.signature.void"); const request = await this.repo.get(id, actor); if (!request?.provider_request_reference) throw new Error("SIGNATURE_REQUEST_NOT_SENT"); const adapter = this.providers.get(request.provider_key, request.provider_environment); if (!adapter) throw new Error("SIGNATURE_PROVIDER_NOT_CONFIGURED"); await adapter.voidRequest(request.provider_request_reference, reason); return this.repo.transition(id, "VOIDED", { rawStatus: "voided", metadata: { reason } }, actor); }
  async processWebhook(providerKey: string, environment: SignatureEnvironment, headers: Record<string, string | undefined>, body: Record<string, unknown>) {
    const adapter = this.providers.get(providerKey, environment); if (!adapter) throw new Error("SIGNATURE_PROVIDER_NOT_CONFIGURED"); const payload = JSON.stringify(body); if (!adapter.verifyWebhook(headers, payload)) throw new Error("SIGNATURE_WEBHOOK_INVALID");
    const event: ProviderSignatureEvent = adapter.normalizeWebhook(body); if (!event.eventReference || !event.requestReference) throw new Error("SIGNATURE_WEBHOOK_INVALID");
    const request = await this.repo.getByProviderReference(providerKey, environment, event.requestReference); if (!request) throw new Error("SIGNATURE_PROVIDER_REQUEST_NOT_FOUND");
    const recorded = await this.repo.recordProviderEvent({ providerEventId: `dgal_sig_event_${randomUUID()}`, providerKey, providerEnvironment: environment, eventReference: event.eventReference, requestReference: event.requestReference, organizationId: request.organization_id, tenantId: request.tenant_id, normalizedStatus: event.normalizedStatus, rawStatus: event.rawStatus, metadata: event.providerMetadata });
    if (!recorded) return { duplicate: true, request };
    const actor = { user_id: request.created_by_user_id, organization_id: request.organization_id, active_organization_id: request.organization_id, tenant_id: request.tenant_id, permissions: ["documentation.signature.view", "documentation.signature.artifact.retrieve"] };
    const updated = await this.repo.transition(request.signature_request_id, event.normalizedStatus, event, actor);
    if (event.normalizedStatus === "SIGNED") await this.retrieveArtifactInternal(adapter, updated, actor);
    return { duplicate: false, request: await this.repo.get(request.signature_request_id, actor) };
  }
  private async retrieveArtifactInternal(adapter: any, request: any, actor: any) { if (request.signed_artifact_reference) return request; const result = await adapter.retrieveSignedArtifactReference(request.provider_request_reference); if (!result?.bytes) throw new Error("SIGNATURE_ARTIFACT_UNAVAILABLE"); const hash = digest(result.bytes); const reference = `signatures/${request.organization_id}/${request.tenant_id}/${request.signature_request_id}/${hash}.pdf`; await this.storage.put(reference, result.bytes); return this.repo.attachArtifact(request.signature_request_id, { reference, hash, mediaType: result.mediaType, byteLength: result.bytes.length }, actor); }
  async retrieveArtifact(actor: any, id: string) { permission(actor, "documentation.signature.artifact.retrieve"); const request = await this.repo.get(id, actor); if (!request?.signed_artifact_reference) throw new Error("SIGNATURE_ARTIFACT_NOT_AVAILABLE"); return { request, bytes: await this.storage.get(request.signed_artifact_reference) }; }
  async linkEvidence(actor: any, id: string, evidenceReference: string) { permission(actor, "documentation.evidence.link"); if (!evidenceReference) throw new Error("SIGNATURE_EVIDENCE_REFERENCE_REQUIRED"); return this.repo.attachEvidence(id, { evidenceReference }, actor); }
  async refresh(actor: any, id: string) { permission(actor, "documentation.signature.view"); const request = await this.repo.get(id, actor); if (!request?.provider_request_reference) throw new Error("SIGNATURE_REQUEST_NOT_SENT"); const adapter = this.providers.get(request.provider_key, request.provider_environment); if (!adapter) throw new Error("SIGNATURE_PROVIDER_NOT_CONFIGURED"); const status = await adapter.getStatus(request.provider_request_reference); if (status.status === request.status) return request; const event = { eventReference: `poll:${request.provider_request_reference}:${status.rawStatus}`, rawStatus: status.rawStatus, metadata: status.metadata }; const next = await this.repo.transition(id, status.status, event, actor); if (status.status === "SIGNED") await this.retrieveArtifactInternal(adapter, next, actor); return this.repo.get(id, actor); }
}

import assert from "node:assert/strict";
import test from "node:test";
import { TestSignatureProviderAdapter, SignatureProviderRegistry } from "../src/domain/documentation/provider/signature-adapter.js";
import { DocumentationSignatureService } from "../src/domain/documentation/service/signature-service.js";
import { electronicSignatureWorkflowSources } from "../src/domain/documentation/service/contextual-guidance-service.js";

const hash = "a".repeat(64);
const actor = (overrides: any = {}) => ({ user_id: "requester", organization_id: "org-a", active_organization_id: "org-a", tenant_id: "tenant:org-a", permissions: ["documentation.signature.request", "documentation.signature.view", "documentation.signature.session", "documentation.signature.artifact.retrieve", "documentation.signature.void", "documentation.evidence.link", "documentation.retention.assign"], ...overrides });

function harness() {
  const adapter = new TestSignatureProviderAdapter("test-secret");
  const registry = new SignatureProviderRegistry().register(adapter);
  const rows: any[] = [];
  const events: any[] = [];
  const repo: any = {
    async getDocument(id: string, a: any) { return id === "doc-a" && a.organization_id === "org-a" ? { document_instance_id: "doc-a", state: "GENERATED", template_version_id: "tv-1", content_hash: hash } : null; },
    async findIdempotent(key: string) { return rows.find((row) => row.idempotency_key === key) || null; },
    async create(input: any, a: any) { const row = { ...input, signature_request_id: input.signatureRequestId, idempotency_key: input.idempotencyKey, organization_id: a.organization_id, tenant_id: a.tenant_id, status: "DRAFT", created_by_user_id: a.user_id }; rows.push(row); return row; },
    async attachProviderRequest(id: string, provider: any) { const row = rows.find((item) => item.signature_request_id === id); Object.assign(row, { provider_request_reference: provider.providerRequestReference, provider_status: provider.rawStatus, provider_metadata: provider.metadata, status: provider.status }); return row; },
    async get(id: string, a: any) { return rows.find((row) => row.signature_request_id === id && row.organization_id === a.organization_id && row.tenant_id === a.tenant_id) || null; },
    async getByProviderReference(_key: string, _env: string, ref: string) { return rows.find((row) => row.provider_request_reference === ref) || null; },
    async recordProviderEvent(input: any) { if (events.some((event) => event.eventReference === input.eventReference)) return null; events.push(input); return input; },
    async transition(id: string, status: string, event: any, a: any) { const row = await this.get(id, a); const rank: any = { DRAFT: 0, SENT: 1, VIEWED: 2, SIGNED: 3, DECLINED: 3, VOIDED: 3, EXPIRED: 3, FAILED: 3 }; if (rank[status] < rank[row.status] || ["SIGNED", "DECLINED", "VOIDED", "EXPIRED"].includes(row.status)) return row; row.status = status; row.provider_status = event.rawStatus; row.provider_event_reference = event.eventReference; if (status === "SIGNED") row.signed_at = new Date().toISOString(); return row; },
    async attachArtifact(id: string, artifact: any) { const row = rows.find((item) => item.signature_request_id === id); Object.assign(row, { signed_artifact_reference: artifact.reference, signed_artifact_hash: artifact.hash, signed_artifact_media_type: artifact.mediaType, signed_artifact_byte_length: artifact.byteLength }); return row; },
    async attachEvidence(id: string, input: any, a: any) { const row = await this.get(id, a); row.evidence_reference = input.evidenceReference; return row; },
  };
  const storage: any = { files: new Map<string, Buffer>(), async put(key: string, bytes: Buffer) { if (this.files.has(key)) throw new Error("already_exists"); this.files.set(key, bytes); }, async get(key: string) { return this.files.get(key); } };
  return { service: new DocumentationSignatureService(repo, undefined as any, storage, registry), adapter, repo, rows, events, storage };
}

test("request binds exact document/version/hash and test adapter creates a sent request", async () => {
  const h = harness();
  const result: any = await h.service.createRequest(actor(), { documentInstanceId: "doc-a", templateVersionId: "tv-1", contentHash: hash, owningDomain: "SERVICE_AGREEMENTS", signerReference: "user-a", signerRole: "ORG_REPRESENTATIVE", signerCapacity: "authorized representative", providerKey: "test", providerEnvironment: "TEST", idempotencyKey: "sig-1" });
  const replay: any = await h.service.createRequest(actor(), { documentInstanceId: "doc-a", contentHash: hash, owningDomain: "SERVICE_AGREEMENTS", signerReference: "user-a", signerRole: "ORG_REPRESENTATIVE", providerKey: "test", idempotencyKey: "sig-1" });
  assert.equal(result.status, "SENT"); assert.equal(replay.signature_request_id, result.signature_request_id); assert.equal(result.templateVersionId || result.template_version_id, "tv-1");
  await assert.rejects(() => h.service.createRequest(actor(), { documentInstanceId: "doc-a", contentHash: "b".repeat(64), owningDomain: "SERVICE_AGREEMENTS", signerReference: "user-a", signerRole: "ORG_REPRESENTATIVE", providerKey: "test" }), /HASH_MISMATCH/);
});

test("valid callback signs and retrieves a separate artifact; duplicate and stale callbacks are safe", async () => {
  const h = harness(); const created: any = await h.service.createRequest(actor(), { documentInstanceId: "doc-a", contentHash: hash, owningDomain: "SERVICE_AGREEMENTS", signerReference: "user-a", signerRole: "ORG_REPRESENTATIVE", providerKey: "test", idempotencyKey: "sig-2" });
  const body = { eventReference: "evt-signed-1", requestReference: created.provider_request_reference, status: "SIGNED", rawStatus: "completed" }; h.adapter.setStatus(created.provider_request_reference, "SIGNED", "completed"); const signed: any = h.adapter.signWebhook(body);
  const result: any = await h.service.processWebhook("test", "TEST", { "x-test-signature": signed.signature }, JSON.parse(signed.payload));
  assert.equal(result.request.status, "SIGNED"); assert.match(result.request.signed_artifact_reference, /signatures\/org-a/); assert.equal(result.request.signed_artifact_hash.length, 64);
  const duplicate: any = await h.service.processWebhook("test", "TEST", { "x-test-signature": signed.signature }, JSON.parse(signed.payload)); assert.equal(duplicate.duplicate, true);
  const stale = { eventReference: "evt-viewed-after-signed", requestReference: created.provider_request_reference, status: "VIEWED", rawStatus: "viewed" }; const staleSigned: any = h.adapter.signWebhook(stale); const after: any = await h.service.processWebhook("test", "TEST", { "x-test-signature": staleSigned.signature }, JSON.parse(staleSigned.payload)); assert.equal(after.request.status, "SIGNED");
  assert.equal((await h.service.linkEvidence(actor(), created.signature_request_id, "evidence-1")).evidence_reference, "evidence-1");
});

test("forged callbacks, foreign scope, provider selection, and unsafe authority are denied", async () => {
  const h = harness(); const created: any = await h.service.createRequest(actor(), { documentInstanceId: "doc-a", contentHash: hash, owningDomain: "CIVICSURE", signerReference: "provider-a", signerRole: "PROVIDER", providerKey: "test", idempotencyKey: "sig-3" });
  const body = { eventReference: "evt-forged", requestReference: created.provider_request_reference, status: "SIGNED" }; await assert.rejects(() => h.service.processWebhook("test", "TEST", { "x-test-signature": "bad" }, body), /WEBHOOK_INVALID/);
  await assert.rejects(() => h.service.createRequest(actor({ organization_id: "org-b", active_organization_id: "org-b", tenant_id: "tenant:org-b" }), { documentInstanceId: "doc-a", contentHash: hash, owningDomain: "CIVICSURE", signerReference: "provider-a", signerRole: "PROVIDER", providerKey: "test" }), /DOCUMENT_NOT_AVAILABLE/);
  await assert.rejects(() => h.service.createRequest(actor(), { documentInstanceId: "doc-a", contentHash: hash, owningDomain: "CIVICSURE", signerReference: "provider-a", signerRole: "PROVIDER", providerKey: "docusign", providerEnvironment: "PRODUCTION" }), /PROVIDER_NOT_CONFIGURED/);
  assert.equal((await h.service.get(actor(), created.signature_request_id)).evidence_reference, undefined);
});

test("electronic signature guidance is source-traceable and presentation-only", () => {
  const [sent] = electronicSignatureWorkflowSources({ signature: { signature_request_id: "sig-1", document_instance_id: "doc-a", status: "SENT", owning_domain: "SERVICE_AGREEMENTS" } });
  const [signed] = electronicSignatureWorkflowSources({ signature: { signature_request_id: "sig-1", status: "SIGNED" } });
  assert.equal(sent.category, "REQUIRED_NOW"); assert.equal(sent.waitingOn, "YOU"); assert.equal(signed.category, "COMPLETED"); assert.equal(signed.actionTarget, null); assert.match(signed.completionSource, /ELECTRONIC_SIGNATURE/);
});

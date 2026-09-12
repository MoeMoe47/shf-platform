import test from "node:test";
import assert from "node:assert/strict";
import { DocumentationInstanceService } from "../src/domain/documentation/service/documentation-instance-service.js";
import { DocumentationRenderer } from "../src/domain/documentation/service/documentation-renderer.js";

const actor = { user_id: "user-a", organization_id: "org-a", active_organization_id: "org-a", tenant_id: "tenant:org-a", permissions: ["documentation.evidence.link"] };

function template() {
  return { status: "ACTIVE", template_version_id: "tv-1", template_id: "tpl-civic", document_type_id: "dt-civic", template_title: "Provider packet", document_type_title: "Provider evidence", owning_domain: "CIVICSURE", service_key: "civicsure", version_number: 1, revision: "r1", classification: "RESTRICTED_EXTERNAL" };
}

function harness() {
  const instances: any[] = [];
  const packets: any[] = [];
  const links: any[] = [];
  const repo: any = {
    async getTemplateVersion() { return template(); },
    async findByIdempotency(key: string) { return instances.find((item) => item.idempotencyKey === key || item.generation_idempotency_key === key) || null; },
    async createInstance(input: any) { const row = { ...input, document_instance_id: input.documentInstanceId, state: "PENDING", title: input.title, service_key: input.serviceKey }; instances.push(row); return row; },
    async finalize(id: string, _actor: any, result: any, reference: string) { const row = instances.find((item) => item.document_instance_id === id); Object.assign(row, { state: "GENERATED", artifact_reference: reference, artifact_mime_type: result.mimeType, content_hash: result.hash, renderer_version: result.rendererVersion }); return row; },
    async fail(id: string) { const row = instances.find((item) => item.document_instance_id === id); row.state = "FAILED"; return row; },
    async createArtifactLink(input: any) { links.push(input); return input; },
    async get() { return null; },
    async linkEvidence(input: any) { links.push(input); return input; },
    async createPacket(input: any) { const row = { ...input, packet_instance_id: input.packetInstanceId, state: "PENDING" }; packets.push(row); return row; },
    async createPacketItems() {},
    async finalizePacket(id: string, _actor: any, state: string) { const row = packets.find((item) => item.packet_instance_id === id); row.state = state; return row; },
    async getPacket() { return null; },
  };
  const storage: any = { files: new Map(), async put(key: string, bytes: Buffer) { this.files.set(key, bytes); }, async get(key: string) { return this.files.get(key); } };
  return { repo, storage, instances, packets, links };
}

test("renderer produces accessible HTML with deterministic metadata and hash", () => {
  const renderer = new DocumentationRenderer();
  const input = { title: "CivicSure provider", documentType: "Evidence request", templateVersion: "1:r1", organizationId: "org-a", serviceKey: "civicsure", classification: "RESTRICTED_EXTERNAL", structuredData: { case_id: "case-1", provider: "Provider A" } };
  const first = renderer.renderHtml(input);
  const second = renderer.renderHtml(input);
  assert.equal(first.format, "HTML");
  assert.equal(first.accessibility.semanticHtml, true);
  assert.equal(first.hash, second.hash);
  assert.match(first.bytes.toString(), /lang="en"/);
  assert.match(first.bytes.toString(), /scope="row"/);
});

test("document generation binds exact template version, stores artifact metadata, and is idempotent", async () => {
  const h = harness();
  const service = new DocumentationInstanceService(h.repo, new DocumentationRenderer(), h.storage);
  const input = { templateVersionId: "tv-1", serviceKey: "civicsure", sourceReferences: ["evidence-request:1"], structuredData: { case_id: "case-1" }, idempotencyKey: "request-1" };
  const first: any = await service.createDocument(actor, input);
  const replay: any = await service.createDocument(actor, input);
  assert.equal(first.state, "GENERATED");
  assert.equal(first.template_version_id, "tv-1");
  assert.equal(first.artifact.accessibleHtml, true);
  assert.equal(h.instances.length, 1);
  assert.equal(replay.document_instance_id, first.document_instance_id);
  assert.equal(h.links.filter((item) => item.artifactLinkId).length, 1);
});

test("packet manifest is ordered and partial state is honest", async () => {
  const h = harness();
  const service = new DocumentationInstanceService(h.repo, new DocumentationRenderer(), h.storage);
  const result: any = await service.createPacket(actor, { title: "Provider verification packet", items: [
    { itemKey: "guide", itemType: "GUIDANCE", referenceId: "guide-1", sourceOwner: "CIVICSURE", required: true, state: "EXTERNAL" },
    { itemKey: "form", itemType: "DOCUMENT_INSTANCE", referenceId: "missing-doc", sourceOwner: "DGAL", required: true, state: "MISSING" },
  ] });
  assert.equal(result.state, "PARTIAL");
  assert.deepEqual(result.manifest.map((item: any) => item.itemKey), ["guide", "form"]);
  assert.equal(result.manifestHash.length, 64);
});

test("evidence linking requires explicit permission and does not happen during generation", async () => {
  const h = harness();
  const service = new DocumentationInstanceService(h.repo, new DocumentationRenderer(), h.storage);
  const document: any = await service.createDocument(actor, { templateVersionId: "tv-1", structuredData: { field: "value" } });
  assert.equal(h.links.filter((item) => item.evidenceReference).length, 0);
  const link = await service.linkEvidence(actor, document.document_instance_id, { evidenceReference: "evidence-1", relationshipType: "SUPPORTS", owningDomain: "CIVICSURE", sourceReference: "operator-review-1" });
  assert.equal(link.evidenceReference, "evidence-1");
  await assert.rejects(() => service.linkEvidence({ ...actor, permissions: [] }, document.document_instance_id, { evidenceReference: "evidence-2", relationshipType: "SUPPORTS", sourceReference: "review" }), /FORBIDDEN/);
});

test("publication and retention authority cannot be client-invented", async () => {
  const h = harness();
  const service = new DocumentationInstanceService(h.repo, new DocumentationRenderer(), h.storage);
  await assert.rejects(() => service.createDocument(actor, { templateVersionId: "tv-1", classification: "PUBLIC", structuredData: { field: "value" } }), /PUBLICATION/);
  await assert.rejects(() => service.createDocument(actor, { templateVersionId: "tv-1", retentionPolicyKey: "retain-forever", structuredData: { field: "value" } }), /RETENTION_ASSIGN/);
});

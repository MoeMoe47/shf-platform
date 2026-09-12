import test from "node:test";
import assert from "node:assert/strict";
import { DocumentationAgreementService } from "../src/domain/documentation/service/agreement-service.js";
import { agreementWorkflowSources, GUIDANCE_CATEGORIES } from "../src/domain/documentation/service/contextual-guidance-service.js";

const actor = {
  user_id: "user-a",
  organization_id: "org-a",
  active_organization_id: "org-a",
  tenant_id: "tenant:org-a",
  role: "org_admin",
  permissions: ["documentation.acknowledge", "documentation.acknowledgment.view", "documentation.manual_signature.upload", "documentation.manual_signature.verify", "documentation.retention.assign"],
};

function harness() {
  const acknowledgments: any[] = [];
  const signatures: any[] = [];
  const events: any[] = [];
  const files = new Map<string, Buffer>();
  const document = { document_instance_id: "doc-1", state: "GENERATED", template_version_id: "tv-1", content_hash: "a".repeat(64), subject_reference: "onboarding-1", service_key: "reporting", workflow_type: "ONBOARDING", workflow_stage: "AGREEMENT", resource_type: "organization", resource_id: "org-a" };
  const repo: any = {
    async getDocument(id: string, scopedActor: any) { return id === document.document_instance_id && scopedActor.active_organization_id === "org-a" ? document : null; },
    async findAcknowledgment(input: any) { return acknowledgments.find((item) => (input.idempotencyKey && item.idempotency_key === input.idempotencyKey) || (item.actor_user_id === "user-a" && item.document_instance_id === input.documentInstanceId && item.content_hash === input.contentHash)) || null; },
    async createAcknowledgment(input: any, scopedActor: any) { const row = { ...input, acknowledgment_id: input.acknowledgmentId, actor_user_id: scopedActor.user_id, status: "ACKNOWLEDGED", acknowledged_at: new Date().toISOString(), idempotency_key: input.idempotencyKey }; acknowledgments.push(row); return row; },
    async findManualSignatureByIdempotency(key: string) { return signatures.find((item) => item.idempotency_key === key) || null; },
    async createManualSignature(input: any, scopedActor: any) { const row = { ...input, manual_signature_id: input.manualSignatureId, uploaded_by_user_id: scopedActor.user_id, verification_status: "UPLOADED", signed_artifact_reference: input.signedArtifactReference, original_content_hash: input.originalContentHash }; signatures.push(row); return row; },
    async getManualSignature(id: string) { return signatures.find((item) => item.manual_signature_id === id) || null; },
    async transitionManualSignature(id: string, from: string, to: string, scopedActor: any, input: any) { const row = signatures.find((item) => item.manual_signature_id === id); if (!row || row.verification_status !== from) throw new Error("MANUAL_SIGNATURE_STATE_CONFLICT"); row.verification_status = to; row.verified_by_user_id = scopedActor.user_id; row.verification_notes = input.notes; events.push({ from, to, actor: scopedActor.user_id }); return row; },
  };
  const storage: any = { async put(key: string, bytes: Buffer) { if (files.has(key)) throw new Error("DUPLICATE_FILE"); files.set(key, bytes); }, async get(key: string) { return files.get(key); }, async remove(key: string) { files.delete(key); } };
  const agreements = { async resolve(_actor: any, reference: string, version: string) { return reference === "agreement-1" && version === "2" ? { version: { version_number: 2 } } : null; } };
  return { repo, storage, agreements, document, acknowledgments, signatures, events, files };
}

const pdf = () => { const buffer = Buffer.from("%PDF-1.7"); return { originalname: "signed-agreement.pdf", mimetype: "application/pdf", size: buffer.length, buffer }; };

test("acknowledgment is explicit, exact-version bound, server-role derived, and idempotent", async () => {
  const h = harness();
  const service = new DocumentationAgreementService(h.repo, h.storage, h.agreements);
  const first: any = await service.acknowledge(actor, { documentInstanceId: "doc-1", owningDomain: "SERVICE_AGREEMENTS", requirementRuleId: "rule-1", contentHash: "a".repeat(64), actorRole: "forged-client-role", idempotencyKey: "ack-1", sourceAction: "explicit_submit" });
  const replay: any = await service.acknowledge(actor, { documentInstanceId: "doc-1", owningDomain: "SERVICE_AGREEMENTS", requirementRuleId: "rule-1", contentHash: "a".repeat(64), idempotencyKey: "ack-1" });
  assert.equal(first.status, "ACKNOWLEDGED");
  assert.equal(first.actorRole, "org_admin");
  assert.equal(replay.replayed, true);
  assert.equal(h.acknowledgments.length, 1);
});

test("agreement acknowledgment requires a canonical exact agreement version", async () => {
  const h = harness();
  const service = new DocumentationAgreementService(h.repo, h.storage, h.agreements);
  const result: any = await service.acknowledge(actor, { agreementReference: "agreement-1", agreementVersion: "2", owningDomain: "SERVICE_AGREEMENTS", sourceAction: "explicit_submit" });
  assert.equal(result.agreementReference, "agreement-1");
  await assert.rejects(() => service.acknowledge(actor, { agreementReference: "agreement-1", agreementVersion: "9", owningDomain: "SERVICE_AGREEMENTS" }), /AGREEMENT_VERSION_NOT_AVAILABLE/);
});

test("manual upload preserves original identity and remains verification-required", async () => {
  const h = harness();
  const service = new DocumentationAgreementService(h.repo, h.storage, h.agreements);
  const result: any = await service.uploadManualSignature(actor, { documentInstanceId: "doc-1", signerReference: "user-a", signerRole: "organization representative", signerCapacity: "authorized representative", originalContentHash: "a".repeat(64), idempotencyKey: "upload-1" }, pdf());
  assert.equal(result.verification_status, "UPLOADED");
  assert.equal(result.original_content_hash, "a".repeat(64));
  assert.equal(result.signedArtifactHash.length, 64);
  assert.notEqual(result.signedArtifactReference, "doc-1");
  assert.equal(h.files.size, 1);
  assert.equal(h.signatures.length, 1);
});

test("uploader cannot self-verify and authorized verifier can verify or reject", async () => {
  const h = harness();
  const service = new DocumentationAgreementService(h.repo, h.storage, h.agreements);
  const uploaded: any = await service.uploadManualSignature(actor, { documentInstanceId: "doc-1", signerReference: "user-a", signerRole: "representative" }, pdf());
  await assert.rejects(() => service.verifyManualSignature(actor, uploaded.manual_signature_id, { status: "VERIFIED" }), /SELF_VERIFY/);
  const verifier = { ...actor, user_id: "reviewer-1", role: "reviewer_verifier" };
  const verified: any = await service.verifyManualSignature(verifier, uploaded.manual_signature_id, { status: "VERIFIED", notes: "Expected document and signer capacity reviewed." });
  assert.equal(verified.verification_status, "VERIFIED");
  assert.equal(verified.verified_by_user_id, "reviewer-1");
  assert.equal(h.events[0].to, "VERIFIED");
});

test("wrong version, foreign scope, malformed file, and missing signer are denied", async () => {
  const h = harness();
  const service = new DocumentationAgreementService(h.repo, h.storage, h.agreements);
  await assert.rejects(() => service.acknowledge(actor, { documentInstanceId: "doc-1", contentHash: "b".repeat(64) }), /HASH_MISMATCH/);
  await assert.rejects(() => service.acknowledge({ ...actor, organization_id: "org-b", active_organization_id: "org-b", tenant_id: "tenant:org-b" }, { documentInstanceId: "doc-1" }), /EXACT_ITEM_REQUIRED|NOT_AVAILABLE/);
  await assert.rejects(() => service.uploadManualSignature(actor, { documentInstanceId: "doc-1", signerRole: "representative" }, { originalname: "signed.exe", mimetype: "application/octet-stream", size: 4, buffer: Buffer.from("MZ!!") }), /SIGNER_REQUIRED/);
});

test("acknowledgment and manual upload do not create Evidence or Truth state", async () => {
  const h = harness();
  const service = new DocumentationAgreementService(h.repo, h.storage, h.agreements);
  await service.acknowledge(actor, { documentInstanceId: "doc-1" });
  await service.uploadManualSignature(actor, { documentInstanceId: "doc-1", signerReference: "user-a", signerRole: "representative" }, pdf());
  assert.equal(h.acknowledgments[0].evidence_reference, undefined);
  assert.equal(h.signatures[0].evidence_reference, undefined);
});

test("DGAL-2 guidance presents acknowledgment and paper states without granting authority", () => {
  const [acknowledged] = agreementWorkflowSources({ acknowledgment: { acknowledgment_id: "ack-1", owning_domain: "SERVICE_AGREEMENTS", status: "ACKNOWLEDGED", document_instance_id: "doc-1" } });
  assert.equal(acknowledged.category, GUIDANCE_CATEGORIES.COMPLETED);
  assert.equal(acknowledged.waitingOn, null);
  const [pending] = agreementWorkflowSources({ manualSignature: { manual_signature_id: "manual-1", owning_domain: "SERVICE_AGREEMENTS", verification_status: "UPLOADED", document_instance_id: "doc-1" } });
  assert.equal(pending.category, GUIDANCE_CATEGORIES.WAITING_ON_SOMEONE_ELSE);
  assert.equal(pending.waitingOn, "AUTHORIZED_VERIFIER");
  assert.equal(pending.required, true);
});

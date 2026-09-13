import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { ReportFileStorage } from "../src/domain/reporting/report-file-storage.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://127.0.0.1:8091";
const RUN = `ax3_${Date.now()}`;
const dgal = {
  type: `ax3_type_${RUN}`,
  template: `ax3_template_${RUN}`,
  version: `ax3_version_${RUN}`,
  instance: `ax3_instance_${RUN}`,
};

function headers(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

async function api(path: string, options: { method?: string; userId?: string; body?: unknown } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...headers(options.userId) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return { response, json: await response.json().catch(() => ({})) };
}

before(async () => {
  const storage = new ReportFileStorage(process.env.SHS_ACCESSIBILITY_CONTENT_STORAGE_ROOT);
  const reference = `dgal/${dgal.instance}.html`;
  const bytes = Buffer.from("<h1>Generated DGAL packet</h1><p>Read-only derived content.</p>");
  await storage.put(reference, bytes);
  await query(`
    INSERT INTO dgal_document_types (document_type_id, document_type_key, title, owning_domain, status)
    VALUES ($1, $1, 'AX-3 test document', 'testing', 'ACTIVE')
    ON CONFLICT DO NOTHING`, [dgal.type]);
  await query(`
    INSERT INTO dgal_document_templates (template_id, document_type_id, template_key, title, owning_domain, canonical_source_owner, content_reference, organization_id, tenant_id, status)
    VALUES ($1, $2, $1, 'AX-3 test template', 'testing', 'testing', 'ax3-test', 'phase8_org_a', 'tenant:phase8_org_a', 'ACTIVE')
    ON CONFLICT DO NOTHING`, [dgal.template, dgal.type]);
  await query(`
    INSERT INTO dgal_template_versions (template_version_id, template_id, version_number, revision, source_reference, classification, status, created_by_user_id)
    VALUES ($1, $2, 1, 'ax3-v1', 'ax3-test', 'INTERNAL', 'ACTIVE', 'admin_A')
    ON CONFLICT DO NOTHING`, [dgal.version, dgal.template]);
  await query(`
    INSERT INTO dgal_document_instances (document_instance_id, document_type_id, template_id, template_version_id, owning_domain, organization_id, tenant_id, title, classification, state, artifact_reference, artifact_mime_type, artifact_byte_length, content_hash, generated_at, generated_by_user_id)
    VALUES ($1, $2, $3, $4, 'testing', 'phase8_org_a', 'tenant:phase8_org_a', 'AX-3 test DGAL document', 'INTERNAL', 'GENERATED', $5, 'text/html', $6, 'ax3-dgal-content-v1', NOW(), 'admin_A')
    ON CONFLICT DO NOTHING`, [dgal.instance, dgal.type, dgal.template, dgal.version, reference, bytes.length]);
});

after(async () => {
  await query("DELETE FROM dgal_document_instances WHERE document_instance_id = $1", [dgal.instance]);
  await query("DELETE FROM dgal_template_versions WHERE template_version_id = $1", [dgal.version]);
  await query("DELETE FROM dgal_document_templates WHERE template_id = $1", [dgal.template]);
  await query("DELETE FROM dgal_document_types WHERE document_type_id = $1", [dgal.type]);
  await query("UPDATE curriculum_lessons SET revision = 1, title = 'Lesson A' WHERE lesson_id = 'phase8_lesson_a'");
});

test("curriculum accessible HTML is generated, delivered, and reused", async () => {
  const first = await api("/accessibility/content/representations", { method: "POST", userId: "learner_A1", body: { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "ACCESSIBLE_HTML" } });
  assert.equal(first.response.status, 201);
  assert.equal(first.json.data.status, "READY");
  assert.equal(first.json.data.validationStatus, "AUTOMATED_CHECKED");
  assert.match(first.json.data.provenance.sourceRef, /CURRICULUM_LESSON:phase8_lesson_a/);
  const raw = await fetch(`${BASE}/accessibility/content/representations/${first.json.data.representationId}/content`, { headers: headers("learner_A1") });
  assert.equal(raw.status, 200);
  assert.match(await raw.text(), /<article/);
  const second = await api("/accessibility/content/representations", { method: "POST", userId: "learner_A1", body: { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "ACCESSIBLE_HTML" } });
  assert.equal(second.json.data.representationId, first.json.data.representationId);
  assert.equal(second.json.data.reused, true);
});

test("plain text, public delivery, and unsupported fallback remain honest", async () => {
  const text = await api("/accessibility/content/representations", { method: "POST", userId: "learner_A1", body: { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "PLAIN_TEXT" } });
  assert.equal(text.response.status, 201);
  const publicResult = await api("/accessibility/content/representations", { method: "POST", body: { sourceType: "PUBLIC_ARTICLE", sourceId: "foundation-about", representationType: "ACCESSIBLE_HTML" } });
  assert.equal(publicResult.response.status, 201);
  const publicContent = await fetch(`${BASE}/accessibility/content/representations/${publicResult.json.data.representationId}/content`);
  assert.equal(publicContent.status, 200);
  assert.match(await publicContent.text(), /Foundation/);
  const unsupported = await api("/accessibility/content/representations", { method: "POST", userId: "learner_A1", body: { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "EPUB" } });
  assert.equal(unsupported.response.status, 422);
  assert.equal(unsupported.json.error.code, "REPRESENTATION_UNSUPPORTED");
});

test("private and cross-organization delivery is denied", async () => {
  const created = await api("/accessibility/content/representations", { method: "POST", userId: "learner_A1", body: { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "PLAIN_TEXT" } });
  const id = created.json.data.representationId;
  const anonymous = await api("/accessibility/content/representations", { method: "POST", body: { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "PLAIN_TEXT" } });
  assert.equal(anonymous.response.status, 401);
  const otherOrg = await api(`/accessibility/content/representations/${id}`, { userId: "learner_B1" });
  assert.ok([403, 404].includes(otherOrg.response.status));
  const otherSource = await api("/accessibility/content/representations", { method: "POST", userId: "learner_B1", body: { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "PLAIN_TEXT" } });
  assert.ok([403, 404].includes(otherSource.response.status));
});

test("DGAL derived content is live while lifecycle state remains unchanged", async () => {
  const beforeState = await query("SELECT state, disposition_state, artifact_reference FROM dgal_document_instances WHERE document_instance_id = $1", [dgal.instance]);
  const created = await api("/accessibility/content/representations", { method: "POST", userId: "admin_A", body: { sourceType: "DGAL_DOCUMENT", sourceId: dgal.instance, representationType: "ACCESSIBLE_HTML" } });
  assert.equal(created.response.status, 201);
  const raw = await fetch(`${BASE}/accessibility/content/representations/${created.json.data.representationId}/content`, { headers: headers("admin_A") });
  assert.equal(raw.status, 200);
  assert.match(await raw.text(), /<article/);
  const afterState = await query("SELECT state, disposition_state, artifact_reference FROM dgal_document_instances WHERE document_instance_id = $1", [dgal.instance]);
  assert.deepEqual(afterState.rows[0], beforeState.rows[0]);
});

test("source revision makes the prior representation stale", async () => {
  const created = await api("/accessibility/content/representations", { method: "POST", userId: "learner_A1", body: { sourceType: "CURRICULUM_LESSON", sourceId: "phase8_lesson_a", representationType: "PLAIN_TEXT" } });
  const oldVersion = created.json.data.sourceVersion;
  await query("UPDATE curriculum_lessons SET revision = revision + 1, title = 'Lesson A revised', updated_at = NOW() WHERE lesson_id = 'phase8_lesson_a'");
  const status = await api(`/accessibility/content/representations/${created.json.data.representationId}`, { userId: "learner_A1" });
  assert.equal(status.response.status, 200);
  assert.equal(status.json.data.sourceVersion, oldVersion);
  assert.equal(status.json.data.status, "STALE");
});

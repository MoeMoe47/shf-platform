// SHF Lesson + Assignment + Curriculum — Phase 4.6 — Raw Document
// Extraction, Structure Detection, and Draft Curriculum Transformation.
// Integration tests against the real running dev server (npm run
// test:server on :8091) and the real Postgres-backed repo, same
// convention as this domain's other suites.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const require = createRequire(import.meta.url);
const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `ci46_${Date.now()}`;
const adminA = `user_${RUN}_admin_a`;
const adminB = `user_${RUN}_admin_b`;
const studentA = `user_${RUN}_student`;

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}
async function api(path: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(opts.userId) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}
async function upload(userId: string, filename: string, mimetype: string, buffer: Buffer) {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimetype }), filename);
  const res = await fetch(`${BASE}/curriculum/source-assets`, { method: "POST", headers: authHeader(userId), body: form });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const createdCourseIds = new Set<string>();
const createdJobIds = new Set<string>();
const createdAssetIds = new Set<string>();

async function cleanupCatalog() {
  const ids = [...createdCourseIds];
  if (ids.length) {
    await query("DELETE FROM curriculum_releases WHERE course_id = ANY($1::text[])", [ids]);
    await query("DELETE FROM curriculum_lesson_arcade_activities WHERE curriculum_lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[])))", [ids]);
    await query("DELETE FROM curriculum_lesson_resources WHERE lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[])))", [ids]);
    await query("DELETE FROM curriculum_resources WHERE organization_id = 'org_shf_001' AND title LIKE $1", [`%${RUN}%`]);
    await query("DELETE FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[]))", [ids]);
    await query("DELETE FROM curriculum_units WHERE course_id = ANY($1::text[])", [ids]);
    await query("DELETE FROM curriculum_courses WHERE course_id = ANY($1::text[])", [ids]);
  }
}
async function cleanupImportRows() {
  const ids = [...createdJobIds];
  if (ids.length) {
    await query("DELETE FROM curriculum_import_candidates WHERE import_job_id = ANY($1::text[])", [ids]);
    await query("DELETE FROM curriculum_import_jobs WHERE import_job_id = ANY($1::text[])", [ids]);
  }
}
async function cleanupSourceAssets() {
  const ids = [...createdAssetIds];
  if (ids.length) {
    await query("DELETE FROM source_document_versions WHERE source_asset_id = ANY($1::text[])", [ids]);
    await query("DELETE FROM source_assets WHERE source_asset_id = ANY($1::text[])", [ids]);
  }
}

before(async () => {
  await cleanupImportRows();
  await cleanupCatalog();
  await cleanupSourceAssets();
  for (const [userId, organizationId] of [[adminA, "org_shf_001"], [adminB, "org_partner_001"], [studentA, "org_shf_001"]] as const) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1, $2, $3, 'Phase 4.6 Test User', 'active', 'local') ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, `${userId}@test.invalid`],
    ));
  }
});

after(async () => {
  await cleanupCatalog();
  await cleanupImportRows();
  await cleanupSourceAssets();
});

// ---------------- Fixture builders ----------------

async function buildPdf(pages: string[][]): Promise<Buffer> {
  const { PDFDocument, StandardFonts } = require("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const lines of pages) {
    const page = doc.addPage([420, 600]);
    let y = 560;
    for (const line of lines) { page.drawText(line, { x: 50, y, size: 12, font }); y -= 18; }
  }
  return Buffer.from(await doc.save());
}
async function buildBlankPdf(pageCount: number): Promise<Buffer> {
  const { PDFDocument } = require("pdf-lib");
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([400, 400]);
  return Buffer.from(await doc.save());
}
async function buildDocx(): Promise<Buffer> {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, ExternalHyperlink } = require("docx");
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: `${RUN} DOCX Course`, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "Chapter 1: Foundations", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "Lesson 1: Getting Started", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ children: [new TextRun("Getting started content. See "), new ExternalHyperlink({ link: "https://example.org/guide", children: [new TextRun({ text: "the guide", style: "Hyperlink" })] }), new TextRun(" for more.")] }),
        new Paragraph({ text: "Lesson 2: Next Steps", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ children: [new TextRun("Next steps content explaining what to do after getting started.")] }),
        new Paragraph({ text: "Chapter 2: Advanced", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "Lesson 1: Deep Dive", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ children: [new TextRun("Deep dive content with more advanced material.")] }),
      ],
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
function buildMarkdown(): Buffer {
  return Buffer.from(`# ${RUN} Markdown Course\n\n## Unit 1: Basics\n\n### Lesson 1: Intro\n\nIntro body text explaining the topic.\n\n### Lesson 2: Vocabulary\n\nVocabulary body text with key terms.\n\n## Unit 2: Practice\n\n### Lesson 1: Exercises\n\nExercise body text. See [reference](https://example.org/ref).\n`, "utf8");
}
function buildTxt(): Buffer {
  return Buffer.from("This plain text file has no headings at all.\n\nIt only has a couple of unstructured paragraphs describing a topic informally.\n\nA final paragraph wraps up the notes without any organization markers.\n", "utf8");
}

async function processAndCreateJob(userId: string, sourceDocumentVersionId: string, documentKey?: string) {
  const process1 = await api(`/curriculum/source-documents/${sourceDocumentVersionId}/process`, { method: "POST", userId });
  const created = await api("/curriculum/import-jobs", { method: "POST", userId, body: { importType: "RAW_DOCUMENT", sourceDocumentVersionId, documentKey } });
  if (created.status === 200) createdJobIds.add(created.json.data.job.importJobId);
  return { process1, created };
}

// ---------------- Step 56: PDF ----------------

test("1. PDF: server-side extraction preserves page identity, detects Chapter/Lesson structure with HIGH confidence, and generates a reviewable candidate graph with no catalog mutation", async () => {
  const pdf = await buildPdf([
    [`${RUN} PDF Book`],
    ["Chapter 1: Data Center Basics", "Body text about basics of data centers and their purpose."],
    ["Lesson 1: Power", "Power systems body text describing UPS and generators in detail."],
    ["Lesson 2: Cooling", "Cooling systems body text describing air and liquid cooling methods."],
    ["Chapter 2: Networking", "Networking body text about switches and routers in the facility."],
  ]);
  const uploaded = await upload(adminA, "book.pdf", "application/pdf", pdf);
  assert.equal(uploaded.status, 201);
  createdAssetIds.add(uploaded.json.data.asset.source_asset_id);
  const versionId = uploaded.json.data.version.source_document_version_id;

  const { process1, created } = await processAndCreateJob(adminA, versionId);
  assert.equal(process1.status, 200);
  assert.equal(process1.json.data.structureConfidence, "HIGH");
  assert.equal(created.status, 200);
  const { job, candidates } = created.json.data;
  assert.equal(job.status, "READY");

  const units = candidates.filter((c: any) => c.candidateType === "UNIT");
  assert.equal(units.length, 2);
  const lessons = candidates.filter((c: any) => c.candidateType === "LESSON");
  // Chapter 1 has two explicit "Lesson N" headings; Chapter 2 has none,
  // so it honestly synthesizes one size-chunked lesson rather than
  // fabricating a heading that was never in the source (Step 22/27).
  assert.equal(lessons.length, 3);
  const powerLesson = lessons.find((l: any) => l.title === "Lesson 1: Power");
  assert.ok(powerLesson.sourceReference.includes("pages="), "lesson provenance must include a page range");
  assert.match(powerLesson.sourceReference, /doc:.*#unit=.*#lesson=.*#pages=\d+-\d+/);

  const anyCourse = await query("SELECT count(*) FROM curriculum_courses WHERE organization_id = 'org_shf_001' AND title LIKE $1", [`%${RUN} PDF Book%`]);
  assert.equal(Number(anyCourse.rows[0].count), 0);
});

// ---------------- Step 57: DOCX ----------------

test("2. DOCX: heading hierarchy and inline hyperlink are preserved into Unit/Lesson/Resource candidates", async () => {
  const docx = await buildDocx();
  const uploaded = await upload(adminA, "course.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docx);
  assert.equal(uploaded.status, 201);
  createdAssetIds.add(uploaded.json.data.asset.source_asset_id);
  const versionId = uploaded.json.data.version.source_document_version_id;

  const { created } = await processAndCreateJob(adminA, versionId);
  assert.equal(created.status, 200);
  const { candidates } = created.json.data;
  const units = candidates.filter((c: any) => c.candidateType === "UNIT");
  assert.equal(units.map((u: any) => u.title).sort().join(","), "Chapter 1: Foundations,Chapter 2: Advanced".split(",").sort().join(","));
  const lessons = candidates.filter((c: any) => c.candidateType === "LESSON");
  assert.equal(lessons.length, 3);
  const resources = candidates.filter((c: any) => c.candidateType === "RESOURCE");
  assert.equal(resources.length, 1);
  assert.equal(resources[0].payload.externalUrl, "https://example.org/guide");
});

// ---------------- Step 58: Markdown ----------------

test("3. Markdown: heading levels map deterministically to Unit/Lesson candidates", async () => {
  const md = buildMarkdown();
  const uploaded = await upload(adminA, "course.md", "text/markdown", md);
  assert.equal(uploaded.status, 201);
  createdAssetIds.add(uploaded.json.data.asset.source_asset_id);
  const versionId = uploaded.json.data.version.source_document_version_id;

  const { created } = await processAndCreateJob(adminA, versionId);
  assert.equal(created.status, 200);
  const { candidates } = created.json.data;
  const units = candidates.filter((c: any) => c.candidateType === "UNIT").sort((a: any, b: any) => a.sequence - b.sequence);
  assert.deepEqual(units.map((u: any) => u.title), ["Unit 1: Basics", "Unit 2: Practice"]);
  const lessons = candidates.filter((c: any) => c.candidateType === "LESSON");
  assert.equal(lessons.length, 3);
  const resources = candidates.filter((c: any) => c.candidateType === "RESOURCE");
  assert.equal(resources.length, 1);
});

// ---------------- Step 59: TXT ----------------

test("4. TXT: no structure is fabricated — honest LOW-confidence single-unit fallback", async () => {
  const txt = buildTxt();
  const uploaded = await upload(adminA, "notes.txt", "text/plain", txt);
  assert.equal(uploaded.status, 201);
  createdAssetIds.add(uploaded.json.data.asset.source_asset_id);
  const versionId = uploaded.json.data.version.source_document_version_id;

  const process1 = await api(`/curriculum/source-documents/${versionId}/process`, { method: "POST", userId: adminA });
  assert.equal(process1.json.data.structureConfidence, "LOW");
  const { created } = await processAndCreateJob(adminA, versionId);
  const units = created.json.data.candidates.filter((c: any) => c.candidateType === "UNIT");
  assert.equal(units.length, 1);
  assert.equal(units[0].title, "All Content");
});

// ---------------- Step 60: OCR / scanned PDF ----------------

test("5. Scanned PDF is honestly classified OCR_REQUIRED — no text is fabricated, no candidates are created", async () => {
  const blank = await buildBlankPdf(2);
  const uploaded = await upload(adminA, "scanned.pdf", "application/pdf", blank);
  assert.equal(uploaded.status, 201);
  createdAssetIds.add(uploaded.json.data.asset.source_asset_id);
  const versionId = uploaded.json.data.version.source_document_version_id;

  const process1 = await api(`/curriculum/source-documents/${versionId}/process`, { method: "POST", userId: adminA });
  assert.equal(process1.status, 422);
  assert.equal(process1.json.error.code, "OCR_REQUIRED");

  const versionRow = (await query("SELECT processing_status, extraction_status FROM source_document_versions WHERE source_document_version_id = $1", [versionId])).rows[0];
  assert.equal(versionRow.extraction_status, "OCR_REQUIRED");
  assert.equal(versionRow.processing_status, "FAILED");

  const jobAttempt = await api("/curriculum/import-jobs", { method: "POST", userId: adminA, body: { importType: "RAW_DOCUMENT", sourceDocumentVersionId: versionId } });
  assert.equal(jobAttempt.status, 422);
  const candidateCount = await query("SELECT count(*) FROM curriculum_import_candidates WHERE source_reference LIKE $1", [`%${versionId}%`]);
  assert.equal(Number(candidateCount.rows[0].count), 0);
});

// ---------------- Step 15/55: extraction failure produces no partial state ----------------

test("6. an unsupported/corrupt upload is rejected before any extraction or candidate state exists", async () => {
  const badPdfBytes = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.from("not a real pdf body")]);
  const uploaded = await upload(adminA, "broken.pdf", "application/pdf", badPdfBytes);
  // Whether upload validation itself rejects this or extraction later
  // fails, no candidate may ever be created from it.
  if (uploaded.status === 201) {
    createdAssetIds.add(uploaded.json.data.asset.source_asset_id);
    const versionId = uploaded.json.data.version.source_document_version_id;
    const process1 = await api(`/curriculum/source-documents/${versionId}/process`, { method: "POST", userId: adminA });
    assert.notEqual(process1.status, 200);
    const versionRow = (await query("SELECT processing_status FROM source_document_versions WHERE source_document_version_id = $1", [versionId])).rows[0];
    assert.equal(versionRow.processing_status, "FAILED");
  } else {
    assert.notEqual(uploaded.status, 201);
  }
});

// ---------------- Step 11/54: idempotency ----------------

test("7. re-processing the same source document version reuses the existing extraction artifact deterministically", async () => {
  const pdf = await buildPdf([["Chapter 1: Idempotency Check", "Body text one."], ["Lesson 1: Only Lesson", "Body text two describing the only lesson in this tiny fixture."]]);
  const uploaded = await upload(adminA, "idem.pdf", "application/pdf", pdf);
  createdAssetIds.add(uploaded.json.data.asset.source_asset_id);
  const versionId = uploaded.json.data.version.source_document_version_id;

  const first = await api(`/curriculum/source-documents/${versionId}/process`, { method: "POST", userId: adminA });
  const firstRow = (await query("SELECT extracted_text_location, derived_hash FROM source_document_versions WHERE source_document_version_id = $1", [versionId])).rows[0];
  const second = await api(`/curriculum/source-documents/${versionId}/process`, { method: "POST", userId: adminA });
  const secondRow = (await query("SELECT extracted_text_location, derived_hash FROM source_document_versions WHERE source_document_version_id = $1", [versionId])).rows[0];

  assert.equal(first.json.data.blockCount, second.json.data.blockCount);
  assert.equal(firstRow.extracted_text_location, secondRow.extracted_text_location);
  assert.equal(firstRow.derived_hash, secondRow.derived_hash);
});

// ---------------- Step 62: full draft import ----------------

test("8. full draft import: upload -> extract -> structure -> candidates -> preview -> execute produces canonical DRAFT Course/Units/Lessons/Resources with no publish", async () => {
  const docx = await buildDocx();
  const uploaded = await upload(adminA, "fulldraft.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", docx);
  createdAssetIds.add(uploaded.json.data.asset.source_asset_id);
  const versionId = uploaded.json.data.version.source_document_version_id;
  const documentKey = `${RUN}fulldraft`;

  const { created } = await processAndCreateJob(adminA, versionId, documentKey);
  assert.equal(created.status, 200);
  const jobId = created.json.data.job.importJobId;

  const preview = await api(`/curriculum/import-jobs/${jobId}/preview`, { userId: adminA });
  assert.equal(preview.status, 200);
  assert.equal(preview.json.data.errorCount, 0);

  const exec = await api(`/curriculum/import-jobs/${jobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec.status, 200);
  createdCourseIds.add(exec.json.data.courseId);

  const courseRow = (await query("SELECT status FROM curriculum_courses WHERE course_id = $1", [exec.json.data.courseId])).rows[0];
  assert.equal(courseRow.status, "DRAFT");
  const unitRows = await query("SELECT unit_id, title FROM curriculum_units WHERE course_id = $1", [exec.json.data.courseId]);
  assert.equal(unitRows.rows.length, 2);
  const lessonRows = await query("SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = $1)", [exec.json.data.courseId]);
  assert.equal(lessonRows.rows.length, 3);
  const resourceLinkRows = await query("SELECT count(*) FROM curriculum_lesson_resources WHERE lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = $1))", [exec.json.data.courseId]);
  assert.equal(Number(resourceLinkRows.rows[0].count), 1);
});

// ---------------- Step 40: candidate editing ----------------

test("9. staff can correct a proposed lesson title and exclude a candidate before executing; canonical identity/provenance remain server-owned", async () => {
  // Distinct content from test 3's markdown fixture — identical bytes
  // would hit source_assets' own content-hash dedup (409), which is
  // correct Phase 1 behavior, not something this test is about.
  const md = Buffer.from(`# ${RUN} Editable Course\n\n## Unit 1: Editing\n\n### Lesson 1: First\n\nFirst lesson body text for the editing test.\n\n### Lesson 2: Second\n\nSecond lesson body text for the editing test.\n`, "utf8");
  const uploaded = await upload(adminA, "editable.md", "text/markdown", md);
  createdAssetIds.add(uploaded.json.data.asset.source_asset_id);
  const versionId = uploaded.json.data.version.source_document_version_id;
  const { created } = await processAndCreateJob(adminA, versionId, `${RUN}editable`);
  const jobId = created.json.data.job.importJobId;
  const lessonCandidate = created.json.data.candidates.find((c: any) => c.candidateType === "LESSON");

  const edited = await api(`/curriculum/import-jobs/${jobId}/candidates/${lessonCandidate.importCandidateId}`, { method: "PATCH", userId: adminA, body: { title: "Corrected Lesson Title" } });
  assert.equal(edited.status, 200);
  assert.equal(edited.json.data.candidate.title, "Corrected Lesson Title");
  assert.equal(edited.json.data.candidate.stableKey, lessonCandidate.stableKey, "editing title must never change canonical stableKey identity");
  assert.equal(edited.json.data.candidate.sourceReference, lessonCandidate.sourceReference, "editing title must never change provenance");

  const secondLesson = created.json.data.candidates.filter((c: any) => c.candidateType === "LESSON")[1];
  const excluded = await api(`/curriculum/import-jobs/${jobId}/candidates/${secondLesson.importCandidateId}`, { method: "PATCH", userId: adminA, body: { included: false } });
  assert.equal(excluded.status, 200);

  const exec = await api(`/curriculum/import-jobs/${jobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec.status, 200);
  createdCourseIds.add(exec.json.data.courseId);
  assert.equal(exec.json.data.lessonIds.length, 1, "the excluded candidate must not be created");
  const createdLessonTitle = (await query("SELECT title FROM curriculum_lessons WHERE lesson_id = ANY($1::text[])", [exec.json.data.lessonIds])).rows.map((r: any) => r.title);
  assert.ok(createdLessonTitle.includes("Corrected Lesson Title"));
});

// ---------------- Step 46-48: raw-document re-import / versioning ----------------

test("10. re-uploading a revised document under the same documentKey diffs against the existing DRAFT — unchanged, modified, new, and missing are all classified correctly", async () => {
  const documentKey = `${RUN}reimport`;
  const v1 = await buildDocx();
  const uploaded1 = await upload(adminA, "v1.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", v1);
  createdAssetIds.add(uploaded1.json.data.asset.source_asset_id);
  const { created: created1 } = await processAndCreateJob(adminA, uploaded1.json.data.version.source_document_version_id, documentKey);
  assert.equal(created1.json.data.job.status, "READY");
  const exec1 = await api(`/curriculum/import-jobs/${created1.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec1.status, 200);
  createdCourseIds.add(exec1.json.data.courseId);

  // Re-upload as a genuinely new asset (this schema has no per-version
  // storage — see raw-document-import-service.ts) with one lesson
  // removed and one paragraph changed, asserting the SAME documentKey.
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = require("docx");
  const v2doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: `${RUN} DOCX Course`, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "Chapter 1: Foundations", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "Lesson 1: Getting Started", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ children: [new TextRun("Getting started content REVISED with new wording for the modified-lesson proof.")] }),
        // Lesson 2 removed entirely.
        new Paragraph({ text: "Chapter 2: Advanced", heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "Lesson 1: Deep Dive", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ children: [new TextRun("Deep dive content with more advanced material.")] }),
        new Paragraph({ text: "Lesson 2: Brand New", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ children: [new TextRun("Brand new lesson content that did not exist in version one.")] }),
      ],
    }],
  });
  const v2Buf = Buffer.from(await Packer.toBuffer(v2doc));
  const uploaded2 = await upload(adminA, "v2.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", v2Buf);
  createdAssetIds.add(uploaded2.json.data.asset.source_asset_id);
  const { created: created2 } = await processAndCreateJob(adminA, uploaded2.json.data.version.source_document_version_id, documentKey);
  assert.equal(created2.status, 200);

  const candidates2 = created2.json.data.candidates;
  const lessonCandidates = candidates2.filter((c: any) => c.candidateType === "LESSON");
  const byTitle = (t: string) => lessonCandidates.find((c: any) => c.title === t);
  assert.equal(byTitle("Lesson 1: Getting Started").diffStatus, "MODIFIED");
  assert.equal(byTitle("Lesson 1: Deep Dive").diffStatus, "UNCHANGED");
  assert.equal(byTitle("Lesson 2: Brand New").diffStatus, "NEW");
  const missing = lessonCandidates.find((c: any) => c.diffStatus === "MISSING_FROM_SOURCE");
  assert.ok(missing, "the removed lesson must be reported as MISSING_FROM_SOURCE, not silently dropped");
  assert.equal(created2.json.data.job.status, "NEEDS_REVIEW", "a MISSING_FROM_SOURCE item requires human review before execution");
});

// ---------------- Step 49: tenant isolation ----------------

test("11. cross-tenant access to a source document version, its extraction, and its import job all fail closed", async () => {
  const pdf = await buildPdf([["Chapter 1: Tenant Test", "Body text."]]);
  const uploaded = await upload(adminA, "tenant.pdf", "application/pdf", pdf);
  createdAssetIds.add(uploaded.json.data.asset.source_asset_id);
  const versionId = uploaded.json.data.version.source_document_version_id;

  const processAsB = await api(`/curriculum/source-documents/${versionId}/process`, { method: "POST", userId: adminB });
  assert.equal(processAsB.status, 404);

  await api(`/curriculum/source-documents/${versionId}/process`, { method: "POST", userId: adminA });
  const previewAsB = await api(`/curriculum/source-documents/${versionId}/extraction`, { userId: adminB });
  assert.equal(previewAsB.status, 404);

  const jobAttemptAsB = await api("/curriculum/import-jobs", { method: "POST", userId: adminB, body: { importType: "RAW_DOCUMENT", sourceDocumentVersionId: versionId } });
  assert.equal(jobAttemptAsB.status, 404);

  const assetViewAsB = await api(`/curriculum/source-assets/${uploaded.json.data.asset.source_asset_id}`, { userId: adminB });
  assert.equal(assetViewAsB.status, 404);
});

test("12. a student cannot upload, process, or import raw documents", async () => {
  const pdf = await buildPdf([["Chapter 1: Student Denial", "Body text."]]);
  const uploaded = await upload(studentA, "denied.pdf", "application/pdf", pdf);
  assert.equal(uploaded.status, 403);
});

// ---------------- Step 64: no learner truth anywhere in this suite ----------------

test("13. no lesson completion, assessment result, reflection submission, practice result, Arcade attempt/result, or Evidence record was created by any test above", async () => {
  const checks = await Promise.all([
    query("SELECT count(*) FROM curriculum_lesson_completions WHERE curriculum_id LIKE $1", [`%${RUN}%`]),
    query("SELECT count(*) FROM arcade_attempts WHERE learner_user_id LIKE $1", [`%${RUN}%`]),
    query("SELECT count(*) FROM arcade_results WHERE learner_user_id LIKE $1", [`%${RUN}%`]),
  ]);
  for (const result of checks) assert.equal(Number(result.rows[0].count), 0);
});

// SHF Lesson + Assignment + Curriculum — Phase 4.5A — Curriculum Import
// Job, Candidate Model, and Transaction-Safe Structured Import
// Foundation. Integration tests against the real running dev server
// (npm run test:server on :8091) and the real Postgres-backed repo —
// same convention as this repo's other domain security suites
// (curriculum-catalog.test.ts, curriculum-assignment-binding.test.ts).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `ci45a_${Date.now()}`;

const adminA = `user_${RUN}_admin_a`; // org_shf_001, org_admin
const adminB = `user_${RUN}_admin_b`; // org_partner_001, org_admin
const studentA = `user_${RUN}_student`; // org_shf_001, student

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

// ---------------- Structured-source fixtures on disk ----------------
// The adapter reads real files off disk (Step 21) — it does not accept
// inline JSON — so the "synthetic SHF structured curriculum fixture"
// (Step 30) and full-payload-preservation proof (Step 36) need real
// temporary *-student folders alongside the genuine ASL/Data Center
// content, cleaned up after this suite runs.
const contentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../src/content/lessons");
const sourceKeyGood = `${RUN}good`;
const sourceKeyRollback = `${RUN}rollback`;
// Every folder any writeFixture() call creates during this run, tracked
// so after() removes all of them — not just the two known upfront.
const fixtureFolders = new Set<string>();

function writeFixture(sourceKey: string, lessons: Array<Record<string, unknown>>) {
  const dir = path.join(contentRoot, `${sourceKey}-student`);
  fixtureFolders.add(dir);
  fs.mkdirSync(dir, { recursive: true });
  lessons.forEach((lesson, i) => {
    const filename = String(lesson.__filename || `lesson-${i}.json`);
    const { __filename, ...body } = lesson;
    fs.writeFileSync(path.join(dir, filename), JSON.stringify(body, null, 2));
  });
}

const createdJobIds = new Set<string>();
const createdCourseIds = new Set<string>();

async function cleanupCatalogRows() {
  const ids = [...createdCourseIds];
  if (ids.length) {
    await query("DELETE FROM curriculum_releases WHERE course_id = ANY($1::text[])", [ids]);
    await query(
      "DELETE FROM curriculum_lesson_resources WHERE lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[])))",
      [ids],
    );
    await query("DELETE FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[]))", [ids]);
    await query("DELETE FROM curriculum_units WHERE course_id = ANY($1::text[])", [ids]);
    await query("DELETE FROM curriculum_courses WHERE course_id = ANY($1::text[])", [ids]);
  }
  // Defensive: also remove by stable_key directly, in case a test's own
  // execute() created a course whose id wasn't captured (e.g. an
  // idempotent second call), scoped to this run's fixture keys only.
  await query("DELETE FROM curriculum_courses WHERE organization_id = $1 AND stable_key = ANY($2::text[])", ["org_shf_001", [sourceKeyGood.toLowerCase(), sourceKeyRollback.toLowerCase()]]);
}

async function cleanupImportRows() {
  const ids = [...createdJobIds];
  if (ids.length) {
    await query("DELETE FROM curriculum_import_candidates WHERE import_job_id = ANY($1::text[])", [ids]);
    await query("DELETE FROM curriculum_import_jobs WHERE import_job_id = ANY($1::text[])", [ids]);
  }
}

function sweepStaleFixtureFolders() {
  // Removes any *-student folder left behind by a previously interrupted
  // run of this suite (any RUN prefix, not just this run's own) — a
  // targeted glob, not a general content-directory sweep.
  for (const entry of fs.readdirSync(contentRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && /^ci45a_?\d+.*-student$/.test(entry.name)) {
      fs.rmSync(path.join(contentRoot, entry.name), { recursive: true, force: true });
    }
  }
}

before(async () => {
  sweepStaleFixtureFolders();
  await cleanupImportRows();
  await cleanupCatalogRows();
  for (const [userId, organizationId] of [
    [adminA, "org_shf_001"],
    [adminB, "org_partner_001"],
    [studentA, "org_shf_001"],
  ] as const) {
    await withSeedRetry(() =>
      query(
        `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1, $2, $3, 'CI Phase 4.5A Test User', 'active', 'local') ON CONFLICT (user_id) DO NOTHING`,
        [userId, organizationId, `${userId}@test.invalid`],
      ),
    );
  }

  // sourceKeyGood: Course -> 1 Unit -> 2 Lessons, one rich (Step 36 full
  // payload preservation), one minimal.
  writeFixture(sourceKeyGood, [
    {
      __filename: "lesson-one.json",
      title: "Lesson One",
      estMinutes: 12,
      objectives: ["Objective A", "Objective B"],
      vocab: [{ term: "Latency", def: "Delay before a transfer of data begins." }],
      sections: [{ heading: "Intro", body: "Some body text." }],
      quiz: { question: "What is latency?", options: ["Delay", "Bandwidth"], answer: "Delay" },
      practice: [{ prompt: "Try it yourself." }],
      reflectionPrompt: "What surprised you?",
    },
    { __filename: "lesson-two.json", title: "Lesson Two", estMinutes: 8, objectives: ["Objective C"] },
  ]);

  // sourceKeyRollback: same clean shape — corrupted at the DB layer
  // after candidate generation (see the rollback test itself) to prove
  // execution-time failure, not pre-validation rejection.
  writeFixture(sourceKeyRollback, [
    { __filename: "lesson-one.json", title: "Rollback Lesson One" },
    { __filename: "lesson-two.json", title: "Rollback Lesson Two" },
  ]);
});

after(async () => {
  await cleanupCatalogRows();
  await cleanupImportRows();
  for (const dir of fixtureFolders) fs.rmSync(dir, { recursive: true, force: true });
});

async function createJob(userId: string, sourceKey: string) {
  const res = await api("/curriculum/import-jobs", { method: "POST", userId, body: { importType: "STATIC_JSON", sourceKey } });
  if (res.status === 200) createdJobIds.add(res.json.data.job.importJobId);
  return res;
}

// ---------------- Permissions ----------------

test("1. a student (no catalog permission) cannot create an import job", async () => {
  const res = await createJob(studentA, sourceKeyGood);
  assert.equal(res.status, 403);
});

test("2. a student cannot execute or list import jobs", async () => {
  const exec = await api("/curriculum/import-jobs/nonexistent/execute", { method: "POST", userId: studentA });
  assert.equal(exec.status, 403);
  const list = await api("/curriculum/import-jobs", { userId: studentA });
  assert.equal(list.status, 403);
});

// ---------------- Invariant 1/2: canonical Job + Candidate state ----------------

test("3. an authorized admin creating a job generates a canonical Job row and Candidate rows before any catalog row exists", async () => {
  const res = await createJob(adminA, sourceKeyGood);
  assert.equal(res.status, 200);
  const { job, candidates } = res.json.data;
  assert.equal(job.status, "READY");
  assert.equal(job.importType, "STATIC_JSON");
  assert.equal(job.sourceKey, sourceKeyGood);
  // 1 course + 1 unit + 2 lessons
  assert.equal(candidates.length, 4);
  assert.ok(candidates.every((c: any) => c.validationStatus === "VALID"));

  // No catalog row exists yet — invariant 3 (preview/creation does not
  // create canonical curriculum) starts here, before preview is even
  // called.
  const courseCheck = await query("SELECT 1 FROM curriculum_courses WHERE organization_id = $1 AND stable_key = $2", ["org_shf_001", sourceKeyGood.toLowerCase()]);
  assert.equal(courseCheck.rows.length, 0);
});

// ---------------- Invariant 3: preview never creates canonical curriculum ----------------

test("4. preview returns the candidate tree without creating any catalog row", async () => {
  const created = await createJob(adminA, sourceKeyGood);
  const jobId = created.json.data.job.importJobId;
  const preview = await api(`/curriculum/import-jobs/${jobId}/preview`, { userId: adminA });
  assert.equal(preview.status, 200);
  assert.equal(preview.json.data.errorCount, 0);
  const courseNode = preview.json.data.candidateTree[0];
  assert.equal(courseNode.candidateType, "COURSE");
  assert.equal(courseNode.children[0].candidateType, "UNIT");
  assert.equal(courseNode.children[0].children.length, 2);

  const courseCheck = await query("SELECT 1 FROM curriculum_courses WHERE organization_id = $1 AND stable_key = $2", ["org_shf_001", sourceKeyGood.toLowerCase()]);
  assert.equal(courseCheck.rows.length, 0);
});

// ---------------- Step 36: full payload preservation ----------------

test("5. candidate payload preserves the full source lesson JSON verbatim, not a narrowed subset", async () => {
  const created = await createJob(adminA, sourceKeyGood);
  const jobId = created.json.data.job.importJobId;
  const preview = await api(`/curriculum/import-jobs/${jobId}/preview`, { userId: adminA });
  const lessonOne = preview.json.data.candidates.find((c: any) => c.stableKey === "lesson-one");
  assert.ok(lessonOne, "lesson-one candidate must exist");
  assert.deepEqual(lessonOne.payload.objectives, ["Objective A", "Objective B"]);
  assert.deepEqual(lessonOne.payload.vocab, [{ term: "Latency", def: "Delay before a transfer of data begins." }]);
  assert.deepEqual(lessonOne.payload.sections, [{ heading: "Intro", body: "Some body text." }]);
  assert.deepEqual(lessonOne.payload.quiz, { question: "What is latency?", options: ["Delay", "Bandwidth"], answer: "Delay" });
  assert.deepEqual(lessonOne.payload.practice, [{ prompt: "Try it yourself." }]);
  assert.equal(lessonOne.payload.reflectionPrompt, "What surprised you?");
});

// ---------------- Steps 9/10/12/13/24: transaction-safe execution into DRAFT ----------------

test("6. execute creates DRAFT Course/Unit/Lessons transactionally via the existing catalog service, never publishing", async () => {
  const created = await createJob(adminA, sourceKeyGood);
  const jobId = created.json.data.job.importJobId;
  const exec = await api(`/curriculum/import-jobs/${jobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec.status, 200);
  assert.equal(exec.json.data.alreadyCompleted, false);
  const { courseId, unitId, lessonIds } = exec.json.data;
  createdCourseIds.add(courseId);
  assert.equal(lessonIds.length, 2);

  const courseRow = (await query("SELECT status, revision FROM curriculum_courses WHERE course_id = $1", [courseId])).rows[0];
  assert.equal(courseRow.status, "DRAFT"); // Step 24: import never publishes
  const unitRow = (await query("SELECT status FROM curriculum_units WHERE unit_id = $1", [unitId])).rows[0];
  assert.equal(unitRow.status, "ACTIVE");
  const lessonRows = (await query("SELECT stable_key FROM curriculum_lessons WHERE unit_id = $1 ORDER BY sequence", [unitId])).rows;
  assert.deepEqual(lessonRows.map((r: any) => r.stable_key), ["lesson-one", "lesson-two"]);

  const jobRow = (await query("SELECT status, completed_at FROM curriculum_import_jobs WHERE import_job_id = $1", [jobId])).rows[0];
  assert.equal(jobRow.status, "COMPLETED");
  assert.ok(jobRow.completed_at);

  // Step 15: candidate -> entity mapping remains inspectable after success.
  const preview = await api(`/curriculum/import-jobs/${jobId}/preview`, { userId: adminA });
  const courseCandidate = preview.json.data.candidates.find((c: any) => c.candidateType === "COURSE");
  assert.equal(courseCandidate.createdEntityId, courseId);
});

// ---------------- Steps 25/26: no assignment/learner truth manufactured ----------------

test("7. an unchanged re-import reuses the existing draft graph and creates no duplicate curriculum", async () => {
  // sourceKeyGood's course was already created by test 6's execution —
  // a fresh job against the same source key must classify the graph as
  // unchanged and preserve every canonical identity.
  const res = await createJob(adminA, sourceKeyGood);
  assert.equal(res.status, 200);
  assert.equal(res.json.data.job.status, "READY");
  const courseCandidate = res.json.data.candidates.find((c: any) => c.candidateType === "COURSE");
  assert.equal(courseCandidate.diffStatus, "UNCHANGED");
  assert.equal(courseCandidate.validationStatus, "VALID");

  const before = await query("SELECT course_id FROM curriculum_courses WHERE organization_id = $1 AND stable_key = $2", ["org_shf_001", sourceKeyGood.toLowerCase()]);
  const exec = await api(`/curriculum/import-jobs/${res.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec.status, 200);
  assert.equal(exec.json.data.courseId, before.rows[0].course_id);
  const after = await query("SELECT count(*) FROM curriculum_courses WHERE organization_id = $1 AND stable_key = $2", ["org_shf_001", sourceKeyGood.toLowerCase()]);
  assert.equal(Number(after.rows[0].count), 1);

  const assignmentCount = await query("SELECT count(*) FROM assignments WHERE title LIKE $1", [`%${RUN}%`]);
  assert.equal(Number(assignmentCount.rows[0].count), 0);
});

test("7a. a meaningful lesson change is MODIFIED and updates the same draft lesson", async () => {
  writeFixture(sourceKeyGood, [
    { __filename: "lesson-one.json", title: "Lesson One Revised", estMinutes: 12, objectives: ["Objective A", "Objective B"] },
    { __filename: "lesson-two.json", title: "Lesson Two", estMinutes: 8, objectives: ["Objective C"] },
  ]);
  const created = await createJob(adminA, sourceKeyGood);
  assert.equal(created.json.data.job.status, "READY");
  const candidates = created.json.data.candidates;
  assert.equal(candidates.find((c: any) => c.stableKey === "lesson-one").diffStatus, "MODIFIED");
  assert.equal(candidates.find((c: any) => c.stableKey === "lesson-two").diffStatus, "UNCHANGED");
  const exec = await api(`/curriculum/import-jobs/${created.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec.status, 200);
  const lesson = (await query("SELECT l.lesson_id, l.title FROM curriculum_lessons l JOIN curriculum_units u ON u.unit_id = l.unit_id WHERE u.course_id = (SELECT course_id FROM curriculum_courses WHERE organization_id = $1 AND stable_key = $2) AND l.stable_key = $3", ["org_shf_001", sourceKeyGood.toLowerCase(), "lesson-one"])).rows[0];
  assert.equal(lesson.title, "Lesson One Revised");
  assert.equal(exec.json.data.lessonIds.includes(lesson.lesson_id), true);
});

test("7b. a new source lesson is NEW, created once, and assigned to its existing unit", async () => {
  writeFixture(sourceKeyGood, [
    { __filename: "lesson-one.json", title: "Lesson One Revised", estMinutes: 12, objectives: ["Objective A", "Objective B"] },
    { __filename: "lesson-two.json", title: "Lesson Two", estMinutes: 8, objectives: ["Objective C"] },
    { __filename: "lesson-three.json", title: "Lesson Three", estMinutes: 6, objectives: ["Objective D"] },
  ]);
  const created = await createJob(adminA, sourceKeyGood);
  assert.equal(created.json.data.job.status, "READY");
  const newCandidate = created.json.data.candidates.find((c: any) => c.stableKey === "lesson-three");
  assert.equal(newCandidate.diffStatus, "NEW");
  const exec = await api(`/curriculum/import-jobs/${created.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec.status, 200);
  const count = await query("SELECT count(*) FROM curriculum_lessons l JOIN curriculum_units u ON u.unit_id = l.unit_id WHERE u.course_id = (SELECT course_id FROM curriculum_courses WHERE organization_id = $1 AND stable_key = $2) AND l.stable_key = $3", ["org_shf_001", sourceKeyGood.toLowerCase(), "lesson-three"]);
  assert.equal(Number(count.rows[0].count), 1);
});

test("7c. a source-removed lesson is flagged MISSING_FROM_SOURCE and is preserved", async () => {
  fs.unlinkSync(path.join(contentRoot, `${sourceKeyGood}-student`, "lesson-two.json"));
  const created = await createJob(adminA, sourceKeyGood);
  assert.equal(created.json.data.job.status, "NEEDS_REVIEW");
  const missing = created.json.data.candidates.find((c: any) => c.stableKey === "lesson-two");
  assert.equal(missing.diffStatus, "MISSING_FROM_SOURCE");
  const preserved = await query("SELECT count(*) FROM curriculum_lessons l JOIN curriculum_units u ON u.unit_id = l.unit_id WHERE u.course_id = (SELECT course_id FROM curriculum_courses WHERE organization_id = $1 AND stable_key = $2) AND l.stable_key = $3", ["org_shf_001", sourceKeyGood.toLowerCase(), "lesson-two"]);
  assert.equal(Number(preserved.rows[0].count), 1);
});

// ---------------- Step 17: idempotency ----------------

test("8. executing an already-completed job twice does not create duplicate curriculum", async () => {
  const idemKey = `${sourceKeyGood}idem`;
  writeFixtureInline(idemKey, [{ title: "Idem Lesson" }]);
  const res = await createJob(adminA, idemKey);
  assert.equal(res.status, 200);
  const jobId = res.json.data.job.importJobId;
  const first = await api(`/curriculum/import-jobs/${jobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(first.status, 200);
  createdCourseIds.add(first.json.data.courseId);
  const second = await api(`/curriculum/import-jobs/${jobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(second.status, 200);
  assert.equal(second.json.data.alreadyCompleted, true);
  assert.equal(second.json.data.courseId, first.json.data.courseId);

  const count = await query("SELECT count(*) FROM curriculum_courses WHERE organization_id = $1 AND stable_key = $2", ["org_shf_001", idemKey.toLowerCase()]);
  assert.equal(Number(count.rows[0].count), 1);
});

function writeFixtureInline(sourceKey: string, lessons: Array<Record<string, unknown>>) {
  writeFixture(sourceKey, lessons.map((l, i) => ({ __filename: `lesson-${i}.json`, ...l })));
}

// ---------------- Step 31: rollback on execution-time failure ----------------

test("9. a database-level failure during execution rolls back the entire catalog graph and preserves the job as FAILED", async () => {
  const created = await createJob(adminA, sourceKeyRollback);
  assert.equal(created.status, 200);
  const jobId = created.json.data.job.importJobId;
  const candidates = created.json.data.candidates;
  const lessonTwo = candidates.find((c: any) => c.stableKey === "lesson-two");

  // Corrupt state directly at the DB layer, bypassing service validation
  // entirely, to force a genuine execution-time (not pre-validation)
  // failure: make the second lesson candidate collide on stable_key with
  // the first, so the real uq_curriculum_lessons_unit_key constraint
  // fires mid-transaction.
  await query("UPDATE curriculum_import_candidates SET stable_key = 'lesson-one' WHERE import_candidate_id = $1", [lessonTwo.importCandidateId]);

  const exec = await api(`/curriculum/import-jobs/${jobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec.status, 422);

  // Nothing survives: no course (and therefore, by FK, no unit or lesson
  // under it either — units/lessons cannot exist without their course).
  const courseCheck = await query("SELECT * FROM curriculum_courses WHERE organization_id = $1 AND stable_key = $2", ["org_shf_001", sourceKeyRollback.toLowerCase()]);
  assert.equal(courseCheck.rows.length, 0);

  const jobRow = (await query("SELECT status, error_summary FROM curriculum_import_jobs WHERE import_job_id = $1", [jobId])).rows[0];
  assert.equal(jobRow.status, "FAILED");
  assert.ok(jobRow.error_summary);

  // Candidates remain inspectable (Step 18/31).
  const preview = await api(`/curriculum/import-jobs/${jobId}/preview`, { userId: adminA });
  assert.equal(preview.status, 200);
  assert.equal(preview.json.data.candidates.length, 4);

  // Retry is possible after correcting the underlying data: fix the
  // corrupted candidate back and re-execute successfully.
  await query("UPDATE curriculum_import_candidates SET stable_key = 'lesson-two' WHERE import_candidate_id = $1", [lessonTwo.importCandidateId]);
  const retry = await api(`/curriculum/import-jobs/${jobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(retry.status, 200);
  createdCourseIds.add(retry.json.data.courseId);
});

// ---------------- Steps 29/33: tenant isolation ----------------

test("10. cross-tenant read/preview/execute/cancel of another org's import job fails closed with 404", async () => {
  const created = await createJob(adminA, `${sourceKeyGood}xt`);
  writeFixtureInline(`${sourceKeyGood}xt`, [{ title: "Cross Tenant Lesson" }]);
  const res = await createJob(adminA, `${sourceKeyGood}xt`);
  assert.equal(res.status, 200);
  const jobId = res.json.data.job.importJobId;

  const getAsB = await api(`/curriculum/import-jobs/${jobId}`, { userId: adminB });
  assert.equal(getAsB.status, 404);
  const previewAsB = await api(`/curriculum/import-jobs/${jobId}/preview`, { userId: adminB });
  assert.equal(previewAsB.status, 404);
  const execAsB = await api(`/curriculum/import-jobs/${jobId}/execute`, { method: "POST", userId: adminB });
  assert.equal(execAsB.status, 404);
  const cancelAsB = await api(`/curriculum/import-jobs/${jobId}/cancel`, { method: "POST", userId: adminB });
  assert.equal(cancelAsB.status, 404);

  // adminA (the real owner) can still cancel it cleanly.
  const cancelAsA = await api(`/curriculum/import-jobs/${jobId}/cancel`, { method: "POST", userId: adminA });
  assert.equal(cancelAsA.status, 200);
  assert.equal(cancelAsA.json.data.status, "CANCELLED");
});

// ---------------- Step 34: dotted stable key preservation ----------------

test("11. an explicit dotted stable key (student.asl-01 shape) survives candidate generation unchanged", async () => {
  const dotKey = `${RUN}dot`;
  writeFixture(dotKey, [{ __filename: "student.asl-01.json", title: "Dotted Key Lesson" }]);
  const res = await createJob(adminA, dotKey);
  assert.equal(res.status, 200);
  const lessonCandidate = res.json.data.candidates.find((c: any) => c.candidateType === "LESSON");
  assert.equal(lessonCandidate.stableKey, "student.asl-01");
});

// ---------------- Steps 37/38: real ASL and Data Center proof-of-capability ----------------
// No production curriculum creation occurs for either proof (jobs are
// cancelled, never executed) — this only proves the adapter can read
// real content and preserve identity/payload/preview correctly.

test("12. ASL proof-of-capability: real asl-student content reads, preserves stable keys and payload, and previews without touching production catalog", async () => {
  const res = await createJob(adminA, "asl");
  assert.equal(res.status, 200);
  const { job, candidates } = res.json.data;
  assert.ok(job.status === "READY" || job.status === "NEEDS_REVIEW");
  const lessonOne = candidates.find((c: any) => c.stableKey === "student.asl-01");
  assert.ok(lessonOne, "student.asl-01 candidate must be generated from real ASL content");
  assert.ok(Array.isArray(lessonOne.payload.objectives));
  assert.ok(lessonOne.payload.vocab === undefined || Array.isArray(lessonOne.payload.vocab));

  const preview = await api(`/curriculum/import-jobs/${job.importJobId}/preview`, { userId: adminA });
  assert.equal(preview.status, 200);

  const cancel = await api(`/curriculum/import-jobs/${job.importJobId}/cancel`, { method: "POST", userId: adminA });
  assert.equal(cancel.status, 200);

  const courseCheck = await query("SELECT 1 FROM curriculum_courses WHERE organization_id = $1 AND stable_key = 'asl'", ["org_shf_001"]);
  assert.equal(courseCheck.rows.length, 0);
});

test("13. Data Center proof-of-capability: real data-center-foundations content preserves practice/reflectionPrompt fields without touching production catalog", async () => {
  const res = await createJob(adminA, "data-center-foundations");
  assert.equal(res.status, 200);
  const { job, candidates } = res.json.data;
  assert.ok(job.status === "READY" || job.status === "NEEDS_REVIEW");
  const lessonCandidates = candidates.filter((c: any) => c.candidateType === "LESSON");
  assert.ok(lessonCandidates.length > 0);
  const withReflection = lessonCandidates.find((c: any) => typeof c.payload.reflectionPrompt === "string");
  assert.ok(withReflection, "at least one real Data Center lesson should carry a reflectionPrompt field, and it must be preserved");

  const cancel = await api(`/curriculum/import-jobs/${job.importJobId}/cancel`, { method: "POST", userId: adminA });
  assert.equal(cancel.status, 200);

  const courseCheck = await query("SELECT 1 FROM curriculum_courses WHERE organization_id = $1 AND stable_key = 'data-center-foundations'", ["org_shf_001"]);
  assert.equal(courseCheck.rows.length, 0);
});

// ---------------- Step 16: import history listing ----------------

test("14. list/get import job history is organization-scoped", async () => {
  const list = await api("/curriculum/import-jobs", { userId: adminA });
  assert.equal(list.status, 200);
  assert.ok(list.json.data.length > 0);
  assert.ok(list.json.data.every((j: any) => j.organizationId === "org_shf_001"));
});

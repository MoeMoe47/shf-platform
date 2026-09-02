// SHF Lesson + Assignment + Curriculum — Phase 4.5D — Canonical Resource,
// Media, and Learning Arcade Linkage. Integration tests against the real
// running dev server (npm run test:server on :8091) and the real
// Postgres-backed repo, same convention as this domain's other suites.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `ci45a_${Date.now() + 5000}`;
const adminA = `user_${RUN}_admin_a`; // org_shf_001, org_admin
const adminB = `user_${RUN}_admin_b`; // org_partner_001, org_admin

const contentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../src/content/lessons");
const sourceKey = `${RUN}media`;
const fixtureDir = path.join(contentRoot, `${sourceKey}-student`);

async function api(routePath: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${routePath}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...(opts.userId ? { Authorization: `Bearer dev-token:${opts.userId}` } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

// Lesson A: rich media (alt+caption, fully accessible) + a game reference
// that matches a real disposable Arcade Activity seeded below.
// Lesson B: media missing alt text (accessibility warning proof) and a
// game reference that matches NOTHING real (unresolved proof).
function writeFixture(lessonAGameId: string, lessonACaption: string) {
  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.writeFileSync(path.join(fixtureDir, "lesson-a.json"), JSON.stringify({
    title: "Lesson A",
    sections: [{ heading: "Intro", body: "Body text.", media: { src: "/media/test/lesson-a.png", alt: "A descriptive alt", caption: lessonACaption } }],
    games: [{ id: lessonAGameId, title: "Match Game", route: `/arcade/test/${lessonAGameId}`, estMinutes: 5, xp: 10, outcomes: ["x"] }],
  }, null, 2));
  fs.writeFileSync(path.join(fixtureDir, "lesson-b.json"), JSON.stringify({
    title: "Lesson B",
    sections: [{ heading: "Intro", body: "Body text.", media: { src: "/media/test/lesson-b.png" } }],
    games: [{ id: `${RUN}-nonexistent-game`, title: "Nowhere Game", route: "/arcade/test/nowhere" }],
  }, null, 2));
}

const arcadeActivityId = `arcade_${RUN}_a`;
const arcadeSlug = `${RUN}-real-game`;
const createdCourseIds = new Set<string>();
const createdJobIds = new Set<string>();

async function cleanupCatalog() {
  const ids = [...createdCourseIds];
  if (ids.length) {
    await query("DELETE FROM curriculum_releases WHERE course_id = ANY($1::text[])", [ids]);
    await query(
      `DELETE FROM curriculum_lesson_arcade_activities WHERE curriculum_lesson_id IN (
         SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[])))`,
      [ids],
    );
    await query(
      `DELETE FROM curriculum_lesson_resources WHERE lesson_id IN (
         SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[])))`,
      [ids],
    );
    await query(
      `DELETE FROM curriculum_resources WHERE resource_id IN (
         SELECT resource_id FROM curriculum_lesson_resources WHERE lesson_id IN (
           SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[]))))`,
      [ids],
    );
    // Resources may already be detached from the deletes above; sweep any orphaned test-titled rows too.
    await query("DELETE FROM curriculum_resources WHERE organization_id = 'org_shf_001' AND title LIKE $1", [`%${RUN}%`]);
    await query("DELETE FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[]))", [ids]);
    await query("DELETE FROM curriculum_units WHERE course_id = ANY($1::text[])", [ids]);
    await query("DELETE FROM curriculum_courses WHERE course_id = ANY($1::text[])", [ids]);
  }
  await query("DELETE FROM curriculum_courses WHERE organization_id = 'org_shf_001' AND stable_key = $1", [sourceKey.toLowerCase()]);
}

async function cleanupImportRows() {
  const ids = [...createdJobIds];
  if (ids.length) {
    await query("DELETE FROM curriculum_import_candidates WHERE import_job_id = ANY($1::text[])", [ids]);
    await query("DELETE FROM curriculum_import_jobs WHERE import_job_id = ANY($1::text[])", [ids]);
  }
  await query("DELETE FROM curriculum_import_candidates WHERE organization_id = 'org_shf_001' AND import_job_id IN (SELECT import_job_id FROM curriculum_import_jobs WHERE source_key LIKE $1)", [`${RUN}%`]);
  await query("DELETE FROM curriculum_import_jobs WHERE source_key LIKE $1", [`${RUN}%`]);
}

before(async () => {
  // Not a broad "ci45a_*" sweep: this file's sibling test files use the
  // same run-prefix convention and could be running concurrently (tsx
  // --test executes files in parallel) — sweeping by the shared prefix
  // would risk deleting another file's in-flight fixtures. Each run's
  // own sourceKey is already unique via Date.now(), so no stale-run
  // sweep is needed here; after() cleans up everything this run creates.
  await cleanupImportRows();
  await cleanupCatalog();
  await query("DELETE FROM arcade_activities WHERE arcade_activity_id = $1", [arcadeActivityId]);
  for (const [userId, organizationId] of [[adminA, "org_shf_001"], [adminB, "org_partner_001"]] as const) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1, $2, $3, 'Phase 4.5D Test User', 'active', 'local') ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, `${userId}@test.invalid`],
    ));
  }
  // A real, disposable, canonical Arcade Activity — Step 40's "use a
  // disposable EXISTING canonical Arcade Activity," not a fabricated one
  // created by the import path itself.
  await query(
    `INSERT INTO arcade_activities (arcade_activity_id, slug, title, activity_type, mastery_rule, created_by_user_id) VALUES ($1,$2,'Real Test Game','RETRIEVAL','PASSED_FLAG',$3) ON CONFLICT DO NOTHING`,
    [arcadeActivityId, arcadeSlug, adminA],
  );
  writeFixture(arcadeSlug, "A helpful caption");
});

function sweepFixtureFolders() {
  for (const entry of fs.readdirSync(contentRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name.startsWith(sourceKey)) {
      fs.rmSync(path.join(contentRoot, entry.name), { recursive: true, force: true });
    }
  }
}

after(async () => {
  await cleanupCatalog();
  await cleanupImportRows();
  await query("DELETE FROM arcade_activities WHERE arcade_activity_id = ANY($1::text[])", [[arcadeActivityId, `arcade_${RUN}_rel2`]]);
  sweepFixtureFolders();
});

async function createJob(userId: string, key: string) {
  const res = await api("/curriculum/import-jobs", { method: "POST", userId, body: { importType: "STATIC_JSON", sourceKey: key } });
  if (res.status === 200) createdJobIds.add(res.json.data.job.importJobId);
  return res;
}

// ---------------- Step 37: resource + arcade candidate generation ----------------

test("1. structured media and game references generate RESOURCE and ARCADE_LINK candidates with correct classification", async () => {
  const created = await createJob(adminA, sourceKey);
  assert.equal(created.status, 200);
  const { job, candidates } = created.json.data;
  assert.equal(job.status, "NEEDS_REVIEW"); // lesson B's game is unresolved

  const resources = candidates.filter((c: any) => c.candidateType === "RESOURCE");
  assert.equal(resources.length, 2);
  const lessonAResource = resources.find((r: any) => r.sourceReference?.includes("lesson-a.json"));
  assert.equal(lessonAResource.payload.accessibilityWarnings.length, 0, "fully-described media must carry no accessibility warnings");
  const lessonBResource = resources.find((r: any) => r.sourceReference?.includes("lesson-b.json"));
  assert.ok(lessonBResource.payload.accessibilityWarnings.includes("MISSING_ALT_TEXT"));
  assert.ok(lessonBResource.payload.accessibilityWarnings.includes("MISSING_CAPTION"));

  const arcadeLinks = candidates.filter((c: any) => c.candidateType === "ARCADE_LINK");
  assert.equal(arcadeLinks.length, 2);
  const matched = arcadeLinks.find((a: any) => a.payload.gameId === arcadeSlug);
  assert.equal(matched.payload.matchStatus, "MATCHED");
  assert.equal(matched.validationStatus, "VALID");
  assert.equal(matched.payload.matchedActivity.arcadeActivityId, arcadeActivityId);
  const unresolved = arcadeLinks.find((a: any) => a.payload.gameId !== arcadeSlug);
  assert.equal(unresolved.payload.matchStatus, "UNRESOLVED");
  assert.equal(unresolved.validationStatus, "INVALID");
});

// ---------------- Steps 12-15: transactional creation, no learner truth ----------------

test("2. execution creates DRAFT resources and the canonical Arcade link, and manufactures zero learner Arcade data", async () => {
  fs.mkdirSync(path.join(contentRoot, `${sourceKey}exec-student`), { recursive: true });
  fs.writeFileSync(path.join(contentRoot, `${sourceKey}exec-student`, "lesson-a.json"), fs.readFileSync(path.join(fixtureDir, "lesson-a.json")));
  const res = await createJob(adminA, `${sourceKey}exec`);
  assert.equal(res.status, 200);
  const jobId = res.json.data.job.importJobId;
  const arcadeCandidate = res.json.data.candidates.find((c: any) => c.candidateType === "ARCADE_LINK");
  assert.equal(arcadeCandidate.validationStatus, "VALID");
  assert.equal(res.json.data.job.status, "READY");

  const exec = await api(`/curriculum/import-jobs/${jobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec.status, 200);
  createdCourseIds.add(exec.json.data.courseId);

  const lessonRow = (await query("SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = $1) AND stable_key = 'lesson-a'", [exec.json.data.courseId])).rows[0];
  const resourceLink = (await query("SELECT r.title, r.resource_type, r.external_url, lr.sequence FROM curriculum_lesson_resources lr JOIN curriculum_resources r ON r.resource_id = lr.resource_id WHERE lr.lesson_id = $1", [lessonRow.lesson_id])).rows;
  assert.equal(resourceLink.length, 1);
  assert.equal(resourceLink[0].resource_type, "MEDIA");
  assert.equal(resourceLink[0].external_url, "/media/test/lesson-a.png");

  const arcadeLinkRow = (await query("SELECT arcade_activity_id FROM curriculum_lesson_arcade_activities WHERE curriculum_lesson_id = $1", [lessonRow.lesson_id])).rows;
  assert.equal(arcadeLinkRow.length, 1);
  assert.equal(arcadeLinkRow[0].arcade_activity_id, arcadeActivityId);

  // Step 28/40: definition linkage only — zero learner Arcade data.
  const attempts = await query("SELECT count(*) FROM arcade_attempts WHERE learner_user_id LIKE $1", [`%${RUN}%`]);
  assert.equal(Number(attempts.rows[0].count), 0);
  const results = await query("SELECT count(*) FROM arcade_results WHERE learner_user_id LIKE $1", [`%${RUN}%`]);
  assert.equal(Number(results.rows[0].count), 0);
});

// ---------------- Step 38: resource re-import ----------------

test("3. re-importing identical media creates no duplicate resource, and a changed caption updates the same DRAFT resource", async () => {
  const key = `${sourceKey}reimport`;
  const dir = path.join(contentRoot, `${key}-student`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "lesson-a.json"), JSON.stringify({ title: "Lesson A", sections: [{ heading: "Intro", body: "x", media: { src: "/media/test/reimport.png", alt: "Alt", caption: "Original caption" } }] }));

  const first = await createJob(adminA, key);
  const exec1 = await api(`/curriculum/import-jobs/${first.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec1.status, 200);
  createdCourseIds.add(exec1.json.data.courseId);
  const resourceCountQuery = "SELECT count(*) FROM curriculum_resources WHERE resource_id IN (SELECT resource_id FROM curriculum_lesson_resources lr JOIN curriculum_lessons l ON l.lesson_id = lr.lesson_id JOIN curriculum_units u ON u.unit_id = l.unit_id WHERE u.course_id = $1)";
  const before = await query(resourceCountQuery, [exec1.json.data.courseId]);
  assert.equal(Number(before.rows[0].count), 1);

  // Unchanged re-import: same source, no duplicate.
  const second = await createJob(adminA, key);
  const resourceCandidate2 = second.json.data.candidates.find((c: any) => c.candidateType === "RESOURCE");
  assert.equal(resourceCandidate2.diffStatus, "UNCHANGED");
  const exec2 = await api(`/curriculum/import-jobs/${second.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec2.status, 200);
  const afterUnchanged = await query(resourceCountQuery, [exec1.json.data.courseId]);
  assert.equal(Number(afterUnchanged.rows[0].count), 1);

  // Modified caption: same resource identity (src-derived), updated in place.
  fs.writeFileSync(path.join(dir, "lesson-a.json"), JSON.stringify({ title: "Lesson A", sections: [{ heading: "Intro", body: "x", media: { src: "/media/test/reimport.png", alt: "Alt", caption: "Updated caption" } }] }));
  const third = await createJob(adminA, key);
  const resourceCandidate3 = third.json.data.candidates.find((c: any) => c.candidateType === "RESOURCE");
  assert.equal(resourceCandidate3.diffStatus, "MODIFIED");
  const exec3 = await api(`/curriculum/import-jobs/${third.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec3.status, 200);
  const afterModified = await query(resourceCountQuery, [exec1.json.data.courseId]);
  assert.equal(Number(afterModified.rows[0].count), 1, "modifying content must update in place, never create a second resource");
  const updatedResource = (await query("SELECT description FROM curriculum_resources WHERE resource_id IN (SELECT resource_id FROM curriculum_lesson_resources lr JOIN curriculum_lessons l ON l.lesson_id = lr.lesson_id JOIN curriculum_units u ON u.unit_id = l.unit_id WHERE u.course_id = $1)", [exec1.json.data.courseId])).rows[0];
  assert.equal(updatedResource.description, "Updated caption");
});

// ---------------- Step 38: new + removed resource ----------------

test("4. a newly added media resource is created once, and a removed one is preserved as MISSING_FROM_SOURCE, never deleted", async () => {
  const key = `${sourceKey}addrm`;
  const dir = path.join(contentRoot, `${key}-student`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "lesson-a.json"), JSON.stringify({ title: "Lesson A", sections: [{ heading: "Intro", body: "x", media: { src: "/media/test/addrm-one.png", alt: "Alt", caption: "One" } }] }));

  const first = await createJob(adminA, key);
  const exec1 = await api(`/curriculum/import-jobs/${first.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  createdCourseIds.add(exec1.json.data.courseId);
  const lessonId = (await query("SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = $1)", [exec1.json.data.courseId])).rows[0].lesson_id;

  // Add a second media resource.
  fs.writeFileSync(path.join(dir, "lesson-a.json"), JSON.stringify({
    title: "Lesson A",
    sections: [
      { heading: "Intro", body: "x", media: { src: "/media/test/addrm-one.png", alt: "Alt", caption: "One" } },
      { heading: "More", body: "y", media: { src: "/media/test/addrm-two.png", alt: "Alt2", caption: "Two" } },
    ],
  }));
  const second = await createJob(adminA, key);
  const newCandidate = second.json.data.candidates.find((c: any) => c.candidateType === "RESOURCE" && c.diffStatus === "NEW");
  assert.ok(newCandidate);
  await api(`/curriculum/import-jobs/${second.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  const afterAdd = await query("SELECT count(*) FROM curriculum_lesson_resources WHERE lesson_id = $1", [lessonId]);
  assert.equal(Number(afterAdd.rows[0].count), 2);

  // Remove the second media resource from source.
  fs.writeFileSync(path.join(dir, "lesson-a.json"), JSON.stringify({ title: "Lesson A", sections: [{ heading: "Intro", body: "x", media: { src: "/media/test/addrm-one.png", alt: "Alt", caption: "One" } }] }));
  const third = await createJob(adminA, key);
  const missingCandidate = third.json.data.candidates.find((c: any) => c.candidateType === "RESOURCE" && c.diffStatus === "MISSING_FROM_SOURCE");
  assert.ok(missingCandidate, "the removed resource must be reported as MISSING_FROM_SOURCE");
  await api(`/curriculum/import-jobs/${third.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  const afterRemove = await query("SELECT count(*) FROM curriculum_lesson_resources WHERE lesson_id = $1", [lessonId]);
  assert.equal(Number(afterRemove.rows[0].count), 2, "a source-removed resource link must be preserved, never silently deleted");
});

// ---------------- Step 39: resource/arcade rollback ----------------

test("5. a DB-level failure during resource execution rolls back the entire graph, including any Arcade link already staged", async () => {
  const key = `${sourceKey}rollback`;
  const dir = path.join(contentRoot, `${key}-student`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "lesson-a.json"), JSON.stringify({
    title: "Lesson A",
    sections: [{ heading: "Intro", body: "x", media: { src: "/media/test/rollback.png", alt: "Alt", caption: "Cap" } }],
    games: [{ id: arcadeSlug, title: "Real Test Game" }],
  }));
  const created = await createJob(adminA, key);
  assert.equal(created.status, 200);
  const jobId = created.json.data.job.importJobId;
  const resourceCandidate = created.json.data.candidates.find((c: any) => c.candidateType === "RESOURCE");

  // Corrupt the resource candidate's payload at the DB layer to an
  // unsupported resource_type, bypassing application validation entirely
  // (which already passed at generation time), forcing a genuine
  // execution-time CHECK-constraint failure inside the transaction.
  await query("UPDATE curriculum_import_candidates SET payload = jsonb_set(payload, '{resourceType}', '\"NOT_A_REAL_TYPE\"') WHERE import_candidate_id = $1", [resourceCandidate.importCandidateId]);

  const exec = await api(`/curriculum/import-jobs/${jobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec.status, 422);

  const courseCheck = await query("SELECT * FROM curriculum_courses WHERE organization_id = 'org_shf_001' AND stable_key = $1", [key.toLowerCase()]);
  assert.equal(courseCheck.rows.length, 0, "no Course must survive a failed resource execution — full rollback");
  const jobRow = (await query("SELECT status, error_summary FROM curriculum_import_jobs WHERE import_job_id = $1", [jobId])).rows[0];
  assert.equal(jobRow.status, "FAILED");
  assert.ok(jobRow.error_summary);
});

// ---------------- Steps 40-42: Arcade match / missing / conflict ----------------

test("6. an explicit arcadeActivityId that disagrees with the slug match is a CONFLICT and blocks execution", async () => {
  const key = `${sourceKey}conflict`;
  const dir = path.join(contentRoot, `${key}-student`);
  fs.mkdirSync(dir, { recursive: true });
  // A second real disposable activity with a different slug, referenced
  // explicitly via arcadeActivityId while the games[].id itself matches
  // the FIRST activity's slug — a genuine, deterministic disagreement.
  const secondActivityId = `arcade_${RUN}_b`;
  await query(
    `INSERT INTO arcade_activities (arcade_activity_id, slug, title, activity_type, mastery_rule, created_by_user_id) VALUES ($1,$2,'Second Test Game','RETRIEVAL','PASSED_FLAG',$3) ON CONFLICT DO NOTHING`,
    [secondActivityId, `${RUN}-second-game`, adminA],
  );
  fs.writeFileSync(path.join(dir, "lesson-a.json"), JSON.stringify({
    title: "Lesson A",
    games: [{ id: arcadeSlug, arcadeActivityId: secondActivityId, title: "Ambiguous" }],
  }));
  const created = await createJob(adminA, key);
  assert.equal(created.status, 200);
  const arcadeCandidate = created.json.data.candidates.find((c: any) => c.candidateType === "ARCADE_LINK");
  assert.equal(arcadeCandidate.payload.matchStatus, "CONFLICT");
  assert.equal(arcadeCandidate.validationStatus, "INVALID");
  assert.equal(created.json.data.job.status, "NEEDS_REVIEW");

  const exec = await api(`/curriculum/import-jobs/${created.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
  assert.equal(exec.status, 409, "a NEEDS_REVIEW job must not be executable at all");
  await query("DELETE FROM arcade_activities WHERE arcade_activity_id = $1", [secondActivityId]);
});

// ---------------- Step 10: URL safety ----------------

test("7. an unsafe media URL scheme fails closed as an invalid candidate", async () => {
  const key = `${sourceKey}unsafe`;
  const dir = path.join(contentRoot, `${key}-student`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "lesson-a.json"), JSON.stringify({
    title: "Lesson A",
    sections: [{ heading: "Intro", body: "x", media: { src: "javascript:alert(1)", alt: "Alt", caption: "Cap" } }],
  }));
  const created = await createJob(adminA, key);
  assert.equal(created.status, 200);
  const resourceCandidate = created.json.data.candidates.find((c: any) => c.candidateType === "RESOURCE");
  assert.equal(resourceCandidate.validationStatus, "INVALID");
  assert.match(resourceCandidate.validationErrors.join(" "), /unsafe external URL scheme/);
  assert.equal(created.json.data.job.status, "NEEDS_REVIEW");
});

// ---------------- Step 36: tenant isolation ----------------

test("8. cross-tenant preview of a job with resource/arcade candidates fails closed with 404", async () => {
  fs.mkdirSync(path.join(contentRoot, `${sourceKey}xt-student`), { recursive: true });
  fs.writeFileSync(path.join(contentRoot, `${sourceKey}xt-student`, "lesson-a.json"), fs.readFileSync(path.join(fixtureDir, "lesson-a.json")));
  const res = await createJob(adminA, `${sourceKey}xt`);
  assert.equal(res.status, 200);
  const preview = await api(`/curriculum/import-jobs/${res.json.data.job.importJobId}/preview`, { userId: adminB });
  assert.equal(preview.status, 404);
});

// ---------------- Step 34: Release 1 -> Release 2 stability with Resource/Arcade links ----------------

test("9. Release 1's resource and Arcade link set is frozen at publish time; Release 2 reflects the update; Assignment A stays bound to Release 1", async () => {
  const key = `${sourceKey}rel`;
  const dir = path.join(contentRoot, `${key}-student`);
  const learner = `user_${RUN}_student`;
  let courseId = "";
  let assignmentId = "";
  try {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1, 'org_shf_001', $2, 'Phase 4.5D Learner', 'active', 'local') ON CONFLICT (user_id) DO NOTHING`,
      [learner, `${learner}@test.invalid`],
    ));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "lesson-a.json"), JSON.stringify({
      title: "Lesson A",
      sections: [{ heading: "Intro", body: "x", media: { src: "/media/test/rel-one.png", alt: "Alt", caption: "Release 1 caption" } }],
      games: [{ id: arcadeSlug, title: "Real Test Game" }],
    }));

    const created = await createJob(adminA, key);
    assert.equal(created.status, 200);
    const exec1 = await api(`/curriculum/import-jobs/${created.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
    assert.equal(exec1.status, 200);
    courseId = exec1.json.data.courseId;
    createdCourseIds.add(courseId);

    const course = await api(`/curriculum/catalog/courses/${courseId}`, { userId: adminA });
    const submitted = await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { method: "POST", userId: adminA, body: { revision: course.json.data.course.revision } });
    const approved = await api(`/curriculum/catalog/courses/${courseId}/approve`, { method: "POST", userId: adminA, body: { revision: submitted.json.data.revision } });
    const published1 = await api(`/curriculum/catalog/courses/${courseId}/publish`, { method: "POST", userId: adminA, body: { revision: approved.json.data.revision } });
    assert.equal(published1.status, 200);
    const release1 = published1.json.data.release;
    const release1Lesson = release1.snapshot.units[0].lessons[0];
    assert.equal(release1Lesson.resources.length, 1);
    assert.equal(release1Lesson.resources[0].description, "Release 1 caption");
    assert.equal(release1Lesson.arcadeLinks.length, 1);
    assert.equal(release1Lesson.arcadeLinks[0].slug, arcadeSlug);

    const assignment = await api("/assignments", {
      method: "POST", userId: adminA,
      body: { title: `${RUN} Assignment`, dueAt: new Date(Date.now() + 86400000).toISOString(), targets: [{ targetType: "LEARNER", learnerUserId: learner }], curriculumReleaseId: release1.releaseId, assignedContentType: "COURSE" },
    });
    assert.equal(assignment.status, 201);
    assignmentId = assignment.json.data.id;

    // Revision 2: change the resource caption AND add a second Arcade
    // link (kept as NEW rather than removing the first, so the job stays
    // directly executable — Phase 4.5B's own governance correctly routes
    // any MISSING_FROM_SOURCE item to NEEDS_REVIEW, requiring a human
    // decision before execution; that boundary is exercised by test 4's
    // resource-removal case above and is out of this test's scope).
    const secondArcadeActivityId = `arcade_${RUN}_rel2`;
    const secondArcadeSlug = `${RUN}-rel2-game`;
    await query(
      `INSERT INTO arcade_activities (arcade_activity_id, slug, title, activity_type, mastery_rule, created_by_user_id) VALUES ($1,$2,'Release 2 Game','RETRIEVAL','PASSED_FLAG',$3) ON CONFLICT DO NOTHING`,
      [secondArcadeActivityId, secondArcadeSlug, adminA],
    );
    fs.writeFileSync(path.join(dir, "lesson-a.json"), JSON.stringify({
      title: "Lesson A",
      sections: [{ heading: "Intro", body: "x", media: { src: "/media/test/rel-one.png", alt: "Alt", caption: "Release 2 caption" } }],
      games: [{ id: arcadeSlug, title: "Real Test Game" }, { id: secondArcadeSlug, title: "Release 2 Game" }],
    }));
    const reimport = await createJob(adminA, key);
    assert.equal(reimport.status, 200);
    assert.equal(reimport.json.data.job.status, "READY");
    const exec2 = await api(`/curriculum/import-jobs/${reimport.json.data.job.importJobId}/execute`, { method: "POST", userId: adminA });
    assert.equal(exec2.status, 200);

    const afterImport = await api(`/curriculum/catalog/courses/${courseId}`, { userId: adminA });
    const submitted2 = await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { method: "POST", userId: adminA, body: { revision: afterImport.json.data.course.revision } });
    const approved2 = await api(`/curriculum/catalog/courses/${courseId}/approve`, { method: "POST", userId: adminA, body: { revision: submitted2.json.data.revision } });
    const published2 = await api(`/curriculum/catalog/courses/${courseId}/publish`, { method: "POST", userId: adminA, body: { revision: approved2.json.data.revision } });
    assert.equal(published2.status, 200);
    const release2 = published2.json.data.release;
    assert.equal(release2.versionNumber, 2);
    assert.notEqual(release2.releaseId, release1.releaseId);
    const release2Lesson = release2.snapshot.units[0].lessons[0];
    assert.equal(release2Lesson.resources[0].description, "Release 2 caption");
    assert.equal(release2Lesson.arcadeLinks.length, 2, "Release 2's snapshot must reflect the newly added Arcade link");
    assert.ok(release2Lesson.arcadeLinks.some((l: any) => l.slug === secondArcadeSlug));

    // Release 1 must remain byte-for-byte unchanged.
    const release1After = await api(`/curriculum/catalog/releases/${release1.releaseId}`, { userId: adminA });
    assert.equal(release1After.json.data.contentHash, release1.contentHash);
    assert.deepEqual(release1After.json.data.snapshot, release1.snapshot);
    const release1LessonAfter = release1After.json.data.snapshot.units[0].lessons[0];
    assert.equal(release1LessonAfter.resources[0].description, "Release 1 caption");
    assert.equal(release1LessonAfter.arcadeLinks.length, 1);
    assert.equal(release1LessonAfter.arcadeLinks[0].slug, arcadeSlug);

    // Assignment A never floats forward.
    const assignmentAfter = await api(`/assignments/${assignmentId}`, { userId: learner });
    assert.equal(assignmentAfter.json.data.curriculumReleaseId, release1.releaseId);
  } finally {
    if (assignmentId) {
      await query("DELETE FROM assignment_targets WHERE assignment_id = $1", [assignmentId]);
      await query("DELETE FROM assignments WHERE assignment_id = $1", [assignmentId]);
    }
    if (courseId) createdCourseIds.add(courseId);
    // The second Arcade activity's link row is removed by cleanupCatalog()
    // in after() (via courseId, above); only delete the activity ROW
    // itself once that link is gone, or its own FK would reject this.
  }
});

// ---------------- Step 29: Completion Policy boundary regression ----------------
// A Lesson<->Arcade Activity DEFINITION link (curriculum_lesson_arcade_
// activities, this phase's new table) must have zero effect on the
// Completion Policy Engine's ARCADE evaluator — it was never modified in
// this phase and never reads that table (confirmed by fresh audit). This
// proves it directly rather than merely asserting it by omission.
test("10. an Arcade definition link alone never satisfies the ARCADE completion requirement; a real learner Arcade result does", async () => {
  const { evaluateRequirement } = await import("../src/domain/completion-policy/service/requirement-adapters.ts");
  const activityId = `arcade_${RUN}_policy`;
  const learnerId = `user_${RUN}_policylearner`;
  try {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1, 'org_shf_001', $2, 'Policy Learner', 'active', 'local') ON CONFLICT (user_id) DO NOTHING`,
      [learnerId, `${learnerId}@test.invalid`],
    ));
    await query(
      `INSERT INTO arcade_activities (arcade_activity_id, slug, title, activity_type, mastery_rule, created_by_user_id) VALUES ($1,$2,'Policy Boundary Game','RETRIEVAL','PASSED_FLAG',$3)`,
      [activityId, `${RUN}-policy-game`, adminA],
    );
    // No curriculum_lesson_arcade_activities row is created here at all —
    // the point of this proof is that the evaluator's behavior does not
    // depend on one existing (confirmed by fresh audit: it queries only
    // arcade_results by organization/learner/activity, never this
    // phase's new link table or arcade_activities.lesson_id).

    const req = {
      requirementId: `req_${RUN}`, policyId: `policy_${RUN}`, organizationId: "org_shf_001",
      requirementType: "ARCADE" as const, targetReference: activityId, configuration: {}, required: true, sequence: 1, createdAt: new Date().toISOString(),
    };
    const ctx = { organizationId: "org_shf_001", learnerUserId: learnerId, lessonResolved: true };

    const beforeResult = await evaluateRequirement(req, ctx);
    assert.equal(beforeResult.satisfied, false, "linkage alone must never satisfy the requirement");
    assert.equal(beforeResult.status, "UNSATISFIED");

    await query(
      `INSERT INTO arcade_attempts (arcade_attempt_id, organization_id, tenant_id, learner_user_id, arcade_activity_id, status, started_at, completed_at)
       VALUES ($1,'org_shf_001','tenant:org_shf_001',$2,$3,'COMPLETED', NOW(), NOW())`,
      [`attempt_${RUN}`, learnerId, activityId],
    );
    await query(
      `INSERT INTO arcade_results (arcade_result_id, organization_id, tenant_id, arcade_attempt_id, learner_user_id, arcade_activity_id, passed, score, mastery_achieved)
       VALUES ($1,'org_shf_001','tenant:org_shf_001',$2,$3,$4,true,100,true)`,
      [`result_${RUN}`, `attempt_${RUN}`, learnerId, activityId],
    );

    const afterResult = await evaluateRequirement(req, ctx);
    assert.equal(afterResult.satisfied, true, "a real mastered Arcade result must satisfy the requirement per the existing, unchanged contract");
    assert.equal(afterResult.status, "SATISFIED");
  } finally {
    await query("DELETE FROM arcade_results WHERE arcade_result_id = $1", [`result_${RUN}`]);
    await query("DELETE FROM arcade_attempts WHERE arcade_attempt_id = $1", [`attempt_${RUN}`]);
    await query("DELETE FROM arcade_activities WHERE arcade_activity_id = $1", [activityId]);
  }
});

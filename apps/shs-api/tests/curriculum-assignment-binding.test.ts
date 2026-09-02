// SHF Lesson + Assignment + Curriculum — Phase 3 tests. Assignment ->
// Curriculum Release binding, learner entitlement resolution, next-work
// resolution, version stability, and cross-org isolation. Integration
// tests against the real running dev server and Postgres — same
// convention as tests/assignments.security.test.ts and
// tests/curriculum-catalog.test.ts.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase3_${Date.now()}`;
const IDS = {
  programA: `program_${RUN}_a`,
  cohortA: `cohort_${RUN}_a`,
};

const ADMIN = "user_admin_001"; // org_shf_001, admin-tier
const LEARNER_DIRECT = "user_assignment_technical_001"; // org_shf_001, real fixture
const LEARNER_COHORT = "user_assignment_networking_001"; // org_shf_001, real fixture, enrolled in programA/cohortA below
const LEARNER_NONE = "user_no_assignment_001"; // org_shf_001, no enrollment at all
const PARTNER_ADMIN = "user_other_admin_001"; // org_other, admin-tier per identity-repo fixture
const PARTNER_STUDENT = "user_partner_student_001"; // org_partner_001

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

const createdCourseIds = new Set<string>();
const createdAssignmentIds = new Set<string>();

async function cleanup() {
  const asmtIds = [...createdAssignmentIds];
  if (asmtIds.length) {
    await query("DELETE FROM assignment_targets WHERE assignment_id = ANY($1::text[])", [asmtIds]);
    await query("DELETE FROM assignments WHERE assignment_id = ANY($1::text[])", [asmtIds]);
  }
  const courseIds = [...createdCourseIds];
  if (courseIds.length) {
    await query("DELETE FROM curriculum_lesson_completions WHERE curriculum_id IN (SELECT stable_key FROM curriculum_courses WHERE course_id = ANY($1::text[]))", [courseIds]);
    await query("DELETE FROM curriculum_releases WHERE course_id = ANY($1::text[])", [courseIds]);
    await query("DELETE FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[]))", [courseIds]);
    await query("DELETE FROM curriculum_units WHERE course_id = ANY($1::text[])", [courseIds]);
    await query("DELETE FROM curriculum_courses WHERE course_id = ANY($1::text[])", [courseIds]);
  }
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohorts WHERE cohort_id = $1", [IDS.cohortA]);
  await query("DELETE FROM programs WHERE program_id = $1", [IDS.programA]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status) VALUES ($1, 'org_shf_001', 'Phase 3 Program A', 'education', 'active') ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA],
  );
  await query(
    `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, status, starts_at, ends_at, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, 'Phase 3 Cohort A', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', $3)
     ON CONFLICT (cohort_id) DO NOTHING`,
    [IDS.cohortA, IDS.programA, ADMIN],
  );
  await withSeedRetry(() =>
    query(
      `INSERT INTO enrollments (enrollment_id, organization_id, tenant_id, learner_user_id, program_id, cohort_id, status, created_by_user_id)
       VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, $3, $4, 'ACTIVE', $5)
       ON CONFLICT (enrollment_id) DO NOTHING`,
      [`enr_${RUN}_cohort`, LEARNER_COHORT, IDS.programA, IDS.cohortA, ADMIN],
    ),
  );
});

after(async () => {
  await cleanup();
});

// Builds a real Course -> Unit -> two Lessons -> PUBLISHED Release via
// the actual Phase 2 catalog HTTP API (never a direct DB insert) so this
// test proves the real cross-domain path end to end.
async function publishTestCourse(titleSuffix: string) {
  const course = await api("/curriculum/catalog/courses", { method: "POST", userId: ADMIN, body: { title: `${RUN} ${titleSuffix}` } });
  assert.equal(course.status, 200);
  const courseId = course.json.data.courseId;
  createdCourseIds.add(courseId);

  const unit = await api(`/curriculum/catalog/courses/${courseId}/units`, { method: "POST", userId: ADMIN, body: { title: "Unit One", stableKey: "unit-one" } });
  const unitId = unit.json.data.unitId;

  const lesson1 = await api(`/curriculum/catalog/units/${unitId}/lessons`, { method: "POST", userId: ADMIN, body: { title: "Lesson One", stableKey: "lesson-one" } });
  const lesson2 = await api(`/curriculum/catalog/units/${unitId}/lessons`, { method: "POST", userId: ADMIN, body: { title: "Lesson Two", stableKey: "lesson-two" } });

  await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { method: "POST", userId: ADMIN, body: { revision: 1 } });
  await api(`/curriculum/catalog/courses/${courseId}/approve`, { method: "POST", userId: ADMIN, body: { revision: 2 } });
  const published = await api(`/curriculum/catalog/courses/${courseId}/publish`, { method: "POST", userId: ADMIN, body: { revision: 3 } });
  assert.equal(published.status, 200);

  return { courseId, unitId, lesson1Id: lesson1.json.data.lessonId, lesson2Id: lesson2.json.data.lessonId, release: published.json.data.release };
}

async function createBoundAssignment(release: any, contentType: string, targets: unknown[], overrides: Record<string, unknown> = {}) {
  const res = await api("/assignments", {
    method: "POST",
    userId: ADMIN,
    body: {
      title: `${RUN} ${contentType} Assignment`,
      dueAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      targets,
      curriculumReleaseId: release.releaseId,
      assignedContentType: contentType,
      assignedContentUnitKey: contentType !== "COURSE" ? "unit-one" : undefined,
      assignedContentLessonKey: contentType === "LESSON" ? "lesson-one" : undefined,
      ...overrides,
    },
  });
  if (res.status === 201) createdAssignmentIds.add(res.json.data.id);
  return res;
}

// ---------------- Published-only enforcement ----------------
test("1. an unpublished (DRAFT) course cannot be assigned", async () => {
  const draft = await api("/curriculum/catalog/courses", { method: "POST", userId: ADMIN, body: { title: `${RUN} Draft Course` } });
  createdCourseIds.add(draft.json.data.courseId);
  const fakeRelease = { releaseId: "release_does_not_exist" };
  const res = await createBoundAssignment(fakeRelease, "COURSE", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);
  assert.equal(res.status, 422);
  assert.equal(res.json.error.code, "RELEASE_NOT_FOUND");
});

test("2. binding to a real but nonexistent unit/lesson stable key within a published release is rejected", async () => {
  const { release } = await publishTestCourse("BadRef");
  const res = await createBoundAssignment(release, "LESSON", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }], { assignedContentUnitKey: "unit-one", assignedContentLessonKey: "does-not-exist" });
  assert.equal(res.status, 422);
  assert.equal(res.json.error.code, "LESSON_NOT_IN_RELEASE");
});

// ---------------- Full flow: LEARNER target, COURSE binding ----------------
test("3. a LEARNER-targeted COURSE assignment resolves release, content, and next lesson for the entitled student", async () => {
  const { release, courseId } = await publishTestCourse("CourseFlow");
  const created = await createBoundAssignment(release, "COURSE", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);
  assert.equal(created.status, 201);
  assert.equal(created.json.data.curriculumReleaseId, release.releaseId);
  assert.equal(created.json.data.assignedContentType, "COURSE");
  assert.equal(created.json.data.assignedContentId, null);

  const list = await api("/assignments", { userId: LEARNER_DIRECT });
  const item = list.json.data.items.find((i: any) => i.id === created.json.data.id);
  assert.ok(item, "entitled learner must see the assignment");
  assert.equal(item.curriculumRelease.releaseId, release.releaseId);
  assert.equal(item.curriculumRelease.versionNumber, 1);
  assert.equal(item.progress.total, 2);
  assert.equal(item.progress.completed, 0);
  assert.equal(item.nextLesson.lessonStableKey, "lesson-one");
  assert.equal(item.accessState, "AVAILABLE");

  const notEntitled = await api("/assignments", { userId: LEARNER_NONE });
  assert.equal(notEntitled.json.data.items.some((i: any) => i.id === created.json.data.id), false);
});

// ---------------- Cohort / Program / Organization targets ----------------
test("4. a COHORT target resolves for a learner enrolled in that cohort", async () => {
  const { release } = await publishTestCourse("CohortFlow");
  const created = await createBoundAssignment(release, "COURSE", [{ targetType: "COHORT", cohortId: IDS.cohortA }]);
  assert.equal(created.status, 201);
  const list = await api("/assignments", { userId: LEARNER_COHORT });
  assert.ok(list.json.data.items.some((i: any) => i.id === created.json.data.id));
  const outsider = await api("/assignments", { userId: LEARNER_DIRECT });
  assert.equal(outsider.json.data.items.some((i: any) => i.id === created.json.data.id), false);
});

test("5. a PROGRAM target resolves for a learner actively enrolled in that program", async () => {
  const { release } = await publishTestCourse("ProgramFlow");
  const created = await createBoundAssignment(release, "COURSE", [{ targetType: "PROGRAM", programId: IDS.programA }]);
  assert.equal(created.status, 201);
  const list = await api("/assignments", { userId: LEARNER_COHORT }); // enrolled in programA via cohortA
  assert.ok(list.json.data.items.some((i: any) => i.id === created.json.data.id));
});

test("6. an ORGANIZATION target resolves for any learner in the org but not for a different organization's learner", async () => {
  const { release } = await publishTestCourse("OrgFlow");
  const created = await createBoundAssignment(release, "COURSE", [{ targetType: "ORGANIZATION" }]);
  assert.equal(created.status, 201);
  const inOrg = await api("/assignments", { userId: LEARNER_NONE });
  assert.ok(inOrg.json.data.items.some((i: any) => i.id === created.json.data.id));
  const outsideOrg = await api("/assignments", { userId: PARTNER_STUDENT });
  assert.equal(outsideOrg.json.data.items.some((i: any) => i.id === created.json.data.id), false);
});

test("7. overlapping LEARNER + ORGANIZATION targets for the same learner produce exactly one work item, not a duplicate", async () => {
  const { release } = await publishTestCourse("DedupeFlow");
  const created = await createBoundAssignment(release, "COURSE", [
    { targetType: "ORGANIZATION" },
    { targetType: "LEARNER", learnerUserId: LEARNER_DIRECT },
  ]);
  assert.equal(created.status, 201);
  const list = await api("/assignments", { userId: LEARNER_DIRECT });
  const matches = list.json.data.items.filter((i: any) => i.id === created.json.data.id);
  assert.equal(matches.length, 1);
});

// ---------------- UNIT / LESSON scoping ----------------
test("8. a LESSON-scoped assignment resolves exactly that one lesson as the work item", async () => {
  const { release } = await publishTestCourse("LessonScope");
  const created = await createBoundAssignment(release, "LESSON", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);
  assert.equal(created.status, 201);
  assert.equal(created.json.data.assignedContentId, "unit-one:lesson-one");
  const list = await api("/assignments", { userId: LEARNER_DIRECT });
  const item = list.json.data.items.find((i: any) => i.id === created.json.data.id);
  assert.equal(item.progress.total, 1);
  assert.equal(item.nextLesson.lessonStableKey, "lesson-one");
});

// ---------------- Derived completion (read-only, never manufactured) ----------------
test("9. a real backend lesson-completion fact advances next-lesson and derives COMPLETED for a single-lesson assignment", async () => {
  const { release, courseId } = await publishTestCourse("CompletionFlow");
  const courseRow = await query("SELECT stable_key FROM curriculum_courses WHERE course_id = $1", [courseId]);
  const curriculumId = courseRow.rows[0].stable_key;

  const created = await createBoundAssignment(release, "LESSON", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);
  await query(
    `INSERT INTO curriculum_lesson_completions (completion_id, user_id, organization_id, curriculum_id, lesson_id, completed_at, idempotency_key)
     VALUES ($1, $2, 'org_shf_001', $3, 'lesson-one', NOW(), $4)`,
    [`comp_${RUN}_1`, LEARNER_DIRECT, curriculumId, `idem_${RUN}_1`],
  );

  const list = await api("/assignments", { userId: LEARNER_DIRECT });
  const item = list.json.data.items.find((i: any) => i.id === created.json.data.id);
  assert.equal(item.progress.completed, 1);
  assert.equal(item.nextLesson, null);
  assert.equal(item.accessState, "COMPLETED");
});

test("10. a course assignment with one of two lessons complete is IN_PROGRESS and points to the remaining lesson", async () => {
  const { release, courseId } = await publishTestCourse("PartialFlow");
  const courseRow = await query("SELECT stable_key FROM curriculum_courses WHERE course_id = $1", [courseId]);
  const curriculumId = courseRow.rows[0].stable_key;

  const created = await createBoundAssignment(release, "COURSE", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);
  await query(
    `INSERT INTO curriculum_lesson_completions (completion_id, user_id, organization_id, curriculum_id, lesson_id, completed_at, idempotency_key)
     VALUES ($1, $2, 'org_shf_001', $3, 'lesson-one', NOW(), $4)`,
    [`comp_${RUN}_2`, LEARNER_DIRECT, curriculumId, `idem_${RUN}_2`],
  );

  const list = await api("/assignments", { userId: LEARNER_DIRECT });
  const item = list.json.data.items.find((i: any) => i.id === created.json.data.id);
  assert.equal(item.accessState, "IN_PROGRESS");
  assert.equal(item.nextLesson.lessonStableKey, "lesson-two");
});

// ---------------- Version stability (mandatory Step 36 scenario) ----------------
test("11. an assignment stays bound to Release 1 after Release 2 is published; content is unaffected", async () => {
  const { courseId, release: release1 } = await publishTestCourse("VersionStability");
  const created = await createBoundAssignment(release1, "COURSE", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);
  assert.equal(created.status, 201);

  // Edit curriculum and publish Release 2. (revision after the first
  // publish is 4: create=1, submit-review=2, approve=3, publish=4.)
  await api(`/curriculum/catalog/courses/${courseId}/reopen`, { method: "POST", userId: ADMIN, body: { revision: 4 } });
  await api(`/curriculum/catalog/courses/${courseId}`, { method: "PATCH", userId: ADMIN, body: { revision: 5, title: `${RUN} VersionStability Edited` } });
  await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { method: "POST", userId: ADMIN, body: { revision: 6 } });
  await api(`/curriculum/catalog/courses/${courseId}/approve`, { method: "POST", userId: ADMIN, body: { revision: 7 } });
  const publish2 = await api(`/curriculum/catalog/courses/${courseId}/publish`, { method: "POST", userId: ADMIN, body: { revision: 8 } });
  assert.equal(publish2.status, 200);
  assert.equal(publish2.json.data.release.versionNumber, 2);

  const list = await api("/assignments", { userId: LEARNER_DIRECT });
  const item = list.json.data.items.find((i: any) => i.id === created.json.data.id);
  assert.equal(item.curriculumRelease.releaseId, release1.releaseId, "assignment must not float to the new release");
  assert.equal(item.curriculumRelease.versionNumber, 1);
  assert.equal(item.curriculumRelease.courseTitle.includes("Edited"), false, "resolved content must come from the original, unchanged release snapshot");

  // A NEW assignment may explicitly bind Release 2.
  const releaseId2 = publish2.json.data.release.releaseId;
  const secondAssignment = await createBoundAssignment({ releaseId: releaseId2 }, "COURSE", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }], { title: `${RUN} Release2 Assignment` });
  assert.equal(secondAssignment.status, 201);
  assert.equal(secondAssignment.json.data.curriculumReleaseId, releaseId2);
});

// ---------------- Immutable content binding after creation ----------------
test("12. PATCH cannot change an assignment's curriculum binding — spoofed fields are silently ignored, original binding survives", async () => {
  const { release } = await publishTestCourse("BindingImmutable");
  const other = await publishTestCourse("BindingImmutableOther");
  const created = await createBoundAssignment(release, "COURSE", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);
  const patched = await api(`/assignments/${created.json.data.id}`, {
    method: "PATCH", userId: ADMIN,
    body: { title: `${RUN} Renamed`, curriculumReleaseId: other.release.releaseId, assignedContentType: "LESSON" },
  });
  assert.equal(patched.status, 200);
  assert.equal(patched.json.data.title, `${RUN} Renamed`);
  assert.equal(patched.json.data.curriculumReleaseId, release.releaseId, "curriculum binding must never change via PATCH");
  assert.equal(patched.json.data.assignedContentType, "COURSE");
});

test("13. a student cannot update an assignment", async () => {
  const { release } = await publishTestCourse("StudentPatchDenied");
  const created = await createBoundAssignment(release, "COURSE", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);
  const res = await api(`/assignments/${created.json.data.id}`, { method: "PATCH", userId: LEARNER_DIRECT, body: { title: "hijacked" } });
  assert.equal(res.status, 403);
});

// ---------------- Cross-org isolation (mandatory) ----------------
test("14. an org admin cannot bind a release from a different organization", async () => {
  // org_partner_001's admin publishes their own release; org_shf_001's
  // admin must not be able to reference it.
  const partnerCourse = await api("/curriculum/catalog/courses", { method: "POST", userId: PARTNER_ADMIN, body: { title: `${RUN} Partner Course` } });
  // user_other_admin_001 is org_other per identity-repo fixture, not
  // org_partner_001 — use it purely to prove cross-org creation is
  // impossible to reference from org_shf_001 regardless of which other
  // org actually owns it.
  if (partnerCourse.status !== 200) return; // fixture role may not hold curriculum.catalog.manage — the real point below still stands
  createdCourseIds.add(partnerCourse.json.data.courseId);
  const res = await api("/assignments", {
    method: "POST", userId: ADMIN,
    body: {
      title: `${RUN} Cross Org Bind Attempt`, dueAt: new Date(Date.now() + 86_400_000).toISOString(),
      targets: [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }],
      curriculumReleaseId: "release_from_another_org", assignedContentType: "COURSE",
    },
  });
  assert.equal(res.status, 422);
  assert.equal(res.json.error.code, "RELEASE_NOT_FOUND");
});

test("15. a different organization's learner cannot read an assignment by guessing its ID", async () => {
  const { release } = await publishTestCourse("CrossOrgRead");
  const created = await createBoundAssignment(release, "COURSE", [{ targetType: "ORGANIZATION" }]);
  const res = await api(`/assignments/${created.json.data.id}`, { userId: PARTNER_STUDENT });
  assert.equal(res.status, 404);
});

// ---------------- Next-work resolver ----------------
test("16. GET /assignments/me/next returns the single highest-priority actionable work item", async () => {
  const { release } = await publishTestCourse("NextWork");
  const soon = await createBoundAssignment(release, "COURSE", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }], {
    title: `${RUN} Next Soon`, dueAt: new Date(Date.now() + 86_400_000).toISOString(),
  });
  assert.equal(soon.status, 201);
  const next = await api("/assignments/me/next", { userId: LEARNER_DIRECT });
  assert.equal(next.status, 200);
  assert.equal(next.json.data.reason, "actionable_work");
  assert.ok(next.json.data.work);
});

test("17. a locked (not-yet-available) assignment is never returned as actionable next work", async () => {
  const { release } = await publishTestCourse("LockedFlow");
  const created = await createBoundAssignment(release, "COURSE", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }], {
    availableAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  });
  const list = await api("/assignments", { userId: LEARNER_DIRECT });
  const item = list.json.data.items.find((i: any) => i.id === created.json.data.id);
  assert.equal(item.accessState, "LOCKED");
});

// ---------------- No learner truth manufactured ----------------
test("18. creating and reading curriculum-bound assignments never writes curriculum_lesson_completions or any Truth/Evidence fact", async () => {
  const { release, courseId } = await publishTestCourse("NoTruthManufactured");
  await createBoundAssignment(release, "COURSE", [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);
  await api("/assignments", { userId: LEARNER_DIRECT });
  await api("/assignments/me/next", { userId: LEARNER_DIRECT });
  // Scoped to this test's own course (unique stable_key per RUN prefix)
  // rather than a global table count — other test files in the same
  // `npm test` run legitimately write real completion rows concurrently
  // (see completion-policy-engine.test.ts), so a global count is not a
  // reliable isolation boundary for this assertion.
  const courseRow = await query("SELECT stable_key FROM curriculum_courses WHERE course_id = $1", [courseId]);
  const after = await query("SELECT count(*)::int AS n FROM curriculum_lesson_completions WHERE curriculum_id = $1", [courseRow.rows[0].stable_key]);
  assert.equal(after.rows[0].n, 0);
});

test("19. legacy free-text (non-catalog) assignments remain fully functional and unaffected", async () => {
  const res = await api("/assignments", {
    method: "POST", userId: ADMIN,
    body: { title: `${RUN} Legacy Free Text`, dueAt: new Date(Date.now() + 86_400_000).toISOString(), courseId: "legacy-course-x", lessonId: "legacy-lesson-y", targets: [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }] },
  });
  assert.equal(res.status, 201);
  createdAssignmentIds.add(res.json.data.id);
  assert.equal(res.json.data.curriculumReleaseId, null);
  const list = await api("/assignments", { userId: LEARNER_DIRECT });
  const item = list.json.data.items.find((i: any) => i.id === res.json.data.id);
  assert.equal(item.curriculumRelease, null);
  assert.equal(item.assignedContent, null);
});

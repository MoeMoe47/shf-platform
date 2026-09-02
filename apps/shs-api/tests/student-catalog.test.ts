// SHF Curriculum Phase 5.5 — student-facing catalog read routes
// (/curriculum/learning/courses, /curriculum/learning/courses/:courseId).
// Integration tests against the real running dev server and Postgres —
// same convention and fixtures as tests/curriculum-assignment-binding.test.ts.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase55_${Date.now()}`;

const ADMIN = "user_admin_001"; // org_shf_001, admin-tier
const LEARNER_DIRECT = "user_assignment_technical_001"; // org_shf_001, real fixture
const LEARNER_NONE = "user_no_assignment_001"; // org_shf_001, no entitlement at all
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
const createdResourceIds = new Set<string>();

async function cleanup() {
  const asmtIds = [...createdAssignmentIds];
  if (asmtIds.length) {
    await query("DELETE FROM assignment_targets WHERE assignment_id = ANY($1::text[])", [asmtIds]);
    await query("DELETE FROM assignments WHERE assignment_id = ANY($1::text[])", [asmtIds]);
  }
  const courseIds = [...createdCourseIds];
  if (courseIds.length) {
    await query(
      "DELETE FROM curriculum_lesson_resources WHERE lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[])))",
      [courseIds],
    );
    await query("DELETE FROM curriculum_lesson_completions WHERE curriculum_id IN (SELECT stable_key FROM curriculum_courses WHERE course_id = ANY($1::text[]))", [courseIds]);
    await query("DELETE FROM curriculum_releases WHERE course_id = ANY($1::text[])", [courseIds]);
    await query("DELETE FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[]))", [courseIds]);
    await query("DELETE FROM curriculum_units WHERE course_id = ANY($1::text[])", [courseIds]);
    await query("DELETE FROM curriculum_courses WHERE course_id = ANY($1::text[])", [courseIds]);
  }
  const resourceIds = [...createdResourceIds];
  if (resourceIds.length) {
    await query("DELETE FROM curriculum_resources WHERE resource_id = ANY($1::text[])", [resourceIds]);
  }
}

before(cleanup);
after(cleanup);

async function publishTestCourse(titleSuffix: string) {
  const course = await api("/curriculum/catalog/courses", { method: "POST", userId: ADMIN, body: { title: `${RUN} ${titleSuffix}` } });
  assert.equal(course.status, 200);
  const courseId = course.json.data.courseId;
  createdCourseIds.add(courseId);

  const unit = await api(`/curriculum/catalog/courses/${courseId}/units`, { method: "POST", userId: ADMIN, body: { title: "Unit One", stableKey: "unit-one" } });
  const unitId = unit.json.data.unitId;

  await api(`/curriculum/catalog/units/${unitId}/lessons`, { method: "POST", userId: ADMIN, body: { title: "Lesson One", stableKey: "lesson-one" } });
  await api(`/curriculum/catalog/units/${unitId}/lessons`, { method: "POST", userId: ADMIN, body: { title: "Lesson Two", stableKey: "lesson-two" } });

  await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { method: "POST", userId: ADMIN, body: { revision: 1 } });
  await api(`/curriculum/catalog/courses/${courseId}/approve`, { method: "POST", userId: ADMIN, body: { revision: 2 } });
  const published = await api(`/curriculum/catalog/courses/${courseId}/publish`, { method: "POST", userId: ADMIN, body: { revision: 3 } });
  assert.equal(published.status, 200);

  return { courseId, stableKey: published.json.data.release.snapshot.course.stableKey, release: published.json.data.release };
}

async function assignCourse(release: any, targets: unknown[]) {
  const res = await api("/assignments", {
    method: "POST",
    userId: ADMIN,
    body: {
      title: `${RUN} Assignment`,
      dueAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      targets,
      curriculumReleaseId: release.releaseId,
      assignedContentType: "COURSE",
    },
  });
  if (res.status === 201) createdAssignmentIds.add(res.json.data.id);
  return res;
}

test("1. GET /curriculum/learning/courses lists a course the student has a real assignment for, with real unit/lesson counts", async () => {
  const { release, stableKey } = await publishTestCourse("ListFlow");
  await assignCourse(release, [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);

  const list = await api("/curriculum/learning/courses", { userId: LEARNER_DIRECT });
  assert.equal(list.status, 200);
  const item = list.json.data.items.find((c: any) => c.stableKey === stableKey);
  assert.ok(item, "entitled student must see the course");
  assert.equal(item.unitCount, 1);
  assert.equal(item.lessonCount, 2);
  assert.equal(item.completedCount, 0);
  assert.equal(item.progressPercent, 0);
});

test("2. a student with no assignment for the course does not see it in their course list", async () => {
  const { release, stableKey } = await publishTestCourse("NoEntitlementFlow");
  await assignCourse(release, [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);

  const list = await api("/curriculum/learning/courses", { userId: LEARNER_NONE });
  assert.equal(list.status, 200);
  assert.equal(list.json.data.items.some((c: any) => c.stableKey === stableKey), false);
});

test("3. GET /curriculum/learning/courses/:courseId returns the real Unit/Lesson accordion structure for an entitled student", async () => {
  const { release, stableKey } = await publishTestCourse("DetailFlow");
  await assignCourse(release, [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);

  const detail = await api(`/curriculum/learning/courses/${stableKey}`, { userId: LEARNER_DIRECT });
  assert.equal(detail.status, 200);
  assert.equal(detail.json.data.units.length, 1);
  assert.equal(detail.json.data.units[0].lessons.length, 2);
  assert.equal(detail.json.data.units[0].lessons[0].status, "in_progress");
  assert.equal(detail.json.data.units[0].lessons[1].status, "upcoming");
  assert.equal(detail.json.data.nextLesson.lessonStableKey, "lesson-one");
});

test("4. a student not entitled to the course gets a 404 on the detail route, not a 403 or leaked data", async () => {
  const { release, stableKey } = await publishTestCourse("DetailDenyFlow");
  await assignCourse(release, [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);

  const detail = await api(`/curriculum/learning/courses/${stableKey}`, { userId: LEARNER_NONE });
  assert.equal(detail.status, 404);
});

test("5. a student in a different organization cannot see the course at all (cross-org isolation)", async () => {
  const { release, stableKey } = await publishTestCourse("CrossOrgFlow");
  await assignCourse(release, [{ targetType: "ORGANIZATION" }]);

  const list = await api("/curriculum/learning/courses", { userId: PARTNER_STUDENT });
  assert.equal(list.status, 200);
  assert.equal(list.json.data.items.some((c: any) => c.stableKey === stableKey), false);

  const detail = await api(`/curriculum/learning/courses/${stableKey}`, { userId: PARTNER_STUDENT });
  assert.equal(detail.status, 404);
});

test("6a. course.resources reflects a real per-lesson resource frozen into the release snapshot", async () => {
  const course = await api("/curriculum/catalog/courses", { method: "POST", userId: ADMIN, body: { title: `${RUN} ResourceFlow` } });
  const courseId = course.json.data.courseId;
  createdCourseIds.add(courseId);
  const unit = await api(`/curriculum/catalog/courses/${courseId}/units`, { method: "POST", userId: ADMIN, body: { title: "Unit One", stableKey: "unit-one" } });
  const unitId = unit.json.data.unitId;
  const lesson = await api(`/curriculum/catalog/units/${unitId}/lessons`, { method: "POST", userId: ADMIN, body: { title: "Lesson One", stableKey: "lesson-one" } });
  const lessonId = lesson.json.data.lessonId;

  const resource = await api("/curriculum/catalog/resources", { method: "POST", userId: ADMIN, body: { title: "Reference Sheet", resourceType: "DOCUMENT", externalUrl: "https://example.org/ref.pdf" } });
  assert.equal(resource.status, 200);
  createdResourceIds.add(resource.json.data.resourceId);
  await api(`/curriculum/catalog/lessons/${lessonId}/resources/${resource.json.data.resourceId}`, { method: "POST", userId: ADMIN });

  await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { method: "POST", userId: ADMIN, body: { revision: 1 } });
  await api(`/curriculum/catalog/courses/${courseId}/approve`, { method: "POST", userId: ADMIN, body: { revision: 2 } });
  const published = await api(`/curriculum/catalog/courses/${courseId}/publish`, { method: "POST", userId: ADMIN, body: { revision: 3 } });
  const stableKey = published.json.data.release.snapshot.course.stableKey;

  await assignCourse(published.json.data.release, [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);

  const detail = await api(`/curriculum/learning/courses/${stableKey}`, { userId: LEARNER_DIRECT });
  assert.equal(detail.status, 200);
  assert.equal(detail.json.data.resources.length, 1);
  assert.equal(detail.json.data.resources[0].title, "Reference Sheet");
  assert.equal(detail.json.data.resources[0].externalUrl, "https://example.org/ref.pdf");
});

test("6. course progress reflects a real lesson completion, not a fabricated number", async () => {
  const { release, stableKey } = await publishTestCourse("ProgressFlow");
  const created = await assignCourse(release, [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }]);
  assert.equal(created.status, 201);

  const checkResult = await api(`/assignments/${created.json.data.id}/check-completion`, {
    method: "POST",
    userId: LEARNER_DIRECT,
    body: { unitStableKey: "unit-one", lessonStableKey: "lesson-one" },
  });
  assert.equal(checkResult.status, 200);

  const detail = await api(`/curriculum/learning/courses/${stableKey}`, { userId: LEARNER_DIRECT });
  assert.equal(detail.json.data.completedCount, checkResult.json.data.complete ? 1 : 0);
  assert.equal(detail.json.data.progressPercent, checkResult.json.data.complete ? 50 : 0);
});

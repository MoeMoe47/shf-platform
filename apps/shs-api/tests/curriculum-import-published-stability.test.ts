import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `ci45a_${Date.now() + 1000}`;
const ADMIN = `user_${RUN}_admin_a`;
const LEARNER = `user_${RUN}_student`;
const SOURCE = `${RUN}source`;
const contentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../src/content/lessons");
const fixtureDir = path.join(contentRoot, `${SOURCE}-student`);

async function api(route: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const response = await fetch(`${BASE}${route}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...(opts.userId ? { Authorization: `Bearer dev-token:${opts.userId}` } : {}) },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  return { status: response.status, json: await response.json().catch(() => ({})) };
}

function writeSource(title: string) {
  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.writeFileSync(path.join(fixtureDir, "lesson-one.json"), JSON.stringify({ title, objectives: ["Objective"] }, null, 2));
}

test("published importer re-import preserves Release 1 and assignment binding", async () => {
  let courseId = "";
  let assignmentId = "";
  try {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1, 'org_shf_001', $2, 'Phase 4.5B Published Admin', 'active', 'local'), ($3, 'org_shf_001', $4, 'Phase 4.5B Published Learner', 'active', 'local') ON CONFLICT (user_id) DO NOTHING`,
      [ADMIN, `${ADMIN}@test.invalid`, LEARNER, `${LEARNER}@test.invalid`],
    ));
    writeSource("Published Lesson One");

    const created = await api("/curriculum/import-jobs", { method: "POST", userId: ADMIN, body: { importType: "STATIC_JSON", sourceKey: SOURCE } });
    assert.equal(created.status, 200);
    const firstImport = await api(`/curriculum/import-jobs/${created.json.data.job.importJobId}/execute`, { method: "POST", userId: ADMIN });
    assert.equal(firstImport.status, 200);
    courseId = firstImport.json.data.courseId;

    const course = await api(`/curriculum/catalog/courses/${courseId}`, { userId: ADMIN });
    const submitted = await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { method: "POST", userId: ADMIN, body: { revision: course.json.data.course.revision } });
    const approved = await api(`/curriculum/catalog/courses/${courseId}/approve`, { method: "POST", userId: ADMIN, body: { revision: submitted.json.data.revision } });
    const published = await api(`/curriculum/catalog/courses/${courseId}/publish`, { method: "POST", userId: ADMIN, body: { revision: approved.json.data.revision } });
    assert.equal(published.status, 200);
    const release1 = published.json.data.release;

    const assignment = await api("/assignments", {
      method: "POST", userId: ADMIN,
      body: { title: `${RUN} Assignment`, dueAt: new Date(Date.now() + 86400000).toISOString(), targets: [{ targetType: "LEARNER", learnerUserId: LEARNER }], curriculumReleaseId: release1.releaseId, assignedContentType: "COURSE" },
    });
    assert.equal(assignment.status, 201);
    assignmentId = assignment.json.data.id;

    writeSource("Published Lesson One Revised");
    const reimport = await api("/curriculum/import-jobs", { method: "POST", userId: ADMIN, body: { importType: "STATIC_JSON", sourceKey: SOURCE } });
    assert.equal(reimport.json.data.job.status, "READY");
    const secondImport = await api(`/curriculum/import-jobs/${reimport.json.data.job.importJobId}/execute`, { method: "POST", userId: ADMIN });
    assert.equal(secondImport.status, 200);

    const afterImport = await api(`/curriculum/catalog/courses/${courseId}`, { userId: ADMIN });
    const submitted2 = await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { method: "POST", userId: ADMIN, body: { revision: afterImport.json.data.course.revision } });
    const approved2 = await api(`/curriculum/catalog/courses/${courseId}/approve`, { method: "POST", userId: ADMIN, body: { revision: submitted2.json.data.revision } });
    const published2 = await api(`/curriculum/catalog/courses/${courseId}/publish`, { method: "POST", userId: ADMIN, body: { revision: approved2.json.data.revision } });
    assert.equal(published2.status, 200);
    assert.equal(published2.json.data.release.versionNumber, 2);
    assert.notEqual(published2.json.data.release.releaseId, release1.releaseId);

    const release1After = await api(`/curriculum/catalog/releases/${release1.releaseId}`, { userId: ADMIN });
    assert.equal(release1After.json.data.contentHash, release1.contentHash);
    assert.deepEqual(release1After.json.data.snapshot, release1.snapshot);
    const assignmentAfter = await api(`/assignments/${assignmentId}`, { userId: LEARNER });
    assert.equal(assignmentAfter.json.data.curriculumReleaseId, release1.releaseId);
  } finally {
    if (assignmentId) {
      await query("DELETE FROM assignment_targets WHERE assignment_id = $1", [assignmentId]);
      await query("DELETE FROM assignments WHERE assignment_id = $1", [assignmentId]);
    }
    if (courseId) {
      await query("DELETE FROM curriculum_releases WHERE course_id = $1", [courseId]);
      await query("DELETE FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = $1)", [courseId]);
      await query("DELETE FROM curriculum_units WHERE course_id = $1", [courseId]);
      await query("DELETE FROM curriculum_courses WHERE course_id = $1", [courseId]);
    }
    await query("DELETE FROM curriculum_import_candidates WHERE import_job_id IN (SELECT import_job_id FROM curriculum_import_jobs WHERE source_key = $1)", [SOURCE]);
    await query("DELETE FROM curriculum_import_jobs WHERE source_key = $1", [SOURCE]);
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
});

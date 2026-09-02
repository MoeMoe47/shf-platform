import { test } from "node:test";
import assert from "node:assert/strict";
import { StudioProjectService } from "../src/domain/studio/service/studio-project-service.ts";
import { rowToStudioReviewSubmission } from "../src/domain/studio/model/studio-review.ts";

const student = { user_id: "learner-a", active_organization_id: "org-a", organization_id: "org-a", tenant_id: "tenant:org-a", roles: ["student"], permissions: ["studio.project.view", "studio.project.update"] };
const reviewer = { user_id: "reviewer-a", active_organization_id: "org-a", organization_id: "org-a", tenant_id: "tenant:org-a", roles: ["instructor"], permissions: ["project.submission.review"] };
const project = { project_id: "studio-project-a", organization_id: "org-a", tenant_id: "tenant:org-a", studio_origin: "STUDENT_IDEA", studio_learner_id: "learner-a", studio_project_type: "WEBSITE", studio_status: "DRAFT" };
const work = { pages: [{ path: "/", title: "Home", content: "Saved content" }] };

function serviceWith(rows: (sql: string, params?: unknown[]) => any, events: any[] = []) {
  return new StudioProjectService(async (sql, params) => rows(sql, params), undefined as any, { enqueue: async (event: any) => { events.push(event); } } as any);
}

test("submission binds to current QA revision and stores an immutable work snapshot", async () => {
  const events: any[] = [];
  const db = serviceWith(async (sql: string) => {
    if (sql.includes("SELECT * FROM projects")) return { rows: [project] };
    if (sql.includes("studio_builder_workspaces") && sql.includes("SELECT *")) return { rows: [{ project_id: project.project_id, project_type: "WEBSITE", revision: 3, work_json: work }] };
    if (sql.includes("studio_qa_runs") && sql.includes("status='PASSED'")) return { rows: [{ qa_run_id: "qa-3" }] };
    if (sql.includes("studio_review_submissions") && sql.includes("workspace_revision=$4")) return { rows: [] };
    if (sql.startsWith("INSERT INTO studio_review_submissions")) return { rows: [{ review_submission_id: "new" }] };
    return { rows: [] };
  }, events);
  const submission = await db.submitForReview(student, project.project_id);
  assert.equal(submission.workspaceRevision, 3);
  assert.equal(submission.qaRunId, "qa-3");
  assert.equal(submission.status, "SUBMITTED");
  assert.equal(events[0].event_type, "studio.review.submitted");
  assert.notEqual(events[0].event_type, "project.submission.reviewed");
});

test("reviewer receives the submitted snapshot and exact QA revision, not current work", async () => {
  const submitted = { review_submission_id: "submission-3", project_id: project.project_id, organization_id: "org-a", tenant_id: "tenant:org-a", project_type: "WEBSITE", workspace_revision: 3, qa_run_id: "qa-3", submitted_work_json: work, status: "SUBMITTED", submitted_by_user_id: "learner-a", created_at: "now", submitted_at: "now", review_decision_id: null };
  const db = serviceWith(async (sql: string) => {
    if (sql.includes("SELECT * FROM projects")) return { rows: [project] };
    if (sql.includes("SELECT s.*, d")) return { rows: [submitted] };
    if (sql.includes("SELECT revision FROM studio_builder_workspaces")) return { rows: [{ revision: 4 }] };
    if (sql.includes("qa_run_id=$1")) return { rows: [{ qa_run_id: "qa-3", project_id: project.project_id, organization_id: "org-a", tenant_id: "tenant:org-a", project_type: "WEBSITE", workspace_revision: 3, status: "PASSED", ruleset_version: "studio-qa-v1", summary_json: {}, findings_json: [] }] };
    return { rows: [] };
  });
  const result = await db.getReviewSubmission(reviewer, project.project_id, "submission-3");
  assert.deepEqual(result.work, work);
  assert.equal(result.qaRun.workspaceRevision, 3);
  assert.equal(result.submission.isCurrent, false);
  assert.equal(result.currentWorkspaceRevision, 4);
});

test("ordinary students cannot decide reviews and decisions are not completion authority", async () => {
  const db = serviceWith(async () => ({ rows: [] }));
  await assert.rejects(() => db.decideReview(student, project.project_id, "submission-3", { decision: "APPROVED", feedback: "" }), /project_submission_review_required/);
  const mapped = rowToStudioReviewSubmission({ review_submission_id: "s", project_id: "p", organization_id: "o", tenant_id: "tenant:o", project_type: "WEBSITE", workspace_revision: 2, qa_run_id: "q", status: "APPROVED", submitted_by_user_id: "u", created_at: "now", submitted_at: "now" }, { review_decision_id: "d", decision: "APPROVED", feedback: "Looks good", reviewed_by_user_id: "r", reviewed_at: "now" }, 2);
  assert.equal(mapped.status, "APPROVED");
  assert.equal((mapped as any).completion, undefined);
  assert.equal((mapped as any).evidence, undefined);
});

test("a later workspace revision is a new reviewable submission and does not rewrite history", () => {
  const old = rowToStudioReviewSubmission({ review_submission_id: "old", project_id: "p", organization_id: "o", tenant_id: "tenant:o", project_type: "AI_AGENT", workspace_revision: 2, qa_run_id: "q2", status: "CHANGES_REQUESTED", submitted_by_user_id: "u", created_at: "t2", submitted_at: "t2" }, null, 3);
  const next = rowToStudioReviewSubmission({ review_submission_id: "new", project_id: "p", organization_id: "o", tenant_id: "tenant:o", project_type: "AI_AGENT", workspace_revision: 3, qa_run_id: "q3", status: "SUBMITTED", submitted_by_user_id: "u", created_at: "t3", submitted_at: "t3" }, null, 3);
  assert.equal(old.workspaceRevision, 2);
  assert.equal(old.isCurrent, false);
  assert.equal(next.workspaceRevision, 3);
  assert.equal(next.isCurrent, true);
});

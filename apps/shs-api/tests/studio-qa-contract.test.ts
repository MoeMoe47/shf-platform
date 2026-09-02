import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateStudioQa } from "../src/domain/studio/model/studio-qa.ts";
import { StudioProjectService } from "../src/domain/studio/service/studio-project-service.ts";

const student = {
  user_id: "learner-a", organization_id: "org-a", active_organization_id: "org-a", tenant_id: "tenant:org-a",
  roles: ["student"], permissions: ["studio.project.view"],
};

function project(type = "WEBSITE") {
  return {
    project_id: "studio-project-a", organization_id: "org-a", tenant_id: "tenant:org-a", studio_learner_id: "learner-a",
    studio_project_type: type, studio_origin: "STUDENT_IDEA", studio_status: "DRAFT", studio_qa_status: "NOT_RUN",
    studio_review_status: "NOT_REQUESTED", studio_delivery_status: "NOT_READY", studio_destination: "STUDENT",
    studio_assignment_id: null, studio_curriculum_release_id: null, studio_completion_policy_id: null, title: "Project",
  };
}

test("Website QA deterministically fails missing title/content and passes valid work", () => {
  const failed = evaluateStudioQa("WEBSITE", { pages: [{ path: "/", title: "", content: "" }] }, true);
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.summary.fail, 2);
  const passed = evaluateStudioQa("WEBSITE", { pages: [{ path: "/", title: "Home", content: "Welcome" }] }, true);
  assert.equal(passed.status, "PASSED");
  assert.equal(passed.summary.fail, 0);
});

test("AI Agent QA uses Agent checks and never treats missing work as passed", () => {
  const failed = evaluateStudioQa("AI_AGENT", { name: "", instructions: "", tools: [] }, true);
  assert.equal(failed.status, "FAILED");
  assert.deepEqual(failed.findings.filter((item) => item.status === "FAIL").map((item) => item.checkId), ["AGENT_NAME_PRESENT", "AGENT_INSTRUCTIONS_PRESENT"]);
  const missing = evaluateStudioQa("AI_AGENT", { name: "", instructions: "", tools: [] }, false);
  assert.equal(missing.status, "FAILED");
  assert.equal(missing.findings[0].checkId, "WORKSPACE_SAVED");
  assert.equal(evaluateStudioQa("WEBSITE", { pages: [{ path: "../unsafe", title: "x", content: "x" }] }, true).status, "ERROR");
});

test("QA run is revision-bound, emits only an operational event, and leaves lifecycle unchanged", async () => {
  const events: any[] = [];
  const row = project();
  const workspace = { workspace_id: "workspace-a", project_id: row.project_id, project_type: "WEBSITE", revision: 2, work_json: { pages: [{ path: "/", title: "Home", content: "Saved" }] }, created_at: "now", updated_at: "now" };
  const db = { async query(sql: string) {
    if (sql.includes("SELECT * FROM projects")) return { rows: [row] };
    if (sql.includes("studio_builder_workspaces")) return { rows: [workspace] };
    if (sql.includes("INSERT INTO studio_qa_runs")) return { rows: [] };
    if (sql.includes("SELECT assignment_id, curriculum_release_id")) return { rows: [] };
    if (sql.includes("SELECT unit_key, lesson_key")) return { rows: [] };
    if (sql.includes("SELECT snapshot")) return { rows: [] };
    return { rows: [] };
  } } as any;
  const service = new StudioProjectService(db.query.bind(db), undefined as any, { enqueue: async (event: any) => { events.push(event); } } as any);
  const run = await service.runQa(student, row.project_id);
  assert.equal(run.workspaceRevision, 2);
  assert.equal(run.status, "PASSED");
  assert.equal(run.rulesetVersion, "studio-qa-v1");
  assert.equal(events[0].event_type, "studio.qa.completed");
  assert.equal(row.studio_status, "DRAFT");
  assert.equal(row.studio_qa_status, "NOT_RUN");
});

test("foreign organization cannot run QA for a Studio project", async () => {
  const row = project();
  const db = { async query(sql: string) { return sql.includes("SELECT * FROM projects") ? { rows: [row] } : { rows: [] }; } } as any;
  const service = new StudioProjectService(db.query.bind(db), undefined as any, { enqueue: async () => undefined } as any);
  await assert.rejects(() => service.runQa({ ...student, organization_id: "org-b", active_organization_id: "org-b", tenant_id: "tenant:org-b" }, row.project_id), /PROJECT_NOT_FOUND/);
});

test("latest QA is stale when the project has a newer workspace revision", async () => {
  const row = project();
  const workspace = { workspace_id: "workspace-a", project_id: row.project_id, project_type: "WEBSITE", revision: 3, work_json: { pages: [{ path: "/", title: "Home", content: "Saved" }] } };
  const qa = { qa_run_id: "qa-a", project_id: row.project_id, organization_id: "org-a", tenant_id: "tenant:org-a", project_type: "WEBSITE", workspace_revision: 2, status: "PASSED", ruleset_version: "studio-qa-v1", summary_json: {}, findings_json: [], created_by_user_id: "learner-a", started_at: "now", completed_at: "now", created_at: "now" };
  const db = { async query(sql: string) {
    if (sql.includes("SELECT * FROM projects")) return { rows: [row] };
    if (sql.includes("studio_builder_workspaces")) return { rows: [workspace] };
    if (sql.includes("studio_qa_runs")) return { rows: [qa] };
    return { rows: [] };
  } } as any;
  const service = new StudioProjectService(db.query.bind(db), undefined as any, { enqueue: async () => undefined } as any);
  const current = await service.getCurrentQa(student, row.project_id);
  assert.equal(current.status, "STALE");
  assert.equal(current.run.workspaceRevision, 2);
});

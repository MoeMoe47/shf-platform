import { test } from "node:test";
import assert from "node:assert/strict";
import { StudioProjectService } from "../src/domain/studio/service/studio-project-service.ts";

const actor = {
  user_id: "learner-a",
  active_organization_id: "org-a",
  organization_id: "org-a",
  tenant_id: "tenant:org-a",
  roles: ["student"],
  permissions: ["studio.project.view", "studio.project.finalize"],
};

function project(type = "WEBSITE") {
  return {
    project_id: "studio-project-a", organization_id: "org-a", tenant_id: "tenant:org-a",
    studio_learner_id: "learner-a", studio_project_type: type, studio_origin: "STUDENT_IDEA",
    studio_destination: "STUDENT", studio_status: "DRAFT", studio_qa_status: "NOT_RUN",
    studio_review_status: "NOT_REQUESTED", studio_delivery_status: "NOT_READY",
  };
}

function workspace(revision = 3) {
  return { workspace_id: "workspace-a", project_id: "studio-project-a", organization_id: "org-a", tenant_id: "tenant:org-a", project_type: "WEBSITE", revision, work_json: { pages: [{ path: "/", title: "Home", content: "Saved" }] } };
}

function eligible(revision = 3, type = "WEBSITE") {
  return { review_submission_id: "submission-a", project_id: "studio-project-a", organization_id: "org-a", tenant_id: "tenant:org-a", project_type: type, workspace_revision: revision, qa_run_id: "qa-a", status: "APPROVED", review_decision_id: "decision-a" };
}

function delivery(revision = 3, type = "WEBSITE") {
  return { delivery_record_id: "delivery-a", project_id: "studio-project-a", organization_id: "org-a", tenant_id: "tenant:org-a", submission_id: "submission-a", review_decision_id: "decision-a", qa_run_id: "qa-a", workspace_revision: revision, project_type: type, destination: "STUDENT", status: "FINALIZED", requested_by_user_id: "learner-a", requested_at: "now", finalized_by_user_id: "learner-a", finalized_at: "now", created_at: "now" };
}

function harness(options: { qa?: boolean; existing?: any; revision?: number; type?: string } = {}) {
  const sql: string[] = [];
  const events: any[] = [];
  const row = project(options.type || "WEBSITE");
  const work = workspace(options.revision ?? 3);
  const db = {
    async query(statement: string) {
      sql.push(statement);
      if (statement.includes("SELECT * FROM projects")) return { rows: [row] };
      if (statement.includes("studio_builder_workspaces")) return { rows: [work] };
      if (statement.includes("FROM studio_review_submissions")) return { rows: options.qa === false || options.revision !== undefined ? [] : [eligible(work.revision, row.studio_project_type)] };
      if (statement.includes("FROM studio_delivery_records")) return { rows: options.existing ? [options.existing] : [] };
      if (statement.includes("INSERT INTO studio_delivery_records")) return { rows: [options.existing || delivery(work.revision, row.studio_project_type)] };
      return { rows: [] };
    },
  } as any;
  const service = new StudioProjectService(db.query.bind(db), undefined as any, { enqueue: async (event: any) => { events.push(event); } } as any);
  return { service, sql, events };
}

test("eligible finalization records exact approved Website revision and emits only delivery event", async () => {
  const h = harness();
  const result = await h.service.finalizeProject(actor, "studio-project-a");
  assert.equal(result.status, "FINALIZED");
  assert.equal(result.workspaceRevision, 3);
  assert.equal(result.projectType, "WEBSITE");
  assert.equal(result.destination, "STUDENT");
  assert.deepEqual(h.events.map((event) => event.event_type), ["studio.delivery.finalized"]);
  assert.equal(h.sql.some((statement) => /UPDATE (projects|studio_builder_workspaces|studio_qa_runs|studio_review)/i.test(statement)), false);
});

test("missing or stale QA/review eligibility fails closed", async () => {
  await assert.rejects(() => harness({ qa: false }).service.finalizeProject(actor, "studio-project-a"), /DELIVERY_NOT_ELIGIBLE/);
  await assert.rejects(() => harness({ revision: 4 }).service.finalizeProject(actor, "studio-project-a"), /DELIVERY_NOT_ELIGIBLE/);
});

test("foreign organization cannot finalize a Studio project", async () => {
  const h = harness();
  await assert.rejects(() => h.service.finalizeProject({ ...actor, organization_id: "org-b", active_organization_id: "org-b", tenant_id: "tenant:org-b" }, "studio-project-a"), /PROJECT_NOT_FOUND/);
});

test("same approved submission finalization is idempotent", async () => {
  const h = harness({ existing: delivery() });
  const result = await h.service.finalizeProject(actor, "studio-project-a");
  assert.equal(result.deliveryRecordId, "delivery-a");
  assert.equal(h.events.length, 0);
});

test("AI Agent finalization preserves canonical project type and ignores browser authority", async () => {
  const h = harness({ type: "AI_AGENT" });
  const result = await h.service.finalizeProject(actor, "studio-project-a");
  assert.equal(result.projectType, "AI_AGENT");
  assert.equal(result.workspaceRevision, 3);
});

test("delivery read distinguishes a finalized historical revision from current work", async () => {
  const h = harness({ existing: delivery(2), revision: 3 });
  const result = await h.service.getDelivery(actor, "studio-project-a");
  assert.equal(result.status, "STALE");
  assert.equal(result.record.isCurrent, false);
  assert.equal(result.currentWorkspaceRevision, 3);
});

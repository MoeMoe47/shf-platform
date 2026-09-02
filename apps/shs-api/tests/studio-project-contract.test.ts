import { test } from "node:test";
import assert from "node:assert/strict";
import { StudioProjectService } from "../src/domain/studio/service/studio-project-service.ts";

const student = {
  user_id: "learner-a",
  organization_id: "org-a",
  active_organization_id: "org-a",
  tenant_id: "tenant:org-a",
  roles: ["student"],
  permissions: ["studio.project.create", "studio.project.view", "studio.project.update"],
};

function fakeProject(projectType = "WEBSITE", overrides: any = {}) {
  return {
    project_id: "studio-project-test",
    organization_id: "org-a",
    tenant_id: "tenant:org-a",
    studio_learner_id: "learner-a",
    studio_project_type: projectType,
    studio_origin: "STUDENT_IDEA",
    studio_origin_reference_id: null,
    studio_destination: "STUDENT",
    studio_assignment_id: null,
    studio_curriculum_release_id: null,
    studio_completion_policy_id: null,
    studio_status: "DRAFT",
    studio_qa_status: "NOT_RUN",
    studio_review_status: "NOT_REQUESTED",
    studio_delivery_status: "NOT_READY",
    title: "My project",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function service(overrides: any = {}) {
  const events: any[] = [];
  const db = {
    async query(sql: string, params: any[] = []) {
      if (sql.includes("SELECT user_id FROM users")) return { rows: [{}] };
      if (sql.includes("INSERT INTO studio_handoffs")) return { rows: [{}] };
      if (sql.includes("INSERT INTO projects")) return { rows: [fakeProject(String(params[5] || "WEBSITE"), { studio_learner_id: params[9], studio_assignment_id: params[12] || null, studio_curriculum_release_id: params[13] || null, studio_completion_policy_id: params[14] || null, studio_destination: params[11] || "STUDENT" })] };
      return { rows: [] };
    },
  } as any;
  const outbox = { enqueue: async (event: any) => { events.push(event); return event; } } as any;
  const tx = async (fn: any) => fn(db);
  return { service: new StudioProjectService(db.query.bind(db), tx, outbox, overrides.assignmentLookup, overrides.assignments, overrides.enrollments), events };
}

test("student idea creates canonical Website and AI Agent projects with student destination", async () => {
  const first = service();
  const website = await first.service.createStudentIdea(student, { title: "Website", projectType: "WEBSITE" });
  assert.equal(website.origin, "STUDENT_IDEA");
  assert.equal(website.projectType, "WEBSITE");
  assert.equal(website.destination, "STUDENT");
  assert.equal(website.status, "DRAFT");
  assert.equal(website.qaStatus, "NOT_RUN");
  assert.equal(website.reviewStatus, "NOT_REQUESTED");
  assert.equal(website.deliveryStatus, "NOT_READY");
  assert.equal(first.events.length, 2);

  const second = service();
  const agent = await second.service.createStudentIdea(student, { title: "Agent", projectType: "AI_AGENT" });
  assert.equal(agent.projectType, "AI_AGENT");
});

test("student cannot choose commercial destination or fabricate assignment lineage", async () => {
  const harness = service();
  await assert.rejects(() => harness.service.createStudentIdea(student, { title: "Unsafe", projectType: "WEBSITE", destination: "COMMERCIAL" }), /STUDENT_DESTINATION_REQUIRED/);
});

test("invalid project type and missing organization context fail closed", async () => {
  const harness = service();
  await assert.rejects(() => harness.service.createStudentIdea(student, { title: "Invalid", projectType: "MOBILE_APP" }), /invalid_project_type/);
  await assert.rejects(() => harness.service.createStudentIdea({ ...student, tenant_id: "tenant:org-other" }, { title: "Invalid scope", projectType: "WEBSITE" }), /ORG_CONTEXT_REQUIRED/);
});

test("commercial destination requires an explicit server permission", async () => {
  const harness = service({
    assignmentLookup: async () => ({ id: "assignment-a", status: "published", title: "Assignment A", organizationId: "org-a", courseId: null, curriculumReleaseId: "release-a1", completionPolicyId: null, dueAt: "2026-10-01T00:00:00.000Z" }),
    assignments: { hasEntitlementTarget: async () => true },
    enrollments: { listActiveEnrollmentsForLearner: async () => [] },
  });
  const instructor = { ...student, user_id: "instructor-a", roles: ["instructor"], permissions: ["studio.project.create"] };
  await assert.rejects(() => harness.service.createFromAssignment(instructor, { assignmentId: "assignment-a", projectType: "WEBSITE", destination: "COMMERCIAL" }), /COMMERCIAL_DESTINATION_FORBIDDEN/);
  const authorized = { ...instructor, permissions: ["studio.project.create", "studio.project.destination.commercial"] };
  const commercial = await harness.service.createFromAssignment(authorized, { assignmentId: "assignment-a", projectType: "WEBSITE", destination: "COMMERCIAL", learnerId: "learner-a" });
  assert.equal(commercial.destination, "COMMERCIAL");
});

test("assignment handoff preserves lineage and returns the same project on duplicate submission", async () => {
  const assignment = {
    id: "assignment-a",
    status: "published",
    title: "Assignment A",
    organizationId: "org-a",
    courseId: "course-a",
    curriculumReleaseId: "release-a1",
    completionPolicyId: "policy-a1",
    dueAt: "2026-10-01T00:00:00.000Z",
  };
  let handoffInsertions = 0;
  const harness = service({
    assignmentLookup: async () => assignment,
    assignments: { hasEntitlementTarget: async () => true },
    enrollments: { listActiveEnrollmentsForLearner: async () => [{ programId: "program-a", cohortId: "cohort-a" }] },
  });
  const originalQuery = (harness.service as any).dbQuery;
  (harness.service as any).dbQuery = async (sql: string, params: any[] = []) => {
    if (sql.includes("SELECT user_id FROM users")) return { rows: [{}] };
    return originalQuery(sql, params);
  };
  (harness.service as any).transaction = async (fn: any) => fn({
    async query(sql: string, params: any[] = []) {
      if (sql.includes("INSERT INTO studio_handoffs")) {
        handoffInsertions += 1;
        return handoffInsertions === 1 ? { rows: [{}] } : { rows: [] };
      }
      if (sql.includes("SELECT p.* FROM studio_handoffs")) return { rows: [fakeProject("WEBSITE", { studio_assignment_id: "assignment-a", studio_curriculum_release_id: "release-a1", studio_completion_policy_id: "policy-a1" })] };
      if (sql.includes("INSERT INTO projects")) return { rows: [fakeProject("WEBSITE", { studio_learner_id: params[9], studio_assignment_id: params[12], studio_curriculum_release_id: params[13], studio_completion_policy_id: params[14], studio_destination: params[11] })] };
      return { rows: [] };
    },
  });
  const first = await harness.service.createFromAssignment(student, { assignmentId: "assignment-a", projectType: "WEBSITE" });
  const second = await harness.service.createFromAssignment(student, { assignmentId: "assignment-a", projectType: "WEBSITE" });
  assert.equal(first.assignmentId, "assignment-a");
  assert.equal(first.curriculumReleaseId, "release-a1");
  assert.equal(first.completionPolicyId, "policy-a1");
  assert.equal(second.projectType, "WEBSITE");
  assert.equal(handoffInsertions, 2);
  assert.equal(harness.events.length, 2, "duplicate handoff does not emit duplicate events");
});

test("project retrieval is tenant and learner scoped", async () => {
  const harness = service();
  const row = fakeProject("WEBSITE");
  (harness.service as any).dbQuery = async () => ({ rows: [row] });
  const own = await harness.service.get(student, row.project_id);
  assert.equal(own.learnerId, "learner-a");
  await assert.rejects(() => harness.service.get({ ...student, user_id: "learner-b" }, row.project_id), /PROJECT_NOT_FOUND/);
  await assert.rejects(() => harness.service.get({ ...student, tenant_id: "tenant:org-b" }, row.project_id), /ORG_CONTEXT_REQUIRED/);
});

test("assignment project resources come from its release snapshot and foreign projects fail closed", async () => {
  const harness = service();
  const assignmentProject = fakeProject("WEBSITE", {
    project_id: "studio-project-assignment",
    studio_origin: "ASSIGNMENT",
    studio_assignment_id: "assignment-a",
    studio_curriculum_release_id: "release-a1",
  });
  (harness.service as any).dbQuery = async (sql: string, params: any[] = []) => {
    if (sql.includes("SELECT * FROM projects")) return { rows: [assignmentProject] };
    if (sql.includes("SELECT unit_key, lesson_key")) return { rows: [{ unit_key: "unit-a", lesson_key: "lesson-a" }] };
    if (sql.includes("SELECT snapshot")) return { rows: [{ snapshot: { units: [{ stableKey: "unit-a", lessons: [{ stableKey: "lesson-a", resources: [{ resourceId: "resource-a", title: "Build guide", resourceType: "DOCUMENT", description: "Guide", externalUrl: "https://example.test" }] }] }] } }] };
    return { rows: [] };
  };
  const result = await harness.service.getResources(student, assignmentProject.project_id);
  assert.equal(result.resources[0].id, "resource-a");
  assert.equal(result.resources[0].origin, "ASSIGNMENT");
  assert.equal(result.resources[0].sourceLabel, "From your assignment");
  await assert.rejects(() => harness.service.getResources({ ...student, organization_id: "org-b", active_organization_id: "org-b", tenant_id: "tenant:org-b" }, assignmentProject.project_id), /PROJECT_NOT_FOUND/);
});

test("independent project resource lookup is an honest empty projection", async () => {
  const harness = service();
  (harness.service as any).dbQuery = async () => ({ rows: [fakeProject("AI_AGENT")] });
  const result = await harness.service.getResources(student, "studio-project-test");
  assert.deepEqual(result, { projectId: "studio-project-test", resources: [] });
});

test("Build Packet preserves assignment requirements and exact release lineage without completion claims", async () => {
  const harness = service();
  const assignmentProject = fakeProject("WEBSITE", {
    studio_origin: "ASSIGNMENT",
    studio_assignment_id: "assignment-a",
    studio_curriculum_release_id: "release-a1",
  });
  (harness.service as any).dbQuery = async (sql: string) => {
    if (sql.includes("SELECT * FROM projects")) return { rows: [assignmentProject] };
    if (sql.includes("SELECT assignment_id, curriculum_release_id")) return { rows: [{ assignment_id: "assignment-a", curriculum_release_id: "release-a1", unit_key: "unit-a", lesson_key: "lesson-a", requirements_json: { items: [{ label: "Project brief" }] } }] };
    if (sql.includes("SELECT unit_key, lesson_key")) return { rows: [{ unit_key: "unit-a", lesson_key: "lesson-a" }] };
    if (sql.includes("SELECT snapshot")) return { rows: [{ snapshot: { units: [{ stableKey: "unit-a", lessons: [{ stableKey: "lesson-a", resources: [] }] }] } }] };
    return { rows: [] };
  };
  const packet = await harness.service.getBuildPacket(student, assignmentProject.project_id);
  assert.equal(packet.lineage.curriculumReleaseId, "release-a1");
  assert.deepEqual(packet.requirements, { items: [{ label: "Project brief" }] });
  assert.deepEqual(packet.deliverables, []);
  assert.equal("complete" in packet, false);
  assert.equal("qaPassed" in packet, false);
});

test("Build Packet rejects corrupt assignment lineage instead of falling back to current curriculum", async () => {
  const harness = service();
  (harness.service as any).dbQuery = async (sql: string) => {
    if (sql.includes("SELECT * FROM projects")) return { rows: [fakeProject("WEBSITE", { studio_origin: "ASSIGNMENT", studio_assignment_id: "assignment-a", studio_curriculum_release_id: "release-a1" })] };
    if (sql.includes("SELECT assignment_id, curriculum_release_id")) return { rows: [{}] };
    return { rows: [] };
  };
  await assert.rejects(() => harness.service.getBuildPacket(student, "studio-project-test"), /STUDIO_LINEAGE_INVALID/);
});

test("workspace saves durable type-specific work without changing project truth", async () => {
  const harness = service();
  const row = fakeProject("WEBSITE");
  let stored: any = null;
  (harness.service as any).dbQuery = async (sql: string) => sql.includes("SELECT * FROM projects") ? { rows: [row] } : { rows: [] };
  (harness.service as any).transaction = async (fn: any) => fn({
    async query(sql: string, params: any[] = []) {
      if (sql.includes("FOR UPDATE")) return { rows: stored ? [stored] : [] };
      if (sql.includes("INSERT INTO studio_builder_workspaces")) { stored = { workspace_id: params[0], project_id: params[1], project_type: params[4], work_json: JSON.parse(params[5]), revision: params[6], created_at: "now", updated_at: "now" }; return { rows: [stored] }; }
      if (sql.includes("UPDATE studio_builder_workspaces")) { stored = { ...stored, work_json: JSON.parse(params[0]), revision: params[1] }; return { rows: [stored] }; }
      return { rows: [] };
    },
  });
  const workspace = await harness.service.updateWorkspace(student, row.project_id, { revision: 0, work: { pages: [{ path: "/", title: "Home", content: "Hello" }] } });
  assert.equal(workspace.revision, 1);
  assert.equal(workspace.work.pages[0].content, "Hello");
  assert.equal(row.studio_status, "DRAFT");
  assert.equal("completed" in workspace, false);
  const revised = await harness.service.updateWorkspace(student, row.project_id, { revision: 1, work: { pages: [{ path: "/", title: "Home", content: "Updated" }] } });
  assert.equal(revised.revision, 2);
  await assert.rejects(() => harness.service.updateWorkspace(student, row.project_id, { revision: 1, work: { pages: [{ path: "/", title: "Home", content: "stale" }] } }), /WORKSPACE_REVISION_CONFLICT/);
  await assert.rejects(() => harness.service.updateWorkspace({ ...student, user_id: "learner-b" }, row.project_id, { revision: 2, work: { pages: [{ path: "/", title: "Home", content: "foreign" }] } }), /PROJECT_NOT_FOUND/);
  await assert.rejects(() => harness.service.updateWorkspace(student, row.project_id, { revision: 1, work: { pages: [{ path: "/", title: "Home", content: "x" }], assignmentId: "forbidden" } }), /WORKSPACE_PAYLOAD_INVALID/);
});

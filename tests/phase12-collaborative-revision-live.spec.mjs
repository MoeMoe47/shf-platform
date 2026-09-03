import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!api || !database) throw new Error("Phase 12 acceptance requires the disposable environment.");
const token = (id) => `Bearer dev-token:${id}`;
const headers = (id) => ({ Authorization: token(id), "Content-Type": "application/json" });

async function apiJson(request, id, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, { ...options, headers: { ...headers(id), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function sql(statement) {
  return execFileSync("psql", [database, "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", statement], { encoding: "utf8" }).trim();
}

function setup() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('phase12_student_create','phase8_role_student','studio.project.create'),
      ('phase12_student_view','phase8_role_student','studio.project.view'),
      ('phase12_student_update','phase8_role_student','studio.project.update')
    ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

test("Collaborative revisions preserve lineage, reject stale saves, and bind Review to exact snapshots", async ({ request }) => {
  test.setTimeout(90000);
  setup();
  const assignmentHandoff = await apiJson(request, "learner_A1", "/studio/handoffs/assignment", { method: "POST", data: { assignmentId: "phase8_assignment_a", projectType: "WEBSITE", title: "Phase 12 Assignment Context" } });
  expect(assignmentHandoff.response.status()).toBe(201);
  const assignmentContext = await apiJson(request, "learner_A1", `/studio/projects/${assignmentHandoff.data.projectId}/learning-context`);
  expect(assignmentContext.response.status(), JSON.stringify(assignmentContext.body)).toBe(200);
  expect(assignmentContext.data.assignment.title).toBeTruthy();
  expect(assignmentContext.data.originLabel).toBe("Assignment");
  expect(assignmentContext.data.statuses.qa).toBe("NOT_CHECKED");
  const team = await apiJson(request, "admin_A", "/studio/teams", { method: "POST", data: { name: `Phase 12 Revision Team ${Date.now()}` } });
  expect(team.response.status()).toBe(201);
  const teamId = team.data.teamId;
  for (const [userId, role] of [["learner_A1", "LEAD"], ["learner_A2", "MEMBER"]]) {
    const added = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members`, { method: "POST", data: { userId, role } });
    expect(added.response.status()).toBe(201);
  }

  const project = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 12 Team Revision", teamId } });
  expect(project.response.status()).toBe(201);
  const projectId = project.data.projectId;
  const teamContext = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/learning-context`);
  expect(teamContext.response.status(), JSON.stringify(teamContext.body)).toBe(200);
  expect(teamContext.data.originLabel).toBe("Personal Project");
  expect(teamContext.data.project.ownerType).toBe("TEAM");
  expect(teamContext.data.project.teamName).toBeTruthy();
  expect(teamContext.data.statuses.review).toBe("NOT_SUBMITTED");
  expect(teamContext.data.requirements).toEqual([]);
  const initial = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`);
  expect(initial.data.revision).toBe(0);

  const first = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: 0, work: { pages: [{ path: "/", title: "Revision One", content: "First contributor snapshot." }], status: "forged" } } });
  expect(first.response.status()).toBe(400);
  const savedOne = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: 0, work: { pages: [{ path: "/", title: "Revision One", content: "First contributor snapshot." }] }, idempotencyKey: "phase12-first-save" } });
  expect(savedOne.response.status(), JSON.stringify(savedOne.body)).toBe(200);
  expect(savedOne.data.revision).toBe(1);

  const loadedA = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`);
  const loadedB = await apiJson(request, "learner_A2", `/studio/projects/${projectId}/workspace`);
  expect(loadedA.data.revision).toBe(1);
  expect(loadedB.data.revision).toBe(1);
  const concurrent = await Promise.all([
    apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: 1, work: { pages: [{ path: "/", title: "Revision Two A", content: "Contributor A wins." }] } } }),
    apiJson(request, "learner_A2", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: 1, work: { pages: [{ path: "/", title: "Revision Two B", content: "Stale contributor must not overwrite." }] } } }),
  ]);
  expect(concurrent.map((item) => item.response.status()).sort()).toEqual([200, 409]);
  const current = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`);
  expect(current.data.revision).toBe(2);
  expect(["Contributor A wins.", "Stale contributor must not overwrite."]).toContain(current.data.work.pages[0].content);

  const revisions = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/revisions`);
  expect(revisions.response.status()).toBe(200);
  expect(revisions.data.items.map((item) => item.revisionNumber)).toEqual([2, 1]);
  expect(revisions.data.items[0].parentRevisionId).toBe(revisions.data.items[1].revisionId);
  const revisionOne = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/revisions/${revisions.data.items[1].revisionId}`);
  expect(revisionOne.data.work.pages[0].content).toBe("First contributor snapshot.");
  expect(revisionOne.data.contentHash).toMatch(/^[a-f0-9]{64}$/);

  const idempotent = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: 2, idempotencyKey: "phase12-repeat-save", work: { pages: [{ path: "/", title: "Revision Three", content: "Same request identity." }] } } });
  const repeated = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: 2, idempotencyKey: "phase12-repeat-save", work: { pages: [{ path: "/", title: "Revision Three", content: "Same request identity." }] } } });
  expect(idempotent.response.status()).toBe(200);
  expect(repeated.response.status()).toBe(200);
  expect(repeated.data.revision).toBe(idempotent.data.revision);
  expect(Number(sql(`SELECT COUNT(*) FROM studio_project_revisions WHERE project_id='${projectId}' AND idempotency_key='phase12-repeat-save'`))).toBe(1);

  const qa = await apiJson(request, "learner_A2", `/studio/projects/${projectId}/qa`, { method: "POST", data: {} });
  expect(qa.response.status()).toBe(201);
  const submission = await apiJson(request, "learner_A2", `/studio/projects/${projectId}/review-submissions`, { method: "POST", data: {} });
  expect(submission.response.status()).toBe(201);
  expect(submission.data.workspaceRevision).toBe(idempotent.data.revision);
  expect(submission.data.studioRevisionId || sql(`SELECT studio_revision_id FROM studio_review_submissions WHERE review_submission_id='${submission.data.submissionId}'`)).toBeTruthy();

  const changes = await apiJson(request, "instructor_A_authorized", `/studio/projects/${projectId}/review-submissions/${submission.data.submissionId}/decision`, { method: "POST", data: { decision: "CHANGES_REQUESTED", feedback: "Add one more project detail." } });
  expect(changes.response.status(), JSON.stringify(changes.body)).toBe(200);
  expect(sql(`SELECT status FROM studio_project_revisions WHERE revision_id='${submission.data.studioRevisionId || sql(`SELECT studio_revision_id FROM studio_review_submissions WHERE review_submission_id='${submission.data.submissionId}'`)}'`)).toBe("SUBMITTED");
  const next = await apiJson(request, "learner_A1", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: idempotent.data.revision, work: { pages: [{ path: "/", title: "Revision Four", content: "A new child revision after requested changes." }] } } });
  expect(next.response.status()).toBe(200);
  expect(next.data.revision).toBe(idempotent.data.revision + 1);
  expect(next.data.revisionId).toBeTruthy();
  expect(sql(`SELECT parent_revision_id FROM studio_project_revisions WHERE revision_id='${next.data.revisionId}'`)).toBe(idempotent.data.revisionId);

  const individual = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Phase 12 Individual Revision" } });
  expect(individual.response.status()).toBe(201);
  const individualSave = await apiJson(request, "learner_A1", `/studio/projects/${individual.data.projectId}/workspace`, { method: "PATCH", data: { revision: 0, work: { pages: [{ path: "/", title: "Individual Revision One", content: "Personal project content." }] } } });
  expect(individualSave.response.status()).toBe(200);
  const individualRevisions = await apiJson(request, "learner_A1", `/studio/projects/${individual.data.projectId}/revisions`);
  expect(individualRevisions.data.items).toHaveLength(1);
  expect(individualRevisions.data.items[0].revisionNumber).toBe(1);

  const crossTenant = await apiJson(request, "learner_B1", `/studio/projects/${projectId}/revisions`);
  expect([403, 404]).toContain(crossTenant.response.status());
  const remove = await apiJson(request, "admin_A", `/studio/teams/${teamId}/members/learner_A2`, { method: "DELETE" });
  expect(remove.response.status()).toBe(200);
  const removedSave = await apiJson(request, "learner_A2", `/studio/projects/${projectId}/workspace`, { method: "PATCH", data: { revision: idempotent.data.revision, work: { pages: [{ path: "/", title: "Unauthorized", content: "Must fail." }] } } });
  expect([403, 404]).toContain(removedSave.response.status());

  const counts = sql(`SELECT (SELECT COUNT(*) FROM studio_review_decisions WHERE project_id='${projectId}') || ':' || (SELECT COUNT(*) FROM prepare_prove_evidence WHERE source_record_id='${projectId}') || ':' || (SELECT COUNT(*) FROM curriculum_lesson_completions) || ':' || (SELECT COUNT(*) FROM studio_project_revisions WHERE project_id='${projectId}')`);
  expect(counts.split(":").slice(0, 3)).toEqual(["1", "0", "0"]);
});

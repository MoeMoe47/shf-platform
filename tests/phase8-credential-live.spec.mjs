import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const API = process.env.SHS_TEST_API_URL || "http://127.0.0.1:8091";
const RUN = `phase8-live-${Date.now()}`;

async function api(request, path, userId, options = {}) {
  return request.fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer dev-token:${userId}`, ...(options.headers || {}) },
  });
}

function dbCounts() {
  const db = process.env.SHS_TEST_DATABASE_URL;
  if (!db) throw new Error("SHS_TEST_DATABASE_URL is required for side-effect checks");
  return execFileSync("psql", [db, "-X", "-At", "-F", "|", "-c", "SELECT (SELECT COUNT(*) FROM learner_credentials),(SELECT COUNT(*) FROM integration_outbox WHERE producer_id='shs-api.credentials');"], { encoding: "utf8" }).trim().split("|").map(Number);
}

function authoritySnapshot() {
  const db = process.env.SHS_TEST_DATABASE_URL;
  if (!db) throw new Error("SHS_TEST_DATABASE_URL is required for authority snapshots");
  const sql = `SELECT json_build_object(
    'credential_definitions',(SELECT COUNT(*) FROM credential_definitions),
    'learner_credentials',(SELECT COUNT(*) FROM learner_credentials),
    'credential_events',(SELECT COUNT(*) FROM integration_outbox WHERE producer_id='shs-api.credentials'),
    'projects',(SELECT COUNT(*) FROM projects),
    'project_teams',(SELECT COUNT(*) FROM project_teams),
    'project_team_members',(SELECT COUNT(*) FROM project_team_members),
    'project_submissions',(SELECT COUNT(*) FROM project_submissions),
    'workspaces',(SELECT COUNT(*) FROM studio_builder_workspaces),
    'qa',(SELECT COUNT(*) FROM studio_qa_runs),
    'reviews',(SELECT COUNT(*) FROM studio_review_submissions),
    'review_decisions',(SELECT COUNT(*) FROM studio_review_decisions),
    'deliveries',(SELECT COUNT(*) FROM studio_delivery_records),
    'evidence',(SELECT COUNT(*) FROM prepare_prove_evidence),
    'completion',(SELECT COUNT(*) FROM curriculum_lesson_completions),
    'portfolio_profiles',(SELECT COUNT(*) FROM portfolio_profiles),
    'portfolio_artifacts',(SELECT COUNT(*) FROM portfolio_artifacts),
    'deployments',(SELECT COUNT(*) FROM website_deployment_records),
    'agent_packages',(SELECT COUNT(*) FROM studio_agent_packages),
    'registry_submissions',(SELECT COUNT(*) FROM agent_registry_submissions)
  )::text`;
  return JSON.parse(execFileSync("psql", [db, "-X", "-At", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" }).trim());
}

test("live credential eligibility and issuance remain server-derived and durable", async ({ request }) => {
  const specialization = await api(request, "/program-specialization-assignments", "admin_A", { method: "POST", data: {
    learner_id: "learner_A1", program_id: "phase8_program_a", specialization_id: "technical-operations", grade: 12,
  } });
  expect(specialization.status(), JSON.stringify(await specialization.json())).toBe(201);
  const project = await api(request, "/projects", "admin_A", { method: "POST", data: { title: `${RUN} Capstone`, project_type: "CAPSTONE" } });
  expect(project.status()).toBe(201);
  const projectId = (await project.json()).data.project_id;
  const team = await api(request, `/projects/${projectId}/teams`, "admin_A", { method: "POST", data: {} });
  expect(team.status()).toBe(201);
  const teamId = (await team.json()).data.team_id;
  const member = await api(request, `/project-teams/${teamId}/members`, "admin_A", { method: "POST", data: { learner_id: "learner_A1" } });
  expect(member.status(), JSON.stringify(await member.json())).toBe(201);
  const submission = await api(request, `/project-teams/${teamId}/submissions`, "learner_A1", { method: "POST", data: {} });
  expect(submission.status()).toBe(201);
  const submissionId = (await submission.json()).data.submission_id;
  const review = await api(request, `/project-submissions/${submissionId}/review`, "admin_A", { method: "POST", data: { status: "ACCEPTED" } });
  expect(review.ok()).toBeTruthy();

  const definition = await api(request, "/credentials/definitions", "admin_A", { method: "POST", data: {
    slug: `${RUN}-capstone-badge`, name: `${RUN} Capstone Badge`, credentialType: "INTERNAL", issuingAuthority: "Silicon Heartland Foundation", requiresAcceptedCapstone: true,
  } });
  expect(definition.status()).toBe(201);
  const definitionId = (await definition.json()).data.id;

  const eligible = await api(request, `/credentials/definitions/${definitionId}/eligibility/me`, "learner_A1");
  expect(eligible.ok()).toBeTruthy();
  expect((await eligible.json()).data).toMatchObject({ eligible: true, reason: "ACCEPTED_CAPSTONE_FOUND" });

  const credentialOnlyBefore = authoritySnapshot();

  const issued = await api(request, "/credentials/issue", "admin_A", { method: "POST", data: {
    credentialDefinitionId: definitionId, learnerUserId: "learner_A1", eligible: true, status: "ISSUED", issuer: "forged",
  } });
  expect(issued.status()).toBe(201);
  const issuedData = (await issued.json()).data;
  expect(issuedData).toMatchObject({ status: "ISSUED", organizationId: "phase8_org_a", credentialVersion: 1 });
  expect(issuedData.provenance).toMatchObject({ policy: "ACCEPTED_CAPSTONE", sourceType: "PROJECT_SUBMISSION", projectId });
  expect(issuedData.verificationHash).toMatch(/^[0-9a-f]{64}$/);

  const duplicate = await api(request, "/credentials/issue", "admin_A", { method: "POST", data: { credentialDefinitionId: definitionId, learnerUserId: "learner_A1" } });
  expect(duplicate.status()).toBe(409);
  const learnerView = await api(request, "/credentials/me", "learner_A1");
  expect(learnerView.ok()).toBeTruthy();
  expect((await learnerView.json()).data.items.filter((item) => item.id === issuedData.id)).toHaveLength(1);

  const foreignRead = await api(request, `/credentials/${issuedData.id}`, "learner_A2");
  expect(foreignRead.status()).toBe(404);
  const crossOrgRead = await api(request, `/credentials/${issuedData.id}`, "learner_B1");
  expect(crossOrgRead.status()).toBe(404);

  const beforeDenied = dbCounts();
  const multiOrgHeaders = { "x-shs-organization-id": "phase8_org_b" };
  const mismatchedList = await api(request, "/credentials/me", "multi_org_staff", { headers: multiOrgHeaders });
  expect(mismatchedList.ok()).toBeTruthy();
  expect((await mismatchedList.json()).data.items).toHaveLength(0);
  const mismatchedDetail = await api(request, `/credentials/${issuedData.id}`, "multi_org_staff", { headers: multiOrgHeaders });
  expect(mismatchedDetail.status()).toBe(404);
  const mismatchedIssue = await api(request, "/credentials/issue", "multi_org_staff", { method: "POST", headers: multiOrgHeaders, data: { credentialDefinitionId: definitionId, learnerUserId: "learner_A1" } });
  expect(mismatchedIssue.ok()).toBeFalsy();
  const mismatchedRevoke = await api(request, `/credentials/${issuedData.id}/revoke`, "multi_org_staff", { method: "POST", headers: multiOrgHeaders, data: {} });
  expect(mismatchedRevoke.ok()).toBeFalsy();
  expect(dbCounts()).toEqual(beforeDenied);

  const concurrentDefinition = await api(request, "/credentials/definitions", "admin_A", { method: "POST", data: { slug: `${RUN}-concurrent`, name: `${RUN} Concurrent`, credentialType: "INTERNAL", issuingAuthority: "Silicon Heartland Foundation", requiresAcceptedCapstone: true } });
  expect(concurrentDefinition.status()).toBe(201);
  const concurrentDefinitionId = (await concurrentDefinition.json()).data.id;
  const concurrent = await Promise.all([1, 2, 3].map(() => api(request, "/credentials/issue", "admin_A", { method: "POST", data: { credentialDefinitionId: concurrentDefinitionId, learnerUserId: "learner_A1" } })));
  expect(concurrent.filter((response) => response.status() === 201)).toHaveLength(1);
  expect(concurrent.filter((response) => response.status() === 409)).toHaveLength(2);
  const concurrentRows = dbCounts();
  expect(concurrentRows[0]).toBe(2);
  expect(concurrentRows[1]).toBe(2);

  const ineligibleDefinition = await api(request, "/credentials/definitions", "admin_A", { method: "POST", data: { slug: `${RUN}-ineligible`, name: `${RUN} Ineligible`, credentialType: "INTERNAL", issuingAuthority: "Silicon Heartland Foundation", requiresAcceptedCapstone: true } });
  expect(ineligibleDefinition.status()).toBe(201);
  const ineligibleId = (await ineligibleDefinition.json()).data.id;
  const ineligible = await api(request, `/credentials/definitions/${ineligibleId}/eligibility/me`, "learner_A2");
  expect((await ineligible.json()).data).toMatchObject({ eligible: false, reason: "ACCEPTED_CAPSTONE_MISSING" });
  const ineligibleIssue = await api(request, "/credentials/issue", "admin_A", { method: "POST", data: { credentialDefinitionId: ineligibleId, learnerUserId: "learner_A2" } });
  expect(ineligibleIssue.status()).toBe(403);
  expect((await ineligibleIssue.json()).error.code).toBe("CREDENTIAL_NOT_ELIGIBLE");
  expect(dbCounts()).toEqual(concurrentRows);

  const revoked = await api(request, `/credentials/${issuedData.id}/revoke`, "admin_A", { method: "POST", data: {} });
  expect(revoked.status()).toBe(200);
  expect((await revoked.json()).data.status).toBe("REVOKED");
  expect(dbCounts()[1]).toBe(3);

  const credentialOnlyAfter = authoritySnapshot();
  expect(credentialOnlyAfter.credential_definitions).toBe(credentialOnlyBefore.credential_definitions + 2);
  expect(credentialOnlyAfter.learner_credentials).toBe(credentialOnlyBefore.learner_credentials + 2);
  expect(credentialOnlyAfter.credential_events).toBe(credentialOnlyBefore.credential_events + 3);
  for (const table of [
    "projects", "project_teams", "project_team_members", "project_submissions", "workspaces", "qa",
    "reviews", "review_decisions", "deliveries", "evidence", "completion", "portfolio_profiles",
    "portfolio_artifacts", "deployments", "agent_packages", "registry_submissions",
  ]) expect(credentialOnlyAfter[table], `${table} changed during Credential-only window`).toBe(credentialOnlyBefore[table]);
});

// SHF Ecosystem Phase 11 — Companion Context Service integration tests.
// Verifies GET /companion/context/me end-to-end against real fixtures:
// entitlement matches the underlying source domains exactly, guidance is
// deterministic and traceable to real events, pathway relevance is
// derived (never fabricated), and no client-suppliable identity parameter
// can widen or redirect context to another actor.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase5_${Date.now()}`;
const IDS = {
  programA: `program_${RUN}_co`,
  cohortA: `cohort_${RUN}_co`,
  familyX: `career_family_${RUN}_co`,
  careerX: `career_${RUN}_co`,
};

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  [`user_${RUN}_cohort_a`, "org_shf_001", `cohorta@${RUN}.test`, "Cohort A Learner"],
  ["user_partner_student_001", "org_partner_001", "student@partner.test", "Partner Learner"],
] as const;

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

async function api(path: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(opts.userId) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function context(userId: string, qs = "") {
  const { status, json } = await api(`/companion/context/me${qs}`, { userId });
  assert.equal(status, 200, JSON.stringify(json));
  return json.data;
}

async function cleanup() {
  await query("DELETE FROM learner_credentials WHERE credential_definition_id IN (SELECT credential_definition_id FROM credential_definitions WHERE slug LIKE $1)", [`%-${RUN}`]);
  await query("DELETE FROM credential_definitions WHERE slug LIKE $1", [`%-${RUN}`]);
  await query("DELETE FROM opportunities WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM assignment_targets WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM assignments WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM program_careers WHERE program_id = $1", [IDS.programA]);
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohort_staff WHERE cohort_id = $1", [IDS.cohortA]);
  await query("DELETE FROM cohorts WHERE cohort_id = $1", [IDS.cohortA]);
  await query("DELETE FROM programs WHERE program_id = $1", [IDS.programA]);
  await query("DELETE FROM careers WHERE career_id = $1", [IDS.careerX]);
  await query("DELETE FROM career_families WHERE career_family_id = $1", [IDS.familyX]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active'),
            ('org_partner_001', 'Partner Organization', 'Partner Organization', 'partner', 'active')
     ON CONFLICT (organization_id) DO NOTHING`,
  );
  for (const [userId, organizationId, email, fullName] of BASE_USERS) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, $4, 'active', 'local') ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, email, fullName],
    ));
  }
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status)
     VALUES ($1, 'org_shf_001', 'Phase 11 Program A', 'education', 'active') ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA],
  );
  await query(
    `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, status, starts_at, ends_at, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, 'Phase 11 Cohort A', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001')
     ON CONFLICT (cohort_id) DO NOTHING`,
    [IDS.cohortA, IDS.programA],
  );
  await query(
    `INSERT INTO enrollments (enrollment_id, organization_id, tenant_id, learner_user_id, program_id, cohort_id, status, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, $3, $4, 'ACTIVE', 'user_admin_001')
     ON CONFLICT (enrollment_id) DO NOTHING`,
    [`enr_${RUN}_ca`, `user_${RUN}_cohort_a`, IDS.programA, IDS.cohortA],
  );
  await query(
    `INSERT INTO career_families (career_family_id, slug, name, status) VALUES ($1, $2, 'Phase 11 Family', 'active') ON CONFLICT DO NOTHING`,
    [IDS.familyX, `phase11-family-${RUN}`],
  );
  await query(
    `INSERT INTO careers (career_id, slug, title, description, status, career_family_id, sector)
     VALUES ($1, $2, 'Phase 11 Career', 'fixture', 'active', $3, 'technology') ON CONFLICT DO NOTHING`,
    [IDS.careerX, `phase11-career-${RUN}`, IDS.familyX],
  );
  const link = await api(`/programs/${IDS.programA}/careers`, { method: "POST", userId: "user_admin_001", body: { careerId: IDS.careerX } });
  assert.equal(link.status, 201, JSON.stringify(link.json));
});

after(async () => {
  await cleanup();
});

test("1. an actor with no context sources produces an honest empty result", async () => {
  const data = await context("user_partner_student_001");
  assert.equal(data.guidance.length, 0);
  assert.equal(data.credentials.issuedCount, 0);
  assert.equal(data.sourceAvailability.partial, false);
  assert.deepEqual(data.pathway.careerIds, []);
});

test("2. a pathway-linked entitled learner sees real pathway career ids", async () => {
  const data = await context(`user_${RUN}_cohort_a`);
  assert.deepEqual(data.pathway.careerIds, [IDS.careerX]);
});

test("3/6/17. a career-linked Opportunity produces PATHWAY_RELEVANT_OPPORTUNITY guidance, distinct from an unrelated learner", async () => {
  const created = await api("/opportunities", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Relevant Internship`, opportunityType: "INTERNSHIP", applicationDeadline: "2026-12-01", actionRoute: "/store", careerId: IDS.careerX } });
  assert.equal(created.status, 201);
  await api(`/opportunities/${created.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "OPEN" } });

  const data = await context(`user_${RUN}_cohort_a`);
  const relatedId = `opportunity:${created.json.data.id}:deadline`;
  const found = data.guidance.find((g: any) => g.reasonCode === "PATHWAY_RELEVANT_OPPORTUNITY" && g.relatedSourceIds.includes(relatedId));
  assert.ok(found, "a real career-linked open Opportunity must produce pathway-relevant guidance");
  assert.equal(found.mode, "career");

  const other = await context("user_partner_student_001");
  assert.ok(!other.guidance.some((g: any) => g.relatedSourceIds.includes(relatedId)), "an unentitled cross-org learner must never see this guidance");
});

test("4/12. a required Assignment due soon produces coach-mode DEADLINE_SOON guidance, traceable to a real event", async () => {
  const dueSoon = new Date(Date.now() + 86_400_000).toISOString();
  const created = await api("/assignments", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Companion Deadline`, dueAt: dueSoon, assignmentType: "assignment", targets: [{ targetType: "ORGANIZATION" }] } });
  assert.equal(created.status, 201);

  const data = await context(`user_${RUN}_cohort_a`);
  const relatedId = `assignment:${created.json.data.id}`;
  const found = data.guidance.find((g: any) => g.reasonCode === "DEADLINE_SOON" && g.relatedSourceIds.includes(relatedId));
  assert.ok(found, "a real required deadline due soon must produce guidance");
  assert.equal(found.mode, "coach");
  assert.equal(found.action.url, "/curriculum/asl/assignments");
});

test("14/23. a Credential nearing renewal produces guidance and an accurate credential summary", async () => {
  const def = await api("/credentials/definitions", { method: "POST", userId: "user_admin_001", body: { slug: `phase11-cred-${RUN}`, name: `${RUN} Credential`, credentialType: "INTERNAL", issuingAuthority: "SHF", validityPeriodMonths: 1, renewalWindowDays: 25 } });
  assert.equal(def.status, 201);
  const issued = await api("/credentials/issue", { method: "POST", userId: "user_admin_001", body: { credentialDefinitionId: def.json.data.id, learnerUserId: `user_${RUN}_cohort_a` } });
  assert.equal(issued.status, 201);

  const data = await context(`user_${RUN}_cohort_a`);
  assert.ok(data.credentials.issuedCount >= 1);
  assert.ok(data.credentials.upcomingRenewalCount >= 1);
  const relatedId = `credential:${issued.json.data.id}:renewal`;
  const found = data.guidance.find((g: any) => g.reasonCode === "CREDENTIAL_RENEWAL_SOON" && g.relatedSourceIds.includes(relatedId));
  assert.ok(found, "a credential renewing within 30 days must produce guidance");
});

test("18. every guidance item is traceable to an id present in this same actor's own Calendar projection", async () => {
  const data = await context(`user_${RUN}_cohort_a`);
  const projection = await api("/calendar/events/me", { userId: `user_${RUN}_cohort_a` });
  const validIds = new Set(projection.json.data.items.map((e: any) => e.id));
  for (const g of data.guidance) {
    for (const id of g.relatedSourceIds) assert.ok(validIds.has(id), `guidance referenced an id (${id}) not present in this actor's own Calendar projection`);
  }
});

test("no client-suppliable identity parameter can widen or redirect context to another actor", async () => {
  const probeDue = new Date(Date.now() + 86_400_000).toISOString();
  const probe = await api("/assignments", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Spoof Probe`, dueAt: probeDue, assignmentType: "assignment", targets: [{ targetType: "ORGANIZATION" }] } });
  assert.equal(probe.status, 201);
  const probeId = `assignment:${probe.json.data.id}`;

  const [plain, spoofed] = await Promise.all([
    context(`user_${RUN}_cohort_a`),
    context(`user_${RUN}_cohort_a`, "?learnerId=user_admin_001&userId=user_admin_001&actorId=user_admin_001"),
  ]);
  const hasProbe = (data: any) => data.guidance.some((g: any) => g.relatedSourceIds.includes(probeId));
  assert.equal(hasProbe(plain), true, "sanity: the probe assignment must actually produce guidance");
  assert.equal(hasProbe(spoofed), hasProbe(plain));
});

test("a fully healthy request reports sourceAvailability as non-partial", async () => {
  const data = await context(`user_${RUN}_cohort_a`);
  assert.equal(data.sourceAvailability.partial, false);
  assert.deepEqual(data.sourceAvailability.unavailableSources, []);
});

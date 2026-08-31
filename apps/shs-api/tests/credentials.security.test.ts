// SHF Ecosystem Phase 7 — Credential Definition / eligibility / issuance
// / expiration / revocation / direct-ID security tests. Reuses existing
// static identities (user_admin_001 = org_admin, user_instructor_001,
// user_student_001/user_no_assignment_001/user_assignment_*_001 = plain
// students, user_partner_student_001 = cross-org student,
// user_other_admin_001 = cross-org admin-tier).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase7_${Date.now()}`;

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
  ["user_no_assignment_001", "org_shf_001", "no-assignment@siliconheartland.org", "No Assignment Learner"],
  ["user_assignment_technical_001", "org_shf_001", "technical@test.invalid", "Technical Learner"],
  ["user_assignment_networking_001", "org_shf_001", "networking@test.invalid", "Networking Learner"],
  ["user_partner_student_001", "org_partner_001", "student@partner.test", "Partner Learner"],
  ["user_other_admin_001", "org_other", "admin@other.test", "Other Org Program Staff"],
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

function defInput(slug: string, overrides: Record<string, unknown> = {}) {
  return {
    slug: `${RUN}-${slug}`,
    name: `${RUN} ${slug}`,
    credentialType: "INTERNAL",
    issuingAuthority: "Silicon Heartland Foundation",
    ...overrides,
  };
}

async function createDefinition(slug: string, overrides: Record<string, unknown> = {}) {
  return api("/credentials/definitions", { method: "POST", userId: "user_admin_001", body: defInput(slug, overrides) });
}

async function issue(credentialDefinitionId: string, learnerUserId: string) {
  return api("/credentials/issue", { method: "POST", userId: "user_admin_001", body: { credentialDefinitionId, learnerUserId } });
}

async function cleanup() {
  await query("DELETE FROM learner_credentials WHERE credential_definition_id IN (SELECT credential_definition_id FROM credential_definitions WHERE slug LIKE $1)", [`${RUN}-%`]);
  await query("DELETE FROM credential_definitions WHERE slug LIKE $1", [`${RUN}-%`]);
  await query("DELETE FROM project_submissions WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM project_team_members WHERE team_id IN (SELECT team_id FROM project_teams WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1))", [`${RUN} %`]);
  await query("DELETE FROM project_teams WHERE project_id IN (SELECT project_id FROM projects WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM projects WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM program_specialization_assignments WHERE assignment_id LIKE $1", [`psa_${RUN}_%`]);
  await query("DELETE FROM programs WHERE program_id = $1", [`program_${RUN}_elig`]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES
      ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active'),
      ('org_partner_001', 'Partner Organization', 'Partner Organization', 'partner', 'active'),
      ('org_other', 'Other Organization', 'Other Organization', 'partner', 'active')
     ON CONFLICT (organization_id) DO NOTHING`,
  );
  for (const [userId, organizationId, email, fullName] of BASE_USERS) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, $4, 'active', 'local')
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, email, fullName],
    ));
  }
});

after(async () => {
  await cleanup();
});

// --- Credential Definition ---

test("1. authorized admin can create a Credential Definition", async () => {
  const res = await createDefinition("basic");
  assert.equal(res.status, 201);
  assert.equal(res.json.data.status, "active");
  assert.equal(res.json.data.credentialType, "INTERNAL");
});

test("2. a student cannot create a Credential Definition", async () => {
  const res = await api("/credentials/definitions", { method: "POST", userId: "user_no_assignment_001", body: defInput("student-attempt") });
  assert.equal(res.status, 403);
  assert.equal(res.json.error.code, "FORBIDDEN");
});

test("3. an invalid credentialType is rejected", async () => {
  const res = await createDefinition("bad-type", { credentialType: "OTHER" });
  assert.equal(res.status, 400);
  assert.equal(res.json.error.code, "INVALID_CREDENTIAL_TYPE");
});

test("4. duplicate slug is rejected", async () => {
  await createDefinition("dup");
  const second = await createDefinition("dup");
  assert.equal(second.status, 409);
  assert.equal(second.json.error.code, "DUPLICATE_SLUG");
});

test("a lifetime credential cannot be given a renewal window (no validity period)", async () => {
  const res = await createDefinition("lifetime-with-renewal", { renewalWindowDays: 30 });
  assert.equal(res.status, 400);
  assert.equal(res.json.error.code, "RENEWAL_REQUIRES_VALIDITY_PERIOD");
});

test("6. Credential Definitions are global reference data, visible across organizations", async () => {
  const created = await createDefinition("global-visible");
  const fromOtherOrg = await api("/credentials/definitions", { userId: "user_other_admin_001" });
  assert.ok(fromOtherOrg.json.data.items.some((d: any) => d.id === created.json.data.id));
});

// --- Eligibility (never issuance) ---

test("7/9. a learner with an ACCEPTED Capstone becomes eligible; client cannot spoof this by naming another learner", async () => {
  const def = await createDefinition("capstone-gated", { requiresAcceptedCapstone: true });
  const defId = def.json.data.id;

  const capstone = await api("/projects", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Eligibility Capstone`, project_type: "CAPSTONE" } });
  const team = await api(`/projects/${capstone.json.data.project_id}/teams`, { method: "POST", userId: "user_admin_001", body: {} });
  // program_specialization_assignments requires a program_id FK — create
  // a small dedicated program purely to satisfy it (the CAPSTONE project
  // itself has none by default in this test).
  await query(`INSERT INTO programs (program_id, organization_id, name, program_type, status) VALUES ($1,'org_shf_001','P','education','active') ON CONFLICT DO NOTHING`, [`program_${RUN}_elig`]);
  await withSeedRetry(() => query(
    `INSERT INTO program_specialization_assignments (assignment_id, learner_id, organization_id, tenant_id, program_id, specialization_id, grade, stage, assignment_type, status, assigned_by_user_id, assignment_source)
     VALUES ($1,'user_assignment_technical_001','org_shf_001','tenant:org_shf_001',$2,'technical-operations',12,'PREPARE_PROVE','PRIMARY','ACTIVE','user_admin_001','PROGRAM_ASSIGNMENT')
     ON CONFLICT (assignment_id) DO UPDATE SET status='ACTIVE'`,
    [`psa_${RUN}_elig`, `program_${RUN}_elig`],
  ));
  await api(`/project-teams/${team.json.data.team_id}/members`, { method: "POST", userId: "user_admin_001", body: { learner_id: "user_assignment_technical_001" } });

  const beforeAcceptance = await api(`/credentials/definitions/${defId}/eligibility/me`, { userId: "user_assignment_technical_001" });
  assert.equal(beforeAcceptance.json.data.eligible, false);
  assert.equal(beforeAcceptance.json.data.reason, "ACCEPTED_CAPSTONE_MISSING");

  const submitted = await api(`/project-teams/${team.json.data.team_id}/submissions`, { method: "POST", userId: "user_assignment_technical_001", body: {} });
  await api(`/project-submissions/${submitted.json.data.submission_id}/review`, { method: "POST", userId: "user_admin_001", body: { status: "ACCEPTED" } });

  const afterAcceptance = await api(`/credentials/definitions/${defId}/eligibility/me`, { userId: "user_assignment_technical_001" });
  assert.equal(afterAcceptance.json.data.eligible, true);
  assert.equal(afterAcceptance.json.data.reason, "ACCEPTED_CAPSTONE_FOUND");

  // A DIFFERENT, unrelated learner remains ineligible — the endpoint is
  // always self-service (no client-suppliable learnerUserId exists at
  // all on this route).
  const other = await api(`/credentials/definitions/${defId}/eligibility/me`, { userId: "user_assignment_networking_001" });
  assert.equal(other.json.data.eligible, false);
});

test("8. a Credential with no requirement rule reports NO_REQUIREMENT_DEFINED, never a fabricated eligibility", async () => {
  const def = await createDefinition("manual-only");
  const res = await api(`/credentials/definitions/${def.json.data.id}/eligibility/me`, { userId: "user_no_assignment_001" });
  assert.equal(res.json.data.eligible, false);
  assert.equal(res.json.data.reason, "NO_REQUIREMENT_DEFINED");
});

// --- Issuance ---

test("14/19/20. an authorized admin can issue a Credential; issued_at and issuing organization are canonical", async () => {
  const def = await createDefinition("issuable");
  const res = await issue(def.json.data.id, "user_no_assignment_001");
  assert.equal(res.status, 201);
  assert.equal(res.json.data.status, "ISSUED");
  assert.equal(res.json.data.organizationId, "org_shf_001");
  assert.equal(res.json.data.issuedByUserId, "user_admin_001");
  assert.ok(res.json.data.issuedAt);
  assert.ok(res.json.data.verificationId);
});

test("15. a student cannot self-issue", async () => {
  const def = await createDefinition("self-issue-block");
  const res = await api("/credentials/issue", { method: "POST", userId: "user_no_assignment_001", body: { credentialDefinitionId: def.json.data.id, learnerUserId: "user_no_assignment_001" } });
  assert.equal(res.status, 403);
  assert.equal(res.json.error.code, "FORBIDDEN");
});

test("16. an instructor cannot issue Credentials (no reviewer/issuer relationship exists to found one on)", async () => {
  const def = await createDefinition("instructor-block");
  const res = await api("/credentials/issue", { method: "POST", userId: "user_instructor_001", body: { credentialDefinitionId: def.json.data.id, learnerUserId: "user_no_assignment_001" } });
  assert.equal(res.status, 403);
  assert.equal(res.json.error.code, "FORBIDDEN");
});

test("17. an ineligible learner can still receive a manual/institutional issuance — eligibility never blocks explicit issuer authority", async () => {
  const def = await createDefinition("manual-override", { requiresAcceptedCapstone: true });
  const eligibility = await api(`/credentials/definitions/${def.json.data.id}/eligibility/me`, { userId: "user_no_assignment_001" });
  assert.equal(eligibility.json.data.eligible, false);
  const issued = await issue(def.json.data.id, "user_no_assignment_001");
  assert.equal(issued.status, 201, "explicit issuer authority is the only real gate — eligibility is advisory");
});

test("18. duplicate active issuance is prevented", async () => {
  const def = await createDefinition("no-duplicate");
  const first = await issue(def.json.data.id, "user_no_assignment_001");
  assert.equal(first.status, 201);
  const second = await issue(def.json.data.id, "user_no_assignment_001");
  assert.equal(second.status, 409);
  assert.equal(second.json.error.code, "DUPLICATE_ISSUANCE");
});

test("cross-org learner cannot receive an issuance from this organization", async () => {
  const def = await createDefinition("cross-org-block");
  const res = await api("/credentials/issue", { method: "POST", userId: "user_admin_001", body: { credentialDefinitionId: def.json.data.id, learnerUserId: "user_partner_student_001" } });
  assert.equal(res.status, 400);
  assert.equal(res.json.error.code, "LEARNER_NOT_FOUND");
});

// --- Reads / Direct-ID security ---

test("21. a learner sees only their own issued Credentials; direct-ID cannot bypass this", async () => {
  const def = await createDefinition("privacy-check");
  const issued = await issue(def.json.data.id, "user_no_assignment_001");

  const own = await api("/credentials/me", { userId: "user_no_assignment_001" });
  assert.ok(own.json.data.items.some((c: any) => c.id === issued.json.data.id));

  const otherLearner = await api("/credentials/me", { userId: "user_assignment_technical_001" });
  assert.ok(!otherLearner.json.data.items.some((c: any) => c.id === issued.json.data.id));

  const directIdByOther = await api(`/credentials/${issued.json.data.id}`, { userId: "user_assignment_technical_001" });
  assert.equal(directIdByOther.status, 404);

  const directIdCrossOrg = await api(`/credentials/${issued.json.data.id}`, { userId: "user_partner_student_001" });
  assert.equal(directIdCrossOrg.status, 404);

  const directIdOwner = await api(`/credentials/${issued.json.data.id}`, { userId: "user_no_assignment_001" });
  assert.equal(directIdOwner.status, 200);

  const directIdAdmin = await api(`/credentials/${issued.json.data.id}`, { userId: "user_admin_001" });
  assert.equal(directIdAdmin.status, 200, "admin-tier sees every organization Credential");
});

// --- Expiration / renewal / revocation ---

test("22. a lifetime Credential (no validity period) has no fake expiration", async () => {
  const def = await createDefinition("lifetime");
  const issued = await issue(def.json.data.id, "user_no_assignment_001");
  assert.equal(issued.json.data.expiresAt, null);
  const view = await api(`/credentials/${issued.json.data.id}`, { userId: "user_no_assignment_001" });
  assert.equal(view.json.data.lifecycle, "ISSUED");
  assert.equal(view.json.data.renewalDueAt, null);
});

test("23/24. an expiring Credential has a real expiration and, when configured, a real renewal-due date", async () => {
  const def = await createDefinition("expiring", { validityPeriodMonths: 12, renewalWindowDays: 30 });
  const issued = await issue(def.json.data.id, "user_no_assignment_001");
  assert.ok(issued.json.data.expiresAt);
  const view = await api(`/credentials/${issued.json.data.id}`, { userId: "user_no_assignment_001" });
  assert.ok(view.json.data.renewalDueAt);
  assert.ok(new Date(view.json.data.renewalDueAt).getTime() < new Date(view.json.data.expiresAt).getTime());
});

test("25. an already-past expiration reads as EXPIRED, never as a fresh/newly-earned credential", async () => {
  const def = await createDefinition("already-expired", { validityPeriodMonths: 1 });
  const issued = await issue(def.json.data.id, "user_no_assignment_001");
  await query("UPDATE learner_credentials SET expires_at = NOW() - INTERVAL '1 day' WHERE learner_credential_id=$1", [issued.json.data.id]);
  const view = await api(`/credentials/${issued.json.data.id}`, { userId: "user_no_assignment_001" });
  assert.equal(view.json.data.lifecycle, "EXPIRED");
});

test("26/27. a revoked Credential is not treated as valid, and revocation preserves issuance history (never deleted)", async () => {
  const def = await createDefinition("revocable");
  const issued = await issue(def.json.data.id, "user_no_assignment_001");
  const revoked = await api(`/credentials/${issued.json.data.id}/revoke`, { method: "POST", userId: "user_admin_001" });
  assert.equal(revoked.status, 200);
  assert.equal(revoked.json.data.status, "REVOKED");
  assert.ok(revoked.json.data.revokedAt);
  const view = await api(`/credentials/${issued.json.data.id}`, { userId: "user_no_assignment_001" });
  assert.equal(view.json.data.lifecycle, "REVOKED");
  // History preserved — the row still exists and is readable, not deleted.
  assert.equal(view.status, 200);
  // Re-issuance is allowed after revocation (the unique constraint only
  // applies to the ISSUED partition).
  const reissued = await issue(def.json.data.id, "user_no_assignment_001");
  assert.equal(reissued.status, 201);
});

test("a student cannot revoke a Credential", async () => {
  const def = await createDefinition("revoke-block");
  const issued = await issue(def.json.data.id, "user_no_assignment_001");
  const res = await api(`/credentials/${issued.json.data.id}/revoke`, { method: "POST", userId: "user_no_assignment_001" });
  assert.equal(res.status, 403);
});

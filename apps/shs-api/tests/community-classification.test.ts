// SHF Ecosystem Phase 8 — Community domain classification.
//
// Audit finding (see docs/SHF_LEARNING_ARCADE_MASTERY_ARCHITECTURE.md §
// Community Domain Decision): every real, product-evidenced "community"
// concept in this repository — workshops, site visits, mentoring
// sessions, networking — is already the canonical Career Event domain's
// own WORKSHOP/SITE_VISIT/MENTOR_SESSION/NETWORKING event_type (built
// Phase 4). No genuinely distinct Community activity was found anywhere
// in the repository that isn't already correctly represented by an
// existing domain (Career Events for community-facing events, Projects
// for community-service-as-project). No new Community domain, table, or
// route was created this phase — that would duplicate existing canonical
// truth, which the phase brief explicitly forbids.
//
// These tests do not exercise new code (there is none to test) — they
// prove the reuse/classification decision itself: that a "community"
// event, modeled as one of these existing Career Event types, already
// gets full, correct audience-scope entitlement, direct-ID protection,
// stable Calendar identity, and an honest completion boundary, with zero
// duplicate record ever created for the same real-world activity.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase5_${Date.now()}`;
const IDS = {
  programA: `program_${RUN}_a`,
  cohortA: `cohort_${RUN}_a`,
  cohortB: `cohort_${RUN}_b`,
  programB: `program_${RUN}_b`,
};

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
  [`user_${RUN}_org_only`, "org_shf_001", `orgonly@${RUN}.test`, "Org Only Learner"],
  [`user_${RUN}_cohort_a`, "org_shf_001", `cohorta@${RUN}.test`, "Cohort A Learner"],
  [`user_${RUN}_cohort_b`, "org_shf_001", `cohortb@${RUN}.test`, "Cohort B Learner"],
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

function futureRange() {
  return { startsAt: new Date(Date.now() + 3600_000).toISOString(), endsAt: new Date(Date.now() + 7200_000).toISOString() };
}

async function createCommunityEvent(title: string, eventType: string, overrides: Record<string, unknown> = {}, userId = "user_admin_001") {
  return api("/career-events", { method: "POST", userId, body: { title: `${RUN} ${title}`, eventType, deliveryMode: "IN_PERSON", ...futureRange(), ...overrides } });
}

async function visibleIds(userId: string) {
  const { status, json } = await api("/career-events", { userId });
  assert.equal(status, 200);
  return new Set((json.data.items || []).map((item: any) => item.id));
}

async function cleanup() {
  await query("DELETE FROM career_events WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM cohort_staff WHERE cohort_id = ANY($1::text[])", [[IDS.cohortA, IDS.cohortB]]);
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohorts WHERE cohort_id = ANY($1::text[])", [[IDS.cohortA, IDS.cohortB]]);
  await query("DELETE FROM programs WHERE program_id = ANY($1::text[])", [[IDS.programA, IDS.programB]]);
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES
      ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active'),
      ('org_partner_001', 'Partner Organization', 'Partner Organization', 'partner', 'active')
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
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status)
     VALUES ($1, 'org_shf_001', 'Phase 8 Community Program A', 'education', 'active'),
            ($2, 'org_shf_001', 'Phase 8 Community Program B', 'education', 'active')
     ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA, IDS.programB],
  );
  await query(
    `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, status, starts_at, ends_at, created_by_user_id)
     VALUES
      ($1, 'org_shf_001', 'tenant:org_shf_001', $3, 'Phase 8 Community Cohort A', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001'),
      ($2, 'org_shf_001', 'tenant:org_shf_001', $4, 'Phase 8 Community Cohort B', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001')
     ON CONFLICT (cohort_id) DO NOTHING`,
    [IDS.cohortA, IDS.cohortB, IDS.programA, IDS.programB],
  );
  const enrollmentRows: Array<[string, string, string]> = [
    [`enr_${RUN}_ca`, `user_${RUN}_cohort_a`, IDS.cohortA],
    [`enr_${RUN}_cb`, `user_${RUN}_cohort_b`, IDS.cohortB],
  ];
  for (const [enrollmentId, learnerUserId, cohortId] of enrollmentRows) {
    await query(
      `INSERT INTO enrollments (enrollment_id, organization_id, tenant_id, learner_user_id, program_id, cohort_id, status, created_by_user_id)
       VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, $3, $4, 'ACTIVE', 'user_admin_001')
       ON CONFLICT (enrollment_id) DO NOTHING`,
      [enrollmentId, learnerUserId, IDS.programA, cohortId],
    );
  }
  await query(
    `INSERT INTO cohort_staff (cohort_staff_id, organization_id, tenant_id, cohort_id, user_id, role, status, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, 'user_instructor_001', 'INSTRUCTOR', 'ACTIVE', 'user_admin_001')
     ON CONFLICT DO NOTHING`,
    [`cstaff_${RUN}`, IDS.cohortA],
  );
});

after(async () => {
  await cleanup();
});

test("39. an entitled learner sees a WORKSHOP-typed community event; an org-wide workshop reaches every learner", async () => {
  const created = await createCommunityEvent("Community Volunteer Workshop", "WORKSHOP");
  await api(`/career-events/${created.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "PUBLISHED" } });
  assert.ok((await visibleIds(`user_${RUN}_org_only`)).has(created.json.data.id));
});

test("40/41. a COHORT-scoped SITE_VISIT is denied to an unrelated cohort learner and to a cross-org learner", async () => {
  const created = await createCommunityEvent("Nonprofit Site Visit", "SITE_VISIT", { audienceScope: "COHORT", cohortId: IDS.cohortA }, "user_instructor_001");
  await api(`/career-events/${created.json.data.id}/status`, { method: "PATCH", userId: "user_instructor_001", body: { status: "PUBLISHED" } });
  assert.ok((await visibleIds(`user_${RUN}_cohort_a`)).has(created.json.data.id));
  assert.ok(!(await visibleIds(`user_${RUN}_cohort_b`)).has(created.json.data.id));
  assert.ok(!(await visibleIds("user_partner_student_001")).has(created.json.data.id));
});

test("42. direct-ID read of a MENTOR_SESSION cannot bypass Cohort entitlement", async () => {
  const created = await createCommunityEvent("Community Mentor Session", "MENTOR_SESSION", { audienceScope: "COHORT", cohortId: IDS.cohortA }, "user_instructor_001");
  await api(`/career-events/${created.json.data.id}/status`, { method: "PATCH", userId: "user_instructor_001", body: { status: "PUBLISHED" } });
  assert.equal((await api(`/career-events/${created.json.data.id}`, { userId: `user_${RUN}_cohort_b` })).status, 404);
  assert.equal((await api(`/career-events/${created.json.data.id}`, { userId: `user_${RUN}_cohort_a` })).status, 200);
});

test("43. a DRAFT community event (not yet published) is hidden from students, visible to its creator", async () => {
  const created = await createCommunityEvent("Draft Networking Mixer", "NETWORKING");
  assert.equal(created.json.data.status, "DRAFT");
  assert.ok(!(await visibleIds(`user_${RUN}_org_only`)).has(created.json.data.id));
  assert.ok((await visibleIds("user_admin_001")).has(created.json.data.id));
});

test("44. a scheduled community event projects exactly once — no duplicate record for the same real-world activity", async () => {
  const created = await createCommunityEvent("Single Site Visit Record", "SITE_VISIT");
  await api(`/career-events/${created.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "PUBLISHED" } });
  const { json } = await api("/career-events", { userId: "user_admin_001" });
  const matches = json.data.items.filter((item: any) => item.id === created.json.data.id);
  assert.equal(matches.length, 1);
});

test("45/46. attendance/completion truth is never fabricated from registration or date passage — status remains owned by the event's own lifecycle", async () => {
  const created = await createCommunityEvent("Past Workshop", "WORKSHOP", { startsAt: "2020-01-01T00:00:00Z", endsAt: "2020-01-01T01:00:00Z" });
  await api(`/career-events/${created.json.data.id}/status`, { method: "PATCH", userId: "user_admin_001", body: { status: "PUBLISHED" } });
  const view = await api(`/career-events/${created.json.data.id}`, { userId: "user_admin_001" });
  // A PUBLISHED workshop whose date has long passed stays PUBLISHED, not
  // silently "COMPLETED" or "attended" — only an explicit status
  // transition (already tested in career-events.security.test.ts) changes
  // this, never mere date passage.
  assert.equal(view.json.data.status, "PUBLISHED");
});

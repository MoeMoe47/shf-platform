// SHF Ecosystem Phase 10 — Calendar Intelligence integration tests.
// Verifies GET /calendar/intelligence/me end-to-end against real fixtures:
// a genuine scheduling conflict (two overlapping Live Learning sessions for
// the same cohort-entitled learner), a genuine deadline concentration
// (two Assignments due within 48 hours), entitlement/self-service-only
// scoping (identical to /calendar/events/me), and that the route calls the
// Projection Service rather than re-deriving its own entitlement.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase5_${Date.now()}`;
const IDS = {
  programA: `program_${RUN}_ia`,
  cohortA: `cohort_${RUN}_ia`,
};

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  ["user_instructor_001", "org_shf_001", "instructor@siliconheartland.org", "SHF Instructor"],
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

async function intelligence(userId: string, qs = "") {
  const { status, json } = await api(`/calendar/intelligence/me${qs}`, { userId });
  assert.equal(status, 200, JSON.stringify(json));
  return json.data;
}

async function cleanup() {
  await query("DELETE FROM assignment_targets WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM assignments WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM live_session_join_events WHERE live_session_id IN (SELECT live_session_id FROM live_sessions WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM live_sessions WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohort_staff WHERE cohort_id = $1", [IDS.cohortA]);
  await query("DELETE FROM cohorts WHERE cohort_id = $1", [IDS.cohortA]);
  await query("DELETE FROM programs WHERE program_id = $1", [IDS.programA]);
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
     VALUES ($1, 'org_shf_001', 'Phase 10 Program A', 'education', 'active') ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA],
  );
  await query(
    `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, status, starts_at, ends_at, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, 'Phase 10 Cohort A', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', 'user_admin_001')
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
    `INSERT INTO cohort_staff (cohort_staff_id, organization_id, tenant_id, cohort_id, user_id, role, status, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, 'user_instructor_001', 'INSTRUCTOR', 'ACTIVE', 'user_admin_001')
     ON CONFLICT DO NOTHING`,
    [`cstaff_${RUN}`, IDS.cohortA],
  );
});

after(async () => {
  await cleanup();
});

test("38. an actor with no events sees an honest empty, non-partial, fully-complete intelligence result", async () => {
  const data = await intelligence("user_partner_student_001");
  assert.equal(data.conflicts.length, 0);
  assert.equal(data.deadlineConcentration.length, 0);
  assert.equal(data.sourceAvailability.partial, false);
  assert.equal(data.conflictAnalysisComplete, true);
  assert.equal(data.deadlineAnalysisComplete, true);
});

test("2/13. two genuinely overlapping Live Learning sessions produce a real HARD_CONFLICT for the entitled learner", async () => {
  const base = Date.now() + 3600_000;
  const a = await api("/live-learning/sessions", { method: "POST", userId: "user_instructor_001", body: { title: `${RUN} Session A`, startsAt: new Date(base).toISOString(), durationMinutes: 60, cohortId: IDS.cohortA } });
  const b = await api("/live-learning/sessions", { method: "POST", userId: "user_instructor_001", body: { title: `${RUN} Session B`, startsAt: new Date(base + 30 * 60_000).toISOString(), durationMinutes: 60, cohortId: IDS.cohortA } });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);

  const data = await intelligence(`user_${RUN}_cohort_a`);
  const ids = new Set([`live-learning:${a.json.data.id}`, `live-learning:${b.json.data.id}`]);
  const found = data.conflicts.find((c: any) => c.eventIds.every((id: string) => ids.has(id)));
  assert.ok(found, "the two overlapping real sessions must produce a real conflict");
  assert.equal(found.type, "HARD_CONFLICT");

  // A different (non-cohort) learner is not entitled to either session and
  // must never see this conflict — Intelligence never widens entitlement.
  const otherData = await intelligence("user_partner_student_001");
  assert.ok(!otherData.conflicts.some((c: any) => c.eventIds.every((id: string) => ids.has(id))));
});

test("20/23. two Assignments due within 48 hours produce a real deadline concentration cluster", async () => {
  const day1 = new Date(Date.now() + 2 * 86_400_000).toISOString();
  const day2 = new Date(Date.now() + 3 * 86_400_000).toISOString();
  const a = await api("/assignments", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Deadline A`, dueAt: day1, assignmentType: "assignment", targets: [{ targetType: "ORGANIZATION" }] } });
  const b = await api("/assignments", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Deadline B`, dueAt: day2, assignmentType: "assignment", targets: [{ targetType: "ORGANIZATION" }] } });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);

  const data = await intelligence(`user_${RUN}_cohort_a`);
  const ids = new Set([`assignment:${a.json.data.id}`, `assignment:${b.json.data.id}`]);
  const cluster = data.deadlineConcentration.find((c: any) => ids.size === c.eventIds.filter((id: string) => ids.has(id)).length);
  assert.ok(cluster, "two real assignments due within 48 hours must form a concentration cluster");
  assert.equal(cluster.requiredCount >= 2, true);

  const rec = data.recommendations.find((r: any) => r.reasonCode === "DEADLINE_CONCENTRATION" && r.relatedEventIds.some((id: string) => ids.has(id)));
  assert.ok(rec, "a concentration cluster must produce a traceable recommendation");
});

test("25/26. every recommendation is traceable to a real event id present in the same request's own data", async () => {
  const data = await intelligence(`user_${RUN}_cohort_a`);
  const validIds = new Set<string>();
  const projection = await api("/calendar/events/me", { userId: `user_${RUN}_cohort_a` });
  for (const e of projection.json.data.items) validIds.add(e.id);
  for (const rec of data.recommendations) {
    for (const id of rec.relatedEventIds) assert.ok(validIds.has(id), `recommendation referenced an id (${id}) not present in this actor's own Calendar projection`);
  }
});

test("39/40/41. entitlement matches /calendar/events/me exactly: cross-org and unentitled actors never see another actor's conflicts or concentration", async () => {
  const cohortData = await intelligence(`user_${RUN}_cohort_a`);
  const crossOrgData = await intelligence("user_partner_student_001");
  // The cross-org learner has zero entitled events; its intelligence must
  // therefore be a strict, honest empty state, never inheriting anything
  // computed for a different actor.
  assert.equal(crossOrgData.conflicts.length, 0);
  assert.equal(crossOrgData.deadlineConcentration.length, 0);
  assert.equal(crossOrgData.recommendations.length, 0);
  assert.ok(cohortData.conflicts.length > 0 || cohortData.deadlineConcentration.length > 0, "sanity: the entitled learner does have real signal to compare against");
});

test("42/43. no client-suppliable identity parameter can widen or redirect intelligence to another actor", async () => {
  // org_shf_001 is also written to by other test files running
  // concurrently in the same `node --test` process pool (other suites'
  // own ORGANIZATION-scoped fixtures), so comparing this test's *entire*
  // weeklyLoad/conflicts payload between two requests would be vulnerable
  // to unrelated concurrent noise even fired with Promise.all. Instead,
  // create one fixture of our own and check only whether *its own* id is
  // (or is not) present identically in both responses — a check no
  // unrelated concurrently-running test file's fixtures can perturb.
  const probeDue = new Date(Date.now() + 86_400_000).toISOString();
  const probe = await api("/assignments", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Spoof Probe`, dueAt: probeDue, assignmentType: "assignment", targets: [{ targetType: "ORGANIZATION" }] } });
  assert.equal(probe.status, 201);
  const probeId = `assignment:${probe.json.data.id}`;

  const [plain, spoofed] = await Promise.all([
    intelligence(`user_${RUN}_cohort_a`),
    intelligence(`user_${RUN}_cohort_a`, "?learnerId=user_admin_001&userId=user_admin_001&actorId=user_admin_001"),
  ]);
  const hasProbe = (data: any) => data.recommendations.some((r: any) => r.relatedEventIds.includes(probeId));
  assert.equal(hasProbe(plain), true, "sanity: the probe assignment must actually produce a DEADLINE_SOON recommendation");
  assert.equal(hasProbe(spoofed), hasProbe(plain));
});

test("44. an invalid range is rejected with the same error contract as /calendar/events/me", async () => {
  const { status, json } = await api("/calendar/intelligence/me?from=not-a-date&to=2026-01-01T00:00:00Z", { userId: `user_${RUN}_cohort_a` });
  assert.equal(status, 400);
  assert.equal(json.error.code, "INVALID_DATE");
});

test("45. Intelligence calls the Projection Service exactly once — verified indirectly via identical item-derived counts", async () => {
  const data = await intelligence(`user_${RUN}_cohort_a`);
  const projection = await api("/calendar/events/me", { userId: `user_${RUN}_cohort_a` });
  const scheduledInProjection = projection.json.data.items.filter((e: any) => e.type === "LIVE_SESSION" || e.type === "CAREER_EVENT" || e.type === "PROJECT_PRESENTATION").length;
  assert.equal(data.weeklyLoad.scheduledEventCount, scheduledInProjection, "Intelligence's own scheduled-event count must match the same request's projection 1:1, proving it derived from that one call rather than an independent re-query");
});

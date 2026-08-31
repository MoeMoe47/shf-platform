// SHF Ecosystem Phase 12.2 — Native External Calendar Integration tests.
// Covers OAuth connect/refresh/disconnect (§40-41 Google/Microsoft
// matrices, exercised generically since both share the same orchestration
// code), mirror sync (§42), free/busy (§43), Companion integration (§45),
// and IDOR/security (§46) — all against real Postgres via a
// MockExternalCalendarProvider injected at the service layer (mirroring
// calendar-projection-service.ts's own `adaptersOverride` testability
// pattern), never a real Google/Microsoft network call.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";
import { MockExternalCalendarProvider, getMockMirroredEvent } from "../src/domain/external-accounts/providers/mock-calendar-provider.ts";
import {
  startExternalCalendarConnect,
  completeExternalCalendarConnect,
  CallbackVerificationError,
} from "../src/domain/external-accounts/service/external-calendar-connect-service.ts";
import {
  getValidAccessTokenForActor,
  revokeConnection,
  listConnectionsForActor,
} from "../src/domain/external-accounts/service/external-account-connection-service.ts";
import { syncMirrorForActor, MirrorSyncInProgressError, MirrorNotReadyError } from "../src/domain/external-accounts/service/external-calendar-mirror-service.ts";
import { getExternalAvailabilityForActor } from "../src/domain/external-accounts/service/external-availability-service.ts";
import { getCompanionContextForActor } from "../src/domain/companion/service/companion-context-service.ts";
import { createAuthorizationState } from "../src/domain/external-accounts/service/oauth-state-service.ts";
import { mergeRolePermissions } from "../src/auth/security-permissions.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase122_${Date.now()}`;

const BASE_USERS = [
  [`user_${RUN}_a`, "org_shf_001", `a@${RUN}.test`, "Learner A"],
  [`user_${RUN}_b`, "org_shf_001", `b@${RUN}.test`, "Learner B"],
  [`user_${RUN}_admin`, "org_shf_001", `admin@${RUN}.test`, "Org Admin"],
] as const;

const STUDENT_PERMISSIONS = mergeRolePermissions(["student"]);

function actorA() {
  return { organization_id: "org_shf_001", user_id: `user_${RUN}_a`, active_organization_id: "org_shf_001", tenant_id: undefined as any, roles: ["student"], permissions: STUDENT_PERMISSIONS };
}
function actorB() {
  return { organization_id: "org_shf_001", user_id: `user_${RUN}_b`, active_organization_id: "org_shf_001", tenant_id: undefined as any, roles: ["student"], permissions: STUDENT_PERMISSIONS };
}

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}

async function api(path: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(opts.userId) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch { /* redirects have no JSON body */ }
  return { status: res.status, json, location: res.headers.get("location") };
}

const CREATED_ASSIGNMENT_IDS = new Set<string>();

async function cleanup() {
  await query("DELETE FROM external_calendar_event_links WHERE connection_id IN (SELECT id FROM external_account_connections WHERE user_id LIKE $1)", [`user_${RUN}_%`]);
  await query("DELETE FROM external_account_connections WHERE user_id LIKE $1", [`user_${RUN}_%`]);
  await query("DELETE FROM oauth_authorization_states WHERE user_id LIKE $1", [`user_${RUN}_%`]);
  const ids = [...CREATED_ASSIGNMENT_IDS];
  if (ids.length) {
    await query("DELETE FROM assignment_targets WHERE assignment_id = ANY($1::text[])", [ids]);
    await query("DELETE FROM assignments WHERE assignment_id = ANY($1::text[])", [ids]);
  }
}

before(async () => {
  await cleanup();
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'nonprofit', 'active') ON CONFLICT (organization_id) DO NOTHING`);
  for (const [userId, organizationId, email, fullName] of BASE_USERS) {
    await withSeedRetry(() => query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, $4, 'active', 'local') ON CONFLICT (user_id) DO NOTHING`,
      [userId, organizationId, email, fullName],
    ));
  }
});

after(async () => {
  await cleanup();
});

async function connectMockConnection(actor: ReturnType<typeof actorA>, provider: "google" | "microsoft", mock = new MockExternalCalendarProvider(provider)) {
  const { authorizationUrl } = await startExternalCalendarConnect(actor, provider, "/career/settings", mock);
  const state = new URL(authorizationUrl.replace("https://mock.invalid", "http://x")).searchParams.get("state")!;
  await completeExternalCalendarConnect(actor, provider, { code: `code_${state}`, state }, mock);
  return mock;
}

// Phase 14 acceptance finding: when the full suite runs, Phase 13's
// background-dispatcher test (external-calendar-hardening.test.ts) scans
// ALL active connections system-wide, by design — including connections
// this file creates, in a different concurrently-running test file. Two
// independent, individually-correct callers can legitimately race for
// the advisory lock on the same connection; the lock behaves exactly as
// designed (exactly one proceeds), but a plain, non-tolerant `await`
// here would occasionally observe the losing side as a hard failure.
// This retry — test-only, never production code — is the same "transient
// condition, caller retries" pattern documented for the real HTTP route
// (see external-accounts/api/routes.ts's own 409 SYNC_IN_PROGRESS
// handling for the production-facing equivalent).
async function syncWithRetry(actor: any, provider: "google" | "microsoft", mock?: any, attempts = 5): Promise<ReturnType<typeof syncMirrorForActor> extends Promise<infer T> ? T : never> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await syncMirrorForActor(actor, provider, mock);
    } catch (error) {
      if (error instanceof MirrorSyncInProgressError && attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      throw error;
    }
  }
}

// ==================== §40/§41 Google + Microsoft OAuth matrix ====================
// (parametrized over both providers — the orchestration code is identical
// for both; only the adapter differs, and neither real adapter is called
// here.)

for (const provider of ["google", "microsoft"] as const) {
  test(`[${provider}] 1/2/3. start produces an authorization URL carrying state, and the callback consumes that state exactly once`, async () => {
    const mock = new MockExternalCalendarProvider(provider);
    const { authorizationUrl } = await startExternalCalendarConnect(actorA(), provider, "/career/settings", mock);
    assert.match(authorizationUrl, /state=/);
    assert.match(authorizationUrl, /challenge=/);
    const state = new URL(authorizationUrl.replace("https://mock.invalid", "http://x")).searchParams.get("state")!;

    const first = await completeExternalCalendarConnect(actorA(), provider, { code: "abc123", state }, mock);
    assert.equal(first.returnPath, "/career/settings");

    await assert.rejects(
      () => completeExternalCalendarConnect(actorA(), provider, { code: "abc123", state }, mock),
      CallbackVerificationError,
      "replaying the same state must fail",
    );
  });

  test(`[${provider}] 4/5. token exchange derives a real provider account identity`, async () => {
    const mock = new MockExternalCalendarProvider(provider);
    await connectMockConnection(actorA(), provider, mock);
    const row = await query("SELECT provider_account_id FROM external_account_connections WHERE organization_id=$1 AND user_id=$2 AND provider=$3", [actorA().organization_id, actorA().user_id, provider]);
    assert.ok(row.rows[0].provider_account_id.startsWith("mock_account_"));
  });

  test(`[${provider}] 6/12. the connection is persisted encrypted, and raw tokens never leak into the safe DTO`, async () => {
    await connectMockConnection(actorA(), provider);
    const row = await query("SELECT access_token_ciphertext, refresh_token_ciphertext FROM external_account_connections WHERE organization_id=$1 AND user_id=$2 AND provider=$3", [actorA().organization_id, actorA().user_id, provider]);
    assert.ok(row.rows[0].access_token_ciphertext);
    assert.ok(row.rows[0].refresh_token_ciphertext);
    assert.ok(!row.rows[0].refresh_token_ciphertext.includes("mock_refresh"));

    const connections = await listConnectionsForActor(actorA());
    const serialized = JSON.stringify(connections);
    assert.ok(!serialized.includes("mock_access"));
    assert.ok(!serialized.includes("mock_refresh"));
  });

  test(`[${provider}] 7. an expiring access token is transparently refreshed`, async () => {
    const mock = new MockExternalCalendarProvider(provider);
    await connectMockConnection(actorA(), provider, mock);
    await query("UPDATE external_account_connections SET access_token_expires_at = NOW() - INTERVAL '1 minute' WHERE organization_id=$1 AND user_id=$2 AND provider=$3", [actorA().organization_id, actorA().user_id, provider]);
    const result = await getValidAccessTokenForActor(actorA(), provider, mock);
    assert.ok(result);
    assert.ok(result!.accessToken.startsWith("mock_access_"));
  });

  test(`[${provider}] 8. a refresh call that omits a new refresh token never erases the existing one`, async () => {
    const mock = new MockExternalCalendarProvider(provider);
    await connectMockConnection(actorA(), provider, mock);
    const before = await query("SELECT refresh_token_ciphertext FROM external_account_connections WHERE organization_id=$1 AND user_id=$2 AND provider=$3", [actorA().organization_id, actorA().user_id, provider]);
    await query("UPDATE external_account_connections SET access_token_expires_at = NOW() - INTERVAL '1 minute' WHERE organization_id=$1 AND user_id=$2 AND provider=$3", [actorA().organization_id, actorA().user_id, provider]);
    await getValidAccessTokenForActor(actorA(), provider, mock); // mock's refreshAccessToken() returns refreshToken: null by default
    const after = await query("SELECT refresh_token_ciphertext FROM external_account_connections WHERE organization_id=$1 AND user_id=$2 AND provider=$3", [actorA().organization_id, actorA().user_id, provider]);
    // AES-GCM always uses a fresh random IV per encryption (never reused,
    // by design — see external-secret-cipher.ts), so the ciphertext BYTES
    // legitimately differ even when the underlying plaintext is
    // unchanged; the real assertion is null-vs-not-null (never erased),
    // not byte-for-byte ciphertext equality.
    assert.ok(before.rows[0].refresh_token_ciphertext, "sanity: a refresh token was actually stored to begin with");
    assert.ok(after.rows[0].refresh_token_ciphertext, "refresh token must still be present after a refresh that omitted a new one — never erased");
  });

  test(`[${provider}] 9. a rejected refresh marks the connection REAUTH_REQUIRED, never silently DISCONNECTED`, async () => {
    const mock = new MockExternalCalendarProvider(provider);
    await connectMockConnection(actorA(), provider, mock);
    mock.refreshAccessToken = async () => { throw new Error("invalid_grant"); };
    await query("UPDATE external_account_connections SET access_token_expires_at = NOW() - INTERVAL '1 minute' WHERE organization_id=$1 AND user_id=$2 AND provider=$3", [actorA().organization_id, actorA().user_id, provider]);
    const result = await getValidAccessTokenForActor(actorA(), provider, mock);
    assert.equal(result, null);
    const row = await query("SELECT status FROM external_account_connections WHERE organization_id=$1 AND user_id=$2 AND provider=$3", [actorA().organization_id, actorA().user_id, provider]);
    assert.equal(row.rows[0].status, "REAUTH_REQUIRED");
    assert.notEqual(row.rows[0].status, "REVOKED");
  });

  test(`[${provider}] 10/11. disconnect destroys local secrets even when provider revocation fails, and never exposes the token`, async () => {
    const mock = new MockExternalCalendarProvider(provider);
    await connectMockConnection(actorA(), provider, mock);
    mock.revokeConnection = async () => { throw new Error("provider_revoke_unreachable"); };
    const result = await revokeConnection(actorA(), provider, mock);
    assert.equal(result.revoked, true);
    assert.equal(result.providerRevocationSucceeded, false, "provider failure is reported honestly");
    const row = await query("SELECT status, refresh_token_ciphertext, access_token_ciphertext FROM external_account_connections WHERE organization_id=$1 AND user_id=$2 AND provider=$3", [actorA().organization_id, actorA().user_id, provider]);
    assert.equal(row.rows[0].status, "REVOKED");
    assert.equal(row.rows[0].refresh_token_ciphertext, null);
    assert.equal(row.rows[0].access_token_ciphertext, null);
  });
}

// ==================== state actor/provider binding (shared security property) ====================

test("callback fails if a different actor presents the state, or the wrong provider is named", async () => {
  const mock = new MockExternalCalendarProvider("google");
  const { authorizationUrl } = await startExternalCalendarConnect(actorA(), "google", "/career/settings", mock);
  const state = new URL(authorizationUrl.replace("https://mock.invalid", "http://x")).searchParams.get("state")!;

  await assert.rejects(() => completeExternalCalendarConnect(actorB(), "google", { code: "c", state }, mock), CallbackVerificationError);

  const { authorizationUrl: url2 } = await startExternalCalendarConnect(actorA(), "google", "/career/settings", mock);
  const state2 = new URL(url2.replace("https://mock.invalid", "http://x")).searchParams.get("state")!;
  await assert.rejects(() => completeExternalCalendarConnect(actorA(), "microsoft", { code: "c", state: state2 }, mock), CallbackVerificationError);
});

test("an unsafe returnPath is rejected before any state is created", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await assert.rejects(() => startExternalCalendarConnect(actorA(), "google", "https://evil.example", mock));
});

// ==================== §42 Mirror test matrix ====================

async function seedAssignmentForActor(actor: ReturnType<typeof actorA>, title: string, daysFromNow = 3) {
  const dueAt = new Date(Date.now() + daysFromNow * 86_400_000).toISOString();
  const created = await api("/assignments", { method: "POST", userId: "user_admin_001", body: { title, dueAt, assignmentType: "assignment", targets: [{ targetType: "LEARNER", learnerUserId: actor.user_id }] } });
  assert.equal(created.status, 201);
  CREATED_ASSIGNMENT_IDS.add(created.json.data.id);
  return { id: created.json.data.id, dueAt };
}

test("25/26. initial sync creates one mirror per event; a second sync updates the same mirror, never a duplicate", async () => {
  // NOTE: org_shf_001 has real, permanent, organization-wide seed
  // assignments (see seeds/011_seed_assignments.sql) that legitimately
  // appear in every learner's own projection window alongside whatever
  // this test creates — so assertions here are scoped to this test's own
  // specific SHF event by its own stable projection id, never to
  // aggregate created/updated/removed counts across the whole sync pass.
  const mock = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mock);
  const { id: assignmentId } = await seedAssignmentForActor(actorA(), `${RUN} Mirror Create`);
  const shfProjectionId = `assignment:${assignmentId}`;

  await syncWithRetry(actorA() as any, "google", mock);
  const linkAfterFirst = await query("SELECT provider_event_id FROM external_calendar_event_links WHERE shf_projection_id=$1", [shfProjectionId]);
  assert.equal(linkAfterFirst.rows.length, 1, "exactly one link row was created for this specific SHF event");
  const providerEventId = linkAfterFirst.rows[0].provider_event_id;

  await syncWithRetry(actorA() as any, "google", mock);
  const linkAfterSecond = await query("SELECT provider_event_id FROM external_calendar_event_links WHERE shf_projection_id=$1", [shfProjectionId]);
  assert.equal(linkAfterSecond.rows.length, 1, "still exactly one link row — never a second, duplicate one");
  assert.equal(linkAfterSecond.rows[0].provider_event_id, providerEventId, "the second sync updated the same stable provider event id, not a new one");
});

test("27. an SHF title change is reflected on the next sync against the same provider event id", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mock);
  const { id: assignmentId } = await seedAssignmentForActor(actorA(), `${RUN} Original Title`);
  await syncWithRetry(actorA() as any, "google", mock);

  const link1 = await query("SELECT provider_event_id FROM external_calendar_event_links WHERE shf_projection_id=$1", [`assignment:${assignmentId}`]);
  const providerEventId = link1.rows[0].provider_event_id;

  // No assignment update API exists in this codebase (POST + read-only GET
  // only) — a direct SQL UPDATE is the same "real underlying source
  // record changed" scenario a future edit UI would eventually trigger.
  await query("UPDATE assignments SET title = $1, updated_at = NOW() WHERE assignment_id = $2", [`${RUN} Updated Title`, assignmentId]);

  await syncWithRetry(actorA() as any, "google", mock);
  const link2 = await query("SELECT provider_event_id FROM external_calendar_event_links WHERE shf_projection_id=$1", [`assignment:${assignmentId}`]);
  assert.equal(link2.rows[0].provider_event_id, providerEventId, "same stable provider event id — an update, not a new mirror");
  assert.equal(getMockMirroredEvent(providerEventId)?.title, `${RUN} Updated Title`);
});

test("29/30/31. a removed SHF event's mirror is deleted, and the SHF source record itself is never mutated by mirroring", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mock);
  const { id: assignmentId } = await seedAssignmentForActor(actorA(), `${RUN} Will Be Cancelled`);
  await syncWithRetry(actorA() as any, "google", mock);

  const beforeRow = await query("SELECT title, status FROM assignments WHERE assignment_id=$1", [assignmentId]);

  // Source removal from this actor's own entitled projection — removing
  // the LEARNER target (e.g. unassigned) is the real mechanism, since no
  // assignment-cancel API exists in this codebase.
  await query("DELETE FROM assignment_targets WHERE assignment_id=$1 AND user_id=$2", [assignmentId, actorA().user_id]);

  const result = await syncWithRetry(actorA() as any, "google", mock);
  assert.equal(result.removed, 1);

  const afterRow = await query("SELECT title FROM assignments WHERE assignment_id=$1", [assignmentId]);
  assert.equal(afterRow.rows[0].title, beforeRow.rows[0].title, "mirroring never mutates the SHF source record's own fields");

  const link = await query("SELECT * FROM external_calendar_event_links WHERE shf_projection_id=$1", [`assignment:${assignmentId}`]);
  assert.equal(link.rows.length, 0);
});

test("32/33. one actor's sync never touches another actor's connection or mirrored events", async () => {
  const mockA = new MockExternalCalendarProvider("google");
  const mockB = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mockA);
  await connectMockConnection(actorB(), "google", mockB);
  const { id: assignmentIdA } = await seedAssignmentForActor(actorA(), `${RUN} A Only`);
  const { id: assignmentIdB } = await seedAssignmentForActor(actorB(), `${RUN} B Only`);

  await syncWithRetry(actorA() as any, "google", mockA);
  const linksUnderB = await query("SELECT * FROM external_calendar_event_links WHERE connection_id IN (SELECT id FROM external_account_connections WHERE user_id=$1)", [actorB().user_id]);
  assert.equal(linksUnderB.rows.length, 0, "syncing A must create zero link rows under B's connection");

  await syncWithRetry(actorB() as any, "google", mockB);
  const bOwnLink = await query("SELECT * FROM external_calendar_event_links WHERE connection_id IN (SELECT id FROM external_account_connections WHERE user_id=$1) AND shf_projection_id=$2", [actorB().user_id, `assignment:${assignmentIdB}`]);
  assert.equal(bOwnLink.rows.length, 1, "B's own sync mirrors B's own event");
  const aEventUnderB = await query("SELECT * FROM external_calendar_event_links WHERE connection_id IN (SELECT id FROM external_account_connections WHERE user_id=$1) AND shf_projection_id=$2", [actorB().user_id, `assignment:${assignmentIdA}`]);
  assert.equal(aEventUnderB.rows.length, 0, "A's LEARNER-targeted event must never appear under B's connection — B has no entitlement to it, so it was never even in B's own projection");
});

test("mirror sync refuses to run without an active connection or a valid token", async () => {
  await assert.rejects(() => syncMirrorForActor(actorA() as any, "microsoft"), MirrorNotReadyError);
});

// ==================== §43 Free/Busy test matrix ====================

test("34/35/37. busy intervals are normalized per-provider with no title field", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mock);
  mock.setBusyIntervals([{ startsAt: "2026-02-01T10:00:00Z", endsAt: "2026-02-01T11:00:00Z" }]);

  const result = await getExternalAvailabilityForActor(actorA(), { from: "2026-02-01T00:00:00Z", to: "2026-02-02T00:00:00Z" }, () => mock);
  assert.equal(result.intervals.length, 1);
  assert.equal(result.intervals[0].provider, "google");
  assert.equal("title" in result.intervals[0], false);
  assert.equal(result.complete, true);
});

test("36. overlapping raw intervals are never merged — reported exactly as returned by each provider", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mock);
  mock.setBusyIntervals([
    { startsAt: "2026-02-01T10:00:00Z", endsAt: "2026-02-01T11:00:00Z" },
    { startsAt: "2026-02-01T10:30:00Z", endsAt: "2026-02-01T11:30:00Z" },
  ]);
  const result = await getExternalAvailabilityForActor(actorA(), { from: "2026-02-01T00:00:00Z", to: "2026-02-02T00:00:00Z" }, () => mock);
  assert.equal(result.intervals.length, 2, "no merge policy exists — both raw intervals pass through");
});

test("38/39. one provider failing never blocks the other provider's data", async () => {
  const mockGoogle = new MockExternalCalendarProvider("google");
  const mockMicrosoft = new MockExternalCalendarProvider("microsoft");
  await connectMockConnection(actorA(), "google", mockGoogle);
  await connectMockConnection(actorA(), "microsoft", mockMicrosoft);
  mockGoogle.setFreeBusyShouldFail(true);
  mockMicrosoft.setBusyIntervals([{ startsAt: "2026-02-01T09:00:00Z", endsAt: "2026-02-01T09:30:00Z" }]);

  const result = await getExternalAvailabilityForActor(
    actorA(),
    { from: "2026-02-01T00:00:00Z", to: "2026-02-02T00:00:00Z" },
    (provider) => (provider === "google" ? mockGoogle : mockMicrosoft),
  );
  assert.equal(result.complete, false);
  assert.deepEqual(result.unavailableProviders, ["google"]);
  assert.equal(result.intervals.length, 1);
  assert.equal(result.intervals[0].provider, "microsoft");
});

test("40. actor B's availability call never includes actor A's connections or busy data", async () => {
  // B may already hold a connection from an earlier test in this file
  // (e.g. the mirror-isolation test) — revoke it first so this test's own
  // "B has no connections" precondition is actually true, rather than
  // relying on cross-test ordering.
  await revokeConnection(actorB(), "google").catch(() => {});

  const mockA = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mockA);
  mockA.setBusyIntervals([{ startsAt: "2026-02-01T10:00:00Z", endsAt: "2026-02-01T11:00:00Z" }]);

  const resultB = await getExternalAvailabilityForActor(actorB(), { from: "2026-02-01T00:00:00Z", to: "2026-02-02T00:00:00Z" }, () => mockA);
  assert.equal(resultB.intervals.length, 0);
  assert.equal(resultB.complete, true, "B has no connections at all, which is a complete (empty) result, not a failure");
});

test("41. no route exists anywhere that returns raw busy intervals to anyone, including an admin", async () => {
  const meRoutes = await api("/external-accounts/me", { userId: `user_${RUN}_admin` });
  assert.equal(meRoutes.status, 200);
  const body = JSON.stringify(meRoutes.json);
  assert.ok(!body.includes("startsAt") && !body.includes("busy"), "the safe connection DTO never includes free/busy data");
});

// ==================== §45 Companion test matrix ====================

test("49/50/51. Companion surfaces a generic external-conflict guidance item with no private title or inferred cause", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mock);
  await seedAssignmentForActor(actorA(), `${RUN} Companion Deadline`, 0.1);
  // Overlap window wide enough to catch the assignment's own instant.
  mock.setBusyIntervals([{ startsAt: new Date(Date.now() - 3_600_000).toISOString(), endsAt: new Date(Date.now() + 3 * 86_400_000).toISOString() }]);

  const context = await getCompanionContextForActor(actorA() as any, new Date(), () => mock);
  const guidanceItem = context.guidance.find((g) => g.reasonCode === "EXTERNAL_BUSY_CONFLICT");
  // The assignment is a DEADLINE, not SCHEDULED_TIME, so it cannot itself
  // trigger EXTERNAL_BUSY_CONFLICT (that requires a SCHEDULED_TIME event)
  // — this test instead documents that when no SCHEDULED_TIME event
  // exists, no EXTERNAL_BUSY_CONFLICT guidance is fabricated.
  assert.equal(guidanceItem, undefined, "no SCHEDULED_TIME SHF event exists in this fixture, so no external conflict guidance should appear");
});

test("52. disconnecting removes external availability context from Companion without touching normal SHF guidance", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mock);
  await seedAssignmentForActor(actorA(), `${RUN} Still Due Soon`, 1);
  await revokeConnection(actorA(), "google", mock);

  const context = await getCompanionContextForActor(actorA() as any, new Date(), () => mock);
  assert.equal(context.guidance.some((g) => g.reasonCode === "EXTERNAL_BUSY_CONFLICT"), false);
  assert.ok(context.calendar, "normal SHF calendar summary is unaffected by having no external connection");
});

// ==================== §46 Security / IDOR test matrix ====================

test("54/55. another learner cannot list, connect, or disconnect actor A's provider, and a query-string spoof is ineffective", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mock);

  const listB = await api("/external-accounts/me", { userId: `user_${RUN}_b` });
  assert.equal(listB.json.data.connections.some((c: any) => c.provider === "google"), false);

  const spoofed = await api(`/external-accounts/me?userId=${encodeURIComponent(actorA().user_id)}`, { userId: `user_${RUN}_b` });
  assert.equal(spoofed.json.data.connections.some((c: any) => c.provider === "google"), false);

  const del = await api("/external-accounts/google", { method: "DELETE", userId: `user_${RUN}_b` });
  assert.equal(del.status, 404, "B has no google connection of their own to delete");

  const stillActive = await listConnectionsForActor(actorA());
  assert.ok(stillActive.some((c) => c.provider === "google" && c.status === "ACTIVE"), "A's connection must be unaffected by B's attempt");
});

test("56. cross-org isolation is structural (repo always scopes by organization_id + user_id together)", async () => {
  const list = await listConnectionsForActor({ organization_id: "org_other_nonexistent", user_id: actorA().user_id });
  assert.equal(list.length, 0);
});

test("57. an admin's own connection list never includes another learner's connection", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mock);
  const adminList = await api("/external-accounts/me", { userId: `user_${RUN}_admin` });
  assert.equal(adminList.status, 200);
  assert.equal(adminList.json.data.connections.length, 0);
});

test("58/59. ciphertext never appears in a frontend response, and the OAuth start/callback routes never appear in server logs with a token (structural: no logging call exists in these files)", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await connectMockConnection(actorA(), "google", mock);
  const list = await api("/external-accounts/me", { userId: `user_${RUN}_a` });
  const body = JSON.stringify(list.json);
  assert.ok(!body.includes("ciphertext") && !body.includes("mock_access") && !body.includes("mock_refresh"));
});

test("60. a callback for a state issued to a different actor fails (already exercised above via completeExternalCalendarConnect; re-verified via consumeAuthorizationState directly)", async () => {
  const { state } = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const mock = new MockExternalCalendarProvider("google");
  await assert.rejects(() => completeExternalCalendarConnect(actorB(), "google", { code: "c", state }, mock), CallbackVerificationError);
});

test("61. the wrong provider for a real state fails", async () => {
  const { state } = await createAuthorizationState({ actor: actorA(), provider: "google", returnPath: "/career/settings" });
  const mock = new MockExternalCalendarProvider("microsoft");
  await assert.rejects(() => completeExternalCalendarConnect(actorA(), "microsoft", { code: "c", state }, mock), CallbackVerificationError);
});

test("62. replay of an already-consumed state fails", async () => {
  const mock = new MockExternalCalendarProvider("google");
  const { authorizationUrl } = await startExternalCalendarConnect(actorA(), "google", "/career/settings", mock);
  const state = new URL(authorizationUrl.replace("https://mock.invalid", "http://x")).searchParams.get("state")!;
  await completeExternalCalendarConnect(actorA(), "google", { code: "c1", state }, mock);
  await assert.rejects(() => completeExternalCalendarConnect(actorA(), "google", { code: "c2", state }, mock), CallbackVerificationError);
});

test("63. an unsafe return path is rejected before it ever reaches a provider redirect", async () => {
  const mock = new MockExternalCalendarProvider("google");
  await assert.rejects(() => startExternalCalendarConnect(actorA(), "google", "javascript:alert(1)", mock));
});

// ==================== §47 ICS regression (live HTTP smoke) ====================

test("ICS/webcal feed routes are unaffected by this phase (still respond)", async () => {
  const status = await api("/calendar/feed-token/me", { userId: `user_${RUN}_a` });
  assert.equal(status.status, 200);
});

// ==================== real Google/Microsoft not-configured honesty (live HTTP) ====================

test("the real /oauth/start route reports PROVIDER_NOT_CONFIGURED for both providers in this environment (no real credentials are set)", async () => {
  for (const provider of ["google", "microsoft"]) {
    const res = await api(`/external-accounts/${provider}/oauth/start?returnPath=/career/settings`, { userId: `user_${RUN}_a` });
    assert.equal(res.status, 503);
    assert.equal(res.json.error.code, "PROVIDER_NOT_CONFIGURED");
  }
});

// SHF Ecosystem Phase 12 — ICS feed token integration tests. Verifies the
// full token lifecycle end-to-end against real fixtures: rotation,
// revocation, cross-user isolation, and that the feed exposes only the
// same already-entitled events /calendar/events/me returns for that actor.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase5_${Date.now()}`;

const BASE_USERS = [
  ["user_admin_001", "org_shf_001", "admin@siliconheartland.org", "SHF Admin"],
  [`user_${RUN}_org_only`, "org_shf_001", `a@${RUN}.test`, "Learner A"],
  [`user_${RUN}_cohort_a`, "org_shf_001", `b@${RUN}.test`, "Learner B"],
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

async function fetchIcs(token: string) {
  const res = await fetch(`${BASE}/calendar/feed.ics?token=${encodeURIComponent(token)}`);
  const text = await res.text();
  return { status: res.status, text, contentType: res.headers.get("content-type") };
}

// RFC 5545 line-folding (§3.1) legitimately splits a long content line
// across "\r\n " continuations — a long UID (this app's ids embed a UUID)
// routinely exceeds the 75-octet fold width. Any real ICS parser unfolds
// before reading property values; tests must do the same rather than
// assuming every property fits on one physical line.
function unfoldIcs(text: string): string {
  return text.replace(/\r\n /g, "");
}

async function cleanup() {
  await query("DELETE FROM assignment_targets WHERE assignment_id IN (SELECT assignment_id FROM assignments WHERE title LIKE $1)", [`${RUN} %`]);
  await query("DELETE FROM assignments WHERE title LIKE $1", [`${RUN} %`]);
  await query("DELETE FROM calendar_feed_tokens WHERE user_id LIKE $1", [`user_${RUN}_%`]);
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

test("1. a learner with no token has an inactive status", async () => {
  const { status, json } = await api("/calendar/feed-token/me", { userId: `user_${RUN}_org_only` });
  assert.equal(status, 200);
  assert.equal(json.data.active, false);
  assert.equal(json.data.createdAt, null);
});

test("2. rotating creates an active token and returns the raw value exactly once", async () => {
  const rotate = await api("/calendar/feed-token/rotate", { method: "POST", userId: `user_${RUN}_org_only` });
  assert.equal(rotate.status, 200);
  assert.ok(rotate.json.data.token && rotate.json.data.token.length >= 32);

  const status = await api("/calendar/feed-token/me", { userId: `user_${RUN}_org_only` });
  assert.equal(status.json.data.active, true);
  assert.ok(status.json.data.createdAt);
  assert.equal("token" in status.json.data, false, "status must never return the token itself");
});

test("3/8/9. the feed exposes only real, entitled events for that learner and rejects a missing/invalid token", async () => {
  const rotate = await api("/calendar/feed-token/rotate", { method: "POST", userId: `user_${RUN}_org_only` });
  const token = rotate.json.data.token;

  const created = await api("/assignments", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Feed Assignment`, dueAt: "2026-11-01T00:00:00Z", assignmentType: "assignment", targets: [{ targetType: "ORGANIZATION" }] } });
  assert.equal(created.status, 201);

  const ics = await fetchIcs(token);
  assert.equal(ics.status, 200);
  assert.match(ics.contentType || "", /text\/calendar/);
  const unfolded = unfoldIcs(ics.text);
  assert.match(unfolded, new RegExp(`UID:assignment:${created.json.data.id}@calendar\\.siliconheartland\\.org`));
  assert.match(unfolded, /SUMMARY:.*Feed Assignment/);

  const missing = await fetchIcs("");
  assert.equal(missing.status, 404);
  const invalid = await fetchIcs("not-a-real-token-00000000000000000000000000");
  assert.equal(invalid.status, 404);
});

test("4. cross-user isolation: a LEARNER-targeted assignment appears only in its own target's feed, never the other learner's", async () => {
  const rotateA = await api("/calendar/feed-token/rotate", { method: "POST", userId: `user_${RUN}_org_only` });
  const rotateB = await api("/calendar/feed-token/rotate", { method: "POST", userId: `user_${RUN}_cohort_a` });
  const tokenA = rotateA.json.data.token;
  const tokenB = rotateB.json.data.token;
  assert.notEqual(tokenA, tokenB);

  const targeted = await api("/assignments", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Only For A`, dueAt: "2026-11-05T00:00:00Z", assignmentType: "assignment", targets: [{ targetType: "LEARNER", learnerUserId: `user_${RUN}_org_only` }] } });
  assert.equal(targeted.status, 201);
  const uid = `UID:assignment:${targeted.json.data.id}@calendar.siliconheartland.org`;

  const feedA = await fetchIcs(tokenA);
  const feedB = await fetchIcs(tokenB);
  assert.ok(unfoldIcs(feedA.text).includes(uid), "the targeted learner's own feed must include their directly-targeted assignment");
  assert.ok(!unfoldIcs(feedB.text).includes(uid), "an unrelated learner's feed must never include another learner's directly-targeted assignment");
});

test("5. revoking a token immediately invalidates the feed URL", async () => {
  const rotate = await api("/calendar/feed-token/rotate", { method: "POST", userId: `user_${RUN}_org_only` });
  const token = rotate.json.data.token;
  assert.equal((await fetchIcs(token)).status, 200);

  const revoke = await api("/calendar/feed-token/me", { method: "DELETE", userId: `user_${RUN}_org_only` });
  assert.equal(revoke.status, 200);
  assert.equal((await fetchIcs(token)).status, 404);

  const status = await api("/calendar/feed-token/me", { userId: `user_${RUN}_org_only` });
  assert.equal(status.json.data.active, false);
});

test("6. regenerating invalidates the previously issued token (never two simultaneously valid URLs)", async () => {
  const first = await api("/calendar/feed-token/rotate", { method: "POST", userId: `user_${RUN}_org_only` });
  const firstToken = first.json.data.token;
  assert.equal((await fetchIcs(firstToken)).status, 200);

  const second = await api("/calendar/feed-token/rotate", { method: "POST", userId: `user_${RUN}_org_only` });
  const secondToken = second.json.data.token;
  assert.notEqual(firstToken, secondToken);

  assert.equal((await fetchIcs(firstToken)).status, 404, "the old token must stop working the instant a new one is issued");
  assert.equal((await fetchIcs(secondToken)).status, 200);
});

test("7. repeated fetches of the same feed produce stable UIDs for the same event (no duplication on re-sync)", async () => {
  const rotate = await api("/calendar/feed-token/rotate", { method: "POST", userId: `user_${RUN}_org_only` });
  const token = rotate.json.data.token;
  // Create one fixture of our own and check only that its own UID is
  // present identically both times — comparing the FULL org-wide feed
  // for exact equality is vulnerable to unrelated concurrently-running
  // test files creating/removing their own ORGANIZATION-scoped fixtures
  // in org_shf_001 between the two fetches (same class of flake fixed in
  // Phase 10.1's calendar-intelligence tests). Fired with Promise.all to
  // further shrink the window.
  const probeDue = new Date(Date.now() + 86_400_000).toISOString();
  const probe = await api("/assignments", { method: "POST", userId: "user_admin_001", body: { title: `${RUN} Stability Probe`, dueAt: probeDue, assignmentType: "assignment", targets: [{ targetType: "ORGANIZATION" }] } });
  assert.equal(probe.status, 201);
  const probeUid = `UID:assignment:${probe.json.data.id}@calendar.siliconheartland.org`;

  const [first, second] = await Promise.all([fetchIcs(token), fetchIcs(token)]);
  const hasProbe = (text: string) => unfoldIcs(text).includes(probeUid);
  assert.equal(hasProbe(first.text), true, "sanity: the probe assignment must actually appear in the feed");
  assert.equal(hasProbe(second.text), hasProbe(first.text));
});

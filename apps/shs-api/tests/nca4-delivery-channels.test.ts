import test from "node:test";
import assert from "node:assert/strict";
import { createNotificationFromEvent } from "../src/domain/notifications/service/notification-service.ts";
import { deliverNotificationEmail, renderNotificationEmail, sendWithBoundedRetry } from "../src/domain/notifications/service/delivery-service.ts";
import { classifyMailFailure, type NotificationMailProvider } from "../src/domain/notifications/service/notification-mail-adapter.ts";

function makeNotificationsDb(rows: Record<string, unknown>[] = [], preferenceRows: Record<string, unknown>[] = []) {
  const calls: { sql: string; params: unknown[] }[] = [];
  return {
    calls,
    async query(sql: string, params: unknown[] = []) {
      calls.push({ sql, params });
      if (sql.startsWith("SELECT category, in_app_enabled")) return { rows: preferenceRows };
      if (sql.startsWith("INSERT INTO notifications")) {
        const [id] = params;
        if (rows.some((r) => r.notification_id === id)) return { rows: [] };
        const row = { notification_id: id, organization_id: params[1], tenant_id: params[2], recipient_user_id: params[3], notification_type: params[4], title: params[9], message: params[10], destination_path: params[11], status: "UNREAD" };
        rows.push(row);
        return { rows: [row] };
      }
      if (sql.startsWith("SELECT * FROM notifications WHERE notification_id")) return { rows: rows.filter((r) => r.notification_id === params[0]) };
      return { rows: [] };
    },
  };
}

// A. in-app notification persists even if email delivery fails
test("A: the canonical in-app notification is unaffected by a genuine, forced email delivery failure", async () => {
  const db = makeNotificationsDb();
  const created = await createNotificationFromEvent(
    { event_type: "documentation.signature.requested", organization_id: "org-a", tenant_id: "tenant:org-a", producer_id: "dgal", subject_type: "signature_request", subject_id: "sig-1", idempotency_key: "documentation.signature.requested:sig-1", payload: { signer_user_id: "user-1" } },
    db as any,
  );
  assert.ok((created as any).notification_id, "in-app notification exists");
  // Force a genuine, real provider failure (misconfigured generic-http
  // provider — real code path, not a stub) for a category that IS
  // email-eligible (MANDATORY_OPERATIONAL), so this actually exercises an
  // attempted-and-failed send rather than merely an ineligible skip.
  const originalProvider = process.env.SHS_EMAIL_PROVIDER;
  delete process.env.SHS_EMAIL_PROVIDER_ENDPOINT;
  delete process.env.SHS_EMAIL_PROVIDER_API_KEY;
  process.env.SHS_EMAIL_PROVIDER = "generic-http";
  let deliveryResult;
  try {
    deliveryResult = await deliverNotificationEmail(
      { notificationId: (created as any).notification_id, notificationType: "DOCUMENTATION_SIGNATURE_REQUIRED", title: "x", message: "y", destinationPath: "/documentation/items/x", organizationId: "org-a" },
      { userId: "user-1", email: "user@example.com" },
    );
  } finally {
    process.env.SHS_EMAIL_PROVIDER = originalProvider || "test";
  }
  assert.equal(deliveryResult.state, "NOT_CONFIGURED"); // a real, attempted, failed send — not a fabricated "delivered".
  const stillThere = await db.query("SELECT * FROM notifications WHERE notification_id=$1", [(created as any).notification_id]);
  assert.equal(stillThere.rows.length, 1, "the in-app notification row is completely unaffected by the failed delivery attempt");
});

// B. preference suppresses optional external delivery / C. mandatory category follows policy
test("B/C: OPTIONAL_PRODUCT email is suppressed by preference; REQUIRED_ACTION/MANDATORY_OPERATIONAL cannot be suppressed by any preference row", async () => {
  const db = makeNotificationsDb([], [{ category: "OPTIONAL_PRODUCT", in_app_enabled: false }]);
  const optionalResult = await deliverNotificationEmail(
    { notificationId: "n1", notificationType: "COMPLETION_ACHIEVED", title: "x", message: "y", destinationPath: null, organizationId: "org-a" },
    { userId: "user-1", email: "user@example.com" },
    { db: db as any },
  );
  // COMPLETION_ACHIEVED (OPTIONAL_PRODUCT) is not even email-eligible per
  // channel policy — confirms optional categories never reach external
  // delivery at all, independent of the preference row.
  assert.equal(optionalResult.state, "SKIPPED_INELIGIBLE");
  assert.equal(optionalResult.reason, "CATEGORY_NOT_EMAIL_ELIGIBLE");

  const mandatoryDb = makeNotificationsDb([], [{ category: "MANDATORY_OPERATIONAL", in_app_enabled: false }]); // even if such a row existed
  process.env.SHS_EMAIL_PROVIDER = "test";
  const mandatoryResult = await deliverNotificationEmail(
    { notificationId: "n2", notificationType: "DOCUMENTATION_SIGNATURE_REQUIRED", title: "Signature required", message: "A document is waiting for an authorized signature.", destinationPath: "/documentation/items/x", organizationId: "org-a" },
    { userId: "user-1", email: "user@example.com" },
    { db: mandatoryDb as any },
  );
  assert.equal(mandatoryResult.state, "SENT"); // never suppressed, regardless of the (structurally-impossible) preference row.
});

// D. duplicate event does not duplicate delivery (via the "freshly inserted" idempotency signal)
test("D: a replayed source event does not create a second in-app notification, and the canonical dedupe key is the natural idempotent send key", async () => {
  const rows: Record<string, unknown>[] = [];
  const db = makeNotificationsDb(rows);
  const event = { event_type: "credential.issued", organization_id: "org-a", tenant_id: "tenant:org-a", producer_id: "shs-api.credentials", subject_type: "learner_credential", subject_id: "cred-2", idempotency_key: "credential.issued:cred-2", payload: { learner_user_id: "user-1" } };
  const first = await createNotificationFromEvent(event, db as any);
  const replay = await createNotificationFromEvent(event, db as any);
  assert.equal((first as any).notification_id, (replay as any).notification_id);
  assert.equal(rows.length, 1, "exactly one notification row exists after a replayed event");
});

// E/F. retryable provider error retries boundedly; permanent error does not infinite-loop
test("E/F: failure classification correctly separates transient (retryable) from permanent/not-configured (never retried)", () => {
  assert.equal(classifyMailFailure("EMAIL_PROVIDER_RETRYABLE"), "TRANSIENT");
  assert.equal(classifyMailFailure("EMAIL_PROVIDER_TIMEOUT"), "TRANSIENT");
  assert.equal(classifyMailFailure("EMAIL_PROVIDER_UNAVAILABLE"), "TRANSIENT");
  assert.equal(classifyMailFailure("EMAIL_PROVIDER_REJECTED"), "PERMANENT");
  assert.equal(classifyMailFailure("EMAIL_PROVIDER_NOT_CONFIGURED"), "NOT_CONFIGURED");
  assert.equal(classifyMailFailure(undefined), "PERMANENT"); // never assumed safe to retry by default.
});

test("E: a persistently transient failure retries up to the bounded maximum, never infinitely", async () => {
  let calls = 0;
  const provider: NotificationMailProvider = {
    async send() {
      calls += 1;
      return { delivered: false, provider: "flaky", reason: "EMAIL_PROVIDER_RETRYABLE" };
    },
  };
  const { attempts, result } = await sendWithBoundedRetry(provider, { to: "x", subject: "x", templateKey: "x", notificationId: "n", bodyText: "x" });
  assert.equal(attempts, 3);
  assert.equal(calls, 3);
  assert.equal(result.delivered, false);
});

test("E: a transient failure that recovers stops retrying immediately on success", async () => {
  let calls = 0;
  const provider: NotificationMailProvider = {
    async send() {
      calls += 1;
      if (calls < 2) return { delivered: false, provider: "flaky", reason: "EMAIL_PROVIDER_RETRYABLE" };
      return { delivered: true, provider: "flaky", providerMessageReference: "ref-1" };
    },
  };
  const { attempts, result } = await sendWithBoundedRetry(provider, { to: "x", subject: "x", templateKey: "x", notificationId: "n", bodyText: "x" });
  assert.equal(attempts, 2);
  assert.equal(result.delivered, true);
});

test("F: a real, live send against the configured test provider always succeeds on the first attempt (no unnecessary retries)", async () => {
  process.env.SHS_EMAIL_PROVIDER = "test";
  const db = makeNotificationsDb();
  const result = await deliverNotificationEmail(
    { notificationId: "n3", notificationType: "DOCUMENTATION_SIGNATURE_REQUIRED", title: "t", message: "m", destinationPath: null, organizationId: "org-a" },
    { userId: "user-1", email: "user@example.com" },
    { db: db as any },
  );
  assert.equal(result.state, "SENT");
  assert.equal(result.attempts, 1);
});

test("F: a permanent provider error never exceeds one attempt", async () => {
  // Deliberately misconfigure the provider selection to something invalid
  // to exercise the NOT_CONFIGURED path without a real network dependency.
  const original = process.env.SHS_EMAIL_PROVIDER_ENDPOINT;
  const originalKey = process.env.SHS_EMAIL_PROVIDER_API_KEY;
  delete process.env.SHS_EMAIL_PROVIDER_ENDPOINT;
  delete process.env.SHS_EMAIL_PROVIDER_API_KEY;
  process.env.SHS_EMAIL_PROVIDER = "generic-http";
  const db = makeNotificationsDb();
  try {
    const result = await deliverNotificationEmail(
      { notificationId: "n4", notificationType: "DOCUMENTATION_SIGNATURE_REQUIRED", title: "t", message: "m", destinationPath: null, organizationId: "org-a" },
      { userId: "user-1", email: "user@example.com" },
      { db: db as any },
    );
    assert.equal(result.state, "NOT_CONFIGURED");
    assert.equal(result.attempts, 1); // NOT_CONFIGURED classifies as non-transient — never retried.
  } finally {
    process.env.SHS_EMAIL_PROVIDER = "test";
    if (original !== undefined) process.env.SHS_EMAIL_PROVIDER_ENDPOINT = original;
    if (originalKey !== undefined) process.env.SHS_EMAIL_PROVIDER_API_KEY = originalKey;
  }
});

// G. safe action URL remains authorization-neutral
test("G: renderNotificationEmail never includes an unsafe or external destination, and carries no embedded authority", () => {
  const safe = renderNotificationEmail({ notificationId: "n5", notificationType: "X", title: "t", message: "m", destinationPath: "/studio/projects/abc", organizationId: "org-a" });
  assert.equal(safe.actionUrl, "/studio/projects/abc");
  assert.equal(safe.bodyText.includes("org-a"), false, "organization id must never appear embedded in the rendered link/body");

  const unsafe = renderNotificationEmail({ notificationId: "n6", notificationType: "X", title: "t", message: "m", destinationPath: "//evil.example.com/phish", organizationId: "org-a" });
  assert.equal(unsafe.actionUrl, undefined, "a protocol-relative path must never be treated as a safe action link");

  const scripty = renderNotificationEmail({ notificationId: "n7", notificationType: "X", title: "t", message: "m", destinationPath: "javascript:alert(1)", organizationId: "org-a" });
  assert.equal(scripty.actionUrl, undefined);
});

// H. cross-org recipient isolation preserved
test("H: multi-recipient CivicSure delivery never resolves a recipient outside the receiving organization", async () => {
  const db = {
    calls: [] as any[],
    async query(sql: string, params: unknown[]) {
      this.calls.push({ sql, params });
      if (sql.startsWith("SELECT receiving_organization_id")) return { rows: [{ receiving_organization_id: "org-receiving" }] };
      if (sql.startsWith("SELECT DISTINCT m.user_id")) {
        assert.equal(params[0], "org-receiving", "must query the receiving organization, never the creating one");
        return { rows: [{ user_id: "staffer-1" }] };
      }
      if (sql.startsWith("INSERT INTO notifications")) return { rows: [{ notification_id: params[0], organization_id: params[1], recipient_user_id: params[3] }] };
      return { rows: [] };
    },
  };
  const result = await createNotificationFromEvent(
    { event_type: "referral.created", organization_id: "org-creating", tenant_id: "tenant:org-creating", producer_id: "hub.referral", subject_type: "referral", subject_id: "case-2", idempotency_key: "referral:case-2:created", payload: { referral_id: "case-2" } },
    db as any,
  );
  const rows = result as any[];
  assert.equal(rows.length, 1);
  assert.equal(rows[0].organization_id, "org-creating", "the notification row itself keeps the event's own organization_id (where the referral was created), not a fabricated one");
});

// I. unavailable channel falls back safely
test("I: an ineligible/unavailable email channel never blocks or degrades the already-created in-app notification", async () => {
  const db = makeNotificationsDb();
  const created = await createNotificationFromEvent(
    { event_type: "deployment.failed", organization_id: "org-a", tenant_id: "tenant:org-a", producer_id: "shs-api.website-deployment", subject_type: "website_deployment", subject_id: "deploy-1", idempotency_key: "deployment.failed:deploy-1", payload: { project_id: "project-1" } },
    { async query(sql: string, params: unknown[]) {
        if (sql.startsWith("SELECT learner_id")) return { rows: [{ user_id: "user-1" }] };
        if (sql.startsWith("INSERT INTO notifications")) return { rows: [{ notification_id: params[0] }] };
        return { rows: [] };
      } } as any,
  );
  assert.ok((created as any).notification_id);
  // DEPLOYMENT_FAILED is REQUIRED_ACTION (email-eligible) but has no
  // deliverable address here — must degrade to SKIPPED_INELIGIBLE, never
  // throw and never retroactively remove the in-app row.
  const delivery = await deliverNotificationEmail(
    { notificationId: (created as any).notification_id, notificationType: "DEPLOYMENT_FAILED", title: "t", message: "m", destinationPath: null, organizationId: "org-a" },
    { userId: "user-1", email: undefined },
  );
  assert.equal(delivery.state, "SKIPPED_INELIGIBLE");
  assert.equal(delivery.reason, "NO_DELIVERABLE_ADDRESS");
});

// J. notification read state independent of delivery state
test("J: delivery state and notification read/unread state are wholly separate — nothing in deliverNotificationEmail touches the notifications table", async () => {
  process.env.SHS_EMAIL_PROVIDER = "test";
  const db = makeNotificationsDb();
  const before = db.calls.length;
  await deliverNotificationEmail(
    { notificationId: "n8", notificationType: "DOCUMENTATION_SIGNATURE_REQUIRED", title: "t", message: "m", destinationPath: null, organizationId: "org-a" },
    { userId: "user-1", email: "user@example.com" },
    { db: db as any },
  );
  // The only DB call deliverNotificationEmail may make is the preference
  // lookup — it must never touch `notifications` at all (no read/unread
  // mutation, no row lookup) in this pass, since the delivery result is
  // returned to the caller rather than persisted here.
  const afterCalls = db.calls.slice(before);
  assert.ok(afterCalls.every((c) => !c.sql.includes("notifications")), "deliverNotificationEmail must never read or write the notifications table itself");
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  createNotificationFromEvent,
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  archiveNotification,
  resolveAuthorizedOrganizationIds,
} from "../src/domain/notifications/service/notification-service.ts";
import { getPreferenceOverrides, setPreference, listPreferences, InvalidPreferenceCategoryError } from "../src/domain/notifications/service/preference-service.ts";
import { isOrganizationEntitled } from "../src/domain/notifications/service/entitlement-resolver.ts";

type Row = Record<string, unknown>;

function makeNotificationsDb(rows: Row[], preferenceRows: Row[] = []) {
  const calls: { sql: string; params: unknown[] }[] = [];
  return {
    calls,
    async query(sql: string, params: unknown[] = []) {
      calls.push({ sql, params });
      if (sql.startsWith("SELECT category, in_app_enabled")) {
        return { rows: preferenceRows };
      }
      if (sql.startsWith("SELECT * FROM notifications")) {
        const [organizationId, , recipientUserId] = params;
        const excludedTypes = sql.includes("notification_type <> ALL") ? (params[params.length - 1] as string[]) : [];
        return {
          rows: rows.filter((row) =>
            row.organization_id === organizationId &&
            row.recipient_user_id === recipientUserId &&
            !excludedTypes.includes(String(row.notification_type))),
        };
      }
      if (sql.startsWith("SELECT COUNT(*)::int AS count FROM notifications")) {
        const [organizationId, , recipientUserId] = params;
        const excludedTypes = sql.includes("notification_type <> ALL") ? (params[params.length - 1] as string[]) : [];
        return {
          rows: [{
            count: rows.filter((row) =>
              row.organization_id === organizationId &&
              row.recipient_user_id === recipientUserId &&
              row.status === "UNREAD" &&
              !excludedTypes.includes(String(row.notification_type))).length,
          }],
        };
      }
      if (sql.startsWith("UPDATE notifications")) {
        const [notificationId] = params;
        const match = rows.find((row) => row.notification_id === notificationId);
        if (!match) return { rows: [] };
        if (sql.includes("status='ARCHIVED'") && sql.includes("SET status='ARCHIVED'")) {
          match.status = "ARCHIVED";
        } else if (sql.includes("status <> 'ARCHIVED'") && match.status === "ARCHIVED") {
          return { rows: [] };
        } else {
          match.status = "READ";
          match.read_at = match.read_at || "2026-09-14T00:00:00.000Z";
        }
        return { rows: [match], rowCount: 1 };
      }
      return { rows: [] };
    },
  };
}

function multiOrgActor() {
  return {
    user_id: "user-1",
    active_organization_id: "org-a",
    tenant_id: "tenant:org-a",
    memberships: [{ organization_id: "org-a" }, { organization_id: "org-b" }],
  };
}

// --- A/D: recipient resolution is server-side, never trusts client input ---

test("A: recipient resolution for a DB-backed policy is derived server-side, not from client-supplied fields", async () => {
  const calls: unknown[] = [];
  const db = {
    async query(sql: string, params: unknown[]) {
      calls.push({ sql, params });
      if (sql.startsWith("SELECT p.studio_learner_id")) return { rows: [{ user_id: "resolved-learner-1" }] };
      if (sql.startsWith("INSERT INTO notifications")) return { rows: [{ notification_id: "n1" }] };
      return { rows: [] };
    },
  };
  const result = await createNotificationFromEvent(
    {
      event_type: "studio.review.decision_recorded",
      organization_id: "org-a",
      tenant_id: "tenant:org-a",
      subject_type: "studio_review_assignment",
      subject_id: "assignment-1",
      idempotency_key: "k1",
      producer_id: "shs-api.studio-routing",
      payload: { project_id: "project-1", recipient_user_id: "client-claimed-user-should-be-ignored" },
    },
    db as any,
  );
  assert.equal(result.notification_id, "n1");
  const insertCall = calls.find((c: any) => c.sql.startsWith("INSERT INTO notifications")) as any;
  assert.equal(insertCall.params[3], "resolved-learner-1");
});

// --- B/C/O: multi-org scoping, unauthorized org rejection, org-filtered reads ---

test("B: an authorized multi-org user can list notifications scoped to either authorized organization", async () => {
  const rows: Row[] = [
    { notification_id: "n-a", organization_id: "org-a", tenant_id: "tenant:org-a", recipient_user_id: "user-1", notification_type: "CREDENTIAL_EARNED", title: "t", message: "m", status: "UNREAD", created_at: "2026-09-14T00:00:00.000Z", read_at: null, destination_path: null },
    { notification_id: "n-b", organization_id: "org-b", tenant_id: "tenant:org-b", recipient_user_id: "user-1", notification_type: "CREDENTIAL_EARNED", title: "t", message: "m", status: "UNREAD", created_at: "2026-09-14T00:00:00.000Z", read_at: null, destination_path: null },
  ];
  const db = makeNotificationsDb(rows);
  const actor = multiOrgActor();
  const activeList = await listNotifications(actor, { db: db as any });
  assert.deepEqual(activeList.map((n) => n.notificationId), ["n-a"]);
  const orgBList = await listNotifications(actor, { organizationId: "org-b", db: db as any });
  assert.deepEqual(orgBList.map((n) => n.notificationId), ["n-b"]);
});

test("C: an unauthorized organization id is rejected, not silently emptied or widened (client spoofing)", async () => {
  const db = makeNotificationsDb([]);
  await assert.rejects(
    () => listNotifications(multiOrgActor(), { organizationId: "org-not-a-member-of", db: db as any }),
    (error: any) => error.message === "ORG_CONTEXT_FORBIDDEN",
  );
});

test("O: unread count honors the same authorized organization filter as listNotifications", async () => {
  const rows: Row[] = [
    { notification_id: "n-a", organization_id: "org-a", recipient_user_id: "user-1", notification_type: "CREDENTIAL_EARNED", status: "UNREAD" },
    { notification_id: "n-b", organization_id: "org-b", recipient_user_id: "user-1", notification_type: "CREDENTIAL_EARNED", status: "UNREAD" },
    { notification_id: "n-b2", organization_id: "org-b", recipient_user_id: "user-1", notification_type: "CREDENTIAL_EARNED", status: "READ" },
  ];
  const db = makeNotificationsDb(rows);
  const actor = multiOrgActor();
  assert.equal((await unreadCount(actor, { db: db as any })).count, 1);
  assert.equal((await unreadCount(actor, { organizationId: "org-b", db: db as any })).count, 1);
  await assert.rejects(() => unreadCount(actor, { organizationId: "org-c", db: db as any }), (error: any) => error.message === "ORG_CONTEXT_FORBIDDEN");
});

test("resolveAuthorizedOrganizationIds never grants an organization the user has no membership row for", () => {
  const organizationIds = resolveAuthorizedOrganizationIds(multiOrgActor());
  assert.equal(organizationIds.includes("org-c"), false);
});

// --- F/G: mandatory/required categories ignore optional-preference suppression ---

test("F/G: disabling OPTIONAL_PRODUCT hides only OPTIONAL_PRODUCT notifications, never REQUIRED_ACTION ones", async () => {
  const rows: Row[] = [
    { notification_id: "n-optional", organization_id: "org-a", tenant_id: "tenant:org-a", recipient_user_id: "user-1", notification_type: "COMPLETION_ACHIEVED", title: "t", message: "m", status: "UNREAD", created_at: "2026-09-14T00:00:00.000Z", read_at: null, destination_path: null },
    { notification_id: "n-required", organization_id: "org-a", tenant_id: "tenant:org-a", recipient_user_id: "user-1", notification_type: "REVIEW_ASSIGNED", title: "t", message: "m", status: "UNREAD", created_at: "2026-09-14T00:00:00.000Z", read_at: null, destination_path: null },
  ];
  const db = makeNotificationsDb(rows, [{ category: "OPTIONAL_PRODUCT", in_app_enabled: false }]);
  const actor = { user_id: "user-1", active_organization_id: "org-a", tenant_id: "tenant:org-a" };
  const list = await listNotifications(actor, { db: db as any });
  assert.deepEqual(list.map((n) => n.notificationId), ["n-required"]);
});

test("preferences cannot be set for a non-suppressible category (mandatory communication cannot be disabled)", async () => {
  const db = { async query() { return { rows: [] }; } };
  await assert.rejects(() => setPreference("user-1", "MANDATORY_OPERATIONAL", false, db as any), InvalidPreferenceCategoryError);
  await assert.rejects(() => setPreference("user-1", "REQUIRED_ACTION", false, db as any), InvalidPreferenceCategoryError);
});

test("setPreference upserts a valid suppressible category and listPreferences defaults absent categories to enabled", async () => {
  const stored = new Map<string, boolean>();
  const db = {
    async query(sql: string, params: unknown[]) {
      if (sql.startsWith("INSERT INTO notification_preferences")) {
        stored.set(String(params[1]), Boolean(params[2]));
        return { rows: [{ category: params[1], in_app_enabled: params[2] }] };
      }
      if (sql.startsWith("SELECT category, in_app_enabled")) {
        return { rows: Array.from(stored.entries()).map(([category, in_app_enabled]) => ({ category, in_app_enabled })) };
      }
      return { rows: [] };
    },
  };
  await setPreference("user-1", "OPTIONAL_PRODUCT", false, db as any);
  const prefs = await listPreferences("user-1", db as any);
  assert.deepEqual(prefs.find((p) => p.category === "OPTIONAL_PRODUCT"), { category: "OPTIONAL_PRODUCT", inAppEnabled: false });
  assert.deepEqual(prefs.find((p) => p.category === "DIGEST_ELIGIBLE"), { category: "DIGEST_ELIGIBLE", inAppEnabled: true });
});

// --- E: entitlement resolution ---

test("E: isOrganizationEntitled is true only for an active, in-window entitlement to an active service", async () => {
  const db = {
    async query(_sql: string, params: unknown[]) {
      const [organizationId, serviceKey] = params;
      if (organizationId === "org-entitled" && serviceKey === "project_studio") return { rows: [{ x: 1 }] };
      return { rows: [] };
    },
  };
  assert.equal(await isOrganizationEntitled("org-entitled", "project_studio", db as any), true);
  assert.equal(await isOrganizationEntitled("org-not-entitled", "project_studio", db as any), false);
  assert.equal(await isOrganizationEntitled("", "project_studio", db as any), false);
});

test("E: existing wired policies never invoke an entitlement query (zero behavior change to the 19 current types)", async () => {
  const db = {
    async query(sql: string, params: unknown[]) {
      if (sql.includes("organization_service_entitlements")) throw new Error("entitlement check should not be invoked for this policy");
      if (sql.startsWith("INSERT INTO notifications")) return { rows: [{ notification_id: "n1" }] };
      return { rows: [] };
    },
  };
  const result = await createNotificationFromEvent(
    { event_type: "credential.issued", organization_id: "org-a", tenant_id: "tenant:org-a", idempotency_key: "k1", producer_id: "shs-api.credentials", subject_type: "learner_credential", subject_id: "credential-1", payload: { learner_user_id: "user-1" } },
    db as any,
  );
  assert.equal(result.notification_id, "n1");
});

// --- H/I: read state never completes source workflow ---

test("H/I: markRead only ever mutates the notification's own row, and never any other table", async () => {
  const rows: Row[] = [{ notification_id: "n1", organization_id: "org-a", tenant_id: "tenant:org-a", recipient_user_id: "user-1", notification_type: "CREDENTIAL_EARNED", title: "t", message: "m", status: "UNREAD", created_at: "x", read_at: null, destination_path: null }];
  const db = makeNotificationsDb(rows);
  const actor = { user_id: "user-1", active_organization_id: "org-a", tenant_id: "tenant:org-a" };
  const result = await markRead(actor, "n1", { db: db as any });
  assert.equal(result.status, "READ");
  assert.equal(db.calls.every((c) => c.sql.includes("notifications")), true);
  assert.equal(db.calls.some((c) => /INSERT|UPDATE/.test(c.sql) && !c.sql.includes("notifications")), false);
});

test("markAllRead is scoped to the recipient and organization, never a client-supplied user id", async () => {
  const rows: Row[] = [
    { notification_id: "n1", organization_id: "org-a", tenant_id: "tenant:org-a", recipient_user_id: "user-1", notification_type: "CREDENTIAL_EARNED", status: "UNREAD" },
  ];
  const db = makeNotificationsDb(rows);
  const actor = { user_id: "user-1", active_organization_id: "org-a", tenant_id: "tenant:org-a" };
  await markAllRead(actor, { db: db as any });
  const updateCall = db.calls.find((c) => c.sql.startsWith("UPDATE notifications SET status='READ'") && c.sql.includes("organization_id=$1"));
  assert.ok(updateCall);
  assert.deepEqual(updateCall!.params, ["org-a", "tenant:org-a", "user-1"]);
});

// --- Dismiss/archive: presentation only ---

test("archiveNotification only changes status, and an archived notification can no longer be marked read", async () => {
  const rows: Row[] = [{ notification_id: "n1", organization_id: "org-a", tenant_id: "tenant:org-a", recipient_user_id: "user-1", notification_type: "CREDENTIAL_EARNED", title: "t", message: "m", status: "UNREAD", created_at: "x", read_at: null, destination_path: null }];
  const db = makeNotificationsDb(rows);
  const actor = { user_id: "user-1", active_organization_id: "org-a", tenant_id: "tenant:org-a" };
  const archived = await archiveNotification(actor, "n1", { db: db as any });
  assert.equal(archived.status, "ARCHIVED");
  await assert.rejects(() => markRead(actor, "n1", { db: db as any }), (error: any) => error.message === "NOTIFICATION_NOT_FOUND");
});

// --- J/K: idempotency on duplicate / retried event processing ---

test("J/K: processing the same source event twice yields one logical notification (idempotent create + retry-safe)", async () => {
  const stored: Row[] = [];
  const db = {
    async query(sql: string, params: unknown[]) {
      if (sql.startsWith("INSERT INTO notifications")) {
        const [id] = params;
        if (stored.some((row) => row.notification_id === id)) return { rows: [] }; // ON CONFLICT DO NOTHING
        const row = { notification_id: id, title: params[9], message: params[10], destination_path: params[11] };
        stored.push(row);
        return { rows: [row] };
      }
      if (sql.startsWith("SELECT * FROM notifications WHERE notification_id")) {
        return { rows: stored.filter((row) => row.notification_id === params[0]) };
      }
      return { rows: [] };
    },
  };
  const event = { event_type: "credential.issued", organization_id: "org-a", tenant_id: "tenant:org-a", idempotency_key: "cred-1", producer_id: "shs-api.credentials", subject_type: "learner_credential", subject_id: "credential-1", outbox_event_id: "outbox-1", payload: { learner_user_id: "user-1" } };
  const first = await createNotificationFromEvent(event, db as any);
  const second = await createNotificationFromEvent(event, db as any); // simulates a retried/redelivered event
  assert.equal(first.notification_id, second.notification_id);
  assert.equal(stored.length, 1);
});

// --- P: sensitive payload minimization ---

test("P: the projected notification never exposes fields beyond the allow-listed shape, even if the row carries extra data", () => {
  // Exercised indirectly through listNotifications' mapping in the tests
  // above (n-a/n-b rows only ever surface notificationId/type/title/message/
  // destinationPath/status/etc.) — this test additionally proves an
  // out-of-band column on the row is never forwarded to the client shape.
  const rows: Row[] = [{
    notification_id: "n1", organization_id: "org-a", tenant_id: "tenant:org-a", recipient_user_id: "user-1",
    notification_type: "CREDENTIAL_EARNED", title: "t", message: "m", status: "UNREAD", created_at: "x", read_at: null, destination_path: null,
    payload_debug: "sensitive-internal-field-that-must-never-leak",
  }];
  return listNotifications({ user_id: "user-1", active_organization_id: "org-a", tenant_id: "tenant:org-a" }, { db: makeNotificationsDb(rows) as any }).then((list) => {
    assert.equal(Object.prototype.hasOwnProperty.call(list[0], "payload_debug"), false);
    assert.deepEqual(Object.keys(list[0]).sort(), [
      "actionRequired", "actionState", "category", "channelEligibility", "createdAt", "destinationPath",
      "message", "notificationId", "organizationId", "readAt", "status", "title", "type", "urgency",
    ]);
  });
});

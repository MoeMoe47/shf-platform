import test from "node:test";
import assert from "node:assert/strict";
import { createNotificationFromEvent } from "../src/domain/notifications/service/notification-service.js";

test("DGAL notification policy is bounded and idempotent", async () => {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const db = { query: async (sql: string, params: unknown[] = []) => { calls.push({ sql, params }); if (sql.startsWith("INSERT")) return { rows: [{ notification_id: "n1", title: params[9], message: params[10], destination_path: params[11] }] }; return { rows: [] }; } };
  const result = await createNotificationFromEvent({ event_type: "documentation.signature.requested", organization_id: "org-a", tenant_id: "tenant:org-a", originating_actor_id: "user-a", producer_id: "dgal", idempotency_key: "key-1", subject_type: "signature_request", subject_id: "sig-1", payload: { signer_user_id: "user-a", sensitive_document_text: "must not be copied" } }, db);
  assert.equal(result.notification_id, "n1");
  assert.equal(result.destination_path, "/documentation/items/signature%3Asig-1");
  assert.equal(result.message.includes("must not"), false);
  assert.equal(calls.length, 1);
});

test("DGAL notification policy uses item-scoped safe destinations for correction and expiry", async () => {
  const rows: any[] = [];
  const db = { query: async (sql: string, params: unknown[] = []) => {
    if (sql.startsWith("INSERT")) { const row = { notification_id: String(params[0]), destination_path: params[11], message: params[10] }; rows.push(row); return { rows: [row] }; }
    return { rows: rows.filter((row) => row.notification_id === params[0]) };
  } };
  const correction = await createNotificationFromEvent({ event_type: "documentation.requirement.correction_required", organization_id: "org-a", tenant_id: "tenant:org-a", originating_actor_id: "user-a", producer_id: "dgal", idempotency_key: "key-correction", subject_type: "document_instance", subject_id: "doc-1", payload: { protected_text: "do not include" } }, db);
  const expiry = await createNotificationFromEvent({ event_type: "documentation.signature.expired", organization_id: "org-a", tenant_id: "tenant:org-a", originating_actor_id: "user-a", producer_id: "dgal", idempotency_key: "key-expiry", subject_type: "signature_request", subject_id: "sig-1", payload: { protected_text: "do not include" } }, db);
  assert.equal(correction.destination_path, "/documentation/items/document%3Adoc-1");
  assert.equal(expiry.destination_path, "/documentation/items/signature%3Asig-1");
  assert.equal(rows.some((row) => row.message.includes("do not include")), false);
});

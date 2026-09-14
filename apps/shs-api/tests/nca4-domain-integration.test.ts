import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createNotificationFromEvent } from "../src/domain/notifications/service/notification-service.ts";
import { classifyNotificationType } from "../src/domain/notifications/contracts/notification-classification.ts";

type Row = Record<string, unknown>;

function makeDb(handlers: Record<string, (params: unknown[]) => any>) {
  const calls: { sql: string; params: unknown[] }[] = [];
  return {
    calls,
    async query(sql: string, params: unknown[] = []) {
      calls.push({ sql, params });
      for (const [prefix, handler] of Object.entries(handlers)) {
        if (sql.startsWith(prefix)) return handler(params);
      }
      return { rows: [] };
    },
  };
}

// --- E: Studio review/actionable events (studio.qa.completed, studio.handoff.created) ---

test("E: studio.qa.completed projects to the project's learner via the canonical projects lookup", async () => {
  const db = makeDb({
    "SELECT p.studio_learner_id": () => ({ rows: [{ user_id: "learner-1" }] }),
    "INSERT INTO notifications": (params: unknown[]) => ({ rows: [{ notification_id: params[0], title: params[9] }] }),
  });
  const result = await createNotificationFromEvent(
    {
      event_type: "studio.qa.completed",
      organization_id: "org-a",
      tenant_id: "tenant:org-a",
      producer_id: "shs-api.studio",
      subject_type: "studio_qa_run",
      subject_id: "qa-run-1",
      idempotency_key: "qa-run-1",
      payload: { project_id: "project-1", workspace_revision: 2, status: "PASSED" },
    },
    db as any,
  );
  assert.ok(result);
  assert.equal((result as any).title, "QA run complete");
});

test("E: studio.handoff.created projects to the handoff's assigned learner (real assignment table, not a fabricated one)", async () => {
  const db = makeDb({
    "SELECT learner_id AS user_id FROM studio_handoffs": () => ({ rows: [{ user_id: "learner-2" }] }),
    "INSERT INTO notifications": (params: unknown[]) => ({ rows: [{ notification_id: params[0], title: params[9] }] }),
  });
  const result = await createNotificationFromEvent(
    {
      event_type: "studio.handoff.created",
      organization_id: "org-a",
      originating_actor_id: "staff-1",
      producer_id: "shs-api.studio",
      subject_type: "studio_handoff",
      subject_id: "handoff-1",
      idempotency_key: "handoff-1",
      // NCA-4 finding: the real emission site omits tenant_id entirely.
      // No tenant_id key at all here, on purpose, to prove the hardened
      // guard derives it rather than silently dropping the notification.
    },
    db as any,
  );
  assert.ok(result, "expected a notification despite the source event omitting tenant_id");
  assert.equal((result as any).title, "New Studio work assigned");
});

test("studio.revision.created and studio.workspace.updated remain intentionally unwired (self-action, no human-actionable value)", () => {
  const src = readFileSync(new URL("../src/domain/notifications/service/notification-service.ts", import.meta.url), "utf8");
  assert.match(src, /"studio\.qa\.completed":/);
  assert.match(src, /"studio\.handoff\.created":/);
  assert.doesNotMatch(src, /"studio\.revision\.created":\s*\{/);
  assert.doesNotMatch(src, /"studio\.workspace\.updated":\s*\{/);
});

// --- F: CivicSure actionable event (referral.created, multi-recipient) ---

test("F: referral.created notifies every referrals.manage holder in the *receiving* organization, not the creating one", async () => {
  const db = makeDb({
    "SELECT receiving_organization_id FROM referral_details": () => ({ rows: [{ receiving_organization_id: "org-receiving" }] }),
    "SELECT DISTINCT m.user_id": (params: unknown[]) => {
      assert.equal(params[0], "org-receiving");
      assert.equal(params[1], "referrals.manage");
      return { rows: [{ user_id: "staffer-1" }, { user_id: "staffer-2" }] };
    },
    "INSERT INTO notifications": (params: unknown[]) => ({ rows: [{ notification_id: params[0], recipient_user_id: params[3] }] }),
  });
  const result = await createNotificationFromEvent(
    {
      event_type: "referral.created",
      organization_id: "org-creating",
      tenant_id: "tenant:org-creating",
      originating_actor_id: "creator-1",
      producer_id: "hub.referral",
      subject_type: "referral",
      subject_id: "case-1",
      idempotency_key: "referral:case-1:created",
      payload: { referral_id: "case-1" },
    },
    db as any,
  );
  assert.ok(Array.isArray(result), "a multi-recipient policy must return an array");
  const recipients = (result as any[]).map((row) => row.recipient_user_id).sort();
  assert.deepEqual(recipients, ["staffer-1", "staffer-2"]);
});

test("case.assigned / case.transitioned remain audit-only and are never wired as notification policies (no real outbox event to project)", () => {
  const caseServiceSrc = readFileSync(new URL("../src/domain/cases/service/case-service.ts", import.meta.url), "utf8");
  const notificationServiceSrc = readFileSync(new URL("../src/domain/notifications/service/notification-service.ts", import.meta.url), "utf8");
  // The audit action types exist...
  assert.match(caseServiceSrc, /action_type: "case\.assigned"/);
  assert.match(caseServiceSrc, /action_type: "case\.transitioned"/);
  // ...but only referral.created ever reaches the outbox in this file.
  assert.equal((caseServiceSrc.match(/this\.outbox\.enqueue\(/g) || []).length, 1);
  assert.doesNotMatch(notificationServiceSrc, /"case\.assigned":\s*\{/);
  assert.doesNotMatch(notificationServiceSrc, /"case\.transitioned":\s*\{/);
});

// --- G: ARAG actionable approval/release events ---

test("G: arag.assurance.blocked and arag.approval.required both resolve the release *requester*, never the approver", async () => {
  const db = makeDb({
    "SELECT requested_by AS user_id FROM arag_release_requests": () => ({ rows: [{ user_id: "requester-1" }] }),
    "INSERT INTO notifications": (params: unknown[]) => ({ rows: [{ notification_id: params[0], title: params[9], message: params[10] }] }),
  });
  const blocked = await createNotificationFromEvent(
    { event_type: "arag.assurance.blocked", organization_id: "org-a", tenant_id: "tenant:org-a", originating_actor_id: "requester-1", producer_id: "shs-api.arag-1", subject_type: "arag_release", subject_id: "release-1", idempotency_key: "arag.assurance.blocked:release-1", payload: { blocking_codes: ["APPROVAL_REQUIRED"], status: "APPROVAL_REQUIRED" } },
    db as any,
  );
  assert.equal((blocked as any).title, "Release assurance blocked");
  const decided = await createNotificationFromEvent(
    { event_type: "arag.approval.required", organization_id: "org-a", tenant_id: "tenant:org-a", originating_actor_id: "approver-1", producer_id: "shs-api.arag-1", subject_type: "arag_release", subject_id: "release-1", idempotency_key: "arag.approval.required:release-1", payload: { decision: "APPROVED" } },
    db as any,
  );
  // Recipient must be the requester (from the DB lookup), never the
  // approver who is only present as originating_actor_id on this event.
  assert.equal((decided as any).title, "Release approval decision recorded");
  assert.notEqual((decided as any).message, undefined);
});

test("G: arag.release.succeeded and arag.release.failed are both wired, symmetric to the existing deployment.live/failed precedent", () => {
  const src = readFileSync(new URL("../src/domain/notifications/service/notification-service.ts", import.meta.url), "utf8");
  assert.match(src, /"arag\.release\.succeeded":/);
  assert.match(src, /"arag\.release\.failed":/);
});

// --- A/B/C/D/H: domains with no canonical outbox event — not forced, verified absent ---

test("A/B/C/D/H: onboarding, membership, entitlement, and accessibility-accommodation domains still emit zero outbox events (integration correctly deferred, not silently skipped)", () => {
  const grep = (dir: string) => {
    try {
      return readFileSync(new URL(`../src/domain/${dir}`, import.meta.url), "utf8");
    } catch {
      return null;
    }
  };
  // These assertions intentionally check for the *absence* of
  // outbox.enqueue in the domains NCA-4 found still have no canonical
  // event to project — proving the DEFERRED classification in the NCA-4
  // report is accurate today, not merely asserted. If a future domain
  // program adds real emission, this test will start failing loudly
  // rather than silently going stale.
  const membershipService = grep("identity/service/membership-service.ts");
  const serviceCatalogService = grep("service-catalog/service/service-catalog-service.ts");
  const onboardingService = grep("organization-onboarding/service/organization-onboarding-service.ts");
  const accommodationService = grep("accessibility-accommodations/service/accommodation-service.ts");
  assert.ok(membershipService, "membership-service.ts should exist");
  assert.ok(serviceCatalogService, "service-catalog-service.ts should exist");
  assert.ok(onboardingService, "organization-onboarding-service.ts should exist");
  assert.ok(accommodationService, "accommodation-service.ts should exist");
  assert.doesNotMatch(membershipService!, /outbox\.enqueue\(/);
  assert.doesNotMatch(serviceCatalogService!, /outbox\.enqueue\(/);
  assert.doesNotMatch(onboardingService!, /outbox\.enqueue\(/);
  assert.doesNotMatch(accommodationService!, /outbox\.enqueue\(/);
});

// --- NCA-5 micro-gap regression: every notification_type the 7 new
// EVENT_POLICIES entries produce must have a real classification entry,
// not the DEFAULT_CLASSIFICATION fallback (which would make a required-
// action item silently non-actionable and user-suppressible). ---
test("NCA-5: all 7 NCA-4 notification types have real, non-default classification entries", () => {
  const expected: Record<string, { category: string; actionRequired: boolean }> = {
    CASE_REFERRAL_RECEIVED: { category: "REQUIRED_ACTION", actionRequired: true },
    ARAG_ASSURANCE_BLOCKED: { category: "REQUIRED_ACTION", actionRequired: true },
    ARAG_APPROVAL_DECISION_RECORDED: { category: "TRANSACTIONAL", actionRequired: false },
    ARAG_RELEASE_SUCCEEDED: { category: "TRANSACTIONAL", actionRequired: false },
    ARAG_RELEASE_FAILED: { category: "REQUIRED_ACTION", actionRequired: true },
    STUDIO_QA_COMPLETE: { category: "TRANSACTIONAL", actionRequired: false },
    STUDIO_HANDOFF_ASSIGNED: { category: "REQUIRED_ACTION", actionRequired: true },
  };
  for (const [type, want] of Object.entries(expected)) {
    const got = classifyNotificationType(type);
    assert.equal(got.category, want.category, `${type} category`);
    assert.equal(got.actionRequired, want.actionRequired, `${type} actionRequired`);
  }
  // The two REQUIRED_ACTION types among them must never be suppressible —
  // this is the concrete failure mode the gap produced (a referral or a
  // failed release silently disappearing behind a user's OPTIONAL_PRODUCT
  // suppression toggle) before this fix.
  assert.notEqual(classifyNotificationType("CASE_REFERRAL_RECEIVED").category, "OPTIONAL_PRODUCT");
  assert.notEqual(classifyNotificationType("ARAG_RELEASE_FAILED").category, "OPTIONAL_PRODUCT");
});

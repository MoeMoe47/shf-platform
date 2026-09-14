// NCA-3 focused tests for the canonical in-app notification UI's pure
// logic modules — no React/jsdom dependency needed (this repo has no
// frontend component-test framework; browser acceptance for rendering,
// filters, and mutation flows is documented in
// docs/architecture/NCA-3_IN_APP_INBOX_ATTENTION_PROJECTION.md §32).
// Run with: node --test tests/nca3NotificationUi.test.mjs (or `npm run nca3:ui:test`)
import test from "node:test";
import assert from "node:assert/strict";
import { domainLabelForType, urgencyLabel } from "../src/components/shared/notifications/domainLabels.js";
import { isSafeInternalPath } from "../src/components/shared/notifications/safeLinks.js";
import { messageForError } from "../src/components/shared/notifications/errorMessages.js";
import { filterItemsForView } from "../src/components/shared/notifications/filterItems.js";

test("M: domainLabelForType names every real notification_type's domain without exposing the raw internal type", () => {
  assert.equal(domainLabelForType("REVIEW_ASSIGNED"), "Studio");
  assert.equal(domainLabelForType("REVIEW_DECISION"), "Studio");
  assert.equal(domainLabelForType("CREDENTIAL_EARNED"), "Credentials");
  assert.equal(domainLabelForType("CREDENTIAL_REVOKED"), "Credentials");
  assert.equal(domainLabelForType("DEPLOYMENT_LIVE"), "Studio");
  assert.equal(domainLabelForType("DEPLOYMENT_FAILED"), "Studio");
  assert.equal(domainLabelForType("REGISTRY_ACCEPTED"), "Agent Registry");
  assert.equal(domainLabelForType("COMPLETION_ACHIEVED"), "Curriculum");
  assert.equal(domainLabelForType("DOCUMENTATION_SIGNATURE_REQUIRED"), "Documents");
});

test("domainLabelForType falls back to a conservative label for an unclassified type, never fabricating a domain", () => {
  assert.equal(domainLabelForType("SOME_FUTURE_TYPE"), "Platform");
});

test("urgencyLabel maps every real urgency value to a non-color-only text label", () => {
  assert.equal(urgencyLabel("info"), "Informational");
  assert.equal(urgencyLabel("notice"), "Notice");
  assert.equal(urgencyLabel("warning"), "Needs attention");
  assert.equal(urgencyLabel("critical"), "Urgent");
});

test("M (Security §28): isSafeInternalPath only allows same-origin relative paths, rejecting protocol-relative and external/script-like values", () => {
  assert.equal(isSafeInternalPath("/studio/reviewer-queue"), true);
  assert.equal(isSafeInternalPath("/curriculum/asl/portfolio"), true);
  assert.equal(isSafeInternalPath("//evil.example.com/phish"), false);
  assert.equal(isSafeInternalPath("javascript:alert(1)"), false);
  assert.equal(isSafeInternalPath("https://evil.example.com"), false);
  assert.equal(isSafeInternalPath(""), false);
  assert.equal(isSafeInternalPath(null), false);
  assert.equal(isSafeInternalPath(undefined), false);
});

test("R (Error State §19): ORG_CONTEXT_REQUIRED gets an honest, specific message instead of a generic outage message", () => {
  assert.equal(messageForError({ code: "ORG_CONTEXT_REQUIRED" }, "Notifications are temporarily unavailable."), "Select an organization to view notifications.");
  assert.equal(messageForError({ code: "SOMETHING_ELSE" }, "Notifications are temporarily unavailable."), "Notifications are temporarily unavailable.");
  assert.equal(messageForError(undefined, "Notifications are temporarily unavailable."), "Notifications are temporarily unavailable.");
});

// NCA-5 micro-gap regression: live browser testing found the "Unread"
// filter tab silently showing every notification, including read ones —
// useNotificationInbox fetched the identical list for ALL and UNREAD and
// nothing ever narrowed it down. filterItemsForView is the fix.
test("NCA-5: filterItemsForView narrows to only UNREAD items when the unread filter is active, and is a no-op otherwise", () => {
  const items = [
    { notificationId: "1", status: "UNREAD" },
    { notificationId: "2", status: "READ" },
    { notificationId: "3", status: "ARCHIVED" },
    { notificationId: "4", status: "UNREAD" },
  ];
  assert.deepEqual(filterItemsForView(items, "unread").map((i) => i.notificationId), ["1", "4"]);
  assert.deepEqual(filterItemsForView(items, "all"), items);
  assert.deepEqual(filterItemsForView(items, "action_required"), items);
});

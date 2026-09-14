// NCA-4 — the canonical delivery orchestration layer.
//
// Pipeline this file implements (NCA-4 §2's governing shape, email leg
// only — SMS/push have no real infrastructure, see notification-mail-adapter.ts
// and the NCA-4 report §12/§13 for why those stay EXTERNAL_DEPENDENCY /
// LATER_PHASE rather than fake adapters):
//
//   canonical notification (already durably persisted, in-app)
//     -> category eligibility (only MANDATORY_OPERATIONAL / REQUIRED_ACTION
//        may ever leave the app, per NCA-1 §39's channel-selection policy)
//     -> preference evaluation (NCA-2 canonical preferences; a no-op today
//        because email-eligible categories are never in the suppressible
//        set — see NCA_OWNER_DECISION_LOCK.md §7 — checked anyway so a
//        future category never has to remember to add this check)
//     -> bounded template rendering (structured variables only, never raw
//        source-domain content — NCA-4 §25)
//     -> safe action link validation (NCA-4 §26)
//     -> provider-neutral send with bounded retry (NCA-4 §21/§22)
//     -> structured DeliveryResult (never conflated with the notification's
//        own read/unread state, and never able to mutate it — NCA-4 §17/§20)
//
// IMPORTANT — NOT wired into createNotificationFromEvent's write path.
// That function runs inside the *source domain's own* database
// transaction (e.g. credential-service.ts's withTransaction). Calling an
// external HTTP provider from inside that transaction would hold the
// source workflow's own commit open for the duration of a network call
// (and any retries), which is a materially worse version of exactly the
// coupling NCA-1's P0 fix eliminated for the in-app write. Making it async
// instead would require new durable job/queue infrastructure, which this
// phase's migration rule (see the NCA-4 report §19/§36) explicitly does
// not introduce casually. This function is therefore a complete, tested,
// standalone capability — real, not fabricated — ready for a future phase
// to invoke asynchronously (e.g. from a worker in the same lease/claim
// shape trusted-reporting's dispatcher already uses) once a real product
// decision activates general transactional email. See the NCA-4 report's
// Owner Decision note for this explicitly.
import { classifyNotificationType } from "../contracts/notification-classification.js";
import { isSuppressibleCategory } from "../contracts/notification-classification.js";
import { isSafeInternalPath } from "../contracts/safe-links.js";
import { getPreferenceOverrides } from "./preference-service.js";
import { getNotificationMailProvider, classifyMailFailure, type NotificationMailProvider } from "./notification-mail-adapter.js";

type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

// NCA-1 §39's channel-selection policy, reused verbatim: email may only be
// considered for these two categories. Every other category (TRANSACTIONAL,
// OPTIONAL_PRODUCT, DIGEST_ELIGIBLE) remains IN_APP only.
const EMAIL_ELIGIBLE_CATEGORIES = new Set(["MANDATORY_OPERATIONAL", "REQUIRED_ACTION"]);

const MAX_SEND_ATTEMPTS = 3;

export type DeliveryState = "SENT" | "FAILED" | "SUPPRESSED" | "NOT_CONFIGURED" | "SKIPPED_INELIGIBLE";

export interface DeliveryResult {
  state: DeliveryState;
  channel: "EMAIL";
  attempts: number;
  provider?: string;
  providerMessageReference?: string;
  reason?: string;
}

export interface DeliverableNotification {
  notificationId: string;
  notificationType: string;
  /** Generic, already minimum-necessary per existing policy convention (NCA-0 §44) — never raw source payload. */
  title: string;
  message: string;
  destinationPath: string | null;
  organizationId: string;
}

// NCA-4 §25 (Template Boundary): the only place notification content is
// turned into an email body. Takes exactly the structured fields the
// canonical notification already exposes — never arbitrary source-domain
// HTML, never a caller-supplied string. Plain text only (no HTML
// interpolation of any kind), so there is no script-injection surface to
// protect against in the first place.
export function renderNotificationEmail(notification: DeliverableNotification) {
  const safePath = isSafeInternalPath(notification.destinationPath) ? notification.destinationPath : null;
  const lines = [notification.message];
  if (safePath) lines.push(`Open: ${safePath}`);
  return {
    subject: notification.title,
    bodyText: lines.join("\n\n"),
    actionUrl: safePath || undefined,
  };
}

async function isCategorySuppressedForUser(recipientUserId: string, category: string, db: Executor): Promise<boolean> {
  if (!isSuppressibleCategory(category as any)) return false; // Mandatory/required-action categories can never be suppressed — checked structurally, not just by convention.
  const overrides = await getPreferenceOverrides(recipientUserId, db);
  return overrides.get(category as any) === false;
}

// Exported for direct testing of the bounded-retry bound itself (see
// tests/nca4-delivery-channels.test.ts "E") — not part of the module's
// conceptual public API surface otherwise; deliverNotificationEmail is.
export async function sendWithBoundedRetry(provider: NotificationMailProvider, message: Parameters<NotificationMailProvider["send"]>[0]): Promise<{ result: Awaited<ReturnType<NotificationMailProvider["send"]>>; attempts: number }> {
  let attempts = 0;
  let last: Awaited<ReturnType<NotificationMailProvider["send"]>> = { delivered: false, provider: "unknown", reason: "NOT_ATTEMPTED" };
  while (attempts < MAX_SEND_ATTEMPTS) {
    attempts += 1;
    last = await provider.send(message);
    if (last.delivered) return { result: last, attempts };
    if (classifyMailFailure(last.reason) !== "TRANSIENT") return { result: last, attempts }; // permanent/not-configured — never retried.
  }
  return { result: last, attempts }; // bounded: exactly MAX_SEND_ATTEMPTS, never infinite.
}

// NCA-4 §21 (Idempotency): the caller is responsible for only invoking
// this once per *freshly created* notification (never on a replayed/retried
// source event) — createNotificationFromEvent already exposes this signal
// for free: a duplicate event hits the notifications table's own unique
// constraint and never returns a "freshly inserted" row. This function
// additionally uses the notification's own id as the provider-facing
// idempotent send key (NotificationMailMessage.notificationId), so even a
// caller that (incorrectly) invoked it twice for the same notification
// produces a provider request an idempotency-aware provider can
// deduplicate on its own side — this repository does not have such a
// provider configured today (TestNotificationMailProvider always
// "delivers"; GenericHttpNotificationMailProvider passes the field through
// but does not itself dedupe), which is disclosed honestly in the NCA-4
// report rather than assumed.
export async function deliverNotificationEmail(
  notification: DeliverableNotification,
  recipient: { userId: string; email: string | null | undefined },
  options: { db?: Executor } = {},
): Promise<DeliveryResult> {
  const classification = classifyNotificationType(notification.notificationType);
  if (!EMAIL_ELIGIBLE_CATEGORIES.has(classification.category)) {
    return { state: "SKIPPED_INELIGIBLE", channel: "EMAIL", attempts: 0, reason: "CATEGORY_NOT_EMAIL_ELIGIBLE" };
  }
  if (options.db) {
    const suppressed = await isCategorySuppressedForUser(recipient.userId, classification.category, options.db);
    if (suppressed) return { state: "SUPPRESSED", channel: "EMAIL", attempts: 0, reason: "PREFERENCE_SUPPRESSED" };
  }
  if (!recipient.email) {
    return { state: "SKIPPED_INELIGIBLE", channel: "EMAIL", attempts: 0, reason: "NO_DELIVERABLE_ADDRESS" };
  }
  const rendered = renderNotificationEmail(notification);
  const provider = getNotificationMailProvider();
  const { result, attempts } = await sendWithBoundedRetry(provider, {
    to: recipient.email,
    subject: rendered.subject,
    templateKey: notification.notificationType,
    notificationId: notification.notificationId,
    bodyText: rendered.bodyText,
    actionUrl: rendered.actionUrl,
  });
  if (result.delivered) {
    return { state: "SENT", channel: "EMAIL", attempts, provider: result.provider, providerMessageReference: result.providerMessageReference };
  }
  const failureClass = classifyMailFailure(result.reason);
  return {
    state: failureClass === "NOT_CONFIGURED" ? "NOT_CONFIGURED" : "FAILED",
    channel: "EMAIL",
    attempts,
    provider: result.provider,
    reason: result.reason,
  };
}

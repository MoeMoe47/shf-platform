import { appendTruthSpineEvent, EVENT_TYPES } from "./truthSpineEvents.js";
import { createBaseTruthSpineRecord, patchTruthSpineRecord, upsertTruthSpineRecord } from "./truthSpineStore.js";
import { SOURCE_SYSTEMS, TRUTH_ENTITY_TYPES } from "./truthSpineTypes.js";

function slug(value, fallback = "item") {
  return String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export function referralToTruthSpineRecord(referral = {}, sourceSurface = "hub") {
  const idBase = referral.id || referral.referralId || `${referral.sender || "hub"}_${referral.receiver || "partner"}_${referral.needCategory || "need"}`;

  return createBaseTruthSpineRecord({
    entityId: referral.entityId || referral.referralId || `hub_referral_${slug(idBase)}`,
    entityType: TRUTH_ENTITY_TYPES.REFERRAL,
    sourceSystem: SOURCE_SYSTEMS.HUB,
    sourceSurface,
    currentStatus: referral.status || referral.currentStatus || "open",
    title: referral.title || referral.needCategory || "Hub referral",
    summary: referral.notes || referral.summary || "",
    partnerId: referral.receiverId || referral.partnerId || slug(referral.receiver || "partner"),
    organizationId: referral.organizationId || "shf-core",
    raw: referral,
  });
}

export function seedHubReferralsIntoTruthSpine(referrals = [], sourceSurface = "hub") {
  return referrals.map((referral) => upsertTruthSpineRecord(referralToTruthSpineRecord(referral, sourceSurface)));
}

export function recordHubReferralAction(referral = {}, action = "review", options = {}) {
  const baseRecord = referralToTruthSpineRecord(referral, options.sourceSurface || "partner_action_queue_v2");

  const actionKey = slug(action, "action");
  const statusByAction = {
    assign: "assigned",
    assigned: "assigned",
    review: "in_review",
    "start review": "in_review",
    hold: "on_hold",
    resolve: "resolved",
    resolved: "resolved",
    close: "closed",
    closed: "closed",
    escalate: "escalated",
  };

  const nextStatus = statusByAction[actionKey] || statusByAction[String(action).toLowerCase()] || baseRecord.currentStatus;

  const eventTypeByStatus = {
    assigned: EVENT_TYPES.HUB_REFERRAL_ASSIGNED,
    in_review: EVENT_TYPES.HUB_REFERRAL_REVIEW_STARTED,
    on_hold: EVENT_TYPES.HUB_REFERRAL_HOLD_ADDED,
    resolved: EVENT_TYPES.HUB_REFERRAL_RESOLVED,
    closed: EVENT_TYPES.HUB_REFERRAL_CLOSED,
    escalated: EVENT_TYPES.HUB_REFERRAL_ESCALATED,
  };

  const patched = patchTruthSpineRecord(baseRecord.entityId, {
    ...baseRecord,
    currentStatus: nextStatus,
    sourceSurface: options.sourceSurface || "partner_action_queue_v2",
    raw: {
      ...(baseRecord.raw || {}),
      lastAction: action,
    },
  });

  const event = appendTruthSpineEvent({
    eventType: eventTypeByStatus[nextStatus] || EVENT_TYPES.HUB_REFERRAL_REVIEW_STARTED,
    entityId: patched.entityId,
    entityType: patched.entityType,
    sourceSurface: options.sourceSurface || "partner_action_queue_v2",
    traceId: patched.trustEnvelope.traceId,
    actorId: options.actorId || "demo-user-1",
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || patched.organizationId || "shf-core",
    payload: {
      action,
      nextStatus,
      referral,
    },
  });

  return { record: patched, event };
}

const FEEDBACK_EVENT_STORAGE_KEY = "shs_adaptive_feedback_events_v1";

function normalize(value, fallback = "unknown") {
  return String(value || fallback).toLowerCase().trim().replace(/[-\s]+/g, "_");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, number(value)));
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix = "feedback_event") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

export const SHS_FEEDBACK_EVENT_TYPES = Object.freeze({
  RECOMMENDATION_ACCEPTED: "recommendation.accepted",
  RECOMMENDATION_REJECTED: "recommendation.rejected",
  RECOMMENDATION_IGNORED: "recommendation.ignored",
  DECISION_APPROVED: "decision.approved",
  DECISION_REVERSED: "decision.reversed",
  FUNDING_DECISION_ACCEPTED: "funding_decision.accepted",
  FUNDING_DECISION_REVIEWED: "funding_decision.reviewed",
  REFERRAL_COMPLETED: "referral.completed",
  PARTNER_RESPONDED: "partner.responded",
  EVIDENCE_STRENGTHENED: "evidence.strengthened",
  OUTCOME_VERIFIED_LATER: "outcome.verified_later",
  OPERATOR_FEEDBACK: "operator.feedback",
});

export function buildFeedbackEvent({
  eventId,
  eventType = SHS_FEEDBACK_EVENT_TYPES.OPERATOR_FEEDBACK,
  source = "adaptive_feedback_loop",
  entityId = "unknown_entity",
  entityType = "unknown",
  recommendationId = null,
  recommendationLabel = null,
  decisionId = null,
  decisionLabel = null,
  originalConfidence = 0,
  outcome = "unknown",
  outcomeStatus = "pending",
  operatorRating = null,
  notes = "",
  actor = "system",
  metadata = {},
  createdAt,
} = {}) {
  const normalizedOutcome = normalize(outcome);
  const normalizedStatus = normalize(outcomeStatus, "pending");

  return {
    eventId: eventId || makeId(),
    eventType,
    source,
    entityId,
    entityType,
    recommendationId,
    recommendationLabel,
    decisionId,
    decisionLabel,
    originalConfidence: clamp(originalConfidence),
    outcome: normalizedOutcome,
    outcomeStatus: normalizedStatus,
    operatorRating: operatorRating === null || operatorRating === undefined ? null : clamp(operatorRating, 1, 5),
    notes,
    actor,
    metadata,
    createdAt: createdAt || nowIso(),
  };
}

export function scoreFeedbackEvent(event = {}) {
  const type = normalize(event.eventType);
  const outcome = normalize(event.outcome);
  const status = normalize(event.outcomeStatus);
  const rating = event.operatorRating === null || event.operatorRating === undefined ? null : number(event.operatorRating);

  let score = 50;

  if (type.includes("accepted") || type.includes("approved") || type.includes("completed")) score += 22;
  if (type.includes("rejected") || type.includes("reversed")) score -= 22;
  if (type.includes("ignored")) score -= 10;
  if (type.includes("verified") || type.includes("strengthened")) score += 18;

  if (outcome === "successful" || outcome === "positive" || outcome === "verified") score += 18;
  if (outcome === "failed" || outcome === "negative" || outcome === "blocked") score -= 18;
  if (outcome === "mixed" || outcome === "partial") score -= 3;

  if (status === "complete" || status === "verified" || status === "resolved") score += 10;
  if (status === "pending" || status === "in_review") score -= 3;
  if (status === "failed" || status === "blocked" || status === "disputed") score -= 15;

  if (rating !== null) {
    score += (rating - 3) * 8;
  }

  return clamp(Math.round(score));
}

export function buildAdaptiveFeedbackModel({
  events = [],
  source = "adaptive_feedback_loop",
} = {}) {
  const items = safeArray(events).map((event) => ({
    ...event,
    feedbackScore: scoreFeedbackEvent(event),
  }));

  const accepted = items.filter((event) => normalize(event.eventType).includes("accepted") || normalize(event.eventType).includes("approved"));
  const rejected = items.filter((event) => normalize(event.eventType).includes("rejected") || normalize(event.eventType).includes("reversed"));
  const completed = items.filter((event) => normalize(event.outcomeStatus) === "complete" || normalize(event.outcomeStatus) === "verified" || normalize(event.outcomeStatus) === "resolved");
  const blocked = items.filter((event) => normalize(event.outcomeStatus) === "blocked" || normalize(event.outcomeStatus) === "failed" || normalize(event.outcome) === "failed");

  const averageFeedbackScore = items.length
    ? Math.round(items.reduce((sum, event) => sum + event.feedbackScore, 0) / items.length)
    : 0;

  const acceptanceRate = items.length ? Math.round((accepted.length / items.length) * 100) : 0;
  const completionRate = items.length ? Math.round((completed.length / items.length) * 100) : 0;
  const reversalRate = items.length ? Math.round((rejected.length / items.length) * 100) : 0;
  const blockedRate = items.length ? Math.round((blocked.length / items.length) * 100) : 0;

  let learningStatus = "ready";
  let learningLabel = "Feedback Loop Ready";
  let recommendedNextAction = "Use feedback events to improve future SHS recommendations.";

  if (!items.length) {
    learningStatus = "not_started";
    learningLabel = "No Feedback Events";
    recommendedNextAction = "Capture recommendation, decision, referral, evidence, or outcome feedback events.";
  } else if (blockedRate >= 30 || reversalRate >= 30) {
    learningStatus = "review";
    learningLabel = "Learning Review Needed";
    recommendedNextAction = "Review failed, blocked, or reversed decisions before adjusting future recommendation logic.";
  } else if (averageFeedbackScore >= 75 && completionRate >= 60) {
    learningStatus = "strong";
    learningLabel = "Positive Learning Signal";
    recommendedNextAction = "Promote patterns connected to high-scoring completed events.";
  }

  return {
    source,
    learningStatus,
    learningLabel,
    recommendedNextAction,
    metrics: {
      totalEvents: items.length,
      acceptedEvents: accepted.length,
      rejectedEvents: rejected.length,
      completedEvents: completed.length,
      blockedEvents: blocked.length,
      acceptanceRate,
      completionRate,
      reversalRate,
      blockedRate,
      averageFeedbackScore,
    },
    events: items,
    learningSignals: items
      .slice()
      .sort((a, b) => b.feedbackScore - a.feedbackScore)
      .slice(0, 10)
      .map((event) => ({
        eventId: event.eventId,
        eventType: event.eventType,
        entityId: event.entityId,
        recommendationLabel: event.recommendationLabel,
        decisionLabel: event.decisionLabel,
        outcome: event.outcome,
        outcomeStatus: event.outcomeStatus,
        feedbackScore: event.feedbackScore,
      })),
  };
}

export function feedbackLearningStatusClass(status) {
  const normalized = normalize(status);
  if (normalized === "strong") return "adaptive-feedback--strong";
  if (normalized === "ready") return "adaptive-feedback--ready";
  if (normalized === "review") return "adaptive-feedback--review";
  if (normalized === "not_started") return "adaptive-feedback--pending";
  return "adaptive-feedback--pending";
}

export function buildFeedbackSummaryRows(model) {
  if (!model) return [];

  return [
    ["Feedback Events", model.metrics.totalEvents],
    ["Accepted", model.metrics.acceptedEvents],
    ["Completed", model.metrics.completedEvents],
    ["Blocked", model.metrics.blockedEvents],
    ["Acceptance Rate", `${model.metrics.acceptanceRate}%`],
    ["Completion Rate", `${model.metrics.completionRate}%`],
    ["Reversal Rate", `${model.metrics.reversalRate}%`],
    ["Avg. Feedback Score", `${model.metrics.averageFeedbackScore}%`],
  ];
}

export function readFeedbackEventsFromStorage(storageKey = FEEDBACK_EVENT_STORAGE_KEY) {
  if (typeof window === "undefined" || !window.localStorage) return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeFeedbackEventsToStorage(events = [], storageKey = FEEDBACK_EVENT_STORAGE_KEY) {
  if (typeof window === "undefined" || !window.localStorage) return false;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(safeArray(events)));
    return true;
  } catch {
    return false;
  }
}

export function appendFeedbackEventToStorage(event, storageKey = FEEDBACK_EVENT_STORAGE_KEY) {
  const current = readFeedbackEventsFromStorage(storageKey);
  const nextEvent = event?.eventId ? event : buildFeedbackEvent(event || {});
  const next = [nextEvent, ...current].slice(0, 250);
  writeFeedbackEventsToStorage(next, storageKey);
  return nextEvent;
}

export { FEEDBACK_EVENT_STORAGE_KEY };

import { getAdaptiveEvents } from "./adaptiveTracker";

const POSITIVE_EVENTS = new Set([
  "form_submitted",
  "report_exported",
  "file_uploaded",
  "recommendation_accepted",
  "button_clicked",
  "card_clicked",
]);

const FRICTION_EVENTS = new Set([
  "form_abandoned",
  "recommendation_ignored",
  "alert_dismissed",
]);

export function calculateDashboardExperienceScore(
  events = getAdaptiveEvents(),
  surface
) {
  const scoped = surface
    ? events.filter((event) => event.surface === surface)
    : events;

  if (!scoped.length) {
    return {
      score: 0,
      grade: "No Data",
      totalEvents: 0,
      positiveEvents: 0,
      frictionEvents: 0,
      message: "No adaptive experience data has been recorded yet.",
    };
  }

  const positiveEvents = scoped.filter((event) =>
    POSITIVE_EVENTS.has(event.eventType)
  ).length;

  const frictionEvents = scoped.filter((event) =>
    FRICTION_EVENTS.has(event.eventType)
  ).length;

  const rawScore = Math.round(
    Math.max(0, Math.min(100, 70 + positiveEvents * 2 - frictionEvents * 6))
  );

  let grade = "Needs Review";
  if (rawScore >= 90) grade = "Excellent";
  else if (rawScore >= 80) grade = "Strong";
  else if (rawScore >= 70) grade = "Stable";

  return {
    score: rawScore,
    grade,
    totalEvents: scoped.length,
    positiveEvents,
    frictionEvents,
    message: buildScoreMessage(rawScore),
  };
}

function buildScoreMessage(score) {
  if (score >= 90) return "This dashboard experience is performing at a high level.";
  if (score >= 80) return "This dashboard experience is strong, with room for targeted improvements.";
  if (score >= 70) return "This dashboard experience is stable but should be watched for friction.";
  return "This dashboard may need workflow, layout, or guidance improvements.";
}

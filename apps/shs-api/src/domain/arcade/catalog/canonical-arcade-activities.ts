// Phase 7 — canonical Learning Arcade Activity definitions (version-controlled configuration).
//
// arcade_activities is the global Learning activity registry. Code-backed descriptors and Missions must
// reference a stable arcade_activity_id, so canonical activities carry a fixed id and are provisioned into
// each environment through the Arcade authority (provisionCanonicalArcadeActivity), never by migration or
// by a fabricated system user. Definitions describe the activity only: no content, score or mastery data.
import type { ArcadeActivityType, ArcadeMasteryRule } from "../model/arcade.js";

export interface CanonicalArcadeActivityDefinition {
  id: string;
  slug: string;
  title: string;
  activityType: ArcadeActivityType;
  masteryRule: ArcadeMasteryRule;
  maxScore: null;
  passThresholdScore: null;
}

export const CANONICAL_ARCADE_ACTIVITIES: readonly CanonicalArcadeActivityDefinition[] = Object.freeze([
  // Silicon Heartland Data Center Community & Workforce Initiative — flagship simulated incident.
  // PASSED_FLAG: the outcome is pass/fail with no meaningful authoritative score, so no leaderboard.
  Object.freeze({
    id: "arcade_activity_data_center_cooling_incident_v1",
    slug: "data-center-cooling-incident",
    title: "Data Center Cooling Failure Response",
    activityType: "SCENARIO" as const,
    masteryRule: "PASSED_FLAG" as const,
    maxScore: null,
    passThresholdScore: null,
  }),
]);

export function canonicalArcadeActivity(id: string) {
  return CANONICAL_ARCADE_ACTIVITIES.find((item) => item.id === id) ?? null;
}

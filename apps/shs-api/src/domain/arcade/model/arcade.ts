// SHF Ecosystem Phase 8 — Learning Arcade model types.
export const ARCADE_ACTIVITY_TYPES = [
  "RETRIEVAL", "TROUBLESHOOTING", "SIMULATION", "SCENARIO", "SYSTEMS_THINKING", "CHALLENGE",
] as const;
export type ArcadeActivityType = typeof ARCADE_ACTIVITY_TYPES[number];

export const ARCADE_MASTERY_RULES = ["PASSED_FLAG", "SCORE_THRESHOLD"] as const;
export type ArcadeMasteryRule = typeof ARCADE_MASTERY_RULES[number];

export interface ArcadeActivity {
  id: string;
  slug: string;
  title: string;
  activityType: ArcadeActivityType;
  lessonId: string | null;
  masteryRule: ArcadeMasteryRule;
  maxScore: number | null;
  passThresholdScore: number | null;
  status: "active" | "inactive";
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export const ARCADE_ATTEMPT_STATUSES = ["STARTED", "COMPLETED", "ABANDONED"] as const;
export type ArcadeAttemptStatus = typeof ARCADE_ATTEMPT_STATUSES[number];

export interface ArcadeAttempt {
  id: string;
  arcadeActivityId: string;
  learnerUserId: string;
  organizationId: string;
  status: ArcadeAttemptStatus;
  startedAt: string;
  completedAt: string | null;
}

export interface ArcadeResult {
  id: string;
  arcadeAttemptId: string;
  arcadeActivityId: string;
  learnerUserId: string;
  organizationId: string;
  passed: boolean | null;
  score: number | null;
  maxScore: number | null;
  masteryAchieved: boolean;
  createdAt: string;
}

// Deterministic, server-only mastery derivation — the client never
// supplies a "mastered" boolean; it supplies a raw `passed` flag or
// `score`, and this function is the sole authority translating that into
// mastery, per the Activity's own stored policy. No AI, no heuristic.
export function deriveMastery(
  activity: Pick<ArcadeActivity, "masteryRule" | "passThresholdScore">,
  input: { passed?: boolean; score?: number },
): boolean {
  if (activity.masteryRule === "PASSED_FLAG") {
    return input.passed === true;
  }
  if (typeof input.score !== "number" || activity.passThresholdScore === null) return false;
  return input.score >= activity.passThresholdScore;
}

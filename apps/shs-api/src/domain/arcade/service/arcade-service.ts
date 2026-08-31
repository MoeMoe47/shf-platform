// SHF Ecosystem Phase 8 — Learning Arcade service.
//
// Critical invariant, enforced throughout: the client NEVER supplies a
// "mastered"/"passed-and-mastered" boolean directly as institutional
// truth. It supplies only a raw `passed` flag (for a PASSED_FLAG
// activity) or a bounds-checked `score` (for a SCORE_THRESHOLD activity);
// deriveMastery() — reading only the Activity's own server-stored policy
// — is the sole authority for whether that outcome counts as mastery.
// Same principle as Calendar-click != completion, Project submission !=
// approval, Credential eligibility != issuance.
import { randomUUID } from "crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { isAdminTier } from "../../shared/audience-eligibility.js";
import { ArcadeRepo } from "../repo/arcade-repo.js";
import { ArcadeActivity, ArcadeAttempt, ArcadeResult, deriveMastery } from "../model/arcade.js";

const repo = new ArcadeRepo();

export class ArcadeError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "ArcadeError";
  }
}

export interface ArcadeActor {
  user_id: string;
  organization_id: string;
  roles: string[];
  permissions: string[];
}

function scope(actor: ArcadeActor) {
  const organizationId = String(actor.organization_id || "");
  const userId = String(actor.user_id || "");
  if (!organizationId || !userId) throw new ArcadeError("SCOPE_MISSING", "Actor organization/user is required.", 403);
  return { organizationId, userId, tenantId: `tenant:${organizationId}` };
}

// --- Activity (global reference data) ---

export async function createActivity(actor: ArcadeActor, input: {
  slug: string; title: string; activityType: string; lessonId?: string;
  masteryRule: string; maxScore?: number; passThresholdScore?: number;
}): Promise<ArcadeActivity> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ACTIVITY_MANAGE)) {
    throw new ArcadeError("FORBIDDEN", "Only an authorized admin or program manager may define Arcade Activities.", 403);
  }
  const { userId } = scope(actor);
  if (!input.slug?.trim() || !input.title?.trim()) {
    throw new ArcadeError("VALIDATION_ERROR", "slug and title are required.", 400);
  }
  if (!["PASSED_FLAG", "SCORE_THRESHOLD"].includes(input.masteryRule)) {
    throw new ArcadeError("INVALID_MASTERY_RULE", "masteryRule must be PASSED_FLAG or SCORE_THRESHOLD.", 400);
  }
  if (input.masteryRule === "SCORE_THRESHOLD") {
    if (!Number.isInteger(input.maxScore) || (input.maxScore as number) <= 0) {
      throw new ArcadeError("INVALID_MAX_SCORE", "A SCORE_THRESHOLD activity requires a positive integer maxScore.", 400);
    }
    if (!Number.isInteger(input.passThresholdScore) || (input.passThresholdScore as number) < 0 || (input.passThresholdScore as number) > (input.maxScore as number)) {
      throw new ArcadeError("INVALID_PASS_THRESHOLD", "passThresholdScore must be between 0 and maxScore.", 400);
    }
  } else if (input.maxScore !== undefined || input.passThresholdScore !== undefined) {
    throw new ArcadeError("SCORE_FIELDS_NOT_ALLOWED", "A PASSED_FLAG activity must not define maxScore/passThresholdScore.", 400);
  }
  const existing = await repo.getActivityBySlug(input.slug.trim());
  if (existing) throw new ArcadeError("DUPLICATE_SLUG", "An Arcade Activity with this slug already exists.", 409);
  return repo.createActivity({
    id: `arcade_activity_${randomUUID()}`,
    slug: input.slug.trim(),
    title: input.title.trim(),
    activityType: input.activityType,
    lessonId: input.lessonId ?? null,
    masteryRule: input.masteryRule,
    maxScore: input.maxScore ?? null,
    passThresholdScore: input.passThresholdScore ?? null,
    createdByUserId: userId,
  });
}

export async function listActivities(): Promise<ArcadeActivity[]> {
  return repo.listActiveActivities();
}

// --- Attempt ---

export async function startAttempt(actor: ArcadeActor, activityId: string): Promise<ArcadeAttempt> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT)) {
    throw new ArcadeError("FORBIDDEN", "Missing arcade.attempt permission.", 403);
  }
  const { organizationId, userId, tenantId } = scope(actor);
  const activity = await repo.getActivityById(activityId);
  if (!activity || activity.status !== "active") {
    throw new ArcadeError("ACTIVITY_NOT_FOUND", "Arcade Activity not found or inactive.", 404);
  }
  return repo.createAttempt({ id: `arcade_attempt_${randomUUID()}`, arcadeActivityId: activity.id, learnerUserId: userId, organizationId, tenantId });
}

export async function abandonAttempt(actor: ArcadeActor, attemptId: string): Promise<ArcadeAttempt> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT)) {
    throw new ArcadeError("FORBIDDEN", "Missing arcade.attempt permission.", 403);
  }
  const { organizationId, userId } = scope(actor);
  const attempt = await repo.abandonAttempt(attemptId, organizationId, userId);
  if (!attempt) throw new ArcadeError("ATTEMPT_NOT_FOUND", "No startable Attempt found to abandon.", 404);
  return attempt;
}

export async function getAttemptForActor(actor: ArcadeActor, attemptId: string): Promise<ArcadeAttempt | null> {
  const { organizationId, userId } = scope(actor);
  const attempt = await repo.getAttemptById(attemptId);
  if (!attempt || attempt.organizationId !== organizationId) return null;
  if (!isAdminTier(actor.roles) && attempt.learnerUserId !== userId) return null;
  return attempt;
}

// --- Result (the sole path to canonical mastery truth) ---

export async function submitResult(actor: ArcadeActor, attemptId: string, input: { passed?: boolean; score?: number }): Promise<ArcadeResult> {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT)) {
    throw new ArcadeError("FORBIDDEN", "Missing arcade.attempt permission.", 403);
  }
  const { organizationId, userId, tenantId } = scope(actor);
  return withTransaction(async (client: any) => {
    const dbQuery = client.query.bind(client);
    const attempt = await repo.getAttemptForUpdate(dbQuery, attemptId);
    // 404, not 403 — a learner probing another learner's or another org's
    // attempt id must not learn it exists.
    if (!attempt || attempt.organizationId !== organizationId || attempt.learnerUserId !== userId) {
      throw new ArcadeError("ATTEMPT_NOT_FOUND", "Attempt not found.", 404);
    }
    if (attempt.status !== "STARTED") {
      throw new ArcadeError("ATTEMPT_NOT_STARTED", "This Attempt has already been finalized or abandoned.", 409);
    }
    const existingResult = await repo.getResultByAttemptId(attemptId);
    if (existingResult) throw new ArcadeError("DUPLICATE_RESULT", "This Attempt already has a final Result.", 409);
    const activity = await repo.getActivityById(attempt.arcadeActivityId);
    if (!activity) throw new ArcadeError("ACTIVITY_NOT_FOUND", "Arcade Activity not found.", 404);

    let passed: boolean | null = null;
    let score: number | null = null;
    if (activity.masteryRule === "PASSED_FLAG") {
      if (typeof input.passed !== "boolean") throw new ArcadeError("INVALID_RESULT_SHAPE", "This Activity requires a boolean 'passed' field.", 400);
      passed = input.passed;
    } else {
      if (typeof input.score !== "number" || !Number.isFinite(input.score) || !Number.isInteger(input.score)) {
        throw new ArcadeError("INVALID_SCORE", "This Activity requires an integer 'score' field.", 400);
      }
      if (input.score < 0 || (activity.maxScore !== null && input.score > activity.maxScore)) {
        throw new ArcadeError("SCORE_OUT_OF_BOUNDS", `score must be between 0 and ${activity.maxScore}.`, 400);
      }
      score = input.score;
    }

    const masteryAchieved = deriveMastery(activity, { passed: passed ?? undefined, score: score ?? undefined });
    const result = await repo.createResult(dbQuery, {
      id: `arcade_result_${randomUUID()}`,
      arcadeAttemptId: attemptId,
      arcadeActivityId: activity.id,
      learnerUserId: userId,
      organizationId,
      tenantId,
      passed,
      score,
      maxScore: activity.maxScore,
      masteryAchieved,
    });
    await repo.completeAttempt(dbQuery, attemptId);
    return result;
  });
}

export async function listResultsForActor(actor: ArcadeActor): Promise<ArcadeResult[]> {
  const { organizationId, userId } = scope(actor);
  if (isAdminTier(actor.roles)) {
    if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_RESULTS_VIEW)) {
      throw new ArcadeError("FORBIDDEN", "Missing arcade.results.view permission.", 403);
    }
    return repo.listResultsForOrganization(organizationId);
  }
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT)) {
    throw new ArcadeError("FORBIDDEN", "Missing arcade.attempt permission.", 403);
  }
  return repo.listResultsForLearner(organizationId, userId);
}

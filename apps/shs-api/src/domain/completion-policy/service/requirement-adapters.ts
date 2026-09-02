// SHF Lesson + Assignment + Curriculum — Phase 4.
//
// One adapter function per requirement type (Step 16-23), each reading
// ONLY an already-authoritative domain record. No adapter here ever
// writes to another domain's tables, and none ever accepts browser-
// supplied "I did this" state as evidence.
//
// ---------------------------------------------------------------------
// STEP 15 — the CONTENT requirement's circularity resolution (documented
// per the phase brief's explicit request):
//
// curriculum_lesson_completions (Phase 0) is, as of this phase, the
// FINAL VERIFIED lesson completion record (option A in the brief's
// Step 15) for any lesson an institutional policy applies to — it is
// written ONLY after a passing evaluation (see
// curriculum-completion-service.ts's new gating call). That means it can
// never also be the INPUT the CONTENT requirement reads to decide THIS
// SAME evaluation — that would be circular (the row cannot exist until
// after the check it would be gating passes).
//
// No separate content-view/read-tracking producer exists in this repo
// (confirmed by this session's own research pass) — so, per the brief's
// explicit permission to "document the safest semantics" rather than
// force a fake one, CONTENT is defined here as a structural check: it is
// SATISFIED whenever the target lesson genuinely resolves inside the
// assignment's bound, immutable curriculum release snapshot (a real,
// already-authoritative Phase 2 fact — never fabricated, always
// resolvable for any correctly-configured assignment). It answers "is
// this genuinely real, assigned instructional content?", not "did the
// learner read it?" — the latter has no authoritative producer yet and
// would need a future Phase 5-or-later view-tracking domain.
// ---------------------------------------------------------------------
import { query } from "../../../db/client.js";
import type { CompletionPolicyRequirementRow, RequirementResult } from "../model/completion-policy.js";
import { REQUIREMENT_REGISTRY } from "../model/completion-policy.js";

export interface AdapterContext {
  organizationId: string;
  learnerUserId: string;
  assignmentId: string;
  curriculumReleaseId: string;
  releaseVersion: number | null;
  unitStableKey: string;
  lessonStableKey: string;
  // The lesson currently being evaluated, resolved from the release
  // snapshot (Phase 3's resolveContentWithinRelease shape) — used only by
  // the CONTENT adapter's structural check.
  lessonResolved: boolean;
  lessonSnapshot: any | null;
}

function baseResult(req: CompletionPolicyRequirementRow, status: RequirementResult["status"], reason: string, sourceRecordId: string | null = null): RequirementResult {
  const registryEntry = REQUIREMENT_REGISTRY[req.requirementType];
  return {
    requirementId: req.requirementId,
    type: req.requirementType,
    required: req.required,
    status,
    satisfied: status === "SATISFIED",
    authoritativeSource: registryEntry.authoritativeDomain,
    sourceRecordId,
    evaluatedAt: new Date().toISOString(),
    reason,
  };
}

async function evaluateContent(req: CompletionPolicyRequirementRow, ctx: AdapterContext): Promise<RequirementResult> {
  if (!ctx.lessonResolved) {
    return baseResult(req, "UNSATISFIED", "The target lesson does not resolve within the assignment's bound curriculum release.");
  }
  return baseResult(req, "SATISFIED", "The assigned content resolves to real, immutable curriculum within the bound release.");
}

async function evaluateArcade(req: CompletionPolicyRequirementRow, ctx: AdapterContext): Promise<RequirementResult> {
  if (!req.targetReference) return baseResult(req, "ERROR", "Requirement is missing its arcade activity target reference.");
  const res = await query(
    `SELECT arcade_result_id, mastery_achieved, created_at FROM arcade_results
     WHERE organization_id = $1 AND learner_user_id = $2 AND arcade_activity_id = $3 AND mastery_achieved = true
     ORDER BY created_at ASC LIMIT 1`,
    [ctx.organizationId, ctx.learnerUserId, req.targetReference],
  );
  const row = res.rows[0];
  if (!row) return baseResult(req, "UNSATISFIED", `No mastered Arcade result exists for activity ${req.targetReference}.`);
  return baseResult(req, "SATISFIED", "Learner has a canonical mastered Arcade result.", row.arcade_result_id);
}

async function evaluateProject(req: CompletionPolicyRequirementRow, ctx: AdapterContext): Promise<RequirementResult> {
  if (!req.targetReference) return baseResult(req, "ERROR", "Requirement is missing its project target reference.");
  // No existing single-learner reader in the Project domain (confirmed
  // this session) — this is a new read-only query, not a duplicate
  // storage domain, joining the same real tables the Project service
  // itself owns.
  const res = await query(
    `SELECT ps.submission_id, ps.status FROM project_submissions ps
     JOIN project_team_members ptm ON ptm.team_id = ps.team_id AND ptm.organization_id = ps.organization_id
     WHERE ps.organization_id = $1 AND ps.project_id = $2 AND ptm.learner_id = $3 AND ptm.left_at IS NULL
     ORDER BY ps.version DESC LIMIT 1`,
    [ctx.organizationId, req.targetReference, ctx.learnerUserId],
  );
  const row = res.rows[0];
  if (!row) return baseResult(req, "UNSATISFIED", `No project submission exists for project ${req.targetReference}.`);
  if (row.status !== "ACCEPTED") return baseResult(req, "UNSATISFIED", `Latest project submission status is ${row.status}, not ACCEPTED.`, row.submission_id);
  return baseResult(req, "SATISFIED", "Learner's latest project submission is ACCEPTED.", row.submission_id);
}

async function evaluateLiveAttendance(req: CompletionPolicyRequirementRow, ctx: AdapterContext): Promise<RequirementResult> {
  if (!req.targetReference) return baseResult(req, "ERROR", "Requirement is missing its live session target reference.");
  // Defense in depth: getLatestJoinEventForUser (the existing Live
  // Learning reader) does not itself filter by organization, so this
  // adapter verifies the session's organization directly before trusting
  // any join event — cross-org requirement references must fail closed.
  const session = await query(`SELECT organization_id FROM live_sessions WHERE live_session_id = $1`, [req.targetReference]);
  if (!session.rows[0] || session.rows[0].organization_id !== ctx.organizationId) {
    return baseResult(req, "ERROR", "Live session target does not belong to this organization.");
  }
  const res = await query(
    `SELECT join_event_id, attendance_status FROM live_session_join_events
     WHERE live_session_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1`,
    [req.targetReference, ctx.learnerUserId],
  );
  const row = res.rows[0];
  if (!row || !["attended", "completed"].includes(row.attendance_status)) {
    return baseResult(req, "UNSATISFIED", `No recorded attendance for live session ${req.targetReference}.`, row?.join_event_id || null);
  }
  return baseResult(req, "SATISFIED", "Learner has a canonical attended/completed Live Learning join event.", row.join_event_id);
}

async function evaluateCompetencyDecision(req: CompletionPolicyRequirementRow, ctx: AdapterContext): Promise<RequirementResult> {
  if (!req.targetReference) return baseResult(req, "ERROR", "Requirement is missing its competency target reference.");
  const res = await query(
    `SELECT decision_id, decision, reviewer_user_id FROM learner_competency_decisions
     WHERE organization_id = $1 AND user_id = $2 AND competency_id = $3 AND decision = 'DEMONSTRATED'
     ORDER BY reviewed_at DESC LIMIT 1`,
    [ctx.organizationId, ctx.learnerUserId, req.targetReference],
  );
  const row = res.rows[0];
  if (!row) return baseResult(req, "UNSATISFIED", `No reviewer-approved DEMONSTRATED decision exists for competency ${req.targetReference}.`);
  return baseResult(req, "SATISFIED", `Reviewer-approved (reviewer ${row.reviewer_user_id}) DEMONSTRATED decision.`, row.decision_id);
}

async function evaluateAssessment(req: CompletionPolicyRequirementRow, ctx: AdapterContext): Promise<RequirementResult> {
  const definitionId = ctx.lessonSnapshot?.assessmentDefinition?.assessmentDefinitionId;
  if (!definitionId) return baseResult(req, "NOT_AVAILABLE", "No assessment definition exists in the assignment's bound release.");
  const threshold = Number((req.configuration as any)?.passThresholdPercent);
  if (!Number.isFinite(threshold)) return baseResult(req, "ERROR", "Assessment requirement is missing configuration.passThresholdPercent.");
  const res = await query(
    `SELECT assessment_result_id FROM assessment_results
     WHERE organization_id = $1 AND learner_user_id = $2 AND assignment_id = $3
       AND curriculum_release_id = $4 AND release_version = $5
       AND unit_stable_key = $6 AND lesson_stable_key = $7
       AND assessment_definition_id = $8
       AND needs_review = false AND percent >= $9
     ORDER BY created_at ASC LIMIT 1`,
    [ctx.organizationId, ctx.learnerUserId, ctx.assignmentId, ctx.curriculumReleaseId, ctx.releaseVersion, ctx.unitStableKey, ctx.lessonStableKey, definitionId, threshold],
  );
  const row = res.rows[0];
  if (!row) return baseResult(req, "UNSATISFIED", "No canonical passing Assessment result exists for this assignment release.");
  return baseResult(req, "SATISFIED", "Learner has a canonical passing Assessment result.", row.assessment_result_id);
}

async function evaluateReflection(req: CompletionPolicyRequirementRow, ctx: AdapterContext): Promise<RequirementResult> {
  const definitionId = ctx.lessonSnapshot?.reflectionDefinition?.reflectionDefinitionId;
  if (!definitionId) return baseResult(req, "NOT_AVAILABLE", "No reflection definition exists in the assignment's bound release.");
  const approvalRequired = (req.configuration as any)?.approvalRequired === true;
  const statusClause = approvalRequired ? "AND status = 'REVIEWED' AND review_status = 'APPROVED'" : "";
  const res = await query(
    `SELECT reflection_submission_id FROM reflection_submissions
     WHERE organization_id = $1 AND learner_user_id = $2 AND assignment_id = $3
       AND curriculum_release_id = $4 AND release_version = $5
       AND unit_stable_key = $6 AND lesson_stable_key = $7
       AND reflection_definition_id = $8
       ${statusClause}
     ORDER BY version DESC LIMIT 1`,
    [ctx.organizationId, ctx.learnerUserId, ctx.assignmentId, ctx.curriculumReleaseId, ctx.releaseVersion, ctx.unitStableKey, ctx.lessonStableKey, definitionId],
  );
  const row = res.rows[0];
  if (!row) return baseResult(req, "UNSATISFIED", approvalRequired ? "No approved canonical Reflection submission exists." : "No canonical Reflection submission exists.");
  return baseResult(req, "SATISFIED", approvalRequired ? "Learner has an approved canonical Reflection submission." : "Learner has a canonical Reflection submission.", row.reflection_submission_id);
}

async function evaluatePractice(req: CompletionPolicyRequirementRow, ctx: AdapterContext): Promise<RequirementResult> {
  const definitionId = ctx.lessonSnapshot?.practiceDefinition?.practiceDefinitionId;
  if (!definitionId) return baseResult(req, "NOT_AVAILABLE", "No practice definition exists in the assignment's bound release.");
  const res = await query(
    `SELECT practice_result_id FROM practice_results
     WHERE organization_id = $1 AND learner_user_id = $2 AND assignment_id = $3
       AND curriculum_release_id = $4 AND release_version = $5
       AND unit_stable_key = $6 AND lesson_stable_key = $7
       AND practice_definition_id = $8
       AND completed = true
     ORDER BY created_at ASC LIMIT 1`,
    [ctx.organizationId, ctx.learnerUserId, ctx.assignmentId, ctx.curriculumReleaseId, ctx.releaseVersion, ctx.unitStableKey, ctx.lessonStableKey, definitionId],
  );
  const row = res.rows[0];
  if (!row) return baseResult(req, "UNSATISFIED", "No canonical completed Practice result exists.");
  return baseResult(req, "SATISFIED", "Learner has a canonical completed Practice result.", row.practice_result_id);
}

async function evaluateUnsupported(req: CompletionPolicyRequirementRow): Promise<RequirementResult> {
  const entry = REQUIREMENT_REGISTRY[req.requirementType];
  return baseResult(req, "NOT_VERIFIABLE", entry.unavailableReason || "No authoritative domain exists for this requirement type yet.");
}

export async function evaluateRequirement(req: CompletionPolicyRequirementRow, ctx: AdapterContext): Promise<RequirementResult> {
  switch (req.requirementType) {
    case "CONTENT": return evaluateContent(req, ctx);
    case "ARCADE": return evaluateArcade(req, ctx);
    case "PROJECT": return evaluateProject(req, ctx);
    case "LIVE_ATTENDANCE": return evaluateLiveAttendance(req, ctx);
    case "INSTRUCTOR_VERIFICATION": return evaluateCompetencyDecision(req, ctx);
    case "EVIDENCE": return evaluateCompetencyDecision(req, ctx);
    case "ASSESSMENT": return evaluateAssessment(req, ctx);
    case "REFLECTION": return evaluateReflection(req, ctx);
    case "PRACTICE": return evaluatePractice(req, ctx);
    default: return baseResult(req, "ERROR", `Unknown requirement type.`);
  }
}

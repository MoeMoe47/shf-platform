import { createHash } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { emitOperationalTelemetry } from "../../../observability/operational-telemetry.js";
import { CurriculumCompletionRepo } from "../repo/curriculum-completion-repo.js";
import { query } from "../../../db/client.js";
import { evaluateLessonCompletion } from "../../completion-policy/service/completion-evaluator.js";
import type { CompletionEvaluationResult } from "../../completion-policy/service/completion-evaluator.js";

export class CompletionPolicyNotSatisfiedError extends Error {
  constructor(public evaluation: CompletionEvaluationResult) {
    super("completion_policy_not_satisfied");
    this.name = "CompletionPolicyNotSatisfiedError";
  }
}

function stableId(organizationId: string, userId: string, curriculumId: string, lessonId: string) {
  return createHash("sha256")
    .update([organizationId, userId, curriculumId, lessonId].join("|"), "utf8")
    .digest("hex")
    .slice(0, 32);
}

export class CurriculumCompletionService {
  constructor(
    private repo = new CurriculumCompletionRepo(),
    private outbox = new IntegrationOutboxRepo(),
    private transaction = withTransaction,
  ) {}

  async complete(input: { lessonId: string; curriculumId: string; actor: any }) {
    const lessonId = String(input.lessonId || "").trim();
    const curriculumId = String(input.curriculumId || "").trim();
    const userId = String(input.actor?.user_id || input.actor?.id || "").trim();
    const organizationId = String(input.actor?.organization_id || "").trim();
    const tenantId = String(input.actor?.tenant_id || `tenant:${organizationId}`).trim();
    if (!lessonId || !/^[A-Za-z0-9._:-]{1,160}$/.test(lessonId)) throw new Error("invalid_lesson_id");
    if (!curriculumId || !/^[A-Za-z0-9._:-]{1,80}$/.test(curriculumId)) throw new Error("invalid_curriculum_id");
    if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("completion_scope_missing");

    // Grade 12 lesson completion is institutional participation, so it must
    // be backed by the eligible learner's active course assignment.
    const grade12SpecializationByCourse: Record<string, string> = {
      "data-center-technical-operations-12": "technical-operations",
      "data-center-networking-fiber-12": "networking-fiber",
      "data-center-electrical-infrastructure-12": "electrical-infrastructure",
      "data-center-mechanical-hvac-12": "mechanical-hvac",
      "data-center-cybersecurity-security-12": "cybersecurity-security",
      "data-center-ai-cloud-infrastructure-12": "ai-cloud-infrastructure",
    };
    if (grade12SpecializationByCourse[curriculumId]) {
      const assigned = await query(
        "SELECT assignment_id FROM program_course_assignments WHERE learner_id=$1 AND organization_id=$2 AND tenant_id=$3 AND program_id='data-center-specialization-11' AND course_id=$4 AND specialization_id=$5 AND status='ACTIVE'",
        [userId, organizationId, tenantId, curriculumId, grade12SpecializationByCourse[curriculumId]],
      );
      if (!assigned.rows[0]) throw new Error("grade12_course_assignment_required");
    }

    // SHF Lesson + Assignment + Curriculum Phase 4 — Completion Policy
    // gate. findApplicablePolicyForLessonCompletion (inside
    // evaluateLessonCompletion) returns null when NO assignment entitled
    // to this learner both resolves to this exact (curriculumId,
    // lessonId) via its bound release AND has a completion_policy_id —
    // i.e. this content is not institutionally gated at all (legacy/
    // demo/unassigned), so behavior is byte-identical to before this
    // phase. Only when a real policy applies is eligibility enforced —
    // server-side, from authoritative domain records, never from
    // anything this method's caller merely asserts.
    const evaluation = await evaluateLessonCompletion(
      { user_id: userId, organization_id: organizationId, roles: input.actor?.roles || [] },
      curriculumId,
      lessonId,
    );
    if (evaluation && !evaluation.eligible) {
      throw new CompletionPolicyNotSatisfiedError(evaluation);
    }

    const identity = stableId(organizationId, userId, curriculumId, lessonId);
    const completionId = `curriculum_completion_${identity}`;
    const idempotencyKey = `lesson.completed:${identity}`;

    return this.transaction(async (db: any) => {
      const completion = await this.repo.createOrGet({
        completion_id: completionId,
        user_id: userId,
        organization_id: organizationId,
        curriculum_id: curriculumId,
        lesson_id: lessonId,
        completed_at: new Date(),
        idempotency_key: idempotencyKey,
        assignment_id: evaluation?.assignmentId ?? null,
        curriculum_release_id: evaluation?.curriculumReleaseId ?? null,
        release_version: evaluation?.releaseVersion ?? null,
        completion_policy_id: evaluation?.completionPolicyId ?? null,
        completion_policy_version: evaluation?.completionPolicyVersion ?? null,
      }, db);

      const event = await this.outbox.enqueue({
        producer_id: "curriculum.lesson",
        event_type: "lesson.completed",
        schema_version: "1.0",
        subject_type: "lesson",
        subject_id: lessonId,
        organization_id: organizationId,
        originating_actor_id: userId,
        originating_actor_type: "user",
        tenant_id: tenantId,
        occurred_at: new Date(completion.completed_at).toISOString(),
        idempotency_key: idempotencyKey,
        correlation_id: `curriculum-completion:${completionId}`,
        payload: {
          completion_id: completion.completion_id,
          curriculum: curriculumId,
          slug: lessonId,
          sync_origin: "shs_server_completion",
        },
        destination: "agent-fabric",
      }, db);

      emitOperationalTelemetry({
        event_name: "curriculum_completion_outbox_created",
        severity: "INFO",
        component: "shs_api",
        category: "INGESTION",
        outcome: "SUCCESS",
        metadata: { completion_id: completion.completion_id },
      });
      return { completion, outbox_event_id: event.outbox_event_id };
    });
  }
}

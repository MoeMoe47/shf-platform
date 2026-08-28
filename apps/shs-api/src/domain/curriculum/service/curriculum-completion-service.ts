import { createHash } from "node:crypto";
import { withTransaction } from "../../../db/transaction";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo";
import { emitOperationalTelemetry } from "../../../observability/operational-telemetry";
import { CurriculumCompletionRepo } from "../repo/curriculum-completion-repo";

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

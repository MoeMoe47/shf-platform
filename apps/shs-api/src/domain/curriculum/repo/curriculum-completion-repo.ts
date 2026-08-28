import type { OutboxExecutor } from "../../trusted-reporting/outbox-repo";

export type CurriculumCompletion = {
  completion_id: string;
  user_id: string;
  organization_id: string;
  curriculum_id: string;
  lesson_id: string;
  completed_at: Date | string;
  idempotency_key: string;
};

export class CurriculumCompletionRepo {
  async createOrGet(input: CurriculumCompletion, executor: OutboxExecutor): Promise<CurriculumCompletion> {
    const result = await executor.query(
      `INSERT INTO curriculum_lesson_completions (
        completion_id, user_id, organization_id, curriculum_id, lesson_id,
        completed_at, idempotency_key
      ) VALUES ($1,$2,$3,$4,$5,NOW(),$6)
      ON CONFLICT (organization_id, user_id, curriculum_id, lesson_id)
      DO UPDATE SET completion_id = curriculum_lesson_completions.completion_id
      RETURNING *`,
      [input.completion_id, input.user_id, input.organization_id, input.curriculum_id, input.lesson_id, input.idempotency_key],
    );
    return result.rows[0] as CurriculumCompletion;
  }
}

import type { OutboxExecutor } from "../../trusted-reporting/outbox-repo.js";

export type CurriculumCompletion = {
  completion_id: string;
  user_id: string;
  organization_id: string;
  curriculum_id: string;
  lesson_id: string;
  completed_at: Date | string;
  idempotency_key: string;
  // SHF Lesson + Assignment + Curriculum Phase 4 — historical completion
  // lineage (migration 061). Undefined/null for any completion with no
  // applicable institutional policy (legacy/demo content) — exactly the
  // same honest, backward-compatible NULL every pre-existing row already
  // has. Never overwritten on a repeated idempotent call (see ON
  // CONFLICT below) — lineage is fixed at the moment completion first
  // becomes true, matching the immutable-history principle used
  // throughout this phase's other tables.
  assignment_id?: string | null;
  curriculum_release_id?: string | null;
  release_version?: number | null;
  completion_policy_id?: string | null;
  completion_policy_version?: number | null;
};

export class CurriculumCompletionRepo {
  async createOrGet(input: CurriculumCompletion, executor: OutboxExecutor): Promise<CurriculumCompletion> {
    const result = await executor.query(
      `INSERT INTO curriculum_lesson_completions (
        completion_id, user_id, organization_id, curriculum_id, lesson_id,
        completed_at, idempotency_key,
        assignment_id, curriculum_release_id, release_version, completion_policy_id, completion_policy_version
      ) VALUES ($1,$2,$3,$4,$5,NOW(),$6,$7,$8,$9,$10,$11)
      ON CONFLICT (organization_id, user_id, curriculum_id, lesson_id)
      DO UPDATE SET completion_id = curriculum_lesson_completions.completion_id
      RETURNING *`,
      [
        input.completion_id, input.user_id, input.organization_id, input.curriculum_id, input.lesson_id, input.idempotency_key,
        input.assignment_id ?? null, input.curriculum_release_id ?? null, input.release_version ?? null, input.completion_policy_id ?? null, input.completion_policy_version ?? null,
      ],
    );
    return result.rows[0] as CurriculumCompletion;
  }
}

// SHF Learning Ecosystem Phase 2 — Assignment persistence.
import { query } from "../../../db/client.js";
import type { Assignment, AssignmentStatus, AssignmentTarget, AssignmentTargetType, AssignmentType, AssignmentVisibilityScope } from "../model/assignment.js";

function rowToAssignment(row: any): Assignment {
  return {
    id: row.assignment_id,
    organizationId: row.organization_id,
    cohortId: row.cohort_id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    title: row.title,
    description: row.description,
    assignmentType: row.assignment_type,
    visibilityScope: row.visibility_scope,
    createdBy: row.created_by,
    availableAt: row.available_at instanceof Date ? row.available_at.toISOString() : row.available_at,
    dueAt: row.due_at instanceof Date ? row.due_at.toISOString() : row.due_at,
    closesAt: row.closes_at instanceof Date ? row.closes_at.toISOString() : row.closes_at,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    version: row.version,
    curriculumReleaseId: row.curriculum_release_id ?? null,
    assignedContentType: row.assigned_content_type ?? null,
    assignedContentId: row.assigned_content_id ?? null,
    completionPolicyId: row.completion_policy_id ?? null,
  };
}

function iso(value: any): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function rowToTarget(row: any): AssignmentTarget {
  return {
    id: row.assignment_target_id,
    assignmentId: row.assignment_id,
    organizationId: row.organization_id,
    targetType: row.target_type,
    userId: row.user_id,
    cohortId: row.cohort_id,
    programId: row.program_id,
    createdBy: row.created_by,
    createdAt: iso(row.created_at),
  };
}

const SELECT_COLUMNS = `
  assignment_id, organization_id, cohort_id, course_id, lesson_id,
  title, description, assignment_type, visibility_scope, created_by,
  available_at, due_at, closes_at, status,
  created_at, updated_at, version,
  curriculum_release_id, assigned_content_type, assigned_content_id, completion_policy_id
`;

const SELECT_COLUMNS_ALIASED = `
  a.assignment_id, a.organization_id, a.cohort_id, a.course_id, a.lesson_id,
  a.title, a.description, a.assignment_type, a.visibility_scope, a.created_by,
  a.available_at, a.due_at, a.closes_at, a.status,
  a.created_at, a.updated_at, a.version,
  a.curriculum_release_id, a.assigned_content_type, a.assigned_content_id, a.completion_policy_id
`;

const TARGET_COLUMNS = `
  assignment_target_id, assignment_id, organization_id, target_type,
  user_id, cohort_id, program_id, created_by, created_at
`;

export type CreateAssignmentTargetInput = {
  id: string;
  assignmentId: string;
  organizationId: string;
  targetType: AssignmentTargetType;
  userId?: string | null;
  cohortId?: string | null;
  programId?: string | null;
  createdBy: string;
};

export class AssignmentRepo {
  constructor(private dbQuery = query) {}

  async create(input: {
    id: string;
    organizationId: string;
    cohortId: string | null;
    courseId: string | null;
    lessonId: string | null;
    title: string;
    description: string | null;
    assignmentType: AssignmentType;
    visibilityScope: AssignmentVisibilityScope;
    createdBy: string;
    availableAt: string | null;
    dueAt: string;
    closesAt: string | null;
    status: AssignmentStatus;
    curriculumReleaseId?: string | null;
    assignedContentType?: string | null;
    assignedContentId?: string | null;
    completionPolicyId?: string | null;
  }): Promise<Assignment> {
    const res = await this.dbQuery(
      `INSERT INTO assignments (
        assignment_id, organization_id, cohort_id, course_id, lesson_id,
        title, description, assignment_type, visibility_scope, created_by,
        available_at, due_at, closes_at, status,
        curriculum_release_id, assigned_content_type, assigned_content_id, completion_policy_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING ${SELECT_COLUMNS}`,
      [
        input.id,
        input.organizationId,
        input.cohortId,
        input.courseId,
        input.lessonId,
        input.title,
        input.description,
        input.assignmentType,
        input.visibilityScope,
        input.createdBy,
        input.availableAt,
        input.dueAt,
        input.closesAt,
        input.status,
        input.curriculumReleaseId ?? null,
        input.assignedContentType ?? null,
        input.assignedContentId ?? null,
        input.completionPolicyId ?? null,
      ]
    );
    return rowToAssignment(res.rows[0]);
  }

  // Deliberately narrow: title/description/availability/due/closes/status
  // only. curriculum_release_id/assigned_content_type/assigned_content_id
  // are never accepted here — there is no code path that updates them
  // after creation, which is what makes content binding immutable-after-
  // activation (Phase 3 Step 19) true by construction, not by convention.
  async updateSafeFields(id: string, organizationId: string, fields: {
    title?: string; description?: string | null; availableAt?: string | null;
    dueAt?: string; closesAt?: string | null; status?: AssignmentStatus;
  }): Promise<Assignment | null> {
    const res = await this.dbQuery(
      `UPDATE assignments SET
         title = COALESCE($3, title),
         description = CASE WHEN $4::boolean THEN $5 ELSE description END,
         available_at = CASE WHEN $6::boolean THEN $7 ELSE available_at END,
         due_at = COALESCE($8, due_at),
         closes_at = CASE WHEN $9::boolean THEN $10 ELSE closes_at END,
         status = COALESCE($11, status),
         version = version + 1,
         updated_at = NOW()
       WHERE assignment_id = $1 AND organization_id = $2
       RETURNING ${SELECT_COLUMNS}`,
      [
        id, organizationId,
        fields.title ?? null,
        fields.description !== undefined, fields.description ?? null,
        fields.availableAt !== undefined, fields.availableAt ?? null,
        fields.dueAt ?? null,
        fields.closesAt !== undefined, fields.closesAt ?? null,
        fields.status ?? null,
      ],
    );
    return res.rows[0] ? rowToAssignment(res.rows[0]) : null;
  }

  async getById(id: string): Promise<Assignment | null> {
    const res = await this.dbQuery(
      `SELECT ${SELECT_COLUMNS} FROM assignments WHERE assignment_id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] ? rowToAssignment(res.rows[0]) : null;
  }

  /**
   * Admin-tier read: every published assignment in the organization.
   * organizationId is required — every caller must supply it from the
   * authenticated request, never from an unchecked client parameter.
   */
  async listForOrganization(filters: { organizationId: string; status?: AssignmentStatus }): Promise<Assignment[]> {
    const clauses: string[] = [`organization_id = $1`];
    const params: unknown[] = [filters.organizationId];
    if (filters.status) { params.push(filters.status); clauses.push(`status = $${params.length}`); }
    const res = await this.dbQuery(
      `SELECT ${SELECT_COLUMNS} FROM assignments WHERE ${clauses.join(" AND ")} ORDER BY due_at ASC`,
      params
    );
    return res.rows.map(rowToAssignment);
  }

  /**
   * Instructor-tier read: assignments they created plus cohort-targeted
   * assignments for cohorts where they are active cohort_staff.
   */
  async listForCreator(filters: { organizationId: string; createdBy: string; status?: AssignmentStatus }): Promise<Assignment[]> {
    const clauses: string[] = [`organization_id = $1`, `created_by = $2`];
    const params: unknown[] = [filters.organizationId, filters.createdBy];
    if (filters.status) { params.push(filters.status); clauses.push(`status = $${params.length}`); }
    const res = await this.dbQuery(
      `SELECT ${SELECT_COLUMNS} FROM assignments WHERE ${clauses.join(" AND ")} ORDER BY due_at ASC`,
      params
    );
    return res.rows.map(rowToAssignment);
  }

  async listForInstructor(filters: { organizationId: string; userId: string; status?: AssignmentStatus }): Promise<Assignment[]> {
    const clauses: string[] = [
      `a.organization_id = $1`,
      `(a.created_by = $2 OR EXISTS (
        SELECT 1
        FROM assignment_targets t
        JOIN cohort_staff cs
          ON cs.organization_id = t.organization_id
         AND cs.cohort_id = t.cohort_id
         AND cs.user_id = $2
         AND cs.status = 'ACTIVE'
        WHERE t.assignment_id = a.assignment_id
          AND t.organization_id = a.organization_id
          AND t.target_type = 'COHORT'
      ))`,
    ];
    const params: unknown[] = [filters.organizationId, filters.userId];
    if (filters.status) { params.push(filters.status); clauses.push(`a.status = $${params.length}`); }
    const res = await this.dbQuery(
      `SELECT DISTINCT ${SELECT_COLUMNS_ALIASED}
       FROM assignments a WHERE ${clauses.join(" AND ")} ORDER BY a.due_at ASC`,
      params
    );
    return res.rows.map(rowToAssignment);
  }

  /**
   * Student-tier read — the actual entitlement boundary. A row is returned
   * only if at least one explicit target row matches a server-derived
   * learner entitlement. Organization membership alone is not enough.
   */
  async listEntitledForStudent(filters: { organizationId: string; userId: string; programIds: string[]; cohortIds: string[]; status?: AssignmentStatus }): Promise<Assignment[]> {
    const clauses: string[] = [
      `a.organization_id = $1`,
      `EXISTS (
        SELECT 1 FROM assignment_targets t
        WHERE t.assignment_id = a.assignment_id
          AND t.organization_id = a.organization_id
          AND (
            t.target_type = 'ORGANIZATION'
            OR (t.target_type = 'LEARNER' AND t.user_id = $2)
            OR (t.target_type = 'PROGRAM' AND t.program_id = ANY($3::text[]))
            OR (t.target_type = 'COHORT' AND t.cohort_id = ANY($4::text[]))
          )
      )`,
    ];
    const params: unknown[] = [filters.organizationId, filters.userId, filters.programIds, filters.cohortIds];
    if (filters.status) { params.push(filters.status); clauses.push(`a.status = $${params.length}`); }
    const res = await this.dbQuery(
      `SELECT ${SELECT_COLUMNS_ALIASED}
       FROM assignments a WHERE ${clauses.join(" AND ")} ORDER BY a.due_at ASC`,
      params
    );
    return res.rows.map(rowToAssignment);
  }

  async hasEntitlementTarget(input: { assignmentId: string; organizationId: string; userId: string; programIds: string[]; cohortIds: string[] }): Promise<boolean> {
    const res = await this.dbQuery(
      `SELECT 1
       FROM assignment_targets
       WHERE assignment_id = $1
         AND organization_id = $2
         AND (
           target_type = 'ORGANIZATION'
           OR (target_type = 'LEARNER' AND user_id = $3)
           OR (target_type = 'PROGRAM' AND program_id = ANY($4::text[]))
           OR (target_type = 'COHORT' AND cohort_id = ANY($5::text[]))
         )
       LIMIT 1`,
      [input.assignmentId, input.organizationId, input.userId, input.programIds, input.cohortIds]
    );
    return res.rows.length > 0;
  }

  async addTarget(input: CreateAssignmentTargetInput): Promise<AssignmentTarget | null> {
    const res = await this.dbQuery(
      `INSERT INTO assignment_targets (
        assignment_target_id, assignment_id, organization_id, target_type,
        user_id, cohort_id, program_id, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT DO NOTHING
      RETURNING ${TARGET_COLUMNS}`,
      [
        input.id,
        input.assignmentId,
        input.organizationId,
        input.targetType,
        input.userId ?? null,
        input.cohortId ?? null,
        input.programId ?? null,
        input.createdBy,
      ]
    );
    return res.rows[0] ? rowToTarget(res.rows[0]) : null;
  }

  async listTargets(assignmentId: string): Promise<AssignmentTarget[]> {
    const res = await this.dbQuery(
      `SELECT ${TARGET_COLUMNS} FROM assignment_targets WHERE assignment_id = $1 ORDER BY created_at ASC, assignment_target_id ASC`,
      [assignmentId]
    );
    return res.rows.map(rowToTarget);
  }

  async targetExists(input: { assignmentId: string; organizationId: string; targetType: AssignmentTargetType; userId?: string | null; cohortId?: string | null; programId?: string | null }): Promise<boolean> {
    const res = await this.dbQuery(
      `SELECT 1
       FROM assignment_targets
       WHERE assignment_id = $1
         AND organization_id = $2
         AND target_type = $3
         AND user_id IS NOT DISTINCT FROM $4
         AND cohort_id IS NOT DISTINCT FROM $5
         AND program_id IS NOT DISTINCT FROM $6
       LIMIT 1`,
      [input.assignmentId, input.organizationId, input.targetType, input.userId ?? null, input.cohortId ?? null, input.programId ?? null]
    );
    return res.rows.length > 0;
  }

  /**
   * Verifies every supplied user_id is a real user in the given
   * organization — targeting must never be trusted client input, and
   * must never let an assignment be targeted at a user outside the
   * creator's own organization. Returns the subset of userIds that are
   * NOT valid, so the caller can reject with a precise error.
   */
  async findInvalidTargetUserIds(userIds: string[], organizationId: string): Promise<string[]> {
    if (userIds.length === 0) return [];
    const res = await this.dbQuery(
      `SELECT user_id FROM users WHERE user_id = ANY($1::text[]) AND organization_id = $2`,
      [userIds, organizationId]
    );
    const valid = new Set(res.rows.map((r: any) => r.user_id));
    return userIds.filter((id) => !valid.has(id));
  }

  async listTargetUserIds(assignmentId: string): Promise<string[]> {
    const res = await this.dbQuery(`SELECT user_id FROM assignment_targets WHERE assignment_id = $1 AND target_type = 'LEARNER'`, [assignmentId]);
    return res.rows.map((r: any) => r.user_id).filter(Boolean);
  }
}

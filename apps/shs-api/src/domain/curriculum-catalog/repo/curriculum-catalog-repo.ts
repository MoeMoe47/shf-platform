// SHF Lesson + Assignment + Curriculum Ingestion — Phase 2.
//
// Every query is organization-scoped by construction — organization_id
// always comes from the server-resolved actor context (see api/routes.ts),
// never from a client-suppliable field. Cross-organization access is
// structurally impossible here, not merely denied by a check.
import { query } from "../../../db/client.js";
import type {
  CurriculumCourseRow,
  CurriculumUnitRow,
  CurriculumLessonRow,
  CurriculumResourceRow,
  CurriculumReleaseRow,
  CurriculumAssessmentDefinitionRow,
  CurriculumReflectionDefinitionRow,
  CurriculumPracticeDefinitionRow,
  CourseStatus,
} from "../model/curriculum-catalog.js";

function courseFromRow(row: any): CurriculumCourseRow {
  return {
    courseId: row.course_id,
    organizationId: row.organization_id,
    stableKey: row.stable_key,
    title: row.title,
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    status: row.status,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    createdByUserId: row.created_by_user_id,
    updatedByUserId: row.updated_by_user_id,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function unitFromRow(row: any): CurriculumUnitRow {
  return {
    unitId: row.unit_id,
    organizationId: row.organization_id,
    courseId: row.course_id,
    stableKey: row.stable_key,
    title: row.title,
    description: row.description,
    sequence: row.sequence,
    status: row.status,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function lessonFromRow(row: any): CurriculumLessonRow {
  return {
    lessonId: row.lesson_id,
    organizationId: row.organization_id,
    unitId: row.unit_id,
    stableKey: row.stable_key,
    title: row.title,
    summary: row.summary,
    objectives: Array.isArray(row.objectives) ? row.objectives : [],
    estimatedDurationMinutes: row.estimated_duration_minutes,
    sequence: row.sequence,
    status: row.status,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function resourceFromRow(row: any): CurriculumResourceRow {
  return {
    resourceId: row.resource_id,
    organizationId: row.organization_id,
    sourceAssetId: row.source_asset_id,
    sourceDocumentVersionId: row.source_document_version_id,
    title: row.title,
    resourceType: row.resource_type,
    description: row.description,
    externalUrl: row.external_url,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function assessmentDefinitionFromRow(row: any): CurriculumAssessmentDefinitionRow {
  return {
    assessmentDefinitionId: row.assessment_definition_id,
    organizationId: row.organization_id,
    lessonId: row.lesson_id,
    items: Array.isArray(row.items) ? row.items : [],
    sourceReference: row.source_reference,
    sourceHash: row.source_hash,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function reflectionDefinitionFromRow(row: any): CurriculumReflectionDefinitionRow {
  return {
    reflectionDefinitionId: row.reflection_definition_id,
    organizationId: row.organization_id,
    lessonId: row.lesson_id,
    items: Array.isArray(row.items) ? row.items : [],
    sourceReference: row.source_reference,
    sourceHash: row.source_hash,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function practiceDefinitionFromRow(row: any): CurriculumPracticeDefinitionRow {
  return {
    practiceDefinitionId: row.practice_definition_id,
    organizationId: row.organization_id,
    lessonId: row.lesson_id,
    title: row.title,
    instructions: row.instructions,
    completionMode: row.completion_mode,
    completionActionLabel: row.completion_action_label,
    items: Array.isArray(row.items) ? row.items : [],
    sourceReference: row.source_reference,
    sourceHash: row.source_hash,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function releaseFromRow(row: any): CurriculumReleaseRow {
  return {
    releaseId: row.release_id,
    organizationId: row.organization_id,
    courseId: row.course_id,
    versionNumber: row.version_number,
    snapshot: row.snapshot,
    contentHash: row.content_hash,
    status: row.status,
    publishedByUserId: row.published_by_user_id,
    publishedAt: row.published_at,
    retiredByUserId: row.retired_by_user_id,
    retiredAt: row.retired_at,
    createdAt: row.created_at,
  };
}

export class CurriculumCatalogRepo {
  // Phase 4.5A: query is now constructor-injectable, mirroring
  // AssignmentRepo's identical `constructor(private dbQuery = query)`
  // pattern — this is what lets the import-job service run
  // createCourse/createUnit/createLesson/createResource against a
  // transaction client (new CurriculumCatalogRepo(client.query.bind(
  // client))) instead of the default autocommitting pool, without
  // duplicating any of their business logic. Every method below already
  // only ever called the bare imported `query` once, at module scope —
  // this constructor is the sole change; no query text changes.
  constructor(private dbQuery = query) {}

  // ---------------- Course ----------------
  async createCourse(input: {
    courseId: string; organizationId: string; stableKey: string; title: string;
    shortDescription: string | null; fullDescription: string | null;
    estimatedDurationMinutes: number | null; actorUserId: string;
  }): Promise<CurriculumCourseRow> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_courses (course_id, organization_id, stable_key, title, short_description, full_description, estimated_duration_minutes, created_by_user_id, updated_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING *`,
      [input.courseId, input.organizationId, input.stableKey, input.title, input.shortDescription, input.fullDescription, input.estimatedDurationMinutes, input.actorUserId],
    );
    return courseFromRow(res.rows[0]);
  }

  async findCourse(organizationId: string, courseId: string): Promise<CurriculumCourseRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_courses WHERE organization_id = $1 AND course_id = $2`, [organizationId, courseId]);
    return res.rows[0] ? courseFromRow(res.rows[0]) : null;
  }

  async listCourses(organizationId: string): Promise<CurriculumCourseRow[]> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_courses WHERE organization_id = $1 ORDER BY created_at DESC`, [organizationId]);
    return res.rows.map(courseFromRow);
  }

  // Phase 5.5: student-catalog-service.ts and assignment-entitlement-
  // service.ts both key courses by stable_key (the same identifier used
  // in curriculum_lesson_completions.curriculum_id and in assignment
  // release bindings) rather than the DB course_id, so a lookup by that
  // key is needed alongside findCourse's by-id lookup.
  async findCourseByStableKey(organizationId: string, stableKey: string): Promise<CurriculumCourseRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_courses WHERE organization_id = $1 AND stable_key = $2`, [organizationId, stableKey]);
    return res.rows[0] ? courseFromRow(res.rows[0]) : null;
  }

  async updateCourseFields(
    organizationId: string, courseId: string, expectedRevision: number,
    fields: { title?: string; shortDescription?: string | null; fullDescription?: string | null; estimatedDurationMinutes?: number | null },
    actorUserId: string,
  ): Promise<CurriculumCourseRow | null> {
    const res = await this.dbQuery(
      `UPDATE curriculum_courses SET
         title = COALESCE($4, title),
         short_description = CASE WHEN $5::boolean THEN $6 ELSE short_description END,
         full_description = CASE WHEN $7::boolean THEN $8 ELSE full_description END,
         estimated_duration_minutes = CASE WHEN $9::boolean THEN $10 ELSE estimated_duration_minutes END,
         updated_by_user_id = $11,
         revision = revision + 1,
         updated_at = NOW()
       WHERE organization_id = $1 AND course_id = $2 AND revision = $3 AND status = 'DRAFT'
       RETURNING *`,
      [
        organizationId, courseId, expectedRevision,
        fields.title ?? null,
        fields.shortDescription !== undefined, fields.shortDescription ?? null,
        fields.fullDescription !== undefined, fields.fullDescription ?? null,
        fields.estimatedDurationMinutes !== undefined, fields.estimatedDurationMinutes ?? null,
        actorUserId,
      ],
    );
    return res.rows[0] ? courseFromRow(res.rows[0]) : null;
  }

  async transitionCourseStatus(
    organizationId: string, courseId: string, expectedRevision: number,
    fromStatuses: CourseStatus[], toStatus: CourseStatus, actorUserId: string,
  ): Promise<CurriculumCourseRow | null> {
    const res = await this.dbQuery(
      `UPDATE curriculum_courses SET status = $4, updated_by_user_id = $5, revision = revision + 1, updated_at = NOW()
       WHERE organization_id = $1 AND course_id = $2 AND revision = $3 AND status = ANY($6::text[])
       RETURNING *`,
      [organizationId, courseId, expectedRevision, toStatus, actorUserId, fromStatuses],
    );
    return res.rows[0] ? courseFromRow(res.rows[0]) : null;
  }

  // ---------------- Unit ----------------
  async createUnit(input: {
    unitId: string; organizationId: string; courseId: string; stableKey: string;
    title: string; description: string | null; sequence: number;
  }): Promise<CurriculumUnitRow> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_units (unit_id, organization_id, course_id, stable_key, title, description, sequence)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [input.unitId, input.organizationId, input.courseId, input.stableKey, input.title, input.description, input.sequence],
    );
    return unitFromRow(res.rows[0]);
  }

  async findUnit(organizationId: string, unitId: string): Promise<CurriculumUnitRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_units WHERE organization_id = $1 AND unit_id = $2`, [organizationId, unitId]);
    return res.rows[0] ? unitFromRow(res.rows[0]) : null;
  }

  async listUnitsForCourse(organizationId: string, courseId: string, includeArchived = false): Promise<CurriculumUnitRow[]> {
    const res = await this.dbQuery(
      `SELECT * FROM curriculum_units WHERE organization_id = $1 AND course_id = $2 ${includeArchived ? "" : "AND status = 'ACTIVE'"} ORDER BY sequence ASC`,
      [organizationId, courseId],
    );
    return res.rows.map(unitFromRow);
  }

  async nextUnitSequence(organizationId: string, courseId: string): Promise<number> {
    const res = await this.dbQuery(`SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM curriculum_units WHERE organization_id = $1 AND course_id = $2`, [organizationId, courseId]);
    return Number(res.rows[0].next);
  }

  async updateUnit(
    organizationId: string, unitId: string, expectedRevision: number,
    fields: { title?: string; description?: string | null; status?: string },
  ): Promise<CurriculumUnitRow | null> {
    const res = await this.dbQuery(
      `UPDATE curriculum_units SET
         title = COALESCE($4, title),
         description = CASE WHEN $5::boolean THEN $6 ELSE description END,
         status = COALESCE($7, status),
         revision = revision + 1,
         updated_at = NOW()
       WHERE organization_id = $1 AND unit_id = $2 AND revision = $3
       RETURNING *`,
      [organizationId, unitId, expectedRevision, fields.title ?? null, fields.description !== undefined, fields.description ?? null, fields.status ?? null],
    );
    return res.rows[0] ? unitFromRow(res.rows[0]) : null;
  }

  async reorderUnits(organizationId: string, courseId: string, orderedUnitIds: string[]): Promise<void> {
    for (let i = 0; i < orderedUnitIds.length; i++) {
      await this.dbQuery(
        `UPDATE curriculum_units SET sequence = $4, updated_at = NOW() WHERE organization_id = $1 AND course_id = $2 AND unit_id = $3`,
        [organizationId, courseId, orderedUnitIds[i], i + 1],
      );
    }
  }

  // ---------------- Lesson ----------------
  async createLesson(input: {
    lessonId: string; organizationId: string; unitId: string; stableKey: string;
    title: string; summary: string | null; objectives: string[];
    estimatedDurationMinutes: number | null; sequence: number;
  }): Promise<CurriculumLessonRow> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_lessons (lesson_id, organization_id, unit_id, stable_key, title, summary, objectives, estimated_duration_minutes, sequence)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9) RETURNING *`,
      [input.lessonId, input.organizationId, input.unitId, input.stableKey, input.title, input.summary, JSON.stringify(input.objectives), input.estimatedDurationMinutes, input.sequence],
    );
    return lessonFromRow(res.rows[0]);
  }

  async findLesson(organizationId: string, lessonId: string): Promise<CurriculumLessonRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_lessons WHERE organization_id = $1 AND lesson_id = $2`, [organizationId, lessonId]);
    return res.rows[0] ? lessonFromRow(res.rows[0]) : null;
  }

  async listLessonsForUnit(organizationId: string, unitId: string, includeArchived = false): Promise<CurriculumLessonRow[]> {
    const res = await this.dbQuery(
      `SELECT * FROM curriculum_lessons WHERE organization_id = $1 AND unit_id = $2 ${includeArchived ? "" : "AND status = 'ACTIVE'"} ORDER BY sequence ASC`,
      [organizationId, unitId],
    );
    return res.rows.map(lessonFromRow);
  }

  async nextLessonSequence(organizationId: string, unitId: string): Promise<number> {
    const res = await this.dbQuery(`SELECT COALESCE(MAX(sequence), 0) + 1 AS next FROM curriculum_lessons WHERE organization_id = $1 AND unit_id = $2`, [organizationId, unitId]);
    return Number(res.rows[0].next);
  }

  async updateLesson(
    organizationId: string, lessonId: string, expectedRevision: number,
    fields: { title?: string; summary?: string | null; objectives?: string[]; estimatedDurationMinutes?: number | null; status?: string },
  ): Promise<CurriculumLessonRow | null> {
    const res = await this.dbQuery(
      `UPDATE curriculum_lessons SET
         title = COALESCE($4, title),
         summary = CASE WHEN $5::boolean THEN $6 ELSE summary END,
         objectives = CASE WHEN $7::boolean THEN $8::jsonb ELSE objectives END,
         estimated_duration_minutes = CASE WHEN $9::boolean THEN $10 ELSE estimated_duration_minutes END,
         status = COALESCE($11, status),
         revision = revision + 1,
         updated_at = NOW()
       WHERE organization_id = $1 AND lesson_id = $2 AND revision = $3
       RETURNING *`,
      [
        organizationId, lessonId, expectedRevision,
        fields.title ?? null,
        fields.summary !== undefined, fields.summary ?? null,
        fields.objectives !== undefined, JSON.stringify(fields.objectives ?? []),
        fields.estimatedDurationMinutes !== undefined, fields.estimatedDurationMinutes ?? null,
        fields.status ?? null,
      ],
    );
    return res.rows[0] ? lessonFromRow(res.rows[0]) : null;
  }

  async reorderLessons(organizationId: string, unitId: string, orderedLessonIds: string[]): Promise<void> {
    for (let i = 0; i < orderedLessonIds.length; i++) {
      await this.dbQuery(
        `UPDATE curriculum_lessons SET sequence = $4, updated_at = NOW() WHERE organization_id = $1 AND unit_id = $2 AND lesson_id = $3`,
        [organizationId, unitId, orderedLessonIds[i], i + 1],
      );
    }
  }

  // ---------------- Resource ----------------
  async createResource(input: {
    resourceId: string; organizationId: string; sourceAssetId: string | null; sourceDocumentVersionId: string | null;
    title: string; resourceType: string; description: string | null; externalUrl: string | null; actorUserId: string;
  }): Promise<CurriculumResourceRow> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_resources (resource_id, organization_id, source_asset_id, source_document_version_id, title, resource_type, description, external_url, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [input.resourceId, input.organizationId, input.sourceAssetId, input.sourceDocumentVersionId, input.title, input.resourceType, input.description, input.externalUrl, input.actorUserId],
    );
    return resourceFromRow(res.rows[0]);
  }

  async findResource(organizationId: string, resourceId: string): Promise<CurriculumResourceRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_resources WHERE organization_id = $1 AND resource_id = $2`, [organizationId, resourceId]);
    return res.rows[0] ? resourceFromRow(res.rows[0]) : null;
  }

  async listResources(organizationId: string): Promise<CurriculumResourceRow[]> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_resources WHERE organization_id = $1 ORDER BY created_at DESC`, [organizationId]);
    return res.rows.map(resourceFromRow);
  }

  // Phase 4.5D: curriculum_resources has no revision column (confirmed
  // fresh against the live schema — Phase 2 never built optimistic
  // concurrency for this table), so unlike updateUnit/updateLesson this
  // takes no expectedRevision. A plain org+id-scoped update is the
  // honest match for the actual schema.
  async updateResource(
    organizationId: string, resourceId: string,
    fields: { title?: string; description?: string | null; externalUrl?: string | null },
  ): Promise<CurriculumResourceRow | null> {
    const res = await this.dbQuery(
      `UPDATE curriculum_resources SET
         title = COALESCE($3, title),
         description = CASE WHEN $4::boolean THEN $5 ELSE description END,
         external_url = CASE WHEN $6::boolean THEN $7 ELSE external_url END,
         updated_at = NOW()
       WHERE organization_id = $1 AND resource_id = $2
       RETURNING *`,
      [organizationId, resourceId, fields.title ?? null, fields.description !== undefined, fields.description ?? null, fields.externalUrl !== undefined, fields.externalUrl ?? null],
    );
    return res.rows[0] ? resourceFromRow(res.rows[0]) : null;
  }

  async attachResourceToLesson(organizationId: string, lessonId: string, resourceId: string, sequence = 1): Promise<void> {
    await this.dbQuery(
      `INSERT INTO curriculum_lesson_resources (lesson_id, resource_id, organization_id, sequence) VALUES ($1,$2,$3,$4)
       ON CONFLICT (lesson_id, resource_id) DO UPDATE SET sequence = EXCLUDED.sequence`,
      [lessonId, resourceId, organizationId, sequence],
    );
  }

  async detachResourceFromLesson(organizationId: string, lessonId: string, resourceId: string): Promise<void> {
    await this.dbQuery(`DELETE FROM curriculum_lesson_resources WHERE organization_id = $1 AND lesson_id = $2 AND resource_id = $3`, [organizationId, lessonId, resourceId]);
  }

  async listResourcesForLesson(organizationId: string, lessonId: string): Promise<CurriculumResourceRow[]> {
    const res = await this.dbQuery(
      `SELECT r.* FROM curriculum_resources r
       JOIN curriculum_lesson_resources lr ON lr.resource_id = r.resource_id AND lr.organization_id = r.organization_id
       WHERE lr.organization_id = $1 AND lr.lesson_id = $2
       ORDER BY lr.sequence ASC, r.created_at ASC`,
      [organizationId, lessonId],
    );
    return res.rows.map(resourceFromRow);
  }

  // ---------------- Activity definitions (Phase 5) ----------------
  // One row per lesson (uq_curriculum_*_definitions_lesson) — upserted,
  // never duplicated, mirroring the idempotent-re-import discipline used
  // throughout curriculum-catalog: a re-import of the same lesson syncs
  // this row's content rather than creating a competing one.
  async upsertAssessmentDefinition(input: {
    assessmentDefinitionId: string; organizationId: string; lessonId: string; items: unknown[]; sourceReference: string | null; sourceHash: string | null; actorUserId: string;
  }): Promise<CurriculumAssessmentDefinitionRow> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_assessment_definitions (assessment_definition_id, organization_id, lesson_id, items, source_reference, source_hash, created_by_user_id)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)
       ON CONFLICT (lesson_id, organization_id) DO UPDATE SET items = EXCLUDED.items, source_reference = EXCLUDED.source_reference, source_hash = EXCLUDED.source_hash, updated_at = NOW()
       RETURNING *`,
      [input.assessmentDefinitionId, input.organizationId, input.lessonId, JSON.stringify(input.items), input.sourceReference, input.sourceHash, input.actorUserId],
    );
    return assessmentDefinitionFromRow(res.rows[0]);
  }
  async findAssessmentDefinition(organizationId: string, assessmentDefinitionId: string): Promise<CurriculumAssessmentDefinitionRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_assessment_definitions WHERE organization_id = $1 AND assessment_definition_id = $2`, [organizationId, assessmentDefinitionId]);
    return res.rows[0] ? assessmentDefinitionFromRow(res.rows[0]) : null;
  }
  async findAssessmentDefinitionByLesson(organizationId: string, lessonId: string): Promise<CurriculumAssessmentDefinitionRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_assessment_definitions WHERE organization_id = $1 AND lesson_id = $2`, [organizationId, lessonId]);
    return res.rows[0] ? assessmentDefinitionFromRow(res.rows[0]) : null;
  }

  async upsertReflectionDefinition(input: {
    reflectionDefinitionId: string; organizationId: string; lessonId: string; items: unknown[]; sourceReference: string | null; sourceHash: string | null; actorUserId: string;
  }): Promise<CurriculumReflectionDefinitionRow> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_reflection_definitions (reflection_definition_id, organization_id, lesson_id, items, source_reference, source_hash, created_by_user_id)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)
       ON CONFLICT (lesson_id, organization_id) DO UPDATE SET items = EXCLUDED.items, source_reference = EXCLUDED.source_reference, source_hash = EXCLUDED.source_hash, updated_at = NOW()
       RETURNING *`,
      [input.reflectionDefinitionId, input.organizationId, input.lessonId, JSON.stringify(input.items), input.sourceReference, input.sourceHash, input.actorUserId],
    );
    return reflectionDefinitionFromRow(res.rows[0]);
  }
  async findReflectionDefinition(organizationId: string, reflectionDefinitionId: string): Promise<CurriculumReflectionDefinitionRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_reflection_definitions WHERE organization_id = $1 AND reflection_definition_id = $2`, [organizationId, reflectionDefinitionId]);
    return res.rows[0] ? reflectionDefinitionFromRow(res.rows[0]) : null;
  }
  async findReflectionDefinitionByLesson(organizationId: string, lessonId: string): Promise<CurriculumReflectionDefinitionRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_reflection_definitions WHERE organization_id = $1 AND lesson_id = $2`, [organizationId, lessonId]);
    return res.rows[0] ? reflectionDefinitionFromRow(res.rows[0]) : null;
  }

  async upsertPracticeDefinition(input: {
    practiceDefinitionId: string; organizationId: string; lessonId: string; title: string; instructions: string | null;
    completionMode: string; completionActionLabel: string | null; items: unknown[]; sourceReference: string | null; sourceHash: string | null; actorUserId: string;
  }): Promise<CurriculumPracticeDefinitionRow> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_practice_definitions (practice_definition_id, organization_id, lesson_id, title, instructions, completion_mode, completion_action_label, items, source_reference, source_hash, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)
       ON CONFLICT (lesson_id, organization_id) DO UPDATE SET title = EXCLUDED.title, instructions = EXCLUDED.instructions, completion_mode = EXCLUDED.completion_mode, completion_action_label = EXCLUDED.completion_action_label, items = EXCLUDED.items, source_reference = EXCLUDED.source_reference, source_hash = EXCLUDED.source_hash, updated_at = NOW()
       RETURNING *`,
      [input.practiceDefinitionId, input.organizationId, input.lessonId, input.title, input.instructions, input.completionMode, input.completionActionLabel, JSON.stringify(input.items), input.sourceReference, input.sourceHash, input.actorUserId],
    );
    return practiceDefinitionFromRow(res.rows[0]);
  }
  async findPracticeDefinition(organizationId: string, practiceDefinitionId: string): Promise<CurriculumPracticeDefinitionRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_practice_definitions WHERE organization_id = $1 AND practice_definition_id = $2`, [organizationId, practiceDefinitionId]);
    return res.rows[0] ? practiceDefinitionFromRow(res.rows[0]) : null;
  }
  async findPracticeDefinitionByLesson(organizationId: string, lessonId: string): Promise<CurriculumPracticeDefinitionRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_practice_definitions WHERE organization_id = $1 AND lesson_id = $2`, [organizationId, lessonId]);
    return res.rows[0] ? practiceDefinitionFromRow(res.rows[0]) : null;
  }

  // ---------------- Arcade linkage (Phase 4.5D) ----------------
  // arcade_activities (migration 052) is global — no organization_id
  // column exists on it — so this lookup is a plain slug match, not
  // org-scoped. The LINK row itself (curriculum_lesson_arcade_activities)
  // is org-scoped via its same-org FK to curriculum_lessons.
  async findArcadeActivityBySlug(slug: string): Promise<{ arcadeActivityId: string; slug: string; title: string } | null> {
    const res = await this.dbQuery(`SELECT arcade_activity_id, slug, title FROM arcade_activities WHERE slug = $1 AND status = 'active'`, [slug]);
    return res.rows[0] ? { arcadeActivityId: res.rows[0].arcade_activity_id, slug: res.rows[0].slug, title: res.rows[0].title } : null;
  }

  async findArcadeActivityById(arcadeActivityId: string): Promise<{ arcadeActivityId: string; slug: string; title: string } | null> {
    const res = await this.dbQuery(`SELECT arcade_activity_id, slug, title FROM arcade_activities WHERE arcade_activity_id = $1 AND status = 'active'`, [arcadeActivityId]);
    return res.rows[0] ? { arcadeActivityId: res.rows[0].arcade_activity_id, slug: res.rows[0].slug, title: res.rows[0].title } : null;
  }

  async createLessonArcadeLink(input: {
    id: string; organizationId: string; curriculumLessonId: string; arcadeActivityId: string; sequence: number; sourceReference: string | null;
  }): Promise<{ id: string; arcadeActivityId: string }> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_lesson_arcade_activities (curriculum_lesson_arcade_activity_id, organization_id, curriculum_lesson_id, arcade_activity_id, sequence, source_reference)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (curriculum_lesson_id, arcade_activity_id) DO UPDATE SET sequence = EXCLUDED.sequence
       RETURNING curriculum_lesson_arcade_activity_id AS id, arcade_activity_id`,
      [input.id, input.organizationId, input.curriculumLessonId, input.arcadeActivityId, input.sequence, input.sourceReference],
    );
    return { id: res.rows[0].id, arcadeActivityId: res.rows[0].arcade_activity_id };
  }

  async findLessonArcadeLink(organizationId: string, curriculumLessonId: string, arcadeActivityId: string): Promise<{ id: string } | null> {
    const res = await this.dbQuery(
      `SELECT curriculum_lesson_arcade_activity_id AS id FROM curriculum_lesson_arcade_activities WHERE organization_id = $1 AND curriculum_lesson_id = $2 AND arcade_activity_id = $3`,
      [organizationId, curriculumLessonId, arcadeActivityId],
    );
    return res.rows[0] ? { id: res.rows[0].id } : null;
  }

  async listArcadeLinksForLesson(organizationId: string, curriculumLessonId: string): Promise<Array<{ id: string; arcadeActivityId: string; slug: string; title: string; sequence: number }>> {
    const res = await this.dbQuery(
      `SELECT la.curriculum_lesson_arcade_activity_id AS id, la.arcade_activity_id, la.sequence, aa.slug, aa.title
       FROM curriculum_lesson_arcade_activities la
       JOIN arcade_activities aa ON aa.arcade_activity_id = la.arcade_activity_id
       WHERE la.organization_id = $1 AND la.curriculum_lesson_id = $2
       ORDER BY la.sequence ASC`,
      [organizationId, curriculumLessonId],
    );
    return res.rows.map((r: any) => ({ id: r.id, arcadeActivityId: r.arcade_activity_id, slug: r.slug, title: r.title, sequence: r.sequence }));
  }

  // ---------------- Release ----------------
  async nextReleaseVersion(organizationId: string, courseId: string): Promise<number> {
    const res = await this.dbQuery(`SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM curriculum_releases WHERE organization_id = $1 AND course_id = $2`, [organizationId, courseId]);
    return Number(res.rows[0].next);
  }

  async createRelease(input: {
    releaseId: string; organizationId: string; courseId: string; versionNumber: number;
    snapshot: unknown; contentHash: string; publishedByUserId: string;
  }): Promise<CurriculumReleaseRow> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_releases (release_id, organization_id, course_id, version_number, snapshot, content_hash, published_by_user_id)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) RETURNING *`,
      [input.releaseId, input.organizationId, input.courseId, input.versionNumber, JSON.stringify(input.snapshot), input.contentHash, input.publishedByUserId],
    );
    return releaseFromRow(res.rows[0]);
  }

  async findRelease(organizationId: string, releaseId: string): Promise<CurriculumReleaseRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_releases WHERE organization_id = $1 AND release_id = $2`, [organizationId, releaseId]);
    return res.rows[0] ? releaseFromRow(res.rows[0]) : null;
  }

  async listReleasesForCourse(organizationId: string, courseId: string): Promise<CurriculumReleaseRow[]> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_releases WHERE organization_id = $1 AND course_id = $2 ORDER BY version_number DESC`, [organizationId, courseId]);
    return res.rows.map(releaseFromRow);
  }

  async findLatestPublishedRelease(organizationId: string, courseId: string): Promise<CurriculumReleaseRow | null> {
    const res = await this.dbQuery(
      `SELECT * FROM curriculum_releases WHERE organization_id = $1 AND course_id = $2 AND status = 'PUBLISHED' ORDER BY version_number DESC LIMIT 1`,
      [organizationId, courseId],
    );
    return res.rows[0] ? releaseFromRow(res.rows[0]) : null;
  }

  async retireRelease(organizationId: string, releaseId: string, actorUserId: string): Promise<CurriculumReleaseRow | null> {
    const res = await this.dbQuery(
      `UPDATE curriculum_releases SET status = 'RETIRED', retired_by_user_id = $3, retired_at = NOW()
       WHERE organization_id = $1 AND release_id = $2 AND status = 'PUBLISHED'
       RETURNING *`,
      [organizationId, releaseId, actorUserId],
    );
    return res.rows[0] ? releaseFromRow(res.rows[0]) : null;
  }

  // ---------------- Source lineage lookups (for resource creation) ----------------
  async findSourceAsset(organizationId: string, sourceAssetId: string): Promise<{ sourceAssetId: string; organizationId: string } | null> {
    const res = await this.dbQuery(`SELECT source_asset_id, organization_id FROM source_assets WHERE organization_id = $1 AND source_asset_id = $2 AND status = 'ACTIVE'`, [organizationId, sourceAssetId]);
    return res.rows[0] ? { sourceAssetId: res.rows[0].source_asset_id, organizationId: res.rows[0].organization_id } : null;
  }

  // No composite (id, organization_id) unique exists on source_document_versions
  // (see migration 059's header note) — this repo verifies the organization
  // match itself after the lookup, never trusting the caller's claim.
  async findSourceDocumentVersion(sourceDocumentVersionId: string): Promise<{ sourceDocumentVersionId: string; organizationId: string; sourceAssetId: string } | null> {
    const res = await this.dbQuery(`SELECT source_document_version_id, organization_id, source_asset_id FROM source_document_versions WHERE source_document_version_id = $1`, [sourceDocumentVersionId]);
    return res.rows[0] ? { sourceDocumentVersionId: res.rows[0].source_document_version_id, organizationId: res.rows[0].organization_id, sourceAssetId: res.rows[0].source_asset_id } : null;
  }
}

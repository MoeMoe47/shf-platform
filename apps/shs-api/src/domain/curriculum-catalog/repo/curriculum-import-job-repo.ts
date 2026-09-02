// SHF Lesson + Assignment + Curriculum — Phase 4.5A.
//
// Every query is organization-scoped by construction, matching every
// other repo in this codebase — organization_id always comes from the
// server-resolved actor context, never a client-suppliable field.
//
// `dbQuery` is constructor-injectable (default: the plain pool `query`)
// so the import-job service can run this repo against a transaction
// client — see CurriculumCatalogRepo's identical pattern, added in this
// same phase for the same reason.
import { randomBytes } from "node:crypto";
import { query } from "../../../db/client.js";
import type {
  CurriculumImportJobRow,
  CurriculumImportCandidateRow,
  ImportJobStatus,
  CandidateType,
  CandidateDiffStatus,
} from "../model/curriculum-import-job.js";

function jobFromRow(row: any): CurriculumImportJobRow {
  return {
    importJobId: row.import_job_id,
    organizationId: row.organization_id,
    importType: row.import_type,
    sourceAssetId: row.source_asset_id,
    sourceDocumentVersionId: row.source_document_version_id,
    sourceKey: row.source_key,
    status: row.status,
    createdByUserId: row.created_by_user_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    failedAt: row.failed_at,
    errorSummary: row.error_summary,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function candidateFromRow(row: any): CurriculumImportCandidateRow {
  return {
    importCandidateId: row.import_candidate_id,
    importJobId: row.import_job_id,
    organizationId: row.organization_id,
    candidateType: row.candidate_type,
    parentCandidateId: row.parent_candidate_id,
    stableKey: row.stable_key,
    title: row.title,
    sequence: row.sequence,
    sourceReference: row.source_reference,
    payload: row.payload && typeof row.payload === "object" ? row.payload : {},
    validationStatus: row.validation_status,
    validationErrors: Array.isArray(row.validation_errors) ? row.validation_errors : [],
    included: row.included,
    createdEntityType: row.created_entity_type,
    createdEntityId: row.created_entity_id,
    sourceHash: row.source_hash,
    diffStatus: row.diff_status,
    previousCandidateId: row.previous_candidate_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function newImportId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString("hex")}`;
}

export class CurriculumImportJobRepo {
  constructor(private dbQuery = query) {}

  // ---------------- Job ----------------
  async createJob(input: {
    importJobId: string; organizationId: string; importType: string;
    sourceAssetId: string | null; sourceDocumentVersionId: string | null; sourceKey: string | null;
    createdByUserId: string; metadata: Record<string, unknown>;
  }): Promise<CurriculumImportJobRow> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_import_jobs (import_job_id, organization_id, import_type, source_asset_id, source_document_version_id, source_key, created_by_user_id, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING *`,
      [input.importJobId, input.organizationId, input.importType, input.sourceAssetId, input.sourceDocumentVersionId, input.sourceKey, input.createdByUserId, JSON.stringify(input.metadata)],
    );
    return jobFromRow(res.rows[0]);
  }

  async findJob(organizationId: string, importJobId: string): Promise<CurriculumImportJobRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_import_jobs WHERE organization_id = $1 AND import_job_id = $2`, [organizationId, importJobId]);
    return res.rows[0] ? jobFromRow(res.rows[0]) : null;
  }

  async listJobs(organizationId: string): Promise<CurriculumImportJobRow[]> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_import_jobs WHERE organization_id = $1 ORDER BY created_at DESC`, [organizationId]);
    return res.rows.map(jobFromRow);
  }

  async updateJobStatus(
    organizationId: string, importJobId: string, expectedRevision: number,
    fields: { status: ImportJobStatus; startedAt?: Date | null; completedAt?: Date | null; failedAt?: Date | null; errorSummary?: string | null; metadataPatch?: Record<string, unknown> },
  ): Promise<CurriculumImportJobRow | null> {
    const res = await this.dbQuery(
      `UPDATE curriculum_import_jobs SET
         status = $4,
         started_at = CASE WHEN $5::boolean THEN $6 ELSE started_at END,
         completed_at = CASE WHEN $7::boolean THEN $8 ELSE completed_at END,
         failed_at = CASE WHEN $9::boolean THEN $10 ELSE failed_at END,
         error_summary = CASE WHEN $11::boolean THEN $12 ELSE error_summary END,
         metadata = CASE WHEN $13::boolean THEN metadata || $14::jsonb ELSE metadata END,
         revision = revision + 1,
         updated_at = NOW()
       WHERE organization_id = $1 AND import_job_id = $2 AND revision = $3
       RETURNING *`,
      [
        organizationId, importJobId, expectedRevision, fields.status,
        fields.startedAt !== undefined, fields.startedAt ?? null,
        fields.completedAt !== undefined, fields.completedAt ?? null,
        fields.failedAt !== undefined, fields.failedAt ?? null,
        fields.errorSummary !== undefined, fields.errorSummary ?? null,
        fields.metadataPatch !== undefined, JSON.stringify(fields.metadataPatch ?? {}),
      ],
    );
    return res.rows[0] ? jobFromRow(res.rows[0]) : null;
  }

  // ---------------- Candidates ----------------
  async createCandidate(input: {
    importCandidateId: string; importJobId: string; organizationId: string; candidateType: CandidateType;
    parentCandidateId: string | null; stableKey: string; title: string; sequence: number;
    sourceReference: string | null; payload: Record<string, unknown>;
    sourceHash?: string | null; diffStatus?: CandidateDiffStatus | null; previousCandidateId?: string | null;
    createdEntityType?: CandidateType | null; createdEntityId?: string | null;
  }): Promise<CurriculumImportCandidateRow> {
    const res = await this.dbQuery(
      `INSERT INTO curriculum_import_candidates (import_candidate_id, import_job_id, organization_id, candidate_type, parent_candidate_id, stable_key, title, sequence, source_reference, payload, source_hash, diff_status, previous_candidate_id, created_entity_type, created_entity_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14,$15) RETURNING *`,
      [
        input.importCandidateId, input.importJobId, input.organizationId, input.candidateType, input.parentCandidateId,
        input.stableKey, input.title, input.sequence, input.sourceReference, JSON.stringify(input.payload),
        input.sourceHash ?? null, input.diffStatus ?? null, input.previousCandidateId ?? null,
        input.createdEntityType ?? null, input.createdEntityId ?? null,
      ],
    );
    return candidateFromRow(res.rows[0]);
  }

  async listCandidates(organizationId: string, importJobId: string): Promise<CurriculumImportCandidateRow[]> {
    const res = await this.dbQuery(
      `SELECT * FROM curriculum_import_candidates WHERE organization_id = $1 AND import_job_id = $2 ORDER BY sequence ASC, created_at ASC`,
      [organizationId, importJobId],
    );
    return res.rows.map(candidateFromRow);
  }

  async findCandidate(organizationId: string, importCandidateId: string): Promise<CurriculumImportCandidateRow | null> {
    const res = await this.dbQuery(`SELECT * FROM curriculum_import_candidates WHERE organization_id = $1 AND import_candidate_id = $2`, [organizationId, importCandidateId]);
    return res.rows[0] ? candidateFromRow(res.rows[0]) : null;
  }

  async setCandidateValidation(organizationId: string, importCandidateId: string, validationStatus: "VALID" | "INVALID", validationErrors: string[]): Promise<void> {
    await this.dbQuery(
      `UPDATE curriculum_import_candidates SET validation_status = $3, validation_errors = $4::jsonb, updated_at = NOW() WHERE organization_id = $1 AND import_candidate_id = $2`,
      [organizationId, importCandidateId, validationStatus, JSON.stringify(validationErrors)],
    );
  }

  // Phase 4.6 (Step 40): the smallest safe mutation contract for staff
  // to correct a proposed mapping before execution — title, sequence,
  // and inclusion only. Canonical identity (stableKey), diff status, and
  // provenance are never editable through this path; they are backend-
  // computed facts, not opinions.
  async updateCandidateFields(organizationId: string, importCandidateId: string, fields: { title?: string; sequence?: number; included?: boolean }): Promise<CurriculumImportCandidateRow | null> {
    const res = await this.dbQuery(
      `UPDATE curriculum_import_candidates SET
         title = COALESCE($3, title),
         sequence = COALESCE($4, sequence),
         included = COALESCE($5, included),
         updated_at = NOW()
       WHERE organization_id = $1 AND import_candidate_id = $2
       RETURNING *`,
      [organizationId, importCandidateId, fields.title ?? null, fields.sequence ?? null, fields.included ?? null],
    );
    return res.rows[0] ? candidateFromRow(res.rows[0]) : null;
  }

  async markCandidateCreated(organizationId: string, importCandidateId: string, createdEntityType: CandidateType, createdEntityId: string): Promise<void> {
    await this.dbQuery(
      `UPDATE curriculum_import_candidates SET created_entity_type = $3, created_entity_id = $4, updated_at = NOW() WHERE organization_id = $1 AND import_candidate_id = $2`,
      [organizationId, importCandidateId, createdEntityType, createdEntityId],
    );
  }

  // Phase 4.5B: the most recent candidate (any job, same org) that
  // previously produced a given canonical catalog entity — the lookup
  // the re-import diff algorithm runs once per existing catalog entity to
  // find its last-known source_hash for UNCHANGED/MODIFIED comparison and
  // to link previous_candidate_id for continuity (Step 21).
  async findLatestCandidateForEntity(organizationId: string, createdEntityType: CandidateType, createdEntityId: string): Promise<CurriculumImportCandidateRow | null> {
    const res = await this.dbQuery(
      `SELECT * FROM curriculum_import_candidates
       WHERE organization_id = $1 AND created_entity_type = $2 AND created_entity_id = $3
       ORDER BY created_at DESC LIMIT 1`,
      [organizationId, createdEntityType, createdEntityId],
    );
    return res.rows[0] ? candidateFromRow(res.rows[0]) : null;
  }
}

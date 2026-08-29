import { query } from "../../db/client.js";

function mapRow(row: any) {
  if (!row) return null;
  return {
    id: row.report_id,
    reportId: row.report_id,
    report_id: row.report_id,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    reportType: row.report_type,
    title: row.report_title,
    subjectType: row.subject_type,
    subjectName: row.subject_name,
    brandMode: row.brand_mode,
    visibility: row.visibility,
    lifecycleStatus: row.lifecycle_status,
    dataMode: "draft",
    createdBy: row.created_by_user_id,
    updatedBy: row.updated_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reportVersion: `v${row.version}`,
    version: row.version,
    ...(row.draft_config_json || {}),
  };
}

export class ReportDraftRepo {
  async createDraft(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_drafts (
        report_id, tenant_id, organization_id, created_by_user_id, updated_by_user_id,
        report_type, report_title, subject_type, subject_name, brand_mode, visibility,
        lifecycle_status, version, draft_config_json
      ) VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9,$10,'draft',1,$11::jsonb)
      RETURNING *`,
      [
        input.report_id,
        input.tenant_id,
        input.organization_id,
        input.actor_id,
        input.report_type,
        input.report_title,
        input.subject_type,
        input.subject_name,
        input.brand_mode,
        input.visibility,
        JSON.stringify(input.draft_config || {}),
      ]
    );
    return mapRow(result.rows[0]);
  }

  async createRevision(report: any, actorId: string, revisionId: string, executor: any = { query }) {
    await executor.query(
      `INSERT INTO report_draft_revisions (
        revision_id, report_id, tenant_id, organization_id, version,
        snapshot_json, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [revisionId, report.report_id, report.tenant_id, report.organization_id, report.version, JSON.stringify(report), actorId]
    );
  }

  async getDraft(reportId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_drafts
       WHERE report_id = $1 AND tenant_id = $2 AND organization_id = $3
       LIMIT 1`,
      [reportId, scope.tenant_id, scope.organization_id]
    );
    return result.rows[0] ? { ...result.rows[0], ...mapRow(result.rows[0]) } : null;
  }

  async listDrafts(scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_drafts
       WHERE tenant_id = $1 AND organization_id = $2
       ORDER BY updated_at DESC`,
      [scope.tenant_id, scope.organization_id]
    );
    return result.rows.map((row: any) => mapRow(row));
  }

  async listRevisions(reportId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT revision_id, report_id, tenant_id, organization_id, version,
              created_by_user_id, created_at
       FROM report_draft_revisions
       WHERE report_id = $1 AND tenant_id = $2 AND organization_id = $3
       ORDER BY version DESC, created_at DESC, revision_id DESC`,
      [reportId, scope.tenant_id, scope.organization_id]
    );
    return result.rows.map((row: any) => ({
      revisionId: row.revision_id,
      revision_id: row.revision_id,
      reportId: row.report_id,
      report_id: row.report_id,
      tenant_id: row.tenant_id,
      organization_id: row.organization_id,
      version: row.version,
      createdBy: row.created_by_user_id,
      created_by_user_id: row.created_by_user_id,
      createdAt: row.created_at,
      created_at: row.created_at,
    }));
  }

  async updateDraft(reportId: string, scope: any, input: any, expectedVersion: number, executor: any = { query }) {
    const result = await executor.query(
      `UPDATE report_drafts
       SET subject_type = $4, subject_name = $5, brand_mode = $6, visibility = $7,
           draft_config_json = $8::jsonb, updated_by_user_id = $9,
           version = version + 1, updated_at = NOW()
       WHERE report_id = $1 AND tenant_id = $2 AND organization_id = $3
         AND version = $10 AND lifecycle_status = 'draft'
       RETURNING *`,
      [
        reportId,
        scope.tenant_id,
        scope.organization_id,
        input.subject_type,
        input.subject_name,
        input.brand_mode,
        input.visibility,
        JSON.stringify(input.draft_config || {}),
        scope.actor_id,
        expectedVersion,
      ]
    );
    return result.rows[0] ? { ...result.rows[0], ...mapRow(result.rows[0]) } : null;
  }
}
